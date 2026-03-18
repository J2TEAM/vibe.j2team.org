<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'

const props = defineProps<{
  svgCode: string
}>()

const emit = defineEmits<{
  close: []
  apply: [code: string]
}>()

const { copy, copied } = useClipboard()
const editCode = ref(props.svgCode)
const isEditing = ref(false)

function startEdit() {
  editCode.value = props.svgCode
  isEditing.value = true
}

function applyCode() {
  emit('apply', editCode.value)
  isEditing.value = false
}

const modalBtn = 'flex items-center gap-1.5 px-3 py-1.5 border border-border-default text-text-secondary text-xs transition-all duration-200 hover:border-accent-amber hover:text-accent-amber'
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" @click.self="emit('close')">
    <div class="w-full max-w-3xl max-h-[85vh] bg-bg-surface border border-border-default flex flex-col" style="box-shadow: 0 24px 48px rgba(0,0,0,0.5);">
      <div class="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <div class="flex items-center gap-2">
          <Icon icon="lucide:code-2" class="size-4 text-accent-amber" />
          <h3 class="font-display font-semibold">Mã SVG</h3>
        </div>
        <div class="flex items-center gap-2">
          <button v-if="!isEditing" :class="modalBtn" @click="startEdit">
            <Icon icon="lucide:pencil" class="size-3.5" />
            Chỉnh sửa
          </button>
          <button v-else :class="modalBtn" class="text-green-400 border-green-500/50 hover:border-green-500" @click="applyCode">
            <Icon icon="lucide:check" class="size-3.5" />
            Áp dụng
          </button>
          <button :class="[modalBtn, copied ? 'text-green-400 border-green-500/50' : '']" @click="copy(isEditing ? editCode : svgCode)">
            <Icon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-3.5" />
            {{ copied ? 'Đã sao chép!' : 'Sao chép (Copy)' }}
          </button>
          <button class="p-1.5 text-text-secondary hover:text-text-primary transition" @click="emit('close')">
            <Icon icon="lucide:x" class="size-4" />
          </button>
        </div>
      </div>
      <div v-if="isEditing" class="flex-1 overflow-hidden flex flex-col">
        <textarea
          v-model="editCode"
          class="flex-1 w-full bg-bg-deep/50 p-4 font-mono text-xs text-text-secondary leading-relaxed resize-none focus:outline-none"
          spellcheck="false"
        />
      </div>
      <pre v-else class="flex-1 overflow-auto p-4 font-mono text-xs text-text-secondary leading-relaxed whitespace-pre-wrap break-all bg-bg-deep/50">{{ svgCode }}</pre>
    </div>
  </div>
</template>
