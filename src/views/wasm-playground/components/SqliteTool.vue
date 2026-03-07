<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted } from 'vue'

const sqlCode = ref(`-- Tạo bảng mẫu
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);

-- Chèn dữ liệu
INSERT INTO users (name, role) VALUES ('Admin', 'Quản trị viên');
INSERT INTO users (name, role) VALUES ('Viber', 'Thành viên');
INSERT INTO users (name, role) VALUES ('Coder', 'Người yêu WASM');

-- Truy vấn dữ liệu
SELECT * FROM users;`)
const sqlResults = ref<{ columns: string[], values: any[][] }[]>([])
const sqlError = ref('')
const isSqlRunning = ref(false)
const isLoading = ref(true)
let db: any = null

onMounted(() => {
  const sqlScript = document.createElement('script')
  sqlScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.min.js'
  sqlScript.async = true
  sqlScript.onload = async () => {
    const initSqlJs = (window as any).initSqlJs
    const config = {
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    }
    try {
      const SQL = await initSqlJs(config)
      db = new SQL.Database()
      isLoading.value = false
    } catch (err) {
      console.error('SQL.js initialization failed:', err)
    }
  }
  document.head.appendChild(sqlScript)
})

const runSql = () => {
  if (!db) return
  isSqlRunning.value = true
  sqlError.value = ''
  sqlResults.value = []

  try {
    const results = db.exec(sqlCode.value)
    sqlResults.value = results
  } catch (err: any) {
    sqlError.value = err.message
  } finally {
    isSqlRunning.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 animate-fade-in">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
      <div class="flex flex-col gap-3">
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-mono uppercase text-text-secondary">Trình soạn thảo SQL (Trong bộ nhớ)</span>
          <button @click="runSql" :disabled="isLoading || isSqlRunning" class="wasm-btn">
            {{ isSqlRunning ? 'ĐANG TRUY VẤN...' : 'CHẠY SQL' }}
          </button>
        </div>
        <textarea v-model="sqlCode" spellcheck="false" class="wasm-editor"></textarea>
      </div>
      <div class="flex flex-col gap-3 overflow-hidden">
        <span class="text-[10px] font-mono uppercase text-text-secondary">Kết quả truy vấn</span>
        <div class="wasm-console flex flex-col gap-4 overflow-auto">
          <div v-if="isLoading" class="animate-pulse">Đang tải SQLite WASM...</div>
          <div v-else-if="sqlError" class="text-red-400 font-bold underline">Lỗi: {{ sqlError }}</div>
          <div v-else-if="sqlResults.length === 0" class="opacity-30 italic">Không có kết quả. Hãy thử chạy một truy vấn SELECT.</div>
          <div v-for="(res, idx) in sqlResults" :key="idx" class="border border-white/5 rounded">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-white/5 text-accent-coral uppercase font-bold">
                <tr>
                  <th v-for="col in res.columns" :key="col" class="p-2 border border-white/10">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, ridx) in res.values" :key="ridx" class="hover:bg-white/5">
                  <td v-for="(val, vidx) in row" :key="vidx" class="p-2 border border-white/10 text-text-secondary">{{ val }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles.css";
</style>
