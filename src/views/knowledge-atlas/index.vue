<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '@vueuse/core'

const tasks = useLocalStorage('learn-tasks', [
  { id: 1, text: 'Học Vue 3 Composition API', type: 'important-urgent' },
  { id: 2, text: 'Luyện thuật toán Logic', type: 'important-not-urgent' },
])
const studyHistory = useLocalStorage<number[]>('study-history', [])
const newTask = ref('')
const activeMatrix = ref('important-urgent')

const addTask = () => {
  if (!newTask.value) return
  tasks.value.push({ id: Date.now(), text: newTask.value, type: activeMatrix.value })
  newTask.value = ''
}
const removeTask = (id: number) => {
  tasks.value = tasks.value.filter((t) => t.id !== id)
}

const decNumber = ref(255)
const binResult = computed(() => decNumber.value.toString(2).padStart(8, '0'))
const hexResult = computed(() => decNumber.value.toString(16).toUpperCase())

const logicA = ref(true)
const logicB = ref(false)

const operators = ['+', '-', '×', '÷']
const mathProblem = ref({ a: 12, b: 5, op: '+', answer: 17 })
const userMathAnswer = ref<number | null>(null)
const mathScore = ref(0)
const mathFeedback = ref('')

const generateProblem = () => {
  const randomIndex = Math.floor(Math.random() * operators.length)
  const op = operators[randomIndex] || '+'
  let a = Math.floor(Math.random() * 50) + 1
  let b = Math.floor(Math.random() * 50) + 1

  if (op === '÷') {
    a = a * b
  }
  if (op === '-') {
    if (a < b) [a, b] = [b, a]
  }

  let ans = 0
  if (op === '+') ans = a + b
  else if (op === '-') ans = a - b
  else if (op === '×') ans = a * b
  else ans = a / b

  mathProblem.value = { a, b, op, answer: ans }
  userMathAnswer.value = null
  mathFeedback.value = ''
}

const checkMath = () => {
  if (userMathAnswer.value === mathProblem.value.answer) {
    mathScore.value++
    mathFeedback.value = 'Chính xác! ✨'
    setTimeout(generateProblem, 800)
  } else {
    mathFeedback.value = 'Thử lại xem... 🤔'
  }
}

const isStudying = ref(false)
const studyTime = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const toggleStudy = () => {
  isStudying.value = !isStudying.value
  if (isStudying.value) {
    timerInterval = setInterval(() => studyTime.value++, 1000)
  } else {
    if (timerInterval) clearInterval(timerInterval)
    if (studyTime.value > 0) {
      studyHistory.value.push(studyTime.value)
      if (studyHistory.value.length > 5) studyHistory.value.shift()
    }
  }
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec < 10 ? '0' : ''}${sec}`
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] text-slate-800 font-body pb-20">
    <div class="max-w-6xl mx-auto px-4 py-12">
      <header class="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 class="text-4xl font-black tracking-tight text-slate-900 mb-2">Knowledge Atlas</h1>
          <p class="text-slate-500 italic">Học tập có hệ thống, tư duy theo cấu trúc.</p>
        </div>
        <div
          class="flex items-center gap-4 bg-white p-2 rounded-3xl shadow-sm border border-slate-200"
        >
          <div class="px-6 py-2">
            <p class="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Deep Work</p>
            <p class="text-2xl font-mono font-bold text-indigo-600">{{ formatTime(studyTime) }}</p>
          </div>
          <button
            @click="toggleStudy"
            :class="isStudying ? 'bg-rose-500' : 'bg-indigo-600'"
            class="p-5 rounded-2xl text-white transition-all active:scale-95 shadow-lg"
          >
            <Icon :icon="isStudying ? 'lucide:pause' : 'lucide:play'" class="size-6" />
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
            <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
              <Icon icon="lucide:layout-grid" class="text-indigo-600" /> Quản lý Ưu tiên
            </h2>
            <div class="grid grid-cols-2 gap-3 mb-6">
              <button
                v-for="type in [
                  'important-urgent',
                  'important-not-urgent',
                  'not-important-urgent',
                  'not-important-not-urgent',
                ]"
                :key="type"
                @click="activeMatrix = type"
                :class="
                  activeMatrix === type
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                "
                class="p-4 rounded-2xl transition-all text-[10px] font-bold uppercase tracking-tighter text-center"
              >
                {{ type.split('-').join(' ') }}
              </button>
            </div>
            <div class="flex gap-2 mb-8">
              <input
                v-model="newTask"
                @keyup.enter="addTask"
                placeholder="Viết mục tiêu học tập..."
                class="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                @click="addTask"
                class="bg-slate-900 text-white px-6 rounded-2xl hover:bg-indigo-600 transition-all"
              >
                <Icon icon="lucide:plus" class="size-6" />
              </button>
            </div>
            <div class="space-y-3 max-h-60 overflow-y-auto pr-2">
              <div
                v-for="task in tasks.filter((t) => t.type === activeMatrix)"
                :key="task.id"
                class="group flex justify-between items-center p-4 bg-slate-50 border border-transparent rounded-2xl hover:border-indigo-200 hover:bg-white transition-all"
              >
                <span class="text-slate-700">{{ task.text }}</span>
                <button
                  @click="removeTask(task.id)"
                  class="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Icon icon="lucide:trash-2" />
                </button>
              </div>
            </div>
          </div>

          <div
            class="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm overflow-hidden relative"
          >
            <div
              class="absolute top-0 right-0 p-4 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-bl-2xl"
            >
              Score: {{ mathScore }}
            </div>
            <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-600">
              <Icon icon="lucide:brain-circuit" /> Luyện Toán Tư Duy
            </h2>
            <div class="flex flex-col items-center py-6">
              <div class="text-4xl font-black font-mono mb-8 tracking-widest text-slate-700">
                {{ mathProblem.a }} {{ mathProblem.op }} {{ mathProblem.b }} = ?
              </div>
              <div class="flex gap-4 w-full max-w-xs">
                <input
                  v-model.number="userMathAnswer"
                  @keyup.enter="checkMath"
                  type="number"
                  class="flex-1 bg-slate-100 border-2 border-transparent focus:border-emerald-500 p-4 rounded-2xl text-center text-2xl font-bold outline-none"
                  placeholder="..."
                />
                <button
                  @click="checkMath"
                  class="bg-emerald-500 text-white px-8 rounded-2xl font-bold hover:bg-emerald-600 transition-all"
                >
                  OK
                </button>
              </div>
              <p
                class="mt-4 text-sm font-bold min-h-[20px]"
                :class="mathFeedback.includes('Chính') ? 'text-emerald-500' : 'text-rose-500'"
              >
                {{ mathFeedback }}
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-8">
          <div class="bg-slate-900 text-white rounded-[2rem] p-8 shadow-2xl">
            <h2 class="text-lg font-bold mb-8 flex items-center gap-2 text-indigo-400">
              <Icon icon="lucide:binary" /> Lập Trình & Logic
            </h2>
            <div class="space-y-4 mb-10">
              <p class="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                Cơ số (0-255)
              </p>
              <input
                v-model.number="decNumber"
                type="number"
                class="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-indigo-400 text-2xl font-mono"
              />
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span class="text-[9px] block text-indigo-400 font-bold">BIN</span>
                  <span class="font-mono text-xs">{{ binResult }}</span>
                </div>
                <div class="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span class="text-[9px] block text-indigo-400 font-bold">HEX</span>
                  <span class="font-mono text-xs">0x{{ hexResult }}</span>
                </div>
              </div>
            </div>
            <div class="space-y-4 pt-6 border-t border-white/10">
              <p class="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                Bảng chân trị (Logic Gate)
              </p>
              <div class="flex items-center justify-between">
                <button
                  @click="logicA = !logicA"
                  class="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  :class="logicA ? 'bg-indigo-500' : 'bg-slate-700'"
                >
                  A: {{ logicA }}
                </button>
                <button
                  @click="logicB = !logicB"
                  class="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  :class="logicB ? 'bg-indigo-500' : 'bg-slate-700'"
                >
                  B: {{ logicB }}
                </button>
              </div>
              <div class="grid grid-cols-2 gap-2 mt-4 text-center">
                <div class="p-3 rounded-xl bg-white/5 text-[10px]">
                  <span class="block text-slate-500 mb-1 italic">A AND B</span>
                  <span
                    class="font-bold"
                    :class="logicA && logicB ? 'text-emerald-400' : 'text-rose-400'"
                    >{{ logicA && logicB }}</span
                  >
                </div>
                <div class="p-3 rounded-xl bg-white/5 text-[10px]">
                  <span class="block text-slate-500 mb-1 italic">A OR B</span>
                  <span
                    class="font-bold"
                    :class="logicA || logicB ? 'text-emerald-400' : 'text-rose-400'"
                    >{{ logicA || logicB }}</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div
            class="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-8 relative overflow-hidden group"
          >
            <Icon
              icon="lucide:history"
              class="absolute -top-2 -right-2 size-20 text-indigo-200/50"
            />
            <h3 class="font-bold text-indigo-900 mb-4 flex items-center gap-2">
              Lịch sử tập trung
            </h3>
            <div class="space-y-2 relative z-10">
              <div
                v-for="(time, idx) in studyHistory"
                :key="idx"
                class="text-xs text-indigo-700 flex justify-between"
              >
                <span>Phiên học #{{ idx + 1 }}</span>
                <span class="font-mono">{{ formatTime(time) }}</span>
              </div>
              <p v-if="studyHistory.length === 0" class="text-xs text-indigo-400 italic">
                Chưa có dữ liệu phiên học.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer class="mt-20 flex justify-center">
        <RouterLink
          to="/"
          class="group flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all font-bold text-xs tracking-[0.2em] uppercase"
        >
          <Icon icon="lucide:arrow-left" class="group-hover:-translate-x-1 transition-transform" />
          Về sảnh chính
        </RouterLink>
      </footer>
    </div>
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>
