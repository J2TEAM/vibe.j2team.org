/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Stardust Factory - Particle System Core
 * Generates a resilient system of 10,000 particle crystals with custom shaders
 * for cinematic flickering and atmospheric pulsing.
 */
export function createStardust(THREE: any, particlesCount: number) {
  const originalPositions = new Float32Array(particlesCount * 3)
  const currentPositions = new Float32Array(particlesCount * 3)
  const colors = new Float32Array(particlesCount * 3)
  const sizes = new Float32Array(particlesCount)
  const brightness = new Float32Array(particlesCount)

  // Initialize particles in a spherical distribution
  for (let i = 0; i < particlesCount; i++) {
    const radius = Math.random() * 40
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)

    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta)
    const z = radius * Math.cos(phi)

    originalPositions[i * 3] = x
    originalPositions[i * 3 + 1] = y
    originalPositions[i * 3 + 2] = z

    currentPositions[i * 3] = x
    currentPositions[i * 3 + 1] = y
    currentPositions[i * 3 + 2] = z

    // Default: Cinematic White spectrum
    colors[i * 3] = 1.0
    colors[i * 3 + 1] = 1.0
    colors[i * 3 + 2] = 1.0

    sizes[i] = 0.5 + Math.pow(Math.random(), 3.0) * 7.0
    brightness[i] = 0.5 + Math.random() * 0.5
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
    },
    vertexShader: `
      attribute float aSize;
      attribute float aBrightness;
      attribute vec3 aColor;
      varying float vBrightness;
      varying vec3 vColor;
      uniform float uTime;
      void main() {
        vBrightness = aBrightness;
        vColor = aColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
        // High-frequency star flickering
        float flicker = 1.0 + sin(uTime * 20.0 + position.x) * 0.1;
        gl_PointSize = 90.0 * aSize * flicker * (1.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vBrightness;
      varying vec3 vColor;
      uniform float uOpacity;
      uniform float uTime;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        
        // Exponential glow falloff for organic grain
        float glowArea = exp(-dist * 12.0);
        
        // Low-frequency atmospheric pulse
        float pulse = 0.8 + 0.2 * sin(uTime * 1.5);
        
        gl_FragColor = vec4(vColor, glowArea * uOpacity * vBrightness * pulse);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  })

  const points = new THREE.Points(geometry, material)
  points.renderOrder = 10

  return { points, originalPositions }
}
