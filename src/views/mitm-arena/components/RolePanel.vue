<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import type { Door, RoomView } from '../types'
import { caesar } from '../utils/crypto'

const props = defineProps<{
  view: RoomView
  busy: boolean
  remaining: number
  receivedText: string | null
  sentText: string
  receiptStatus: 'waiting' | 'verified' | 'invalid' | 'plain'
  cryptoReady: boolean
}>()
const emit = defineEmits<{
  compose: [text: string]
  unlock: [key: number]
  forward: [text: string | null, tamper: boolean]
  decide: [door: Door]
  reject: []
}>()
const draft = ref('')
const modified = ref('')
const key = ref(1)
const doors: Door[] = [1, 2, 3]
const preview = computed(() =>
  Number.isInteger(key.value) && key.value >= 1 && key.value <= 25
    ? caesar(props.view.caesarHint ?? '', -key.value)
    : 'Chọn khóa nguyên từ 1 đến 25.',
)
const roleNames = { A: 'Người gửi', B: 'Người nhận', C: 'Người đứng giữa' }
const stageNames = {
  compose: 'A đang soạn tin',
  intercept: 'C đang giữ bản tin',
  decide: 'B đang chọn cửa',
}
const currentStage = computed(() =>
  props.view.phase === 'compose' ||
  props.view.phase === 'intercept' ||
  props.view.phase === 'decide'
    ? stageNames[props.view.phase]
    : '',
)
const canEdit = computed(() => props.view.mode === 'plain' || !!props.view.unlocked)

watch(
  () => props.view.round,
  () => {
    draft.value = ''
    modified.value = ''
    key.value = 1
  },
)
watch(
  () => props.view.interceptedText,
  (text) => {
    if (typeof text === 'string') modified.value = text
  },
)

function compose() {
  emit('compose', draft.value)
}
function unlock() {
  emit('unlock', key.value)
}
function forwardOriginal() {
  emit('forward', null, false)
}
function forwardModified() {
  emit('forward', modified.value, false)
}
function tamper() {
  emit('forward', null, true)
}
</script>

<template>
  <section class="border border-border-default bg-bg-surface" aria-labelledby="role-title">
    <div
      class="flex flex-wrap items-center justify-between gap-4 border-b border-border-default px-5 py-4 sm:px-7"
    >
      <div>
        <p class="mb-1 font-display text-xs tracking-widest text-accent-coral">
          VÒNG {{ view.round }} / 3
        </p>
        <h2 id="role-title" class="font-display text-xl font-semibold">
          <span class="mr-2 text-accent-coral">//</span>{{ view.role }} — {{ roleNames[view.role] }}
        </h2>
      </div>
      <div
        class="border border-border-default bg-bg-deep px-4 py-2 text-right"
        role="timer"
        aria-label="Thời gian còn lại"
      >
        <span
          class="font-display text-2xl tabular-nums"
          :class="remaining <= 10 ? 'text-accent-coral' : 'text-accent-amber'"
          >{{ remaining }}<span class="ml-1 text-xs">giây</span></span
        >
        <p class="text-[10px] text-text-secondary">{{ currentStage }}</p>
      </div>
    </div>

    <div class="p-5 sm:p-7">
      <template v-if="view.role === 'A'">
        <div class="mb-5 border-l-2 border-accent-sky bg-accent-sky/5 p-4">
          <p class="mb-2 flex items-center gap-2 text-xs font-semibold text-accent-sky">
            <Icon icon="lucide:eye-off" class="size-4" aria-hidden="true" />NHIỆM VỤ RIÊNG CỦA A
          </p>
          <p class="text-lg">
            Hướng dẫn B chọn <strong class="text-accent-amber">cửa số {{ view.targetDoor }}</strong
            >.
          </p>
          <p class="mt-2 text-xs leading-relaxed text-text-secondary">
            Chỉ quyết định cuối cùng của B mới được tính điểm. Không chia sẻ màn hình nhiệm vụ.
          </p>
        </div>
        <template v-if="view.phase === 'compose'">
          <label for="message-draft" class="mb-2 block text-sm text-text-secondary"
            >Bản tin gửi cho B</label
          >
          <textarea
            id="message-draft"
            v-model="draft"
            data-testid="message-draft"
            maxlength="180"
            rows="4"
            placeholder="Viết hướng dẫn ngắn cho người nhận…"
            class="w-full border border-border-default bg-bg-deep p-4 text-sm outline-none focus:border-accent-sky"
          />
          <div class="mt-2 flex items-center justify-between gap-3 text-xs text-text-secondary">
            <span>{{
              view.mode === 'authenticated'
                ? 'Mã hóa AES-GCM trước khi gửi.'
                : view.mode === 'caesar'
                  ? 'Game sẽ biến đổi bằng Caesar.'
                  : 'C có thể đọc bản tin này.'
            }}</span
            ><span class="shrink-0 tabular-nums">{{ draft.length }}/180</span>
          </div>
          <p
            v-if="view.mode === 'authenticated' && !cryptoReady"
            class="mt-3 text-xs text-accent-amber"
            role="status"
          >
            Đang thiết lập khóa riêng giữa A và B…
          </p>
          <button
            type="button"
            data-testid="send-message"
            :disabled="busy || !draft.trim() || (view.mode === 'authenticated' && !cryptoReady)"
            class="mt-5 inline-flex items-center gap-2 bg-accent-coral px-5 py-3 text-sm font-semibold text-bg-deep hover:bg-accent-amber disabled:cursor-not-allowed disabled:opacity-40"
            @click="compose"
          >
            <Icon icon="lucide:send" class="size-4" aria-hidden="true" />Gửi bản tin
          </button>
        </template>
        <template v-else>
          <p class="mb-2 text-xs text-text-secondary">Bản gốc bạn đã gửi</p>
          <blockquote
            class="whitespace-pre-wrap break-words border border-border-default bg-bg-deep p-4 text-sm"
            data-testid="original-message"
          >
            {{ sentText || view.originalText }}
          </blockquote>
          <p class="mt-5 flex items-start gap-2 text-sm leading-relaxed text-text-secondary">
            <Icon
              icon="lucide:hourglass"
              class="mt-0.5 size-4 shrink-0 text-accent-amber"
              aria-hidden="true"
            />{{
              view.phase === 'intercept'
                ? 'Bản tin đang trên đường đến B. Chờ giai đoạn can thiệp kết thúc.'
                : 'B đang quyết định. Nội dung chuyển đến sẽ được công bố cuối vòng.'
            }}
          </p>
        </template>
      </template>

      <template v-else-if="view.role === 'C' && view.phase === 'intercept'">
        <p class="mb-5 text-sm leading-relaxed text-text-secondary">
          Mục tiêu của bạn: khiến B chọn sai cửa. Bạn không được biết chỉ thị riêng của A. Sửa tin
          rồi B vẫn chọn đúng thì bạn không có điểm.
        </p>
        <template v-if="view.mode === 'authenticated'">
          <div class="mb-5 flex items-start gap-3 border border-accent-sky/40 bg-accent-sky/5 p-4">
            <Icon
              icon="lucide:lock-keyhole"
              class="mt-0.5 size-5 shrink-0 text-accent-sky"
              aria-hidden="true"
            />
            <p class="text-sm leading-relaxed">
              Bạn chỉ nhận bản mã. Không có câu đố nào cấp cho C khóa AES-GCM.
            </p>
          </div>
          <p class="mb-2 text-xs text-text-secondary">Bản mã Base64</p>
          <pre
            data-testid="ciphertext"
            class="max-h-40 overflow-auto whitespace-pre-wrap break-all border border-border-default bg-bg-deep p-4 font-mono text-xs leading-relaxed text-accent-amber"
            >{{ view.envelope?.ciphertext }}</pre
          >
          <div class="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              data-testid="forward-original"
              :disabled="busy"
              class="border border-accent-sky px-4 py-3 text-sm text-accent-sky hover:bg-bg-elevated disabled:opacity-40"
              @click="forwardOriginal"
            >
              Chuyển nguyên bản</button
            ><button
              type="button"
              data-testid="tamper-ciphertext"
              :disabled="busy"
              class="inline-flex items-center gap-2 border border-accent-coral px-4 py-3 text-sm text-accent-coral hover:bg-bg-elevated disabled:opacity-40"
              @click="tamper"
            >
              <Icon icon="lucide:scissors" class="size-4" aria-hidden="true" />Đổi 1 byte rồi chuyển
            </button>
          </div>
          <p class="mt-4 text-xs leading-relaxed text-text-secondary">
            B sẽ giải mã và kiểm tra thẻ xác thực thật. Sửa bản mã không đồng nghĩa với đọc được
            hoặc tạo được tin hợp lệ.
          </p>
        </template>
        <template v-else>
          <div
            v-if="view.mode === 'caesar' && !view.unlocked"
            class="mb-5 space-y-4 border border-accent-amber/40 p-4"
          >
            <h3 class="font-display text-base text-accent-amber">Tìm khóa dịch chữ</h3>
            <p class="text-xs leading-relaxed text-text-secondary">
              Caesar chỉ dịch A–Z/a–z không kèm dấu tổ hợp. Chữ có dấu, số và emoji được giữ nguyên.
              Đây là mật mã cổ điển, không phải AES.
            </p>
            <p class="text-sm">
              Manh mối: <span class="font-mono text-accent-sky">HELLO</span> →
              <span class="font-mono text-accent-amber">{{ view.caesarHint }}</span>
            </p>
            <p class="text-xs text-text-secondary">Bản mã</p>
            <pre
              class="whitespace-pre-wrap break-words bg-bg-deep p-3 font-mono text-xs text-accent-amber"
              data-testid="caesar-ciphertext"
              >{{ view.ciphertext }}</pre
            >
            <label for="caesar-key" class="flex items-center justify-between gap-3 text-sm"
              >Thử khóa <span class="font-mono text-accent-amber">{{ key }}</span></label
            >
            <input
              id="caesar-key"
              v-model.number="key"
              type="range"
              min="1"
              max="25"
              step="1"
              class="w-full accent-accent-amber"
            />
            <div class="flex items-center gap-3">
              <input
                v-model.number="key"
                data-testid="caesar-key"
                type="number"
                min="1"
                max="25"
                aria-label="Khóa Caesar muốn trả lời"
                class="w-20 border border-border-default bg-bg-deep px-3 py-2 font-mono text-sm"
              /><button
                type="button"
                data-testid="unlock-caesar"
                :disabled="busy || key < 1 || key > 25 || !Number.isInteger(key)"
                class="border border-accent-amber px-3 py-2 text-sm text-accent-amber hover:bg-bg-elevated disabled:opacity-40"
                @click="unlock"
              >
                Xác nhận khóa
              </button>
            </div>
            <p class="text-xs text-text-secondary">
              Dịch thử manh mối với khóa đang chọn (kết quả cần là HELLO)
            </p>
            <p
              class="whitespace-pre-wrap break-words bg-bg-deep p-3 text-sm"
              data-testid="caesar-preview"
            >
              {{ preview }}
            </p>
            <p class="text-xs leading-relaxed text-text-secondary">
              Công cụ giúp phân tích khóa; chỉ khi trả lời đúng mới mở quyền sửa và chuyển bản sửa.
            </p>
          </div>
          <template v-if="canEdit">
            <p
              v-if="view.mode === 'caesar'"
              class="mb-3 flex items-center gap-2 text-sm text-accent-sky"
            >
              <Icon icon="lucide:unlock-keyhole" class="size-4" aria-hidden="true" />Khóa đúng. Bạn
              đã mở bản tin.
            </p>
            <p class="mb-2 text-xs text-text-secondary">Bản tin bị chặn</p>
            <blockquote
              class="mb-4 whitespace-pre-wrap break-words border border-border-default bg-bg-deep p-4 text-sm"
              data-testid="intercepted-message"
            >
              {{ view.interceptedText }}
            </blockquote>
            <label for="modified-message" class="mb-2 block text-sm text-text-secondary"
              >Bản tin bạn muốn chuyển đến B</label
            >
            <textarea
              id="modified-message"
              v-model="modified"
              data-testid="modified-message"
              maxlength="180"
              rows="4"
              class="w-full border border-border-default bg-bg-deep p-4 text-sm outline-none focus:border-accent-amber"
            />
            <p class="mt-1 text-right text-xs tabular-nums text-text-secondary">
              {{ modified.length }}/180
            </p>
          </template>
          <div class="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              data-testid="forward-original"
              :disabled="busy"
              class="border border-accent-sky px-4 py-3 text-sm text-accent-sky hover:bg-bg-elevated disabled:opacity-40"
              @click="forwardOriginal"
            >
              Chuyển nguyên bản</button
            ><button
              v-if="canEdit"
              type="button"
              data-testid="forward-modified"
              :disabled="busy || !modified.trim()"
              class="bg-accent-coral px-4 py-3 text-sm font-semibold text-bg-deep hover:bg-accent-amber disabled:opacity-40"
              @click="forwardModified"
            >
              Chuyển bản sửa
            </button>
          </div>
        </template>
      </template>

      <template v-else-if="view.role === 'B' && view.phase === 'decide'">
        <div
          v-if="receiptStatus === 'invalid'"
          class="border border-accent-coral bg-accent-coral/5 p-5"
          role="alert"
          data-testid="authentication-failed"
        >
          <Icon
            icon="lucide:shield-alert"
            class="mb-3 size-7 text-accent-coral"
            aria-hidden="true"
          />
          <h3 class="mb-2 font-display text-lg text-accent-coral">Không xác thực được bản tin</h3>
          <p class="text-sm leading-relaxed text-text-secondary">
            AES-GCM đã từ chối bản mã khi giải mã. Bản tin không đủ điều kiện để chọn cửa; hãy từ
            chối nhận.
          </p>
          <button
            type="button"
            data-testid="reject-message"
            :disabled="busy"
            class="mt-4 border border-accent-coral px-4 py-3 text-sm text-accent-coral hover:bg-bg-elevated disabled:opacity-40"
            @click="emit('reject')"
          >
            Từ chối bản tin
          </button>
        </div>
        <template v-else-if="receivedText !== null">
          <p
            v-if="receiptStatus === 'verified'"
            class="mb-3 flex items-center gap-2 text-xs text-accent-sky"
          >
            <Icon icon="lucide:shield-check" class="size-4" aria-hidden="true" />AES-GCM: đã xác
            thực khi giải mã
          </p>
          <p v-else class="mb-3 flex items-center gap-2 text-xs text-accent-amber">
            <Icon icon="lucide:mail" class="size-4" aria-hidden="true" />Bản tin đã đến · chưa có
            xác thực nội dung
          </p>
          <blockquote
            data-testid="received-message"
            class="whitespace-pre-wrap break-words border-l-2 border-accent-sky bg-bg-deep p-5 text-lg leading-relaxed"
          >
            {{ receivedText }}
          </blockquote>
          <h3 class="mt-6 mb-3 font-display text-base">Bạn sẽ mở cửa nào?</h3>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="door in doors"
              :key="door"
              type="button"
              :data-testid="`choose-door-${door}`"
              :disabled="busy || receiptStatus === 'waiting'"
              class="flex flex-col items-center gap-2 border border-border-default bg-bg-deep px-2 py-5 transition hover:border-accent-sky hover:bg-bg-elevated disabled:opacity-40"
              @click="emit('decide', door)"
            >
              <Icon
                icon="lucide:door-closed"
                class="size-7 text-accent-sky"
                aria-hidden="true"
              /><span class="font-display text-lg">Cửa {{ door }}</span>
            </button>
          </div>
          <p class="mt-4 text-xs leading-relaxed text-text-secondary">
            Bạn chỉ thấy bản tin được chuyển đến. Bản gốc và diễn biến can thiệp sẽ mở sau quyết
            định này.
          </p>
        </template>
        <p v-else class="flex items-center gap-2 text-sm text-text-secondary" role="status">
          <Icon
            icon="lucide:loader-circle"
            class="size-4 animate-spin text-accent-amber"
            aria-hidden="true"
          />Đang giải mã và kiểm tra bản tin…
        </p>
      </template>

      <div v-else class="py-8 text-center">
        <Icon
          icon="lucide:hourglass"
          class="mx-auto mb-4 size-9 text-accent-amber"
          aria-hidden="true"
        />
        <h3 class="mb-2 font-display text-lg">
          {{
            view.phase === 'compose'
              ? 'Chờ A gửi bản tin'
              : view.role === 'B'
                ? 'Bản tin chưa đến'
                : 'Chờ B đưa ra quyết định'
          }}
        </h3>
        <p class="mx-auto max-w-md text-sm leading-relaxed text-text-secondary">
          {{
            view.phase === 'compose'
              ? 'A nhận nhiệm vụ riêng và có thời gian soạn tin. Bạn sẽ thấy phần dành cho vai của mình ở giai đoạn tiếp theo.'
              : view.role === 'B'
                ? 'Bản tin đang được chuyển. Bạn chưa thể biết có nội dung nào bị thay đổi.'
                : 'Phần can thiệp đã kết thúc. Diễn biến và điểm số sẽ được công bố cuối vòng.'
          }}
        </p>
      </div>
      <p
        class="mt-6 border-t border-border-default pt-4 text-xs leading-relaxed text-text-secondary"
      >
        Hết giờ: A không gửi hoặc B không chọn thì không ai có điểm; C không chuyển thì game chuyển
        bản gốc.
      </p>
    </div>
  </section>
</template>
