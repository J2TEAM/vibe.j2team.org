<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
import { RouterLink } from 'vue-router'

// Lazy load components
const LuaTool = defineAsyncComponent(() => import('./components/LuaTool.vue'))
const SqliteTool = defineAsyncComponent(() => import('./components/SqliteTool.vue'))
const PythonTool = defineAsyncComponent(() => import('./components/PythonTool.vue'))
const OcrTool = defineAsyncComponent(() => import('./components/OcrTool.vue'))
const ImageFilterTool = defineAsyncComponent(() => import('./components/ImageFilterTool.vue'))
const ObjectDetectionTool = defineAsyncComponent(() => import('./components/ObjectDetectionTool.vue'))
const DuckDbTool = defineAsyncComponent(() => import('./components/DuckDbTool.vue'))
const FaceMeshTool = defineAsyncComponent(() => import('./components/FaceMeshTool.vue'))
const TransformersTool = defineAsyncComponent(() => import('./components/TransformersTool.vue'))

const activeTool = ref('lua')

const tools = [
  { id: 'lua', label: 'LUA', component: LuaTool, version: 'FENGARI', cdn: 'unpkg.com/fengari-web', description: 'Trình chạy mã nguồn Lua 5.3 trực tiếp trong trình duyệt.' },
  { id: 'sqlite', label: 'SQLITE', component: SqliteTool, version: 'SQL.JS', cdn: 'cdnjs.cloudflare.com/ajax/libs/sql.js', description: 'Cơ sở dữ liệu quan hệ (Transactional DB) chạy hoàn toàn trong bộ nhớ.' },
  { id: 'duckdb', label: 'DUCKDB', component: DuckDbTool, version: 'DUCKDB-WASM', cdn: 'cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm', description: 'Cơ sở dữ liệu phân tích (OLAP) tốc độ cực cao cho Big Data.' },
  { id: 'python', label: 'PYTHON', component: PythonTool, version: 'PYODIDE', cdn: 'cdn.jsdelivr.net/pyodide', description: 'Môi trường Python 3 đầy đủ với thư viện chuẩn (Standard Library).' },
  { id: 'ocr', label: 'OCR', component: OcrTool, version: 'TESSERACT', cdn: 'unpkg.com/tesseract.js', description: 'Nhận diện và trích xuất văn bản từ hình ảnh 100% offline.' },
  { id: 'photon', label: 'ẢNH', component: ImageFilterTool, version: 'PHOTON/RUST', cdn: 'cdn.jsdelivr.net/npm/@silvia-odwyer/photon', description: 'Xử lý ảnh bằng Rust: Áp dụng các bộ lọc màu ở tốc độ native.' },
  { id: 'ai-vision', label: 'THỊ GIÁC', component: ObjectDetectionTool, version: 'TF.JS WASM', cdn: 'cdn.jsdelivr.net/npm/@tensorflow/tfjs', description: 'AI nhận diện vật thể qua Webcam sử dụng TensorFlow.js.' },
  { id: 'face-mesh', label: 'KHUÔN MẶT', component: FaceMeshTool, version: 'MEDIAPIPE', cdn: 'cdn.jsdelivr.net/npm/@mediapipe/tasks-vision', description: 'Theo dõi 478 điểm trên khuôn mặt realtime bằng WebGPU/WASM.' },
  { id: 'ai-nlp', label: 'NGÔN NGỮ', component: TransformersTool, version: 'TRANSFORMERS.JS', cdn: 'cdn.jsdelivr.net/npm/@huggingface/transformers', description: 'Xử lý ngôn ngữ tự nhiên: Phân tích cảm xúc bằng mô hình DistilBERT.' },
] as const
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col p-4 sm:p-8">
    <div class="max-w-6xl w-full mx-auto flex flex-col gap-6">
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-3xl font-display font-bold text-accent-coral animate-fade-in">
            Mọi thứ với WASM 🚀
          </h1>
          <p class="text-text-secondary mt-1 italic opacity-80 text-sm">Sức mạnh Native bên trong Browser.</p>
        </div>
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 border border-border-default bg-bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary group"
        >
          <span class="group-hover:-translate-x-1 transition-transform">&larr;</span> Về trang chủ
        </RouterLink>
      </header>

      <!-- Tool Switcher -->
      <nav class="flex flex-wrap gap-1 border-b border-border-default/30 pb-px">
        <button 
          v-for="tool in tools"
          :key="tool.id"
          @click="activeTool = tool.id"
          :class="[
            'px-4 py-2 text-xs font-mono tracking-tighter sm:tracking-wider transition-all border-b-2 uppercase',
            activeTool === tool.id ? 'border-accent-coral text-accent-coral bg-accent-coral/5' : 'border-transparent text-text-secondary hover:text-text-primary'
          ]"
        >
          {{ tool.label }}
        </button>
      </nav>

      <div class="px-2 py-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <p class="text-sm text-accent-coral/80 font-mono italic animate-fade-in" :key="activeTool + 'desc'">
          &rsaquo; {{ tools.find(t => t.id === activeTool)?.description }}
        </p>
        <p class="text-[10px] text-text-secondary/50 font-mono animate-fade-in whitespace-nowrap" :key="activeTool + 'cdn'">
          [NGUỒN: {{ tools.find(t => t.id === activeTool)?.cdn }}]
        </p>
      </div>

      <main class="flex-1 min-h-[600px] bg-bg-surface/50 border border-border-default/20 p-4 sm:p-6 rounded-lg backdrop-blur-sm relative">
        <KeepAlive>
          <component :is="tools.find(t => t.id === activeTool)?.component" />
        </KeepAlive>
      </main>

      <footer class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] text-text-secondary/30 font-mono py-4">
        <span v-for="tool in tools" :key="tool.id">{{ tool.version }} WASM</span>
      </footer>

      <!-- About WASM Section -->
      <section class="mt-12 border-t border-white/5 pt-12 text-sm leading-relaxed max-w-2xl mx-auto">
        <div class="flex flex-col gap-4 text-text-secondary">
          <h2 class="text-xl font-display font-bold text-white uppercase tracking-wider">Tại sao chọn WebAssembly (WASM)?</h2>
          <p>
            <strong class="text-accent-coral">WebAssembly</strong> là định dạng chỉ thị nhị phân giúp trình duyệt chạy các tác vụ nặng với tốc độ gần như ứng dụng native. Nó cho phép mang sức mạnh của các ngôn ngữ như Rust, C++, hay Python lên web.
          </p>
          <div class="flex flex-col gap-2">
            <h3 class="text-white font-bold underline decoration-accent-coral/30">WASM tốt nhất cho việc gì?</h3>
            <ul class="list-disc list-inside flex flex-col gap-1 opacity-80">
              <li>Xử lý tác vụ nặng (Chỉnh sửa video, Game, Mã hóa)</li>
              <li>Chạy các thư viện native không phải JavaScript</li>
              <li>Ứng dụng "Offline-first" (Xử lý dữ liệu không cần server)</li>
              <li>Trí tuệ nhân tạo (AI) chạy trực tiếp trên máy người dùng</li>
            </ul>
          </div>
          <div class="flex flex-col gap-2">
            <h3 class="text-white font-bold underline decoration-accent-coral/30">Xu hướng năm 2026</h3>
            <p class="opacity-80">
              Làn sóng "Edge AI" đang chuyển dịch các mô hình AI lớn (LLM) từ server về thẳng trình duyệt nhờ sự kết hợp giữa WASM và WebGPU.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98) translateY(5px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.image-pixelated {
  image-rendering: pixelated;
}
</style>
