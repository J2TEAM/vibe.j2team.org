<template>
  <div
    class="relative min-h-screen bg-bg-deep overflow-hidden font-body flex flex-col items-center justify-end px-4 md:px-0"
  >
    <!-- Header: Links & Metadata -->
    <div class="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start z-50">
      <div class="flex flex-row items-center gap-3">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-coral/5 focus:outline-none focus:ring-2 focus:ring-accent-coral"
        >
          &larr; Trang chủ
        </RouterLink>

        <div class="relative md:hidden flex">
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="p-2 border border-border-default bg-bg-surface/90 backdrop-blur-md text-text-secondary hover:text-accent-amber shadow-xl cursor-pointer flex items-center justify-center transition-colors h-[42px] w-[42px]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>

          <transition name="fade">
            <div
              v-if="showMobileMenu"
              class="absolute top-full left-0 mt-2 flex flex-col gap-1 w-32 shadow-2xl z-50"
            >
              <button
                @click="
                  showRulesModal = true
                  showMobileMenu = false
                "
                class="px-4 py-3 border border-border-default bg-bg-deep text-text-primary text-[10px] font-display font-bold tracking-widest text-left active:bg-bg-surface"
              >
                📖 LUẬT
              </button>
              <button
                @click="
                  showSettingsModal = true
                  showMobileMenu = false
                "
                class="px-4 py-3 border border-border-default bg-bg-deep text-text-primary text-[10px] font-display font-bold tracking-widest text-left active:bg-bg-surface"
              >
                ⚙️ CÀI ĐẶT
              </button>
            </div>
          </transition>
        </div>
      </div>

      <div
        class="bg-accent-coral text-bg-deep font-display font-bold text-[10px] md:text-xs tracking-widest px-3 py-1.5 rotate-3 shadow-lg shadow-accent-coral/20 hover:rotate-0 transition-transform cursor-default select-none"
      >
        VOL.01 / 2026
      </div>
    </div>

    <!-- Footer: Author -->
    <div
      class="absolute bottom-6 left-6 z-50 text-xs text-text-dim font-display tracking-widest select-none cursor-default opacity-80"
    >
      <span class="text-accent-coral mr-2">//</span> TÁC GIẢ: hoangphi117
    </div>

    <!-- Intro Overlay (Z-index 200) -->
    <transition name="fade">
      <div
        v-if="isIntro"
        class="absolute inset-0 bg-bg-deep/95 flex flex-col items-center justify-start md:justify-center z-[200] backdrop-blur-md px-4 py-16 overflow-y-auto"
      >
        <div class="flex flex-col items-center justify-center min-h-full w-full py-10">
          <h1
            class="font-display text-5xl md:text-8xl font-bold mb-4 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,107,74,0.3)] text-accent-coral animate-fade-up text-center"
          >
            BUCKSHOT ROULETTE
          </h1>
          <p
            class="text-text-secondary text-base md:text-lg mb-8 tracking-widest uppercase font-display animate-fade-up animate-delay-2 text-center"
          >
            Một cuộc chơi đánh cược sinh mạng
          </p>

          <div
            class="mb-10 text-text-primary text-sm md:text-base font-body max-w-lg mx-auto !leading-relaxed text-left animate-fade-up animate-delay-3 p-5 md:p-6 border border-border-default bg-bg-surface/80 shadow-2xl"
          >
            <h3
              class="text-text-primary font-display font-bold text-xl md:text-2xl text-center mb-4 md:mb-6 flex items-center justify-center gap-3"
            >
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              Luật Chơi
            </h3>
            <ul class="list-disc pl-5 space-y-2 md:space-y-3 text-text-secondary">
              <li>
                Súng sẽ nạp một số đạn <strong class="text-red-500 font-bold">THẬT</strong> và
                <strong class="text-blue-500 font-bold">RỖNG</strong> ngẫu nhiên.
              </li>
              <li>
                Đến lượt bạn, chọn bắn
                <strong class="text-text-primary uppercase font-bold text-xs md:text-sm"
                  >Bản Thân</strong
                >
                hoặc
                <strong class="text-text-primary uppercase font-bold text-xs md:text-sm"
                  >Đối Thủ</strong
                >.
              </li>
              <li>
                Bắn <strong>BẢN THÂN</strong> bằng đạn
                <strong class="text-blue-500 font-bold">RỖNG</strong> sẽ được giữ lượt.
              </li>
              <li>
                Bắn <strong>ĐỐI THỦ</strong> bằng đạn
                <strong class="text-blue-500 font-bold">RỖNG</strong> sẽ mất lượt.
              </li>
              <li>
                Sử dụng <strong class="text-accent-amber font-bold">VẬT PHẨM</strong> chiến thuật để
                tạo lợi thế: Thuốc lá, Bia, Kính lúp, Còng tay, Cưa sắt.
              </li>
              <li>Người hết sinh mạng trước cược thua mạng sống.</li>
            </ul>
          </div>

          <div class="flex gap-4 animate-fade-up animate-delay-4 shrink-0 pb-10">
            <button
              @click="enterGame"
              class="group relative px-10 md:px-12 py-4 md:py-5 bg-transparent border-2 border-accent-coral text-accent-coral text-lg md:text-xl font-display font-bold transition-all duration-300 hover:bg-accent-coral hover:text-bg-deep hover:shadow-[0_0_30px_rgba(255,107,74,0.5)] tracking-widest cursor-pointer"
            >
              <span class="relative z-10">VÀO GAME</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Blackout Overlay (Z-index 100) / Wake-up sequence -->
    <transition name="fade">
      <div
        v-if="isBlackout"
        class="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none animate-unconscious"
      >
        <div
          class="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
        ></div>
      </div>
    </transition>

    <!-- Hiệu ứng Kính Lúp (Magnifying Glass Peek) -->
    <transition name="peek">
      <div
        v-if="peekedBullet !== null"
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[180] pointer-events-none"
      >
        <div
          class="relative w-36 h-36 md:w-48 md:h-48 rounded-full border-4 flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md animate-peek-zoom"
          :class="peekedBullet ? 'border-red-500 bg-red-950/80' : 'border-blue-500 bg-blue-950/80'"
        >
          <!-- Viên đạn bên trong kính lúp -->
          <div class="flex flex-col items-center">
            <div
              class="w-8 h-20 rounded-t-sm shadow-inner relative overflow-hidden"
              :class="peekedBullet ? 'bg-red-600' : 'bg-blue-600'"
            >
              <div class="absolute inset-y-0 left-0 w-1 bg-white/20"></div>
              <div class="absolute inset-y-0 right-0 w-1 bg-black/20"></div>
            </div>

            <div
              class="w-8 h-4 bg-yellow-600 rounded-b-sm border-t border-yellow-400 shadow-md relative"
            >
              <div
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-yellow-700/50 bg-yellow-500/30"
              ></div>
            </div>

            <span
              class="font-display text-lg font-bold tracking-widest uppercase mt-3"
              :class="peekedBullet ? 'text-red-400' : 'text-blue-400'"
            >
              {{ peekedBullet ? 'THẬT' : 'RỖNG' }}
            </span>
          </div>
          <!-- Viền phát sáng -->
          <div
            class="absolute inset-0 rounded-full blur-xl opacity-30 pointer-events-none"
            :class="peekedBullet ? 'bg-red-500' : 'bg-blue-500'"
          ></div>
        </div>
      </div>
    </transition>

    <!-- Game Container (Perspective FPS effect) -->
    <div class="relative w-full max-w-5xl h-screen flex flex-col perspective-container">
      <!-- LAYER 1: Background (AI Character) -->
      <div
        class="absolute inset-x-0 top-0 h-[50%] md:h-[40%] flex flex-col items-center justify-center bg-[#0C141E] border-x border-t border-border-default shadow-[inset_0_0_200px_rgba(0,0,0,0.95)] translate-z-neg px-4 z-0"
      >
        <!-- Ambient lighting -->
        <div
          class="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-bg-surface/30 to-transparent pointer-events-none"
        ></div>

        <div
          class="flex flex-row items-center justify-center gap-8 md:gap-16 translate-y-8 w-full max-w-4xl mx-auto"
        >
          <div class="w-48 md:w-60 relative flex justify-center">
            <img
              src="./assets/dealer.png"
              alt="Dealer Character"
              class="relative z-10 w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
            />
          </div>

          <!-- AI HP (Lightning bolts) - Positioned at bottom right of dealer area -->
          <div
            class="absolute right-2 md:right-4 bottom-2 flex flex-col md:flex-row gap-2 items-end md:items-center z-20"
          >
            <!-- HP Container -->
            <div
              class="flex flex-col md:flex-row items-center backdrop-blur-sm bg-bg-surface shadow-xl px-2 py-2 md:py-0 md:h-10 md:min-w-[130px] md:justify-start w-auto"
            >
              <!-- Mobile: cột dọc | Desktop: hàng ngang -->
              <div class="flex flex-col-reverse md:flex-row items-center gap-1">
                <svg
                  v-for="i in aiHp"
                  :key="'ai-hp-' + i"
                  class="w-4 h-4 md:w-5 md:h-5 text-accent-sky drop-shadow-[0_0_12px_rgba(56,189,248,0.5)] shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z"
                  />
                </svg>
                <span
                  v-if="aiHp === 0"
                  class="text-accent-coral text-[10px] font-display font-bold px-1"
                  >DEAD</span
                >
              </div>
            </div>

            <!-- Handcuffed -->
            <div
              v-if="isAiHandcuffed"
              class="text-center text-accent-amber text-[10px] md:text-xs font-display tracking-widest animate-pulse whitespace-nowrap"
            >
              🔗 CÒNG
            </div>
          </div>
        </div>

        <div
          v-if="!isIntro && aiItems.length > 0"
          class="absolute bottom-2 left-2 md:left-4 flex flex-col md:flex-row gap-1.5 z-20"
        >
          <div
            v-for="(item, index) in aiItems"
            :key="'ai-item-' + index"
            class="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center border border-border-default/40 bg-bg-surface/30 text-base md:text-lg select-none opacity-70"
            :title="getItemName(item)"
          >
            {{ getItemEmoji(item) }}
          </div>
        </div>
      </div>

      <!-- LAYER 2: Midground (Wooden Table) -->
      <div
        class="absolute inset-x-0 bottom-[20%] md:bottom-[30%] h-[35%] md:h-[30%] bg-amber-950 border-2 border-border-default shadow-[0_-20px_50px_rgba(0,0,0,0.9)] table-perspective flex flex-col items-center justify-start pt-6 z-10 w-[110%] -ml-[5%]"
      >
        <div
          class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZiZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSIvPjwvc3ZnPg==')] mix-blend-overlay"
        ></div>
        <div
          class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40"
        ></div>

        <!-- Gun Representation -->
        <div
          class="relative w-44 md:w-64 h-16 md:h-20 shadow-[0_25px_40px_rgba(0,0,0,0.8)] transform z-10 flex items-center justify-center mt-2 md:mt-6"
        >
          <img
            src="./assets/shotgun.png"
            alt="Shotgun"
            class="w-full h-auto object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.9)]"
            :class="{ 'scale-x-75 brightness-125': isSawedOff }"
          />

          <div
            class="absolute -bottom-14 md:-bottom-20 left-1/2 -translate-x-1/2 flex items-end gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-3 bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl min-w-[120px] md:min-w-[160px] justify-center"
          >
            <div
              v-for="(isLive, index) in cylinder"
              :key="'shell-' + index"
              class="relative w-3 h-8 md:w-4 md:h-12 flex flex-col items-center"
            >
              <div
                class="w-full h-6 md:h-10 rounded-t-sm"
                :class="isLive ? 'bg-red-600' : 'bg-blue-600'"
              ></div>
              <div class="w-[110%] h-2 md:h-2.5 bg-yellow-600 rounded-sm"></div>
            </div>
          </div>
        </div>

        <!-- Message Box -->
        <div
          class="mt-14 md:mt-20 w-[90%] md:max-w-lg px-4 py-3 md:px-8 md:py-5 bg-bg-deep/95 border-2 border-accent-amber text-center backdrop-blur-md relative"
        >
          <p
            class="font-display text-accent-amber text-sm md:text-2xl tracking-widest font-bold uppercase"
          >
            {{ turnMessage }}
          </p>
        </div>
      </div>

      <!-- LAYER 3: Foreground (Player UI) -->
      <div
        v-if="!isIntro"
        class="absolute inset-x-0 bottom-0 z-50 pointer-events-auto w-full px-0 pb-8 md:pb-10 flex justify-center"
      >
        <div
          class="w-full max-w-7xl flex flex-col md:flex-row items-stretch md:items-end justify-between gap-0 md:gap-4 animate-fade-up"
        >
          <div
            class="flex flex-row md:flex-col items-stretch md:items-start gap-2 md:gap-3 flex-1 px-4 py-3 md:p-0 md:ml-8"
          >
            <div
              class="flex items-center gap-2 px-4 bg-bg-surface/90 border border-border-default md:border-b-0 backdrop-blur-md shadow-2xl h-11 md:h-14 min-w-[160px] md:min-w-[180px]"
            >
              <div class="flex items-center gap-1.5 w-full">
                <svg
                  v-for="i in playerHp"
                  :key="'p-hp-' + i"
                  class="w-5 h-5 md:w-6 md:h-6 text-accent-coral drop-shadow-[0_0_12px_rgba(255,107,74,0.5)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span
                  v-if="playerHp === 0"
                  class="text-accent-coral text-[10px] font-display font-bold"
                  >DEAD</span
                >
                <div v-if="isPlayerHandcuffed" class="ml-1 text-accent-amber animate-pulse">🔗</div>
              </div>
            </div>

            <div
              class="flex md:hidden flex-1 overflow-x-auto gap-2 p-1.5 bg-bg-surface/90 border border-border-default backdrop-blur-md min-w-[200px] h-11"
            >
              <button
                v-for="(item, index) in playerItems"
                :key="'p-item-mobile-' + index"
                @click="playerUseItem(item)"
                :disabled="!isPlayerTurn || isActionDisabled || gameOver"
                class="w-8 h-8 flex-shrink-0 flex items-center justify-center border bg-bg-deep border-border-default hover:border-accent-amber active:bg-bg-elevated disabled:opacity-30 cursor-pointer text-sm"
              >
                {{ getItemEmoji(item) }}
              </button>
            </div>
          </div>

          <div class="flex flex-col items-center gap-0 md:gap-4 w-full md:w-[450px] lg:w-[500px]">
            <div
              class="hidden md:flex flex-row flex-wrap justify-center items-center gap-2.5 p-2.5 bg-bg-surface/90 border border-border-default backdrop-blur-md shadow-xl min-h-[66px] min-w-[340px]"
            >
              <button
                v-for="(item, index) in playerItems"
                :key="'p-item-desktop-' + index"
                @click="playerUseItem(item)"
                :disabled="!isPlayerTurn || isActionDisabled || gameOver"
                class="w-11 h-11 flex items-center justify-center border bg-bg-deep border-border-default hover:border-accent-amber hover:shadow-[0_0_15px_rgba(255,184,48,0.2)] transition-all disabled:opacity-20 cursor-pointer"
                :title="getItemName(item)"
              >
                {{ getItemEmoji(item) }}
              </button>
            </div>

            <div class="flex flex-row w-full gap-2 md:gap-5">
              <button
                @click="playerShootSelf"
                :disabled="!isPlayerTurn || gameOver || cylinder.length === 0 || isActionDisabled"
                class="flex-1 py-4.5 md:h-14 bg-bg-surface border-t border-r md:border md:border-b-0 border-border-default text-text-primary text-xs md:text-base font-display font-bold tracking-widest hover:border-accent-coral hover:bg-bg-elevated hover:-translate-y-1 transition-all shadow-lg disabled:opacity-30 disabled:translate-y-0 cursor-pointer uppercase flex items-center justify-center"
              >
                Bắn bản thân
              </button>
              <button
                @click="playerShootAI"
                :disabled="!isPlayerTurn || gameOver || cylinder.length === 0 || isActionDisabled"
                class="flex-1 py-4.5 md:h-14 bg-bg-surface border-t md:border md:border-b-0 border-border-default text-text-primary text-xs md:text-base font-display font-bold tracking-widest hover:border-accent-coral hover:bg-bg-elevated hover:-translate-y-1 transition-all shadow-lg disabled:opacity-30 disabled:translate-y-0 cursor-pointer uppercase flex items-center justify-center"
              >
                Bắn đối thủ
              </button>
            </div>
          </div>

          <div class="hidden md:flex flex-row items-center justify-end gap-2 flex-1 md:mr-8">
            <button
              @click="showRulesModal = true"
              class="w-24 h-14 flex flex-col items-center justify-center border border-border-default md:border-b-0 bg-bg-surface text-text-secondary hover:text-accent-sky hover:border-accent-sky transition-all cursor-pointer"
            >
              <span class="text-base mb-0.5">📖</span>
              <span class="text-[10px] font-display font-bold tracking-widest uppercase">Luật</span>
            </button>
            <button
              @click="showSettingsModal = true"
              class="w-24 h-14 flex flex-col items-center justify-center border border-border-default md:border-b-0 bg-bg-surface text-text-secondary hover:text-accent-amber hover:border-accent-amber transition-all cursor-pointer"
            >
              <span class="text-base mb-0.5">⚙️</span>
              <span class="text-[10px] font-display font-bold tracking-widest uppercase"
                >Cài đặt</span
              >
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Over Overlay -->
    <transition name="fade">
      <div
        v-if="gameOver"
        class="absolute inset-0 bg-bg-deep/95 flex flex-col items-center justify-center z-[150] backdrop-blur-md px-4 text-center"
      >
        <!-- Decoration -->
        <h2
          class="font-display text-5xl md:text-8xl font-bold mb-6 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(255,107,74,0.3)] animate-fade-up"
          :class="winner === 'Player' ? 'text-accent-sky' : 'text-accent-coral'"
        >
          {{ winner === 'Player' ? 'BẠN CHIẾN THẮNG' : 'BẠN ĐÃ THUA' }}
        </h2>
        <div
          class="mb-12 text-text-primary text-xl md:text-2xl font-body max-w-lg mx-auto !leading-relaxed animate-fade-up animate-delay-2 p-6 border border-border-default bg-bg-surface/50 shadow-xl"
        >
          {{
            winner === 'Player'
              ? 'Furina gục ngã.\nMạng sống của bạn được bảo toàn.'
              : 'Một kết cục được dự báo trước.\nHãy nghỉ ngơi và thử lại sau.'
          }}
        </div>

        <button
          @click="startNewGame"
          class="group relative px-12 py-5 bg-transparent border-2 border-accent-amber text-accent-amber text-xl font-display font-bold transition-all duration-300 hover:bg-accent-amber hover:text-bg-deep hover:shadow-[0_0_30px_rgba(255,184,48,0.5)] tracking-widest animate-fade-up animate-delay-3 overflow-hidden rounded-none cursor-pointer"
        >
          <span class="relative z-10">CHƠI LẠI</span>
        </button>

        <RouterLink
          to="/"
          class="mt-8 text-text-dim hover:text-text-primary transition-colors underline decoration-border-default hover:decoration-accent-coral underline-offset-4 animate-fade-up animate-delay-4"
        >
          Trở về trang chủ
        </RouterLink>
      </div>
    </transition>

    <!-- Rules Modal -->
    <transition name="fade">
      <div
        v-if="showRulesModal"
        class="fixed inset-0 z-[250] flex items-center justify-center bg-bg-deep/80 px-4 backdrop-blur-sm"
      >
        <div
          class="w-full max-w-md border-2 border-accent-sky bg-bg-surface p-6 shadow-[0_0_30px_rgba(56,189,248,0.15)] max-h-[80vh] overflow-y-auto"
        >
          <h2
            class="mb-6 font-display text-2xl font-bold uppercase tracking-widest text-text-primary text-center flex items-center justify-center gap-3"
          >
            <span class="text-accent-sky font-display text-sm tracking-widest">//</span>
            Luật Chơi
          </h2>

          <ul class="list-disc pl-5 space-y-3 text-text-secondary text-sm leading-relaxed">
            <li>
              Súng sẽ nạp một số đạn <strong class="text-red-500 font-bold">THẬT</strong> và
              <strong class="text-blue-500 font-bold">RỖNG</strong> ngẫu nhiên.
            </li>
            <li>
              Đến lượt bạn, chọn bắn
              <strong class="text-text-primary uppercase font-bold">Bản Thân</strong> hoặc
              <strong class="text-text-primary uppercase font-bold">Đối Thủ</strong>.
            </li>
            <li>
              Bắn <strong>BẢN THÂN</strong> bằng đạn
              <strong class="text-blue-500 font-bold">RỖNG</strong> sẽ được giữ lượt.
            </li>
            <li>
              Bắn <strong>ĐỐI THỦ</strong> bằng đạn
              <strong class="text-blue-500 font-bold">RỖNG</strong> sẽ mất lượt.
            </li>
            <li>Người hết sinh mạng trước cược thua mạng sống.</li>
          </ul>

          <h3
            class="mt-6 mb-4 font-display text-lg font-bold uppercase tracking-widest text-accent-amber flex items-center gap-2"
          >
            <span class="text-accent-amber text-sm">//</span>
            Vật Phẩm
          </h3>

          <ul class="space-y-2.5 text-text-secondary text-sm">
            <li class="flex items-start gap-2">
              <span class="text-lg">🚬</span>
              <span
                ><strong class="text-text-primary">Thuốc lá:</strong> Hồi 1 HP cho người sử dụng (có
                thể tăng lên tới 5HP).</span
              >
            </li>
            <li class="flex items-start gap-2">
              <span class="text-lg">🍺</span>
              <span
                ><strong class="text-text-primary">Bia:</strong> Loại bỏ viên đạn hiện tại trong
                nòng súng ra ngoài mà không bắn.</span
              >
            </li>
            <li class="flex items-start gap-2">
              <span class="text-lg">🔍</span>
              <span
                ><strong class="text-text-primary">Kính lúp:</strong> Cho người chơi biết viên đạn
                tiếp theo là Thật hay Rỗng.</span
              >
            </li>
            <li class="flex items-start gap-2">
              <span class="text-lg">⛓️</span>
              <span
                ><strong class="text-text-primary">Còng tay:</strong> Khiến đối thủ bị mất lượt tiếp
                theo.</span
              >
            </li>
            <li class="flex items-start gap-2">
              <span class="text-lg">🪚</span>
              <span
                ><strong class="text-text-primary">Cưa sắt:</strong> Cắt nòng súng. Nếu bắn trúng
                đạn thật sẽ gây x2 sát thương. Nếu đạn rỗng, hiệu ứng mất tác dụng.</span
              >
            </li>
          </ul>

          <button
            type="button"
            class="mt-6 w-full border-2 border-border-default bg-transparent px-4 py-3 text-lg font-display font-bold tracking-widest transition hover:bg-border-default hover:text-bg-deep cursor-pointer"
            @click="showRulesModal = false"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </transition>

    <!-- Settings Modal -->
    <transition name="fade">
      <div
        v-if="showSettingsModal"
        class="fixed inset-0 z-[250] flex items-center justify-center bg-bg-deep/80 px-4 backdrop-blur-sm"
      >
        <div
          class="w-full max-w-sm border-2 border-accent-amber bg-bg-surface p-6 shadow-[0_0_30px_rgba(255,184,48,0.2)]"
        >
          <h2
            class="mb-6 font-display text-2xl font-bold uppercase tracking-widest text-text-primary text-center flex items-center justify-center gap-3"
          >
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            Cài Đặt
          </h2>

          <!-- Phần Âm Thanh -->
          <p class="text-xs font-display tracking-widest text-text-dim mb-3 uppercase">
            <span class="text-accent-coral mr-1">//</span> Âm Thanh
          </p>

          <button
            type="button"
            class="mb-4 w-full border border-border-default bg-bg-deep px-4 py-3 text-sm font-display tracking-widest transition hover:border-accent-sky hover:text-accent-sky"
            @click="isSoundOn = !isSoundOn"
          >
            {{ isSoundOn ? 'Tắt hiệu ứng (SFX)' : 'Bật hiệu ứng (SFX)' }}
          </button>

          <div class="mb-6 border border-border-default bg-bg-deep p-4">
            <p class="text-xs font-display tracking-widest text-text-dim mb-2 uppercase">
              ÂM LƯỢNG HIỆU ỨNG: {{ sfxVolume }}%
            </p>
            <input
              v-model.number="sfxVolume"
              type="range"
              min="0"
              max="100"
              step="1"
              class="w-full accent-accent-coral cursor-pointer"
            />
          </div>

          <!-- Phần Độ Khó AI -->
          <p class="text-xs font-display tracking-widest text-text-dim mb-3 uppercase">
            <span class="text-accent-coral mr-1">//</span> Độ Khó AI
          </p>

          <div class="mb-6 flex gap-2">
            <button
              v-for="opt in difficultyOptions"
              :key="opt.value"
              type="button"
              class="flex-1 border px-3 py-3 text-center font-display text-sm tracking-wider transition-all duration-300 cursor-pointer"
              :class="
                aiDifficulty === opt.value
                  ? 'border-accent-amber bg-accent-amber/15 text-accent-amber shadow-[0_0_15px_rgba(255,184,48,0.15)]'
                  : 'border-border-default bg-bg-deep text-text-secondary hover:border-text-dim hover:text-text-primary'
              "
              @click="aiDifficulty = opt.value"
            >
              <span class="block font-bold uppercase">{{ opt.label }}</span>
              <span class="block text-[10px] mt-1 text-text-dim tracking-normal">{{
                opt.desc
              }}</span>
            </button>
          </div>

          <button
            type="button"
            class="w-full border-2 border-border-default bg-transparent px-4 py-3 text-lg font-display font-bold tracking-widest transition hover:bg-border-default hover:text-bg-deep cursor-pointer"
            @click="showSettingsModal = false"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </transition>
  </div>
  <BackToTop />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import BackToTop from '@/components/BackToTop.vue'
import { useGameLogic } from './composables/useGameLogic'
import type { ItemType } from './composables/useGameLogic'

const {
  playerHp,
  aiHp,
  cylinder,
  isPlayerTurn,
  isBlackout,
  gameOver,
  winner,
  turnMessage,
  isActionDisabled,
  playerShootSelf,
  playerShootAI,
  isIntro,
  showSettingsModal,
  isSoundOn,
  sfxVolume,
  aiDifficulty,
  initIntro,
  enterGame,
  startNewGame,
  disposeAudio,
  // Hệ thống vật phẩm
  playerItems,
  aiItems,
  playerUseItem,
  isSawedOff,
  peekedBullet,
  isPlayerHandcuffed,
  isAiHandcuffed,
} = useGameLogic()

// State cho modal luật chơi
const showRulesModal = ref(false)
const showMobileMenu = ref(false)

// Danh sách độ khó của AI
const difficultyOptions = [
  { value: 'easy', label: 'Dễ', desc: 'AI đôi khi chơi ngẫu nhiên' },
  { value: 'normal', label: 'Thường', desc: 'AI khá thông minh' },
  { value: 'hard', label: 'Khó', desc: 'AI luôn chọn nước tối ưu' },
] as const

// Emoji và tên vật phẩm
function getItemEmoji(item: ItemType): string {
  const map: Record<ItemType, string> = {
    cigarette: '🚬',
    beer: '🍺',
    magnifying_glass: '🔍',
    handcuffs: '⛓️',
    handsaw: '🪚',
  }
  return map[item]
}

function getItemName(item: ItemType): string {
  const map: Record<ItemType, string> = {
    cigarette: 'Thuốc lá (+1 HP)',
    beer: 'Bia (Loại bỏ viên đạn)',
    magnifying_glass: 'Kính lúp (Xem đạn)',
    handcuffs: 'Còng tay (Mất lượt)',
    handsaw: 'Cưa sắt (x2 sát thương)',
  }
  return map[item]
}

onMounted(() => {
  initIntro()
})

// Dọn dẹp tài nguyên âm thanh khi rời trang
onUnmounted(() => {
  disposeAudio()
})
</script>

<style scoped>
.perspective-container {
  perspective: 1200px;
}
.translate-z-neg {
  transform: translateZ(-200px);
}
.table-perspective {
  transform: rotateX(55deg) translateZ(50px);
  transform-origin: bottom;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Transition cho hiệu ứng kính lúp */
.peek-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.peek-leave-active {
  transition: all 0.5s ease-out;
}
.peek-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.3);
}
.peek-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(1.5);
}

/* Animations that might not be in Tailwind Config */
@keyframes fade-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes unconscious-pulse {
  0%,
  100% {
    background-color: #000000;
  }
  50% {
    background-color: #0a0a0a;
  } /* Sáng lên một chút màu xám rất tối */
}

.animate-unconscious {
  animation: unconscious-pulse 3s ease-in-out infinite;
}

/* Hiệu ứng mờ ảo cho chữ khi bất tỉnh */
@keyframes text-ghost {
  0%,
  100% {
    opacity: 0.3;
    filter: blur(2px);
    transform: scale(0.98);
  }
  50% {
    opacity: 0.8;
    filter: blur(0px);
    transform: scale(1);
  }
}

.animate-text-ghost {
  animation: text-ghost 3s ease-in-out infinite;
}

.animate-fade-up {
  animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

.animate-delay-2 {
  animation-delay: 200ms;
}

.animate-delay-3 {
  animation-delay: 400ms;
}

.animate-delay-4 {
  animation-delay: 600ms;
}

/* Hiệu ứng zoom kính lúp */
@keyframes peek-zoom {
  0% {
    transform: scale(0.5) rotate(-10deg);
  }
  50% {
    transform: scale(1.05) rotate(2deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.animate-peek-zoom {
  animation: peek-zoom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
</style>
