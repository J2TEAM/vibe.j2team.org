<script setup lang="ts">
import { inject } from 'vue'
import { WEAPON_TYPES } from '../utils/config'
import type { GameContext } from '../composables/useGame'
import { SPRITES } from '../utils/sprites'

const {
  boardRotation,
  activeWidth,
  activeHeight,
  isRotating,
  powerUps,
  bullets,
  enemyBullets,
  enemies,
  bosses,
  player,
  gamePhase,
  currentWave,
} = inject('game') as GameContext
</script>

<template>
  <div
    class="absolute top-1/2 left-1/2 pointer-events-none"
    :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
    :style="{
      width: `${activeWidth}px`,
      height: `${activeHeight}px`,
      transform: `translate(-50%, -50%) rotate(${boardRotation}deg)`,
    }"
  >
    <div
      v-for="pu in powerUps"
      :key="'pu' + pu.id"
      class="absolute top-0 left-0 flex items-center justify-center will-change-transform z-20 pointer-events-none"
      :style="{
        transform: `translate3d(${pu.x}px, ${pu.y}px, 0)`,
        width: `${pu.width}px`,
        height: `${pu.height}px`,
      }"
    >
      <div
        class="w-full h-full flex items-center justify-center"
        :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
        :style="{ transform: `rotate(${-boardRotation}deg)` }"
      >
        <div
          v-if="pu.wType === -1"
          class="w-10 h-10 animate-pulse drop-shadow-md"
          v-html="SPRITES.stash"
        ></div>

        <div
          v-else
          class="relative flex items-center justify-center w-10 h-10 animate-bounce"
          :class="WEAPON_TYPES[pu.wType]?.color || ''"
        >
          <div class="w-full h-full" v-html="SPRITES.giftBox"></div>
          <div
            class="absolute inset-0 m-auto w-1/3 h-1/3 text-white drop-shadow-sm"
            v-html="WEAPON_TYPES[pu.wType]?.icon || ''"
          ></div>
        </div>
      </div>
    </div>

    <div
      v-for="bullet in bullets"
      :key="'b' + bullet.id"
      class="absolute top-0 left-0 opacity-90 will-change-transform pointer-events-none"
      :class="[
        bullet.shape === 'beam' ? 'bullet-ion-laser z-0' : '',
        bullet.shape === 'wavy-beam' ? 'bullet-wavy z-0' : '',
        bullet.shape === 'plasma-fan'
          ? 'bg-linear-to-t from-transparent via-accent-coral to-accent-coral rounded-t-full shadow-[0_-5px_10px_#FF6B4A] z-10'
          : '',
        bullet.shape === 'dash' ? 'bg-accent-sky rounded-sm shadow-[0_0_8px_#38BDF8] z-10' : '',
        bullet.shape === 'sphere' ? 'bg-red-500 rounded-full z-10' : '',
        bullet.shape === 'wave'
          ? 'bg-linear-to-b from-green-400 to-transparent rounded-t-full z-10'
          : '',
        bullet.shape === 'bolt' ? 'bullet-bolt z-10' : '',
        bullet.shape === 'blob' ? 'bg-lime-400 rounded-full shadow-[0_0_10px_#a3e635] z-10' : '',
        bullet.shape === 'shard' ? 'bullet-shard z-10' : '',
        bullet.shape === 'needle' ? 'bg-purple-500 rounded-[50%] z-10' : '',
        bullet.shape === 'pellet' ? 'bullet-pellet z-10' : '',
      ]"
      :style="{
        transform: `translate3d(${bullet.x}px, ${bullet.y}px, 0) rotate(${bullet.rotation}deg)`,
        width: `${bullet.width}px`,
        height: `${bullet.height}px`,
      }"
    ></div>

    <div
      v-for="egg in enemyBullets"
      :key="'egg' + egg.id"
      class="absolute top-0 left-0 z-20 will-change-transform flex items-center justify-center pointer-events-none"
      :style="{
        transform: `translate3d(${egg.x}px, ${egg.y}px, 0)`,
        width: `${egg.width}px`,
        height: `${egg.height}px`,
      }"
    >
      <div
        class="w-full h-full flex items-center justify-center"
        :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
        :style="{ transform: `rotate(${-boardRotation}deg)` }"
      >
        <div
          class="w-full h-full"
          :class="egg.isMeteor ? 'animate-[spin_3s_linear_infinite]' : ''"
          v-html="egg.isMeteor ? SPRITES.meteor : SPRITES.egg"
        ></div>
      </div>
    </div>

    <template v-if="gamePhase === 'minions' || gamePhase === 'meteors'">
      <div
        v-for="enemy in enemies"
        :key="'e' + enemy.id"
        class="absolute top-0 left-0 flex flex-col items-center justify-center z-10 will-change-transform pointer-events-none"
        :style="{
          transform: `translate3d(${enemy.x}px, ${enemy.y}px, 0)`,
          width: `${enemy.width}px`,
          height: `${enemy.height}px`,
        }"
      >
        <div
          v-if="enemy.hp < enemy.maxHp"
          class="absolute -top-3 w-[80%] h-1 bg-bg-deep border border-border-default overflow-hidden z-20"
          :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
          :style="{ transform: `rotate(${-boardRotation}deg)` }"
        >
          <div
            class="h-full bg-accent-sky transition-all duration-75"
            :style="{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }"
          ></div>
        </div>
        <div
          class="w-[90%] h-[90%] flex items-center justify-center"
          :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
          :style="{ transform: `rotate(${-boardRotation}deg)` }"
        >
          <div
            class="w-full h-full"
            :class="enemy.isMeteor ? 'animate-[spin_6s_linear_infinite]' : ''"
            :style="
              !enemy.isMeteor && !enemy.isStash
                ? {
                    color: (enemy as any).shirtColor || '#ef4444',
                    filter: `drop-shadow(0 0 10px ${(enemy as any).shirtColor || '#ef4444'})`,
                  }
                : {}
            "
            v-html="
              enemy.isMeteor ? SPRITES.meteor : enemy.isStash ? SPRITES.safe : SPRITES.chicken
            "
          ></div>
        </div>
      </div>
    </template>

    <template v-if="gamePhase === 'boss'">
      <template v-for="b in bosses" :key="'b' + b.id">
        <template v-if="b.hp > 0">
          <template v-if="b.bossType === 0 || b.bossType === 2 || b.bossType === 3">
            <template v-if="b.state === 'laser_warning'">
              <div
                v-for="(lx, i) in b.laserXs ||
                (b.laserX !== undefined ? [b.laserX] : [b.x + b.width / 2 - 40])"
                :key="'warn' + b.id + i"
                class="absolute top-0 left-0 bg-accent-coral/20 border-x-2 border-dashed border-accent-coral z-0 animate-pulse will-change-transform pointer-events-none"
                :style="{
                  transform: `translate3d(${lx}px, ${b.y + b.height}px, 0)`,
                  width: `80px`,
                  height: `${activeHeight}px`,
                }"
              >
                <div
                  class="w-full h-full flex flex-col items-center pt-20"
                  :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
                  :style="{ transform: `rotate(${-boardRotation}deg)` }"
                >
                  <div
                    class="text-center text-accent-coral font-display font-bold drop-shadow-md text-2xl"
                  >
                    ⚠️ DANGER ⚠️
                  </div>
                </div>
              </div>
            </template>

            <template v-if="b.state === 'laser_firing'">
              <div
                v-for="(lx, i) in b.laserXs ||
                (b.laserX !== undefined ? [b.laserX] : [b.x + b.width / 2 - 40])"
                :key="'fire' + b.id + i"
                class="absolute top-0 left-0 z-20 shadow-[0_0_40px_#FF6B4A] bg-linear-to-r from-accent-coral via-white to-accent-coral will-change-transform pointer-events-none"
                :style="{
                  transform: `translate3d(${lx}px, ${b.y + b.height}px, 0)`,
                  width: `80px`,
                  height: `${activeHeight}px`,
                }"
              ></div>
            </template>
          </template>

          <div
            class="absolute top-0 left-0 flex flex-col items-center justify-center z-10 will-change-transform pointer-events-none"
            :style="{
              transform: `translate3d(${b.x}px, ${b.y}px, 0)`,
              width: `${b.width}px`,
              height: `${b.height}px`,
            }"
          >
            <div
              class="absolute -top-6 w-[80%] h-3 bg-bg-deep border border-border-default overflow-hidden shadow-lg z-10"
              :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
              :style="{ transform: `rotate(${-boardRotation}deg)` }"
            >
              <div
                class="h-full transition-all duration-100"
                :class="
                  b.bossType === 1 || b.bossType === 4
                    ? 'bg-yellow-400'
                    : b.bossType === 2
                      ? 'bg-accent-sky'
                      : 'bg-linear-to-r from-accent-coral to-accent-amber'
                "
                :style="{ width: `${(b.hp / b.maxHp) * 100}%` }"
              ></div>
            </div>
            <div
              class="w-full h-full flex items-center justify-center"
              :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
              :style="{ transform: `rotate(${-boardRotation}deg)` }"
            >
              <div
                class="w-full h-full"
                :style="
                  b.bossType === 0
                    ? { color: '#ef4444', filter: 'drop-shadow(0 0 15px #ef4444)' }
                    : b.bossType === 1 || b.bossType === 4
                      ? { color: '#eab308', filter: 'drop-shadow(0 0 15px #eab308)' }
                      : {}
                "
                v-html="
                  b.bossType === 5 && currentWave >= 100
                    ? SPRITES.megaBoss // Gà Chúa biến hình
                    : b.bossType === 5
                      ? SPRITES.bossGiantChicken // Gà Chúa thường
                      : b.bossType === 0
                        ? SPRITES.chicken // Gà Boss thường
                        : b.bossType === 1
                          ? SPRITES.bossRooster
                          : b.bossType === 2
                            ? SPRITES.ufo
                            : b.bossType === 3
                              ? SPRITES.bossMecha
                              : b.bossType === 4
                                ? SPRITES.bossRooster
                                : SPRITES.chicken
                "
              ></div>
            </div>
          </div>
        </template>
        <div
          v-else
          class="absolute top-0 left-0 flex items-center justify-center z-20 will-change-transform pointer-events-none"
          :style="{
            transform: `translate3d(${b.x}px, ${b.y}px, 0)`,
            width: `${b.width}px`,
            height: `${b.height}px`,
          }"
        >
          <div
            class="w-full h-full flex items-center justify-center"
            :class="{ 'transition-transform duration-1000 ease-in-out': isRotating }"
            :style="{ transform: `rotate(${-boardRotation}deg)` }"
          >
            <span class="text-[120px] drop-shadow-[0_0_50px_#FF6B4A] boss-explode-anim">💥</span>
          </div>
        </div>
      </template>
    </template>

    <div
      class="absolute top-0 left-0 flex items-center justify-center z-30 will-change-transform transition-opacity pointer-events-none"
      :class="player.invulnerable > 0 ? 'opacity-40 animate-pulse' : 'opacity-100'"
      :style="{
        transform: `translate3d(${player.x}px, ${player.y}px, 0)`,
        width: `${player.width}px`,
        height: `${player.height}px`,
      }"
    >
      <div class="w-full h-full flex flex-col items-center justify-center relative">
        <div class="w-full h-full z-10 relative" v-html="SPRITES.player"></div>
        <div
          class="absolute -bottom-2 w-5 h-10 bg-linear-to-t from-accent-sky via-accent-coral to-transparent animate-[pulse_0.5s_linear_infinite] opacity-80 blur-[2px]"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bullet-ion-laser {
  background: linear-gradient(90deg, #e4a735 10%, #e2c405 50%, #e4a735 90%);
  box-shadow:
    0 0 15px #ffb830,
    0 0 30px #ffb830;
}

.bullet-shard {
  background: radial-gradient(circle, #ffb830 10%, #ff6b4a 50%, #9a3412 90%);
  border-radius: 50%;
  box-shadow: 0 0 10px #ff6b4a;
}

.bullet-wavy {
  background-color: transparent;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="80" viewBox="0 0 40 80"><path d="M20 0 C 35 20, 5 20, 20 40 C 35 60, 5 60, 20 80" fill="none" stroke="%23ec4899" stroke-width="8" stroke-linecap="round"/><path d="M20 0 C 35 20, 5 20, 20 40 C 35 60, 5 60, 20 80" fill="none" stroke="%23fbcfe8" stroke-width="3" stroke-linecap="round"/></svg>');
  background-repeat: repeat-y;
  background-size: 100% auto;
  animation: flowUp 0.3s linear infinite;
  filter: drop-shadow(0 0 10px #ec4899);
}

@keyframes flowUp {
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 0 80px;
  }
}

.bullet-bolt {
  background-color: transparent;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="60" viewBox="0 0 30 60"><path d="M15 0 L25 15 L10 30 L25 45 L15 60 L5 45 L20 30 L5 15 Z" fill="none" stroke="%2338BDF8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>');
  background-repeat: repeat-y;
  background-size: 100% 60px;
  animation: boltFlow 0.1s steps(2) infinite alternate;
}

@keyframes boltFlow {
  0% {
    background-position: 0 0;
    opacity: 1;
    filter: drop-shadow(0 0 8px #38bdf8) drop-shadow(0 0 15px #38bdf8) brightness(1);
  }

  100% {
    background-position: 5px 30px;
    opacity: 0.8;
    filter: drop-shadow(0 0 12px #38bdf8) drop-shadow(0 0 25px #38bdf8) brightness(1.4);
  }
}

.bullet-pellet {
  background: linear-gradient(to top, #6b7280, #f3f4f6);
  border-radius: 50% 50% 2px 2px;
  box-shadow: 0 0 6px #9ca3af;
}

.boss-explode-anim {
  animation: bossExplode 2s ease-out forwards;
}

@keyframes bossExplode {
  0% {
    transform: scale(1);
    opacity: 1;
    filter: brightness(1);
  }

  100% {
    transform: scale(2.5);
    opacity: 0;
    filter: brightness(2);
  }
}
</style>
