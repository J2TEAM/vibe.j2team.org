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
                Cách gọi video Peer Call
              </h2>
              <p class="text-xs text-text-dim mt-1">Chỉ 3 bước đơn giản!</p>
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
          <div class="px-6 py-6 space-y-10">
            <!-- Step 1: Tao phong -->
            <section>
              <h3
                class="font-display text-lg font-semibold text-accent-coral mb-1 flex items-center gap-2"
              >
                <span
                  class="inline-flex items-center justify-center w-7 h-7 border border-accent-coral text-sm"
                  >1</span
                >
                Tạo phòng & Copy link
              </h3>
              <p class="text-sm text-text-secondary mb-4">
                Bạn bấm <strong class="text-text-primary">Tạo phòng</strong>, link mời sẽ tự động
                được copy. Ngoài ra có thể copy
                <strong class="text-text-primary">mã mời</strong> thủ công nếu cần.
              </p>
              <!-- SVG: Phone A creates room, Phone B waiting -->
              <svg viewBox="0 0 480 160" class="w-full" xmlns="http://www.w3.org/2000/svg">
                <!-- Phone A -->
                <rect
                  x="40"
                  y="20"
                  width="80"
                  height="120"
                  rx="10"
                  fill="#1a1a2e"
                  stroke="#ff6b6b"
                  stroke-width="1.5"
                  class="animate-step1-phone-a"
                />
                <rect x="52" y="36" width="56" height="80" rx="2" fill="#16213e" />
                <text
                  x="80"
                  y="60"
                  text-anchor="middle"
                  fill="#ff6b6b"
                  font-size="8"
                  font-weight="bold"
                  class="font-display"
                >
                  Tạo phòng
                </text>
                <!-- Pulse ring on button -->
                <rect
                  x="56"
                  y="50"
                  width="48"
                  height="14"
                  rx="2"
                  fill="none"
                  stroke="#ff6b6b"
                  stroke-width="0.8"
                >
                  <animate
                    attributeName="opacity"
                    values="1;0.3;1"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-width"
                    values="0.8;2;0.8"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </rect>
                <text x="80" y="100" text-anchor="middle" fill="#8892b0" font-size="7">
                  Person A
                </text>

                <!-- Animated dash path: A -> clipboard -->
                <line
                  x1="130"
                  y1="76"
                  x2="220"
                  y2="76"
                  stroke="#ff6b6b"
                  stroke-width="1"
                  stroke-dasharray="6 4"
                  opacity="0.7"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="40;0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </line>
                <!-- Arrow head -->
                <polygon points="218,72 226,76 218,80" fill="#ff6b6b" opacity="0.7">
                  <animate
                    attributeName="opacity"
                    values="0.3;0.9;0.3"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </polygon>

                <!-- Clipboard icon -->
                <g transform="translate(232, 60)">
                  <rect
                    x="0"
                    y="4"
                    width="24"
                    height="30"
                    rx="3"
                    fill="none"
                    stroke="#ff6b6b"
                    stroke-width="1.2"
                  />
                  <rect
                    x="6"
                    y="0"
                    width="12"
                    height="8"
                    rx="2"
                    fill="#1a1a2e"
                    stroke="#ff6b6b"
                    stroke-width="1"
                  />
                  <line x1="6" y1="16" x2="18" y2="16" stroke="#8892b0" stroke-width="0.8" />
                  <line x1="6" y1="22" x2="14" y2="22" stroke="#8892b0" stroke-width="0.8" />
                  <text x="12" y="42" text-anchor="middle" fill="#ff6b6b" font-size="7">
                    Link copied!
                  </text>
                  <animate
                    attributeName="opacity"
                    values="0;0;1;1"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </g>

                <!-- Phone B (dimmed) -->
                <rect
                  x="360"
                  y="20"
                  width="80"
                  height="120"
                  rx="10"
                  fill="#1a1a2e"
                  stroke="#8892b0"
                  stroke-width="1"
                  opacity="0.3"
                />
                <rect x="372" y="36" width="56" height="80" rx="2" fill="#16213e" opacity="0.3" />
                <text
                  x="400"
                  y="76"
                  text-anchor="middle"
                  fill="#8892b0"
                  font-size="8"
                  opacity="0.4"
                >
                  Đang chờ...
                </text>
                <text
                  x="400"
                  y="100"
                  text-anchor="middle"
                  fill="#8892b0"
                  font-size="7"
                  opacity="0.4"
                >
                  Person B
                </text>
              </svg>
            </section>

            <!-- Step 2: Gui link -->
            <section>
              <h3
                class="font-display text-lg font-semibold text-accent-amber mb-1 flex items-center gap-2"
              >
                <span
                  class="inline-flex items-center justify-center w-7 h-7 border border-accent-amber text-sm"
                  >2</span
                >
                Gửi link cho bạn bè
              </h3>
              <p class="text-sm text-text-secondary mb-4">
                Gửi <strong class="text-text-primary">link mời</strong> (hoặc
                <strong class="text-text-primary">mã mời</strong>) qua Messenger, Zalo, Telegram
                hoặc bất kỳ app nhắn tin nào.
              </p>
              <!-- SVG: Envelope flies from A to B -->
              <svg viewBox="0 0 480 160" class="w-full" xmlns="http://www.w3.org/2000/svg">
                <!-- Phone A -->
                <rect
                  x="40"
                  y="20"
                  width="80"
                  height="120"
                  rx="10"
                  fill="#1a1a2e"
                  stroke="#ff6b6b"
                  stroke-width="1.5"
                />
                <rect x="52" y="36" width="56" height="80" rx="2" fill="#16213e" />
                <text x="80" y="76" text-anchor="middle" fill="#ff6b6b" font-size="8">A</text>
                <text x="80" y="100" text-anchor="middle" fill="#8892b0" font-size="7">
                  Person A
                </text>

                <!-- Curved path (invisible, for motion) -->
                <path id="sendPath" d="M130,76 C200,20 280,20 350,76" fill="none" stroke="none" />
                <!-- Visible trail -->
                <path
                  d="M130,76 C200,20 280,20 350,76"
                  fill="none"
                  stroke="#f0c040"
                  stroke-width="1"
                  stroke-dasharray="4 6"
                  opacity="0.4"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="40;0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </path>

                <!-- Envelope icon moving along path -->
                <g>
                  <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
                    <mpath href="#sendPath" />
                  </animateMotion>
                  <!-- Envelope shape -->
                  <rect x="-10" y="-7" width="20" height="14" rx="2" fill="#f0c040" opacity="0.9" />
                  <path d="M-10,-7 L0,2 L10,-7" fill="none" stroke="#1a1a2e" stroke-width="1.2" />
                </g>

                <!-- Messaging app icons -->
                <text x="200" y="100" text-anchor="middle" fill="#8892b0" font-size="8">
                  Messenger
                </text>
                <text x="240" y="115" text-anchor="middle" fill="#8892b0" font-size="8">Zalo</text>
                <text x="280" y="100" text-anchor="middle" fill="#8892b0" font-size="8">
                  Telegram
                </text>

                <!-- Phone B (brightening) -->
                <rect
                  x="360"
                  y="20"
                  width="80"
                  height="120"
                  rx="10"
                  fill="#1a1a2e"
                  stroke="#64ffda"
                  stroke-width="1.5"
                >
                  <animate
                    attributeName="opacity"
                    values="0.4;1;1;0.4"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </rect>
                <rect x="372" y="36" width="56" height="80" rx="2" fill="#16213e">
                  <animate
                    attributeName="opacity"
                    values="0.4;1;1;0.4"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </rect>
                <text x="400" y="76" text-anchor="middle" fill="#64ffda" font-size="8">B</text>
                <text x="400" y="100" text-anchor="middle" fill="#8892b0" font-size="7">
                  Person B
                </text>
              </svg>
            </section>

            <!-- Step 3: Ket noi -->
            <section>
              <h3
                class="font-display text-lg font-semibold text-accent-sky mb-1 flex items-center gap-2"
              >
                <span
                  class="inline-flex items-center justify-center w-7 h-7 border border-accent-sky text-sm"
                  >3</span
                >
                Kết nối & Gọi video
              </h3>
              <p class="text-sm text-text-secondary mb-4">
                Person B mở link (hoặc dán mã mời) &rarr; nhận
                <strong class="text-text-primary">mã trả lời</strong> &rarr; gửi lại cho A &rarr;
                <strong class="text-text-primary">bắt đầu gọi video!</strong>
              </p>
              <!-- SVG: Both phones connected with signal waves -->
              <svg viewBox="0 0 480 160" class="w-full" xmlns="http://www.w3.org/2000/svg">
                <!-- Phone A -->
                <rect
                  x="40"
                  y="20"
                  width="80"
                  height="120"
                  rx="10"
                  fill="#1a1a2e"
                  stroke="#64ffda"
                  stroke-width="1.5"
                />
                <rect x="52" y="36" width="56" height="80" rx="2" fill="#16213e" />
                <text x="80" y="76" text-anchor="middle" fill="#64ffda" font-size="8">A</text>
                <text x="80" y="100" text-anchor="middle" fill="#8892b0" font-size="7">
                  Person A
                </text>

                <!-- Bidirectional signal lines -->
                <line
                  x1="130"
                  y1="70"
                  x2="350"
                  y2="70"
                  stroke="#64ffda"
                  stroke-width="1"
                  stroke-dasharray="8 4"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="0;-24"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </line>
                <line
                  x1="350"
                  y1="82"
                  x2="130"
                  y2="82"
                  stroke="#7ec8e3"
                  stroke-width="1"
                  stroke-dasharray="8 4"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    values="0;-24"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </line>

                <!-- Center camera icon -->
                <g transform="translate(240, 76)">
                  <!-- Pulse circles -->
                  <circle
                    cx="0"
                    cy="0"
                    r="14"
                    fill="none"
                    stroke="#64ffda"
                    stroke-width="0.5"
                    opacity="0.3"
                  >
                    <animate
                      attributeName="r"
                      values="14;28;14"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.5;0;0.5"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx="0"
                    cy="0"
                    r="10"
                    fill="none"
                    stroke="#64ffda"
                    stroke-width="0.8"
                    opacity="0.5"
                  >
                    <animate
                      attributeName="r"
                      values="10;22;10"
                      dur="2s"
                      repeatCount="indefinite"
                      begin="0.5s"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0;0.6"
                      dur="2s"
                      repeatCount="indefinite"
                      begin="0.5s"
                    />
                  </circle>
                  <!-- Camera body -->
                  <rect x="-10" y="-7" width="15" height="14" rx="2" fill="#64ffda" />
                  <polygon points="5,-4 12,-8 12,8 5,4" fill="#64ffda" />
                </g>

                <!-- "Dang goi video" text -->
                <text
                  x="240"
                  y="115"
                  text-anchor="middle"
                  fill="#64ffda"
                  font-size="9"
                  font-weight="bold"
                >
                  Đang gọi video!
                  <animate
                    attributeName="opacity"
                    values="1;0.5;1"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </text>

                <!-- Phone B -->
                <rect
                  x="360"
                  y="20"
                  width="80"
                  height="120"
                  rx="10"
                  fill="#1a1a2e"
                  stroke="#64ffda"
                  stroke-width="1.5"
                />
                <rect x="372" y="36" width="56" height="80" rx="2" fill="#16213e" />
                <text x="400" y="76" text-anchor="middle" fill="#64ffda" font-size="8">B</text>
                <text x="400" y="100" text-anchor="middle" fill="#8892b0" font-size="7">
                  Person B
                </text>
              </svg>
            </section>
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
