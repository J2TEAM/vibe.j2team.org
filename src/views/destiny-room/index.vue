<template>
  <div
    class="min-h-screen bg-black text-text-primary font-body flex flex-col items-center relative overflow-hidden select-none"
  >
    <RouterLink
      to="/"
      class="fixed top-4 left-4 z-50 text-text-dim text-xs font-display hover:text-text-secondary transition-colors"
    >
      &larr; Thoát
    </RouterLink>

    <!-- Stage 0: Intro -->
    <div
      v-if="stage === 0"
      class="flex-1 flex flex-col items-center justify-center z-10 animate-fade-up px-4"
    >
      <h1 class="font-display text-4xl sm:text-5xl font-bold text-text-primary mb-4 text-center">
        Căn Phòng Chọn Người
      </h1>
      <p class="text-text-secondary text-sm max-w-md mx-auto mb-8 leading-relaxed text-center">
        Bạn không chọn phòng. <span class="text-accent-amber">Phòng chọn bạn.</span><br />
        Nhưng trước tiên — bạn phải cho nó biết bạn là ai.
      </p>
      <button
        class="border border-accent-amber/30 px-8 py-3 font-display text-sm tracking-widest text-accent-amber hover:bg-accent-amber/5 transition-all"
        @click="stage = 1"
      >
        BẮT ĐẦU
      </button>
    </div>

    <!-- Stage 1: Card selection (3 cards like tarot) -->
    <div
      v-if="stage === 1"
      class="flex-1 flex flex-col items-center justify-center z-10 px-4 w-full"
    >
      <p class="text-text-dim text-xs font-display tracking-widest mb-2">BƯỚC 1/3</p>
      <p class="text-text-secondary text-sm mb-8 text-center">
        Chọn 1 trong 3 lá bài. Đừng nghĩ. Cảm nhận.
      </p>

      <div class="flex gap-4 sm:gap-6 justify-center mb-6">
        <button
          v-for="(card, i) in tarotCards"
          :key="i"
          class="w-28 h-44 sm:w-32 sm:h-48 border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-2"
          :class="
            selectedCard === i
              ? 'border-accent-amber bg-accent-amber/10 -translate-y-4'
              : 'border-text-dim/15 hover:border-accent-amber/30'
          "
          @click="selectCard(i)"
        >
          <span v-if="selectedCard === i" class="text-4xl">{{ card.symbol }}</span>
          <span v-else class="text-3xl opacity-30">?</span>
          <span v-if="selectedCard === i" class="text-xs text-accent-amber font-display">{{
            card.name
          }}</span>
        </button>
      </div>

      <p v-if="selectedCard >= 0 && cardPickTime > 0" class="text-text-dim text-xs">
        Chọn trong {{ cardPickTime }}ms
      </p>
    </div>

    <!-- Stage 2: Question -->
    <div
      v-if="stage === 2"
      class="flex-1 flex flex-col items-center justify-center z-10 px-4 w-full max-w-md animate-fade-up"
    >
      <p class="text-text-dim text-xs font-display tracking-widest mb-2">BƯỚC 2/3</p>
      <p class="text-text-secondary text-sm mb-6 text-center">
        Bạn đứng trước 3 cánh cửa. Mỗi cửa có chữ khắc:
      </p>

      <div class="grid grid-cols-1 gap-3 w-full mb-6">
        <button
          v-for="(door, i) in doors"
          :key="i"
          class="border p-5 flex items-center gap-4 transition-all"
          :class="
            selectedDoor === i
              ? 'border-accent-amber bg-accent-amber/10'
              : 'border-text-dim/15 hover:border-accent-amber/20'
          "
          @click="selectDoor(i)"
        >
          <span class="text-2xl w-10 text-center">{{ door.icon }}</span>
          <div class="text-left">
            <p class="text-text-primary text-sm font-display">{{ door.label }}</p>
            <p class="text-text-dim text-xs">{{ door.desc }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Stage 3: Name input + draw -->
    <div
      v-if="stage === 3"
      class="flex-1 flex flex-col items-center justify-center z-10 px-4 w-full max-w-md animate-fade-up"
    >
      <p class="text-text-dim text-xs font-display tracking-widest mb-2">BƯỚC 3/3</p>
      <p class="text-text-secondary text-sm mb-6 text-center">
        Vẽ một ký hiệu bất kỳ bên dưới.<br />
        Phòng sẽ đọc nó.
      </p>

      <!-- Drawing canvas -->
      <canvas
        ref="drawCanvas"
        class="w-64 h-64 sm:w-72 sm:h-72 border border-text-dim/15 bg-white/[0.02] cursor-crosshair mb-4"
        @mousedown="startDraw"
        @mousemove="draw"
        @mouseup="stopDraw"
        @mouseleave="stopDraw"
        @touchstart.prevent="startDrawTouch"
        @touchmove.prevent="drawTouch"
        @touchend="stopDraw"
      />

      <div class="flex gap-3 mb-4">
        <button
          class="border border-text-dim/15 px-4 py-2 text-xs text-text-dim hover:text-text-secondary transition-all"
          @click="clearCanvas"
        >
          Xóa
        </button>
        <button
          class="border border-accent-amber/30 px-6 py-2 text-xs text-accent-amber font-display hover:bg-accent-amber/5 transition-all"
          :disabled="drawStrokes < 3"
          :class="drawStrokes < 3 ? 'opacity-30' : ''"
          @click="submitDrawing"
        >
          XONG
        </button>
      </div>
      <p class="text-text-dim text-xs">{{ drawStrokes }} nét vẽ</p>
    </div>

    <!-- Stage 4: Processing -->
    <div
      v-if="stage === 4"
      class="flex-1 flex flex-col items-center justify-center z-10 px-4 animate-fade-up"
    >
      <canvas ref="processCanvas" class="w-32 h-32 mb-6" />
      <p class="text-text-dim text-xs font-display tracking-widest animate-pulse">
        {{ processText }}
      </p>
    </div>

    <!-- Stage 5: Room reveal -->
    <div
      v-if="stage === 5"
      class="flex-1 flex flex-col items-center z-10 px-4 w-full max-w-lg py-12"
    >
      <!-- Room card -->
      <div
        class="w-full border border-accent-amber/20 bg-amber-900/5 p-8 mb-6 text-center animate-fade-up"
      >
        <p class="text-accent-amber text-xs font-display tracking-widest mb-3">PHÒNG ĐƯỢC CHỌN</p>
        <p class="text-4xl mb-3">{{ assignedRoom.icon }}</p>
        <p class="font-display text-2xl text-text-primary mb-2">{{ assignedRoom.name }}</p>
        <p class="text-text-secondary text-sm">{{ assignedRoom.tagline }}</p>
      </div>

      <!-- Narrative -->
      <div class="w-full space-y-3 mb-6">
        <div
          v-for="(line, i) in visibleLines"
          :key="i"
          class="border border-text-dim/10 bg-white/[0.02] p-4 animate-fade-up"
          :style="{ animationDelay: `${i * 0.3}s` }"
        >
          <p class="text-text-primary text-sm italic leading-relaxed">{{ line }}</p>
        </div>
      </div>

      <!-- Continue button -->
      <button
        v-if="canContinue"
        class="border border-accent-amber/30 px-6 py-2 font-display text-xs text-accent-amber hover:bg-accent-amber/5 transition-all mb-4"
        @click="advanceNarrative"
      >
        TIẾP TỤC
      </button>

      <!-- Analysis (after narrative done) -->
      <div v-if="narrativeDone" class="w-full animate-fade-up">
        <div class="border border-text-dim/10 bg-white/[0.02] p-6 mb-6">
          <p class="text-accent-amber text-xs font-display tracking-widest mb-3">
            PHÒNG ĐÃ ĐỌC ĐƯỢC GÌ
          </p>
          <div class="space-y-2">
            <div
              v-for="(insight, i) in finalInsights"
              :key="i"
              class="text-text-dim text-xs flex gap-2"
            >
              <span class="text-accent-amber">▸</span>
              <span>{{ insight }}</span>
            </div>
          </div>
        </div>

        <p class="text-text-dim/50 text-xs italic text-center mb-6">"{{ assignedRoom.wisdom }}"</p>

        <div class="flex gap-3 justify-center">
          <button
            class="border border-text-dim/20 px-6 py-2 font-display text-xs text-text-dim hover:text-accent-amber hover:border-accent-amber/30 transition-all"
            @click="resetAll"
          >
            VÀO PHÒNG KHÁC
          </button>
          <RouterLink
            to="/"
            class="border border-text-dim/20 px-6 py-2 font-display text-xs text-text-dim hover:text-text-secondary transition-all"
          >
            RỜI ĐI
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, nextTick, computed, watch } from 'vue'

const stage = ref(0)
const drawCanvas = ref<HTMLCanvasElement | null>(null)
const processCanvas = ref<HTMLCanvasElement | null>(null)

// === Tarot Cards ===
const tarotCards = [
  { symbol: '🌙', name: 'Mặt Trăng', weight: 0 },
  { symbol: '⭐', name: 'Ngôi Sao', weight: 1 },
  { symbol: '☀️', name: 'Mặt Trời', weight: 2 },
]

const selectedCard = ref(-1)
const cardPickTime = ref(0)
let cardStartTime = 0

function selectCard(i: number) {
  if (selectedCard.value >= 0) return
  cardPickTime.value = Date.now() - cardStartTime
  selectedCard.value = i
  setTimeout(() => {
    stage.value = 2
  }, 800)
}

watch(stage, (s) => {
  if (s === 1) cardStartTime = Date.now()
})

// === Doors ===
const doors = [
  { icon: '🚪', label: '"Điều bạn muốn"', desc: 'Cánh cửa đỏ', weight: 0 },
  { icon: '🚪', label: '"Điều bạn cần"', desc: 'Cánh cửa trắng', weight: 1 },
  { icon: '🚪', label: '"Điều bạn sợ"', desc: 'Cánh cửa đen', weight: 2 },
]

const selectedDoor = ref(-1)

function selectDoor(i: number) {
  selectedDoor.value = i
  setTimeout(() => {
    stage.value = 3
  }, 500)
}

// === Drawing ===
let isDrawing = false
const drawStrokes = ref(0)
let drawPointCount = 0
let drawCtx: CanvasRenderingContext2D | null = null

function initCanvas() {
  const canvas = drawCanvas.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  drawCtx = canvas.getContext('2d')
  if (!drawCtx) return
  drawCtx.scale(dpr, dpr)
  drawCtx.strokeStyle = '#FFB830'
  drawCtx.lineWidth = 2
  drawCtx.lineCap = 'round'
}

watch(stage, (s) => {
  if (s === 3) nextTick(initCanvas)
})

function startDraw(e: MouseEvent) {
  if (!drawCtx) return
  isDrawing = true
  const rect = drawCanvas.value!.getBoundingClientRect()
  drawCtx.beginPath()
  drawCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

function draw(e: MouseEvent) {
  if (!isDrawing || !drawCtx) return
  const rect = drawCanvas.value!.getBoundingClientRect()
  drawCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  drawCtx.stroke()
  drawPointCount++
}

function startDrawTouch(e: TouchEvent) {
  if (!drawCtx || !e.touches[0]) return
  isDrawing = true
  const rect = drawCanvas.value!.getBoundingClientRect()
  drawCtx.beginPath()
  drawCtx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top)
}

function drawTouch(e: TouchEvent) {
  if (!isDrawing || !drawCtx || !e.touches[0]) return
  const rect = drawCanvas.value!.getBoundingClientRect()
  drawCtx.lineTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top)
  drawCtx.stroke()
  drawPointCount++
}

function stopDraw() {
  if (isDrawing) {
    isDrawing = false
    drawStrokes.value++
  }
}

function clearCanvas() {
  if (!drawCtx || !drawCanvas.value) return
  const dpr = window.devicePixelRatio || 1
  drawCtx.clearRect(0, 0, drawCanvas.value.width / dpr, drawCanvas.value.height / dpr)
  drawStrokes.value = 0
  drawPointCount = 0
}

// === Processing ===
const processText = ref('Đọc ký hiệu...')

function submitDrawing() {
  stage.value = 4
  const steps = ['Đọc ký hiệu...', 'Ghép mảnh thông tin...', 'Phòng đang chọn...', 'Đã chọn.']
  let i = 0
  const interval = setInterval(() => {
    i++
    if (i < steps.length) processText.value = steps[i]!
    if (i >= steps.length) {
      clearInterval(interval)
      assignRoom()
      stage.value = 5
    }
  }, 800)
}

// === Room Assignment ===
interface Room {
  icon: string
  name: string
  tagline: string
  wisdom: string
  narrative: string[][]
}

const rooms: Room[] = [
  {
    icon: '🪞',
    name: 'Phòng Gương Vỡ',
    tagline: 'Mỗi mảnh phản chiếu một phần bạn chưa biết.',
    wisdom: 'Gương vỡ vẫn phản chiếu — chỉ là không theo cách bạn muốn.',
    narrative: [
      [
        'Phòng đầy gương. Nhưng mỗi tấm phản chiếu một người khác.',
        'Bạn nhận ra: tất cả đều là bạn.',
      ],
      [
        'Phiên bản buồn. Phiên bản giận. Phiên bản dũng cảm.',
        'Bạn đã giấu bao nhiêu phiên bản để "vừa vặn" với thế giới?',
      ],
      ['Tấm gương cuối cùng trống. Nó đang chờ bạn tự vẽ mình lên.'],
    ],
  },
  {
    icon: '📮',
    name: 'Phòng Thư Chưa Gửi',
    tagline: 'Người ta gửi thư cho tương lai. Phòng này giữ thư cho quá khứ.',
    wisdom: 'Lá thư quan trọng nhất là lá bạn chưa bao giờ viết.',
    narrative: [
      ['Hàng nghìn lá thư xếp trên kệ. Địa chỉ mờ. Tên người đã quen.', 'Một lá có tên bạn.'],
      [
        'Bên trong viết: "Tôi xin lỗi đã không lắng nghe."',
        'Ai viết cho bạn? Hay bạn viết cho chính mình?',
      ],
      ['Phòng để bạn đọc những lời chưa nói — từ người khác, và từ chính bạn.'],
    ],
  },
  {
    icon: '⏰',
    name: 'Phòng Đồng Hồ Ngược',
    tagline: 'Mỗi giây đều đếm ngược. Nhưng đến đâu?',
    wisdom: 'Không phải bạn sợ hết thời gian. Bạn sợ phí thời gian.',
    narrative: [
      [
        'Hàng trăm đồng hồ. Mỗi cái chạy ngược.',
        'Bạn nhìn cái lớn nhất: nó đang đếm về LÚC BẠN SINH.',
      ],
      ['Mỗi giây đi qua — là một khoảnh khắc bạn đã sống.', 'Bao nhiêu giây bạn thực sự nhớ?'],
      ['Đồng hồ dừng lại. Không phải hết giờ — mà vì bạn đang ở ĐÂY, NGAY LÚC NÀY.'],
    ],
  },
  {
    icon: '🕯️',
    name: 'Phòng Nến',
    tagline: 'Mỗi ngọn nến là một lựa chọn bạn đã bỏ qua.',
    wisdom: 'Ngọn nến không cháy vì bạn nhìn. Nó cháy vì nó liệu.',
    narrative: [
      [
        'Phòng tối. Một ngọn nến. Rồi hai. Rồi mười.',
        'Mỗi ngọn mang tên một quyết định bạn từng do dự.',
      ],
      [
        'Ngọn sáng nhất: quyết định bạn cuối cùng KHÔNG chọn.',
        'Ngọn yếu nhất: quyết định bạn quá sợ để thử.',
      ],
      ['Nhưng tất cả đều đang cháy. Nghĩa là — chưa có gì thực sự mất.'],
    ],
  },
  {
    icon: '🌑',
    name: 'Phòng Trống',
    tagline: 'Không có gì. Chỉ có bạn.',
    wisdom: 'Sự trống rỗng không đáng sợ. Đáng sợ là lấp đầy nó bằng thứ sai.',
    narrative: [
      [
        'Phòng trống hoàn toàn. Không bàn, không ghế, không gương, không thư.',
        'Chỉ có bạn. Và tiếng thở.',
      ],
      [
        'Khi không có gì để nhìn, bạn bắt đầu nhìn vào bên trong.',
        'Bạn thấy gì? Im lặng — hay hỗn loạn?',
      ],
      [
        'Phòng trống không phải là hình phạt. Nó là phần thưởng: một nơi không ai đòi hỏi bạn phải gì cả.',
      ],
    ],
  },
]

const assignedRoom = ref<Room>(rooms[0]!)
const visibleLines = ref<string[]>([])
const narrativeStep = ref(0)
const narrativeDone = ref(false)
const finalInsights = ref<string[]>([])

const canContinue = computed(
  () => !narrativeDone.value && narrativeStep.value < assignedRoom.value.narrative.length,
)

function assignRoom() {
  // Deterministic from card + door + stroke count
  const hash =
    (selectedCard.value * 7 + selectedDoor.value * 13 + drawStrokes.value * 3) % rooms.length
  assignedRoom.value = rooms[hash]!
  narrativeStep.value = 0
  narrativeDone.value = false
  visibleLines.value = [...assignedRoom.value.narrative[0]!]
  narrativeStep.value = 1
}

function advanceNarrative() {
  if (narrativeStep.value < assignedRoom.value.narrative.length) {
    const nextLines = assignedRoom.value.narrative[narrativeStep.value]!
    visibleLines.value.push(...nextLines)
    narrativeStep.value++
  }

  if (narrativeStep.value >= assignedRoom.value.narrative.length) {
    narrativeDone.value = true
    buildFinalInsights()
  }
}

function buildFinalInsights() {
  const ins: string[] = []
  const card = tarotCards[selectedCard.value]!
  const door = doors[selectedDoor.value]!

  ins.push(
    `Bạn chọn lá ${card.name} — ${selectedCard.value === 0 ? 'trực giác dẫn đường' : selectedCard.value === 1 ? 'hy vọng là la bàn' : 'lý trí là ngọn đuốc'}`,
  )

  if (cardPickTime.value < 1000) ins.push('Chọn bài trong chưa đầy 1 giây — bạn tin vào bản năng')
  else if (cardPickTime.value > 5000)
    ins.push('Cân nhắc lâu trước khi chọn — bạn không làm gì hấp tấp')

  ins.push(
    `Cửa ${door.desc}: ${selectedDoor.value === 0 ? 'bạn đang khát khao điều gì đó' : selectedDoor.value === 1 ? 'bạn biết bản thân thiếu gì' : 'bạn sẵn sàng đối mặt nỗi sợ'}`,
  )

  if (drawStrokes.value > 15)
    ins.push(`${drawStrokes.value} nét vẽ — ký hiệu phức tạp, tâm trí đang bận rộn`)
  else if (drawStrokes.value <= 5)
    ins.push(`Chỉ ${drawStrokes.value} nét — giản đơn, tinh ý, hoặc đang mệt`)

  if (drawPointCount > 500) ins.push('Nét vẽ chi tiết — bạn cẩn thận trong cách thể hiện')
  else ins.push('Nét vẽ nhanh gọn — bạn ưu tiên bản chất hơn hình thức')

  finalInsights.value = ins
}

function resetAll() {
  stage.value = 0
  selectedCard.value = -1
  selectedDoor.value = -1
  drawStrokes.value = 0
  drawPointCount = 0
  cardPickTime.value = 0
  narrativeStep.value = 0
  narrativeDone.value = false
  visibleLines.value = []
  finalInsights.value = []
}

onUnmounted(() => {})
</script>
