<template>
  <div class="flex justify-center">
    <RouterLink
      to="/"
      class="m-4 inline-flex items-center gap-2 border border-border-default bg-bg-surface/50 backdrop-blur-sm px-5 py-2.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-accent-coral z-10 rounded-full"
    >
      &larr; Quay về chính đạo
    </RouterLink>
  </div>
  <div class="troll-container">
    <h2 class="title">Tài hay Xỉu? Tui là trợ lý tâm linh bắt cầu giúp bạn nha</h2>

    <div v-if="!isFinished && !isCalculating" class="question-box">
      <p class="step-indicator">Bước {{ currentStep + 1 }} / {{ totalQuestions }}</p>
      <p class="question-text">{{ currentQuestion }}</p>

      <input
        v-model="currentAnswer"
        type="text"
        @keyup.enter="nextQuestion"
        placeholder="Nhập thông tin vũ trụ yêu cầu..."
        class="input-field"
        autocomplete="off"
      />

      <button class="btn-submit" @click="nextQuestion" :disabled="!currentAnswer.trim()">
        {{ currentStep === totalQuestions - 1 ? 'Chốt Sổ!' : 'Tiếp Tục' }}
      </button>
    </div>

    <div v-else-if="isCalculating" class="calculating-box">
      <div class="spinner"></div>
      <p class="calculating-text">{{ loadingMessage }}</p>
    </div>

    <div v-else class="result-box">
      <h3 class="result-title">Lời Sấm Truyền:</h3>

      <p class="result-text" :class="resultColorClass">{{ resultMessage }}</p>

      <div v-if="resultImage" class="image-wrapper">
        <img :src="resultImage" alt="Thông điệp vũ trụ" class="result-image" />
      </div>

      <button class="btn-reset" @click="resetGame">Hỏi lại các ngài</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import imgBoiRoi from './assets/boi-roi.jpg'
import goPhim from './assets/chu-cong-an-go-phim.jpg'
import justDoIt from './assets/just-do-it.png'
import miyabiYes from './assets/miyabi-yes.gif'
import miyabiNo from './assets/miyabi-no.gif'
import chiuRoi from './assets/chiu-roi.jpg'
import maoMao from './assets/maomao.jpg'

// Ngân hàng câu hỏi xàm xí
const questionBank = [
  'Bạn sinh năm bao nhiêu?',
  'Sáng nay bạn ăn món gì?',
  'Tên người yêu cũ của bạn là gì?',
  'Trong ví bạn đang có bao nhiêu tiền lẻ?',
  'Số điện thoại của bạn có đuôi là số mấy?',
  'Bạn tự chấm nhan sắc mình mấy điểm (thang 10)?',
  'Bạn có rớt môn nào ở trường chưa?',
  'Giữa NextJS và NestJS, bạn thích code cái nào hơn?',
  'Bạn có hay quên push code lên GitLab không?',
  'Anya trong Spy x Family thích ăn gì nhất?',
  'Gacha dạo này ở Uma Musume có nổ thẻ xịn không?',
  'Bạn có hay xem stream của Hololive English -Advent- không?',
  'Bạn hay dùng Jira hay Lark để quản lý task?',
  'Nếu trúng vé số 10 tỷ, bạn sẽ làm gì đầu tiên?',
  'Hôm nay bạn đã uống đủ 2 lít nước chưa?',
  'Bạn thích ăn phở bỏ hành hay không hành?',
  'Đã bao lâu rồi bạn chưa đi nhậu?',
  'Hãy gõ một tràng cười thật dài vào đây:',
]

const taiResults = ['TÀI! Cứ tin tôi, các ngài bảo thế!', 'Thở ra chữ TÀI! Quất mạnh đi, đừng sợ!']

const xiuResults = [
  'XỈU! Khép góc này chỉ có xỉu thôi!',
  'Chắc kèo XỈU! Tôi đã soi cửu tinh đồ rồi!',
]

// State quản lý luồng trò chơi
const totalQuestions = ref(0)
const currentStep = ref(0)
const questions = ref<string[]>([])
const currentAnswer = ref('')
const isFinished = ref(false)
const isCalculating = ref(false)

const resultMessage = ref('')
const resultColorClass = ref('')
const resultImage = ref('') // Thêm state quản lý hình ảnh
const loadingMessage = ref('')

const currentQuestion = computed(() => questions.value[currentStep.value])

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const shuffleArray = (array: string[]) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))

    // Dùng biến tạm để swap thay vì destructuring
    const temp = shuffled[i]
    if (temp !== undefined && shuffled[j] !== undefined) {
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }
  }
  return shuffled
}

const resetGame = () => {
  totalQuestions.value = getRandomInt(3, 7)
  questions.value = shuffleArray(questionBank).slice(0, totalQuestions.value)
  currentStep.value = 0
  currentAnswer.value = ''
  isFinished.value = false
  isCalculating.value = false
  resultMessage.value = ''
  resultColorClass.value = ''
  resultImage.value = '' // Reset ảnh mỗi lần chơi lại
}

// Thuật toán gacha
const calculateResult = () => {
  const roll = getRandomInt(1, 100)

  if (roll <= 20) {
    // 20% Tài
    resultMessage.value =
      taiResults[getRandomInt(0, taiResults.length - 1)] ?? 'TÀI! Cứ tin tôi, các ngài bảo thế!'
    resultImage.value = justDoIt
    resultColorClass.value = 'text-tai'
  } else if (roll <= 40) {
    // 20% Xỉu
    resultMessage.value =
      xiuResults[getRandomInt(0, xiuResults.length - 1)] ?? 'XỈU! Khép góc này chỉ có xỉu thôi!'
    resultImage.value = miyabiYes
    resultColorClass.value = 'text-xiu'
  } else if (roll <= 50) {
    // 10% Ra hình ảnh Troll
    resultMessage.value = 'Vũ trụ không nói gì, chỉ gửi cho bạn bức ảnh này...'
    resultImage.value =
      'https://scontent.fsgn5-8.fna.fbcdn.net/v/t39.30808-6/627389521_896566836301822_5227994160439159077_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=dd6889&_nc_eui2=AeFVkpK2BHZukkiqINKQeO0bi2cwXaYAIz-LZzBdpgAjP762WZViFWxFxA1qUtGsZ_iqJejLYjN30GfOi4n-I5Nm&_nc_ohc=66u2CTFTWvwQ7kNvwEvJF3F&_nc_oc=Adm1q1pT6HpRxYdyoz7KUaCOflmIWBs6zVljgZyPUiaSTWETOhWLG2n2CMNmtasxbJA&_nc_zt=23&_nc_ht=scontent.fsgn5-8.fna&_nc_gid=R87_qCf1tCI3rUA1PdesdA&_nc_ss=8&oh=00_AfzWTuTvzpS3nKmNjGIhkS4M9b7WtuM9pHP5mY_SHf3W6g&oe=69B57415'
    resultColorClass.value = 'text-image-troll'
  } else if (roll <= 65) {
    // 15% HDPE
    resultMessage.value = 'Tầm này đầu tư vào HDPE là ngon luôn, tài xỉu gì nữa!'
    resultImage.value = goPhim
    resultColorClass.value = 'text-hdpe'
  } else if (roll <= 75) {
    // 10% Bug
    resultMessage.value = 'Bỏ đi, về fix bug với viết test đi, sập server bây giờ!'
    resultImage.value = miyabiNo
    resultColorClass.value = 'text-dev'
  } else if (roll <= 85) {
    // 10% Game
    resultMessage.value = '🎉 BẠN ĐÃ ROLL RA TƯỚNG 5 VÀNG Ở LV 7! (Nhưng mà sai game rồi)'
    resultImage.value = chiuRoi
    resultColorClass.value = 'text-game'
  } else if (roll <= 95) {
    // 10% Khuyên
    resultMessage.value = '🙏 Cờ bạc là bác thằng bần. Thôi tắt máy đi ngủ đi bạn ơi!'
    resultImage.value = imgBoiRoi
    resultColorClass.value = 'text-khuyen'
  } else {
    // 5% Nhiễu
    resultMessage.value =
      'Không biết! Đánh đại đi, mà dạo này đang xem quả anime Dược sư tự sự hay phết, Mao Mao xứng đáng vợ tôi hẹ hẹ'
    resultImage.value = maoMao
    resultColorClass.value = 'text-unknown'
  }
}

const nextQuestion = () => {
  if (!currentAnswer.value.trim()) return

  if (currentStep.value < totalQuestions.value - 1) {
    currentStep.value++
    currentAnswer.value = ''
  } else {
    isCalculating.value = true
    loadingMessage.value = 'Đang gieo quẻ xin keo...'

    setTimeout(() => {
      loadingMessage.value = 'Đang kết nối với các ngài...'
    }, 800)
    setTimeout(() => {
      loadingMessage.value = 'Đang soi cửu tinh đồ...'
    }, 1600)

    setTimeout(() => {
      calculateResult()
      isCalculating.value = false
      isFinished.value = true
    }, 2500)
  }
}

onMounted(() => {
  resetGame()
})
</script>

<style scoped>
/* CSS giữ nguyên phần trên, thêm class cho ảnh ở dưới */
.troll-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 2.5rem;
  border: 4px solid #8e44ad;
  border-radius: 20px;
  text-align: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.title {
  color: #8e44ad;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  text-transform: uppercase;
}
.step-indicator {
  font-size: 1rem;
  color: #d35400;
  font-weight: 800;
  margin-bottom: 0.5rem;
}
.question-text {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 1.5rem 0;
  color: #2980b9;
  min-height: 60px;
}

.input-field {
  width: 100%;
  padding: 14px;
  margin: 1rem 0 2rem 0;
  border: 2px solid #bdc3c7;
  border-radius: 10px;

  /* Phần chỉnh sửa màu và chữ nằm ở đây */
  font-size: 1.2rem; /* Tăng size chữ lên một chút */
  font-weight: bold; /* Cho chữ in đậm lên */
  color: #000000; /* Chữ màu đen tuyền cực rõ */

  box-sizing: border-box;
  transition: all 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: #8e44ad;
  box-shadow: 0 0 8px rgba(142, 68, 173, 0.3);
}

/* Thêm đoạn này để chỉnh màu của cái chữ mờ mờ (Placeholder) lúc chưa nhập gì */
.input-field::placeholder {
  color: #7f8c8d; /* Màu xám đậm hơn một chút để dễ đọc */
  font-weight: normal; /* Giữ chữ thường để phân biệt với chữ lúc nhập */
  font-style: italic; /* In nghiêng cho nghệ thuật */
}

.btn-submit,
.btn-reset {
  padding: 14px 28px;
  font-size: 1.2rem;
  color: white;
  background-color: #27ae60;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  text-transform: uppercase;
}
.btn-submit:hover:not(:disabled) {
  background-color: #2ecc71;
  transform: translateY(-2px);
}
.btn-submit:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.btn-reset {
  background-color: #e74c3c;
  margin-top: 1.5rem;
}
.btn-reset:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
}

.calculating-box {
  padding: 3rem 0;
  animation: pulse 1.5s infinite;
}
.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #8e44ad;
  border-radius: 50%;
  margin: 0 auto 1.5rem auto;
  animation: spin 1s linear infinite;
}
.calculating-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #e67e22;
}

.result-box {
  animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.result-title {
  color: #34495e;
  font-size: 1.4rem;
}
.result-text {
  font-size: 1.6rem;
  font-weight: 900;
  margin: 1.5rem 0;
  padding: 1.5rem;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
}

/* Style cho khu vực chứa hình ảnh */
.image-wrapper {
  margin: 1rem 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  animation: popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.result-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

/* Các class màu sắc */
.text-tai {
  color: #c0392b;
  border: 2px solid #c0392b;
  animation: shake 0.5s;
}
.text-xiu {
  color: #2980b9;
  border: 2px solid #2980b9;
  animation: shake 0.5s;
}
.text-hdpe {
  color: #16a085;
  border: 2px dashed #16a085;
}
.text-dev {
  color: #8e44ad;
}
.text-game {
  color: #f39c12;
}
.text-khuyen {
  color: #7f8c8d;
  font-style: italic;
}
.text-unknown {
  color: #34495e;
  filter: blur(0.5px);
}
.text-image-troll {
  color: #2c3e50;
  font-style: italic;
  border: 2px dashed #95a5a6;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}
@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25%,
  75% {
    transform: translateX(-5px) rotate(-1deg);
  }
  50% {
    transform: translateX(5px) rotate(1deg);
  }
}
</style>
