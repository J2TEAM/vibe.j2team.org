<template>
  <main
    class="min-h-screen bg-bg-surface text-text-primary px-4 py-8 max-w-7xl mx-auto overflow-hidden flex flex-col md:flex-row gap-6"
  >
    <div class="flex-none md:w-80 lg:w-96 flex flex-col gap-6">
      <div
        class="bg-bg-surface border border-border-color p-6 shadow-sm rounded-none animate-fade-up animate-delay-1"
      >
        <h1 class="font-display text-2xl font-bold mb-4 text-text-primary">
          <span class="text-accent-coral">//</span> Vietnam Adventure
        </h1>
        <p class="text-text-secondary font-body mb-6">
          Đánh dấu và theo dõi những tỉnh thành (cũ) Việt Nam mà bạn đã từng đặt chân đến.
        </p>

        <div
          class="mb-8 pb-6 border-b border-border-color text-center animate-fade-up animate-delay-2"
        >
          <div class="font-display font-medium text-lg mb-4 text-text-primary">Đã khám phá</div>

          <div class="flex items-center justify-center gap-6">
            <!-- Left stat: Visited -->
            <div class="flex flex-col items-center flex-1">
              <div class="font-display text-3xl md:text-4xl font-bold text-accent-coral">
                {{ statLabel }}
              </div>
              <div class="text-text-secondary text-sm mt-1 font-body">Tỉnh thành</div>
            </div>

            <!-- Separator -->
            <div class="w-px h-12 bg-border-color"></div>

            <!-- Right stat: Percentage -->
            <div class="flex flex-col items-center flex-1">
              <div class="font-display text-3xl md:text-4xl font-bold text-accent-coral">
                {{ completionPercent }} %
              </div>
              <div class="text-text-secondary text-sm mt-1 font-body">Việt Nam</div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3 animate-fade-up animate-delay-3">
          <button
            @click="downloadImage"
            :disabled="isGenerating"
            class="w-full flex items-center justify-center gap-2 bg-accent-coral hover:bg-accent-coral/90 text-white font-semibold py-3 px-4 rounded-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="lucide:download" class="w-5 h-5" />
            <span>{{ isGenerating ? 'Đang tạo ảnh...' : 'Lưu ảnh Bản Đồ' }}</span>
          </button>

          <RouterLink
            to="/"
            class="w-full flex items-center justify-center gap-2 bg-bg-elevated hover:bg-bg-deep text-text-primary font-semibold py-3 px-4 rounded-none border border-border-color transition-colors duration-200"
          >
            <Icon icon="lucide:arrow-left" class="w-5 h-5" />
            <span>Về trang chủ</span>
          </RouterLink>
        </div>
      </div>

      <!-- <div class="bg-bg-surface border border-border-color p-6 shadow-sm rounded-none text-sm text-text-secondary animate-fade-up animate-delay-4">
        <h3 class="font-semibold text-text-primary mb-2 flex items-center gap-2">
           <Icon icon="lucide:info" /> Mẹo sử dụng
        </h3>
        <ul class="list-disc pl-5 space-y-1.5 opacity-90">
          <li>Click vào bản đồ để đánh dấu nơi bạn đã đến.</li>
          <li>Chia sẻ ảnh bản đồ của bạn với bạn bè!</li>
        </ul>
      </div> -->
    </div>

    <!-- Map Area -->
    <div
      id="map-export-container"
      class="flex-grow flex items-center justify-center bg-bg-surface border border-border-color p-4 lg:p-8 shadow-sm min-h-[600px] relative overflow-auto animate-fade-up animate-delay-5"
    >
      <VietnamMap
        ref="mapRef"
        :visitedProvinces="visitedProvinces"
        @provinceClick="toggleProvince"
        class="w-full h-full max-w-3xl"
      />

      <div
        v-show="isGenerating"
        class="absolute inset-0 bg-bg-surface/80 backdrop-blur-sm flex items-center justify-center z-10"
      >
        <div
          class="animate-spin rounded-full h-12 w-12 border-4 border-accent-coral border-t-transparent"
        ></div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import VietnamMap from './components/VietnamMap.vue'
import { useAdventureMap } from './composables/useAdventureMap'

const { visitedProvinces, toggleProvince, statLabel, completionPercent } = useAdventureMap()

const mapRef = ref<InstanceType<typeof VietnamMap> | null>(null)
const isGenerating = ref(false)

const downloadImage = async () => {
  if (isGenerating.value || !mapRef.value) return
  isGenerating.value = true

  try {
    const originalSvg = document.querySelector('.vietnam-map-container svg') as SVGSVGElement
    if (!originalSvg) throw new Error('Could not find SVG')

    const clonedSvg = originalSvg.cloneNode(true) as SVGSVGElement

    const paths = clonedSvg.querySelectorAll('.province-path')
    paths.forEach((path) => {
      const originalPath = originalSvg.querySelector(`#${path.id}`)
      if (originalPath) {
        const computedStyle = window.getComputedStyle(originalPath)
        path.setAttribute('fill', computedStyle.fill)
        path.setAttribute('stroke', computedStyle.stroke)
        path.setAttribute('stroke-width', computedStyle.strokeWidth)
        path.setAttribute('stroke-opacity', computedStyle.strokeOpacity || '1')
      }
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const svgData = new XMLSerializer().serializeToString(clonedSvg)

    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const scale = 2
    const width = 703
    const imageHeight = 900
    // Increase bottom padding to fit the new larger watermark
    const paddingBottom = 160
    const canvasHeight = imageHeight + paddingBottom

    canvas.width = width * scale
    canvas.height = canvasHeight * scale

    if (ctx) {
      const styles = window.getComputedStyle(document.body)
      const bgSurface =
        styles.getPropertyValue('--color-bg-surface').trim() ||
        (document.documentElement.classList.contains('dark') ? '#09090b' : '#fafafa')

      ctx.fillStyle = bgSurface
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    await new Promise((resolve, reject) => {
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, width * scale, imageHeight * scale)
        URL.revokeObjectURL(url)

        if (ctx) {
          const styles = window.getComputedStyle(document.body)
          const secondaryTextColor =
            styles.getPropertyValue('--color-text-secondary').trim() ||
            (document.documentElement.classList.contains('dark') ? '#a1a1aa' : '#52525b')
          const accentColor = styles.getPropertyValue('--color-accent-coral').trim() || '#f2613f'
          const lineColor =
            styles.getPropertyValue('--color-border-color').trim() ||
            (document.documentElement.classList.contains('dark') ? '#3f3f46' : '#e4e4e7')

          const centerX = canvas.width / 2
          const watermarkStartY = imageHeight * scale + 20 * scale

          // 1. "Đã khám phá"
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          const titleText = 'Đã khám phá'

          ctx.fillStyle = secondaryTextColor
          ctx.font = `normal ${28 * scale}px "Be Vietnam Pro", sans-serif`
          ctx.fillText(titleText, centerX, watermarkStartY)

          // 2. The stats below
          const statsY = watermarkStartY + 45 * scale
          const labelsY = statsY + 35 * scale
          const columnOffset = 120 * scale

          // Left Column
          ctx.textAlign = 'center'
          ctx.fillStyle = accentColor
          ctx.font = `bold ${42 * scale}px "Anybody", sans-serif`
          ctx.fillText(statLabel.value, centerX - columnOffset, statsY)

          ctx.fillStyle = secondaryTextColor
          ctx.font = `normal ${24 * scale}px "Be Vietnam Pro", sans-serif`
          ctx.fillText('Tỉnh thành', centerX - columnOffset, labelsY)

          // Vertical Line
          ctx.strokeStyle = lineColor
          ctx.lineWidth = 1 * scale
          ctx.beginPath()
          ctx.moveTo(centerX, statsY - 15 * scale)
          ctx.lineTo(centerX, labelsY + 5 * scale)
          ctx.stroke()

          // Right Column
          ctx.fillStyle = accentColor
          ctx.font = `bold ${42 * scale}px "Anybody", sans-serif`
          ctx.fillText(`${completionPercent.value} %`, centerX + columnOffset, statsY)

          ctx.fillStyle = secondaryTextColor
          ctx.font = `normal ${24 * scale}px "Be Vietnam Pro", sans-serif`
          ctx.fillText('Việt Nam', centerX + columnOffset, labelsY)
        }
        resolve(true)
      }
      img.onerror = reject
      img.src = url
    })

    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    const timestamp = new Date().getTime()
    link.download = `vietnam-adventure-${timestamp}.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Lỗi tạo ảnh:', error)
    alert('Có lỗi xảy ra khi tạo ảnh bản đồ. Vui lòng thử lại!')
  } finally {
    isGenerating.value = false
  }
}
</script>
