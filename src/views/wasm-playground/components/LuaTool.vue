<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted } from 'vue'

const code = ref(`-- Chào mừng bạn đến với Lua Playground!
-- Bạn có thể viết code Lua ở đây và chạy nó.

print("Chào J2TEAM Community!")

function say_hello(name)
  return "Chào " .. name .. " từ Lua!"
end

print(say_hello("anh em"))

for i = 1, 5 do
  print("Đếm: " .. i)
end
`)

const output = ref('')
const isLoading = ref(true)
const isRunning = ref(false)

// We'll load fengari via a CDN to keep the repo small and avoid extra dependencies 
// unless we really want to install it via pnpm.
onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://unpkg.com/fengari-web@0.1.4/dist/fengari-web.js'
  script.async = true
  script.onload = () => {
    isLoading.value = false
  }
  document.head.appendChild(script)
})

const runCode = () => {
  const fengari = (window as any).fengari
  if (typeof fengari === 'undefined') return
  
  isRunning.value = true
  output.value = ''
  
  const L = fengari.lauxlib.luaL_newstate()
  fengari.lualib.luaL_openlibs(L)
  
  // Override print in Lua
  fengari.lua.lua_pushjsfunction(L, (state: any) => {
    const n = fengari.lua.lua_gettop(state)
    let line = ''
    for (let i = 1; i <= n; i++) {
      line += fengari.lua.lua_tojsstring(state, i) + (i === n ? '' : '\t')
    }
    output.value += line + '\n'
    return 0
  })
  fengari.lua.lua_setglobal(L, 'print')

  try {
    const result = fengari.lauxlib.luaL_dostring(L, fengari.to_luastring(code.value))
    if (result !== 0) {
      const error = fengari.lua.lua_tojsstring(L, -1)
      output.value += `Error: ${error}\n`
    }
  } catch (err: any) {
    output.value += `Runtime Error: ${err.message}\n`
  } finally {
    isRunning.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 animate-fade-in">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
      <!-- Editor Section -->
      <div class="flex flex-col gap-3">
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-mono uppercase text-text-secondary">Lua Editor</span>
          <button 
            @click="runCode" 
            :disabled="isLoading || isRunning"
            class="wasm-btn"
          >
            {{ isRunning ? 'EXECUTING...' : 'RUN LUA' }}
          </button>
        </div>
        <textarea
          v-model="code"
          spellcheck="false"
          class="wasm-editor"
          placeholder="Viết code Lua ở đây..."
        ></textarea>
      </div>

      <!-- Output Section -->
      <div class="flex flex-col gap-3">
        <span class="text-[10px] font-mono uppercase text-text-secondary">Lua Output</span>
        <div 
          class="wasm-console"
        >
          <div v-if="isLoading" class="animate-pulse">
            Loading Lua VM (WASM)...
          </div>
          <div v-else-if="!output" class="opacity-30 italic text-center">
            Nhấn "RUN" để thực thi code.
          </div>
          <div v-else>
            {{ output }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../styles.css";
</style>
