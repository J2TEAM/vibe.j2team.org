<template>
  <div class="game-container">
    <router-link to="/" class="home-link">Về trang chủ</router-link>

    <div class="game-wrapper" @contextmenu.prevent>
      <canvas 
        ref="gameCanvas" 
        @mousedown="flap" 
        @touchstart.prevent="flap" 
        width="320" 
        height="480"
      ></canvas>

      <div v-if="showMessage" class="toast-message" :class="messageType">
        {{ messageText }}
      </div>

      <div v-if="gameState === 'SETUP'" class="overlay setup-screen">
        <h2>Nhập học Bách Khoa</h2>
        <input v-model="playerName" type="text" placeholder="Nhập tên" class="input-name" />
        <p>Chọn nhân vật đại diện:</p>
        <div class="char-selection">
          <button 
            v-for="char in chars" 
            :key="char" 
            @click="selectedChar = char"
            :class="['char-btn', { active: selectedChar === char }]"
          >
            {{ char }}
          </button>
        </div>
        <button @click="startGame" class="btn start-btn" :disabled="!playerName">Vào thi!</button>
      </div>

      <div v-if="gameState === 'START'" class="overlay">
        <h2>Giải Tích Py-Bird</h2>
        <p>Thí sinh: <b>{{ playerName }}</b></p>
        <p>Kỷ lục cá nhân: <b style="color: #2ecc71; font-size: 18px;">{{ highScore }}</b> câu</p>
        <p>Hệ thống: <b>Adaptive Random</b> | Phao: <b>{{ cheats }}</b></p>
        <p>Chạm màn hình hoặc nhấn Space để bắt đầu.</p>
      </div>

      <div v-if="gameState === 'GAMEOVER'" class="overlay gameover-screen">
        <h2>TẠCH MÔN!</h2>
        <p>Thí sinh: {{ playerName }}</p>
        <p>Số câu sống sót: <b>{{ score }}</b></p>
        <p v-if="score >= highScore && score > 0" style="color: #f1c40f; font-weight: bold; animation: popIn 0.5s;">
          🎉 KỶ LỤC MỚI! 🎉
        </p>
        <p v-else>Kỷ lục của bạn: {{ highScore }}</p>
        <button @click="resetGame" class="btn">Đóng học phí học lại</button>
      </div>

      <div v-if="gameState === 'WIN'" class="overlay win">
        <h2>QUA MÔN (A+)</h2>
        <p>Thần đồng Giải Tích: {{ playerName }}!</p>
        <p>Bạn đã vượt qua 50 câu.</p>
        <button @click="resetGame" class="btn">Cày lại GPA</button>
      </div>

      <div v-if="gameState === 'QUESTION' && currentQuestion" class="question-modal">
        <div class="question-box">
          <div class="question-header">
            <h3>Câu {{ score + 1 }} - Mức: {{ currentDifficultyText }}</h3>
            <button v-if="cheats > 0" @click="useCheat" class="btn-cheat">Dùng Phao ({{ cheats }})</button>
          </div>
          <p class="question-text" v-html="currentQuestion.q"></p>
          
          <div v-if="currentQuestion.type === 'mcq'" class="options">
            <button 
              v-for="(opt, index) in currentQuestion.options" 
              :key="index"
              @click="answerQuestion(index)"
              class="btn-option"
            >
              {{ opt }}
            </button>
          </div>

          <div v-if="currentQuestion.type === 'tf'" class="options tf-options">
            <button @click="answerQuestion(true)" class="btn-option true-btn">Đúng</button>
            <button @click="answerQuestion(false)" class="btn-option false-btn">Sai</button>
          </div>

          <div v-if="currentQuestion.type === 'short'" class="short-answer">
            <input 
              v-model="shortAnswerInput" 
              @keyup.enter="answerShortQuestion"
              type="text" 
              placeholder="Nhập đáp án..." 
              class="input-name"
            />
            <button @click="answerShortQuestion" class="btn start-btn mt-2">Chốt đáp án</button>
          </div>
        </div>
      </div>
      
      <div class="score-display">Đã qua: {{ score }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

interface Question {
  type: 'mcq' | 'tf' | 'short';
  q: string;
  ans: string | number | boolean;
  options?: string[];
}

interface Pipe {
  x: number;
  top: number;
  bottom: number;
  passed: boolean;
}

const randInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  return newArray.sort(() => Math.random() - 0.5);
};

const generateQuestion = (currentScore: number): Question => {
  let difficulty = 'easy';
  if (currentScore >= 5 && currentScore < 15) difficulty = 'medium';
  else if (currentScore >= 15) difficulty = 'hard';

  const easyTemplates = [
    (): Question => {
      const a = randInt(2, 9);
      const b = randInt(2, 9);
      const ansStr = `${a}/${b}`;
      const options = shuffleArray([ansStr, `${b}/${a}`, `${a * b}`, "0"]);
      return { type: 'mcq', q: `Tính giới hạn: lim(x->0) [sin(${a}x) / ${b}x]`, options, ans: options.indexOf(ansStr) };
    },
    (): Question => {
      const a = randInt(2, 6);
      const b = randInt(2, 5);
      const ans = a * b; 
      return { type: 'short', q: `Cho hàm số f(x) = ${a}x^${b} + x. Đạo hàm f'(1) bằng?`, ans: (ans + 1).toString() };
    },
    (): Question => {
      const a = randInt(2, 8);
      return { type: 'tf', q: `Đạo hàm của f(x) = e^(${a}x) là f'(x) = e^(${a}x).`, ans: false }; 
    }
  ];

  const mediumTemplates = [
    (): Question => {
      const a = randInt(2, 5);
      const ans = a * 2; 
      const options = shuffleArray([`${ans}`, `${ans / 2}`, `${ans * 2}`, "0"]);
      return { type: 'mcq', q: `Tính tích phân I = ∫(0 đến 2) ${a}x dx`, options, ans: options.indexOf(`${ans}`) };
    },
    (): Question => {
      const a = randInt(2, 5);
      const b = randInt(2, 5);
      const ans = 2 * a;
      return { type: 'short', q: `Cho f(x,y) = ${a}x^2 + ${b}y^2. Tính đạo hàm riêng f'_x tại điểm (1, 1).`, ans: ans.toString() };
    },
    (): Question => {
      const a = randInt(2, 10);
      return { type: 'tf', q: `Bán kính hội tụ R của chuỗi lũy thừa ∑ (x^n) / ${a}^n là R = ${a}.`, ans: true };
    }
  ];

  const hardTemplates = [
    (): Question => {
      const r1 = randInt(1, 3);
      const r2 = randInt(4, 6);
      const S = r1 + r2;
      const P = r1 * r2;
      const ansStr = `y = C1*e^(${r1}x) + C2*e^(${r2}x)`;
      const options = shuffleArray([ansStr, `y = C1*e^(-${r1}x) + C2*e^(-${r2}x)`, `y = C1*cos(${r1}x) + C2*sin(${r2}x)`, "y = C1*x + C2"]);
      return { type: 'mcq', q: `Nghiệm tổng quát của PT vi phân: y'' - ${S}y' + ${P}y = 0 là?`, options, ans: options.indexOf(ansStr) };
    },
    (): Question => {
      const a = randInt(2, 5);
      const ans = Math.PI * Math.pow(a, 2);
      return { type: 'tf', q: `Diện tích hình tròn x^2 + y^2 <= ${a}^2 tính bằng tích phân kép là ${ans}π.`, ans: false };
    },
    (): Question => {
      const a = randInt(2, 9);
      return { type: 'short', q: `Hệ số a_0 trong chuỗi Fourier của hàm lẻ f(x) = ${a}x trên (-π, π) bằng?`, ans: "0" };
    }
  ];

  let pool;
  if (difficulty === 'easy') pool = easyTemplates;
  else if (difficulty === 'medium') pool = mediumTemplates;
  else pool = hardTemplates;

  const selectedTemplate = pool[Math.floor(Math.random() * pool.length)];
  return selectedTemplate!();
};

const gameCanvas = ref<HTMLCanvasElement | null>(null);
type GameState = 'SETUP' | 'START' | 'PLAYING' | 'QUESTION' | 'GAMEOVER' | 'WIN';
const gameState = ref<GameState>('SETUP');

const playerName = ref('');
const chars = ['🐧', '🐥', '🐸', '🤓', '👽'];
const selectedChar = ref('🤓');

const score = ref(0);
const highScore = ref(0);
const cheats = ref(2); 
const currentQuestion = ref<Question | null>(null);
const currentDifficultyText = computed(() => {
  if (score.value < 5) return 'Dễ';
  if (score.value < 15) return 'Trung bình';
  return 'Khó';
});
const shortAnswerInput = ref('');

const showMessage = ref(false);
const messageText = ref('');
const messageType = ref('');

let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number;
let lastTime = 0;

const BIRD = { x: 50, y: 150, width: 24, height: 24, velocity: 0, gravity: 0.35, jump: -6.5 };
const PIPES: Pipe[] = [];
const PIPE_WIDTH = 45;
const PIPE_GAP = 140;
const BASE_SPEED = 2.5;
let frames = 0;

const startGame = () => {
  if (playerName.value.trim() === '') return;
  gameState.value = 'START';
  initGame();
};

const initGame = () => {
  if (!gameCanvas.value) return;
  ctx = gameCanvas.value.getContext('2d');
  resetGameData();
  draw();
};

const resetGameData = () => {
  BIRD.y = 150;
  BIRD.velocity = 0;
  PIPES.length = 0;
  score.value = 0;
  cheats.value = 2; 
  frames = 0;
  lastTime = performance.now();
  showMessage.value = false;
};

const resetGame = () => {
  resetGameData();
  gameState.value = 'START';
  draw();
};

const checkHighScore = () => {
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem('hust_bird_highscore', highScore.value.toString());
  }
};

const flap = () => {
  if (gameState.value === 'START') {
    gameState.value = 'PLAYING';
    lastTime = performance.now();
    loop(lastTime);
  } else if (gameState.value === 'PLAYING') {
    BIRD.velocity = BIRD.jump;
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    e.preventDefault(); 
    flap();
  } else if (e.code === 'Enter' && gameState.value === 'SETUP') {
    startGame();
  }
};

const drawBird = () => {
  if (!ctx) return;
  ctx.font = '28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(BIRD.x + BIRD.width / 2, BIRD.y + BIRD.height / 2);
  ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (BIRD.velocity * 0.1))));
  ctx.fillText(selectedChar.value, 0, 0);
  ctx.restore();
};

const drawPipes = () => {
  if (!ctx || !gameCanvas.value) return;
  PIPES.forEach(pipe => {
    const grad = ctx!.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    grad.addColorStop(0, '#27ae60');
    grad.addColorStop(0.5, '#2ecc71');
    grad.addColorStop(1, '#27ae60');
    
    ctx!.fillStyle = grad;
    ctx!.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    ctx!.fillRect(pipe.x, gameCanvas.value!.height - pipe.bottom, PIPE_WIDTH, pipe.bottom);
    
    ctx!.strokeStyle = '#2c3e50';
    ctx!.lineWidth = 2;
    ctx!.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    ctx!.strokeRect(pipe.x, gameCanvas.value!.height - pipe.bottom, PIPE_WIDTH, pipe.bottom);
  });
};

const update = (dt: number) => {
  if (gameState.value !== 'PLAYING') return;

  const multiplier = dt / 16.67; 

  BIRD.velocity += BIRD.gravity * multiplier;
  BIRD.y += BIRD.velocity * multiplier;

  if (BIRD.y + BIRD.height >= 480 || BIRD.y <= 0) {
    checkHighScore();
    gameState.value = 'GAMEOVER';
    return;
  }

  frames += multiplier;
  if (frames >= 110) { 
    frames = 0;
    const topHeight = Math.random() * (480 - PIPE_GAP - 120) + 60;
    const bottomHeight = 480 - PIPE_GAP - topHeight;
    PIPES.push({ x: 320, top: topHeight, bottom: bottomHeight, passed: false });
  }

  for (let i = PIPES.length - 1; i >= 0; i--) {
    const pipe = PIPES[i];
    if (!pipe) continue;

    pipe.x -= BASE_SPEED * multiplier; 

    if (
      BIRD.x < pipe.x + PIPE_WIDTH &&
      BIRD.x + BIRD.width > pipe.x &&
      (BIRD.y < pipe.top || BIRD.y + BIRD.height > 480 - pipe.bottom)
    ) {
      checkHighScore();
      gameState.value = 'GAMEOVER';
      return;
    }

    if (pipe.x + PIPE_WIDTH < BIRD.x && !pipe.passed) {
      pipe.passed = true;
      currentQuestion.value = generateQuestion(score.value);
      shortAnswerInput.value = ''; 
      gameState.value = 'QUESTION';
    }

    if (pipe.x + PIPE_WIDTH < 0) {
      PIPES.splice(i, 1);
    }
  }
};

const draw = () => {
  if (!ctx || !gameCanvas.value) return;
  if (score.value < 15) ctx.fillStyle = '#70c5ce';
  else ctx.fillStyle = '#e67e22'; 

  ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height);
  drawPipes();
  drawBird();
};

const loop = (timestamp: number) => {
  if (gameState.value === 'PLAYING') {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (dt < 100) update(dt);
    draw();
    animationFrameId = requestAnimationFrame(loop);
  } else {
    lastTime = timestamp;
  }
};

const triggerToast = (text: string, type: string) => {
  messageText.value = text;
  messageType.value = type;
  showMessage.value = true;
  setTimeout(() => { showMessage.value = false; }, 1500);
};

const handleCorrect = () => {
  score.value++;
  triggerToast('Đỉnh cao!', 'success');
  if (score.value >= 50) {
    checkHighScore();
    gameState.value = 'WIN';
  } else {
    gameState.value = 'PLAYING';
    BIRD.velocity = BIRD.jump;
    lastTime = performance.now();
    loop(lastTime);
  }
};

const handleWrong = () => {
  checkHighScore();
  triggerToast('Sai rồi!', 'error');
  gameState.value = 'GAMEOVER';
};

const useCheat = () => {
  if (cheats.value > 0) {
    cheats.value--;
    triggerToast('Đã dùng phao!', 'success');
    handleCorrect(); 
  }
};

const answerQuestion = (answer: string | number | boolean) => {
  if (currentQuestion.value && answer === currentQuestion.value.ans) {
    handleCorrect();
  } else {
    handleWrong();
  }
};

const answerShortQuestion = () => {
  const userAns = shortAnswerInput.value.trim().toLowerCase();
  if (currentQuestion.value) {
    const correctAns = currentQuestion.value.ans.toString().toLowerCase();
    if (userAns === correctAns) {
      handleCorrect();
    } else {
      handleWrong();
    }
  }
};

onMounted(() => {
  const savedScore = localStorage.getItem('hust_bird_highscore');
  if (savedScore) {
    highScore.value = parseInt(savedScore, 10);
  }
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
  background-color: #1a252f;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 10px;
  box-sizing: border-box;
}

.home-link {
  color: #ecf0f1;
  text-decoration: none;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  transition: background 0.2s;
}

.game-wrapper {
  position: relative;
  width: 100%;
  max-width: 320px;
  height: 480px;
  background-color: #70c5ce;
  border: 4px solid #f39c12;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  user-select: none;
  touch-action: none; 
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
  cursor: pointer;
}

.score-display {
  position: absolute;
  top: 15px;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 32px;
  font-weight: 900;
  color: white;
  text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
  z-index: 5;
  pointer-events: none;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
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
  font-size: 28px;
  margin: 0 0 10px 0;
  color: #f1c40f;
  text-shadow: 2px 2px 0 #000;
}

.overlay p {
  font-size: 15px;
  margin-bottom: 20px;
}

.input-name {
  width: 80%;
  padding: 10px;
  border-radius: 5px;
  border: none;
  font-size: 16px;
  margin-bottom: 15px;
  text-align: center;
}
.char-selection {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.char-btn {
  font-size: 24px;
  background: none;
  border: 2px solid transparent;
  cursor: pointer;
  border-radius: 10px;
  transition: 0.2s;
  padding: 5px;
}
.char-btn.active {
  border-color: #f1c40f;
  background: rgba(255,255,255,0.2);
}

.gameover-screen { background: rgba(192, 57, 43, 0.9); }

.btn {
  background-color: #e67e22;
  color: white;
  border: 2px solid #fff;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 0 #d35400;
  transition: 0.1s ease;
}
.btn:disabled {
  background-color: #7f8c8d;
  box-shadow: 0 4px 0 #34495e;
  cursor: not-allowed;
}
.btn:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 0 0 #d35400;
}
.start-btn { background-color: #27ae60; box-shadow: 0 4px 0 #2ecc71; }

.question-modal {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(44, 62, 80, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.question-box {
  background: #ecf0f1;
  width: 90%;
  border-radius: 12px;
  padding: 15px;
  box-sizing: border-box;
  text-align: center;
  border: 4px solid #f1c40f;
  animation: popIn 0.2s;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #bdc3c7;
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.question-header h3 {
  margin: 0;
  color: #7f8c8d;
  font-size: 15px;
}

.btn-cheat {
  background: #9b59b6;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  font-size: 13px;
  box-shadow: 0 3px 0 #8e44ad;
}
.btn-cheat:active { transform: translateY(3px); box-shadow: 0 0 0 #8e44ad; }

.question-text {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
  line-height: 1.4;
}

.options { display: flex; flex-direction: column; gap: 8px; }
.tf-options { flex-direction: row; }

.btn-option {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 10px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 0 #2980b9;
}
.btn-option:active { transform: translateY(4px); box-shadow: 0 0 0 #2980b9; }

.true-btn { background: #27ae60; box-shadow: 0 4px 0 #2ecc71; flex: 1; }
.false-btn { background: #e74c3c; box-shadow: 0 4px 0 #c0392b; flex: 1; }

.mt-2 { margin-top: 10px; width: 100%; }

.toast-message {
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: bold;
  font-size: 14px;
  z-index: 30;
  animation: slideDown 0.3s ease-out;
}
.toast-message.success { background-color: #2ecc71; border: 2px solid #27ae60; }
.toast-message.error { background-color: #e74c3c; border: 2px solid #c0392b; }

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes slideDown {
  0% { top: 50px; opacity: 0; }
  100% { top: 70px; opacity: 1; }
}
</style>
