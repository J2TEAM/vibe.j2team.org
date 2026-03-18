import type { EffectDefinition } from '../types'

export const EFFECTS: EffectDefinition[] = [
  {
    id: 'dithering',
    name: 'Dithering',
    icon: 'lucide:grid-3x3',
    description: 'Floyd-Steinberg error diffusion',
    params: [
      { label: 'Ngưỡng', key: 'threshold', min: 0, max: 255, step: 1, defaultValue: 128 },
      { label: 'Tỷ lệ', key: 'scale', min: 1, max: 4, step: 1, defaultValue: 1 },
    ],
  },
  {
    id: 'pixelate',
    name: 'Pixelate',
    icon: 'lucide:square',
    description: 'Hiệu ứng pixel khối',
    params: [
      { label: 'Kích thước khối', key: 'blockSize', min: 2, max: 40, step: 1, defaultValue: 10 },
    ],
  },
  {
    id: 'halftone',
    name: 'Halftone',
    icon: 'lucide:circle-dot',
    description: 'Chấm tròn theo độ sáng',
    params: [
      { label: 'Khoảng cách', key: 'spacing', min: 4, max: 20, step: 1, defaultValue: 8 },
      { label: 'Chấm tối đa', key: 'maxDot', min: 2, max: 20, step: 1, defaultValue: 8 },
    ],
  },
  {
    id: 'edge',
    name: 'Edge Detect',
    icon: 'lucide:scan-line',
    description: 'Phát hiện cạnh Sobel',
    params: [
      { label: 'Ngưỡng', key: 'threshold', min: 0, max: 200, step: 1, defaultValue: 50 },
      { label: 'Đảo ngược', key: 'invert', min: 0, max: 1, step: 1, defaultValue: 0 },
    ],
  },
]
