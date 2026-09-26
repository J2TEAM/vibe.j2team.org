<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useIntervalFn } from '@vueuse/core'
import { analyzeHuffman, analyzeRle, byteLabel, hexByte } from './compression'

type Method = 'rle' | 'huffman'

const examples = [
  { label: 'Lặp nhiều', value: 'AAAAAAAABBBBBBBBCCCCCCCC' },
  { label: 'Văn bản', value: 'BANANA BANDANA BANANA BANDANA' },
  { label: 'Tiếng Việt', value: 'Xin chào! Xin chào! Xin chào!' },
]

const input = ref(examples[0]?.value ?? '')
const method = ref<Method>('rle')
const stepIndex = ref(0)
const inputBytes = computed(() => new TextEncoder().encode(input.value))
const isTooLong = computed(() => inputBytes.value.length > 1024)
const result = computed(() => {
  if (isTooLong.value || inputBytes.value.length === 0) return null
  return method.value === 'rle' ? analyzeRle(inputBytes.value) : analyzeHuffman(inputBytes.value)
})
const steps = computed(() => result.value?.steps ?? [])
const currentStep = computed(() => steps.value[stepIndex.value])
const atEnd = computed(() => stepIndex.value >= steps.value.length - 1)
const visibleInput = computed(() => Array.from(inputBytes.value.slice(0, 96)))
const visibleOutput = computed(() =>
  Array.from(
    result.value?.encoded.slice(0, Math.min(currentStep.value?.outputBytes ?? 0, 96)) ?? [],
  ),
)
const visibleRuns = computed(() => result.value?.runs.slice(0, stepIndex.value) ?? [])
const visiblePool = computed(() => currentStep.value?.pool?.slice(0, 12) ?? [])
const savedBytes = computed(() => inputBytes.value.length - (result.value?.encoded.length ?? 0))
const savedPercent = computed(() =>
  inputBytes.value.length ? Math.round((savedBytes.value / inputBytes.value.length) * 100) : 0,
)
const progress = computed(() =>
  steps.value.length > 1 ? (stepIndex.value / (steps.value.length - 1)) * 100 : 0,
)

const { isActive, pause, resume } = useIntervalFn(
  () => {
    if (atEnd.value) pause()
    else {
      stepIndex.value++
      if (atEnd.value) pause()
    }
  },
  900,
  { immediate: false },
)

watch([input, method], () => {
  pause()
  stepIndex.value = 0
})

function moveStep(next: number): void {
  pause()
  stepIndex.value = Math.max(0, Math.min(next, steps.value.length - 1))
}

function togglePlay(): void {
  if (isActive.value) return pause()
  if (atEnd.value) stepIndex.value = 0
  resume()
}

function inputByteClass(index: number): string {
  const step = currentStep.value
  if (!step) return 'border-border-default bg-bg-elevated text-text-secondary'
  if (
    step.activeStart !== undefined &&
    index >= step.activeStart &&
    index < (step.activeEnd ?? 0)
  ) {
    return 'border-accent-coral bg-accent-coral/15 text-accent-coral'
  }
  if (index < step.processedCount)
    return 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber'
  return 'border-border-default bg-bg-elevated text-text-secondary'
}
</script>

<template>
  <main class="min-h-screen bg-bg-deep px-4 py-8 font-body text-text-primary sm:px-6 sm:py-12">
    <div class="mx-auto max-w-5xl">
      <header class="animate-fade-up">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:border-accent-coral hover:text-text-primary"
        >
          <Icon icon="lucide:arrow-left" class="size-4" /> Về trang chủ
        </RouterLink>
        <div class="mt-10 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p class="font-display text-xs font-semibold tracking-[0.24em] text-accent-coral">
              // HỌC QUA THỬ NGHIỆM
            </p>
            <h1 class="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
              Phòng thí nghiệm <span class="text-accent-coral">nén dữ liệu</span>
            </h1>
            <p class="mt-4 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
              Nhập văn bản, chọn thuật toán và đi từng bước để xem các byte được nén như thế nào.
            </p>
          </div>
          <div
            class="border border-accent-amber/50 bg-accent-amber/10 px-4 py-3 font-display text-xs font-semibold tracking-widest text-accent-amber"
          >
            BYTE LAB / 01
          </div>
        </div>
      </header>

      <section class="mt-10 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div
          class="animate-fade-up animate-delay-1 border border-border-default bg-bg-surface p-5 sm:p-6"
        >
          <h2 class="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <span class="text-sm text-accent-coral">//</span> Dữ liệu đầu vào
            <span class="ml-auto text-xs font-normal text-text-dim">UTF-8</span>
          </h2>
          <label for="compression-input" class="sr-only">Văn bản cần nén</label>
          <textarea
            id="compression-input"
            v-model="input"
            rows="5"
            spellcheck="false"
            placeholder="Nhập văn bản để bắt đầu..."
            class="w-full resize-y border border-border-default bg-bg-deep p-4 font-mono text-sm leading-6 text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent-coral"
          />
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span class="mr-1 text-xs text-text-dim">Thử nhanh:</span>
            <button
              v-for="example in examples"
              :key="example.label"
              type="button"
              class="border border-border-default px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent-amber hover:text-text-primary"
              @click="input = example.value"
            >
              {{ example.label }}
            </button>
          </div>
          <p v-if="isTooLong" class="mt-3 text-sm text-accent-coral" role="alert">
            Giới hạn 1.024 byte UTF-8 để phần mô phỏng luôn dễ theo dõi.
          </p>
          <p v-else class="mt-3 text-xs text-text-dim">
            {{ inputBytes.length }} byte UTF-8 · {{ Array.from(input).length }} mã điểm Unicode
          </p>
        </div>
        <div
          class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-5 sm:p-6"
        >
          <h2 class="flex items-center gap-2 font-display text-lg font-semibold">
            <span class="text-sm text-accent-amber">//</span> Thuật toán
          </h2>
          <div class="mt-5 grid grid-cols-2 gap-2" role="group" aria-label="Chọn thuật toán nén">
            <button
              type="button"
              :aria-pressed="method === 'rle'"
              :class="
                method === 'rle'
                  ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                  : 'border-border-default text-text-secondary hover:border-accent-coral'
              "
              class="border px-3 py-3 font-display text-sm font-semibold transition-colors"
              @click="method = 'rle'"
            >
              RLE
            </button>
            <button
              type="button"
              :aria-pressed="method === 'huffman'"
              :class="
                method === 'huffman'
                  ? 'border-accent-coral bg-accent-coral/10 text-accent-coral'
                  : 'border-border-default text-text-secondary hover:border-accent-coral'
              "
              class="border px-3 py-3 font-display text-sm font-semibold transition-colors"
              @click="method = 'huffman'"
            >
              Huffman
            </button>
          </div>
          <p class="mt-5 text-sm leading-6 text-text-secondary">
            <template v-if="method === 'rle'"
              >Mỗi chuỗi byte giống nhau được thay bằng cặp
              <strong class="text-text-primary">[số lần, byte]</strong>. Một cặp luôn chiếm 2
              byte.</template
            >
            <template v-else
              >Byte xuất hiện nhiều được gán mã bit ngắn hơn. Kết quả gồm
              <strong class="text-text-primary">bảng mã</strong> và phần dữ liệu bit.</template
            >
          </p>
        </div>
      </section>

      <template v-if="result && currentStep">
        <section class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Kết quả nén">
          <div
            v-for="stat in [
              { label: 'Dữ liệu gốc', value: inputBytes.length, color: 'text-text-primary' },
              { label: 'Dữ liệu nén', value: result.payloadBytes, color: 'text-accent-amber' },
              { label: 'Bảng mã / đầu đề', value: result.headerBytes, color: 'text-text-primary' },
              {
                label: 'Tổng kích thước',
                value: result.encoded.length,
                color: 'text-accent-coral',
              },
            ]"
            :key="stat.label"
            class="animate-fade-up animate-delay-3 border border-border-default bg-bg-surface p-4"
          >
            <p class="text-xs text-text-secondary">{{ stat.label }}</p>
            <p :class="stat.color" class="mt-2 font-display text-2xl font-bold">
              {{ stat.value }} <span class="text-sm font-medium text-text-dim">byte</span>
            </p>
          </div>
        </section>
        <div
          class="mt-4 flex flex-wrap items-center justify-between gap-2 border-l-2 border-accent-sky bg-accent-sky/10 px-4 py-3 text-sm"
        >
          <span
            ><strong :class="savedBytes >= 0 ? 'text-accent-sky' : 'text-accent-amber'">{{
              savedBytes >= 0
                ? `Tiết kiệm ${savedBytes} byte (${savedPercent}%)`
                : `Tăng ${-savedBytes} byte (${Math.abs(savedPercent)}%)`
            }}</strong
            ><span class="text-text-secondary"> so với dữ liệu gốc.</span></span
          >
          <span class="inline-flex items-center gap-1.5 text-xs text-text-secondary"
            ><Icon
              :icon="result.roundTripOk ? 'lucide:check-check' : 'lucide:triangle-alert'"
              class="size-4 text-accent-sky"
            />{{ result.roundTripOk ? 'Giải nén khớp 100%' : 'Giải nén không khớp' }}</span
          >
        </div>

        <section class="mt-8 animate-fade-up animate-delay-3">
          <h2 class="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
            <span class="text-sm text-accent-coral">//</span> Theo dõi từng bước
          </h2>
          <div class="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
            <div class="border border-border-default bg-bg-surface p-5 sm:p-6">
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-display text-sm font-semibold">Byte đầu vào</h3>
                <span class="text-xs text-text-dim"
                  >Đã đọc {{ currentStep.processedCount }}/{{ inputBytes.length }}</span
                >
              </div>
              <div
                class="mt-4 flex min-h-24 flex-wrap content-start gap-1.5"
                aria-label="Các byte đầu vào"
              >
                <span
                  v-for="(byte, index) in visibleInput"
                  :key="index"
                  :class="inputByteClass(index)"
                  class="inline-flex min-w-9 items-center justify-center border px-1.5 py-1 font-mono text-xs transition-colors"
                  :title="`Byte ${index + 1}: 0x${hexByte(byte)}`"
                  >{{ byteLabel(byte) }}</span
                >
                <span v-if="inputBytes.length > 96" class="px-2 py-1 text-xs text-text-dim"
                  >+{{ inputBytes.length - 96 }} byte</span
                >
              </div>
              <div class="mt-6 border-t border-border-default pt-5">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="font-display text-sm font-semibold">Đầu ra ở bước này</h3>
                  <span class="text-xs text-text-dim">{{ currentStep.outputBytes }} byte</span>
                </div>
                <p
                  v-if="visibleOutput.length"
                  class="mt-3 break-all font-mono text-xs leading-6 text-accent-amber"
                >
                  {{ visibleOutput.map(hexByte).join(' ')
                  }}{{ currentStep.outputBytes > 96 ? ' …' : '' }}
                </p>
                <p v-else class="mt-3 text-sm text-text-dim">Chưa xuất byte nào.</p>
              </div>
              <p class="mt-4 text-xs leading-5 text-text-dim">
                Các ô biểu diễn byte UTF-8; byte ngoài ASCII hiện bằng mã hex. Đầu ra cũng hiển thị
                ở dạng hex.
              </p>
            </div>
            <div class="flex flex-col border border-border-default bg-bg-surface p-5 sm:p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-display text-xs tracking-widest text-accent-coral">
                    BƯỚC {{ stepIndex + 1 }} / {{ steps.length }}
                  </p>
                  <h3 class="mt-2 font-display text-xl font-semibold">{{ currentStep.title }}</h3>
                </div>
                <Icon icon="lucide:scan-line" class="size-6 shrink-0 text-accent-coral" />
              </div>
              <p class="mt-3 min-h-16 text-sm leading-6 text-text-secondary">
                {{ currentStep.description }}
              </p>
              <div class="mt-auto pt-5">
                <label for="compression-step" class="sr-only">Chọn bước mô phỏng</label>
                <input
                  id="compression-step"
                  :value="stepIndex"
                  type="range"
                  min="0"
                  :max="steps.length - 1"
                  step="1"
                  class="w-full accent-accent-coral"
                  @input="moveStep(Number(($event.target as HTMLInputElement).value))"
                />
                <div class="mt-2 h-1 bg-bg-elevated" aria-hidden="true">
                  <div
                    class="h-full bg-accent-coral transition-all"
                    :style="{ width: `${progress}%` }"
                  />
                </div>
                <div class="mt-5 flex gap-2">
                  <button
                    type="button"
                    :disabled="stepIndex === 0"
                    class="flex flex-1 items-center justify-center gap-1 border border-border-default px-2 py-2.5 text-sm transition-colors hover:border-accent-coral disabled:cursor-not-allowed disabled:opacity-40"
                    @click="moveStep(stepIndex - 1)"
                  >
                    <Icon icon="lucide:chevron-left" class="size-4" />Trước
                  </button>
                  <button
                    type="button"
                    class="flex flex-1 items-center justify-center gap-1 bg-accent-coral px-2 py-2.5 text-sm font-semibold text-bg-deep transition-opacity hover:opacity-85"
                    @click="togglePlay"
                  >
                    <Icon :icon="isActive ? 'lucide:pause' : 'lucide:play'" class="size-4" />{{
                      isActive ? 'Dừng' : atEnd ? 'Phát lại' : 'Tự chạy'
                    }}
                  </button>
                  <button
                    type="button"
                    :disabled="atEnd"
                    class="flex flex-1 items-center justify-center gap-1 border border-border-default px-2 py-2.5 text-sm transition-colors hover:border-accent-coral disabled:cursor-not-allowed disabled:opacity-40"
                    @click="moveStep(stepIndex + 1)"
                  >
                    Sau<Icon icon="lucide:chevron-right" class="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="mt-5 border border-border-default bg-bg-surface p-5 sm:p-6">
          <h2 class="flex items-center gap-2 font-display text-lg font-semibold">
            <span class="text-sm text-accent-amber">//</span
            >{{ method === 'rle' ? 'Các cặp đã tạo' : 'Cây ghép và bảng mã' }}
          </h2>
          <template v-if="method === 'rle'">
            <div v-if="visibleRuns.length" class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="(run, index) in visibleRuns"
                :key="index"
                class="border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 font-mono text-xs text-accent-amber"
                >{{ run.count }} × {{ byteLabel(run.byte) }} <span class="text-text-dim">→</span>
                {{ hexByte(run.count) }} {{ hexByte(run.byte) }}</span
              >
            </div>
            <p v-else class="mt-4 text-sm text-text-dim">Bấm “Sau” để ghi cặp đầu tiên.</p>
            <p class="mt-4 text-xs leading-5 text-text-secondary">
              Một chuỗi tối đa 255 byte mỗi cặp. Chuỗi dài hơn được tách thành nhiều cặp.
            </p>
          </template>
          <template v-else>
            <div v-if="visiblePool.length" class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="(node, index) in visiblePool"
                :key="index"
                class="border border-border-default bg-bg-elevated px-3 py-2 font-mono text-xs text-text-primary"
                >{{ node.label }} <span class="text-accent-amber">×{{ node.frequency }}</span></span
              ><span
                v-if="(currentStep.pool?.length ?? 0) > 12"
                class="px-2 py-2 text-xs text-text-dim"
                >+{{ (currentStep.pool?.length ?? 0) - 12 }} nút</span
              >
            </div>
            <p v-else class="mt-4 text-sm text-text-dim">
              Bấm “Sau” để xem các byte và tần suất của chúng.
            </p>
            <div v-if="atEnd" class="mt-5 border-t border-border-default pt-5">
              <p class="mb-3 text-sm text-text-secondary">
                Mã chuẩn tắc: sắp theo độ dài mã, sau đó theo giá trị byte.
              </p>
              <div
                class="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4"
              >
                <div
                  v-for="row in result.codes"
                  :key="row.byte"
                  class="flex items-center justify-between gap-2 border border-border-default bg-bg-deep px-3 py-2 font-mono text-xs"
                >
                  <span class="text-text-secondary"
                    >{{ byteLabel(row.byte) }} ×{{ row.frequency }}</span
                  ><span class="break-all text-accent-sky">{{ row.bits }}</span>
                </div>
              </div>
              <p class="mt-4 break-all font-mono text-xs leading-5 text-accent-amber">
                {{ result.bitPreview }}{{ result.bitCount > result.bitPreview.length ? '…' : '' }}
              </p>
              <p class="mt-2 text-xs text-text-dim">
                Đây là phần đầu của luồng bit, chưa tính các bit đệm cuối byte.
              </p>
            </div>
          </template>
        </section>
        <p v-if="method === 'huffman'" class="mt-5 pb-10 text-xs leading-6 text-text-dim">
          Kích thước Huffman tính cả đầu đề 6 byte (độ dài gốc và số ký hiệu), bảng mã 2 byte cho
          mỗi ký hiệu và các bit được đóng gói. Với dữ liệu ngắn, phần đầu đề có thể lớn hơn phần
          tiết kiệm được.
        </p>
      </template>
      <div
        v-else
        class="mt-5 border border-border-default bg-bg-surface p-8 text-center text-text-secondary"
      >
        {{
          isTooLong
            ? 'Hãy rút ngắn dữ liệu đầu vào để tiếp tục.'
            : 'Nhập một đoạn văn bản để bắt đầu thí nghiệm.'
        }}
      </div>
    </div>
  </main>
</template>
