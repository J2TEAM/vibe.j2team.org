<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

const styles = [
  { value: 'adventurer', label: 'Adventurer' },
  { value: 'adventurer-neutral', label: 'Adventurer Neutral' },
  { value: 'avataaars', label: 'Avataaars' },
  { value: 'avataaars-neutral', label: 'Avataaars Neutral' },
  { value: 'big-ears', label: 'Big Ears' },
  { value: 'big-ears-neutral', label: 'Big Ears Neutral' },
  { value: 'big-smile', label: 'Big Smile' },
  { value: 'bottts', label: 'Bottts' },
  { value: 'bottts-neutral', label: 'Bottts Neutral' },
  { value: 'croodles', label: 'Croodles' },
  { value: 'croodles-neutral', label: 'Croodles Neutral' },
  { value: 'dylan', label: 'Dylan' },
  { value: 'fun-emoji', label: 'Fun Emoji' },
  { value: 'glass', label: 'Glass' },
  { value: 'icons', label: 'Icons' },
  { value: 'identicon', label: 'Identicon' },
  { value: 'initials', label: 'Initials' },
  { value: 'lorelei', label: 'Lorelei' },
  { value: 'lorelei-neutral', label: 'Lorelei Neutral' },
  { value: 'micah', label: 'Micah' },
  { value: 'miniavs', label: 'Miniavs' },
  { value: 'notionists', label: 'Notionists' },
  { value: 'notionists-neutral', label: 'Notionists Neutral' },
  { value: 'open-peeps', label: 'Open Peeps' },
  { value: 'personas', label: 'Personas' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'pixel-art-neutral', label: 'Pixel Art Neutral' },
  { value: 'rings', label: 'Rings' },
  { value: 'shapes', label: 'Shapes' },
  { value: 'thumbs', label: 'Thumbs' },
]

const seed = ref('j2team')
const selectedStyle = ref('adventurer')
const copied = ref(false)
const inputSeed = ref('j2team')

const avatarUrl = computed(
  () =>
    `https://api.dicebear.com/9.x/${selectedStyle.value}/svg?seed=${encodeURIComponent(seed.value)}`,
)

function randomSeed() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  seed.value = result
  inputSeed.value = result
}

function applySeed() {
  seed.value = inputSeed.value.trim() || 'j2team'
}

function copySeed() {
  navigator.clipboard.writeText(seed.value).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  })
}

async function downloadAvatar(format: 'png' | 'svg') {
  const url = `https://api.dicebear.com/9.x/${selectedStyle.value}/${format}?seed=${encodeURIComponent(seed.value)}`

  const res = await fetch(url)
  const blob = await res.blob()

  const link = document.createElement('a')
  const objectUrl = URL.createObjectURL(blob)

  link.href = objectUrl
  link.download = `avatar-${selectedStyle.value}-${seed.value}.${format}`

  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body">
    <div class="mx-auto max-w-5xl px-6 py-12">
      <!-- Header -->
      <div class="mb-10 animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-xs text-text-dim font-display tracking-widest transition hover:text-accent-coral mb-6"
        >
          &larr; VỀ TRANG CHỦ
        </RouterLink>
        <div class="flex items-start gap-4">
          <div>
            <h1
              class="font-display text-4xl sm:text-5xl font-bold text-text-primary tracking-tight"
            >
              <span class="text-accent-coral">Random</span> Avatar
            </h1>
            <p class="mt-2 text-text-secondary text-sm max-w-md">
              Tạo avatar ngẫu nhiên từ
              <a
                href="https://www.dicebear.com"
                target="_blank"
                rel="noopener noreferrer"
                class="text-accent-sky hover:underline"
                >DiceBear</a
              >
              với nhiều phong cách khác nhau.
            </p>
          </div>
        </div>
      </div>

      <!-- Dot divider -->
      <div class="flex gap-1.5 mb-10 animate-fade-up animate-delay-1">
        <span v-for="n in 40" :key="n" class="w-1 h-1 rounded-full bg-border-default" />
      </div>

      <div class="grid gap-8 lg:grid-cols-2">
        <!-- Controls -->
        <div class="animate-fade-up animate-delay-2">
          <h2
            class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"
          >
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Cấu hình
          </h2>

          <div class="border border-border-default bg-bg-surface p-6 flex flex-col gap-5">
            <!-- Style selector -->
            <div>
              <label
                class="block font-display text-xs tracking-widest text-text-dim mb-2 uppercase"
              >
                Phong cách
              </label>
              <div class="relative">
                <select
                  v-model="selectedStyle"
                  class="w-full appearance-none border border-border-default bg-bg-deep text-text-primary text-sm px-4 py-2.5 pr-10 font-body focus:outline-none focus:border-accent-coral transition cursor-pointer"
                >
                  <option v-for="s in styles" :key="s.value" :value="s.value">
                    {{ s.label }}
                  </option>
                </select>
                <span
                  class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-dim text-xs"
                  >▼</span
                >
              </div>
            </div>

            <!-- Seed input -->
            <div>
              <label
                class="block font-display text-xs tracking-widest text-text-dim mb-2 uppercase"
              >
                Seed
              </label>
              <div class="flex gap-2">
                <input
                  v-model="inputSeed"
                  type="text"
                  placeholder="Nhập seed..."
                  class="flex-1 border border-border-default bg-bg-deep text-text-primary text-sm px-4 py-2.5 font-body placeholder:text-text-dim focus:outline-none focus:border-accent-coral transition"
                  @keydown.enter="applySeed"
                />
                <button
                  class="border border-border-default bg-bg-elevated px-4 py-2.5 text-sm font-display text-text-secondary transition hover:border-accent-coral hover:text-text-primary active:scale-95"
                  @click="applySeed"
                >
                  Áp dụng
                </button>
              </div>
              <p class="mt-1.5 text-xs text-text-dim">
                Nhấn Enter hoặc "Áp dụng" để tạo avatar với seed này.
              </p>
            </div>

            <!-- Random button -->
            <button
              class="w-full border border-accent-coral bg-accent-coral/10 px-5 py-3 font-display text-sm tracking-widest text-accent-coral transition hover:bg-accent-coral hover:text-bg-deep active:scale-95"
              @click="randomSeed"
            >
              &#x21BB; NGẪU NHIÊN
            </button>

            <!-- API URL info -->
            <div class="border border-border-default bg-bg-deep p-4">
              <p class="font-display text-xs tracking-widest text-text-dim mb-2 uppercase">
                API URL
              </p>
              <p class="text-xs text-accent-amber break-all font-mono leading-relaxed">
                https://api.dicebear.com/9.x/{{ selectedStyle }}/svg?seed={{
                  encodeURIComponent(seed)
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Avatar preview -->
        <div class="animate-fade-up animate-delay-3">
          <h2
            class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"
          >
            <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
            Kết quả
          </h2>

          <div
            class="border border-border-default bg-bg-surface p-6 flex flex-col items-center gap-5"
          >
            <!-- Avatar image -->
            <div
              class="w-48 h-48 border border-border-default bg-bg-deep flex items-center justify-center overflow-hidden"
            >
              <img
                :key="avatarUrl"
                :src="avatarUrl"
                :alt="`Avatar ${selectedStyle} - ${seed}`"
                class="w-full h-full object-contain"
              />
            </div>

            <!-- Seed display -->
            <div
              class="w-full border border-border-default bg-bg-deep p-4 flex items-center justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="font-display text-xs tracking-widest text-text-dim uppercase mb-1">
                  Seed hiện tại
                </p>
                <p class="text-sm text-text-primary font-mono truncate">{{ seed }}</p>
              </div>
              <button
                class="shrink-0 border px-3 py-1.5 font-display text-xs tracking-widest transition active:scale-95"
                :class="
                  copied
                    ? 'border-accent-amber text-accent-amber'
                    : 'border-border-default text-text-dim hover:border-accent-coral hover:text-text-primary'
                "
                @click="copySeed"
              >
                {{ copied ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP' }}
              </button>
            </div>

            <!-- Style badge -->
            <div class="w-full flex items-center gap-3">
              <span class="font-display text-xs tracking-widest text-text-dim uppercase"
                >Phong cách:</span
              >
              <span
                class="bg-accent-coral/10 border border-accent-coral/30 px-3 py-1 font-display text-xs tracking-widest text-accent-coral"
              >
                {{ selectedStyle }}
              </span>
            </div>

            <!-- Download buttons -->
            <div class="flex w-full gap-4">
              <button
                class="flex-1 border border-border-default bg-bg-elevated px-4 py-3 font-display text-sm tracking-widest text-text-secondary transition hover:border-accent-amber hover:text-accent-amber active:scale-95"
                @click="downloadAvatar('png')"
              >
                &#x2193; PNG
              </button>
              <button
                class="flex-1 border border-border-default bg-bg-elevated px-4 py-3 font-display text-sm tracking-widest text-text-secondary transition hover:border-accent-sky hover:text-accent-sky active:scale-95"
                @click="downloadAvatar('svg')"
              >
                &#x2193; SVG
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Style gallery -->
      <div class="mt-12 animate-fade-up animate-delay-4">
        <h2
          class="font-display text-2xl font-semibold text-text-primary mb-6 flex items-center gap-3"
        >
          <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
          Tất cả phong cách
        </h2>
        <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-3">
          <button
            v-for="s in styles"
            :key="s.value"
            class="border bg-bg-surface p-3 flex flex-col items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-bg-elevated active:scale-95"
            :class="
              selectedStyle === s.value
                ? 'border-accent-coral'
                : 'border-border-default hover:border-accent-coral'
            "
            @click="selectedStyle = s.value"
          >
            <img
              :src="`https://api.dicebear.com/9.x/${s.value}/svg?seed=${encodeURIComponent(seed)}`"
              :alt="s.label"
              class="w-12 h-12 object-contain"
              loading="lazy"
            />
            <span
              class="font-display text-[10px] tracking-wide text-text-dim text-center leading-tight line-clamp-2"
            >
              {{ s.label }}
            </span>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="mt-12 pt-8 border-t border-border-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up animate-delay-5"
      >
        <p class="text-xs text-text-dim font-display tracking-widest">
          POWERED BY
          <a
            href="https://www.dicebear.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-sky hover:underline"
            >DICEBEAR</a
          >
          — HTTP API v9.x
        </p>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Về trang chủ
        </RouterLink>
      </div>
    </div>
  </div>
</template>
