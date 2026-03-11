<template>
  <div class="game-container">
    <router-link to="/" class="home-link">Về trang chủ</router-link>

    <div class="game-wrapper">
      <canvas ref="gameCanvas" @click="flap" @touchstart="flap" width="320" height="480"></canvas>

      <div v-if="showMessage" class="toast-message" :class="messageType">
        {{ messageText }}
      </div>

      <div v-if="gameState === 'START'" class="overlay">
        <h2>Giải Tích Py-Bird</h2>
        <p>Nhấn phím Space để chơi. Mỗi cột là 1 câu Giải tích.</p>
      </div>

      <div v-if="gameState === 'GAMEOVER'" class="overlay">
        <h2>TẠCH MÔN!</h2>
        <p>Điểm của bạn: {{ score }} / 20</p>
        <button @click="resetGame" class="btn">Học lại</button>
      </div>

      <div v-if="gameState === 'WIN'" class="overlay win">
        <h2>QUA MÔN</h2>
        <p>Chúc mừng bạn đã sống sót qua 20 câu Giải tích Bách Khoa!</p>
        <button @click="resetGame" class="btn">Chơi lại</button>
      </div>

      <div v-if="gameState === 'QUESTION'" class="question-modal">
        <div class="question-box">
          <h3>Câu {{ score + 1 }} / 20</h3>
          <p class="question-text">{{ currentQuestion?.q }}</p>
          <div class="options">
            <button 
              v-for="(opt, index) in currentQuestion?.options" 
              :key="index"
              @click="answerQuestion(index)"
              class="btn-option"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="score-display">Điểm: {{ score }} / 20</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Question {
  q: string;
  options: string[];
  ans: number;
}

interface Pipe {
  x: number;
  top: number;
  bottom: number;
  passed: boolean;
}

const questions: Question[] = [
  { q: "lim(x->0) [sin(3x) / x] bằng bao nhiêu?", options: ["0", "1", "3", "Vo cung"], ans: 2 },
  { q: "Đạo hàm của f(x) = ln(cos(x)) là?", options: ["sin(x)", "-tan(x)", "cot(x)", "1/cos(x)"], ans: 1 },
  { q: "Tích phân I = ∫(từ 0 đến 1) x*e^x dx bằng?", options: ["1", "e", "e - 1", "0"], ans: 0 },
  { q: "Chuỗi số ∑(n=1 đến ∞) 1/(n*(n+1)) hội tụ về?", options: ["1", "0", "Vô cùng", "1/2"], ans: 0 },
  { q: "Bán kính hội tụ R của chuỗi lũy thừa ∑ (x^n)/n! là?", options: ["0", "1", "e", "+∞"], ans: 3 },
  { q: "Gradient của hàm f(x,y) = x^2 + y^2 tại điểm (1,2) là?", options: ["(1, 2)", "(2, 4)", "(4, 2)", "(2, 2)"], ans: 1 },
  { q: "Đạo hàm riêng cấp 2 f_xy của f(x,y) = x^3*y^2 là?", options: ["6x^2*y", "3x^2*y^2", "2x^3*y", "6x*y"], ans: 0 },
  { q: "Điểm dừng của hàm f(x,y) = x^2 + xy + y^2 là?", options: ["(1,1)", "(0,0)", "(-1,1)", "Không có"], ans: 1 },
  { q: "Tích phân kép ∫∫D dxdy với D: x^2 + y^2 <= 1 bằng?", options: ["1", "2π", "π", "π/2"], ans: 2 },
  { q: "Diện tích mặt cầu bán kính R trong R^3 là?", options: ["4πR^2", "4/3πR^3", "2πR", "πR^2"], ans: 0 },
  { q: "Thể tích khối cầu bán kính R tính bằng tích phân bội 3 là?", options: ["4πR^2", "4/3πR^3", "1/3πR^3", "2/3πR^3"], ans: 1 },
  { q: "Tính công của lực F=(y, x) dọc theo đường cong kín C bất kỳ?", options: ["1", "2π", "0", "Diện tích C"], ans: 2 },
  { q: "Nghiệm tổng quát của PT vi phân y' = y là?", options: ["y = C*x", "y = C*e^x", "y = e^C*x", "y = ln(x)+C"], ans: 1 },
  { q: "Nghiệm của PT vi phân y'' + y = 0 là?", options: ["C1*cos(x) + C2*sin(x)", "C*e^x", "C1*e^x + C2*e^-x", "C*x^2"], ans: 0 },
  { q: "Theo định lý Green, ∫C Pdx + Qdy = ∫∫D (...) dxdy. Biểu thức trong ngoặc là?", options: ["P'_x - Q'_y", "Q'_x - P'_y", "P'_y - Q'_x", "Q'_y - P'_x"], ans: 1 },
  { q: "Hệ số a_0 trong chuỗi Fourier của hàm lẻ f(x) = x trên (-π, π) bằng?", options: ["1", "π", "0", "2π"], ans: 2 },
  { q: "Biến đổi Laplace L{1} của hàm f(t) = 1 là?", options: ["1", "s", "1/s^2", "1/s"], ans: 3 },
  { q: "Tích phân đường loại 1 không phụ thuộc vào yếu tố nào?", options: ["Hàm dưới dấu TP", "Đường lấy TP", "Hướng của đường cong", "Độ dài cung"], ans: 2 },
  { q: "Định lý Gauss-Ostrogradsky chuyển tích phân mặt loại 2 thành?", options: ["TP đường", "TP kép", "TP bội 3", "TP xác định"], ans: 2 },
  { q: "Nghiệm của PT y' + y/x = sin(x)/x là?", options: ["y = (C - cos(x))/x", "y = C*sin(x)", "y = C*x + cos(x)", "y = e^x / x"], ans: 0 }
];

const gameCanvas = ref<HTMLCanvasElement | null>(null);
type GameState = 'START' | 'PLAYING' | 'QUESTION' | 'GAMEOVER' | 'WIN';
const gameState = ref<GameState>('START');
const score = ref<number>(0);
const currentQuestion = ref<Question | null>(null);

const showMessage = ref<boolean>(false);
const messageText = ref<string>('');
const messageType = ref<string>('');

let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;

const BIRD = { x: 50, y: 150, width: 24, height: 24, velocity: 0, gravity: 0.4, jump: -6 };
const PIPES = ref<Pipe[]>([]);
const PIPE_WIDTH = 40;
const PIPE_GAP = 130;
let frames: number = 0;

const resetGame = (): void => {
  BIRD.y = 150;
  BIRD.velocity = 0;
  PIPES.value = [];
  score.value = 0;
  frames = 0;
  gameState.value = 'START';
  showMessage.value = false;
  draw();
};

const initGame = (): void => {
  if (!gameCanvas.value) return;
  ctx = gameCanvas.value.getContext('2d');
  resetGame();
};

const flap = (): void => {
  if (gameState.value === 'START') {
    gameState.value = 'PLAYING';
    loop();
  } else if (gameState.value === 'PLAYING') {
    BIRD.velocity = BIRD.jump;
  }
};

const handleKeyDown = (e: KeyboardEvent): void => {
  if (e.code === 'Space') {
    e.preventDefault(); 
    flap();
  }
};

const drawBird = (): void => {
  if (!ctx) return;
  ctx.font = '26px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐧', BIRD.x + BIRD.width / 2, BIRD.y + BIRD.height / 2);
};

const drawPipes = (): void => {
  if (!ctx || !gameCanvas.value) return;
  ctx.fillStyle = '#2ecc71';
  PIPES.value.forEach((pipe: Pipe) => {
    ctx!.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    ctx!.fillRect(pipe.x, gameCanvas.value!.height - pipe.bottom, PIPE_WIDTH, pipe.bottom);
  });
};

const update = (): void => {
  if (gameState.value !== 'PLAYING') return;

  BIRD.velocity += BIRD.gravity;
  BIRD.y += BIRD.velocity;

  if (BIRD.y + BIRD.height >= 480 || BIRD.y <= 0) {
    gameState.value = 'GAMEOVER';
    return;
  }

  if (frames % 120 === 0) {
    const topHeight: number = Math.random() * (480 - PIPE_GAP - 100) + 50;
    const bottomHeight: number = 480 - PIPE_GAP - topHeight;
    PIPES.value.push({ x: 320, top: topHeight, bottom: bottomHeight, passed: false });
  }

  for (let i = PIPES.value.length - 1; i >= 0; i--) {
    const pipe = PIPES.value[i];
    
    if (!pipe) continue;

    pipe.x -= 2;

    if (
      BIRD.x < pipe.x + PIPE_WIDTH &&
      BIRD.x + BIRD.width > pipe.x &&
      (BIRD.y < pipe.top || BIRD.y + BIRD.height > 480 - pipe.bottom)
    ) {
      gameState.value = 'GAMEOVER';
      return;
    }

    if (pipe.x + PIPE_WIDTH < BIRD.x && !pipe.passed) {
      pipe.passed = true;
      if (score.value < questions.length) {
        currentQuestion.value = questions[score.value] || null;
        gameState.value = 'QUESTION';
      }
    }

    if (pipe.x + PIPE_WIDTH < 0) {
      PIPES.value.splice(i, 1);
    }
  }

  frames++;
};

const draw = (): void => {
  if (!ctx || !gameCanvas.value) return;
  ctx.clearRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
  drawPipes();
  drawBird();
};

const loop = (): void => {
  if (gameState.value === 'PLAYING') {
    update();
    draw();
    animationFrameId = requestAnimationFrame(loop);
  }
};

const triggerToast = (text: string, type: string): void => {
  messageText.value = text;
  messageType.value = type;
  showMessage.value = true;
  setTimeout(() => {
    showMessage.value = false;
  }, 1500);
};

const answerQuestion = (index: number): void => {
  if (currentQuestion.value && index === currentQuestion.value.ans) {
    score.value++;
    triggerToast('Chính xác!', 'success');
    if (score.value >= 20) {
      gameState.value = 'WIN';
    } else {
      gameState.value = 'PLAYING';
      BIRD.velocity = BIRD.jump;
      loop();
    }
  } else {
    triggerToast('Sai rồi!', 'error');
    gameState.value = 'GAMEOVER';
  }
};

onMounted(() => {
  initGame();
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #2c3e50;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 20px;
  box-sizing: border-box;
}

.home-link {
  color: #ecf0f1;
  text-decoration: none;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  transition: background 0.2s;
}

.home-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

.game-wrapper {
  position: relative;
  width: 320px;
  height: 480px;
  background-color: #70c5ce;
  border: 4px solid #543847;
  border-radius: 10px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  user-select: none;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
}

.score-display {
  position: absolute;
  top: 15px;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 38px;
  font-weight: 900;
  color: white;
  text-shadow: 
    -2px -2px 0 #000,  
     2px -2px 0 #000,
    -2px  2px 0 #000,
     2px  2px 0 #000,
     0px  4px 0 #000;
  z-index: 5;
  pointer-events: none;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: white;
  padding: 20px;
  box-sizing: border-box;
  z-index: 10;
}

.overlay h2 {
  font-size: 32px;
  margin: 0 0 10px 0;
  color: #f1c40f;
  text-shadow: 2px 2px 0 #000;
}

.overlay p {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 20px;
  text-shadow: 1px 1px 0 #000;
}

.win h2 {
  color: #2ecc71;
}

.btn {
  background-color: #e67e22;
  color: white;
  border: 2px solid #fff;
  padding: 12px 24px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  text-shadow: 1px 1px 0 #000;
  box-shadow: 0 5px 0 #d35400;
  transition: all 0.1s ease;
}

.btn:active {
  transform: translateY(5px);
  box-shadow: 0 0 0 #d35400;
}

.question-modal {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.question-box {
  background: #fff;
  width: 90%;
  border-radius: 12px;
  padding: 20px;
  box-sizing: border-box;
  text-align: center;
  border: 4px solid #f1c40f;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.question-box h3 {
  margin: 0 0 15px 0;
  color: #7f8c8d;
  font-size: 18px;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 10px;
}

.question-text {
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 20px;
  line-height: 1.4;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-option {
  background: #3498db;
  color: white;
  border: none;
  padding: 15px 10px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 5px 0 #2980b9;
  transition: all 0.1s ease;
}

.btn-option:active {
  transform: translateY(5px);
  box-shadow: 0 0 0 #2980b9;
}

.toast-message {
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 20px;
  color: white;
  font-weight: bold;
  font-size: 16px;
  z-index: 30;
  animation: slideDown 0.3s ease-out;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

.toast-message.success {
  background-color: #2ecc71;
  border: 2px solid #27ae60;
}

.toast-message.error {
  background-color: #e74c3c;
  border: 2px solid #c0392b;
}

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes slideDown {
  0% { top: 50px; opacity: 0; }
  100% { top: 70px; opacity: 1; }
}
</style>
