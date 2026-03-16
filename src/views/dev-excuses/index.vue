<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard } from '@vueuse/core'

const excuses = [
  'Trên máy em vẫn chạy bình thường mà!',
  'Cái này do cache của trình duyệt đấy, thử xóa cache cứng (Ctrl + Shift + R) xem sao.',
  'Chắc do môi trường staging khác với production.',
  'Để em check lại, chiều thứ sáu em test nó vẫn hoạt động tốt.',
  'Bug này không phải của em, dòng code này là của thanh niên nghỉ việc tháng trước viết.',
  'Library này nó bị lỗi ngầm chứ không phải do logic code của em.',
  'Người dùng đang thao tác sai luồng thiết kế rồi, phải click nút này trước mới đúng chuẩn.',
  'QA test mấy case dị vãi, thực tế chả có user nào rảnh mà ấn liên tục 50 lần thế đâu.',
  'Đây không phải là memory leak, tính năng nó cần thiết phải tiêu thụ RAM cỡ đó.',
  'Xin lỗi, do lúc nãy mạng lag nên git push nó bị mất file. Để em push lại...',
  'Do API bên thứ 3 ngầm đổi cấu trúc response mà không gửi email báo trước chứ bộ.',
  'Hệ thống thiết kế ban đầu không scale được mức này, em nhắc từ đợt sprint trước rồi mà anh có nghe đâu.',
  'Mảng trả về rỗng chứ không phải undefined, tại Front-end check điều kiện lỏng lẻo rồi.',
  'Chức năng này em chưa xong, cái anh đang xem là giao diện em fix cứng (mock data) demo thôi.',
  'Kỳ vãi, vừa nãy em demo trước gương mượt lắm mà sao giờ lại lỗi ta?',
  'Có khi đêm qua framework nó vừa tự động update bản minor làm hỏng (break) tương thích rồi...',
  'Đợi em chút, bản build anh đang test có khi là bản hôm qua rồi. Anh kéo code mới giùm em.',
  'Anh xem lại tài liệu API đi. Document cũ nên payload nó không giống với code em gửi thực tế đâu.',
  'Cái block đó em để giữ chỗ (placeholder) cho đẹp thôi, chưa gắn logic xử lý.',
  "It's not a bug, it's an undocumented feature!!!",
  'Nãy sếp đi ngang qua vỗ vai làm em giật mình gõ thiếu dấu chấm phẩy.',
  'Cái thư viện này hôm qua trên GitHub mới có thằng mở Issue giống hệt mình luôn, chứ không phải tại em.',
  'Database bị khóa (lock) do bên dba chạy query báo cáo nặng quá đấy, không phải do code em chậm đâu.',
  'Code em merge rồi, nhưng CI/CD dạo này hay bị treo lắm, anh chờ tí cho server nó xả hơi.',
  'Trời nắng quá nên CPU bị throttle, thành ra request lên server bị timeout thôi.',
  'Chắc do múi giờ server đổi do giờ mùa hè (DST) nên logic ngày tháng nó sai lệch 1 tiếng.',
  'Đoạn này phải bật Strict Mode lên nó mới chạy đúng thiết kế.',
  'Em dùng AI để tự sinh code, hình như con bot này nó gõ nhầm hay sao ấy.',
  'Em thề là hôm qua nó còn sống nguyên vẹn...',
  'Cái chức năng này tài liệu thiết kế nghiệp vụ (BRD) có ghi đâu, BA không kêu sao em biết mà làm.',
  'Sáng nay em coi tử vi thấy bảo không nên deploy ngày hôm nay mà sếp không chịu nghe.',
  'Chắc tại trình duyệt Edge nó không hỗ trợ chuẩn CSS mới nhất. Anh dùng Chrome thử xem.',
  'Do bên hệ điều hành họ đang cập nhật bảo mật dưới nền làm chiếm mất resource máy anh đấy.',
  "Để em comment lại đoạn này, chắc anh không tin tâm linh chứ đợt trước em đổi tên biến thành 'xin_chay_di' là nó hết lỗi.",
  'Phải xóa node_modules đi cài lại từ đầu anh ơi.',
  'Bạn em bảo cái lỗi này là tính năng 10 người dùng cả 10 người đều dính.',
  'Cái này anh đừng nhấn chuột mà ấn Enter thì nó lại chạy bình thường.',
]

const currentExcuse = ref('')
const isGenerating = ref(false)
const copied = ref(false)
const history = ref<number[]>([])
let typeWriter: number | null = null

const generateExcuse = () => {
  if (isGenerating.value) return

  copied.value = false
  isGenerating.value = true
  currentExcuse.value = ''

  if (typeWriter) clearInterval(typeWriter)

  let newIndex = -1
  const maxHistoryLength = Math.min(5, excuses.length - 1)

  do {
    newIndex = Math.floor(Math.random() * excuses.length)
  } while (history.value.includes(newIndex))

  history.value.push(newIndex)
  if (history.value.length > maxHistoryLength) {
    history.value.shift() // Remove oldest index
  }

  const text = excuses[newIndex]
  if (!text) {
    isGenerating.value = false
    return
  }

  let i = 0

  typeWriter = window.setInterval(() => {
    currentExcuse.value += text.charAt(i)
    i++
    if (i >= text.length) {
      if (typeWriter) clearInterval(typeWriter)
      isGenerating.value = false
    }
  }, 25) // Typing speed 25ms per char
}

const { copy } = useClipboard()

const copyToClipboard = async () => {
  if (!currentExcuse.value || isGenerating.value) return
  await copy(currentExcuse.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

onMounted(() => {
  generateExcuse()
})

onUnmounted(() => {
  if (typeWriter) clearInterval(typeWriter)
})
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center justify-center p-6 relative overflow-hidden"
  >
    <!-- Background Number -->
    <span
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[15rem] md:text-[25rem] font-bold text-accent-amber/5 select-none pointer-events-none -z-10 animate-fade-up"
    >
      404
    </span>

    <div class="w-full max-w-2xl relative animate-fade-up animate-delay-1">
      <!-- Issue Badge -->
      <div
        class="absolute -top-4 -right-4 md:-right-8 bg-accent-coral text-bg-deep font-display font-bold text-xs tracking-widest px-3 py-1.5 rotate-3 z-10 shadow-lg select-none"
      >
        VOL.ERR / 2026
      </div>

      <!-- Main Card -->
      <div
        class="border border-border-default bg-bg-surface p-8 md:p-12 transition-all duration-300 hover:-translate-y-1 hover:border-accent-coral hover:shadow-lg hover:shadow-accent-coral/5 flex flex-col items-center"
      >
        <h1
          class="font-display text-2xl md:text-3xl font-semibold text-text-primary mb-8 w-full flex items-center justify-center md:justify-start gap-3"
        >
          <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
          Dev's Excuse Generator
        </h1>

        <!-- The Terminal / Display Area -->
        <div
          class="w-full bg-bg-deep border border-border-default p-6 min-h-[180px] flex items-center justify-center text-center relative group"
        >
          <p
            class="font-display text-xl md:text-2xl text-accent-amber tracking-wide leading-relaxed"
          >
            <span class="opacity-50 mr-2">&gt;</span>
            {{ currentExcuse }}
            <span
              v-if="isGenerating"
              class="inline-block w-2.5 h-6 bg-accent-amber animate-pulse ml-1 align-middle"
            ></span>
          </p>

          <!-- Copy Button -->
          <button
            @click="copyToClipboard"
            class="absolute bottom-4 right-4 text-[10px] md:text-xs font-display tracking-widest px-3 py-1.5 transition-all outline-none"
            :class="{
              'text-text-secondary border border-border-default hover:text-accent-coral hover:border-accent-coral opacity-0 group-hover:opacity-100':
                !copied,
              'bg-accent-coral text-bg-deep border-accent-coral font-bold opacity-100': copied,
            }"
            :disabled="isGenerating"
          >
            {{ copied ? 'COPIED!' : 'COPY' }}
          </button>
        </div>

        <!-- Action Button -->
        <button
          @click="generateExcuse"
          :disabled="isGenerating"
          class="mt-10 font-display text-sm md:text-base text-bg-deep bg-text-primary px-8 py-4 font-bold tracking-widest transition-all hover:bg-accent-coral hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-text-primary"
        >
          GENERATE EXCUSE
        </button>
      </div>

      <div class="mt-8 flex justify-center w-full animate-fade-up animate-delay-3">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary"
        >
          &larr; Back to home
        </RouterLink>
      </div>
    </div>
  </div>
</template>
