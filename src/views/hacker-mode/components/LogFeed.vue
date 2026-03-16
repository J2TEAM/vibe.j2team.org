<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useIntervalFn } from '@vueuse/core'

const LOG_ENTRIES = [
  'Kết nối proxy lớp 3 thành công',
  'Bypass IDS signature #4421',
  'Mã hóa payload hoàn tất',
  'Quét subnet 192.168.0.0/24',
  'Kết nối reverse shell port 4444',
  'Giải mã RSA-2048...',
  'Tải xuống dữ liệu: 1.2 GB',
  'Xóa log hệ thống',
  'VPN tunnel ổn định',
  'Phát hiện honeypot — bỏ qua',
  'Kênh C2 hoạt động bình thường',
  'Lỗ hổng zero-day khai thác thành công',
  'Thiết lập kết nối ngược',
  'Đang tải lên rootkit...',
  'Mã hóa giao tiếp xong',
]

interface LogEntry {
  text: string
  ts: string
}

const logs = ref<LogEntry[]>([])

function addLog() {
  const entry = LOG_ENTRIES[Math.floor(Math.random() * LOG_ENTRIES.length)]
  const ts = new Date().toLocaleTimeString('vi-VN', { hour12: false })
  logs.value.push({ text: entry ?? '', ts })
  if (logs.value.length > 12) {
    logs.value.shift()
  }
}

onMounted(() => {
  for (let i = 0; i < 5; i++) addLog()
})

useIntervalFn(addLog, 1800)
</script>

<template>
  <div class="log-list">
    <div v-for="(log, i) in logs" :key="i" class="log-entry">
      <span class="log-ts">{{ log.ts }}</span>
      <span class="log-msg">{{ log.text }}</span>
    </div>
  </div>
</template>

<style scoped>
.log-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
  scrollbar-width: none;
}
.log-list::-webkit-scrollbar {
  display: none;
}
.log-entry {
  display: flex;
  gap: 8px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  line-height: 1.4;
  animation: logFadeIn 0.3s ease;
}
@keyframes logFadeIn {
  from {
    opacity: 0;
    transform: translateX(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.log-ts {
  color: #00ff4150;
  flex-shrink: 0;
}
.log-msg {
  color: #00ff4199;
}
</style>
