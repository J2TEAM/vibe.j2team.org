<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useI18n } from '../composables/useI18n'

const emit = defineEmits<{
  start: []
  tutorial: []
}>()
const { locale, toggleLocale } = useI18n()

const showHelp = ref(false)
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep flex flex-col items-center justify-center px-6 relative overflow-hidden"
  >
    <!-- Background texture -->
    <div
      class="absolute inset-0 pointer-events-none opacity-20"
      style="
        background:
          radial-gradient(ellipse at 30% 40%, rgba(74, 222, 128, 0.15) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 60%, rgba(56, 189, 248, 0.1) 0%, transparent 50%);
      "
    />

    <div class="relative z-10 text-center max-w-sm w-full">
      <!-- Back link -->
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1 text-text-dim text-sm mb-8 hover:text-text-primary transition-colors"
      >
        ← {{ locale === 'vi' ? 'Trang chủ' : 'Home' }}
      </RouterLink>

      <!-- Title -->
      <h1
        class="font-display text-5xl font-bold text-text-primary mb-2 animate-fade-up flex items-center justify-center gap-2"
      >
        Vườn Ươm
        <button class="help-btn" @click="showHelp = true">?</button>
      </h1>
      <p class="text-text-secondary text-sm mb-1 animate-fade-up animate-delay-1">
        {{ locale === 'vi' ? 'Lồng ươm thế giới' : 'World Incubator' }}
      </p>
      <p class="text-text-dim text-xs mb-10 animate-fade-up animate-delay-2 leading-relaxed">
        {{
          locale === 'vi'
            ? 'Ươm mầm một thế giới của riêng bạn trong 50 năm.'
            : 'Nurture your own world over 50 years. No game over — only discovery.'
        }}
      </p>

      <!-- Start buttons -->
      <button
        class="w-full py-3 border border-accent-coral text-accent-coral font-display font-semibold text-lg hover:bg-accent-coral hover:text-bg-deep transition-all duration-200 animate-fade-up animate-delay-3 rounded-lg"
        @click="emit('tutorial')"
      >
        {{ locale === 'vi' ? 'Bắt đầu hành trình' : 'Begin the Journey' }}
      </button>

      <button
        class="w-full mt-3 py-2.5 text-text-dim text-sm hover:text-text-secondary transition-colors animate-fade-up animate-delay-4"
        @click="emit('start')"
      >
        {{ locale === 'vi' ? 'Tôi đã biết đường đi →' : 'I know the way →' }}
      </button>

      <!-- Locale toggle -->
      <button
        class="mt-6 text-xs text-text-dim hover:text-text-secondary transition-colors animate-fade-up animate-delay-5"
        @click="toggleLocale"
      >
        {{ locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt' }}
      </button>

      <!-- Credit -->
      <p class="mt-10 text-text-dim text-xs animate-fade-up animate-delay-5">
        {{ locale === 'vi' ? 'Lấy cảm hứng từ' : 'Inspired by' }}
        <span class="text-text-secondary">Half-Earth Socialism</span>
      </p>
    </div>
  </div>

  <!-- Help overlay -->
  <Teleport to="body">
    <div v-if="showHelp" class="help-overlay" @click.self="showHelp = false">
      <div class="help-panel">
        <button class="help-close" @click="showHelp = false">
          <Icon icon="lucide:x" class="size-4" />
        </button>

        <h2 class="help-heading">// Vườn Ươm</h2>
        <p class="help-desc">
          {{
            locale === 'vi'
              ? 'Trò chơi chiến lược thẻ bài nhẹ nhàng — bạn nuôi dưỡng một thế giới giả tưởng trong 50 lượt (50 năm). Không có game over, chỉ có hành trình khám phá.'
              : 'A light card strategy game — nurture a fantasy world over 50 turns (50 years). No game over, only discovery.'
          }}
        </p>

        <h3 class="help-sub">{{ locale === 'vi' ? '🎴 Vòng lặp mỗi lượt' : '🎴 Each turn' }}</h3>
        <ul class="help-list">
          <li>
            {{
              locale === 'vi'
                ? 'Chọn tối đa 2 thẻ bài từ bộ bài trên tay để đặt vào thế giới'
                : 'Pick up to 2 cards from your hand to place in the world'
            }}
          </li>
          <li>
            {{
              locale === 'vi'
                ? 'Mỗi thẻ tốn Ngân Sách 💰 hoặc Sức Dân ⚡ để mua'
                : 'Each card costs Budget 💰 or Energy ⚡'
            }}
          </li>
          <li>
            {{
              locale === 'vi'
                ? 'Một số thẻ cần tài nguyên: Lương thực, Vật liệu, Tri thức'
                : 'Some cards need resources: Food, Materials, Knowledge'
            }}
          </li>
        </ul>

        <h3 class="help-sub">
          {{ locale === 'vi' ? '📊 4 trụ cột cần cân bằng' : '📊 4 pillars to balance' }}
        </h3>
        <ul class="help-list">
          <li>
            <span style="color: #4ade80">🌿 Sinh Thái</span> —
            {{ locale === 'vi' ? 'sức sống thiên nhiên' : 'nature vitality' }}
          </li>
          <li>
            <span style="color: #ffb830">👥 Nhân Sinh</span> —
            {{ locale === 'vi' ? 'hạnh phúc con người' : 'human wellbeing' }}
          </li>
          <li>
            <span style="color: #ff6b4a">💰 Giao Thương</span> —
            {{ locale === 'vi' ? 'thịnh vượng kinh tế' : 'economic prosperity' }}
          </li>
          <li>
            <span style="color: #38bdf8">💻 Số Hóa</span> —
            {{ locale === 'vi' ? 'công nghệ & kết nối' : 'technology & connectivity' }}
          </li>
        </ul>

        <h3 class="help-sub">{{ locale === 'vi' ? '🏁 Kết thúc' : '🏁 Ending' }}</h3>
        <ul class="help-list">
          <li>
            {{
              locale === 'vi'
                ? 'Sau lượt 50, bạn thấy thế giới mình đã xây dựng nên như thế nào'
                : 'After turn 50, see what kind of world you built'
            }}
          </li>
          <li>
            {{
              locale === 'vi'
                ? 'Cân bằng cả 4 trụ cột để mở ra những kết thúc tốt đẹp nhất'
                : 'Balance all 4 pillars to unlock the best endings'
            }}
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.help-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--color-border-default);
  background: transparent;
  color: var(--color-text-dim);
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  margin-left: 2px;
  vertical-align: middle;
  transition: all 0.2s;
  flex-shrink: 0;
}
.help-btn:hover {
  border-color: var(--color-accent-coral);
  color: var(--color-accent-coral);
}

.help-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fade-in 0.2s ease-out;
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.help-panel {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  padding: 1.5rem;
  max-width: 420px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  animation: panel-up 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes panel-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.help-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  color: var(--color-text-dim);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.15s;
}
.help-close:hover {
  color: var(--color-text-primary);
}
.help-heading {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-accent-coral);
  margin-bottom: 0.5rem;
}
.help-desc {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}
.help-sub {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 1rem 0 0.4rem;
}
.help-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.help-list li {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  padding-left: 1rem;
  position: relative;
}
.help-list li::before {
  content: '—';
  position: absolute;
  left: 0;
  color: var(--color-text-dim);
}
</style>
