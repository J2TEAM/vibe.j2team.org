<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { getRandomText, getWordsFromText } from './data/texts';
import { calculateWPM, calculateAccuracy } from './utils/wpm';
import { getSavedProfile, saveProfile, getHistory, addHistoryRecord, removeHistoryRecord, clearHistory, type TypingRecord } from './utils/storage';

// --- Screen State ---
type Screen = 'home' | 'setup' | 'play' | 'result' | 'history';
const currentScreen = ref<Screen>('home');

// --- Profile & History ---
const profileNameInput = ref('');
const savedProfile = ref('');
const historyRecords = ref<TypingRecord[]>([]);

// --- Setup Options ---
const selectedDuration = ref(60);
const durations = [15, 30, 60, 120];

// --- Game Tracking ---
const wordsList = ref<string[]>([]);
const pastTypedWords = ref<string[]>([]);
const typedInput = ref('');
const currentWordIndex = ref(0);

// Stats Tracking
const totalKeystrokes = ref(0); // Only counts printable chars
const totalCorrectChars = ref(0); // Exact correct chars for CPM/WPM tracking
const startTime = ref<number | null>(null);
const timerDuration = ref(60);
const timeLeft = ref(60);
const isTimerActive = ref(false);
let timerInterval: ReturnType<typeof setInterval> | null = null;
const isFinished = ref(false);

// --- Element Refs ---
const hiddenInputRef = ref<HTMLInputElement | null>(null);
const wordsContainerRef = ref<HTMLElement | null>(null);

// =======================
// Lifecycle & Transitions
// =======================
onMounted(() => {
  const pName = getSavedProfile();
  if (pName) {
    savedProfile.value = pName;
    profileNameInput.value = pName;
  }
  
  document.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  stopTimer();
  document.removeEventListener('keydown', handleGlobalKeydown);
});

// =======================
// Navigation Logic
// =======================
function gotoHome() {
  stopTimer();
  currentScreen.value = 'home';
}

function startSetup() {
  if (!profileNameInput.value.trim()) {
    alert("Vui lòng nhập tên người chơi!");
    return;
  }
  saveProfile(profileNameInput.value);
  savedProfile.value = profileNameInput.value;
  currentScreen.value = 'setup';
}

function viewHistory() {
  if (!savedProfile.value) return;
  historyRecords.value = getHistory(savedProfile.value);
  currentScreen.value = 'history';
}

function clearUserHistory() {
  if (confirm('Bạn có chắc chắn muốn xoá toàn bộ lịch sử?')) {
    clearHistory(savedProfile.value);
    historyRecords.value = [];
  }
}

function removeSingleHistory(id: string) {
  removeHistoryRecord(savedProfile.value, id);
  historyRecords.value = getHistory(savedProfile.value);
}

// =======================
// Game Logic
// =======================

function startGame() {
  stopTimer();
  
  const rawText = getRandomText();
  wordsList.value = getWordsFromText(rawText);
  
  // Reset states
  pastTypedWords.value = [];
  typedInput.value = '';
  currentWordIndex.value = 0;
  totalKeystrokes.value = 0;
  totalCorrectChars.value = 0;
  isFinished.value = false;
  
  timerDuration.value = selectedDuration.value;
  timeLeft.value = selectedDuration.value;
  startTime.value = null;
  
  currentScreen.value = 'play';
  nextTick(() => focusInput());
}

function focusInput() {
  if (currentScreen.value === 'play' && !isFinished.value && hiddenInputRef.value) {
    hiddenInputRef.value.focus();
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  // Focus logic
  if (currentScreen.value === 'play') {
    focusInput();
    
    // Track physical keystrokes (excluding keys like Shift, Control, Backspace)
    if (e.key.length === 1) {
      totalKeystrokes.value++;
    }
  }
}

function startTimer() {
  if (isTimerActive.value) return;
  isTimerActive.value = true;
  startTime.value = Date.now();
  
  timerInterval = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      endTest();
    }
  }, 1000);
}

function stopTimer() {
  isTimerActive.value = false;
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function handleInput(e: Event) {
  if (isFinished.value) return;
  
  if (!isTimerActive.value) {
    startTimer();
  }
  
  const target = e.target as HTMLInputElement;
  const val = target.value;
  
  // Check completion logic
  if (val.endsWith(' ')) {
    const wordTyped = val.substring(0, val.length - 1); // remove space
    const targetWord = wordsList.value[currentWordIndex.value];
    
    pastTypedWords.value.push(wordTyped);
    
    // Add space as a correct char if word is correct
    if (targetWord && wordTyped === targetWord) {
      totalCorrectChars.value += wordTyped.length + 1;
    } else if (targetWord) {
      // Partially correct char counting for accuracy/WPM inside words
      for (let i = 0; i < Math.min(wordTyped.length, targetWord.length); i++) {
        if (wordTyped[i] === targetWord[i]) totalCorrectChars.value++;
      }
    }
    
    currentWordIndex.value++;
    typedInput.value = '';
    
    // Auto-scroll logic if word container goes out of view
    scrollToActiveWord();
    
    // Check if finished context
    if (currentWordIndex.value >= wordsList.value.length) {
      endTest();
    }
  } else if (currentWordIndex.value === wordsList.value.length - 1) {
    // Check auto-completion for the LAST word ONLY without needing Space
    const targetWord = wordsList.value[currentWordIndex.value];
    if (targetWord && val.trim() === targetWord) {
      pastTypedWords.value.push(val.trim());
      totalCorrectChars.value += targetWord.length;
      currentWordIndex.value++;
      typedInput.value = '';
      endTest();
    }
  }
}

function scrollToActiveWord() {
  if (!wordsContainerRef.value) return;
  const activeWordNode = wordsContainerRef.value.children[currentWordIndex.value] as HTMLElement;
  if (activeWordNode) {
    const containerTop = wordsContainerRef.value.offsetTop;
    const activeTop = activeWordNode.offsetTop;
    // Scroll if went past second line
    if (activeTop - containerTop > 50) {
       wordsContainerRef.value.scrollTop = activeTop - containerTop - 10;
    }
  }
}


function endTest() {
  stopTimer();
  isFinished.value = true;
  if (hiddenInputRef.value) hiddenInputRef.value.blur();
  
  // Calculate final char for the last incomplete word
  const currentTarget = wordsList.value[currentWordIndex.value];
  const currentTyped = typedInput.value.trim();
  if (currentTarget && currentTyped) {
    for (let i = 0; i < Math.min(currentTyped.length, currentTarget.length); i++) {
       if (currentTyped[i] === currentTarget[i]) totalCorrectChars.value++;
    }
  }
  
  // Save history
  addHistoryRecord(savedProfile.value, {
    wpm: finalWPM.value,
    cpm: finalCPM.value,
    accuracy: finalAccuracy.value,
    duration: timeUsedInSeconds.value,
    mode: `Cá nhân ${timerDuration.value}s`
  });
  
  currentScreen.value = 'result';
}

// =======================
// Character Render Logics
// =======================
function getCharClass(wIdx: number, cIdx: number) {
  if (wIdx > currentWordIndex.value) return 'text-[#646669]'; // future
  
  const isCurrent = wIdx === currentWordIndex.value;
  const typedWord = isCurrent ? typedInput.value.trim() : pastTypedWords.value[wIdx];
  
  if (typedWord === undefined || !wordsList.value[wIdx]) return 'text-[#646669]';
  
  if (cIdx < typedWord.length) {
    return typedWord[cIdx] === wordsList.value[wIdx]![cIdx]
      ? 'text-[#d1d0c5]' // correct
      : 'text-[#ca4754]'; // incorrect
  }
  
  if (isCurrent) {
    return 'text-[#646669]'; // pending char of current word
  } else {
    // missing char in past word
    return 'text-[#ca4754] opacity-50 underline decoration-[#ca4754]/50';
  }
}

function getExtraCharsString(wIdx: number) {
  const isCurrent = wIdx === currentWordIndex.value;
  const typedWord = isCurrent ? typedInput.value.trim() : pastTypedWords.value[wIdx];
  const targetWord = wordsList.value[wIdx];
  
  if (!typedWord || !targetWord || typedWord.length <= targetWord.length) return '';
  return typedWord.substring(targetWord.length);
}

// =======================
// Stats Computed Properties
// =======================
const timeUsedInSeconds = computed(() => {
  if (timeLeft.value === timerDuration.value && !isTimerActive.value) return 0;
  return timerDuration.value - timeLeft.value;
});

const progressPercent = computed(() => {
  return Math.min(100, Math.round((currentWordIndex.value / wordsList.value.length) * 100));
});

const finalWPM = computed(() => {
  return Math.max(0, calculateWPM(totalCorrectChars.value, timeUsedInSeconds.value));
});

const finalCPM = computed(() => {
  const secs = timeUsedInSeconds.value || 1;
  return Math.round((totalCorrectChars.value / secs) * 60);
});

const finalAccuracy = computed(() => {
  const c = totalCorrectChars.value;
  const t = totalKeystrokes.value;
  if (t === 0) return 100;
  return calculateAccuracy(c, t); // custom logic with actual keystrokes
});

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
};

</script>

<template>
  <div 
    class="min-h-screen bg-[#323437] text-[#646669] font-mono selection:bg-[#e2b714] selection:text-[#323437] flex flex-col items-center px-4"
    @click="focusInput"
  >
    <!-- GLOBAL HEADER NAV -->
    <header class="w-full max-w-5xl flex justify-between items-center py-6 mb-4">
      <div 
        @click="gotoHome"
        class="flex items-center gap-3 cursor-pointer group hover:text-[#d1d0c5] transition-colors"
      >
        <div class="bg-[#d1d0c5] group-hover:bg-[#e2b714] transition-colors text-[#323437] px-2 py-1 rounded text-sm font-bold tracking-wider uppercase flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg>
        </div>
        <span class="text-xl font-bold tracking-widest text-[#d1d0c5]">VibeType</span>
      </div>
      
      <div class="flex gap-4">
        <button 
          v-if="currentScreen === 'play' || currentScreen === 'result'"
          @click.stop="startGame"
          class="hover:text-[#e2b714] transition-colors"
          title="Chơi Lại (Cùng Mode)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        <div v-if="savedProfile" class="flex items-center gap-2 text-sm text-[#d1d0c5] bg-[#2c2e31] px-3 py-1 rounded-full border border-[#646669]/30">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {{ savedProfile }}
        </div>
      </div>
    </header>

    <main class="w-full max-w-5xl flex-1 flex flex-col items-center justify-center p-4">
      
      <!-- SCREEN: HOME -->
      <div v-if="currentScreen === 'home'" class="w-full max-w-md animate-fade-in flex flex-col items-center">
        <h1 class="text-4xl font-bold tracking-widest text-[#e2b714] mb-2 uppercase">VibeType</h1>
        <p class="mb-10 text-center">Nền tảng kiểm tra tốc độ gõ phím hỗ trợ chuẩn Telex tiếng Việt.</p>
        
        <div class="w-full bg-[#2c2e31] p-6 rounded-2xl shadow-xl border border-[#e2b714]/10">
          <label class="block text-xs uppercase tracking-widest mb-2 font-bold text-[#d1d0c5]">Hồ Sơ Người Chơi (Profile)</label>
          <input 
            v-model="profileNameInput"
            @keyup.enter="startSetup"
            class="w-full bg-[#323437] text-[#d1d0c5] border-2 border-[#646669]/50 focus:border-[#e2b714] outline-none px-4 py-3 rounded-xl mb-6 transition-colors font-bold text-lg"
            placeholder="Nhập tên của bạn..."
            autofocus
          />
          <div class="flex gap-4">
             <button @click="startSetup" class="flex-1 bg-[#e2b714] hover:bg-[#c29c11] text-[#323437] font-bold py-3 rounded-xl transition-transform active:scale-95">
               Tiếp tục
             </button>
             <button v-if="savedProfile" @click="viewHistory" class="flex-1 bg-[#323437] hover:bg-[#646669] text-[#d1d0c5] border border-[#d1d0c5]/20 font-bold py-3 rounded-xl transition-transform active:scale-95">
               Lịch sử
             </button>
          </div>
        </div>
      </div>

      <!-- SCREEN: SETUP -->
      <div v-else-if="currentScreen === 'setup'" class="w-full max-w-lg animate-fade-in flex flex-col gap-6">
        <h2 class="text-2xl text-[#d1d0c5] font-bold text-center mb-4">Cấu hình Vòng Chơi</h2>
        
        <div class="bg-[#2c2e31] p-6 rounded-2xl border border-[#646669]/20 flex flex-col items-center">
           <h3 class="text-sm uppercase tracking-widest mb-4 font-bold text-[#e2b714]">Thời Gian (Giây)</h3>
           <div class="flex bg-[#323437] rounded-lg p-1 w-full justify-between border border-[#646669]/30">
              <button 
                v-for="d in durations" :key="d"
                @click="selectedDuration = d"
                class="flex-1 py-2 text-sm font-bold rounded-md transition-all"
                :class="selectedDuration === d ? 'bg-[#d1d0c5] text-[#323437] shadow-sm' : 'text-[#646669] hover:text-[#d1d0c5]'"
              >
                {{ d }}s
              </button>
           </div>
           <button @click="startGame()" class="mt-6 w-full bg-[#323437] hover:bg-[#d1d0c5] text-[#e2b714] hover:text-[#323437] border-2 border-[#e2b714] font-bold py-3 rounded-xl transition-all active:scale-95">
             Bắt Đầu Ngay
           </button>
        </div>
      </div>

      <!-- SCREEN: PLAYING -->
      <div v-else-if="currentScreen === 'play'" class="w-full animate-fade-in flex flex-col max-w-5xl">
        
        <!-- Stats Top Bar -->
        <div class="flex justify-between items-end mb-4">
          <div class="text-3xl font-bold text-[#e2b714]">{{ timeLeft }}</div>
          <div class="flex gap-6 text-sm">
            <div>
              <span class="uppercase tracking-widest text-[#646669] text-xs">WPM</span>
              <span class="ml-2 font-bold text-xl text-[#d1d0c5]">{{ finalWPM }}</span>
            </div>
            <div>
              <span class="uppercase tracking-widest text-[#646669] text-xs">CPM</span>
              <span class="ml-2 font-bold text-xl text-[#d1d0c5]">{{ finalCPM }}</span>
            </div>
            <div>
              <span class="uppercase tracking-widest text-[#646669] text-xs">Acc</span>
              <span class="ml-2 font-bold text-xl text-[#d1d0c5]">{{ finalAccuracy }}%</span>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-1 bg-[#2c2e31] mb-6 rounded-full overflow-hidden">
          <div class="h-full bg-[#e2b714] rounded-full transition-all duration-300" :style="`width: ${progressPercent}%`"></div>
        </div>

        <!-- Typing Area -->
        <div 
          ref="wordsContainerRef"
          class="text-3xl leading-relaxed tracking-wide select-none outline-none relative overflow-hidden h-[180px]"
        >
          <div 
            v-if="!isTimerActive" 
            class="absolute inset-0 flex items-center justify-center bg-[#323437]/70 backdrop-blur-[1px] z-10 opacity-0 hover:opacity-100 transition-opacity rounded-xl cursor-text"
          >
            <span class="bg-[#2c2e31] px-4 py-2 rounded-lg text-sm text-[#d1d0c5] border border-[#646669]/50">
              Nhấn phím bất kỳ để bắt đầu
            </span>
          </div>

          <div class="flex flex-wrap text-[#646669]">
            <div 
              v-for="(word, wIdx) in wordsList" 
              :key="wIdx" 
              class="mr-[0.4em] mb-2 relative flex transition-colors"
            >
              <!-- Render exact standard chars -->
              <span 
                v-for="(char, cIdx) in word" 
                :key="cIdx" 
                :class="getCharClass(wIdx, cIdx)"
              >
                {{ char }}
              </span>

              <!-- Render extra typed characters -->
              <span 
                v-if="getExtraCharsString(wIdx).length > 0"
                class="text-[#ca4754] opacity-80 decoration-[#ca4754]"
              >
                {{ getExtraCharsString(wIdx) }}
              </span>

              <!-- Caret (bên dưới từ hiện tại) -->
              <div 
                v-if="wIdx === currentWordIndex" 
                class="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#e2b714] rounded-full animate-pulse opacity-75"
              ></div>
            </div>
          </div>
        </div>

        <!-- Hidden Input for Mobile/Composition -->
        <input
          ref="hiddenInputRef"
          v-model="typedInput"
          @input="handleInput"
          type="text"
          class="opacity-0 absolute top-0 left-0 w-0 h-0"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        />

      </div>

      <!-- SCREEN: RESULT -->
      <div v-else-if="currentScreen === 'result'" class="w-full max-w-3xl animate-fade-in bg-[#2c2e31] p-10 rounded-3xl shadow-2xl border border-[#e2b714]/20">
        <h2 class="text-3xl text-[#d1d0c5] font-bold mb-8 text-center uppercase tracking-widest border-b border-[#646669]/20 pb-6">Đã Hoàn Thành</h2>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 text-center">
          <div>
            <div class="text-[#646669] uppercase tracking-widest text-xs mb-2">Tốc độ WPM</div>
            <div class="text-5xl font-bold text-[#e2b714]">{{ finalWPM }}</div>
          </div>
          <div>
            <div class="text-[#646669] uppercase tracking-widest text-xs mb-2">Tốc độ CPM</div>
            <div class="text-5xl font-bold text-[#d1d0c5]">{{ finalCPM }}</div>
          </div>
          <div>
            <div class="text-[#646669] uppercase tracking-widest text-xs mb-2">Chính xác</div>
            <div class="text-5xl font-bold text-[#d1d0c5]">{{ finalAccuracy }}%</div>
          </div>
          <div>
            <div class="text-[#646669] uppercase tracking-widest text-xs mb-2">Ký tự hợp lệ</div>
            <div class="text-5xl font-bold text-[#d1d0c5]">{{ totalCorrectChars }}</div>
          </div>
        </div>

        <div class="flex gap-4 justify-center">
           <button @click="startSetup" class="px-6 py-3 bg-[#e2b714] hover:bg-[#c29c11] text-[#323437] font-bold rounded-xl transition-transform active:scale-95 flex items-center gap-2">
             Màn Hình Chờ
           </button>
           <button @click="viewHistory" class="px-6 py-3 bg-[#323437] hover:bg-[#646669] text-[#d1d0c5] font-bold rounded-xl transition-transform active:scale-95 flex items-center gap-2">
             Xem Lịch Sử
           </button>
        </div>
      </div>

      <!-- SCREEN: HISTORY -->
      <div v-else-if="currentScreen === 'history'" class="w-full max-w-4xl animate-fade-in flex flex-col gap-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl text-[#d1d0c5] font-bold">Lịch Sử: <span class="text-[#e2b714]">{{ savedProfile }}</span></h2>
          <div class="flex gap-3">
             <button @click="gotoHome" class="bg-[#323437] px-4 py-2 hover:bg-[#d1d0c5] hover:text-[#323437] rounded-lg transition-colors text-sm font-bold">Quay Về</button>
             <button v-if="historyRecords.length > 0" @click="clearUserHistory" class="bg-[#ca4754]/20 border border-[#ca4754] px-4 py-2 text-[#ca4754] hover:bg-[#ca4754] hover:text-white rounded-lg transition-colors text-sm font-bold">
               Xóa Tất Cả
             </button>
          </div>
        </div>

        <div v-if="historyRecords.length === 0" class="text-center bg-[#2c2e31] p-10 rounded-2xl border border-[#646669]/20 text-[#646669] italic">
          Chưa có dữ liệu nào được ghi nhận. Hãy chiến một trận ngay!
        </div>
        
        <div v-else class="overflow-x-auto bg-[#2c2e31] rounded-2xl border border-[#646669]/20 shadow-xl">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#323437] text-[#d1d0c5] uppercase text-xs tracking-wider border-b border-[#646669]/30">
                <th class="p-4 rounded-tl-2xl">Thời gian</th>
                <th class="p-4">Chế Độ</th>
                <th class="p-4 text-center">WPM</th>
                <th class="p-4 text-center">CPM</th>
                <th class="p-4 text-center">Chính xác</th>
                <th class="p-4 rounded-tr-2xl text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(record, idx) in historyRecords" :key="record.id" class="border-b border-[#646669]/10 hover:bg-[#323437]/50 transition-colors" :class="idx % 2 === 0 ? '' : 'bg-[#323437]/20'">
                <td class="p-4 font-mono text-sm text-[#646669]">{{ formatDate(record.date) }}</td>
                <td class="p-4 font-bold text-sm text-[#d1d0c5]">{{ record.mode }}</td>
                <td class="p-4 text-center font-bold text-lg text-[#d1d0c5]">{{ record.wpm }}</td>
                <td class="p-4 text-center text-[#d1d0c5]">{{ record.cpm }}</td>
                <td class="p-4 text-center text-[#d1d0c5]">{{ record.accuracy }}%</td>
                <td class="p-4 text-right">
                  <button @click="removeSingleHistory(record.id)" class="text-[#ca4754] hover:bg-[#ca4754]/20 p-2 rounded-md transition-colors" title="Xóa">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </main>

    <!-- Footer -->
    <footer class="mt-auto py-8 text-xs text-[#646669] flex gap-4 w-full flex-wrap max-w-5xl justify-center">
      <div class="hover:text-[#d1d0c5] transition-colors flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
        Hỗ trợ chuẩn Telex mức Ký Tự
      </div>
      <div>&bull;</div>
      <div class="hover:text-[#d1d0c5] transition-colors flex items-center gap-1">
        Made by vietprogrammer
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Custom Scrollbar for container */
.overflow-hidden {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.overflow-hidden::-webkit-scrollbar {
  display: none;
}
</style>
