import { ref, shallowRef, watch } from 'vue'
import type { EffectId, EffectParams } from '../types'
import { processEffect } from '../utils/effects'
import { EFFECTS } from '../utils/effects-config'

export function useImageProcessor() {
  const originalImage = shallowRef<HTMLImageElement | null>(null)
  const originalData = shallowRef<ImageData | null>(null)
  const processedData = shallowRef<ImageData | null>(null)
  const selectedEffect = ref<EffectId>('dithering')
  const isProcessing = ref(false)
  const imageSize = ref({ width: 0, height: 0 })

  const effectParams = ref<Record<EffectId, EffectParams>>(
    Object.fromEntries(
      EFFECTS.map((e) => [
        e.id,
        Object.fromEntries(e.params.map((p) => [p.key, p.defaultValue])),
      ]),
    ) as Record<EffectId, EffectParams>,
  )

  const helperCanvas = new OffscreenCanvas(1, 1)

  function loadImage(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const maxSize = 1200
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        originalData.value = ctx.getImageData(0, 0, width, height)
        originalImage.value = img
        imageSize.value = { width, height }
        URL.revokeObjectURL(url)
        applyCurrentEffect()
        resolve()
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Không thể tải ảnh'))
      }
      img.src = url
    })
  }

  function applyCurrentEffect() {
    if (!originalData.value) return
    isProcessing.value = true

    requestAnimationFrame(() => {
      const params = effectParams.value[selectedEffect.value] ?? {}
      processedData.value = processEffect(
        originalData.value!,
        selectedEffect.value,
        params,
        helperCanvas,
      )
      isProcessing.value = false
    })
  }

  function exportImage(format: 'png' | 'jpeg' = 'png') {
    if (!processedData.value) return
    const { width, height } = processedData.value
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(processedData.value, 0, 0)

    canvas.convertToBlob({ type: `image/${format}` }).then((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `yud-pixel-lab.${format}`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  watch(selectedEffect, () => applyCurrentEffect())
  watch(effectParams, () => applyCurrentEffect(), { deep: true })

  return {
    originalImage,
    originalData,
    processedData,
    selectedEffect,
    effectParams,
    isProcessing,
    imageSize,
    loadImage,
    applyCurrentEffect,
    exportImage,
  }
}
