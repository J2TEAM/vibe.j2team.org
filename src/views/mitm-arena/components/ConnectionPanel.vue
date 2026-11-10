<script setup lang="ts">
import { ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import type { Mode } from '../types'

defineProps<{
  hasRoom: boolean
  isHost: boolean
  busy: boolean
  roomId: string
  offers: { p1: string; p2: string }
  answerCode: string
  connectedSlots: string[]
}>()

const emit = defineEmits<{
  create: [name: string, mode: Mode, stun: string]
  join: [name: string, offer: string, stun: string]
  offer: [slot: 'p1' | 'p2']
  accept: [answer: string]
  cancel: [slot: 'p1' | 'p2']
}>()

const name = ref('')
const mode = ref<Mode>('plain')
const stun = ref('')
const joinCode = ref('')
const response = ref('')
const tab = ref<'create' | 'join'>('create')
const { copy, copied } = useClipboard({ copiedDuring: 1800 })
const copyError = ref('')
const slots = ['p1', 'p2'] as const
const modes = [
  {
    value: 'plain' as const,
    name: 'Tin nhắn rõ',
    detail: 'C đọc và sửa ngay.',
    icon: 'lucide:mail-open',
  },
  {
    value: 'caesar' as const,
    name: 'Mật mã Caesar',
    detail: 'Tìm khóa để mở tin.',
    icon: 'lucide:rotate-cw',
  },
  {
    value: 'authenticated' as const,
    name: 'Có xác thực',
    detail: 'AES-GCM kiểm tra tin.',
    icon: 'lucide:shield-check',
  },
]

function createRoom() {
  emit('create', name.value.trim(), mode.value, stun.value.trim())
}

function joinRoom() {
  emit('join', name.value.trim(), joinCode.value, stun.value.trim())
}

function acceptAnswer() {
  emit('accept', response.value)
}

async function copyCode(code: string) {
  copyError.value = ''
  try {
    await copy(code)
  } catch {
    copyError.value = 'Chưa sao chép được. Hãy chọn toàn bộ mã trong ô và sao chép thủ công.'
  }
}
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-5 sm:p-7"
    aria-labelledby="connection-title"
  >
    <div class="mb-6 flex items-center justify-between gap-3">
      <h2 id="connection-title" class="font-display text-xl font-semibold">
        <span class="mr-2 text-accent-coral">//</span>
        {{ hasRoom ? 'Kết nối phòng' : 'Vào bàn chơi' }}
      </h2>
      <Icon icon="lucide:radio" class="size-5 text-accent-sky" aria-hidden="true" />
    </div>

    <template v-if="!hasRoom && !answerCode">
      <label for="player-name" class="mb-2 block text-sm text-text-secondary">Tên của bạn</label>
      <input
        id="player-name"
        v-model="name"
        data-testid="player-name"
        maxlength="24"
        autocomplete="nickname"
        placeholder="Tên hiển thị trong phòng"
        class="mb-5 w-full border border-border-default bg-bg-deep px-4 py-3 text-text-primary outline-none focus:border-accent-sky"
      />
      <div class="mb-5 grid grid-cols-2 border border-border-default" aria-label="Cách vào phòng">
        <button
          type="button"
          :aria-pressed="tab === 'create'"
          class="px-3 py-3 text-sm transition hover:bg-bg-elevated"
          :class="
            tab === 'create' ? 'bg-accent-coral text-bg-deep font-semibold' : 'text-text-secondary'
          "
          @click="tab = 'create'"
        >
          Tạo phòng
        </button>
        <button
          type="button"
          :aria-pressed="tab === 'join'"
          class="px-3 py-3 text-sm transition hover:bg-bg-elevated"
          :class="
            tab === 'join' ? 'bg-accent-coral text-bg-deep font-semibold' : 'text-text-secondary'
          "
          @click="tab = 'join'"
        >
          Tham gia
        </button>
      </div>

      <div v-if="tab === 'create'" class="space-y-3">
        <p class="text-sm text-text-secondary">
          Chọn cách bảo vệ bản tin. Một ván có 3 vòng, mỗi người thử đủ 3 vai.
        </p>
        <label
          v-for="item in modes"
          :key="item.value"
          class="flex cursor-pointer items-center gap-3 border p-3 transition hover:bg-bg-elevated"
          :class="
            mode === item.value ? 'border-accent-coral bg-accent-coral/5' : 'border-border-default'
          "
        >
          <input
            v-model="mode"
            type="radio"
            name="room-mode"
            :value="item.value"
            class="accent-accent-coral"
          />
          <Icon :icon="item.icon" class="size-5 shrink-0 text-accent-amber" aria-hidden="true" />
          <span
            ><span class="block text-sm font-semibold">{{ item.name }}</span
            ><span class="text-xs text-text-secondary">{{ item.detail }}</span></span
          >
        </label>
      </div>
      <div v-else>
        <label for="join-code" class="mb-2 block text-sm text-text-secondary"
          >Mã mời từ chủ phòng</label
        >
        <textarea
          id="join-code"
          v-model="joinCode"
          data-testid="join-code"
          rows="4"
          spellcheck="false"
          placeholder="Dán toàn bộ mã mời vào đây"
          class="w-full border border-border-default bg-bg-deep p-3 font-mono text-xs outline-none focus:border-accent-sky"
        />
      </div>

      <details class="mt-5 border-t border-border-default pt-4 text-sm">
        <summary class="cursor-pointer text-text-secondary">
          Kết nối giữa các mạng khác nhau
        </summary>
        <p class="mt-3 text-xs leading-relaxed text-text-secondary">
          Cùng mạng nội bộ có thể để trống. Nếu chơi qua Internet, cả ba người nhập địa chỉ STUN
          được tin cậy. STUN chỉ hỗ trợ tìm đường kết nối; NAT hoặc tường lửa có thể vẫn chặn vì
          game chưa cấu hình TURN.
        </p>
        <label for="stun-url" class="mt-3 mb-2 block text-xs text-text-secondary"
          >Địa chỉ STUN (tùy chọn)</label
        >
        <input
          id="stun-url"
          v-model="stun"
          autocomplete="off"
          spellcheck="false"
          placeholder="stun:tên-máy-chủ:cổng"
          class="w-full border border-border-default bg-bg-deep p-3 font-mono text-xs outline-none focus:border-accent-sky"
        />
      </details>

      <button
        v-if="tab === 'create'"
        type="button"
        data-testid="create-room"
        :disabled="busy || !name.trim()"
        class="mt-6 flex w-full items-center justify-center gap-2 bg-accent-coral px-4 py-3 font-semibold text-bg-deep transition hover:bg-accent-amber disabled:cursor-not-allowed disabled:opacity-40"
        @click="createRoom"
      >
        <Icon icon="lucide:plus" class="size-4" aria-hidden="true" />
        {{ busy ? 'Đang tạo…' : 'Tạo phòng 3 người' }}
      </button>
      <button
        v-else
        type="button"
        data-testid="join-room"
        :disabled="busy || !name.trim() || !joinCode.trim()"
        class="mt-6 flex w-full items-center justify-center gap-2 bg-accent-coral px-4 py-3 font-semibold text-bg-deep transition hover:bg-accent-amber disabled:cursor-not-allowed disabled:opacity-40"
        @click="joinRoom"
      >
        <Icon icon="lucide:log-in" class="size-4" aria-hidden="true" />
        {{ busy ? 'Đang tạo mã trả lời…' : 'Tạo mã trả lời' }}
      </button>
    </template>

    <div v-if="answerCode" class="space-y-4">
      <p class="text-sm leading-relaxed text-text-secondary">
        Gửi mã trả lời dưới đây cho chủ phòng. Khi chủ phòng nhập mã, bạn sẽ tự vào sảnh chờ.
      </p>
      <label for="answer-code" class="block text-xs text-accent-sky">Mã trả lời của bạn</label>
      <textarea
        id="answer-code"
        :value="answerCode"
        data-testid="answer-code"
        readonly
        rows="4"
        class="w-full border border-border-default bg-bg-deep p-3 font-mono text-xs"
      />
      <button
        type="button"
        class="inline-flex items-center gap-2 border border-accent-sky px-4 py-2 text-sm text-accent-sky hover:bg-bg-elevated"
        @click="copyCode(answerCode)"
      >
        <Icon icon="lucide:copy" class="size-4" aria-hidden="true" />{{
          copied ? 'Đã sao chép' : 'Sao chép mã trả lời'
        }}
      </button>
      <p class="flex items-center gap-2 text-xs text-accent-amber" role="status">
        <Icon icon="lucide:loader-circle" class="size-4 animate-spin" aria-hidden="true" />Đang đợi
        chủ phòng xác nhận kết nối…
      </p>
    </div>

    <div v-else-if="hasRoom && isHost" class="space-y-5">
      <p class="text-sm leading-relaxed text-text-secondary">
        Tạo mã mời riêng cho từng ghế. Gửi mã cho bạn chơi, rồi dán mã trả lời của họ vào cuối bảng
        này.
      </p>
      <div v-for="(slot, i) in slots" :key="slot" class="border border-border-default p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <p class="font-display text-sm">Ghế {{ i + 2 }}</p>
          <span
            v-if="connectedSlots.includes(slot)"
            class="flex items-center gap-1 text-xs text-accent-sky"
            ><Icon icon="lucide:check" class="size-3" aria-hidden="true" />Đã kết nối</span
          >
          <span v-else class="text-xs text-text-secondary">{{
            offers[slot] ? 'Đang chờ trả lời' : 'Chưa có người'
          }}</span>
        </div>
        <template v-if="!connectedSlots.includes(slot)">
          <button
            v-if="!offers[slot]"
            type="button"
            :data-testid="`invite-${slot}`"
            :disabled="busy"
            class="inline-flex items-center gap-2 border border-accent-coral px-3 py-2 text-sm text-accent-coral transition hover:bg-bg-elevated disabled:opacity-40"
            @click="emit('offer', slot)"
          >
            <Icon icon="lucide:link" class="size-4" aria-hidden="true" />{{
              busy ? 'Đang tạo…' : 'Tạo mã mời'
            }}
          </button>
          <template v-else>
            <label :for="`offer-${slot}`" class="sr-only">Mã mời ghế {{ i + 2 }}</label>
            <textarea
              :id="`offer-${slot}`"
              :value="offers[slot]"
              :data-testid="`offer-${slot}`"
              readonly
              rows="3"
              class="w-full border border-border-default bg-bg-deep p-3 font-mono text-xs"
            />
            <div class="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-xs text-accent-sky hover:underline"
                @click="copyCode(offers[slot])"
              >
                <Icon icon="lucide:copy" class="size-3" aria-hidden="true" />{{
                  copied ? 'Đã sao chép' : 'Sao chép mã'
                }}
              </button>
              <button
                type="button"
                class="text-xs text-text-secondary hover:text-accent-coral"
                @click="emit('cancel', slot)"
              >
                Hủy mã mời
              </button>
            </div>
          </template>
        </template>
      </div>
      <form class="border-t border-border-default pt-4" @submit.prevent="acceptAnswer">
        <label for="guest-answer" class="mb-2 block text-sm text-text-secondary"
          >Mã trả lời từ bạn chơi</label
        >
        <textarea
          id="guest-answer"
          v-model="response"
          data-testid="guest-answer"
          rows="3"
          spellcheck="false"
          placeholder="Dán mã trả lời của ghế 2 hoặc ghế 3"
          class="w-full border border-border-default bg-bg-deep p-3 font-mono text-xs outline-none focus:border-accent-sky"
        />
        <button
          type="submit"
          data-testid="accept-answer"
          :disabled="busy || !response.trim()"
          class="mt-3 border border-accent-sky px-4 py-2 text-sm text-accent-sky hover:bg-bg-elevated disabled:opacity-40"
        >
          Xác nhận kết nối
        </button>
      </form>
    </div>
    <p v-else-if="hasRoom" class="text-sm leading-relaxed text-text-secondary">
      Bạn đã vào phòng <span class="font-mono text-accent-sky">{{ roomId }}</span
      >. Chủ phòng sẽ bắt đầu khi cả 3 người sẵn sàng.
    </p>
    <p v-if="copyError" class="mt-3 text-xs text-accent-amber" role="status">{{ copyError }}</p>
  </section>
</template>
