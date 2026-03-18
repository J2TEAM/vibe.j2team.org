<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef } from 'vue'

const starsRef = useTemplateRef<HTMLDivElement>('starsRef')
const containerRef = useTemplateRef<HTMLDivElement>('containerRef')
let shootingStarInterval: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  const starsContainer = starsRef.value
  if (starsContainer) {
    for (let i = 0; i < 200; i++) {
      const star = document.createElement('div')
      star.className = 'star'
      const size = Math.random() * 2 + 1
      star.style.width = `${size}px`
      star.style.height = `${size}px`
      star.style.left = `${Math.random() * 100}%`
      star.style.top = `${Math.random() * 100}%`
      star.style.animationDelay = `${Math.random() * 3}s`
      starsContainer.appendChild(star)
    }
  }

  shootingStarInterval = setInterval(() => {
    const container = containerRef.value
    if (!container) return
    const shootingStar = document.createElement('div')
    shootingStar.className = 'shooting-star'
    shootingStar.style.top = `${Math.random() * 80}%`
    shootingStar.style.animationDuration = `${Math.random() * 3 + 2}s`
    container.appendChild(shootingStar)
    setTimeout(() => {
      shootingStar.remove()
    }, 5000)
  }, 4000)
})

onUnmounted(() => {
  clearInterval(shootingStarInterval)
})
</script>

<template>
  <div ref="containerRef" class="container-bg fixed top-0 left-0 z-0">
    <div ref="starsRef" class="stars"></div>

    <!-- Planets -->
    <div
      class="planet"
      style="
        left: 20%;
        top: 30%;
        background: radial-gradient(circle at 30% 30%, #152841, #0b1e34);
        animation-duration: 45s;
      "
    ></div>
    <div
      class="planet"
      style="
        right: 40%;
        top: 60%;
        background: radial-gradient(circle at 30% 30%, #1f4f8f, #1f5e94);
        animation-duration: 75s;
      "
    ></div>
    <div
      class="planet"
      style="
        left: 65%;
        top: 15%;
        background: radial-gradient(circle at 30% 30%, #88bcd8, #4f8ac4);
        animation-duration: 60s;
      "
    ></div>

    <!-- Shooting Stars -->
    <div class="shooting-star" style="top: 20%; animation-delay: 1s"></div>
    <div class="shooting-star" style="top: 50%; animation-delay: 3s"></div>
    <div class="shooting-star" style="top: 70%; animation-delay: 5s"></div>
    <div class="shooting-star" style="top: 90%; animation-delay: 7s"></div>
    <div class="shooting-star" style="top: 150%; animation-delay: 4s"></div>

    <!-- Constellations -->
    <svg
      class="constellation"
      style="left: 20%; top: 25%; width: 150px; height: 150px"
      viewBox="0 0 100 100"
    >
      <circle cx="20" cy="20" r="1.5" fill="white" />
      <circle cx="40" cy="40" r="1.5" fill="white" />
      <circle cx="70" cy="30" r="1.5" fill="white" />
      <circle cx="60" cy="70" r="1.5" fill="white" />
      <circle cx="30" cy="80" r="1.5" fill="white" />
      <line x1="20" y1="20" x2="40" y2="40" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
      <line x1="40" y1="40" x2="70" y2="30" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
      <line x1="70" y1="30" x2="60" y2="70" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
      <line x1="60" y1="70" x2="30" y2="80" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
      <line x1="30" y1="80" x2="20" y2="20" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
    </svg>

    <svg
      class="constellation"
      style="right: 20%; top: 65%; width: 120px; height: 120px"
      viewBox="0 0 100 100"
    >
      <circle cx="10" cy="50" r="1.5" fill="white" />
      <circle cx="30" cy="30" r="1.5" fill="white" />
      <circle cx="60" cy="25" r="1.5" fill="white" />
      <circle cx="85" cy="50" r="1.5" fill="white" />
      <circle cx="60" cy="75" r="1.5" fill="white" />
      <circle cx="30" cy="70" r="1.5" fill="white" />
      <line x1="10" y1="50" x2="30" y2="30" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
      <line x1="30" y1="30" x2="60" y2="25" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
      <line x1="60" y1="25" x2="85" y2="50" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
      <line x1="85" y1="50" x2="60" y2="75" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
      <line x1="60" y1="75" x2="30" y2="70" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
      <line x1="30" y1="70" x2="10" y2="50" stroke="rgba(255,255,255,0.3)" stroke-width="0.5" />
    </svg>
  </div>
</template>

<style scoped>
.container-bg {
  position: fixed;
  z-index: -10;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(125deg, #000000, #050f1b, #010e20);
}

.stars {
  position: absolute;
  width: 100%;
  height: 100%;
}

.star {
  position: absolute;
  background-color: white;
  border-radius: 50%;
  animation: twinkle 3s infinite ease-in-out;
}

.constellation {
  position: absolute;
  opacity: 0.7;
  animation: float 30s infinite linear;
}

.planet {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  animation: rotate 60s infinite linear;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.zodiac {
  position: absolute;
  width: 50px;
  height: 50px;
  animation: pulse 4s infinite ease-in-out;
  opacity: 0.8;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.7));
}

.shooting-star {
  position: absolute;
  width: 3px;
  height: 3px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
  transform: rotate(45deg);
  animation: shoot 4s linear infinite;
  opacity: 0;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.2;
  }

  50% {
    opacity: 1;
  }
}

@keyframes float {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }

  50% {
    transform: translate(20px, 20px) rotate(180deg);
  }

  100% {
    transform: translate(0, 0) rotate(360deg);
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

@keyframes shoot {
  0% {
    transform: translateX(-100px) translateY(100px) rotate(45deg);
    opacity: 1;
  }

  70% {
    opacity: 1;
  }

  100% {
    transform: translateX(calc(100vw + 100px)) translateY(calc(-100vh - 100px)) rotate(45deg);
    opacity: 0;
  }
}

@keyframes expand {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.2;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
}

.title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  text-align: center;
  z-index: 10;
  letter-spacing: 3px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
}
</style>
