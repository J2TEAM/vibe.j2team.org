<template>
  <div
    class="min-h-screen bg-slate-950 flex flex-col items-center p-4 md:p-8 font-mono text-slate-200 selection:bg-accent-coral/30"
  >
    <div class="w-full max-w-6xl">
      <div class="mb-8">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-3 text-slate-500 hover:text-accent-coral transition-colors group w-fit"
        >
          <div
            class="p-2 bg-slate-900 border border-slate-800 rounded-xl group-hover:border-accent-coral/40 group-hover:bg-accent-coral/10 transition-all shadow-sm"
          >
            <Icon
              icon="lucide:arrow-left"
              class="w-5 h-5 group-hover:-translate-x-1 transition-transform"
            />
          </div>
          <span class="uppercase tracking-widest text-xs font-bold">Về trang chủ</span>
        </RouterLink>
      </div>

      <div class="flex items-center gap-3 mb-8">
        <div
          class="p-2.5 bg-accent-coral/10 rounded-xl border border-accent-coral/20 shadow-[0_0_15px_rgba(255,127,80,0.15)]"
        >
          <Icon icon="lucide:keyboard" class="w-7 h-7 text-accent-coral" />
        </div>
        <h1 class="text-3xl font-black italic tracking-tighter uppercase">
          Keycode
          <span class="text-accent-coral underline decoration-wavy decoration-2 underline-offset-4"
            >Info</span
          >
        </h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <div
            class="bg-slate-900 border border-slate-800 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden group min-h-[300px]"
          >
            <div
              class="absolute inset-0 bg-gradient-to-br from-accent-coral/5 to-transparent opacity-50 transition-opacity"
            ></div>

            <div v-if="!hasPressed" class="space-y-4 relative z-10 animate-pulse">
              <Icon icon="lucide:inspect" class="w-16 h-16 text-slate-600 mx-auto" />
              <p class="text-slate-400 text-lg">
                Press any key on your keyboard <br />
                to get info...
              </p>
            </div>

            <div
              v-else
              class="relative z-10 w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300"
            >
              <p class="text-xs text-slate-500 uppercase tracking-[0.4em] font-bold">You pressed</p>

              <div
                class="min-w-[140px] px-10 py-8 bg-slate-800 rounded-2xl border-b-[8px] border-slate-950 shadow-[0_0_50px_rgba(255,127,80,0.15)] flex items-center justify-center transition-transform active:translate-y-2 active:border-b-0"
              >
                <span class="text-6xl font-black text-white drop-shadow-lg truncate max-w-[250px]">
                  {{ keyInfo.key }}
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(value, key) in keyInfo"
              :key="key"
              class="flex items-center justify-between bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-2xl p-5 transition-colors group"
            >
              <div class="flex flex-col gap-1 overflow-hidden">
                <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{{
                  key
                }}</span>
                <span
                  class="text-white text-lg font-bold truncate"
                  :class="{
                    'text-slate-600 italic font-normal':
                      value === '' || value === 'N/A' || value === 'None',
                  }"
                >
                  {{ value }}
                </span>
              </div>

              <button
                @click="copyToClipboard(value, key.toString())"
                class="p-2.5 rounded-xl transition-all flex-shrink-0"
                :class="
                  copiedField === key
                    ? 'bg-accent-coral/20 text-accent-coral border border-accent-coral/40 shadow-[0_0_10px_rgba(255,127,80,0.2)]'
                    : 'bg-slate-950 text-slate-400 hover:text-accent-coral hover:bg-accent-coral/10 border border-slate-800'
                "
                :disabled="!hasPressed || value === 'N/A'"
                :title="`Copy ${key}`"
              >
                <Icon v-if="copiedField === key" icon="lucide:check-check" class="w-5 h-5" />
                <Icon v-else icon="lucide:copy" class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <AboutCard />
          <AuthorCard />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'

import AboutCard from './AboutCard.vue'
import AuthorCard from './AuthorCard.vue'

interface KeyInfo {
  key: string
  keyCode: number
  code: string
  location: string
  ascii: string | number
  unicode: string
  repeat: boolean | string
  modifiers: string
}

const hasPressed = ref(false)
const copiedField = ref<string | null>(null)
const keyInfo = ref<KeyInfo>({
  key: '',
  keyCode: 0,
  code: '',
  location: '',
  ascii: '',
  unicode: '',
  repeat: false,
  modifiers: 'None',
})

let copyTimeout: ReturnType<typeof setTimeout> | null = null

const getLocationText = (loc: number) => {
  switch (loc) {
    case 0:
      return '0 (Standard)'
    case 1:
      return '1 (Left)'
    case 2:
      return '2 (Right)'
    case 3:
      return '3 (Numpad)'
    default:
      return String(loc)
  }
}

const specialAsciiMap: Record<string, number> = {
  Enter: 13,
  Escape: 27,
  Backspace: 8,
  Tab: 9,
  Space: 32,
}

const handleKeyDown = (e: KeyboardEvent) => {
  e.preventDefault()
  hasPressed.value = true

  let displayKey = e.key
  if (displayKey === ' ') displayKey = 'Space'

  // Lấy mã ASCII và Unicode
  let asciiVal: string | number = 'N/A'
  let unicodeVal = 'N/A'

  if (e.key.length === 1) {
    asciiVal = e.key.charCodeAt(0)
  } else {
    const mappedAscii = specialAsciiMap[displayKey]
    if (mappedAscii !== undefined) {
      asciiVal = mappedAscii
    }
  }

  if (typeof asciiVal === 'number') {
    unicodeVal = `U+${asciiVal.toString(16).padStart(4, '0').toUpperCase()}`
  }

  const mods: string[] = []
  if (e.ctrlKey && e.key !== 'Control') mods.push('Ctrl')
  if (e.altKey && e.key !== 'Alt') mods.push('Alt')
  if (e.shiftKey && e.key !== 'Shift') mods.push('Shift')
  if (e.metaKey && e.key !== 'Meta') mods.push('Meta')

  keyInfo.value = {
    key: displayKey,
    keyCode: e.keyCode || e.which,
    code: e.code,
    location: getLocationText(e.location),
    ascii: asciiVal,
    unicode: unicodeVal,
    repeat: e.repeat ? 'True (Holding)' : 'False',
    modifiers: mods.length > 0 ? mods.join(' + ') : 'None',
  }
}

// ĐĂNG KÝ EVENT
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

// GỠ EVENT KHI UNMOUNT NẰM Ở ĐÂY NÈ BÁC
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (copyTimeout) clearTimeout(copyTimeout)
})

const copyToClipboard = async (text: string | number | boolean, field: string) => {
  if (text === 'N/A') return

  try {
    await navigator.clipboard.writeText(String(text))
    copiedField.value = field

    if (copyTimeout) clearTimeout(copyTimeout)

    copyTimeout = setTimeout(() => {
      copiedField.value = null
    }, 1500)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>
