<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted } from 'vue'

const sqlCode = ref(`-- DuckDB-Wasm: Analytical SQL Database
-- Hãy thử query 100,000 dòng dữ liệu trực tiếp trên trình duyệt!

SELECT 
    sum(random()) AS total_sum,
    count(*) AS row_count,
    avg(random()) AS average_val
FROM generate_series(1, 100000);
`)

const sqlResults = ref<{ columns: string[], values: any[][] }[]>([])
const sqlError = ref('')
const isSqlRunning = ref(false)
const isLoading = ref(true)
/* eslint-disable @typescript-eslint/no-explicit-any */
let db: any = null
let conn: any = null

onMounted(async () => {
  try {
    // Tải DuckDB-Wasm qua ESM
    // @ts-expect-error - CDN import
    const duckdb = await import('https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/+esm')
    
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)
    
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
    )
    const worker = new Worker(worker_url)
    const logger = new duckdb.ConsoleLogger()
    db = new duckdb.AsyncDuckDB(logger, worker)
    
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
    conn = await db.connect()
    
    URL.revokeObjectURL(worker_url)
    isLoading.value = false
  } catch (err) {
    console.error('DuckDB init failed:', err)
    sqlError.value = 'Failed to load DuckDB-Wasm. Please check your connection.'
  }
})

const runSql = async () => {
  if (!conn) return
  isSqlRunning.value = true
  sqlError.value = ''
  sqlResults.value = []

  try {
    const startTime = performance.now()
    const result = await conn.query(sqlCode.value)
    const endTime = performance.now()
    
    // Convert Apache Arrow Table to our format
    const columns = result.schema.fields.map((f: any) => f.name)
    const values = []
    for (const row of result) {
      const rowArr = []
      for (const col of columns) {
        // Handle BigInt serialization issue in JSON by converting to string
        let val = row[col]
        if (typeof val === 'bigint') val = val.toString()
        rowArr.push(val)
      }
      values.push(rowArr)
    }
    sqlResults.value = [{ columns, values }]
    
    // Optional: Add execution time info to error/log space
    sqlError.value = `Executed in ${(endTime - startTime).toFixed(2)}ms (Local OLAP)`
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
          <span class="text-[10px] font-mono uppercase text-text-secondary">OLAP Database (DuckDB-Wasm)</span>
          <button @click="runSql" :disabled="isLoading || isSqlRunning" class="wasm-btn">
            {{ isSqlRunning ? 'QUERYING...' : 'RUN ANALYTICS' }}
          </button>
        </div>
        <textarea v-model="sqlCode" spellcheck="false" class="wasm-editor"></textarea>
      </div>
      <div class="flex flex-col gap-3 overflow-hidden">
        <span class="text-[10px] font-mono uppercase text-text-secondary">Analytical Results</span>
        <div class="wasm-console flex flex-col gap-4 overflow-auto">
          <div v-if="isLoading" class="animate-pulse">Loading DuckDB-Wasm (Analytics Engine)...</div>
          <div v-else-if="sqlError && sqlResults.length === 0" class="text-red-400 font-bold underline">Error: {{ sqlError }}</div>
          <div v-else-if="sqlResults.length === 0" class="opacity-30 italic">No results yet. Try running an aggregate query.</div>
          
          <div v-if="sqlResults.length > 0 && sqlError" class="text-accent-coral text-xs italic">{{ sqlError }}</div>
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
