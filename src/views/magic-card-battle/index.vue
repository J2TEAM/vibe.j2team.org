<template>
  <div class="min-h-screen bg-[#0a0e1a] text-gray-100 overflow-hidden relative">
    <!-- BG Particles -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div
        v-for="n in 30"
        :key="n"
        class="absolute w-1 h-1 rounded-full bg-purple-500/20 animate-pulse"
        :style="{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
        }"
      />
    </div>

    <!-- VFX LAYER -->
    <div class="fixed inset-0 pointer-events-none z-50">
      <div
        v-for="p in vfxParticles"
        :key="p.id"
        class="absolute rounded-full"
        :style="{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          backgroundColor: p.color,
          opacity: p.opacity,
          transform: `translate(-50%, -50%) scale(${p.scale})`,
          transition: 'all 0.05s linear',
          boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
        }"
      />
      <!-- VFX Text popups -->
      <div
        v-for="popup in vfxPopups"
        :key="popup.id"
        class="absolute font-display font-bold text-center pointer-events-none"
        :style="{
          left: `${popup.x}%`,
          top: `${popup.y}%`,
          fontSize: `${popup.size}px`,
          color: popup.color,
          transform: 'translate(-50%, -50%)',
          textShadow: `0 0 15px ${popup.color}, 0 0 30px ${popup.color}`,
          opacity: popup.opacity,
          transition: 'all 0.05s linear',
        }"
      >
        {{ popup.text }}
      </div>
    </div>

    <!-- LOBBY SCREEN -->
    <div
      v-if="gameState.phase === 'lobby'"
      class="relative z-10 flex flex-col items-center justify-center min-h-screen px-4"
    >
      <div class="text-center animate-fade-up">
        <h1 class="font-display text-5xl md:text-7xl font-bold tracking-tight mb-2">
          <span class="text-purple-400">DEV</span>
          <span class="text-gray-100">_ARENA</span>
        </h1>
        <p class="text-purple-300/60 text-sm tracking-widest uppercase mb-6">
          ⚔️ Đấu Bài Ma Thuật Developer — 200+ Quân Bài
        </p>
      </div>

      <div class="flex flex-col gap-3 w-64 animate-fade-up" style="animation-delay: 0.2s">
        <button
          class="w-full py-3 px-6 bg-green-900/50 border border-green-500/50 text-green-300 font-display tracking-widest uppercase text-sm hover:bg-green-800 hover:border-green-400 transition-all cursor-pointer"
          @click="startGame('easy')"
        >
          ⭐ DỄ — Intern Bot
        </button>
        <button
          class="w-full py-3 px-6 bg-yellow-900/50 border border-yellow-500/50 text-yellow-300 font-display tracking-widest uppercase text-sm hover:bg-yellow-800 hover:border-yellow-400 transition-all cursor-pointer"
          @click="startGame('normal')"
        >
          ⭐⭐ THƯỜNG — Mid Dev
        </button>
        <button
          class="w-full py-3 px-6 bg-red-900/50 border border-red-500/50 text-red-300 font-display tracking-widest uppercase text-sm hover:bg-red-800 hover:border-red-400 transition-all cursor-pointer"
          @click="startGame('hard')"
        >
          🌟 KHÓ — Senior Troll
        </button>
      </div>

      <button
        class="mt-6 px-4 py-2 bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-display uppercase tracking-wider hover:bg-purple-800/40 transition-all cursor-pointer"
        @click="showTutorial = true"
      >
        📖 Hướng dẫn chơi
      </button>

      <RouterLink
        to="/"
        class="mt-4 w-64 py-3 px-6 bg-gray-800/50 border border-gray-600/50 text-gray-300 font-display tracking-widest uppercase text-sm text-center hover:bg-gray-700 hover:border-gray-400 transition-all block"
      >
        🏠 Về Trang Chủ
      </RouterLink>

      <p class="text-gray-600 text-xs mt-4 max-w-sm text-center">
        200 quân bài • 6 loại bài • 8 môi trường • 9 kỹ năng đặc biệt
      </p>
    </div>

    <!-- TUTORIAL MODAL -->
    <div
      v-if="showTutorial"
      class="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4"
      @click.self="showTutorial = false"
    >
      <div
        class="bg-[#0d1225] border border-purple-500/30 max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 relative"
      >
        <button
          class="absolute top-3 right-3 text-gray-500 hover:text-white text-lg cursor-pointer"
          @click="showTutorial = false"
        >
          ✕
        </button>

        <h2 class="font-display text-2xl text-purple-400 font-bold mb-4">📖 Hướng Dẫn Chơi</h2>

        <!-- Tutorial Steps -->
        <div class="space-y-4 text-sm text-gray-300">
          <!-- Step 1 -->
          <div class="border-l-2 border-purple-500 pl-3">
            <h3 class="font-display text-purple-300 font-bold mb-1">
              Bước 1: Chọn độ khó & bắt đầu
            </h3>
            <p>
              Chọn 1 trong 3 mức độ khó. Bạn và AI mỗi bên khởi đầu
              <span class="text-red-400 font-bold">30 HP</span>,
              <span class="text-blue-400 font-bold">1 Mana</span>, và
              <span class="text-yellow-400 font-bold">4 lá bài</span> trên tay.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="border-l-2 border-blue-500 pl-3">
            <h3 class="font-display text-blue-300 font-bold mb-1">Bước 2: Hiểu Mana 💎</h3>
            <p>
              Mỗi lượt bạn được +1 Mana tối đa (max 10). Mỗi lá bài tốn Mana để chơi —
              <span class="bg-blue-900 text-blue-200 px-1 rounded text-xs">số xanh</span> ở góc trên
              trái bài.
            </p>
          </div>

          <!-- Step 3 -->
          <div class="border-l-2 border-green-500 pl-3">
            <h3 class="font-display text-green-300 font-bold mb-1">Bước 3: Chơi bài ra sân ⚔️</h3>
            <div class="space-y-1.5">
              <p>
                <strong>Quân Lính</strong>: Click bài trên tay → Click ô trống
                <span class="text-green-500">+</span> trên sân → Quân lính xuất hiện!
              </p>
              <p>
                <strong>Phép/Bổ trợ</strong>: Click bài → Click quân lính để buff/gây sát thương.
                Phép không cần target sẽ tự kích hoạt.
              </p>
              <p>
                <strong>Bẫy</strong>: Click bài → Tự động úp mặt, kích hoạt khi đối thủ hành động.
              </p>
              <p>
                <strong>Vũ khí</strong>: Click bài → Click quân lính bạn → Trang bị vũ khí cho quân
                đó.
              </p>
              <p><strong>Môi trường</strong>: Click bài → Tự kích hoạt, ảnh hưởng cả 2 bên.</p>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="border-l-2 border-yellow-500 pl-3">
            <h3 class="font-display text-yellow-300 font-bold mb-1">Bước 4: Tấn công 💥</h3>
            <p>
              Click quân lính bạn (có chấm vàng
              <span class="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />) →
              Click quân đối thủ hoặc Hero 🤖 đối thủ.
            </p>
            <p class="text-gray-500 text-xs mt-1">
              ⚡ Rush: Tấn công ngay lượt triệu hồi. 🏰 Taunt: Phải tấn công quân Taunt trước. 👻
              Stealth: Không thể bị target.
            </p>
          </div>

          <!-- Step 5 -->
          <div class="border-l-2 border-red-500 pl-3">
            <h3 class="font-display text-red-300 font-bold mb-1">Bước 5: Kết thúc lượt</h3>
            <p>
              Nhấn
              <span
                class="bg-yellow-900/50 border border-yellow-500/50 text-yellow-300 px-2 py-0.5 rounded text-xs"
                >KẾT THÚC LƯỢT</span
              >
              → AI sẽ chơi → Lại đến lượt bạn!
            </p>
          </div>

          <!-- Step 6 -->
          <div class="border-l-2 border-orange-500 pl-3">
            <h3 class="font-display text-orange-300 font-bold mb-1">Bước 6: 6 loại bài</h3>
            <div class="grid grid-cols-2 gap-1 text-xs">
              <span>⚔️ <strong>Quân Lính</strong> — Chiến đấu</span>
              <span>✨ <strong>Phép</strong> — Hiệu ứng tức thì</span>
              <span>🪤 <strong>Bẫy</strong> — Úp mặt, tự kích</span>
              <span>💊 <strong>Bổ trợ</strong> — Buff quân lính</span>
              <span>🗡️ <strong>Vũ khí</strong> — Trang bị</span>
              <span>🌍 <strong>Môi trường</strong> — Thay đổi luật</span>
            </div>
          </div>

          <!-- Step 7 -->
          <div class="border-l-2 border-pink-500 pl-3">
            <h3 class="font-display text-pink-300 font-bold mb-1">Bước 7: 9 kỹ năng đặc biệt</h3>
            <div class="grid grid-cols-1 gap-0.5 text-xs">
              <span>⚡ <strong>Rush</strong> — Tấn công ngay khi ra sân</span>
              <span>🛡️ <strong>Shield</strong> — Chặn 1 đòn sát thương</span>
              <span>👻 <strong>Stealth</strong> — Không thể bị target</span>
              <span>🏰 <strong>Taunt</strong> — Bắt buộc tấn công quân này</span>
              <span>🧛 <strong>Lifesteal</strong> — Hút máu khi gây sát thương</span>
              <span>☠️ <strong>Poison</strong> — Gây độc mỗi lượt</span>
              <span>💀 <strong>Deathrattle</strong> — Kích hoạt khi chết</span>
              <span>📯 <strong>Battlecry</strong> — Kích hoạt khi triệu hồi</span>
              <span>💥 <strong>Overflow</strong> — Sát thương dư lan sang Hero</span>
            </div>
          </div>

          <!-- Win Condition -->
          <div class="border-l-2 border-yellow-400 pl-3 bg-yellow-900/10 py-2">
            <h3 class="font-display text-yellow-400 font-bold mb-1">🏆 Điều kiện thắng</h3>
            <p>
              Hạ HP Hero đối thủ xuống <span class="text-red-400 font-bold">0</span>. Đơn giản vậy
              thôi!
            </p>
          </div>
        </div>

        <button
          class="mt-6 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-display uppercase tracking-wider text-sm transition-all cursor-pointer"
          @click="showTutorial = false"
        >
          Đã hiểu, vào đấu! ⚔️
        </button>
      </div>
    </div>

    <!-- LOADING -->
    <div v-else-if="isLoading" class="relative z-10 flex items-center justify-center min-h-screen">
      <div class="text-center">
        <Icon icon="lucide:loader-2" class="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
        <p class="text-purple-300 font-display tracking-widest uppercase text-sm">
          Đang xáo bài...
        </p>
      </div>
    </div>

    <!-- GAME BOARD -->
    <div v-else class="relative z-10 flex flex-col h-screen">
      <!-- Top: Opponent Info -->
      <div
        class="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-red-900/30"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full bg-red-900 flex items-center justify-center text-sm"
            :class="attackingIndex !== null ? 'cursor-pointer hover:ring-2 ring-red-400' : ''"
            @click="handleEnemyHeroAttack"
          >
            🤖
          </div>
          <div>
            <span class="text-xs text-red-400 font-display uppercase tracking-wider"
              >AI {{ difficultyLabel }}</span
            >
            <div class="flex items-center gap-1 mt-0.5">
              <div class="h-2 rounded-full bg-red-900/50 w-24 overflow-hidden">
                <div
                  class="h-full bg-red-500 transition-all duration-500"
                  :style="{ width: `${(gameState.opponent.hp / gameState.opponent.maxHp) * 100}%` }"
                />
              </div>
              <span class="text-xs text-red-300 min-w-[32px]"
                >{{ gameState.opponent.hp }}/{{ gameState.opponent.maxHp }}</span
              >
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">🃏 {{ gameState.opponent.deck.length }}</span>
          <span class="text-xs text-gray-500">✋ {{ gameState.opponent.hand.length }}</span>
          <div class="flex gap-0.5">
            <div
              v-for="m in gameState.opponent.maxMana"
              :key="m"
              class="w-3 h-3 rounded-full border"
              :class="
                m <= gameState.opponent.mana
                  ? 'bg-blue-500 border-blue-400'
                  : 'bg-gray-800 border-gray-600'
              "
            />
          </div>
        </div>
      </div>

      <!-- Opponent Board -->
      <div class="flex-1 flex flex-col">
        <div class="flex justify-center items-center gap-2 py-3 min-h-[120px]">
          <div
            v-for="(slot, i) in gameState.opponent.board"
            :key="'opp-' + i"
            class="w-20 h-28 md:w-24 md:h-32 border border-gray-700/50 rounded-lg flex flex-col items-center justify-center text-xs relative transition-all"
            :class="[
              slot ? 'bg-red-950/40 border-red-700/50' : 'bg-gray-900/20 border-dashed',
              attackingIndex !== null && slot
                ? 'cursor-pointer hover:border-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : '',
            ]"
            @click="handleDefenderClick(i)"
          >
            <template v-if="slot">
              <span class="text-lg">{{
                slot.card.keywords.includes('stealth') ? '❓' : getCardEmoji(slot.card)
              }}</span>
              <span class="text-[10px] text-gray-400 truncate max-w-[70px] text-center">{{
                slot.card.keywords.includes('stealth') ? '???' : slot.card.name
              }}</span>
              <div class="flex gap-2 mt-1">
                <span class="text-yellow-400 text-[10px] font-bold">⚔️{{ slot.currentAtk }}</span>
                <span class="text-red-400 text-[10px] font-bold">❤️{{ slot.currentHp }}</span>
              </div>
              <div v-if="slot.keywords.length > 0" class="flex gap-0.5 mt-0.5">
                <span
                  v-for="kw in slot.keywords.slice(0, 3)"
                  :key="kw"
                  class="text-[8px]"
                  :title="kw"
                  >{{ keywordEmoji(kw) }}</span
                >
              </div>
              <span v-if="slot.frozen" class="absolute top-0 right-0 text-[10px]">🧊</span>
            </template>
            <template v-else>
              <span class="text-gray-700 text-lg">·</span>
            </template>
          </div>
        </div>

        <!-- Environment -->
        <div class="flex justify-center items-center py-1">
          <div
            v-if="gameState.environment.card"
            class="px-4 py-1.5 bg-gradient-to-r from-transparent via-emerald-900/30 to-transparent border-y border-emerald-500/20 text-center"
          >
            <span class="text-[10px] text-emerald-400 font-display tracking-wider uppercase">
              🌍 {{ gameState.environment.card.name }}: {{ gameState.environment.card.description }}
            </span>
          </div>
          <div
            v-else
            class="h-6 border-y border-gray-800/30 w-full flex justify-center items-center"
          >
            <span class="text-[10px] text-gray-700">— sân đấu —</span>
          </div>
        </div>

        <!-- Player Board -->
        <div class="flex justify-center items-center gap-2 py-3 min-h-[120px]">
          <div
            v-for="(slot, i) in gameState.player.board"
            :key="'plr-' + i"
            class="w-20 h-28 md:w-24 md:h-32 border rounded-lg flex flex-col items-center justify-center text-xs relative transition-all cursor-pointer"
            :class="[
              slot
                ? 'bg-blue-950/40 border-blue-700/50'
                : 'bg-gray-900/20 border-gray-700/50 border-dashed',
              attackingIndex === i
                ? 'ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                : '',
              slot && isPlayerTurn && slot.canAttack && !slot.hasAttacked && !slot.frozen
                ? 'hover:border-yellow-400 hover:shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                : '',
            ]"
            @click="handleBoardCreatureClick(i)"
          >
            <template v-if="slot">
              <span class="text-lg">{{ getCardEmoji(slot.card) }}</span>
              <span class="text-[10px] text-gray-300 truncate max-w-[70px] text-center">{{
                slot.card.name
              }}</span>
              <div class="flex gap-2 mt-1">
                <span class="text-yellow-400 text-[10px] font-bold">⚔️{{ slot.currentAtk }}</span>
                <span class="text-green-400 text-[10px] font-bold">❤️{{ slot.currentHp }}</span>
              </div>
              <div v-if="slot.keywords.length > 0" class="flex gap-0.5 mt-0.5">
                <span
                  v-for="kw in slot.keywords.slice(0, 3)"
                  :key="kw"
                  class="text-[8px]"
                  :title="kw"
                  >{{ keywordEmoji(kw) }}</span
                >
              </div>
              <span v-if="slot.frozen" class="absolute top-0 right-0 text-[10px]">🧊</span>
              <span
                v-if="isPlayerTurn && slot.canAttack && !slot.hasAttacked && !slot.frozen"
                class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-500 animate-pulse"
              />
            </template>
            <template v-else>
              <span
                v-if="selectedCardIndex !== null && canPlaySelectedToBoard"
                class="text-green-500 text-lg animate-pulse"
                >+</span
              >
              <span v-else class="text-gray-700 text-lg">·</span>
            </template>
          </div>
        </div>
      </div>

      <!-- Player Info -->
      <div
        class="flex items-center justify-between px-4 py-2 bg-black/40 border-t border-blue-900/30"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-sm">
            👤
          </div>
          <div>
            <span class="text-xs text-blue-400 font-display uppercase tracking-wider">BẠN</span>
            <div class="flex items-center gap-1 mt-0.5">
              <div class="h-2 rounded-full bg-blue-900/50 w-24 overflow-hidden">
                <div
                  class="h-full bg-blue-500 transition-all duration-500"
                  :style="{ width: `${(gameState.player.hp / gameState.player.maxHp) * 100}%` }"
                />
              </div>
              <span class="text-xs text-blue-300 min-w-[32px]"
                >{{ gameState.player.hp }}/{{ gameState.player.maxHp }}</span
              >
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex gap-0.5">
            <div
              v-for="m in gameState.player.maxMana"
              :key="m"
              class="w-3 h-3 rounded-full border transition-all"
              :class="
                m <= gameState.player.mana
                  ? 'bg-blue-500 border-blue-400'
                  : 'bg-gray-800 border-gray-600'
              "
            />
          </div>
          <span class="text-xs text-gray-500">🃏 {{ gameState.player.deck.length }}</span>
          <RouterLink
            to="/"
            class="px-3 py-1 bg-gray-800 border border-gray-600 text-gray-300 text-xs font-display uppercase tracking-wider hover:bg-gray-700 hover:text-white transition-all"
            >🏠 Home</RouterLink
          >
          <button
            class="px-2 py-1 bg-gray-800 border border-gray-600 text-gray-400 text-xs hover:text-white transition-all cursor-pointer"
            @click="showTutorial = true"
            title="Hướng dẫn chơi"
          >
            ❓
          </button>
          <button
            v-if="isPlayerTurn && !isGameOver"
            class="px-3 py-1 bg-yellow-900/50 border border-yellow-500/50 text-yellow-300 text-xs font-display uppercase tracking-wider hover:bg-yellow-800 transition-all cursor-pointer"
            @click="endTurn"
          >
            Kết thúc lượt
          </button>
        </div>
      </div>

      <!-- Player Hand -->
      <div class="bg-black/60 border-t border-gray-800 px-2 py-2 overflow-x-auto">
        <div class="flex gap-1.5 justify-center min-w-max">
          <div
            v-for="(card, i) in gameState.player.hand"
            :key="'hand-' + i + '-' + card.id"
            class="w-20 md:w-24 p-1.5 border rounded-lg text-[10px] cursor-pointer transition-all flex flex-col shrink-0"
            :class="[
              selectedCardIndex === i
                ? 'ring-2 ring-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] -translate-y-2 bg-purple-950/60 border-purple-500/60'
                : card.cost <= gameState.player.mana && isPlayerTurn
                  ? 'bg-gray-900/60 border-gray-600/50 hover:border-purple-400 hover:-translate-y-1'
                  : 'bg-gray-900/30 border-gray-800 opacity-50',
            ]"
            @click="handleHandCardClick(i)"
          >
            <div class="flex justify-between items-center mb-0.5">
              <span class="bg-blue-900 text-blue-200 rounded px-1 font-bold text-[9px]">{{
                card.cost
              }}</span>
              <span class="text-[9px]">{{ cardTypeEmoji(card.type) }}</span>
            </div>
            <span
              class="text-[9px] text-gray-200 font-semibold leading-tight mb-0.5 line-clamp-2"
              >{{ card.name }}</span
            >
            <span class="text-[8px] text-gray-500 leading-tight line-clamp-2 flex-1">{{
              card.description
            }}</span>
            <div v-if="card.type === 'creature'" class="flex gap-2 mt-0.5">
              <span class="text-yellow-400 text-[9px]">⚔️{{ card.atk }}</span>
              <span class="text-red-400 text-[9px]">❤️{{ card.hp }}</span>
            </div>
            <div class="flex justify-end mt-0.5">
              <span class="text-[8px]" :class="rarityColor(card.rarity)">{{
                rarityLabel(card.rarity)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Turn Indicator -->
      <div
        v-if="!isPlayerTurn && !isGameOver"
        class="absolute inset-0 bg-black/30 flex items-center justify-center z-30 pointer-events-none"
      >
        <div
          class="bg-red-900/80 px-6 py-3 border border-red-500/50 text-red-200 font-display tracking-widest uppercase text-sm animate-pulse"
        >
          🤖 AI đang suy nghĩ...
        </div>
      </div>

      <!-- Game Over Modal -->
      <div
        v-if="isGameOver"
        class="absolute inset-0 bg-black/70 flex items-center justify-center z-40"
      >
        <div class="text-center p-8 border border-gray-600 bg-gray-900/95 max-w-sm">
          <h2
            class="font-display text-3xl font-bold mb-2"
            :class="gameState.winner === 'player' ? 'text-yellow-400' : 'text-red-400'"
          >
            {{ gameState.winner === 'player' ? '🏆 CHIẾN THẮNG!' : '💀 THẤT BẠI!' }}
          </h2>
          <p class="text-gray-400 text-sm mb-4">
            {{
              gameState.winner === 'player' ? 'Bạn đã nghiền nát con Bot!' : 'Bot đã xử đẹp bạn!'
            }}
          </p>
          <p class="text-gray-500 text-xs mb-6">
            Lượt: {{ gameState.turnNumber }} • HP còn:
            {{ gameState.winner === 'player' ? gameState.player.hp : gameState.opponent.hp }}
          </p>
          <div class="flex gap-3 justify-center">
            <button
              class="px-4 py-2 bg-purple-900/50 border border-purple-500/50 text-purple-300 font-display uppercase text-xs tracking-wider hover:bg-purple-800 transition-all cursor-pointer"
              @click="startGame(difficulty)"
            >
              Chơi lại
            </button>
            <button
              class="px-4 py-2 bg-gray-800 border border-gray-600 text-gray-300 font-display uppercase text-xs tracking-wider hover:bg-gray-700 transition-all cursor-pointer"
              @click="gameState.phase = 'lobby'"
            >
              Về Lobby
            </button>
          </div>
        </div>
      </div>

      <!-- Game Log (collapsible) -->
      <div
        v-if="showLog"
        class="absolute top-14 right-2 w-72 max-h-48 overflow-y-auto bg-black/90 border border-gray-700 rounded-lg p-2 z-20 text-[10px]"
      >
        <div class="flex justify-between items-center mb-1 sticky top-0 bg-black/90">
          <span class="text-gray-500 font-display uppercase text-[9px] tracking-wider"
            >Game Log</span
          >
          <button
            class="text-gray-500 hover:text-white text-xs cursor-pointer px-1"
            @click="showLog = false"
          >
            ✕
          </button>
        </div>
        <div
          v-for="(log, i) in reversedLog"
          :key="i"
          class="py-0.5 border-b border-gray-800/50 last:border-0"
        >
          <span :class="log.side === 'player' ? 'text-blue-400' : 'text-red-400'">{{
            log.message
          }}</span>
        </div>
      </div>
      <button
        v-if="!showLog"
        class="absolute top-14 right-2 z-20 w-6 h-6 bg-gray-800 border border-gray-600 rounded text-[10px] text-gray-400 hover:text-white cursor-pointer"
        @click="showLog = true"
        title="Game Log"
      >
        📜
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import type { CardType, Rarity, Keyword, CardData } from './types'
import { useGameEngine } from './composables/useGameEngine'

const {
  gameState,
  isLoading,
  isPlayerTurn,
  isGameOver,
  selectedCardIndex,
  attackingIndex,
  difficulty,
  startGame,
  playCard,
  attackWithCreature,
  endTurn,
} = useGameEngine()

const showLog = ref(false)
const showTutorial = ref(false)

// ===== VFX SYSTEM =====
interface VfxParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  opacity: number
  scale: number
  life: number
}

interface VfxPopup {
  id: number
  x: number
  y: number
  vy: number
  text: string
  color: string
  size: number
  opacity: number
  life: number
}

const vfxParticles = ref<VfxParticle[]>([])
const vfxPopups = ref<VfxPopup[]>([])
let vfxIdCounter = 0
let vfxAnimFrame = 0

function spawnVfx(
  x: number,
  y: number,
  count: number,
  color: string,
  opts: { spread?: number; sizeMin?: number; sizeMax?: number; speed?: number; life?: number } = {},
) {
  const { spread = 8, sizeMin = 3, sizeMax = 10, speed = 0.4, life = 40 } = opts
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const spd = (Math.random() * 0.5 + 0.5) * speed
    vfxParticles.value.push({
      id: vfxIdCounter++,
      x,
      y,
      vx: Math.cos(angle) * spd * spread,
      vy: Math.sin(angle) * spd * spread,
      size: sizeMin + Math.random() * (sizeMax - sizeMin),
      color,
      opacity: 1,
      scale: 1,
      life,
    })
  }
}

function spawnPopup(x: number, y: number, text: string, color: string, size = 24) {
  vfxPopups.value.push({
    id: vfxIdCounter++,
    x,
    y,
    vy: -0.3,
    text,
    color,
    size,
    opacity: 1,
    life: 50,
  })
}

function tickVfx() {
  // Update particles
  vfxParticles.value = vfxParticles.value
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      opacity: p.opacity - 1 / p.life,
      scale: p.scale * 0.97,
      life: p.life - 1,
    }))
    .filter((p) => p.life > 0 && p.opacity > 0)

  // Update popups
  vfxPopups.value = vfxPopups.value
    .map((p) => ({
      ...p,
      y: p.y + p.vy,
      opacity: p.opacity - 1 / p.life,
      life: p.life - 1,
    }))
    .filter((p) => p.life > 0 && p.opacity > 0)

  vfxAnimFrame = requestAnimationFrame(tickVfx)
}

vfxAnimFrame = requestAnimationFrame(tickVfx)
onUnmounted(() => cancelAnimationFrame(vfxAnimFrame))

// Watch for game log changes to trigger VFX
watch(
  () => gameState.value.log.length,
  (newLen, oldLen) => {
    if (newLen <= oldLen) return
    const latest = gameState.value.log[newLen - 1]
    if (!latest) return

    const msg = latest.message
    const isPlayer = latest.side === 'player'

    // Spell cast → magic sparkle
    if (msg.includes('✨') || msg.includes('phép')) {
      spawnVfx(50, 50, 25, '#a855f7', { spread: 15, sizeMax: 12, life: 50 })
      spawnVfx(50, 50, 15, '#c084fc', { spread: 10, sizeMax: 8, life: 35 })
      spawnPopup(50, 45, '✨', '#c084fc', 36)
    }

    // Damage → red explosion
    if (msg.includes('sát thương') && latest.type === 'attack') {
      const cx = isPlayer ? 50 : 50
      const cy = isPlayer ? 25 : 65
      spawnVfx(cx, cy, 30, '#ef4444', { spread: 12, sizeMax: 14, life: 40 })
      spawnVfx(cx, cy, 15, '#f97316', { spread: 8, sizeMax: 10, life: 30 })
      spawnPopup(cx, cy - 5, '💥', '#ef4444', 40)
    }

    // Summon/play → blue-green sparkle
    if (msg.includes('Triệu hồi') || msg.includes('triệu hồi')) {
      const cy = isPlayer ? 65 : 25
      spawnVfx(50, cy, 20, '#22d3ee', { spread: 10, sizeMax: 8, life: 35 })
      spawnVfx(50, cy, 10, '#34d399', { spread: 6, sizeMax: 6, life: 25 })
    }

    // Buff → gold sparkle
    if (msg.includes('+') && msg.includes('ATK')) {
      const cy = isPlayer ? 65 : 25
      spawnVfx(50, cy, 20, '#eab308', { spread: 8, sizeMax: 10, life: 40 })
      spawnPopup(50, cy - 5, '⬆️', '#eab308', 28)
    }

    // Heal → green particles
    if (msg.includes('Hồi') || msg.includes('hồi')) {
      const cy = isPlayer ? 78 : 8
      spawnVfx(30, cy, 18, '#22c55e', { spread: 6, sizeMax: 8, life: 35 })
      spawnPopup(30, cy - 3, '💚', '#22c55e', 28)
    }

    // Creature dies → dark explosion
    if (msg.includes('tiêu diệt') || msg.includes('Tiêu diệt')) {
      spawnVfx(50, 45, 25, '#991b1b', { spread: 12, sizeMax: 12, life: 35 })
      spawnVfx(50, 45, 12, '#7c2d12', { spread: 8, sizeMax: 8, life: 25 })
      spawnPopup(50, 40, '💀', '#dc2626', 32)
    }

    // Freeze → ice blue
    if (msg.includes('Đóng băng') || msg.includes('đóng băng')) {
      spawnVfx(50, 45, 20, '#93c5fd', { spread: 10, sizeMax: 8, life: 40 })
      spawnPopup(50, 40, '🧊', '#93c5fd', 32)
    }

    // Shield → golden flash
    if (msg.includes('Shield')) {
      spawnVfx(50, 55, 15, '#fbbf24', { spread: 6, sizeMax: 8, life: 30 })
      spawnPopup(50, 50, '🛡️', '#fbbf24', 28)
    }

    // Environment → wide green wave
    if (msg.includes('🌍')) {
      spawnVfx(25, 50, 15, '#10b981', { spread: 20, sizeMax: 6, life: 50 })
      spawnVfx(50, 50, 15, '#059669', { spread: 20, sizeMax: 6, life: 50 })
      spawnVfx(75, 50, 15, '#10b981', { spread: 20, sizeMax: 6, life: 50 })
    }

    // Trap → orange flash
    if (msg.includes('🪤') || msg.includes('bẫy')) {
      spawnVfx(50, 55, 15, '#f59e0b', { spread: 8, sizeMax: 8, life: 30 })
      spawnPopup(50, 50, '🪤', '#f59e0b', 28)
    }

    // Overflow → purple explosion
    if (msg.includes('Overflow')) {
      spawnVfx(50, 20, 35, '#7c3aed', { spread: 18, sizeMax: 16, life: 50 })
      spawnVfx(50, 20, 20, '#a78bfa', { spread: 12, sizeMax: 10, life: 35 })
      spawnPopup(50, 15, '💥 OVERFLOW!', '#a78bfa', 32)
    }

    // Draw
    if (msg.includes('Rút')) {
      const cy = isPlayer ? 85 : 5
      spawnVfx(70, cy, 10, '#818cf8', { spread: 5, sizeMax: 6, life: 25 })
    }

    // Victory
    if (msg.includes('🏆')) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          spawnVfx(20 + Math.random() * 60, 30 + Math.random() * 40, 20, '#eab308', {
            spread: 15,
            sizeMax: 12,
            life: 60,
          })
          spawnVfx(20 + Math.random() * 60, 30 + Math.random() * 40, 15, '#f97316', {
            spread: 12,
            sizeMax: 10,
            life: 50,
          })
        }, i * 200)
      }
    }

    // Weapon equip
    if (msg.includes('🗡️') || msg.includes('Trang bị')) {
      const cy = isPlayer ? 65 : 25
      spawnVfx(50, cy, 15, '#d97706', { spread: 8, sizeMax: 8, life: 30 })
      spawnPopup(50, cy - 5, '🗡️', '#d97706', 28)
    }
  },
)

// ===== GAME LOGIC =====
const difficultyLabel = computed(() => {
  switch (difficulty.value) {
    case 'easy':
      return 'Intern'
    case 'normal':
      return 'Mid Dev'
    case 'hard':
      return 'Senior'
    default:
      return ''
  }
})

const reversedLog = computed(() => [...gameState.value.log].reverse())

const canPlaySelectedToBoard = computed(() => {
  if (selectedCardIndex.value === null) return false
  const card = gameState.value.player.hand[selectedCardIndex.value]
  return card?.type === 'creature' || card?.type === 'weapon'
})

function handleHandCardClick(index: number) {
  if (!isPlayerTurn.value || isGameOver.value) return
  const card = gameState.value.player.hand[index]
  if (!card || card.cost > gameState.value.player.mana) return

  attackingIndex.value = null

  if (selectedCardIndex.value === index) {
    selectedCardIndex.value = null
    return
  }

  selectedCardIndex.value = index

  if (card.type === 'spell' && !needsTarget(card)) {
    playCard(index)
    selectedCardIndex.value = null
  } else if (card.type === 'support' && !needsCreatureTarget(card)) {
    playCard(index)
    selectedCardIndex.value = null
  } else if (card.type === 'trap') {
    playCard(index)
    selectedCardIndex.value = null
  } else if (card.type === 'environment') {
    playCard(index)
    selectedCardIndex.value = null
  }
}

function handleBoardCreatureClick(boardIndex: number) {
  if (!isPlayerTurn.value || isGameOver.value) return

  const slot = gameState.value.player.board[boardIndex]

  if (selectedCardIndex.value !== null) {
    const card = gameState.value.player.hand[selectedCardIndex.value]
    if (card) {
      if (card.type === 'creature' && !slot) {
        playCard(selectedCardIndex.value, boardIndex)
        selectedCardIndex.value = null
        return
      }
      if ((card.type === 'weapon' || card.type === 'support') && slot) {
        playCard(selectedCardIndex.value, boardIndex)
        selectedCardIndex.value = null
        return
      }
      if (card.type === 'spell' && slot) {
        playCard(selectedCardIndex.value, boardIndex)
        selectedCardIndex.value = null
        return
      }
    }
  }

  if (slot && slot.canAttack && !slot.hasAttacked && !slot.frozen) {
    if (attackingIndex.value === boardIndex) {
      attackingIndex.value = null
    } else {
      attackingIndex.value = boardIndex
      selectedCardIndex.value = null
    }
  }
}

function handleDefenderClick(defenderIdx: number) {
  if (attackingIndex.value === null) {
    if (selectedCardIndex.value !== null) {
      const card = gameState.value.player.hand[selectedCardIndex.value]
      if (card && card.type === 'spell') {
        playCard(selectedCardIndex.value, defenderIdx)
        selectedCardIndex.value = null
      }
    }
    return
  }
  attackWithCreature(attackingIndex.value, defenderIdx)
  attackingIndex.value = null
}

function handleEnemyHeroAttack() {
  if (attackingIndex.value === null) return
  attackWithCreature(attackingIndex.value, 'hero')
  attackingIndex.value = null
}

function needsTarget(card: CardData): boolean {
  return card.effects.some((e) =>
    ['enemy_creature', 'friendly_creature', 'any_creature'].includes(e.target),
  )
}

function needsCreatureTarget(card: CardData): boolean {
  return card.effects.some((e) => e.target === 'friendly_creature')
}

function cardTypeEmoji(type: CardType): string {
  const map: Record<CardType, string> = {
    creature: '⚔️',
    spell: '✨',
    trap: '🪤',
    support: '💊',
    weapon: '🗡️',
    environment: '🌍',
  }
  return map[type]
}

function rarityColor(rarity: Rarity): string {
  const map: Record<Rarity, string> = {
    common: 'text-gray-500',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
  }
  return map[rarity]
}

function rarityLabel(rarity: Rarity): string {
  const map: Record<Rarity, string> = {
    common: '⭐',
    rare: '⭐⭐',
    epic: '⭐⭐⭐',
    legendary: '🌟',
  }
  return map[rarity]
}

function keywordEmoji(kw: Keyword): string {
  const map: Record<Keyword, string> = {
    rush: '⚡',
    shield: '🛡️',
    stealth: '👻',
    taunt: '🏰',
    lifesteal: '🧛',
    poison: '☠️',
    deathrattle: '💀',
    battlecry: '📯',
    overflow: '💥',
  }
  return map[kw]
}

function getCardEmoji(card: CardData): string {
  if (card.name.includes('Docker')) return '🐳'
  if (card.name.includes('React')) return '⚛️'
  if (card.name.includes('Bug')) return '🐛'
  if (card.name.includes('Coffee') || card.name.includes('Cà phê')) return '☕'
  if (card.name.includes('AI') || card.name.includes('Bot') || card.name.includes('ChatGPT'))
    return '🤖'
  if (card.name.includes('Intern') || card.name.includes('Junior')) return '👶'
  if (card.name.includes('Senior') || card.name.includes('Lead')) return '🧙'
  if (card.name.includes('CEO') || card.name.includes('Manager')) return '👔'
  if (card.name.includes('QA') || card.name.includes('Test')) return '🔍'
  if (card.name.includes('Null') || card.name.includes('Error')) return '💥'
  if (card.name.includes('Memory')) return '🧠'
  if (card.name.includes('Hack')) return '👾'
  if (card.name.includes('Database') || card.name.includes('SQL')) return '🗄️'
  if (card.name.includes('Git') || card.name.includes('GitHub')) return '🐙'
  if (card.name.includes('Kubernetes') || card.name.includes('K8s')) return '☸️'
  if (card.name.includes('Stack Overflow')) return '📚'
  if (card.name.includes('Fire') || card.name.includes('Production')) return '🔥'
  if (card.name.includes('Shield') || card.name.includes('Firewall')) return '🛡️'
  if (card.name.includes('Token') || card.name.includes('Container')) return '📦'
  if (card.rarity === 'legendary') return '🌟'
  if (card.type === 'creature') return '👤'
  return '🃏'
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
