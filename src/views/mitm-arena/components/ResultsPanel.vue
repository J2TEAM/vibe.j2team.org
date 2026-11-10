<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { Mode, RoomView } from '../types'

const props = defineProps<{ view: RoomView; isHost: boolean; busy: boolean }>()
const emit = defineEmits<{ next: []; restart: [mode: Mode] }>()
const mode = ref<Mode>(props.view.mode)
const selectedRound = ref(0)
const result = computed(() =>
  props.view.phase === 'finished'
    ? (props.view.results[selectedRound.value] ??
      props.view.results[props.view.results.length - 1] ??
      null)
    : props.view.result,
)
const ranking = computed(() => [...props.view.players].sort((a, b) => b.score - a.score))
const modeNames = {
  plain: 'Tin nhắn rõ',
  caesar: 'Mật mã Caesar',
  authenticated: 'Tin nhắn có xác thực',
}
const lessons = {
  plain:
    'Kênh không bảo vệ nội dung cho phép người đứng giữa nghe và sửa tin. Việc tin nhắn đến nơi chưa chứng minh nó còn nguyên vẹn.',
  caesar:
    'Có mã hóa chưa đủ để bảo mật. Caesar dễ phân tích từ quy luật dịch chữ và manh mối đã biết; kết quả này không nói rằng AES có thể bị phá tương tự.',
  authenticated:
    'AES-GCM bảo vệ cả nội dung lẫn tính toàn vẹn: B thực sự giải mã và kiểm tra thẻ xác thực. Bản mã bị sửa không trở thành một tin nhắn hợp lệ.',
}

function playerName(id: string) {
  return props.view.players.find((player) => player.id === id)?.name ?? id
}

function restart() {
  emit('restart', mode.value)
}
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-5 sm:p-7"
    aria-labelledby="result-title"
    data-testid="round-results"
  >
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="mb-2 font-display text-xs tracking-widest text-accent-amber">
          {{ view.phase === 'finished' ? 'CẢ BA ĐÃ ĐỔI ĐỦ VAI' : `VÒNG ${view.round} / 3` }}
        </p>
        <h2 id="result-title" class="font-display text-2xl font-semibold">
          <span class="mr-2 text-accent-coral">//</span
          >{{ view.phase === 'finished' ? 'Tổng kết ván chơi' : 'Mở lại đường đi của bản tin' }}
        </h2>
      </div>
      <Icon
        :icon="view.phase === 'finished' ? 'lucide:trophy' : 'lucide:scan-eye'"
        class="size-7 shrink-0 text-accent-amber"
        aria-hidden="true"
      />
    </div>

    <div v-if="view.phase === 'finished'" class="mb-7">
      <div class="grid gap-3 sm:grid-cols-3">
        <div
          v-for="(player, index) in ranking"
          :key="player.id"
          class="border border-border-default bg-bg-deep p-4"
        >
          <p class="font-display text-xs text-text-secondary">
            {{ index === 0 ? 'ĐIỂM CAO NHẤT' : `HẠNG ${index + 1}` }}
          </p>
          <p class="mt-2 truncate text-sm font-semibold">{{ player.name }}</p>
          <p class="mt-2 font-display text-3xl text-accent-amber">
            {{ player.score }}<span class="ml-2 font-body text-xs text-text-secondary">điểm</span>
          </p>
        </div>
      </div>
      <div class="mt-5 flex flex-wrap gap-2" aria-label="Xem lại từng vòng">
        <button
          v-for="(item, index) in view.results"
          :key="item.round"
          type="button"
          class="border px-3 py-2 text-xs transition hover:bg-bg-elevated"
          :class="
            selectedRound === index
              ? 'border-accent-sky text-accent-sky'
              : 'border-border-default text-text-secondary'
          "
          @click="selectedRound = index"
        >
          Xem vòng {{ item.round }}
        </button>
      </div>
    </div>

    <template v-if="result">
      <div
        class="mb-6 border-l-2 p-4"
        :class="
          result.winner === 'team'
            ? 'border-accent-sky bg-accent-sky/5'
            : result.winner === 'interceptor'
              ? 'border-accent-coral bg-accent-coral/5'
              : 'border-accent-amber bg-accent-amber/5'
        "
      >
        <h3
          class="font-display text-lg"
          :class="
            result.winner === 'team'
              ? 'text-accent-sky'
              : result.winner === 'interceptor'
                ? 'text-accent-coral'
                : 'text-accent-amber'
          "
        >
          {{
            result.winner === 'team'
              ? 'A và B hoàn thành nhiệm vụ · mỗi người +1'
              : result.winner === 'interceptor'
                ? 'B chọn sai cửa · C +1'
                : 'Vòng này không có điểm'
          }}
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-text-secondary" data-testid="result-reason">
          {{ result.reason }}
        </p>
      </div>
      <div class="mb-5 grid grid-cols-2 gap-3 border-y border-border-default py-4">
        <div>
          <p class="text-xs text-text-secondary">Nhiệm vụ ban đầu</p>
          <p class="mt-1 font-display text-lg text-accent-amber">
            Chọn cửa {{ result.targetDoor }}
          </p>
        </div>
        <div>
          <p class="text-xs text-text-secondary">Quyết định của B</p>
          <p class="mt-1 font-display text-lg" data-testid="chosen-door">
            {{ result.chosenDoor ? `Cửa ${result.chosenDoor}` : 'Không chọn cửa' }}
          </p>
        </div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="min-w-0">
          <p class="mb-2 text-xs text-text-secondary">
            A · {{ playerName(result.roles.A) }} · bản gốc
          </p>
          <blockquote
            class="min-h-24 whitespace-pre-wrap break-words border border-border-default bg-bg-deep p-4 text-sm"
            data-testid="revealed-original"
          >
            {{
              result.originalText ||
              (result.mode === 'authenticated' && result.reasonCode !== 'sender-timeout'
                ? 'Đang chờ A công bố bản gốc…'
                : 'A chưa gửi bản tin.')
            }}
          </blockquote>
        </div>
        <div class="min-w-0">
          <p class="mb-2 text-xs text-text-secondary">
            B · {{ playerName(result.roles.B) }} · bản nhận
          </p>
          <blockquote
            class="min-h-24 whitespace-pre-wrap break-words border bg-bg-deep p-4 text-sm"
            :class="result.modified ? 'border-accent-coral/60' : 'border-border-default'"
            data-testid="revealed-received"
          >
            {{
              result.receivedText ??
              (result.authenticated === false
                ? 'Bản mã bị từ chối khi kiểm tra xác thực.'
                : 'Chưa có bản tin được nhận.')
            }}
          </blockquote>
        </div>
      </div>
      <p class="mt-3 text-xs" :class="result.modified ? 'text-accent-coral' : 'text-accent-sky'">
        {{
          result.modified
            ? `C · ${playerName(result.roles.C)} đã chuyển bản tin bị thay đổi.`
            : 'Bản tin không bị thay đổi khi chuyển tiếp.'
        }}
      </p>
      <ol
        class="mt-6 space-y-3 border-t border-border-default pt-5"
        aria-label="Phát lại diễn biến"
      >
        <li
          v-for="(step, index) in result.timeline"
          :key="index"
          class="flex gap-3 text-sm leading-relaxed text-text-secondary"
        >
          <span
            class="flex size-6 shrink-0 items-center justify-center border border-border-default font-mono text-xs text-accent-amber"
            >{{ index + 1 }}</span
          ><span>{{ step }}</span>
        </li>
      </ol>
      <div class="mt-6 border border-accent-sky/40 bg-accent-sky/5 p-4">
        <h3 class="mb-2 flex items-center gap-2 font-display text-sm text-accent-sky">
          <Icon icon="lucide:lightbulb" class="size-4" aria-hidden="true" />Bài học ·
          {{ modeNames[result.mode] }}
        </h3>
        <p class="text-sm leading-relaxed text-text-secondary">{{ lessons[result.mode] }}</p>
        <p class="mt-3 text-xs leading-relaxed text-text-secondary">
          Xác thực nội dung và xác thực người đang nói chuyện là hai việc khác nhau. Trò chơi tin
          cậy chủ phòng để gắn danh tính; đây chưa phải ứng dụng chat E2EE hoàn chỉnh hay hệ thống
          chống gian lận.
        </p>
      </div>
    </template>

    <div class="mt-6 border-t border-border-default pt-5">
      <template v-if="view.phase === 'reveal'"
        ><button
          v-if="isHost"
          type="button"
          data-testid="next-round"
          :disabled="busy"
          class="inline-flex items-center gap-2 bg-accent-coral px-5 py-3 text-sm font-semibold text-bg-deep hover:bg-accent-amber disabled:opacity-40"
          @click="emit('next')"
        >
          {{ view.round === 3 ? 'Xem tổng kết' : 'Đổi vai · vòng tiếp theo'
          }}<Icon icon="lucide:arrow-right" class="size-4" aria-hidden="true" />
        </button>
        <p v-else class="text-sm text-text-secondary">
          Đợi chủ phòng {{ view.round === 3 ? 'mở tổng kết' : 'bắt đầu vòng tiếp theo' }}.
        </p></template
      >
      <template v-else-if="isHost"
        ><label for="next-mode" class="mb-2 block text-sm text-text-secondary"
          >Thử ván mới với chế độ</label
        >
        <div class="flex flex-wrap gap-3">
          <select
            id="next-mode"
            v-model="mode"
            class="min-w-0 flex-1 border border-border-default bg-bg-deep px-3 py-3 text-sm"
          >
            <option value="plain">Tin nhắn rõ</option>
            <option value="caesar">Mật mã Caesar</option>
            <option value="authenticated">Tin nhắn có xác thực</option></select
          ><button
            type="button"
            data-testid="restart-game"
            :disabled="busy"
            class="bg-accent-coral px-5 py-3 text-sm font-semibold text-bg-deep hover:bg-accent-amber disabled:opacity-40"
            @click="restart"
          >
            Về sảnh · ván mới
          </button>
        </div></template
      >
      <p v-else class="text-sm text-text-secondary">
        Chủ phòng có thể đưa cả bàn về sảnh để thử chế độ khác.
      </p>
    </div>
  </section>
</template>
