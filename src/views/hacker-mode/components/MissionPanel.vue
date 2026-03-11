<script setup lang="ts">
import { ref, computed } from 'vue'

interface Mission {
  id: string
  title: string
  desc: string
  requiredCmd: string // command prefix to match
  reward: number
  done: boolean
}

const props = defineProps<{ executedCmds: string[] }>()
const emit = defineEmits<{ 'mission-complete': [reward: number, title: string] }>()

const missions = ref<Mission[]>([
  {
    id: 'm1',
    title: 'Trinh sát mạng',
    desc: 'Quét mạng nội bộ để tìm mục tiêu',
    requiredCmd: 'scan',
    reward: 200,
    done: false,
  },
  {
    id: 'm2',
    title: 'Xâm nhập hệ thống',
    desc: 'Hack vào bất kỳ mục tiêu nào',
    requiredCmd: 'hack',
    reward: 500,
    done: false,
  },
  {
    id: 'm3',
    title: 'Chiếm quyền SSH',
    desc: 'Brute force vào một server',
    requiredCmd: 'bruteforce',
    reward: 400,
    done: false,
  },
  {
    id: 'm4',
    title: 'Khai thác 0-day',
    desc: 'Chạy exploit vào lỗ hổng',
    requiredCmd: 'exploit',
    reward: 600,
    done: false,
  },
  {
    id: 'm5',
    title: 'Tấn công từ chối',
    desc: 'DDoS sập một dịch vụ',
    requiredCmd: 'ddos',
    reward: 350,
    done: false,
  },
  {
    id: 'm6',
    title: 'Giải mã hash',
    desc: 'Crack một hàm băm mật khẩu',
    requiredCmd: 'crack',
    reward: 300,
    done: false,
  },
  {
    id: 'm7',
    title: 'Vẽ bản đồ mạng',
    desc: 'Trace route tới máy chủ',
    requiredCmd: 'traceroute',
    reward: 100,
    done: false,
  },
  {
    id: 'm8',
    title: 'Khám phá hệ thống',
    desc: 'Đọc file nhạy cảm trên server',
    requiredCmd: 'cat',
    reward: 150,
    done: false,
  },
])

// Watch for newly executed commands and mark missions done
import { watch } from 'vue'
watch(
  () => props.executedCmds,
  (cmds) => {
    const latest = cmds[cmds.length - 1]
    if (!latest) return
    missions.value.forEach((m) => {
      if (!m.done && latest.toLowerCase().startsWith(m.requiredCmd)) {
        m.done = true
        emit('mission-complete', m.reward, m.title)
      }
    })
  },
  { deep: true },
)

const doneCount = computed(() => missions.value.filter((m) => m.done).length)
const totalCount = computed(() => missions.value.length)
const progressPct = computed(() => Math.round((doneCount.value / totalCount.value) * 100))

const activeMission = computed(() => missions.value.find((m) => !m.done))
</script>

<template>
  <div class="mp-wrap">
    <div class="mp-header">// MISSIONS</div>

    <!-- Progress bar -->
    <div class="mp-progress-wrap">
      <div class="mp-progress-bar" :style="{ width: `${progressPct}%` }" />
      <span class="mp-progress-txt">{{ doneCount }}/{{ totalCount }}</span>
    </div>

    <!-- Active mission highlight -->
    <div v-if="activeMission" class="mp-active">
      <div class="mp-active-label">NHIỆM VỤ HIỆN TẠI</div>
      <div class="mp-active-title">{{ activeMission.title }}</div>
      <div class="mp-active-desc">{{ activeMission.desc }}</div>
      <div class="mp-active-cmd">→ {{ activeMission.requiredCmd }}</div>
    </div>
    <div v-else class="mp-complete-all">⬡ TẤT CẢ NHIỆM VỤ HOÀN THÀNH</div>

    <!-- Mission list -->
    <div class="mp-list">
      <div
        v-for="m in missions"
        :key="m.id"
        class="mp-item"
        :class="{ done: m.done, active: activeMission?.id === m.id }"
      >
        <span class="mp-check">{{ m.done ? '✓' : '○' }}</span>
        <span class="mp-item-title">{{ m.title }}</span>
        <span class="mp-item-pts">+{{ m.reward }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mp-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow: hidden;
}
.mp-header {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: rgba(0, 255, 65, 0.5);
  letter-spacing: 2px;
}
.mp-progress-wrap {
  position: relative;
  height: 4px;
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.15);
}
.mp-progress-bar {
  height: 100%;
  background: #00ff41;
  box-shadow: 0 0 8px #00ff41;
  transition: width 0.8s ease;
}
.mp-progress-txt {
  position: absolute;
  right: 4px;
  top: -15px;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: rgba(0, 255, 65, 0.5);
}
.mp-active {
  background: rgba(0, 255, 65, 0.05);
  border: 1px solid rgba(0, 255, 65, 0.2);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.mp-active-label {
  font-family: 'Courier New', monospace;
  font-size: 8px;
  color: rgba(0, 255, 65, 0.4);
  letter-spacing: 2px;
}
.mp-active-title {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #00ff41;
  font-weight: bold;
}
.mp-active-desc {
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: rgba(0, 255, 65, 0.55);
}
.mp-active-cmd {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #00d4ff;
  margin-top: 2px;
  animation: cmd-blink 1.2s step-end infinite;
}
@keyframes cmd-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.mp-complete-all {
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: #ffb830;
  text-align: center;
  letter-spacing: 1px;
  padding: 8px;
  border: 1px solid rgba(255, 184, 48, 0.3);
  animation: cmd-blink 2s ease infinite;
}
.mp-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
  scrollbar-width: none;
  flex: 1;
}
.mp-list::-webkit-scrollbar {
  display: none;
}
.mp-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  padding: 3px 5px;
  transition: all 0.3s;
  opacity: 0.5;
}
.mp-item.active {
  opacity: 1;
  background: rgba(0, 255, 65, 0.04);
}
.mp-item.done {
  opacity: 0.35;
}
.mp-check {
  flex-shrink: 0;
  color: rgba(0, 255, 65, 0.4);
  width: 12px;
}
.mp-item.done .mp-check {
  color: #00ff41;
}
.mp-item-title {
  flex: 1;
  color: rgba(0, 255, 65, 0.7);
}
.mp-item.done .mp-item-title {
  text-decoration: line-through;
  color: rgba(0, 255, 65, 0.3);
}
.mp-item.active .mp-item-title {
  color: #00ff41;
}
.mp-item-pts {
  color: rgba(0, 212, 255, 0.5);
  font-size: 9px;
}
.mp-item.done .mp-item-pts {
  color: rgba(0, 255, 65, 0.3);
}
</style>
