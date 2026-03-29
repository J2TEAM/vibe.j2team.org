<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useFocusBoard } from '../composables/useFocusBoard'

const {
  timerMinutes,
  timerActive,
  timerDone,
  completedSessions,
  totalFocusedMinutes,
  tasks,
  newTaskTitle,
  doneTasksCount,
  focusScore,
  timerDisplay,
  timerProgress,
  setDuration,
  startTimer,
  stopTimer,
  restartTimer,
  addTask,
  toggleTask,
  removeTask,
} = useFocusBoard()

function onTaskInput(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  addTask()
}
</script>

<template>
  <section class="card">
    <div class="card-header">
      <div class="section-title">// Focus Studio</div>
      <div class="score-pill">
        <span>Focus</span>
        <strong>{{ focusScore }}</strong>
      </div>
    </div>

    <div class="timer-block">
      <div class="timer-presets">
        <button
          v-for="minutes in [10, 25, 45, 60]"
          :key="minutes"
          class="preset-btn"
          :class="{ selected: timerMinutes === minutes }"
          @click="setDuration(minutes)"
        >{{ minutes }}'</button>
      </div>

      <div class="timer-display" :class="{ done: timerDone }">
        {{ timerDone ? 'Hoàn thành' : timerDisplay }}
      </div>

      <div class="timer-progress-track">
        <div class="timer-progress-fill" :style="{ width: `${timerProgress}%` }" />
      </div>

      <div class="timer-actions">
        <button v-if="!timerActive && !timerDone" class="start-btn" @click="startTimer">
          <Icon icon="lucide:play" class="size-4" />
          <span>Bắt đầu</span>
        </button>

        <button v-else-if="timerDone" class="start-btn" @click="restartTimer">
          <Icon icon="lucide:rotate-cw" class="size-4" />
          <span>Vòng mới</span>
        </button>

        <button v-else class="stop-btn" @click="stopTimer">
          <Icon icon="lucide:square" class="size-4" />
          <span>Dừng</span>
        </button>
      </div>

      <div class="stats-row">
        <span>Phiên: {{ completedSessions }}</span>
        <span>Tổng: {{ totalFocusedMinutes }} phút</span>
      </div>
    </div>

    <div class="task-block">
      <div class="task-header">
        <span>Checklist phiên này</span>
        <span>{{ doneTasksCount }}/{{ tasks.length }}</span>
      </div>

      <div class="task-input-row">
        <input
          v-model="newTaskTitle"
          class="task-input"
          placeholder="Thêm việc cần làm..."
          @keydown="onTaskInput"
        >
        <button class="add-btn" @click="addTask">
          <Icon icon="lucide:plus" class="size-4" />
        </button>
      </div>

      <ul class="task-list">
        <li v-for="task in tasks" :key="task.id" class="task-item">
          <button class="check-btn" :class="{ done: task.done }" @click="toggleTask(task.id)">
            <Icon :icon="task.done ? 'lucide:check' : 'lucide:circle'" class="size-4" />
          </button>
          <span class="task-title" :class="{ done: task.done }">{{ task.title }}</span>
          <button class="remove-btn" @click="removeTask(task.id)">
            <Icon icon="lucide:x" class="size-4" />
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: linear-gradient(150deg, rgba(12, 23, 38, 0.82), rgba(8, 14, 25, 0.62));
  border: 1px solid rgba(70, 112, 145, 0.45);
  padding: clamp(0.72rem, 1.6vh, 0.95rem);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.section-title {
  font-family: var(--font-display);
  font-size: 0.76rem;
  color: var(--color-accent-sky);
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.score-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.45rem;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  font-family: var(--font-body);
  font-size: 0.72rem;
  color: var(--color-text-secondary);
}

.score-pill strong {
  color: var(--color-text-primary);
}

.timer-block {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.timer-presets {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 0.25rem 0.52rem;
  border: 1px solid rgba(70, 112, 145, 0.45);
  background: transparent;
  color: var(--color-text-dim);
  font-family: 'Courier New', monospace;
  font-size: 0.74rem;
  cursor: pointer;
}

.preset-btn.selected {
  color: var(--color-accent-sky);
  border-color: var(--color-accent-sky);
  background: rgba(56, 189, 248, 0.12);
}

.timer-display {
  font-family: 'Courier New', monospace;
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  color: #c8dff5;
  text-align: center;
}

.timer-display.done {
  color: var(--color-accent-amber);
}

.timer-progress-track {
  height: 2px;
  background: rgba(70, 112, 145, 0.4);
}

.timer-progress-fill {
  height: 100%;
  background: var(--color-accent-sky);
  transition: width 1s linear;
}

.timer-actions {
  display: flex;
}

.start-btn,
.stop-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.8rem;
  font-family: var(--font-body);
  font-size: 0.78rem;
  cursor: pointer;
}

.start-btn {
  border: none;
  background: var(--color-accent-sky);
  color: var(--color-bg-deep);
  font-weight: 600;
}

.stop-btn {
  background: transparent;
  border: 1px solid rgba(70, 112, 145, 0.5);
  color: var(--color-text-dim);
}

.stats-row {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
  font-family: var(--font-body);
  font-size: 0.73rem;
  color: var(--color-text-dim);
}

.task-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-body);
  font-size: 0.74rem;
  color: var(--color-text-secondary);
}

.task-input-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.4rem;
}

.task-input {
  border: 1px solid rgba(70, 112, 145, 0.5);
  background: rgba(9, 15, 25, 0.65);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: 0.76rem;
  padding: 0.42rem 0.55rem;
}

.task-input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.7);
}

.add-btn,
.check-btn,
.remove-btn {
  border: 1px solid rgba(70, 112, 145, 0.45);
  background: rgba(9, 15, 25, 0.65);
  color: var(--color-text-dim);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.add-btn {
  width: 32px;
}

.task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 160px;
  overflow: auto;
}

.task-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.45rem;
}

.check-btn,
.remove-btn {
  width: 26px;
  height: 26px;
}

.check-btn.done {
  color: var(--color-accent-sky);
}

.task-title {
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.task-title.done {
  color: var(--color-text-dim);
  text-decoration: line-through;
}
</style>
