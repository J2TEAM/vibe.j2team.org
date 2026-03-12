<script setup lang="ts">
import { ref } from 'vue'

// --- TYPES ---
interface Card {
  suit: '♥' | '♦' | '♣' | '♠'
  value: string
}
interface SlotCard {
  slotKey: string
  card: Card
  revealed: boolean
  isBanMenh: boolean
}

// --- DATA ---
const SUIT_COLOR: Record<string, string> = { '♥': 'red', '♦': 'red', '♣': 'black', '♠': 'black' }
const SUIT_NAME: Record<string, string> = { '♥': 'Cơ', '♦': 'Rô', '♣': 'Tép', '♠': 'Bích' }

const SLOTS = [
  { key: 'center', cls: 'slot-center', label: '',              month: 'Trung cung' },
  { key: 'n',      cls: 'slot-n',      label: 'Tháng 8',       month: 'Tháng 8'   },
  { key: 's',      cls: 'slot-s',      label: 'Tháng 2',       month: 'Tháng 2'   },
  { key: 'e',      cls: 'slot-e',      label: 'Tháng 11',      month: 'Tháng 11'  },
  { key: 'w',      cls: 'slot-w',      label: 'Tháng 5',       month: 'Tháng 5'   },
  { key: 'ne',     cls: 'slot-ne',     label: 'Tháng 9–10',    month: 'Tháng 9'   },
  { key: 'nw',     cls: 'slot-nw',     label: 'Tháng 6–7',     month: 'Tháng 6'   },
  { key: 'se',     cls: 'slot-se',     label: 'Tháng 12–1',    month: 'Tháng 12'  },
  { key: 'sw',     cls: 'slot-sw',     label: 'Tháng 3–4',     month: 'Tháng 3'   },
]

const EXTRA_MONTHS: Record<string, string> = {
  ne: 'Tháng 10', nw: 'Tháng 7', se: 'Tháng 1', sw: 'Tháng 4',
}

const BAN_MENH: Record<string, string> = {
  '♥': 'Vui mừng, chủ gia đạo.',
  '♦': 'Sự đợi chờ tin tức, công danh sự nghiệp.',
  '♣': 'Tiền bạc.',
  '♠': 'Phiền muộn nạn tai.',
}

const READINGS: Record<string, Record<string, string>> = {
  'Tháng 1':  { '♥': 'Vui vẻ, hạnh phúc nhiều.', '♦': 'Xấu — xuất hành hay đi xa thì bất lợi.', '♣': 'May mắn về tiền bạc.', '♠': 'Rất buồn, tán tài, ốm đau — nói chung có nhiều chuyện buồn.' },
  'Tháng 2':  { '♥': 'Có tin tức thư từ từ xa gửi về hoặc quà biếu.', '♦': 'Bình an, nhà cửa vui vẻ, kẻ đi người về tất bật êm xuôi.', '♣': 'Thận trọng làm ăn, coi chừng hao tài thua lỗ và mất của.', '♠': 'Có sự xích mích lứa đôi vợ chồng, gia đạo đảo lộn thiếu hạnh phúc do sự hiểu lầm.' },
  'Tháng 3':  { '♥': 'Trong gia đình có người xa đi về.', '♦': 'Say mê về tình cảm, cũng buồn phiền nhiều do tình cảm — lụy ít thôi.', '♣': 'Làm ăn may mắn, tiền bạc vào nhiều.', '♠': 'Chẳng làm ăn được gì, nên nghỉ ngơi cho khỏe cái thân.' },
  'Tháng 4':  { '♥': 'Tình — tiền đều tốt.', '♦': 'Rất lộn xộn, công việc bù đầu mãi chẳng xong, bực mình nhiều.', '♣': 'Nhiều công chuyện làm ăn, phải bôn ba nhưng có lợi.', '♠': 'Coi chừng nhiều thua thiệt và phòng bị quân trộm đạo gian ác.' },
  'Tháng 5':  { '♥': 'Nhiều tin mừng vui may, gia đạo cũng tốt tươi hạnh phúc, làm việc gì cũng thành.', '♦': 'Công danh thời tới, thăng tiến.', '♣': 'Tài lộc bền vững, tiền bạc làm ra nhiều, buôn bán phát đạt.', '♠': 'Nguy hại, nên phòng thân, coi chừng tai nạn về xe cộ hoặc té ngã sông đò.' },
  'Tháng 6':  { '♥': 'Điềm lành, bất cứ điều gì xảy ra đều tốt.', '♦': 'Vui vẻ, có sự ra đi rất tốt.', '♣': 'Nên thận trọng trong làm ăn buôn bán hợp hùn các thứ, coi chừng bị lừa gạt hay thua thiệt.', '♠': 'Nguy hại, phòng tiểu nhân ám hại trên mọi phương diện làm ăn, coi chừng kiện tụng pháp lý.' },
  'Tháng 7':  { '♥': 'Tình cảm có sự buồn, cô đơn trống vắng.', '♦': 'Đường tình ái lung lay, có sự buồn khổ, gia đạo hạnh phúc bị giảm sút.', '♣': 'Xuất tiền ra rất nhiều để mở mang buôn bán hay hùn hạp làm ăn — không lỗ nhưng lợi lộc chưa có, phải chờ đợi.', '♠': 'Xấu nhiều trên mọi phương diện — toàn là sự thua thiệt và bị lừa đảo, phản bội.' },
  'Tháng 8':  { '♥': 'Rất đầm ấm, cuộc sống dồi dào hạnh phúc, gia đạo vui vầy tốt đẹp.', '♦': 'Công danh sự nghiệp nhiều may mắn.', '♣': 'Bạc tiền vào, phát tài bất ngờ.', '♠': 'Xui xẻo, làm ăn thua thiệt, bạn bè phản bội.' },
  'Tháng 9':  { '♥': 'Vài tin mừng, tin lành tới.', '♦': 'Tốt có xấu có, có sự phiền muộn mà cũng có sự vui mừng.', '♣': 'Sự làm ăn phát đạt, tiền bạc tự nhiên đến và lợi lộc nhiều.', '♠': 'Điều phiền muộn xảy ra, có tang chế trong họ hàng thân thuộc.' },
  'Tháng 10': { '♥': 'Có sự đổi dời đi xa.', '♦': 'Có sự sửa sang nhà cửa, tôn tạo sân vườn, hoặc trong nhà sắp làm đám cưới.', '♣': 'Sự bán buôn hay bất cứ việc gì liên quan đến tiền thì phải cẩn thận, không vội vã hùn hạp kẻo hao tài tốn của.', '♠': 'Gặp chuyện thị phi, có người gièm pha chọc phá gây nên nhiều việc bực mình.' },
  'Tháng 11': { '♥': 'Tuy không có sự khổ đau nhưng có sự lo lắng sốt ruột, ngóng trông chờ đợi gì đó.', '♦': 'Có sự xuất hành đi xa và sự xuất hành này phải thận trọng phòng ngừa tai nạn.', '♣': 'Có thêm con cháu, bình an.', '♠': 'Nhiều khó khăn gian nan mọi việc, lại còn vướng chuyện phiền về tình cảm gia đạo.' },
  'Tháng 12': { '♥': 'Mọi sự an vui, một nhà đoàn viên.', '♦': 'Có sự thăng tiến công danh.', '♣': 'Tiền — tình đều như ý.', '♠': 'Xấu, nên bình tĩnh trong mọi hoàn cảnh, không nóng giận, dễ gặp tai họa liên lụy vào thân.' },
  'Trung cung': { '♥': 'Gia đạo đầm ấm đầy đủ, hạnh phúc.', '♦': 'Có nhiều sự buồn vui lẫn lộn, thường hay di chuyển đó đây.', '♣': 'Tốt — sự làm ăn gặp nhiều may mắn, phát tài, gia đình nhiều vui may.', '♠': 'Xui xẻo nhiều, sự làm ăn bị tán tài hao của, gia đạo bất hòa, bổn mạng và con cái ốm đau, thường gặp kẻ tiểu nhân phá quấy, tai nạn khó lường.' },
}

const VALUE_READINGS: Record<string, Record<string, string>> = {
  'A':  { '♥': 'Tình duyên tốt đẹp — gia đình hạnh phúc — nhiều phúc lành.', '♦': 'Di chuyển thay đổi, xuất hành được công danh tốt, tiền tài sự nghiệp đắc thành.', '♣': 'Tài bạch tốt, bán buôn phất lên.', '♠': 'Hung hiểm gian nan, sợ là có tang.' },
  'K':  { '♥': 'Tốt, công danh tốt, tiền tài cũng tốt.', '♦': 'Công danh phất lên, thăng thưởng.', '♣': 'Buôn bán phát tài.', '♠': 'Hung hiểm, ưu phiền thương đau, đề phòng kẻ xấu hại mình.' },
  'Q':  { '♥': 'Tin thư báo hỉ sự, vợ chồng lứa đôi đầm ấm.', '♦': 'Bỗng dưng có tình ái vào đời, hạnh phúc.', '♣': 'Tài lộc thênh thang, bán buôn được thời, có lộc.', '♠': 'Tai vạ dập đồn, cẩn thận phường trộm cắp lọc lừa, quân gian tà xảo ngôn.' },
  'J':  { '♥': 'Tình cảm dạt dào, vui vẻ hạnh phúc.', '♦': 'Công danh có sẵn giờ càng phất lên, có sự đi đây đi đó, rời nơi hiện tại đến miền xa xôi.', '♣': 'Túng quẫn lâu rồi giờ đã tạm thời đủ, gặp vận may, thời tới.', '♠': 'Thận trọng đi đường gặp tai ương, buôn bán không được tin ai, có khi bị hao hại mấy lần.' },
  '10': { '♥': 'Tin vui đưa đến, ấm êm gia đạo.', '♦': 'Báo hiệu ra đi giã từ khi nhận thư tín tin tức, bình an thượng lộ, tốt.', '♣': 'Có người diễu võ dương oai nhưng mặc kệ là được, bán buôn tốt, làm ăn có tài lộc.', '♠': 'Ốm đau lay lắt, hao tài tốn của, buồn rầu, phòng sông nước lúc lên xuống tàu thuyền hay cầu thang.' },
  '9':  { '♥': 'Việc đã định sẵn là nên làm, tin vui sẽ đến, nhà cửa êm ấm, có thêm cháu nhỏ.', '♦': 'Báo sự lên đường, di chuyển vấn vương giã từ — người đi kẻ ở, công việc lệch pha.', '♣': 'Buôn bán phát tài.', '♠': 'Coi chừng trộm cắp, xuất hành lôi thôi, công việc chẳng thành.' },
  '8':  { '♥': 'Bao phen gập ghềnh, giờ đây đã yên lành.', '♦': 'Bao mòn mỏi đợi chờ thì công danh đã đến như cờ vào tay — phất thôi, xuất hành gặp may nhiều.', '♣': 'Bao ngày chăm lo sớm tối, giờ đây được đền đáp — tiền bạc giờ không còn là vấn đề.', '♠': 'Coi chừng điều tiếng thị phi, tiểu nhân hãm hại, có tin tức thư từ chê cười mình.' },
  '7':  { '♥': 'Bản mệnh bình an nhưng tình cảm lại lung lay.', '♦': 'Ra đi phải phòng cẩn thận tại ách, kiện tụng lôi thôi.', '♣': 'Bôn ba buôn bán khắp nơi rồi phát tài phát lộc.', '♠': 'Chớ vội cả tin, gặp kẻ lừa đảo, đau lòng, vu oan giá họa — cẩn thận mới thoát được oan khiên.' },
}

// --- HELPERS ---
function makeDeck(): Card[] {
  const suits: Card['suit'][] = ['♥', '♦', '♣', '♠']
  const values = ['A', 'K', 'Q', 'J', '10', '9', '8', '7']
  const deck: Card[] = []
  suits.forEach(s => values.forEach(v => deck.push({ suit: s, value: v })))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j]!, deck[i]!]
  }
  return deck
}

// --- STATE ---
const phase = ref<1 | 2 | 3>(1)
const cards = ref<SlotCard[]>([])
const showResults = ref(false)
const revealingAll = ref(false)

function initGame() {
  phase.value = 1
  showResults.value = false
  revealingAll.value = false
  const deck = makeDeck()
  cards.value = SLOTS.map((slot, i) => ({
    slotKey: slot.key,
    card: deck[i]!,
    revealed: false,
    isBanMenh: false,
  }))
}

function handleCardClick(key: string) {
  if (key === 'center' || phase.value !== 1) return
  cards.value = cards.value.map(c => ({
    ...c,
    isBanMenh: c.slotKey === key,
    revealed: c.slotKey === key ? true : c.revealed,
  }))
  phase.value = 2
}

function doRevealAll() {
  if (revealingAll.value) return
  revealingAll.value = true
  const unrevealed = cards.value.filter(c => !c.revealed)
  unrevealed.forEach((c, i) => {
    setTimeout(() => {
      cards.value = cards.value.map(card =>
        card.slotKey === c.slotKey ? { ...card, revealed: true } : card,
      )
      if (i === unrevealed.length - 1) {
        setTimeout(() => { showResults.value = true }, 500)
      }
    }, i * 180)
  })
}

// --- RESULT ORDER ---
const MONTH_ORDER: Record<string, number> = {
  n: 8, s: 2, e: 11, w: 5, ne: 9, nw: 6, se: 12, sw: 3,
}

interface DisplayItem {
  slotKey: string
  card: Card
  isBanMenh: boolean
  month: string
}

function buildDisplayList(): DisplayItem[] {
  const list: DisplayItem[] = []
  const banMenh = cards.value.find(c => c.isBanMenh)
  const trungCung = cards.value.find(c => c.slotKey === 'center')
  const others = cards.value
    .filter(c => !c.isBanMenh && c.slotKey !== 'center')
    .sort((a, b) => MONTH_ORDER[a.slotKey]! - MONTH_ORDER[b.slotKey]!)

  if (banMenh) list.push({ slotKey: banMenh.slotKey, card: banMenh.card, isBanMenh: true, month: 'Lá Bản Mệnh' })
  if (trungCung) list.push({ slotKey: trungCung.slotKey, card: trungCung.card, isBanMenh: false, month: 'Trung cung' })

  const monthCards: { month: string; c: SlotCard }[] = []
  others.forEach(c => {
    const slot = SLOTS.find(s => s.key === c.slotKey)!
    monthCards.push({ month: slot.month, c })
    if (EXTRA_MONTHS[c.slotKey]) monthCards.push({ month: EXTRA_MONTHS[c.slotKey]!, c })
  })
  monthCards.sort((a, b) => {
    return parseInt(a.month.replace('Tháng ', '')) - parseInt(b.month.replace('Tháng ', ''))
  })
  monthCards.forEach(({ month, c }) =>
    list.push({ slotKey: c.slotKey, card: c.card, isBanMenh: false, month }),
  )
  return list
}

function getReading(item: DisplayItem): string {
  if (item.isBanMenh) return BAN_MENH[item.card.suit] ?? ''
  const base = READINGS[item.month]?.[item.card.suit] ?? ''
  const extra = VALUE_READINGS[item.card.value]?.[item.card.suit] ?? ''
  return base + (extra ? ' ' + extra : '')
}

initGame()
</script>

<template>
  <div class="min-h-screen bg-[#0e0b06] text-[#f5ead0] font-sans overflow-x-hidden">
    <!-- Background glow -->
    <div class="pointer-events-none fixed inset-0 z-0">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(201,168,76,0.07)_0%,transparent_50%)]" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_90%,rgba(139,26,26,0.08)_0%,transparent_50%)]" />
    </div>

    <div class="relative z-10 max-w-xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <router-link
          to="/"
          class="inline-flex items-center justify-center w-9 h-9 mb-4 bg-white/10 hover:bg-white/20 rounded-full transition border border-white/20 text-white"
          title="Về trang chủ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </router-link>
        <div class="text-[#c9a84c] opacity-60 tracking-[8px] text-lg mb-1">✦ ✦ ✦</div>
        <h1 class="text-3xl font-bold text-[#f0d080] tracking-wider" style="font-family: 'Playfair Display', Georgia, serif">
          Quẻ Bài Bát Quái
        </h1>
        <p class="text-xs text-[#f5ead0]/40 tracking-[3px] uppercase mt-1">Huỳnh Liên Tử — Xem vận một năm</p>
        <div class="flex items-center gap-3 my-4 max-w-[200px] mx-auto">
          <div class="flex-1 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
          <span class="text-[#c9a84c] text-sm">☽</span>
          <div class="flex-1 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
        </div>
      </div>

      <!-- Phase instruction -->
      <div v-if="phase < 3" class="bg-[#c9a84c]/7 border border-[#c9a84c]/20 rounded-xl px-5 py-3 text-center mb-8 transition-all">
        <p class="text-[10px] uppercase tracking-[2px] text-[#c9a84c] mb-1">
          {{ phase === 1 ? 'Bước 1 — Chọn Lá Bản Mệnh' : 'Bước 2 — Lật Tất Cả Lá Bài' }}
        </p>
        <p class="text-sm text-[#f5ead0]/75 leading-relaxed">
          <template v-if="phase === 1">Hãy tập trung tâm trí, rồi chạm vào một trong <strong>8 lá bài</strong> xung quanh để chọn lá bản mệnh của bạn.</template>
          <template v-else>Đã chọn lá bản mệnh. Nhấn nút bên dưới để lật tất cả các lá còn lại và xem quẻ cho cả năm.</template>
        </p>
      </div>

      <!-- Board -->
      <div class="relative w-full aspect-square max-w-[480px] mx-auto mb-8">
        <!-- Octagram decoration -->
        <svg class="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" viewBox="0 0 100 100">
          <polygon points="50,5 61,39 95,39 68,61 79,95 50,73 21,95 32,61 5,39 39,39" fill="none" stroke="#c9a84c" stroke-width="0.4"/>
          <circle cx="50" cy="50" r="30" fill="none" stroke="#c9a84c" stroke-width="0.25"/>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#c9a84c" stroke-width="0.2"/>
        </svg>

        <!-- Card slots -->
        <template v-for="slot in SLOTS" :key="slot.key">
          <div
            class="card-slot absolute"
            :class="slot.cls"
          >
            <!-- Label -->
            <div
              v-if="slot.key !== 'center' && slot.label"
              class="slot-label absolute text-[8px] text-[#c9a84c]/55 whitespace-nowrap text-center leading-tight pointer-events-none"
              :class="{
                'bottom-full mb-1 left-1/2 -translate-x-1/2': ['n','ne','nw'].includes(slot.key),
                'top-full mt-1 left-1/2 -translate-x-1/2': ['s','se','sw'].includes(slot.key),
                'right-full mr-1 top-1/2 -translate-y-1/2 text-right': slot.key === 'w',
                'left-full ml-1 top-1/2 -translate-y-1/2': slot.key === 'e',
              }"
            >{{ slot.label }}</div>

            <!-- Card -->
            <div
              class="card"
              :class="{
                'cursor-pointer': slot.key !== 'center' && phase === 1,
                'cursor-default': slot.key === 'center' || phase !== 1,
                'ban-menh': cards.find(c => c.slotKey === slot.key)?.isBanMenh,
                'revealed': cards.find(c => c.slotKey === slot.key)?.revealed,
              }"
              @click="handleCardClick(slot.key)"
            >
              <div class="card-inner">
                <!-- Back -->
                <div class="card-back">
                  <div class="card-back-pattern">
                    <span class="text-[#c9a84c]/35 text-2xl">{{ slot.key === 'center' ? '✦' : '☯' }}</span>
                  </div>
                </div>
                <!-- Front -->
                <div class="card-face">
                  <span
                    class="text-3xl leading-none"
                    :class="SUIT_COLOR[cards.find(c => c.slotKey === slot.key)?.card.suit ?? ''] === 'red' ? 'text-red-600' : 'text-[#1a1008]'"
                  >{{ cards.find(c => c.slotKey === slot.key)?.card.suit }}</span>
                  <span
                    class="text-lg font-bold leading-none"
                    style="font-family: 'Playfair Display', Georgia, serif"
                    :class="SUIT_COLOR[cards.find(c => c.slotKey === slot.key)?.card.suit ?? ''] === 'red' ? 'text-red-600' : 'text-[#1a1008]'"
                  >{{ cards.find(c => c.slotKey === slot.key)?.card.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Reveal all button -->
      <div v-if="phase === 2 && !revealingAll" class="text-center mb-8">
        <button
          @click="doRevealAll"
          class="bg-gradient-to-r from-[#7a5c1e] via-[#c9a84c] to-[#7a5c1e] text-[#0e0b06] font-bold px-10 py-3 rounded-full uppercase tracking-widest text-sm transition hover:shadow-[0_0_24px_rgba(201,168,76,0.4)] hover:-translate-y-0.5 active:scale-95"
        >
          ✦ Lật Tất Cả Lá Bài ✦
        </button>
      </div>

      <!-- Results -->
      <div v-if="showResults" class="animate-fade-in">
        <div class="text-center mb-6">
          <div class="flex items-center gap-3 max-w-[200px] mx-auto mb-3">
            <div class="flex-1 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
            <span class="text-[#c9a84c]">✦</span>
            <div class="flex-1 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />
          </div>
          <h2 class="text-xl font-bold text-[#f0d080]" style="font-family: 'Playfair Display', Georgia, serif">Giải Quẻ Một Năm</h2>
          <p class="text-[10px] uppercase tracking-[2px] text-[#f5ead0]/40 mt-1">Căn cứ chất & số lá bài</p>
        </div>

        <div class="space-y-3">
          <div
            v-for="(item, idx) in buildDisplayList()"
            :key="idx"
            class="flex gap-4 items-start rounded-xl px-4 py-3 border transition-all"
            :class="item.isBanMenh
              ? 'bg-[#c9a84c]/9 border-[#c9a84c]/50'
              : 'bg-[#c9a84c]/5 border-[#c9a84c]/15'"
            :style="{ animationDelay: `${idx * 0.07}s` }"
          >
            <!-- Card mini -->
            <div class="flex flex-col items-center min-w-[40px]">
              <span
                class="text-2xl leading-none"
                :class="SUIT_COLOR[item.card.suit] === 'red' ? 'text-red-500' : 'text-[#f5ead0]'"
              >{{ item.card.suit }}</span>
              <span class="text-xs font-bold text-[#c9a84c] mt-0.5" style="font-family: 'Playfair Display', Georgia, serif">
                {{ item.isBanMenh ? SUIT_NAME[item.card.suit] : item.card.value }}
              </span>
            </div>

            <!-- Reading -->
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] uppercase tracking-[1.5px] text-[#c9a84c]/70">{{ item.month }}</span>
                <span v-if="item.isBanMenh" class="bg-[#c9a84c] text-[#0e0b06] text-[8px] font-bold px-2 py-0.5 rounded-full tracking-wide">BẢN MỆNH</span>
              </div>
              <p class="text-sm text-[#f5ead0]/85 leading-relaxed">{{ getReading(item) }}</p>
            </div>
          </div>
        </div>

        <!-- Reset button -->
        <div class="text-center mt-8">
          <button
            @click="initGame"
            class="border border-[#c9a84c]/30 text-[#c9a84c]/70 hover:text-[#f0d080] hover:border-[#c9a84c]/60 px-8 py-2 rounded-full text-sm tracking-wider transition"
          >
            ↺ &nbsp;Xem Lại Từ Đầu
          </button>
        </div>
      </div>

      <!-- Footer -->
      <p class="text-center text-[10px] text-[#f5ead0]/20 tracking-wider mt-12">
        Tham khảo từ sách Bói Bài — Huỳnh Liên Tử<br>
        <span class="mt-1 block">Chỉ mang tính giải trí tâm linh dân gian</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Board positions */
.card-slot { transform: translate(-50%, -50%); }
.slot-center { left: 50%; top: 50%; }
.slot-n  { left: 50%;  top: 14%; }
.slot-s  { left: 50%;  top: 86%; }
.slot-e  { left: 84%;  top: 50%; }
.slot-w  { left: 16%;  top: 50%; }
.slot-ne { left: 74%;  top: 24%; }
.slot-nw { left: 26%;  top: 24%; }
.slot-se { left: 74%;  top: 76%; }
.slot-sw { left: 26%;  top: 76%; }

/* Card sizing */
.card {
  width: clamp(52px, 11vw, 72px);
  height: clamp(76px, 16vw, 104px);
  perspective: 600px;
  position: relative;
  transition: transform 0.15s;
}
.card:not(.revealed):not(.cursor-default):hover .card-inner {
  box-shadow: 0 0 16px rgba(201,168,76,0.5);
}
.card:active:not(.cursor-default) { transform: scale(0.94); }

/* Flip */
.card-inner {
  width: 100%; height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.15);
}
.card.revealed .card-inner { transform: rotateY(180deg); }

.card-face, .card-back {
  position: absolute; inset: 0;
  border-radius: 8px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}

/* Back */
.card-back {
  background: linear-gradient(145deg, #1e1508 0%, #2d2010 40%, #1a1106 100%);
  border: 1px solid rgba(201,168,76,0.3);
  display: flex; align-items: center; justify-content: center;
}
.card-back-pattern {
  width: 85%; height: 85%;
  border: 1px solid rgba(201,168,76,0.25);
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.card-back-pattern::after {
  content: '';
  position: absolute; inset: 3px;
  border: 1px solid rgba(201,168,76,0.12);
  border-radius: 3px;
}

/* Front */
.card-face {
  transform: rotateY(180deg);
  background: #fdf6e8;
  border: 1px solid rgba(201,168,76,0.4);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 2px; padding: 4px;
}

/* Ban menh glow */
.card.ban-menh .card-back {
  border-color: rgba(201,168,76,0.8);
  animation: pulseGold 2s infinite;
}
@keyframes pulseGold {
  0%, 100% { box-shadow: 0 0 15px rgba(201,168,76,0.4); }
  50%       { box-shadow: 0 0 30px rgba(201,168,76,0.7), 0 0 50px rgba(201,168,76,0.2); }
}

/* Result fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fadeIn 0.5s ease; }
</style>
