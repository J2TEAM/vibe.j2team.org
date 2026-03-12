<template>
  <div class="card-container">
    <div class="card">
      <slot name="default" />
      <div class="card-bg">
        <div class="pattern"></div>
        <div class="stars-container" id="stars"></div>

        <!-- Constellations -->
        <svg class="constellation" viewBox="0 0 100 100" preserveAspectRatio="none">
          <!-- Major constellation pattern -->
          <circle cx="30" cy="20" r="0.7" fill="#c9a959" />
          <circle cx="45" cy="30" r="0.5" fill="#c9a959" />
          <circle cx="25" cy="40" r="0.6" fill="#c9a959" />
          <circle cx="50" cy="55" r="0.8" fill="#c9a959" />
          <circle cx="70" cy="35" r="0.5" fill="#c9a959" />
          <circle cx="75" cy="65" r="0.6" fill="#c9a959" />
          <circle cx="35" cy="75" r="0.7" fill="#c9a959" />

          <line x1="30" y1="20" x2="45" y2="30" stroke="#c9a959" stroke-width="0.2" />
          <line x1="45" y1="30" x2="25" y2="40" stroke="#c9a959" stroke-width="0.2" />
          <line x1="25" y1="40" x2="50" y2="55" stroke="#c9a959" stroke-width="0.2" />
          <line x1="50" y1="55" x2="70" y2="35" stroke="#c9a959" stroke-width="0.2" />
          <line x1="70" y1="35" x2="75" y2="65" stroke="#c9a959" stroke-width="0.2" />
          <line x1="75" y1="65" x2="35" y2="75" stroke="#c9a959" stroke-width="0.2" />
          <line x1="35" y1="75" x2="30" y2="20" stroke="#c9a959" stroke-width="0.2" />

          <!-- Minor constellation pattern -->
          <circle cx="15" cy="60" r="0.4" fill="#c9a959" />
          <circle cx="20" cy="80" r="0.5" fill="#c9a959" />
          <circle cx="60" cy="15" r="0.4" fill="#c9a959" />
          <circle cx="80" cy="25" r="0.5" fill="#c9a959" />
          <circle cx="85" cy="80" r="0.4" fill="#c9a959" />

          <line x1="15" y1="60" x2="20" y2="80" stroke="#c9a959" stroke-width="0.1" />
          <line x1="60" y1="15" x2="80" y2="25" stroke="#c9a959" stroke-width="0.1" />
        </svg>

        <div class="moving-particles" id="particles"></div>

        <div class="gold-frame"></div>
        <div class="inner-frame"></div>

        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>

        <div class="center-emblem"></div>

        <!-- Mystic symbols -->
        <div class="mystic-symbol" style="top: 40px; left: 50%; transform: translateX(-50%)">♠</div>
        <div class="mystic-symbol" style="bottom: 40px; left: 50%; transform: translateX(-50%)">
          ♥
        </div>
        <div class="mystic-symbol" style="top: 50%; left: 40px; transform: translateY(-50%)">♣</div>
        <div class="mystic-symbol" style="top: 50%; right: 40px; transform: translateY(-50%)">
          ♦
        </div>

        <!-- Ornamental elements -->
        <div class="ornament" style="top: 70px; left: 50%; transform: translateX(-50%)">✦</div>
        <div class="ornament" style="bottom: 70px; left: 50%; transform: translateX(-50%)">✦</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
document.addEventListener('DOMContentLoaded', function () {
  const starsContainer = document.getElementById('stars')
  const numStars = 60

  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div')
    star.className = 'star'

    // Random size between 1-3px
    const size = Math.random() * 2 + 1
    star.style.width = `${size}px`
    star.style.height = `${size}px`

    // Random position
    star.style.left = `${Math.random() * 100}%`
    star.style.top = `${Math.random() * 100}%`

    // Random animation delay
    star.style.animationDelay = `${Math.random() * 3}s`

    starsContainer?.appendChild(star)
  }

  // Create moving particles
  const particlesContainer = document.getElementById('particles')
  const numParticles = 10

  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement('div')
    particle.className = 'moving-particle'

    // Random size between 5-15px
    const size = Math.random() * 10 + 5
    particle.style.width = `${size}px`
    particle.style.height = `${size}px`

    // Random position and animation timing
    particle.style.left = `${Math.random() * 100}%`
    particle.style.top = `${Math.random() * 100}%`
    particle.style.animationDelay = `${Math.random() * 20}s`
    particle.style.animationDuration = `${Math.random() * 10 + 15}s`

    particlesContainer?.appendChild(particle)
  }
})
</script>

<style scoped>
.card-container {
  width: 320px;
  height: 540px;
  position: relative;
  perspective: 1000px;
}

.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 15px;
  overflow: hidden;
  background: linear-gradient(135deg, #061228, #121f39);
}

.pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.1;
  background-image:
    repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 10px),
    repeating-linear-gradient(135deg, #fff 0, #fff 1px, transparent 1px, transparent 10px);
}

.gold-frame {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 2px solid #c9a959;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(201, 169, 89, 0.5);
}

.inner-frame {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  border: 1px solid rgba(201, 169, 89, 0.5);
  border-radius: 5px;
}

.corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: #c9a959;
  border-style: solid;
  border-width: 0;
}

.top-left {
  top: 20px;
  left: 20px;
  border-top-width: 2px;
  border-left-width: 2px;
}

.top-right {
  top: 20px;
  right: 20px;
  border-top-width: 2px;
  border-right-width: 2px;
}

.bottom-left {
  bottom: 20px;
  left: 20px;
  border-bottom-width: 2px;
  border-left-width: 2px;
}

.bottom-right {
  bottom: 20px;
  right: 20px;
  border-bottom-width: 2px;
  border-right-width: 2px;
}

.stars-container {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.star {
  position: absolute;
  background-color: #fff;
  border-radius: 50%;
  filter: blur(1px);
  opacity: 0.8;
  animation: twinkle 3s infinite ease-in-out;
}

.mystic-symbol {
  position: absolute;
  color: rgba(201, 169, 89, 0.7);
  font-size: 28px;
  text-shadow: 0 0 5px rgba(201, 169, 89, 0.5);
}

.center-emblem {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #2d4f85, #182a49);
  border: 2px solid #c9a959;
  box-shadow: 0 0 20px rgba(201, 169, 89, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.9;
}

.center-emblem::before {
  content: '★';
  color: #c9a959;
  font-size: 40px;
  text-shadow: 0 0 10px rgba(201, 169, 89, 0.7);
}

.ornament {
  position: absolute;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: rgba(201, 169, 89, 0.7);
  font-size: 24px;
}

.moving-particle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
  animation: move 20s linear infinite;
  opacity: 0;
}

.constellation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.15;
}

@keyframes floating {
  0%,
  100% {
    transform: translateY(0) rotateY(0);
  }
  50% {
    transform: translateY(-15px) rotateY(5deg);
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes move {
  0% {
    opacity: 0;
    transform: translateX(-100%) translateY(-100%);
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translateX(200%) translateY(200%);
  }
}

/* Responsive adjustments */
@media (max-width: 500px) {
  .card-container {
    width: 280px;
    height: 470px;
  }
}
</style>
