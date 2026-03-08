<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import type { StoryData, Character, StageDirection, DialogueLine } from './types'

const props = defineProps<{ story: StoryData }>()

function getScene(id: string) {
  const scene = props.story.scenes.find((s) => s.id === id)
  if (!scene) throw new Error(`Scene "${id}" not found`)
  return scene
}

const initialSceneId = props.story.scenes[0]?.id ?? ''
const currentSceneId = ref(initialSceneId)
const dialogueIndex = ref(0)
const displayedText = ref('')
const isTyping = ref(false)
const showChoices = ref(false)
const activeEffect = ref<string | null>(null)
const bgTransitioning = ref(false)
const previousBg = ref<string | null>(null)
const showEnding = ref(false)
const stageReady = ref(false)

let typeTimer: ReturnType<typeof setTimeout> | null = null

const characterMap = computed(() => {
  const map = new Map<string, Character>()
  for (const c of props.story.characters) {
    map.set(c.id, c)
  }
  return map
})

const currentScene = computed(() => getScene(currentSceneId.value))

const currentLine = computed<DialogueLine | undefined>(
  () => currentScene.value.dialogue[dialogueIndex.value] as DialogueLine | undefined,
)

const speakerName = computed(() => {
  if (!currentLine.value?.characterId) return null
  return characterMap.value.get(currentLine.value.characterId)?.name ?? null
})

const speakerColor = computed(() => {
  if (!currentLine.value?.characterId) return ''
  const id = currentLine.value.characterId
  if (id === 'minh') return 'text-accent-sky'
  if (id === 'linh') return 'text-accent-coral'
  return 'text-accent-amber'
})

function getSpriteUrl(dir: StageDirection): string {
  const char = characterMap.value.get(dir.characterId)
  if (!char) return ''
  return char.sprites[dir.sprite] ?? ''
}

function typeText(text: string) {
  if (typeTimer) clearTimeout(typeTimer)
  typeTimer = null
  isTyping.value = true
  displayedText.value = ''
  let i = 0
  const speed = 30

  function tick() {
    if (i < text.length) {
      displayedText.value += text[i]
      i++
      typeTimer = setTimeout(tick, speed)
    } else {
      isTyping.value = false
    }
  }
  tick()
}

function skipTyping() {
  if (typeTimer) clearTimeout(typeTimer)
  const line = currentLine.value
  if (line) {
    displayedText.value = line.text
  }
  isTyping.value = false
}

function advance() {
  if (showEnding.value) return

  if (isTyping.value) {
    skipTyping()
    return
  }

  const scene = currentScene.value
  const nextIdx = dialogueIndex.value + 1
  const nextLine: DialogueLine | undefined = scene.dialogue[nextIdx]
  if (nextLine) {
    dialogueIndex.value = nextIdx
    typeText(nextLine.text)
  } else if (scene.choices && scene.choices.length > 0) {
    showChoices.value = true
  } else if (scene.isEnding) {
    showEnding.value = true
  } else if (scene.next) {
    goToScene(scene.next)
  }
}

function goToScene(sceneId: string) {
  const nextScene = getScene(sceneId)

  showChoices.value = false
  stageReady.value = false

  const currentBg = currentScene.value.background
  const nextBg = nextScene.background
  const transition = nextScene.bgTransition ?? 'instant'

  if (nextBg !== currentBg && transition !== 'instant') {
    previousBg.value = currentBg
    bgTransitioning.value = true
  }

  currentSceneId.value = sceneId
  dialogueIndex.value = 0

  nextTick(() => {
    if (nextScene.effect) {
      triggerEffect(nextScene.effect)
    }

    if (bgTransitioning.value) {
      setTimeout(() => {
        bgTransitioning.value = false
        previousBg.value = null
        stageReady.value = true
      }, 800)
    } else {
      stageReady.value = true
    }

    const firstLine: DialogueLine | undefined = nextScene.dialogue[0]
    if (firstLine) typeText(firstLine.text)
  })
}

function triggerEffect(effect: string) {
  activeEffect.value = effect
  setTimeout(() => {
    activeEffect.value = null
  }, 600)
}

function chooseOption(nextSceneId: string) {
  goToScene(nextSceneId)
}

function restart() {
  showEnding.value = false
  showChoices.value = false
  goToScene(initialSceneId)
}

watch(
  currentScene,
  () => {
    stageReady.value = true
    const line: DialogueLine | undefined = currentScene.value.dialogue[0]
    if (line) typeText(line.text)
  },
  { immediate: true },
)

onUnmounted(() => {
  if (typeTimer) clearTimeout(typeTimer)
  typeTimer = null
})
</script>

<template>
  <div
    class="vn-stage relative w-full h-full overflow-hidden select-none"
    :class="{
      'vn-shake': activeEffect === 'shake',
      'vn-flash': activeEffect === 'flash',
    }"
    @click="advance"
  >
    <!-- Background layers -->
    <div
      v-if="previousBg && bgTransitioning"
      class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
      :style="{ backgroundImage: `url(${previousBg})`, opacity: 0 }"
    />
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
      :class="bgTransitioning ? 'opacity-0' : 'opacity-100'"
      :style="{ backgroundImage: `url(${currentScene.background})` }"
    />

    <!-- Background fallback color -->
    <div class="absolute inset-0 bg-bg-deep -z-10" />

    <!-- Scene overlay effects -->
    <div
      v-if="activeEffect === 'red-tint'"
      class="absolute inset-0 bg-red-900/30 pointer-events-none z-10 transition-opacity duration-500"
    />
    <div
      v-if="activeEffect === 'glow'"
      class="absolute inset-0 pointer-events-none z-10"
      style="
        background: radial-gradient(circle at 50% 70%, rgba(255, 184, 48, 0.15), transparent 60%);
      "
    />

    <!-- Vignette overlay -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="
        z-index: 5;
        background: radial-gradient(ellipse at center, transparent 50%, rgba(15, 25, 35, 0.7) 100%);
      "
    />

    <!-- Character sprites -->
    <div class="absolute inset-0 z-10 pointer-events-none">
      <template v-for="dir in currentScene.stage" :key="dir.characterId">
        <img
          v-if="stageReady"
          :src="getSpriteUrl(dir)"
          :alt="characterMap.get(dir.characterId)?.name"
          class="absolute object-contain"
          style="bottom: 20%; height: 65%"
          :class="[
            dir.position === 'left' ? 'left-[2%]' : '',
            dir.position === 'right' ? 'right-[2%]' : '',
            dir.position === 'center' ? 'left-1/2 -translate-x-1/2' : '',
            dir.animation === 'slide-in' ? 'vn-slide-in' : '',
            dir.animation === 'fade-in' ? 'vn-char-fade-in' : '',
          ]"
        />
      </template>
    </div>

    <!-- Dialogue box -->
    <div class="absolute bottom-0 left-0 right-0 z-20 p-2 sm:p-4">
      <div class="max-w-3xl mx-auto">
        <!-- Ending card -->
        <div
          v-if="showEnding"
          class="border border-accent-coral bg-bg-deep/95 p-4 sm:p-8 text-center vn-ending-fade"
          @click.stop
        >
          <p class="font-display text-xs tracking-widest text-accent-amber mb-2 sm:mb-3">
            // KẾT THÚC
          </p>
          <h2 class="font-display text-lg sm:text-2xl font-bold text-accent-coral mb-4 sm:mb-6">
            {{ currentScene.endingTitle }}
          </h2>
          <button
            class="border border-border-default bg-bg-surface px-4 sm:px-6 py-2 sm:py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
            @click.stop="restart"
          >
            Chơi lại
          </button>
        </div>

        <!-- Choices -->
        <div
          v-else-if="showChoices && currentScene.choices"
          class="flex flex-col gap-2 sm:gap-3 mb-2 sm:mb-4"
          @click.stop
        >
          <button
            v-for="(choice, i) in currentScene.choices"
            :key="i"
            class="border border-border-default bg-bg-deep/90 px-4 sm:px-6 py-2.5 sm:py-3 text-left text-sm sm:text-base text-text-primary font-body transition-all duration-300 hover:border-accent-coral hover:bg-bg-elevated hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent-coral/10"
            :class="`vn-choice-appear-${i}`"
            @click.stop="chooseOption(choice.next)"
          >
            <span class="text-accent-coral font-display text-xs tracking-widest mr-2">
              {{ String.fromCharCode(65 + i) }}.
            </span>
            {{ choice.label }}
          </button>
        </div>

        <!-- Normal dialogue -->
        <div
          v-else
          class="border border-border-default bg-bg-deep/90 p-3 sm:p-5 backdrop-blur-sm cursor-pointer min-h-[80px] sm:min-h-[120px]"
        >
          <p
            v-if="speakerName"
            class="font-display text-xs sm:text-sm font-semibold mb-1 sm:mb-2"
            :class="speakerColor"
          >
            {{ speakerName }}
          </p>
          <p class="font-body text-sm sm:text-base text-text-primary leading-relaxed">
            {{ displayedText }}<span v-if="isTyping" class="vn-cursor">|</span>
          </p>
          <p v-if="!isTyping" class="text-right text-text-dim text-xs mt-1 sm:mt-2 vn-blink">
            Nhấn để tiếp tục
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vn-stage {
  cursor: pointer;
}

@keyframes vn-shake-anim {
  0%,
  100% {
    transform: translate(0);
  }
  10% {
    transform: translate(-4px, 2px);
  }
  20% {
    transform: translate(4px, -2px);
  }
  30% {
    transform: translate(-3px, 1px);
  }
  40% {
    transform: translate(3px, -1px);
  }
  50% {
    transform: translate(-2px, 2px);
  }
  60% {
    transform: translate(2px, -1px);
  }
  70% {
    transform: translate(-1px, 1px);
  }
}

.vn-shake {
  animation: vn-shake-anim 0.5s ease-out;
}

@keyframes vn-flash-anim {
  0% {
    box-shadow: inset 0 0 0 2000px rgba(255, 255, 255, 0.8);
  }
  100% {
    box-shadow: inset 0 0 0 2000px rgba(255, 255, 255, 0);
  }
}

.vn-flash {
  animation: vn-flash-anim 0.5s ease-out;
}

@keyframes vn-slide-in-anim {
  from {
    transform: translateX(80px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.vn-slide-in {
  animation: vn-slide-in-anim 0.6s ease-out both;
}

@keyframes vn-char-fade-in-anim {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.vn-char-fade-in {
  animation: vn-char-fade-in-anim 0.8s ease-out both;
}

@keyframes vn-cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.vn-cursor {
  animation: vn-cursor-blink 0.8s ease-in-out infinite;
  color: var(--color-accent-coral);
}

@keyframes vn-blink-anim {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.vn-blink {
  animation: vn-blink-anim 1.5s ease-in-out infinite;
}

@keyframes vn-choice-appear {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.vn-choice-appear-0 {
  animation: vn-choice-appear 0.3s ease-out both;
}

.vn-choice-appear-1 {
  animation: vn-choice-appear 0.3s ease-out 0.1s both;
}

@keyframes vn-ending-fade {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.vn-ending-fade {
  animation: vn-ending-fade 0.6s ease-out both;
}
</style>
