<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Game } from './engine/Game'

const canvasRef = ref<HTMLCanvasElement>()
let game: Game | null = null

const GAME_WIDTH = 800
const GAME_HEIGHT = 480

const isMuted = ref(false)
const isMobile = ref(false)
const activeTab = ref<'play' | 'boss'>('play')
const guideLang = ref<'vi' | 'en'>('vi')

function checkMobile() {
  isMobile.value = 'ontouchstart' in window || window.innerWidth < 768
}

function handleResize() {
  checkMobile()
}

function toggleMute() {
  if (game) {
    isMuted.value = game.toggleMute()
  }
}

function onTouchBtn(action: string, pressed: boolean) {
  if (!game) return
  switch (action) {
    case 'left':
      game.setTouchLeft(pressed)
      break
    case 'right':
      game.setTouchRight(pressed)
      break
    case 'jump':
      game.setTouchJump(pressed)
      break
  }
}

function onCanvasTap() {
  if (game) {
    game.handleTap()
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
  if (canvasRef.value) {
    canvasRef.value.width = GAME_WIDTH
    canvasRef.value.height = GAME_HEIGHT
    game = new Game(canvasRef.value)
    game.start()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (game) {
    game.stop()
    game = null
  }
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center px-4 pb-12"
  >
    <!-- Top bar -->
    <div class="w-full max-w-5xl flex items-center justify-between py-4 animate-fade-up">
      <RouterLink
        to="/"
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
      >
        &larr; Về trang chủ
      </RouterLink>

      <h1 class="font-display text-base font-bold text-accent-coral tracking-wide hidden sm:block">
        SUPER MARIO — BOSS BATTLE
      </h1>

      <button
        class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        @click="toggleMute"
      >
        {{ isMuted ? '🔇 Tắt tiếng' : '🔊 Bật tiếng' }}
      </button>
    </div>

    <!-- Canvas -->
    <div
      class="w-full max-w-5xl border border-border-default bg-bg-surface animate-fade-up animate-delay-1"
    >
      <canvas
        ref="canvasRef"
        class="game-canvas"
        @click="onCanvasTap"
        @touchstart.prevent="onCanvasTap"
      />
    </div>

    <!-- Mobile touch controls -->
    <div
      v-if="isMobile"
      class="w-full max-w-5xl flex justify-between items-center px-4 py-3 border-x border-b border-border-default bg-bg-surface select-none"
      style="touch-action: none; -webkit-user-select: none"
    >
      <div class="flex gap-3">
        <button
          class="touch-btn border border-border-default bg-bg-elevated text-text-primary"
          @touchstart.prevent="onTouchBtn('left', true)"
          @touchend.prevent="onTouchBtn('left', false)"
          @touchcancel.prevent="onTouchBtn('left', false)"
        >
          &larr;
        </button>
        <button
          class="touch-btn border border-border-default bg-bg-elevated text-text-primary"
          @touchstart.prevent="onTouchBtn('right', true)"
          @touchend.prevent="onTouchBtn('right', false)"
          @touchcancel.prevent="onTouchBtn('right', false)"
        >
          &rarr;
        </button>
      </div>
      <button
        class="touch-btn jump-btn border border-accent-coral bg-accent-coral/10 text-accent-coral font-display font-bold"
        @touchstart.prevent="onTouchBtn('jump', true)"
        @touchend.prevent="onTouchBtn('jump', false)"
        @touchcancel.prevent="onTouchBtn('jump', false)"
      >
        JUMP
      </button>
    </div>

    <!-- Guide Section -->
    <div
      class="w-full max-w-5xl border-x border-b border-border-default bg-bg-surface mt-6 animate-fade-up animate-delay-2"
    >
      <!-- Section heading -->
      <div class="px-6 pt-5 pb-3 border-b border-border-default flex items-center gap-3">
        <span class="font-display text-sm tracking-widest text-accent-coral">//</span>
        <h2 class="font-display text-lg font-semibold text-text-primary">Hướng dẫn</h2>

        <!-- Tabs + Lang toggle -->
        <div class="ml-auto flex items-center">
          <button
            class="px-4 py-1.5 text-sm font-display font-semibold border-b-2 transition-colors"
            :class="
              activeTab === 'play'
                ? 'text-accent-coral border-accent-coral'
                : 'text-text-dim border-transparent hover:text-text-secondary'
            "
            @click="activeTab = 'play'"
          >
            {{ guideLang === 'vi' ? 'Cách chơi' : 'How to Play' }}
          </button>
          <button
            class="px-4 py-1.5 text-sm font-display font-semibold border-b-2 transition-colors"
            :class="
              activeTab === 'boss'
                ? 'text-accent-coral border-accent-coral'
                : 'text-text-dim border-transparent hover:text-text-secondary'
            "
            @click="activeTab = 'boss'"
          >
            {{ guideLang === 'vi' ? 'Đánh Boss' : 'Boss Fight' }}
          </button>
          <div class="w-px h-5 bg-border-default mx-2" />
          <button
            class="px-3 py-1 text-xs font-display font-bold text-accent-amber border border-border-default hover:border-accent-amber transition-colors"
            @click="guideLang = guideLang === 'vi' ? 'en' : 'vi'"
          >
            {{ guideLang === 'vi' ? 'EN' : 'VI' }}
          </button>
        </div>
      </div>

      <!-- How to Play -->
      <div v-if="activeTab === 'play'" class="p-6 flex flex-col gap-6">
        <!-- Controls -->
        <div>
          <p class="font-display text-xs tracking-widest text-accent-amber mb-3">
            {{ guideLang === 'vi' ? '// ĐIỀU KHIỂN' : '// CONTROLS' }}
          </p>
          <table class="guide-table w-full text-sm">
            <thead>
              <tr class="border-b border-border-default">
                <th class="text-left py-2 px-3 font-display text-xs tracking-wide text-text-dim">
                  {{ guideLang === 'vi' ? 'Hành động' : 'Action' }}
                </th>
                <th class="text-left py-2 px-3 font-display text-xs tracking-wide text-text-dim">
                  {{ guideLang === 'vi' ? 'Bàn phím' : 'Keyboard' }}
                </th>
                <th class="text-left py-2 px-3 font-display text-xs tracking-wide text-text-dim">
                  {{ guideLang === 'vi' ? 'Cảm ứng' : 'Touch' }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border-default/50 hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-text-secondary">
                  {{ guideLang === 'vi' ? 'Di chuyển trái/phải' : 'Move left/right' }}
                </td>
                <td class="py-2 px-3 text-text-primary font-display text-xs">Arrow / A, D</td>
                <td class="py-2 px-3 text-text-secondary">
                  {{ guideLang === 'vi' ? 'Nút trái/phải' : 'Left/Right buttons' }}
                </td>
              </tr>
              <tr class="border-b border-border-default/50 hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-text-secondary">
                  {{ guideLang === 'vi' ? 'Nhảy' : 'Jump' }}
                </td>
                <td class="py-2 px-3 text-text-primary font-display text-xs">Space / W / ↑</td>
                <td class="py-2 px-3 text-text-secondary">
                  {{ guideLang === 'vi' ? 'Nút JUMP' : 'JUMP button' }}
                </td>
              </tr>
              <tr class="border-b border-border-default/50 hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-text-secondary">
                  {{ guideLang === 'vi' ? 'Nhảy cao hơn' : 'Jump higher' }}
                </td>
                <td class="py-2 px-3 text-text-primary font-display text-xs">
                  {{ guideLang === 'vi' ? 'Giữ phím nhảy' : 'Hold jump key' }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{ guideLang === 'vi' ? 'Giữ nút JUMP' : 'Hold JUMP' }}
                </td>
              </tr>
              <tr class="hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-text-secondary">
                  {{ guideLang === 'vi' ? 'Bật/tắt âm thanh' : 'Toggle sound' }}
                </td>
                <td class="py-2 px-3 text-text-primary font-display text-xs">M</td>
                <td class="py-2 px-3 text-text-secondary">
                  {{ guideLang === 'vi' ? 'Nút SOUND' : 'SOUND button' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Items -->
        <div>
          <p class="font-display text-xs tracking-widest text-accent-amber mb-3">
            {{ guideLang === 'vi' ? '// VẬT PHẨM' : '// ITEMS' }}
          </p>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border-default">
                <th class="text-left py-2 px-3 font-display text-xs tracking-wide text-text-dim">
                  {{ guideLang === 'vi' ? 'Vật phẩm' : 'Item' }}
                </th>
                <th class="text-left py-2 px-3 font-display text-xs tracking-wide text-text-dim">
                  {{ guideLang === 'vi' ? 'Hiệu ứng' : 'Effect' }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border-default/50 hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-accent-amber font-display text-xs">
                  {{ guideLang === 'vi' ? 'Khối ? (vàng)' : '? Block (yellow)' }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? 'Nhảy đụng đầu để mở — nhận xu, nấm hoặc ngôi sao'
                      : 'Hit from below — get coins, mushroom or star'
                  }}
                </td>
              </tr>
              <tr class="border-b border-border-default/50 hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-accent-coral font-display text-xs">
                  {{ guideLang === 'vi' ? 'Nấm (đỏ)' : 'Mushroom (red)' }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? 'Mario to lên, chịu được 1 lần trúng đòn'
                      : 'Mario grows big, can take 1 extra hit'
                  }}
                </td>
              </tr>
              <tr class="border-b border-border-default/50 hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-accent-amber font-display text-xs">
                  {{ guideLang === 'vi' ? 'Ngôi sao' : 'Star' }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? 'Bất tử tạm thời — tiêu diệt kẻ địch khi chạm vào'
                      : 'Temporary invincibility — destroy enemies on contact'
                  }}
                </td>
              </tr>
              <tr class="border-b border-border-default/50 hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-accent-amber font-display text-xs">
                  {{ guideLang === 'vi' ? 'Xu vàng' : 'Gold coin' }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? '+100 điểm, thu 100 xu = +1 mạng'
                      : '+100 points, collect 100 = +1 life'
                  }}
                </td>
              </tr>
              <tr class="hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-accent-sky font-display text-xs">
                  {{ guideLang === 'vi' ? 'Cờ (cuối màn)' : 'Flag (end of level)' }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? 'Chạm cờ để hoàn thành màn chơi'
                      : 'Touch the flag to clear the level'
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Enemies -->
        <div>
          <p class="font-display text-xs tracking-widest text-accent-amber mb-3">
            {{ guideLang === 'vi' ? '// KẺ ĐỊCH' : '// ENEMIES' }}
          </p>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border-default">
                <th class="text-left py-2 px-3 font-display text-xs tracking-wide text-text-dim">
                  {{ guideLang === 'vi' ? 'Kẻ địch' : 'Enemy' }}
                </th>
                <th class="text-left py-2 px-3 font-display text-xs tracking-wide text-text-dim">
                  {{ guideLang === 'vi' ? 'Cách tiêu diệt' : 'How to defeat' }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border-default/50 hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-text-primary font-display text-xs">Goomba</td>
                <td class="py-2 px-3 text-text-secondary">
                  {{ guideLang === 'vi' ? 'Nhảy lên đầu để giết' : 'Jump on its head to kill' }}
                </td>
              </tr>
              <tr class="hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-text-primary font-display text-xs">Koopa</td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? 'Nhảy lên đầu → mai rùa → đá mai rùa để giết kẻ địch khác'
                      : 'Stomp → shell → kick shell to kill other enemies'
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Boss Fight Guide -->
      <div v-if="activeTab === 'boss'" class="p-6 flex flex-col gap-6">
        <!-- Phases -->
        <div>
          <p class="font-display text-xs tracking-widest text-accent-coral mb-3">
            {{ guideLang === 'vi' ? '// CÁC GIAI ĐOẠN BOWSER' : '// BOWSER PHASES' }}
          </p>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border-default">
                <th class="text-left py-2 px-3 font-display text-xs tracking-wide text-text-dim">
                  {{ guideLang === 'vi' ? 'Giai đoạn' : 'Phase' }}
                </th>
                <th class="text-left py-2 px-3 font-display text-xs tracking-wide text-text-dim">
                  {{ guideLang === 'vi' ? 'Hành vi của Bowser' : 'Bowser behavior' }}
                </th>
                <th class="text-left py-2 px-3 font-display text-xs tracking-wide text-text-dim">
                  {{ guideLang === 'vi' ? 'Cách đánh' : 'Strategy' }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-border-default/50 hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-accent-sky font-display text-xs whitespace-nowrap">
                  {{ guideLang === 'vi' ? 'Giai đoạn 1' : 'Phase 1' }}<br /><span
                    class="text-text-dim"
                    >HP 3/3</span
                  >
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? 'Đi bộ, bắn cầu lửa, thỉnh thoảng lao về phía bạn'
                      : 'Walks, shoots fireballs, occasionally charges'
                  }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? 'Nhảy lên đầu Bowser để gây sát thương. Khi lao vào tường sẽ bị choáng — cơ hội tốt nhất!'
                      : "Jump on Bowser's head to deal damage. Wall charge = stunned — best chance to attack!"
                  }}
                </td>
              </tr>
              <tr class="border-b border-border-default/50 hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-accent-amber font-display text-xs whitespace-nowrap">
                  {{ guideLang === 'vi' ? 'Giai đoạn 2' : 'Phase 2' }}<br /><span
                    class="text-text-dim"
                    >HP 2/3</span
                  >
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? 'Nhanh hơn, thêm chiêu đập đất gây chấn động'
                      : 'Faster, adds ground pound attack'
                  }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? 'Tránh xa khi Bowser nhảy lên và đập xuống. Đợi lao + choáng rồi nhảy lên đầu'
                      : 'Stay away when Bowser jumps and slams. Wait for charge + stun, then stomp'
                  }}
                </td>
              </tr>
              <tr class="hover:bg-bg-elevated transition-colors">
                <td class="py-2 px-3 text-accent-coral font-display text-xs whitespace-nowrap">
                  {{ guideLang === 'vi' ? 'Giai đoạn 3' : 'Phase 3' }}<br /><span
                    class="text-text-dim"
                    >HP 1/3</span
                  >
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? 'Chế độ cuồng nộ — lao nhanh hơn, bắn cầu lửa liên tục'
                      : 'Rage mode — faster charges, rapid fireballs'
                  }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{
                    guideLang === 'vi'
                      ? 'Cẩn thận hơn! Bowser lao nhanh và bắn nhiều hơn. Kiên nhẫn đợi cơ hội và nhảy lên đầu lần cuối'
                      : 'Be careful! Faster charges, more fireballs. Be patient, wait for opening, land final stomp'
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tips -->
        <div>
          <p class="font-display text-xs tracking-widest text-accent-coral mb-3">
            {{ guideLang === 'vi' ? '// MẸO' : '// TIPS' }}
          </p>
          <ul class="flex flex-col gap-2">
            <li
              v-for="tip in guideLang === 'vi'
                ? [
                    'Nhảy lên đầu Bowser bất cứ lúc nào (khi không bất tử) đều gây sát thương',
                    'Khi Bowser đang bất tử (nhấp nháy), nhảy lên đầu sẽ nảy lên an toàn mà không bị thương',
                    'Khi Bowser bị choáng (sau khi lao vào tường), bạn có thể đi qua người Bowser mà không bị thương',
                    'Tránh hố dung nham — 2 hố nham ở 2 bên sàn đấu!',
                    'Sử dụng các khối gạch ở giữa sàn đấu làm chỗ ẩn nấp tránh cầu lửa',
                  ]
                : [
                    'Stomping Bowser\'s head anytime (when not invincible) deals damage',
                    'When Bowser is invincible (flashing), stomping bounces you off safely',
                    'When Bowser is stunned (after wall charge), you can walk through him safely',
                    'Avoid lava pits — 2 lava gaps on both sides of the arena!',
                    'Use the brick platforms in the middle of the arena as cover from fireballs',
                  ]"
              :key="tip"
              class="flex items-start gap-3 border border-border-default bg-bg-elevated px-4 py-2.5 hover:border-accent-coral/30 transition-colors"
            >
              <span class="text-accent-coral font-display text-xs mt-0.5 shrink-0">→</span>
              <span class="text-text-secondary text-sm">{{ tip }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Credits -->
    <div
      class="w-full max-w-5xl mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-up animate-delay-3"
    >
      <p class="text-text-dim text-xs font-display tracking-wide">
        Made by <span class="text-text-secondary">uydev</span>
        <span class="text-border-default mx-2">|</span>
        VOL.01 / 2026
        <span class="text-border-default mx-2">|</span>
        vibe.j2team.org
      </p>
      <div class="flex items-center gap-4">
        <a
          href="https://github.com/UyLeQuoc"
          target="_blank"
          rel="noopener noreferrer"
          class="text-text-dim text-xs font-display tracking-wide link-underline hover:text-text-primary transition-colors"
        >
          GitHub
        </a>
        <span class="text-border-default">|</span>
        <a
          href="https://www.facebook.com/uyledev/"
          target="_blank"
          rel="noopener noreferrer"
          class="text-text-dim text-xs font-display tracking-wide link-underline hover:text-text-primary transition-colors"
        >
          Facebook
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-canvas {
  display: block;
  width: 100%;
  aspect-ratio: 800 / 480;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.touch-btn {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-family: var(--font-body);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  transition: background-color 0.1s;
}

.touch-btn:active {
  background-color: var(--color-bg-elevated);
  border-color: var(--color-accent-coral);
}

.jump-btn {
  width: 76px;
  height: 76px;
  font-size: 13px;
  font-family: var(--font-display);
}

.jump-btn:active {
  background-color: color-mix(in srgb, var(--color-accent-coral) 25%, transparent);
}

@media (max-width: 480px) {
  .touch-btn {
    width: 52px;
    height: 52px;
    font-size: 18px;
  }

  .jump-btn {
    width: 64px;
    height: 64px;
    font-size: 11px;
  }
}
</style>
