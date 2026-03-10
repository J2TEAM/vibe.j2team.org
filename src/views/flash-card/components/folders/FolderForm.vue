<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Folder } from '../../types'

const props = defineProps<{
  folder?: Folder
}>()

const emit = defineEmits<{
  save: [data: Pick<Folder, 'name' | 'description' | 'color' | 'icon'>]
  cancel: []
}>()

const name = ref(props.folder?.name ?? '')
const description = ref(props.folder?.description ?? '')
const color = ref(props.folder?.color ?? '#FF6B4A')
const icon = ref(props.folder?.icon ?? '📁')

watch(
  () => props.folder,
  (f) => {
    name.value = f?.name ?? ''
    description.value = f?.description ?? ''
    color.value = f?.color ?? '#FF6B4A'
    icon.value = f?.icon ?? '📁'
  },
)

const presetColors = [
  '#FF6B4A',
  '#FFB830',
  '#38BDF8',
  '#4ADE80',
  '#F472B6',
  '#A78BFA',
  '#FB923C',
  '#6EE7B7',
]

const presetIcons = [
  '📁',
  '📚',
  '🌍',
  '🔬',
  '💻',
  '🎨',
  '🎵',
  '📐',
  '🧮',
  '🏥',
  '⚖️',
  '🔧',
  '🌿',
  '🎯',
  '💬',
  '🧠',
]

function handleSubmit() {
  if (!name.value.trim()) return
  emit('save', {
    name: name.value.trim(),
    description: description.value.trim(),
    color: color.value,
    icon: icon.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-bg-deep/80" @click="emit('cancel')" />
      <div
        class="relative z-50 w-full max-w-lg border border-border-default bg-bg-surface p-6 animate-fade-up"
        role="dialog"
        :aria-label="folder ? 'Sửa thư mục' : 'Tạo thư mục'"
      >
        <h3 class="font-display text-xl font-semibold text-text-primary mb-6">
          {{ folder ? 'Sửa thư mục' : 'Tạo thư mục mới' }}
        </h3>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Name -->
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Tên thư mục</label>
            <input
              v-model="name"
              type="text"
              class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary text-sm focus:border-accent-coral focus:outline-none transition"
              placeholder="VD: Tiếng Anh, Toán học..."
              required
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Mô tả</label>
            <textarea
              v-model="description"
              rows="2"
              class="w-full bg-bg-deep border border-border-default px-3 py-2 text-text-primary text-sm focus:border-accent-coral focus:outline-none transition resize-none"
              placeholder="Mô tả ngắn về thư mục..."
            />
          </div>

          <!-- Icon -->
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Biểu tượng</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="emoji in presetIcons"
                :key="emoji"
                type="button"
                class="w-10 h-10 flex items-center justify-center text-xl border transition"
                :class="
                  icon === emoji
                    ? 'border-accent-coral bg-accent-coral/10'
                    : 'border-border-default hover:border-accent-coral/50'
                "
                @click="icon = emoji"
              >
                {{ emoji }}
              </button>
            </div>
          </div>

          <!-- Color -->
          <div>
            <label class="block text-sm text-text-secondary mb-1.5">Màu sắc</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="c in presetColors"
                :key="c"
                type="button"
                class="w-8 h-8 border-2 transition"
                :class="
                  color === c
                    ? 'border-text-primary scale-110'
                    : 'border-transparent hover:border-text-dim'
                "
                :style="{ backgroundColor: c }"
                @click="color = c"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-sm border border-border-default text-text-secondary hover:text-text-primary hover:border-accent-coral transition"
              @click="emit('cancel')"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm bg-accent-coral text-bg-deep font-semibold hover:bg-accent-coral/90 transition"
              :disabled="!name.trim()"
            >
              {{ folder ? 'Cập nhật' : 'Tạo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
