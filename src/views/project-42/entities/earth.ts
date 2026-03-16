/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Earth Factory - Planetary Rendering Engine
 * Constructs a multi-layered, cinematic Earth model using spherical geometry
 * and custom shaders for atmospheric scattering effects.
 */
export function createEarth(THREE: any) {
  const textureLoader = new THREE.TextureLoader()
  const earthTexture = textureLoader.load(new URL('../assets/earth.png', import.meta.url).href)
  const cloudTexture = textureLoader.load(new URL('../assets/clouds.png', import.meta.url).href)

  // --- Layer 1: Planetary Surface (Base Mesh) ---
  const earthGeo = new THREE.SphereGeometry(6.5, 128, 128)
  const earthMat = new THREE.MeshStandardMaterial({
    map: earthTexture,
    transparent: true,
    opacity: 0,
    roughness: 0.8,
    metalness: 0.1,
    color: new THREE.Color(0xffffff),
  })
  const earth = new THREE.Mesh(earthGeo, earthMat)
  earth.rotation.y = Math.PI * 1.5

  // --- Layer 2: Meteorological Clouds (Secondary Mesh) ---
  const cloudGeo = new THREE.SphereGeometry(6.6, 128, 128)
  const cloudMat = new THREE.MeshStandardMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0,
    color: new THREE.Color(0xffffff),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const clouds = new THREE.Mesh(cloudGeo, cloudMat)
  clouds.name = 'clouds'
  earth.add(clouds)

  // --- Layer 3: Atmospheric Scattering (Custom Shader Mesh) ---
  // Implements a Fresnel-based rim light and light-biased glow.
  const atmosphereGeo = new THREE.SphereGeometry(6.75, 128, 128)
  const atmosphereMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    uniforms: {
      uColor: { value: new THREE.Color(0x0ea5e9) },
      uIntensity: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform float uIntensity;
      uniform vec3 uColor;
      void main() {
        // Fresnel factor for planetary depth
        float intensity = pow(0.8 - dot(vNormal, vec3(-0.5, 0.0, 1.0)), 6.0);
        
        // Directional Rim Light (Aware of Light-Source on Right)
        float rim = pow(max(0.0, dot(vNormal, vec3(0.8, 0.2, 0.5))), 4.0);
        
        float finalGlow = (intensity + rim * 0.6) * uIntensity;
        gl_FragColor = vec4(uColor, finalGlow);
      }
    `,
  })
  const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat)
  atmosphere.name = 'atmosphere'
  earth.add(atmosphere)

  return earth
}
