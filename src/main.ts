import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import VueKonva from 'vue-konva'

import App from './App.vue'
import './assets/main.css'
import router from './router'

const app = createApp(App)

app.config.errorHandler = (err, _instance, info) => {
  console.error(`[Vue Error] ${info}:`, err)
}

app.use(createPinia())
app.use(createHead())
app.use(VueKonva)
app.use(router)

app.mount('#app')
