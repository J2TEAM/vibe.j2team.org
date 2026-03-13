<script setup lang="ts">
import { ref, computed } from 'vue'
import { toPng } from 'html-to-image'
import { Icon } from '@iconify/vue'
import { useFileDialog } from '@vueuse/core'

/** Refs for DOM and State */
const memeContainer = ref<HTMLElement | null>(null)
const uploadedImage = ref<string | null>(null)

/** File Upload via VueUse */
const { files, open, reset } = useFileDialog({
  accept: 'image/*',
  multiple: false,
})

/** Handle image preview */
const imageUrl = computed(() => {
  if (files.value && files.value.length > 0) {
    const file = files.value[0]
    if (file) {
      return URL.createObjectURL(file)
    }
  }
  return uploadedImage.value
})

/** Meme Texts & Config */
const textTop = ref('KHI CODE CHẠY TỐT')
const textBottom = ref('NHƯNG BẠN CHƯA KỊP LƯU')
const showCodeBox = ref(true)
const codeSnippet = ref(`try {
  // Fix bug in production
  deployToProd();
} catch (e) {
  // It's a feature, not a bug
  console.log("Working as expected");
}`)

/** Export using html-to-image */
const isExporting = ref(false)
const exportImage = async () => {
  if (!memeContainer.value) return

  isExporting.value = true

  try {
    const dataUrl = await toPng(memeContainer.value, {
      quality: 1,
      pixelRatio: 2,
    })

    // Create download link
    const link = document.createElement('a')
    link.download = 'code-meme.png'
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Failed to export image', err)
    alert('Có lỗi xảy ra khi xuất ảnh!')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary p-4 md:p-8 flex flex-col md:flex-row gap-8 pb-32"
  >
    <!-- Cột Controls (Bên trái) -->
    <div class="w-full md:w-1/3 bg-bg-surface p-6 border border-border-default h-fit">
      <!-- Nút Về Trang Chủ -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 text-text-secondary hover:text-accent-coral mb-6 transition-colors font-medium"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Về trang chủ
      </RouterLink>

      <h1 class="text-2xl font-display font-bold text-accent-coral flex items-center gap-2 mb-6">
        <Icon icon="lucide:image" class="size-6" />
        Code Meme Gen
      </h1>

      <div class="space-y-5">
        <!-- Upload Ảnh -->
        <div>
          <label class="block text-sm font-medium mb-2 text-text-secondary">Ảnh nền</label>
          <div class="flex gap-2">
            <button
              @click="open()"
              class="flex-1 px-4 py-2 bg-bg-elevated hover:bg-bg-inverse transition-colors border border-border-default flex justify-center items-center gap-2 cursor-pointer"
            >
              <Icon icon="lucide:upload" />
              Tải ảnh lên
            </button>
            <button
              v-if="imageUrl"
              @click="reset()"
              class="px-4 py-2 bg-bg-elevated hover:bg-bg-inverse hover:text-accent-coral transition-colors border border-border-default cursor-pointer"
              title="Xóa ảnh"
            >
              <Icon icon="lucide:trash-2" />
            </button>
          </div>
        </div>

        <!-- Chữ Top -->
        <div>
          <label class="block text-sm font-medium mb-2 text-text-secondary">Chữ trên cùng</label>
          <input
            v-model="textTop"
            class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary focus:border-accent-coral outline-none transition-colors"
            placeholder="Nhập chữ trên..."
          />
        </div>

        <!-- Chữ Bottom -->
        <div>
          <label class="block text-sm font-medium mb-2 text-text-secondary">Chữ dưới cùng</label>
          <input
            v-model="textBottom"
            class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary focus:border-accent-coral outline-none transition-colors"
            placeholder="Nhập chữ dưới..."
          />
        </div>

        <!-- Code Window Config -->
        <div class="pt-4 border-t border-border-default">
          <label class="flex items-center gap-2 cursor-pointer mb-3 select-none">
            <input
              type="checkbox"
              v-model="showCodeBox"
              class="accent-accent-coral w-4 h-4 cursor-pointer"
            />
            <span class="text-sm font-medium text-text-secondary"
              >Hiển thị cửa sổ Code (macOS)</span
            >
          </label>
          <textarea
            v-if="showCodeBox"
            v-model="codeSnippet"
            rows="6"
            class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary font-mono text-sm focus:border-accent-coral outline-none transition-colors"
            placeholder="Gõ code vào đây..."
          ></textarea>
        </div>

        <!-- Hành động xuất ảnh -->
        <button
          @click="exportImage"
          :disabled="isExporting"
          class="w-full px-4 py-3 bg-accent-coral text-bg-deep font-bold hover:brightness-110 transition-all mt-4 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Icon v-if="!isExporting" icon="lucide:download" class="size-5" />
          <Icon v-else icon="lucide:loader-2" class="size-5 animate-spin" />
          {{ isExporting ? 'Đang xuất...' : 'Tải Meme Về Máy' }}
        </button>
      </div>
    </div>

    <!-- Cột Canvas Meme (Bên phải) -->
    <div class="w-full md:w-2/3 flex justify-center items-start overflow-hidden">
      <!-- Container ảo dùng để render và xuất -->
      <div class="border border-border-default bg-bg-surface overflow-hidden w-full max-w-[700px]">
        <div
          ref="memeContainer"
          class="relative w-full aspect-square md:aspect-[4/3] flex flex-col items-center justify-between bg-grid-pattern"
          :style="{
            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: imageUrl ? 'transparent' : 'var(--color-bg-deep)',
          }"
        >
          <!-- Text Top -->
          <div class="w-full text-center p-6 z-10 min-h-[100px] flex items-start justify-center">
            <h2
              v-if="textTop"
              class="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-wide leading-tight meme-text"
            >
              {{ textTop }}
            </h2>
          </div>

          <!-- Code Window -->
          <div
            v-if="showCodeBox"
            class="z-10 w-[80%] max-w-[500px] bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-white/10"
          >
            <!-- Header giống macOS -->
            <div class="h-8 bg-[#2d2d2d] flex items-center px-4 gap-2 border-b border-black/20">
              <div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <!-- Nội dung Code (font Consolas, Monaco, monospace) -->
            <div class="p-5 overflow-hidden text-left bg-[#1e1e1e]">
              <pre
                class="font-mono text-sm md:text-base text-[#d4d4d4] whitespace-pre-wrap leading-relaxed"
                >{{ codeSnippet }}</pre
              >
            </div>
          </div>

          <!-- Text Bottom -->
          <div class="w-full text-center p-6 z-10 min-h-[100px] flex items-end justify-center">
            <h2
              v-if="textBottom"
              class="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-wide leading-tight meme-text"
            >
              {{ textBottom }}
            </h2>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fallback pattern nền nếu chưa up ảnh */
.bg-grid-pattern {
  background-image:
    linear-gradient(to right, var(--color-border-default) 1px, transparent 1px),
    linear-gradient(to bottom, var(--color-border-default) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Đổ viền đen dày (Impact text style) cho meme */
.meme-text {
  text-shadow:
    3px 3px 0 #000,
    -3px -3px 0 #000,
    3px -3px 0 #000,
    -3px 3px 0 #000,
    0px 3px 0 #000,
    0px -3px 0 #000,
    3px 0px 0 #000,
    -3px 0px 0 #000;
  /* Dùng font-display (Anybody) được khai báo trên thẻ h2 nhưng có thể force Impact nếu muốn chuẩn cổ điển */
  font-family: Impact, 'Anybody', sans-serif;
}
</style>
