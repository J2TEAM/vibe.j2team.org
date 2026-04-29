<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useMouse, useWindowSize, useRafFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'

// --- SHADERS ---
const baseVertexShader = `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`

const splatShader = `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspect;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspect;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`

const advectionShader = `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;

    void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
    }
`

const divergenceShader = `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`

const pressureShader = `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).y;
        float B = texture2D(uPressure, vB).y;
        float div = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - div) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`

const gradientSubtractShader = `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).y;
        float B = texture2D(uPressure, vB).y;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B) * 0.5;
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`

const displayShader = `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        vec3 color = texture2D(uTexture, vUv).rgb;
        gl_FragColor = vec4(color, 1.0);
    }
`

// --- UTILS ---
function createShader(gl: WebGLRenderingContext, source: string, type: number) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
    const vs = createShader(gl, vsSource, gl.VERTEX_SHADER)
    const fs = createShader(gl, fsSource, gl.FRAGMENT_SHADER)
    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    return program
}

// --- STATE ---
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const { x, y } = useMouse()
const { width, height } = useWindowSize()
const isAuto = ref(true)

interface ProgramInfo {
    program: WebGLProgram
    uniforms: Record<string, WebGLUniformLocation | null>
}

let gl: WebGLRenderingContext
const programs: Record<string, ProgramInfo> = {}
let density: { read: { fbo: WebGLFramebuffer, texture: WebGLTexture, width: number, height: number }, write: { fbo: WebGLFramebuffer, texture: WebGLTexture, width: number, height: number }, swap: () => void }
let velocity: { read: { fbo: WebGLFramebuffer, texture: WebGLTexture, width: number, height: number }, write: { fbo: WebGLFramebuffer, texture: WebGLTexture, width: number, height: number }, swap: () => void }
let pressure: { read: { fbo: WebGLFramebuffer, texture: WebGLTexture, width: number, height: number }, write: { fbo: WebGLFramebuffer, texture: WebGLTexture, width: number, height: number }, swap: () => void }
let divergence: { fbo: WebGLFramebuffer, texture: WebGLTexture, width: number, height: number }
let quadBuffer: WebGLBuffer

const colors = [
    [1.0, 0.42, 0.29], // Coral: rgb(255, 107, 74)
    [0.22, 0.74, 0.97], // Sky: rgb(56, 189, 248)
    [1.0, 0.72, 0.19], // Amber: rgb(255, 184, 48)
]

function initGL() {
    if (!canvasRef.value) return
    gl = canvasRef.value.getContext('webgl', { alpha: false, depth: false })!
    if (!gl) return

    const texType = gl.getExtension('OES_texture_half_float') 
        ? gl.getExtension('OES_texture_half_float')!.HALF_FLOAT_OES
        : gl.UNSIGNED_BYTE
    
    gl.getExtension('OES_texture_half_float_linear')
    gl.getExtension('OES_texture_float')
    gl.getExtension('OES_texture_float_linear')

    function createFBO(w: number, h: number, internalFormat: number, format: number, type: number, filter: number) {
        gl.activeTexture(gl.TEXTURE0)
        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null)

        const fbo = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
        gl.viewport(0, 0, w, h)
        gl.clear(gl.COLOR_BUFFER_BIT)

        return { texture, fbo, width: w, height: h }
    }

    function createDoubleFBO(w: number, h: number, internalFormat: number, format: number, type: number, filter: number) {
        let fbo1 = createFBO(w, h, internalFormat, format, type, filter)
        let fbo2 = createFBO(w, h, internalFormat, format, type, filter)
        return {
            get read() { return fbo1 },
            get write() { return fbo2 },
            swap() { [fbo1, fbo2] = [fbo2, fbo1] }
        }
    }

    const simRes = 256
    density = createDoubleFBO(simRes, simRes, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, gl.LINEAR)
    velocity = createDoubleFBO(simRes, simRes, gl.RGBA, gl.RGBA, texType, gl.LINEAR)
    pressure = createDoubleFBO(simRes, simRes, gl.RGBA, gl.RGBA, texType, gl.NEAREST)
    divergence = createFBO(simRes, simRes, gl.RGBA, gl.RGBA, texType, gl.NEAREST)

    const list = {
        splat: splatShader,
        advection: advectionShader,
        divergence: divergenceShader,
        pressure: pressureShader,
        gradientSubtract: gradientSubtractShader,
        display: displayShader
    }

    for (const name in list) {
        const prog = createProgram(gl, baseVertexShader, (list as Record<string, string>)[name]!)
        const uniforms: Record<string, WebGLUniformLocation | null> = {}
        const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS)
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(prog, i)!
            uniforms[info.name] = gl.getUniformLocation(prog, info.name)
        }
        programs[name] = { program: prog, uniforms }
    }

    quadBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW)
}

function renderQuad() {
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    const pos = gl.getAttribLocation(programs.display!.program, 'aPosition')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
}

let lastX = 0
let lastY = 0

function splat(px: number, py: number, dx: number, dy: number, color: number[]) {
    gl.viewport(0, 0, density.read.width, density.read.height)
    
    // Splat Velocity
    gl.useProgram(programs.splat!.program)
    gl.uniform1f(programs.splat!.uniforms.aspect!, width.value / height.value)
    gl.uniform2f(programs.splat!.uniforms.point!, px / width.value, 1.0 - py / height.value)
    gl.uniform3f(programs.splat!.uniforms.color!, dx * 10.0, -dy * 10.0, 1.0)
    gl.uniform1f(programs.splat!.uniforms.radius!, 0.0001)
    gl.uniform1i(programs.splat!.uniforms.uTarget!, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo)
    renderQuad()
    velocity.swap()

    // Splat Density
    gl.uniform3f(programs.splat!.uniforms.color!, color[0]!, color[1]!, color[2]!)
    gl.bindTexture(gl.TEXTURE_2D, density.read.texture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, density.write.fbo)
    renderQuad()
    density.swap()
}

useRafFn((time) => {
    if (!gl) return

    const dt = 0.016
    const simRes = 256
    const dx = x.value - lastX
    const dy = y.value - lastY
    
    if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        isAuto.value = false
        const color = colors[Math.floor(time.timestamp / 2000) % 3]!
        splat(x.value, y.value, dx, dy, color)
    } else if (isAuto.value) {
        // Auto splats
        const t = time.timestamp * 0.001
        for (let i = 0; i < 2; i++) {
          const ax = width.value * (0.5 + 0.3 * Math.cos(t * (1 + i * 0.5)))
          const ay = height.value * (0.5 + 0.3 * Math.sin(t * (1.2 + i * 0.3)))
          const adx = Math.cos(t * 2) * 5
          const ady = Math.sin(t * 2.5) * 5
          splat(ax, ay, adx, ady, colors[i % 3]!)
        }
    }
    
    lastX = x.value
    lastY = y.value

    gl.viewport(0, 0, simRes, simRes)

    // Advection
    gl.useProgram(programs.advection!.program)
    gl.uniform2f(programs.advection!.uniforms.texelSize!, 1.0 / simRes, 1.0 / simRes)
    gl.uniform1f(programs.advection!.uniforms.dt!, dt)
    gl.uniform1f(programs.advection!.uniforms.dissipation!, 0.98) // Velocity dissipation
    gl.uniform1i(programs.advection!.uniforms.uVelocity!, 0)
    gl.uniform1i(programs.advection!.uniforms.uSource!, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo)
    renderQuad()
    velocity.swap()

    gl.uniform1f(programs.advection!.uniforms.dissipation!, 0.99) // Density dissipation
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture) // Advect by velocity
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, density.read.texture) // Advect density source
    gl.uniform1i(programs.advection!.uniforms.uSource!, 1)
    gl.bindFramebuffer(gl.FRAMEBUFFER, density.write.fbo)
    renderQuad()
    density.swap()

    // Divergence
    gl.useProgram(programs.divergence!.program)
    gl.uniform2f(programs.divergence!.uniforms.texelSize!, 1.0 / simRes, 1.0 / simRes)
    gl.uniform1i(programs.divergence!.uniforms.uVelocity!, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, divergence.fbo)
    renderQuad()

    // Pressure
    gl.useProgram(programs.pressure!.program)
    gl.uniform2f(programs.pressure!.uniforms.texelSize!, 1.0 / simRes, 1.0 / simRes)
    gl.uniform1i(programs.pressure!.uniforms.uDivergence!, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, divergence.texture)
    for (let i = 0; i < 20; i++) {
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture)
        gl.uniform1i(programs.pressure!.uniforms.uPressure!, 1)
        gl.bindFramebuffer(gl.FRAMEBUFFER, pressure.write.fbo)
        renderQuad()
        pressure.swap()
    }

    // Gradient Subtract
    gl.useProgram(programs.gradientSubtract!.program)
    gl.uniform2f(programs.gradientSubtract!.uniforms.texelSize!, 1.0 / simRes, 1.0 / simRes)
    gl.uniform1i(programs.gradientSubtract!.uniforms.uPressure!, 0)
    gl.uniform1i(programs.gradientSubtract!.uniforms.uVelocity!, 1)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, pressure.read.texture)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, velocity.read.texture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.write.fbo)
    renderQuad()
    velocity.swap()

    // Display
    gl.viewport(0, 0, width.value, height.value)
    gl.useProgram(programs.display!.program)
    gl.uniform1i(programs.display!.uniforms.uTexture!, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, density.read.texture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    renderQuad()
})

onMounted(() => {
    initGL()
})

watch([width, height], () => {
  if (canvasRef.value) {
    canvasRef.value.width = width.value
    canvasRef.value.height = height.value
  }
})
</script>

<template>
  <div ref="containerRef" class="relative min-h-screen w-full overflow-hidden bg-[#0F1923]">
    <!-- UI Overlay -->
    <div class="pointer-events-none absolute inset-0 z-10 flex flex-col p-8 md:p-12">
      <!-- Header -->
      <div class="flex items-center gap-4 animate-fade-up">
        <div class="h-12 w-1.5 bg-accent-coral" />
        <div>
          <h1 class="font-display text-4xl font-bold tracking-tight text-text-primary md:text-6xl uppercase">
            Vibe Fluid
          </h1>
          <p class="font-display text-sm tracking-widest text-accent-sky uppercase">
            // Nghệ thuật dòng chảy sáng tạo
          </p>
          <a 
            href="https://www.facebook.com/nmdung.dev" 
            target="_blank"
            rel="noopener noreferrer"
            class="pointer-events-auto mt-1 block font-display text-[10px] font-bold tracking-[0.2em] text-text-dim uppercase transition-colors hover:text-accent-coral"
          >
            By nmdung.dev
          </a>
        </div>
      </div>

      <!-- Instruction -->
      <div class="mt-auto animate-fade-up animate-delay-5">
        <div class="flex items-center gap-3 text-text-secondary">
          <Icon icon="lucide:mouse-pointer-2" class="size-5 text-accent-amber" />
          <p class="text-sm font-medium tracking-wide">
            DI CHUYỂN CHUỘT ĐỂ TƯƠNG TÁC VỚI DÒNG CHẢY
          </p>
        </div>
        <div class="mt-4 flex gap-4">
           <div class="px-3 py-1 bg-bg-surface border border-border-default text-[10px] text-text-dim uppercase tracking-tighter">
             GLSL Simulation / Navier-Stokes
           </div>
           <div class="px-3 py-1 bg-bg-surface border border-border-default text-[10px] text-text-dim uppercase tracking-tighter">
             Resolution: 256x256 / Jacobi: 20
           </div>
        </div>
      </div>
    </div>

    <!-- Background ORDINAL -->
    <span class="pointer-events-none absolute right-12 top-12 z-0 font-display text-[20rem] font-bold leading-none text-white/[0.02] select-none">
      01
    </span>

    <!-- Canvas -->
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      class="h-full w-full cursor-none"
    />

    <!-- Back to home -->
    <RouterLink
      to="/"
      class="group absolute bottom-8 right-8 z-20 flex items-center gap-3 border border-border-default bg-bg-surface px-6 py-3 transition-all hover:border-accent-coral hover:bg-bg-elevated"
    >
      <Icon icon="lucide:arrow-left" class="size-5 transition-transform group-hover:-translate-x-1" />
      <span class="font-display text-sm font-bold tracking-widest text-text-primary uppercase">QUAY LẠI</span>
    </RouterLink>

    <!-- Auto toggle -->
    <button
      @click="isAuto = !isAuto"
      class="absolute top-8 right-8 z-20 flex h-12 w-12 items-center justify-center border border-border-default bg-bg-surface transition-all hover:border-accent-sky hover:bg-bg-elevated"
      :title="isAuto ? 'Tắt chế độ tự động' : 'Bật chế độ tự động'"
    >
      <Icon :icon="isAuto ? 'lucide:play' : 'lucide:pause'" class="size-6 text-accent-sky" :class="{ 'animate-pulse': isAuto }" />
    </button>
  </div>
</template>

<style scoped>
.cursor-none {
  cursor: crosshair;
}
</style>
