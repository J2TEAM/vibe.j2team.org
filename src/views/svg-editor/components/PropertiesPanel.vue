<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { SvgElement, AlignType } from '../types'

defineProps<{
  selectedElement: SvgElement | null
  selectedCount: number
}>()

const emit = defineEmits<{
  updateProp: [key: string, value: string | number]
  duplicate: []
  moveUp: []
  moveDown: []
  delete: []
  group: []
  ungroup: []
  align: [AlignType]
  rotate: [number]
}>()

function onInput(key: string, e: Event) {
  const val = (e.target as HTMLInputElement).value
  const textKeys = ['text', 'fill', 'stroke', 'fontFamily', 'strokeDasharray', 'lineCap', 'lineJoin']
  emit('updateProp', key, textKeys.includes(key) ? val : Number(val))
}

const alignBtns: { type: AlignType; icon: string; label: string }[] = [
  { type: 'left', icon: 'lucide:align-start-horizontal', label: 'Trái' },
  { type: 'center', icon: 'lucide:align-center-horizontal', label: 'Giữa' },
  { type: 'right', icon: 'lucide:align-end-horizontal', label: 'Phải' },
  { type: 'top', icon: 'lucide:align-start-vertical', label: 'Trên' },
  { type: 'middle', icon: 'lucide:align-center-vertical', label: 'Giữa dọc' },
  { type: 'bottom', icon: 'lucide:align-end-vertical', label: 'Dưới' },
]

const btnClass = 'w-full flex items-center gap-2 px-2.5 py-1.5 border border-border-default text-text-secondary hover:border-accent-sky hover:text-accent-sky transition-all duration-200 text-[11px]'
const btnDanger = 'w-full flex items-center gap-2 px-2.5 py-1.5 border border-border-default text-text-secondary hover:border-accent-coral hover:text-accent-coral transition-all duration-200 text-[11px]'
const inputClass = 'bg-bg-elevated border border-border-default px-2 py-1 text-text-primary font-mono text-[11px] focus:border-accent-coral focus:outline-none transition-colors'
</script>

<template>
  <div class="border-b border-border-default">
    <div class="p-3 border-b border-border-default flex items-center gap-2">
      <span class="text-accent-amber text-[10px] tracking-widest font-display">//</span>
      <span class="font-display text-sm font-semibold">Thuộc tính</span>
    </div>

    <!-- Align (multi-select) -->
    <div v-if="selectedCount >= 2" class="p-3 space-y-3 text-xs">
      <div>
        <span class="text-[10px] text-text-dim uppercase tracking-wide font-display block mb-2">Căn chỉnh</span>
        <div class="grid grid-cols-6 gap-1">
          <button
            v-for="a in alignBtns" :key="a.type" :title="a.label"
            class="p-1.5 border border-border-default text-text-secondary hover:border-accent-sky hover:text-accent-sky transition"
            @click="emit('align', a.type)"
          >
            <Icon :icon="a.icon" class="size-3.5 mx-auto" />
          </button>
        </div>
      </div>
      <div class="flex gap-1.5">
        <button :class="btnClass" class="flex-1 justify-center" @click="emit('group')">
          <Icon icon="lucide:group" class="size-3.5" /> Nhóm
        </button>
        <button :class="btnDanger" class="flex-1 justify-center" @click="emit('delete')">
          <Icon icon="lucide:trash-2" class="size-3.5" /> Xoá
        </button>
      </div>
    </div>

    <!-- Single element -->
    <div v-else-if="selectedElement" class="p-3 space-y-3 text-xs">
      <div class="flex items-center gap-2">
        <span class="text-accent-sky font-display font-semibold uppercase tracking-wide">{{ selectedElement.type }}</span>
        <span v-if="selectedElement.locked" class="text-accent-amber"><Icon icon="lucide:lock" class="size-3" /></span>
      </div>

      <!-- Geometry -->
      <div class="space-y-2 pb-2 border-b border-border-default/50">
        <div class="grid grid-cols-2 gap-x-2 gap-y-2">
          <div class="space-y-1">
            <label class="text-[9px] text-text-dim uppercase tracking-wider font-display flex items-center gap-1">
              <Icon icon="lucide:move" class="size-2.5" /> Vị trí X
            </label>
            <input :value="selectedElement.x ?? selectedElement.cx ?? selectedElement.x1 ?? 0" type="number" :class="inputClass" class="w-full" @input="onInput(selectedElement.cx !== undefined ? 'cx' : (selectedElement.x1 !== undefined ? 'x1' : 'x'), $event)" />
          </div>
          <div class="space-y-1">
            <label class="text-[9px] text-text-dim uppercase tracking-wider font-display flex items-center gap-1">
              <Icon icon="lucide:move" class="size-2.5 rotate-90" /> Vị trí Y
            </label>
            <input :value="selectedElement.y ?? selectedElement.cy ?? selectedElement.y1 ?? 0" type="number" :class="inputClass" class="w-full" @input="onInput(selectedElement.cy !== undefined ? 'cy' : (selectedElement.y1 !== undefined ? 'y1' : 'y'), $event)" />
          </div>
          
          <template v-if="selectedElement.width !== undefined || selectedElement.r !== undefined || selectedElement.rx !== undefined">
            <div class="space-y-1">
              <label class="text-[9px] text-text-dim uppercase tracking-wider font-display flex items-center gap-1">
                <Icon icon="lucide:maximize-2" class="size-2.5" /> Rộng/Bán kính
              </label>
              <input :value="selectedElement.width ?? selectedElement.r ?? selectedElement.rx ?? 0" type="number" min="0" :class="inputClass" class="w-full" @input="onInput(selectedElement.width !== undefined ? 'width' : (selectedElement.r !== undefined ? 'r' : 'rx'), $event)" />
            </div>
          </template>
          
          <template v-if="selectedElement.height !== undefined || selectedElement.ry !== undefined">
            <div class="space-y-1">
              <label class="text-[9px] text-text-dim uppercase tracking-wider font-display flex items-center gap-1">
                <Icon icon="lucide:maximize-2" class="size-2.5 rotate-90" /> Cao
              </label>
              <input :value="selectedElement.height ?? selectedElement.ry ?? 0" type="number" min="0" :class="inputClass" class="w-full" @input="onInput(selectedElement.height !== undefined ? 'height' : 'ry', $event)" />
            </div>
          </template>
        </div>

        <!-- Scale (for Paths/Groups) -->
        <div v-if="['path', 'group', 'image'].includes(selectedElement.type)" class="space-y-1 pt-1">
          <label class="text-[9px] text-text-dim uppercase tracking-wider font-display flex items-center gap-1">
            <Icon icon="lucide:scaling" class="size-2.5" /> Tỷ lệ (Scale)
          </label>
          <div class="flex items-center gap-2">
            <input 
              :value="selectedElement.transform?.match(/scale\(([-\d.]+)\)/)?.[1] || 1"
              type="range" min="0.1" max="10" step="0.1" 
              class="flex-1 accent-accent-coral h-1"
              @input="(e) => {
                const s = (e.target as HTMLInputElement).value
                emit('updateProp', 'transform', `scale(${s})`)
              }"
            />
            <input 
              :value="selectedElement.transform?.match(/scale\(([-\d.]+)\)/)?.[1] || 1"
              type="number" min="0.1" max="10" step="0.1"
              :class="inputClass" class="w-12 text-center"
              @input="(e) => {
                const s = (e.target as HTMLInputElement).value
                emit('updateProp', 'transform', `scale(${s})`)
              }"
            />
          </div>
        </div>
      </div>

      <!-- Fill -->
      <div class="space-y-1">
        <label class="text-text-dim text-[10px] tracking-wide uppercase font-display block">Màu nền (Fill)</label>
        <div class="flex items-center gap-2">
          <label class="w-5 h-5 border border-border-default shrink-0 cursor-pointer" :style="{ backgroundColor: selectedElement.fill.startsWith('url') ? '#222' : selectedElement.fill }">
            <input :value="selectedElement.fill.startsWith('url') ? '#000000' : selectedElement.fill" type="color" class="sr-only" @input="onInput('fill', $event)" />
          </label>
          <input :value="selectedElement.fill" type="text" :class="inputClass" class="flex-1" @change="onInput('fill', $event)" />
        </div>
      </div>

      <!-- Stroke -->
      <div class="space-y-1">
        <label class="text-text-dim text-[10px] tracking-wide uppercase font-display block">Viền (Stroke)</label>
        <div class="flex items-center gap-2">
          <label class="w-5 h-5 border border-border-default shrink-0 cursor-pointer" :style="{ backgroundColor: selectedElement.stroke.startsWith('url') ? '#222' : selectedElement.stroke }">
            <input :value="selectedElement.stroke.startsWith('url') ? '#000000' : selectedElement.stroke" type="color" class="sr-only" @input="onInput('stroke', $event)" />
          </label>
          <input :value="selectedElement.stroke" type="text" :class="inputClass" class="flex-1" @change="onInput('stroke', $event)" />
        </div>
      </div>

      <!-- Width + Opacity -->
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <label class="text-text-dim text-[10px] tracking-wide uppercase font-display block">Độ dày (Width)</label>
          <input :value="selectedElement.strokeWidth" type="number" min="0" max="50" step="0.5" :class="inputClass" class="w-full" @input="onInput('strokeWidth', $event)" />
        </div>
        <div class="space-y-1">
          <label class="text-text-dim text-[10px] tracking-wide uppercase font-display block">Độ mờ (Opacity)</label>
          <input :value="selectedElement.opacity" type="number" min="0" max="1" step="0.05" :class="inputClass" class="w-full" @input="onInput('opacity', $event)" />
        </div>
      </div>

      <!-- Rotation -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <label class="text-text-dim text-[10px] tracking-wide uppercase font-display">Xoay (Rotation)</label>
          <span class="text-accent-coral font-mono text-[10px]">{{ selectedElement.rotation ?? 0 }}°</span>
        </div>
        <div class="flex items-center gap-1">
          <input :value="selectedElement.rotation ?? 0" type="range" min="0" max="360" step="1" class="flex-1 accent-accent-coral h-1" @input="onInput('rotation', $event)" />
          <button class="p-1 border border-border-default text-text-dim hover:text-text-primary transition" title="Reset" @click="emit('rotate', 0)">
            <Icon icon="lucide:rotate-ccw" class="size-3" />
          </button>
        </div>
      </div>

      <!-- Dash + Cap/Join -->
      <div class="space-y-1">
        <label class="text-text-dim text-[10px] tracking-wide uppercase font-display block">Nét đứt (Dash)</label>
        <select :value="selectedElement.strokeDasharray" :class="inputClass" class="w-full cursor-pointer" @change="onInput('strokeDasharray', $event)">
          <option value="">Liền</option>
          <option value="8 4">Nét đứt</option>
          <option value="2 4">Chấm</option>
          <option value="8 4 2 4">Đứt-Chấm</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <label class="text-text-dim text-[10px] tracking-wide uppercase font-display block">Đầu nét (Cap)</label>
          <select :value="selectedElement.lineCap" :class="inputClass" class="w-full cursor-pointer" @change="onInput('lineCap', $event)">
            <option value="butt">Thẳng</option>
            <option value="round">Tròn</option>
            <option value="square">Vuông</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-text-dim text-[10px] tracking-wide uppercase font-display block">Nối góc (Join)</label>
          <select :value="selectedElement.lineJoin" :class="inputClass" class="w-full cursor-pointer" @change="onInput('lineJoin', $event)">
            <option value="miter">Nhọn</option>
            <option value="round">Tròn</option>
            <option value="bevel">Vát</option>
          </select>
        </div>
      </div>

      <!-- Text -->
      <template v-if="selectedElement.type === 'text'">
        <div class="space-y-1">
          <label class="text-text-dim text-[10px] tracking-wide uppercase font-display block">Nội dung (Text)</label>
          <input :value="selectedElement.text" type="text" :class="inputClass" class="w-full" @change="onInput('text', $event)" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <label class="text-text-dim text-[10px] tracking-wide uppercase font-display block">Cỡ chữ (Size)</label>
            <input :value="selectedElement.fontSize" type="number" min="8" max="200" :class="inputClass" class="w-full" @input="onInput('fontSize', $event)" />
          </div>
          <div class="space-y-1">
            <label class="text-text-dim text-[10px] tracking-wide uppercase font-display block">Phông (Font)</label>
            <select :value="selectedElement.fontFamily ?? 'sans-serif'" :class="inputClass" class="w-full cursor-pointer" @change="onInput('fontFamily', $event)">
              <option value="sans-serif">Sans</option>
              <option value="serif">Serif</option>
              <option value="monospace">Mono</option>
            </select>
          </div>
        </div>
      </template>

      <!-- Actions -->
      <div class="border-t border-border-default pt-3 space-y-1.5">
        <button v-if="selectedElement.type === 'group'" :class="btnClass" @click="emit('ungroup')">
          <Icon icon="lucide:ungroup" class="size-3.5" /> Bỏ nhóm
        </button>
        <button :class="btnClass" @click="emit('duplicate')">
          <Icon icon="lucide:copy" class="size-3.5" /> Nhân bản
        </button>
        <div class="flex gap-1.5">
          <button :class="btnClass" class="flex-1 justify-center" @click="emit('moveUp')">
            <Icon icon="lucide:chevron-up" class="size-3.5" /> Lên
          </button>
          <button :class="btnClass" class="flex-1 justify-center" @click="emit('moveDown')">
            <Icon icon="lucide:chevron-down" class="size-3.5" /> Xuống
          </button>
        </div>
        <button :class="btnDanger" @click="emit('delete')">
          <Icon icon="lucide:trash-2" class="size-3.5" /> Xoá
        </button>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="p-6 flex flex-col items-center gap-2 text-center">
      <Icon icon="lucide:mouse-pointer-click" class="size-8 text-text-dim/40" />
      <p class="text-text-dim text-xs">Chọn element để<br />xem thuộc tính</p>
    </div>
  </div>
</template>
