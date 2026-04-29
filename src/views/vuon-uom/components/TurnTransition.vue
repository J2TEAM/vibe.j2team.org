<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Stats, DerivedStats, StatKey } from '../types'
import { useI18n } from '../composables/useI18n'
import { Icon } from '@iconify/vue'
import { TRACK_LUCIDE, DERIVED_LUCIDE } from '../constants/icons'

const props = defineProps<{
  turn: number
  year: number
  stats: Stats
  derived: DerivedStats
  energy: number
}>()

const emit = defineEmits<{
  continue: []
}>()

const { locale } = useI18n()

// ── Current dialogue page ────────────────────────────────────────────────
const page = ref(0)

// Reset page when turn changes
watch(
  () => props.turn,
  () => {
    page.value = 0
  },
)

// ── Determine dominant stat ──────────────────────────────────────────────
const dominant = computed<StatKey>(() => {
  const s = props.stats
  const entries: [StatKey, number][] = [
    ['nature', s.nature],
    ['human', s.human],
    ['economy', s.economy],
    ['digital', s.digital],
  ]
  entries.sort((a, b) => b[1] - a[1])
  return entries[0]![0]
})

// ── Stat theme config ────────────────────────────────────────────────────
interface StatTheme {
  icon: string
  iconColor: string
  color: string
  glow: string
}

const THEMES: Record<StatKey, StatTheme> = {
  nature: {
    icon: TRACK_LUCIDE.nature,
    iconColor: '#4ADE80',
    color: 'text-green-400',
    glow: 'rgba(74,222,128,0.15)',
  },
  economy: {
    icon: TRACK_LUCIDE.economy,
    iconColor: '#FF6B4A',
    color: 'text-accent-amber',
    glow: 'rgba(255,184,48,0.15)',
  },
  human: {
    icon: TRACK_LUCIDE.human,
    iconColor: '#FFB830',
    color: 'text-amber-300',
    glow: 'rgba(252,211,77,0.15)',
  },
  digital: {
    icon: TRACK_LUCIDE.digital,
    iconColor: '#38BDF8',
    color: 'text-sky-400',
    glow: 'rgba(56,189,248,0.15)',
  },
}

const theme = computed(() => THEMES[dominant.value])

// ── Dialogue content per turn (multi-page) ───────────────────────────────

interface DialogueLine {
  speaker?: string // narrator name or undefined for narration
  vi: string
  en: string
  mood?: 'hopeful' | 'warning' | 'neutral' | 'triumph'
}

// Per-turn cutscene dialogue — each turn gets 3-5 lines
const CUTSCENES: Record<number, { vi: DialogueLine[]; en: DialogueLine[] }> = {
  1: {
    vi: [
      { vi: 'Mảnh đất này đã im lặng rất lâu.', en: '', mood: 'neutral' },
      {
        vi: 'Không ai nhớ lần cuối nghe tiếng suối chảy là khi nào. Không ai nhớ tên con đường cũ.',
        en: '',
        mood: 'neutral',
      },
      { vi: 'Nhưng hôm nay, có ai đó đã gieo xuống hạt mầm đầu tiên.', en: '', mood: 'hopeful' },
      { vi: 'Và đất đã nghe thấy.', en: '', mood: 'hopeful' },
    ],
    en: [
      { vi: '', en: 'This land has been silent for a very long time.', mood: 'neutral' },
      {
        vi: '',
        en: 'No one remembers the last time they heard the stream. No one remembers the name of the old road.',
        mood: 'neutral',
      },
      { vi: '', en: 'But today, someone planted the first seed.', mood: 'hopeful' },
      { vi: '', en: 'And the earth listened.', mood: 'hopeful' },
    ],
  },
  2: {
    vi: [
      { vi: 'Năm năm trôi qua như một giấc mơ nhạt.', en: '', mood: 'neutral' },
      {
        vi: 'Những gốc cây đầu tiên đã bén rễ. Vài ngôi nhà mọc lên dọc bờ sông, khói bếp bắt đầu bay lên mỗi chiều.',
        en: '',
        mood: 'hopeful',
      },
      {
        speaker: 'Người già',
        vi: '"Cây non mà đã thấy bóng — tốt lắm. Nhưng đừng vội. Mùa mưa sẽ thử thách tất cả."',
        en: '',
        mood: 'warning',
      },
      {
        vi: 'Phía xa, tiếng búa gõ nhịp đều đặn. Ai đó đang xây một cái gì đó lớn hơn một căn nhà.',
        en: '',
        mood: 'neutral',
      },
    ],
    en: [
      { vi: '', en: 'Five years passed like a faded dream.', mood: 'neutral' },
      {
        vi: '',
        en: 'The first trees have taken root. A few houses appeared along the riverbank, and smoke began to rise each evening.',
        mood: 'hopeful',
      },
      {
        speaker: 'The Elder',
        vi: '',
        en: '"Saplings that already cast shadows — good. But don\'t rush. The rains will test everything."',
        mood: 'warning',
      },
      {
        vi: '',
        en: 'In the distance, a hammer strikes in steady rhythm. Someone is building something bigger than a house.',
        mood: 'neutral',
      },
    ],
  },
  3: {
    vi: [
      {
        vi: 'Năm thứ 15. Con đường mòn đã trở thành đường đất. Đường đất đã trở thành lối đi.',
        en: '',
        mood: 'neutral',
      },
      {
        vi: 'Trẻ con chơi đùa nơi ngày trước chỉ có cỏ dại. Tiếng cười là dấu hiệu đầu tiên của sự thay đổi thực sự.',
        en: '',
        mood: 'hopeful',
      },
      {
        speaker: 'Thương nhân',
        vi: '"Tôi nghe nói vùng đất này đang thức giấc. Cho tôi xem bạn có gì."',
        en: '',
        mood: 'neutral',
      },
      {
        vi: 'Nhưng mỗi bước tiến đều có cái giá. Đâu đó, một con suối đã cạn khô mà không ai để ý.',
        en: '',
        mood: 'warning',
      },
      {
        vi: 'Sự lựa chọn của bạn bắt đầu tạo ra hình dáng cho thế giới này.',
        en: '',
        mood: 'hopeful',
      },
    ],
    en: [
      {
        vi: '',
        en: 'Year fifteen. The trail became a dirt road. The dirt road became a path.',
        mood: 'neutral',
      },
      {
        vi: '',
        en: 'Children play where only weeds once grew. Laughter is the first true sign of change.',
        mood: 'hopeful',
      },
      {
        speaker: 'The Merchant',
        vi: '',
        en: '"I heard this land is waking up. Show me what you have."',
        mood: 'neutral',
      },
      {
        vi: '',
        en: 'But every step forward has its cost. Somewhere, a stream ran dry and no one noticed.',
        mood: 'warning',
      },
      { vi: '', en: 'Your choices are beginning to give shape to this world.', mood: 'hopeful' },
    ],
  },
  4: {
    vi: [
      { vi: 'Đã hai mươi năm kể từ hạt mầm đầu tiên.', en: '', mood: 'neutral' },
      {
        vi: 'Bạn nhìn ra xa và không nhận ra vùng đất này nữa. Nó đã khác. Bạn cũng đã khác.',
        en: '',
        mood: 'neutral',
      },
      {
        speaker: 'Người thợ rèn',
        vi: '"Thép tốt phải qua lửa ba lần. Vùng đất này mới qua lửa lần đầu."',
        en: '',
        mood: 'warning',
      },
      {
        vi: 'Đêm nay, từ đỉnh đồi, bạn có thể đếm được ánh đèn. Nhiều hơn năm ngoái. Nhiều hơn rất nhiều.',
        en: '',
        mood: 'hopeful',
      },
      {
        vi: 'Nhưng ánh đèn cũng có nghĩa là bóng tối dày hơn ở những nơi không có đèn.',
        en: '',
        mood: 'warning',
      },
    ],
    en: [
      { vi: '', en: 'Twenty years since the first seed.', mood: 'neutral' },
      {
        vi: '',
        en: 'You look out and no longer recognize this land. It has changed. So have you.',
        mood: 'neutral',
      },
      {
        speaker: 'The Blacksmith',
        vi: '',
        en: '"Good steel must pass through fire three times. This land has only been through it once."',
        mood: 'warning',
      },
      {
        vi: '',
        en: 'Tonight, from the hilltop, you can count the lights. More than last year. Many more.',
        mood: 'hopeful',
      },
      {
        vi: '',
        en: 'But more lights also mean deeper shadows where there are none.',
        mood: 'warning',
      },
    ],
  },
  5: {
    vi: [
      { vi: 'Nửa chặng đường. Năm thứ 25.', en: '', mood: 'neutral' },
      {
        vi: 'Thế giới bạn xây không phải thiên đường. Nó có vết nứt, có bụi bẩn, có những góc tối chưa ai chạm tới.',
        en: '',
        mood: 'neutral',
      },
      { vi: 'Nhưng nó có hơi thở. Nó có nhịp tim.', en: '', mood: 'hopeful' },
      {
        speaker: 'Cô giáo',
        vi: '"Tôi dạy bọn trẻ rằng thế giới này không hoàn hảo. Nhưng nó là của chúng ta. Và điều đó quan trọng hơn sự hoàn hảo."',
        en: '',
        mood: 'hopeful',
      },
      {
        vi: 'Giữa mùa hè, một cơn gió lạ thổi qua. Mang theo mùi biển — hoặc mùi thay đổi.',
        en: '',
        mood: 'neutral',
      },
    ],
    en: [
      { vi: '', en: 'Halfway. Year twenty-five.', mood: 'neutral' },
      {
        vi: '',
        en: 'The world you built is not paradise. It has cracks, dirt, and dark corners no one has reached.',
        mood: 'neutral',
      },
      { vi: '', en: 'But it breathes. It has a heartbeat.', mood: 'hopeful' },
      {
        speaker: 'The Teacher',
        vi: '',
        en: '"I teach the children that this world is not perfect. But it is ours. And that matters more than perfection."',
        mood: 'hopeful',
      },
      {
        vi: '',
        en: 'In midsummer, a strange wind blows through. Carrying the scent of the sea — or of change.',
        mood: 'neutral',
      },
    ],
  },
  6: {
    vi: [
      {
        vi: 'Năm thứ 30. Thế hệ đầu tiên sinh ra trên mảnh đất này đã lớn lên.',
        en: '',
        mood: 'neutral',
      },
      {
        vi: 'Họ không biết thế giới cũ. Với họ, đây là tất cả những gì đã có.',
        en: '',
        mood: 'neutral',
      },
      {
        speaker: 'Người trẻ',
        vi: '"Ông bà kể rằng ngày xưa ở đây chỉ có gió và cỏ. Tôi không tin. Nhìn xem — chúng ta có cả thành phố."',
        en: '',
        mood: 'hopeful',
      },
      {
        vi: 'Bạn mỉm cười, nhưng lòng nặng trĩu. Bạn nhớ rằng cỏ và gió không phải là thứ tồi tệ.',
        en: '',
        mood: 'warning',
      },
    ],
    en: [
      {
        vi: '',
        en: 'Year thirty. The first generation born on this land has grown up.',
        mood: 'neutral',
      },
      {
        vi: '',
        en: "They don't know the old world. To them, this is all there ever was.",
        mood: 'neutral',
      },
      {
        speaker: 'The Youth',
        vi: '',
        en: '"Grandparents say there was nothing here but wind and grass. I don\'t believe it. Look — we have a city."',
        mood: 'hopeful',
      },
      {
        vi: '',
        en: 'You smile, but your heart is heavy. You remember that grass and wind were not such terrible things.',
        mood: 'warning',
      },
    ],
  },
  7: {
    vi: [
      { vi: 'Năm 35. Mọi thứ đang tăng tốc.', en: '', mood: 'neutral' },
      {
        vi: 'Sông chảy nhanh hơn. Người nói nhanh hơn. Quyết định được đưa ra nhanh hơn — và hậu quả cũng đến nhanh hơn.',
        en: '',
        mood: 'warning',
      },
      {
        speaker: 'Nhà khoa học',
        vi: '"Dữ liệu không nói dối. Nhưng dữ liệu cũng không nói hết sự thật."',
        en: '',
        mood: 'neutral',
      },
      {
        vi: 'Bạn đứng trước ngã ba đường. Không phải ngã ba thường — mà là loại ngã ba mà bạn không thể quay lại.',
        en: '',
        mood: 'warning',
      },
      { vi: 'Thời gian còn lại ít hơn bạn nghĩ.', en: '', mood: 'warning' },
    ],
    en: [
      { vi: '', en: 'Year thirty-five. Everything is accelerating.', mood: 'neutral' },
      {
        vi: '',
        en: 'The river flows faster. People speak faster. Decisions are made faster — and consequences arrive faster.',
        mood: 'warning',
      },
      {
        speaker: 'The Scientist',
        vi: '',
        en: '"Data doesn\'t lie. But data doesn\'t tell the whole truth either."',
        mood: 'neutral',
      },
      {
        vi: '',
        en: "You stand at a crossroads. Not the ordinary kind — the kind you can't walk back from.",
        mood: 'warning',
      },
      { vi: '', en: 'There is less time left than you think.', mood: 'warning' },
    ],
  },
  8: {
    vi: [
      { vi: 'Bốn mươi năm.', en: '', mood: 'neutral' },
      {
        vi: 'Bạn bắt đầu hiểu rằng xây dựng một thế giới không phải là đặt gạch lên gạch.',
        en: '',
        mood: 'neutral',
      },
      { vi: 'Mà là chọn viên gạch nào KHÔNG đặt.', en: '', mood: 'hopeful' },
      {
        speaker: 'Người đánh cá',
        vi: '"Biển cho nhiều, nhưng biển cũng lấy nhiều. Ai tham sẽ mất tất cả."',
        en: '',
        mood: 'warning',
      },
      {
        vi: 'Hoàng hôn hôm nay đẹp lạ thường. Như thể trời đất muốn nói với bạn điều gì đó.',
        en: '',
        mood: 'hopeful',
      },
    ],
    en: [
      { vi: '', en: 'Forty years.', mood: 'neutral' },
      {
        vi: '',
        en: 'You begin to understand that building a world is not about placing brick upon brick.',
        mood: 'neutral',
      },
      { vi: '', en: "It's about choosing which bricks NOT to place.", mood: 'hopeful' },
      {
        speaker: 'The Fisher',
        vi: '',
        en: '"The sea gives much, but the sea takes much. Those who are greedy lose everything."',
        mood: 'warning',
      },
      {
        vi: '',
        en: 'The sunset tonight is strangely beautiful. As if the sky and earth want to tell you something.',
        mood: 'hopeful',
      },
    ],
  },
  9: {
    vi: [
      { vi: 'Năm 45. Gần cuối rồi.', en: '', mood: 'neutral' },
      {
        vi: 'Vùng đất thì thầm tên bạn khi gió thổi. Hoặc có lẽ đó chỉ là gió.',
        en: '',
        mood: 'neutral',
      },
      {
        vi: 'Mọi thứ bạn xây — mọi quyết định, mọi sai lầm, mọi hy sinh — đều đã in dấu vào nơi này.',
        en: '',
        mood: 'neutral',
      },
      {
        speaker: 'Đứa trẻ',
        vi: '"Lớn lên con muốn làm gì? Con muốn làm người giữ vườn. Giống như bạn."',
        en: '',
        mood: 'hopeful',
      },
      {
        vi: 'Bạn cảm thấy gì? Tự hào? Tiếc nuối? Hay chỉ đơn giản là... bình yên?',
        en: '',
        mood: 'hopeful',
      },
      { vi: 'Còn một bước nữa thôi.', en: '', mood: 'triumph' },
    ],
    en: [
      { vi: '', en: 'Year forty-five. Almost over.', mood: 'neutral' },
      {
        vi: '',
        en: "The land whispers your name when the wind blows. Or perhaps it's just the wind.",
        mood: 'neutral',
      },
      {
        vi: '',
        en: 'Everything you built — every decision, every mistake, every sacrifice — has been etched into this place.',
        mood: 'neutral',
      },
      {
        speaker: 'The Child',
        vi: '',
        en: '"What do I want to be when I grow up? I want to be a gardener. Like you."',
        mood: 'hopeful',
      },
      { vi: '', en: 'What do you feel? Pride? Regret? Or simply... peace?', mood: 'hopeful' },
      { vi: '', en: 'One more step to go.', mood: 'triumph' },
    ],
  },
}

// Default fallback for any turn not in the map
const DEFAULT_CUTSCENE: { vi: DialogueLine[]; en: DialogueLine[] } = {
  vi: [
    { vi: 'Thời gian trôi qua. Vùng đất tiếp tục thay đổi.', en: '', mood: 'neutral' },
    { vi: 'Mỗi năm mang theo bài học mới.', en: '', mood: 'hopeful' },
  ],
  en: [
    { vi: '', en: 'Time passes. The land continues to change.', mood: 'neutral' },
    { vi: '', en: 'Each year brings new lessons.', mood: 'hopeful' },
  ],
}

const dialogueLines = computed(() => {
  const cutscene = CUTSCENES[props.turn] ?? DEFAULT_CUTSCENE
  return locale.value === 'vi' ? cutscene.vi : cutscene.en
})

const currentLine = computed(() => dialogueLines.value[page.value])
const isLastPage = computed(() => page.value >= dialogueLines.value.length - 1)
const progress = computed(() => `${page.value + 1}/${dialogueLines.value.length}`)

function advance() {
  if (isLastPage.value) {
    page.value = 0
    emit('continue')
  } else {
    page.value++
  }
}

// Mood colors
const MOOD_COLORS: Record<string, string> = {
  hopeful: 'text-green-300',
  warning: 'text-accent-coral',
  triumph: 'text-accent-amber',
  neutral: 'text-text-secondary',
}

const STAT_SNAPSHOT = [
  { key: 'nature' as const, icon: TRACK_LUCIDE.nature, color: '#4ADE80' },
  { key: 'human' as const, icon: TRACK_LUCIDE.human, color: '#FFB830' },
  { key: 'economy' as const, icon: TRACK_LUCIDE.economy, color: '#FF6B4A' },
  { key: 'digital' as const, icon: TRACK_LUCIDE.digital, color: '#38BDF8' },
]
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/85 backdrop-blur-sm" />

    <!-- Ambient glow -->
    <div
      class="absolute inset-0 pointer-events-none transition-opacity duration-1000"
      :style="{
        background: `radial-gradient(ellipse at 50% 40%, ${theme.glow} 0%, transparent 60%)`,
      }"
    />

    <div class="relative z-10 text-center max-w-md w-full flex flex-col items-center gap-5">
      <!-- Year badge -->
      <div
        class="inline-flex items-center gap-2 bg-bg-surface/60 rounded-full px-4 py-1.5 border border-border-default/50"
      >
        <span class="text-text-dim text-xs font-display tracking-widest uppercase">
          {{ locale === 'vi' ? 'Năm Thứ' : 'Year' }}
        </span>
        <span class="text-text-primary font-display font-bold text-lg">{{ year }}</span>
      </div>

      <!-- Dominant icon -->
      <div class="flex justify-center">
        <Icon
          :icon="theme.icon"
          class="w-10 h-10 transition-all duration-500"
          :style="{ color: theme.iconColor }"
        />
      </div>

      <!-- Dialogue box -->
      <div
        class="w-full bg-bg-surface/80 border border-border-default/60 rounded-2xl px-6 py-5 min-h-[140px] flex flex-col justify-between backdrop-blur"
      >
        <!-- Speaker name -->
        <div v-if="currentLine?.speaker" class="mb-2">
          <span class="text-xs font-display font-bold text-accent-amber uppercase tracking-widest">
            {{ currentLine.speaker }}
          </span>
        </div>

        <!-- Dialogue text -->
        <p
          :key="page"
          :class="[
            'text-sm leading-relaxed animate-fade-up',
            currentLine?.speaker ? 'italic' : '',
            MOOD_COLORS[currentLine?.mood ?? 'neutral'],
          ]"
        >
          {{ locale === 'vi' ? currentLine?.vi : currentLine?.en }}
        </p>

        <!-- Bottom row: progress + next -->
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-border-default/30">
          <span class="text-[10px] text-text-dim font-display tabular-nums">{{ progress }}</span>

          <button
            class="px-4 py-1.5 rounded-lg text-xs font-display font-bold transition-all touch-manipulation active:scale-95"
            :class="
              isLastPage
                ? 'bg-gradient-to-r from-accent-coral to-accent-amber text-bg-deep hover:shadow-accent-coral/30 hover:shadow-lg'
                : 'bg-bg-elevated text-text-primary hover:bg-border-default'
            "
            @click="advance"
          >
            {{
              isLastPage
                ? locale === 'vi'
                  ? 'Tiếp tục →'
                  : 'Continue →'
                : locale === 'vi'
                  ? 'Tiếp'
                  : 'Next'
            }}
          </button>
        </div>
      </div>

      <!-- Stat snapshot (shown on last page only) -->
      <Transition name="stats">
        <div v-if="isLastPage" class="flex justify-center gap-4 text-xs text-text-dim">
          <span v-for="s in STAT_SNAPSHOT" :key="s.key" class="flex items-center gap-1">
            <Icon :icon="s.icon" class="w-3.5 h-3.5" :style="{ color: s.color }" />
            {{ stats[s.key] }}
          </span>
          <span class="flex items-center gap-1">
            <Icon :icon="DERIVED_LUCIDE.harmony" class="w-3.5 h-3.5" /> {{ derived.harmony }}
          </span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.stats-enter-active {
  animation: fade-up 0.5s ease-out;
}
.stats-leave-active {
  animation: fade-up 0.3s ease-in reverse;
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
