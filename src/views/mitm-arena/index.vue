<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useArena } from './composables/use-arena'
import ConnectionPanel from './components/ConnectionPanel.vue'
import PlayerRoster from './components/PlayerRoster.vue'
import RolePanel from './components/RolePanel.vue'
import ResultsPanel from './components/ResultsPanel.vue'

const {
  view,
  isHost,
  busy,
  error,
  offerCodes,
  answerCode,
  remaining,
  receivedText,
  sentText,
  receiptStatus,
  cryptoReady,
  connectionStatus,
  create,
  join,
  createOffer,
  acceptAnswer,
  cancelOffer,
  ready,
  start,
  send,
  unlock,
  forward,
  decide,
  reject,
  next,
  restart,
  leave,
} = useArena()
const modeNames = {
  plain: 'Tin nhắn rõ',
  caesar: 'Mật mã Caesar',
  authenticated: 'Có xác thực · AES-GCM',
}
const connectedSlots = computed(
  () => view.value?.players.filter((player) => player.connected).map((player) => player.id) ?? [],
)
const playing = computed(
  () =>
    view.value?.phase === 'compose' ||
    view.value?.phase === 'intercept' ||
    view.value?.phase === 'decide',
)
const pathway = [
  {
    role: 'A',
    name: 'Gửi chỉ dẫn',
    icon: 'lucide:send',
    description: 'Nhận nhiệm vụ riêng. Viết tin để B chọn đúng cửa.',
  },
  {
    role: 'C',
    name: 'Đứng giữa',
    icon: 'lucide:scan-line',
    description: 'Giữ bản tin, thử đọc và sửa để B đi sai hướng.',
  },
  {
    role: 'B',
    name: 'Đưa quyết định',
    icon: 'lucide:door-open',
    description: 'Đọc tin được chuyển đến. Chọn một trong ba cửa.',
  },
]
</script>

<template>
  <main class="min-h-screen bg-bg-deep font-body text-text-primary">
    <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
      <nav
        class="mb-9 flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-4"
        aria-label="Điều hướng trang"
      >
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-accent-coral"
          ><Icon icon="lucide:arrow-left" class="size-4" aria-hidden="true" />Trang chủ</RouterLink
        >
        <span class="font-display text-xs tracking-widest text-text-secondary"
          >DUC / MITM ARENA</span
        >
      </nav>

      <header class="mb-8 animate-fade-up">
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <span
            class="bg-accent-coral px-3 py-1 font-display text-[10px] font-semibold tracking-widest text-bg-deep"
            >3 NGƯỜI · 3 VAI · 3 VÒNG</span
          ><span class="text-xs text-text-secondary">Một bản tin. Hai phiên bản sự thật.</span>
        </div>
        <h1
          class="max-w-3xl font-display text-4xl leading-tight font-bold tracking-tight sm:text-6xl"
        >
          Tin Nhắn<br class="sm:hidden" />
          <span class="text-accent-coral">Giữa Đường</span>
        </h1>
        <p class="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
          {{
            view
              ? 'Cùng một phòng, mỗi vai có một góc nhìn riêng. Toàn bộ đường đi của bản tin chỉ được mở khi vòng kết thúc.'
              : 'Bạn có tin lời nhắn vừa nhận? Cùng hai người bạn trải nghiệm việc bản tin bị đọc, bị sửa — và cách xác thực bảo vệ nó.'
          }}
        </p>
      </header>

      <div
        v-if="error"
        class="mb-5 flex items-start justify-between gap-3 border border-accent-coral bg-accent-coral/5 p-4 text-sm"
        role="alert"
        data-testid="arena-error"
      >
        <div class="flex items-start gap-3">
          <Icon
            icon="lucide:circle-alert"
            class="mt-0.5 size-5 shrink-0 text-accent-coral"
            aria-hidden="true"
          /><span class="leading-relaxed">{{ error }}</span>
        </div>
        <button
          type="button"
          aria-label="Đóng thông báo"
          class="p-1 text-text-secondary hover:text-text-primary"
          @click="error = ''"
        >
          <Icon icon="lucide:x" class="size-4" aria-hidden="true" />
        </button>
      </div>

      <div
        v-if="view"
        class="mb-5 flex flex-wrap items-center justify-between gap-3 border border-border-default bg-bg-surface px-4 py-3"
      >
        <div class="min-w-0">
          <span class="mr-3 inline-flex items-center gap-2 text-xs text-accent-sky"
            ><Icon icon="lucide:radio" class="size-3" aria-hidden="true" />{{
              modeNames[view.mode]
            }}</span
          ><span
            class="block truncate pt-1 font-mono text-[10px] text-text-secondary sm:inline sm:pt-0"
            data-testid="room-id"
            >Phòng {{ view.roomId }}</span
          >
        </div>
        <button
          type="button"
          data-testid="leave-room"
          class="inline-flex shrink-0 items-center gap-2 text-xs text-text-secondary hover:text-accent-coral"
          @click="leave"
        >
          <Icon icon="lucide:log-out" class="size-3" aria-hidden="true" />Rời phòng
        </button>
      </div>

      <div v-if="!view" class="grid items-start gap-5 lg:grid-cols-[1fr_1.05fr]">
        <ConnectionPanel
          :has-room="false"
          :is-host="isHost"
          :busy="busy"
          room-id=""
          :offers="offerCodes"
          :answer-code="answerCode"
          :connected-slots="connectedSlots"
          @create="create"
          @join="join"
          @offer="createOffer"
          @accept="acceptAnswer"
          @cancel="cancelOffer"
        />
        <section
          class="animate-fade-up animate-delay-2 border border-border-default bg-bg-surface p-5 sm:p-7"
          aria-labelledby="howto-title"
        >
          <h2 id="howto-title" class="mb-6 font-display text-xl font-semibold">
            <span class="mr-2 text-accent-amber">//</span>Bản tin đi qua những ai?
          </h2>
          <ol class="space-y-5">
            <li v-for="(item, index) in pathway" :key="item.role" class="relative flex gap-4">
              <div class="relative">
                <span
                  class="flex size-12 items-center justify-center border bg-bg-deep font-display text-2xl font-bold"
                  :class="
                    item.role === 'C'
                      ? 'border-accent-amber text-accent-amber'
                      : 'border-accent-sky/60 text-accent-sky'
                  "
                  >{{ item.role }}</span
                >
                <div
                  v-if="index < pathway.length - 1"
                  class="absolute top-12 bottom-[-1.25rem] left-6 border-l border-dashed border-border-default"
                />
              </div>
              <div class="min-w-0 pb-1">
                <h3 class="mb-1 flex items-center gap-2 font-display text-base font-semibold">
                  <Icon :icon="item.icon" class="size-4 text-text-secondary" aria-hidden="true" />{{
                    item.name
                  }}
                </h3>
                <p class="text-sm leading-relaxed text-text-secondary">{{ item.description }}</p>
              </div>
            </li>
          </ol>
          <div class="mt-6 border-t border-border-default pt-5">
            <h3 class="mb-2 font-display text-sm text-accent-coral">Bắt đầu cùng bạn bè</h3>
            <ol class="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-text-secondary">
              <li>Mỗi người mở trang này trên trình duyệt hoặc thiết bị riêng.</li>
              <li>Một người tạo phòng và tạo hai mã mời cho hai ghế.</li>
              <li>Mỗi bạn dán mã mời, tạo mã trả lời và gửi lại chủ phòng.</li>
              <li>Chủ phòng nhập hai mã trả lời. Cả ba nhấn sẵn sàng rồi bắt đầu.</li>
            </ol>
          </div>
          <p
            class="mt-5 border-l-2 border-accent-amber bg-accent-amber/5 p-3 text-xs leading-relaxed text-text-secondary"
          >
            <strong class="font-semibold text-accent-amber">Đây là game mô phỏng.</strong> C can
            thiệp vào bản tin của trò chơi; không nghe lén hay phá mã hóa WebRTC/TLS thật.
          </p>
        </section>
      </div>

      <div
        v-else-if="view.phase === 'lobby'"
        class="grid items-start gap-5 lg:grid-cols-[1fr_1.05fr]"
      >
        <PlayerRoster :view="view" :busy="busy" :is-host="isHost" @ready="ready" @start="start" />
        <ConnectionPanel
          :has-room="true"
          :is-host="isHost"
          :busy="busy"
          :room-id="view.roomId"
          :offers="offerCodes"
          :answer-code="answerCode"
          :connected-slots="connectedSlots"
          @create="create"
          @join="join"
          @offer="createOffer"
          @accept="acceptAnswer"
          @cancel="cancelOffer"
        />
      </div>

      <div v-else-if="playing" class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <RolePanel
          :view="view"
          :busy="busy"
          :remaining="remaining"
          :received-text="receivedText"
          :sent-text="sentText"
          :receipt-status="receiptStatus"
          :crypto-ready="cryptoReady"
          @compose="send"
          @unlock="unlock"
          @forward="forward"
          @decide="decide"
          @reject="reject"
        />
        <PlayerRoster :view="view" :busy="busy" :is-host="isHost" @ready="ready" @start="start" />
      </div>

      <div
        v-else-if="view.phase === 'reveal' || view.phase === 'finished'"
        class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]"
      >
        <ResultsPanel :view="view" :is-host="isHost" :busy="busy" @next="next" @restart="restart" />
        <PlayerRoster :view="view" :busy="busy" :is-host="isHost" @ready="ready" @start="start" />
      </div>

      <section
        v-else-if="view.phase === 'aborted'"
        class="border border-accent-amber/50 bg-bg-surface p-6 sm:p-8"
        aria-labelledby="aborted-title"
      >
        <Icon icon="lucide:unplug" class="mb-4 size-8 text-accent-amber" aria-hidden="true" />
        <h2 id="aborted-title" class="mb-3 font-display text-2xl">
          <span class="mr-2 text-accent-amber">//</span>Ván chơi đã dừng
        </h2>
        <p class="max-w-xl text-sm leading-relaxed text-text-secondary">
          {{ view.notice || 'Một người đã mất kết nối hoặc rời phòng.' }} Game chưa hỗ trợ chuyển
          quyền chủ phòng hoặc khôi phục phiên khi tải lại trang. Hãy rời phòng và tạo ván mới.
        </p>
        <button
          type="button"
          class="mt-5 bg-accent-coral px-5 py-3 text-sm font-semibold text-bg-deep hover:bg-accent-amber"
          @click="leave"
        >
          Rời phòng · tạo ván mới
        </button>
      </section>

      <p
        v-if="view?.notice && view.phase !== 'aborted'"
        class="mt-4 border-l-2 border-accent-amber pl-3 text-xs leading-relaxed text-accent-amber"
        role="status"
      >
        {{ view.notice }}
      </p>
      <p v-if="!view && answerCode" class="mt-4 text-xs text-text-secondary" role="status">
        {{
          connectionStatus.host === 'error'
            ? 'Kết nối chưa thành công. Kiểm tra mã trả lời và mạng của cả hai bên.'
            : 'Đang chờ kết nối WebRTC với chủ phòng.'
        }}<button type="button" class="ml-3 text-accent-coral hover:underline" @click="leave">
          Hủy kết nối
        </button>
      </p>

      <footer
        class="mt-8 border-t border-border-default pt-5 text-xs leading-relaxed text-text-secondary"
      >
        <details>
          <summary class="cursor-pointer text-text-secondary hover:text-text-primary">
            Hiểu đúng về kết nối và mô hình tin cậy
          </summary>
          <div class="mt-3 max-w-3xl space-y-2">
            <p>
              Dữ liệu chạy qua WebRTC DataChannel giữa chủ phòng và hai người chơi. Việc sao
              chép/dán mã mời và mã trả lời là signaling thủ công. STUN (nếu nhập) hỗ trợ vượt NAT;
              game chưa có TURN để bảo đảm kết nối qua mọi mạng.
            </p>
            <p>
              Không dùng database, không gửi lịch sử trò chuyện lên dịch vụ ngoài. Chủ phòng là
              nguồn trạng thái được tin cậy; khóa AES-GCM mới được A/B tự thiết lập ở mỗi vòng. Đây
              là mô hình giáo dục, chưa phải ứng dụng chat E2EE hoàn chỉnh hoặc hệ thống chống gian
              lận.
            </p>
            <p>
              Đóng trang, tải lại hoặc rời phòng sẽ mất phiên. Game chưa hỗ trợ host migration hay
              khôi phục phòng. Dùng HTTPS hoặc localhost để Web Crypto hoạt động.
            </p>
          </div>
        </details>
      </footer>
    </div>
  </main>
</template>
