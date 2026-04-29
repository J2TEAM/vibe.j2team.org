<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'

import type { JsonValue, PairEntry } from '../types'

import { createPair, safeParseJson } from '../utils/mock-engine'

type EditorMode = 'json' | 'form'
type HintTone = 'neutral' | 'success' | 'warning' | 'error'

interface BuilderTemplate {
  id: string
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    title?: string
    helperText?: string
    editorRows?: number
    compact?: boolean
    templates?: BuilderTemplate[]
    tokenButtons?: string[]
    defaultFieldKey?: string
    defaultFieldValue?: string
  }>(),
  {
    title: 'Body Payload',
    helperText: 'Dùng template hoặc form builder nếu không muốn gõ JSON thủ công.',
    editorRows: 8,
    compact: false,
    templates: () => [],
    tokenButtons: () => [],
    defaultFieldKey: 'statusKey',
    defaultFieldValue: 'ok',
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const editorMode = ref<EditorMode>('json')
const formPairs = ref<PairEntry[]>([])
const hintText = ref('Mẹo: dùng Format/Validate để kiểm tra JSON nhanh.')
const hintTone = ref<HintTone>('neutral')

const model = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

const editorRowsResolved = computed(() => (props.compact ? Math.min(props.editorRows, 5) : props.editorRows))
const toggleButtonSizeClass = computed(() => (props.compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'))
const actionButtonSizeClass = computed(() => (props.compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'))
const formFieldClass = computed(() =>
  props.compact
    ? 'border border-border-default bg-bg-surface px-2 py-1 text-xs focus:border-accent-coral focus:outline-none'
    : 'border border-border-default bg-bg-surface px-2 py-1.5 text-sm focus:border-accent-coral focus:outline-none',
)

const hintClass = computed(() => {
  if (hintTone.value === 'success') {
    return 'border-accent-sky/40 bg-accent-sky/10 text-accent-sky'
  }
  if (hintTone.value === 'warning') {
    return 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber'
  }
  if (hintTone.value === 'error') {
    return 'border-accent-coral/40 bg-accent-coral/10 text-accent-coral'
  }
  return 'border-border-default bg-bg-deep text-text-secondary'
})

function setHint(message: string, tone: HintTone): void {
  hintText.value = message
  hintTone.value = tone
}

function parseScalar(rawValue: string): JsonValue {
  const value = rawValue.trim()

  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  if (value === 'null') {
    return null
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value)
  }

  if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
    try {
      return JSON.parse(value) as JsonValue
    } catch {
      return rawValue
    }
  }

  return rawValue
}

function toInputValue(value: JsonValue): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return String(value)
  }
  return JSON.stringify(value)
}

function flattenObjectPaths(value: JsonValue, basePath: string, output: PairEntry[]): void {
  if (Array.isArray(value)) {
    output.push(createPair(basePath || 'payload', JSON.stringify(value)))
    return
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      if (basePath) {
        output.push(createPair(basePath, '{}'))
      }
      return
    }

    for (const [key, child] of entries) {
      const path = basePath ? `${basePath}.${key}` : key
      flattenObjectPaths(child, path, output)
    }
    return
  }

  output.push(createPair(basePath || 'value', toInputValue(value)))
}

function createDefaultPair(): PairEntry {
  return createPair(props.defaultFieldKey, props.defaultFieldValue)
}

function syncFormFromJson(showFeedback: boolean): void {
  const parsed = safeParseJson(model.value)

  if (!parsed.ok) {
    if (formPairs.value.length === 0) {
      formPairs.value = [createDefaultPair()]
    }

    if (showFeedback) {
      setHint('JSON hiện tại chưa hợp lệ. Hãy bấm Validate hoặc Format trước.', 'error')
    }
    return
  }

  const nextPairs: PairEntry[] = []

  if (typeof parsed.value === 'object' && parsed.value !== null) {
    flattenObjectPaths(parsed.value, '', nextPairs)
  } else {
    nextPairs.push(createPair('value', toInputValue(parsed.value)))
  }

  formPairs.value = nextPairs.length > 0 ? nextPairs : [createDefaultPair()]

  if (showFeedback) {
    setHint('Đã nạp JSON vào Form builder.', 'success')
  }
}

function applyPathValue(root: Record<string, JsonValue>, rawPath: string, value: JsonValue): boolean {
  const segments = rawPath.split('.').map((segment) => segment.trim()).filter(Boolean)
  if (segments.length === 0) {
    return false
  }

  let cursor: Record<string, JsonValue> = root
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index]
    if (!segment) {
      continue
    }

    const nextValue = cursor[segment]
    if (typeof nextValue !== 'object' || nextValue === null || Array.isArray(nextValue)) {
      cursor[segment] = {}
    }

    cursor = cursor[segment] as Record<string, JsonValue>
  }

  const leaf = segments[segments.length - 1]
  if (!leaf) {
    return false
  }

  cursor[leaf] = value
  return true
}

function applyFormToJson(): void {
  const payload: Record<string, JsonValue> = {}

  for (const pair of formPairs.value) {
    const path = pair.key.trim()
    if (!path) {
      continue
    }

    applyPathValue(payload, path, parseScalar(pair.value))
  }

  model.value = JSON.stringify(payload, null, 2)
  setHint('Đã cập nhật JSON từ Form builder.', 'success')
}

function addField(): void {
  formPairs.value.push(createPair())
}

function removeField(id: string): void {
  formPairs.value = formPairs.value.filter((pair) => pair.id !== id)
  if (formPairs.value.length === 0) {
    formPairs.value.push(createDefaultPair())
  }
}

function formatJson(): void {
  const parsed = safeParseJson(model.value)
  if (!parsed.ok) {
    setHint(parsed.error, 'error')
    return
  }

  model.value = JSON.stringify(parsed.value, null, 2)
  setHint('JSON đã được format.', 'success')

  if (editorMode.value === 'form') {
    syncFormFromJson(false)
  }
}

function validateJson(): void {
  const parsed = safeParseJson(model.value)
  if (!parsed.ok) {
    setHint(parsed.error, 'error')
    return
  }
  setHint('JSON hợp lệ.', 'success')
}

function applyTemplate(templateId: string): void {
  const template = props.templates.find((item) => item.id === templateId)
  if (!template) {
    return
  }

  model.value = template.value
  setHint(`Đã áp dụng template: ${template.label}.`, 'success')

  if (editorMode.value === 'form') {
    syncFormFromJson(false)
  }
}

function appendToken(token: string): void {
  model.value = model.value.trim() ? `${model.value}\n${token}` : token
  setHint(`Đã chèn token ${token}.`, 'success')
}

function setEditorMode(mode: EditorMode): void {
  editorMode.value = mode
  if (mode === 'form') {
    syncFormFromJson(true)
  }
}

watch(
  () => model.value,
  () => {
    if (editorMode.value === 'form') {
      syncFormFromJson(false)
    }
  },
)

syncFormFromJson(false)
</script>

<template>
  <div :class="props.compact ? 'space-y-1.5' : 'space-y-2'">
    <div class="flex flex-wrap items-center justify-between" :class="props.compact ? 'gap-1' : 'gap-2'">
      <span :class="props.compact ? 'font-display text-[11px] tracking-wide text-text-secondary' : 'font-display text-xs tracking-wide text-text-secondary'">{{ title }}</span>
      <div class="inline-flex border border-border-default bg-bg-deep" :class="props.compact ? 'p-0' : 'p-0.5'">
        <button
          type="button"
          class="font-display tracking-wide transition"
          :class="
            [
              toggleButtonSizeClass,
              editorMode === 'json'
                ? 'bg-accent-coral/15 text-accent-coral'
                : 'text-text-secondary hover:text-text-primary',
            ]
          "
          @click="setEditorMode('json')"
        >
          JSON editor
        </button>
        <button
          type="button"
          class="font-display tracking-wide transition"
          :class="
            [
              toggleButtonSizeClass,
              editorMode === 'form'
                ? 'bg-accent-coral/15 text-accent-coral'
                : 'text-text-secondary hover:text-text-primary',
            ]
          "
          @click="setEditorMode('form')"
        >
          Form builder
        </button>
      </div>
    </div>

    <p :class="props.compact ? 'text-[10px] text-text-dim' : 'text-[11px] text-text-dim'">{{ helperText }}</p>

    <div v-if="editorMode === 'json'" :class="props.compact ? 'space-y-1.5' : 'space-y-2'">
      <div class="flex flex-wrap" :class="props.compact ? 'gap-1.5' : 'gap-2'">
        <button
          type="button"
          class="inline-flex items-center gap-1 border border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary"
          :class="actionButtonSizeClass"
          @click="formatJson"
        >
          <Icon icon="lucide:sparkles" class="size-3.5" />
          Format
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 border border-border-default text-text-secondary hover:border-accent-sky hover:text-text-primary"
          :class="actionButtonSizeClass"
          @click="validateJson"
        >
          <Icon icon="lucide:shield-check" class="size-3.5" />
          Validate
        </button>
        <button
          v-for="template in templates"
          :key="template.id"
          type="button"
          class="inline-flex items-center gap-1 border border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary"
          :class="actionButtonSizeClass"
          @click="applyTemplate(template.id)"
        >
          <Icon icon="lucide:clipboard-list" class="size-3.5" />
          {{ template.label }}
        </button>
        <button
          v-for="token in tokenButtons"
          :key="token"
          type="button"
          class="inline-flex items-center gap-1 border border-border-default text-text-secondary hover:border-accent-sky hover:text-text-primary"
          :class="actionButtonSizeClass"
          @click="appendToken(token)"
        >
          + {{ token }}
        </button>
      </div>

      <textarea
        v-model="model"
        :rows="editorRowsResolved"
        spellcheck="false"
        class="w-full border border-border-default bg-bg-deep font-mono leading-relaxed focus:border-accent-coral focus:outline-none"
        :class="props.compact ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'"
      />
    </div>

    <div
      v-else
      class="border border-border-default bg-bg-deep"
      :class="props.compact ? 'space-y-1.5 p-2' : 'space-y-2 p-3'"
    >
      <div class="flex flex-wrap items-center justify-between" :class="props.compact ? 'gap-1' : 'gap-2'">
        <p :class="props.compact ? 'text-[11px] text-text-secondary' : 'text-xs text-text-secondary'">Nhập path + value, ví dụ user.profile.status = ok</p>
        <div class="flex flex-wrap" :class="props.compact ? 'gap-1.5' : 'gap-2'">
          <button
            type="button"
            class="border border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary"
            :class="actionButtonSizeClass"
            @click="syncFormFromJson(true)"
          >
            Load from JSON
          </button>
          <button
            type="button"
            class="border border-border-default text-text-secondary hover:border-accent-amber hover:text-text-primary"
            :class="actionButtonSizeClass"
            @click="addField"
          >
            Add field
          </button>
        </div>
      </div>

      <div
        v-for="pair in formPairs"
        :key="pair.id"
        class="grid sm:grid-cols-[1fr_1fr_auto]"
        :class="props.compact ? 'gap-1.5' : 'gap-2'"
      >
        <input
          v-model="pair.key"
          :class="formFieldClass"
          placeholder="path (vd: user.profile.status)"
        />
        <input
          v-model="pair.value"
          :class="formFieldClass"
          placeholder="value"
        />
        <button
          type="button"
          class="border border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary"
          :class="actionButtonSizeClass"
          @click="removeField(pair.id)"
        >
          <Icon icon="lucide:trash-2" class="size-4" />
        </button>
      </div>

      <button
        type="button"
        class="inline-flex items-center border border-accent-sky/60 bg-accent-sky/10 text-accent-sky hover:border-accent-sky"
        :class="props.compact ? 'gap-1.5 px-2 py-1 text-[11px]' : 'gap-2 px-3 py-1.5 text-xs'"
        @click="applyFormToJson"
      >
        <Icon icon="lucide:arrow-down-to-line" class="size-3.5" />
        Apply to JSON editor
      </button>
    </div>

    <p class="border" :class="[hintClass, props.compact ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs']">
      {{ hintText }}
    </p>
  </div>
</template>
