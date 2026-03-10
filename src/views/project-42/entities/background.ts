/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Background Entity: Procedural Atmospheric Shaders
 * Orchestrates the environment through varying narrative states:
 * 0: Bio-Organic (Microscopic bokeh)
 * 1: Cosmic (Nebula and stardust)
 * 2: Digital Void (Grid and scanlines)
 */

export const createBackground = (THREE: any) => {
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform float uTime;
    uniform float uProgress;
    uniform float uOpacity;
    uniform float uMode; 
    varying vec2 vUv;

    // Deterministic pseudo-random generation for particle dust
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    void main() {
      vec2 uv = vUv - 0.5;
      
      // Secondary lighting bias (Global light direction)
      float rightGlow = pow(max(0.0, vUv.x * 1.1 - 0.1), 2.5) * 0.5;
      vec3 cosmicBlue = vec3(0.05, 0.3, 0.6); 
      
      // Mode 0: Bio-Organic (Biological Era)
      vec3 bioBg = vec3(0.002, 0.005, 0.012); 
      float bokeh = 0.0;
      for(float i=1.0; i<6.0; i++) {
          vec2 p = uv + vec2(sin(uTime * 0.1 * i), cos(uTime * 0.08 * i)) * 0.4;
          bokeh += smoothstep(0.4, 0.0, length(p) * (0.6 + i * 0.3)) * 0.1;
      }
      vec3 bioColor = bioBg + bokeh + (cosmicBlue * rightGlow * 0.3);

      // Mode 1: Cosmic (Deep Space transition)
      vec3 cosmicBg = vec3(0.005, 0.01, 0.02);
      float dust = hash(vUv + uTime * 0.005);
      float drift = sin(uv.x * 3.0 + uTime * 0.05) * cos(uv.y * 3.0 - uTime * 0.05);
      float nebulaMask = pow(vUv.x, 2.0) * (0.5 + drift * 0.5);
      vec3 nebula = cosmicBlue * nebulaMask * 0.7;
      vec3 cosmicColor = cosmicBg + nebula + (cosmicBlue * rightGlow * 0.7) + (dust * 0.02);

      // Mode 2: Digital (Final Informatic Void)
      vec3 digitalBg = vec3(0.0, 0.0, 0.0); 
      float grid = (step(0.995, fract(vUv.x * 80.0)) + step(0.995, fract(vUv.y * 50.0))) * 0.05;
      float scanline = step(0.998, fract(vUv.y * 100.0 + uTime * 0.5)) * 0.05;
      vec3 digitalColor = digitalBg + vec3(grid + scanline) * vec3(0.5, 0.8, 1.0);

      // Linear Interpolation between environmental states
      vec3 finalColor;
      if (uMode < 1.0) {
        finalColor = mix(bioColor, cosmicColor, smoothstep(0.0, 1.0, uMode));
      } else {
        finalColor = mix(cosmicColor, digitalColor, smoothstep(1.0, 2.0, uMode));
      }
      
      gl_FragColor = vec4(finalColor, uOpacity);
    }
  `

  const geometry = new THREE.PlaneGeometry(160, 100)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uOpacity: { value: 0 },
      uMode: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.z = -15
  return mesh
}
