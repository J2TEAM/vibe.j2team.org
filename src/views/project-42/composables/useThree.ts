/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref } from 'vue'
import { prologueScene } from '../scenes/prologue'
import { bigBangScene } from '../scenes/bigbang'
import { earthScene } from '../scenes/earth'
import { dnaScene } from '../scenes/dna'
import { dnaToAtgcScene } from '../scenes/dnaToAtgc'
import { atgcScene } from '../scenes/atgc'
import { matrixScene } from '../scenes/matrix'
import { cubeScene } from '../scenes/cube'
import { digitalDnaScene } from '../scenes/digitalDna'
import { collisionScene } from '../scenes/collision'
import { hybridScene } from '../scenes/hybrid'
import { catScene } from '../scenes/cat'
import { SCENES } from '../scenes/config'
import { sampleCatPositions } from '../utils/catSampler'
import { createStardust } from '../entities/stardust'
import { createEarth } from '../entities/earth'
import { createBackground } from '../entities/background'

export function useThree() {
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const isLoading = ref(true)
  const loadingProgress = ref(0)
  const currentScene = ref(0)
  const scrollProgress = ref(0)

  // Three.js & Engine State
  let THREE: any = null
  let gsap: any = null
  let scene: any = null
  let camera: any = null
  let renderer: any = null
  let points: any = null
  let earth: any = null
  let bioPlane: any = null
  let frameId: number = 0

  let particlesCount = 10000
  let _originalPositions: Float32Array | null = null
  let catTargets: Float32Array | null = null
  let touchStartY = 0

  const init = async () => {
    try {
      // Detect mobile for performance optimization
      const isMobile =
        window.innerWidth < 768 ||
        (window.innerHeight > window.innerWidth && window.innerWidth < 1024)
      particlesCount = isMobile ? 3000 : 10000

      let targetProgress = 0
      const smoothProgress = setInterval(() => {
        if (loadingProgress.value < targetProgress) {
          // Jittery increase
          const jump = Math.random() * 2 + 1
          loadingProgress.value = Math.min(targetProgress, loadingProgress.value + jump)
        } else if (loadingProgress.value < 98) {
          // Slow passive crawl while waiting for assets
          loadingProgress.value += Math.random() * 0.1
        }
      }, 50)

      targetProgress = 15
      // @ts-expect-error - Dynamic import from CDN
      THREE = await import('https://esm.sh/three@0.174.0')
      targetProgress = 35

      // @ts-expect-error - Dynamic import from CDN
      const gsapModule = await import('https://esm.sh/gsap@3.12.5')
      gsap = gsapModule.gsap
      targetProgress = 55

      if (!canvasRef.value || !THREE || !gsap) return

      scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0f1923)
      scene.fog = new THREE.FogExp2(0x0f1923, 0.04)
      targetProgress = 65

      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      updateCameraDistance()

      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true, alpha: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      targetProgress = 75

      const stardust = createStardust(THREE, particlesCount)
      points = stardust.points
      _originalPositions = stardust.originalPositions
      scene.add(points)
      targetProgress = 85

      earth = createEarth(THREE)
      scene.add(earth)
      targetProgress = 92

      bioPlane = createBackground(THREE)
      scene.add(bioPlane)

      // Final Secret: Sample Cat Silhouette (Local Asset)
      const catSvgUrl = new URL('../assets/cat-simplified.svg', import.meta.url).href
      sampleCatPositions(catSvgUrl, particlesCount).then((targets) => {
        catTargets = targets
      })

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.05)
      scene.add(ambientLight)
      const sunLight = new THREE.DirectionalLight(0xffffff, 4.5)
      sunLight.position.set(40, 15, 10)
      scene.add(sunLight)

      // Final Wiring
      window.addEventListener('wheel', (e) => updateProgress(e.deltaY), { passive: true })
      window.addEventListener('touchstart', handleTouchStart, { passive: true })
      window.addEventListener('touchmove', handleTouchMove, { passive: true })
      window.addEventListener('resize', handleResize)

      animate()

      // Final Burst to 100%
      clearInterval(smoothProgress)
      loadingProgress.value = 100
    } catch (e) {
      console.error('Core Init Failed:', e)
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    const firstTouch = e.touches[0]
    if (firstTouch) touchStartY = firstTouch.clientY
  }

  const handleTouchMove = (e: TouchEvent) => {
    const firstTouch = e.touches[0]
    if (firstTouch) {
      const delta = (touchStartY - firstTouch.clientY) * 1.5
      updateProgress(delta)
      touchStartY = firstTouch.clientY
    }
  }

  const updateCameraDistance = () => {
    if (!camera) return
    const ratio = window.innerWidth / window.innerHeight
    const isPortrait = ratio < 1.0

    if (isPortrait) {
      camera.fov = 75 + (1 - ratio) * 20
      camera.position.z = 15 + (1 - ratio) * 12
    } else {
      camera.fov = 75
      camera.position.z = 15
    }
    camera.updateProjectionMatrix()
  }

  const updateProgress = (delta: number) => {
    if (isLoading.value) return
    // Strictly block upward scrolling (only allow progress to increase)
    if (delta <= 0) return
    scrollProgress.value = Math.max(0, scrollProgress.value + delta * 0.002)

    let activeIdx = 0
    if (SCENES && SCENES.length > 0) {
      for (let i = SCENES.length - 1; i >= 0; i--) {
        const sceneItem = SCENES[i]
        if (sceneItem && scrollProgress.value >= sceneItem.threshold) {
          activeIdx = i
          break
        }
      }
    }
    currentScene.value = activeIdx

    if (points?.material?.uniforms && gsap) {
      const targetOpacity = currentScene.value === 0 ? 0 : 0.5
      gsap.to(points.material.uniforms.uOpacity, {
        value: targetOpacity,
        duration: 2,
        overwrite: 'auto',
      })

      const isBioScene = scrollProgress.value >= 33.0 // Started Earth
      const isCosmosPhase = scrollProgress.value >= 67.0 // After DNA Helix Formation
      const isVoidPhase = scrollProgress.value >= 1260.0 // Total void before cat morph finale

      // Background Color
      const bgClr =
        isBioScene && !isCosmosPhase ? { r: 0.002, g: 0.002, b: 0.005 } : { r: 0, g: 0, b: 0 }

      if (bioPlane && bioPlane.material.uniforms) {
        bioPlane.material.uniforms.uProgress.value = scrollProgress.value

        // Mode: 0 (Bio), 1 (Cosmos), 2 (Digital)
        let targetMode = 0.0
        if (scrollProgress.value >= 67.0 && scrollProgress.value < 210.0) targetMode = 1.0
        else if (scrollProgress.value >= 210.0) targetMode = 2.0

        gsap.to(bioPlane.material.uniforms.uMode, {
          value: targetMode,
          duration: 3.5, // Smooth cinematic transition
          overwrite: 'auto',
        })

        const isVisible = isBioScene && !isVoidPhase

        gsap.to(bioPlane.material.uniforms.uOpacity, {
          value: isVisible ? 0.65 : 0,
          duration: 2.0,
          overwrite: 'auto',
        })
      }

      gsap.to(scene.background, {
        r: bgClr.r,
        g: bgClr.g,
        b: bgClr.b,
        duration: 2.5,
        overwrite: 'auto',
      })
      if (scene.fog) {
        gsap.to(scene.fog.color, {
          r: bgClr.r,
          g: bgClr.g,
          b: bgClr.b,
          duration: 2.5,
          overwrite: 'auto',
        })
      }
    }
  }

  const animate = () => {
    if (!points || !renderer || !camera) return
    const posAttr = points.geometry.attributes.position
    if (!posAttr) return

    const positions = posAttr.array as Float32Array
    const time = Date.now() * 0.0005
    if (points.material.uniforms) points.material.uniforms.uTime.value = time

    // Robust Earth Visibility Cleanup (Fix for fast-scrolling frame skips)
    if (earth && gsap) {
      if (scrollProgress.value < 32.0 || scrollProgress.value >= 56.0) {
        if (earth.material.opacity > 0) {
          earth.material.opacity = 0
          const clouds = earth.children.find((c: any) => c.name === 'clouds')
          if (clouds) clouds.material.opacity = 0
          const atmosphere = earth.children.find((c: any) => c.name === 'atmosphere')
          if (atmosphere && atmosphere.material.uniforms) {
            atmosphere.material.uniforms.uIntensity.value = 0
          }
        }
      }
    }

    if (scrollProgress.value < 17.0) {
      prologueScene.update(positions, particlesCount, time, scrollProgress.value)
    } else if (scrollProgress.value < 33.0) {
      bigBangScene.update(positions, particlesCount, time, scrollProgress.value)
    }

    // Earth Lifecycle
    if (scrollProgress.value >= 33.0 && scrollProgress.value < 56.0) {
      earthScene.update(positions, particlesCount, time, scrollProgress.value, earth, gsap)
    }

    // Evolution Sequence
    if (scrollProgress.value >= 56.0 && scrollProgress.value < 95.0) {
      dnaScene.update(positions, particlesCount, time, scrollProgress.value, earth, gsap, points)
    } else if (scrollProgress.value >= 95.0 && scrollProgress.value < 145.0) {
      dnaToAtgcScene.update(positions, particlesCount, time, scrollProgress.value, points)
    } else if (scrollProgress.value >= 145.0 && scrollProgress.value < 260.0) {
      atgcScene.update(positions, particlesCount, time, scrollProgress.value, points)
    } else if (scrollProgress.value >= 260.0 && scrollProgress.value < 345.0) {
      matrixScene.update(positions, particlesCount, time, scrollProgress.value, points)
    } else if (scrollProgress.value >= 345.0 && scrollProgress.value < 405.0) {
      cubeScene.update(positions, particlesCount, time, scrollProgress.value, points)
    } else if (scrollProgress.value >= 405.0 && scrollProgress.value < 510.0) {
      digitalDnaScene.update(positions, particlesCount, time, scrollProgress.value, points)
    } else if (scrollProgress.value >= 510.0 && scrollProgress.value < 585.0) {
      collisionScene.update(positions, particlesCount, time, scrollProgress.value, points)
    } else if (scrollProgress.value >= 585.0 && scrollProgress.value < 1320.0) {
      hybridScene.update(positions, particlesCount, time, scrollProgress.value, points)
    } else if (scrollProgress.value >= 1320.0) {
      catScene.update(positions, particlesCount, time, scrollProgress.value, catTargets, points)
    }

    posAttr.needsUpdate = true

    if (scrollProgress.value >= 17.0 && scrollProgress.value < 61.0) {
      points.rotation.y += 0.0004
    } else if (scrollProgress.value >= 61.0) {
      points.rotation.y *= 0.98
    }

    renderer.render(scene, camera)
    frameId = requestAnimationFrame(animate)
  }

  const handleResize = () => {
    if (!camera || !renderer) return
    camera.aspect = window.innerWidth / window.innerHeight
    updateCameraDistance()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  const cleanup = () => {
    cancelAnimationFrame(frameId)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('wheel', updateProgress as any)
    window.removeEventListener('touchstart', handleTouchStart as any)
    window.removeEventListener('touchmove', handleTouchMove as any)
    if (renderer) renderer.dispose()
  }

  return { canvasRef, isLoading, loadingProgress, currentScene, scrollProgress, init, cleanup }
}
