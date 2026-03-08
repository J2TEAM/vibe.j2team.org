<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-bg-deep border border-border-default shadow-2xl"
        >
          <!-- Header -->
          <div
            class="sticky top-0 z-10 bg-bg-deep border-b border-border-default px-6 py-4 flex items-center justify-between"
          >
            <div>
              <h2 class="font-display text-xl font-bold text-text-primary">
                Cách gửi file với Peer Drop
              </h2>
              <p class="text-xs text-text-dim mt-1">Chỉ 4 bước đơn giản!</p>
            </div>
            <button
              class="text-text-dim hover:text-text-primary transition p-1"
              @click="emit('close')"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 5L15 15M15 5L5 15"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <!-- Steps -->
          <div class="px-6 py-6 space-y-8">
            <!-- Step 1 -->
            <section>
              <h3
                class="font-display text-lg font-semibold text-accent-coral mb-1 flex items-center gap-2"
              >
                <span
                  class="inline-flex items-center justify-center w-7 h-7 border border-accent-coral text-sm"
                  >1</span
                >
                Chọn file
              </h3>
              <p class="text-sm text-text-secondary">
                Kéo thả hoặc bấm chọn file bạn muốn gửi. Hỗ trợ nhiều file cùng lúc.
              </p>
            </section>

            <!-- Step 2 -->
            <section>
              <h3
                class="font-display text-lg font-semibold text-accent-amber mb-1 flex items-center gap-2"
              >
                <span
                  class="inline-flex items-center justify-center w-7 h-7 border border-accent-amber text-sm"
                  >2</span
                >
                Tạo link mời & gửi cho người nhận
              </h3>
              <p class="text-sm text-text-secondary">
                Bấm <strong class="text-text-primary">Tạo link mời</strong>, link sẽ tự động copy.
                Gửi link qua Messenger, Zalo, Telegram...
              </p>
            </section>

            <!-- Step 3 -->
            <section>
              <h3
                class="font-display text-lg font-semibold text-accent-sky mb-1 flex items-center gap-2"
              >
                <span
                  class="inline-flex items-center justify-center w-7 h-7 border border-accent-sky text-sm"
                  >3</span
                >
                Người nhận mở link & gửi mã trả lời
              </h3>
              <p class="text-sm text-text-secondary">
                Người nhận mở link &rarr; bấm
                <strong class="text-text-primary">Nhận file</strong> &rarr; copy
                <strong class="text-text-primary">mã trả lời</strong> gửi lại cho bạn.
              </p>
            </section>

            <!-- Step 4 -->
            <section>
              <h3
                class="font-display text-lg font-semibold text-accent-coral mb-1 flex items-center gap-2"
              >
                <span
                  class="inline-flex items-center justify-center w-7 h-7 border border-accent-coral text-sm"
                  >4</span
                >
                Dán mã trả lời & chuyển file tự động!
              </h3>
              <p class="text-sm text-text-secondary">
                Bạn dán mã trả lời vào &rarr; kết nối thành công &rarr; file được gửi trực tiếp P2P.
                Người nhận tải file về máy ngay khi hoàn tất.
              </p>
            </section>

            <!-- Note -->
            <div class="border border-border-default bg-bg-surface p-4">
              <p class="text-xs text-text-dim">
                <strong class="text-text-secondary">Lưu ý:</strong>
                File được gửi trực tiếp giữa 2 trình duyệt qua WebRTC, không qua bất kỳ server nào.
                Bảo mật tuyệt đối — không ai có thể đọc được file của bạn.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="sticky bottom-0 bg-bg-deep border-t border-border-default px-6 py-4">
            <button
              class="w-full border border-accent-coral bg-accent-coral/10 px-4 py-2.5 text-sm font-display text-accent-coral transition hover:bg-accent-coral/20"
              @click="emit('close')"
            >
              Đã hiểu!
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div {
  transform: scale(0.95) translateY(10px);
}
.modal-leave-to > div {
  transform: scale(0.95) translateY(10px);
}
</style>
