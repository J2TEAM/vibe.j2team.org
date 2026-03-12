import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { generatePagesJson } from './scripts/generate-pages-json.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    {
      name: 'pages-json-generator',
      async buildStart() {
        await generatePagesJson()
      },
      configureServer(server) {
        server.watcher.on('all', async (_event, file) => {
          if (file.includes('/views/') && file.endsWith('/meta.ts')) {
            await generatePagesJson()
            server.ws.send({ type: 'full-reload' })
          }
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'vueuse-vendor': ['@vueuse/core'],
          'iconify-vendor': ['@iconify/vue'],
          'unhead-vendor': ['@unhead/vue'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
