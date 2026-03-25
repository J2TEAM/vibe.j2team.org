<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

interface GoldPrice {
  city: string
  type: string
  buy: string
  sell: string
}

const prices = ref<GoldPrice[]>([])
const isLoading = ref(true)
const updateTime = ref('')
const errorMsg = ref('')

const API_SOURCE = '/api/gold'

async function fetchPrices() {
  isLoading.value = true
  errorMsg.value = ''
  try {
    let xml = ''

    // Fetch from internal serverless function to bypass CORS
    try {
      const res = await fetch(API_SOURCE)
      if (res.ok) xml = await res.text()
    } catch {
      console.warn('API /api/gold failed')
    }

    if (!xml) {
      const h = window.location.hostname
      // Provide mock data if running locally and API fails
      if (h === 'localhost' || h === '127.0.0.1' || h.includes('vibe.j2team.org')) {
        prices.value = [
          { city: 'Hồ Chí Minh', type: 'Vàng SJC 1L - 10L - 1 KG', buy: '81.000', sell: '83.500' },
          {
            city: 'Hồ Chí Minh',
            type: 'Vàng nhẫn SJC 99,99 1 chỉ, 2 chỉ, 5 chỉ',
            buy: '81.500',
            sell: '83.400',
          },
          { city: 'Hà Nội', type: 'Vàng SJC', buy: '81.000', sell: '83.500' },
        ]
        updateTime.value = new Date().toLocaleString('vi-VN') + ' (Dữ liệu mẫu)'
        isLoading.value = false
        return
      }
      throw new Error('Hiện tại không thể lấy dữ liệu. Vui lòng thử lại sau.')
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')

    if (doc.querySelector('parsererror')) {
      throw new Error('Dữ liệu trả về bị lỗi định dạng')
    }

    const newPrices: GoldPrice[] = []

    const root = doc.querySelector('ratelist')
    if (root) {
      const timeAttr = root.getAttribute('updated')
      if (timeAttr) {
        updateTime.value = timeAttr
      } else {
        updateTime.value = new Date().toLocaleString('vi-VN')
      }
    } else {
      updateTime.value = new Date().toLocaleString('vi-VN')
    }

    const cities = doc.querySelectorAll('city')
    cities.forEach((cityNode) => {
      const cityName = cityNode.getAttribute('name') || ''
      const items = cityNode.querySelectorAll('item')

      items.forEach((itemNode) => {
        newPrices.push({
          city: cityName,
          type: itemNode.getAttribute('type') || '',
          buy: itemNode.getAttribute('buy') || '',
          sell: itemNode.getAttribute('sell') || '',
        })
      })
    })

    if (newPrices.length === 0) throw new Error('Dữ liệu rỗng')
    prices.value = newPrices
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Lỗi không xác định'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPrices()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep p-6 text-text-primary font-body">
    <div class="mx-auto max-w-4xl space-y-8 animate-fade-up">
      <!-- Navigation -->
      <nav class="flex items-center">
        <RouterLink
          to="/"
          class="group flex w-fit items-center gap-2 rounded-xl bg-bg-surface px-4 py-2 text-sm font-medium text-text-secondary ring-1 ring-border-default transition-all hover:bg-bg-elevated hover:text-white"
        >
          <Icon
            icon="lucide:arrow-left"
            class="size-4 transition-transform group-hover:-translate-x-1"
          />
          <span>Về trang chủ</span>
        </RouterLink>
      </nav>

      <!-- Header -->
      <header class="flex flex-col items-center gap-4 text-center">
        <div
          class="flex size-16 items-center justify-center rounded-2xl bg-bg-surface shadow-[0_4px_16px_rgba(245,158,11,0.15)] ring-1 ring-border-default/50"
        >
          <Icon icon="lucide:coins" class="size-8 text-accent-amber" />
        </div>
        <div class="space-y-2">
          <h1
            class="font-display text-4xl font-bold md:text-5xl tracking-tight text-white drop-shadow-sm"
          >
            Giá Vàng Hôm Nay
          </h1>
          <p class="text-text-secondary">Cập nhật tỷ giá vàng SJC trong nước mới nhất</p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="relative grid gap-6">
        <div
          class="flex items-center justify-between rounded-t-xl bg-bg-surface p-4 ring-1 ring-border-default md:px-6"
        >
          <div class="flex items-center gap-2 text-sm text-text-secondary">
            <Icon icon="lucide:clock" class="size-4" />
            <span
              >Cập nhật:
              <strong class="text-text-primary">{{
                isLoading ? 'Đang tải...' : updateTime
              }}</strong></span
            >
          </div>
          <button
            @click="fetchPrices"
            :disabled="isLoading"
            class="flex items-center gap-2 rounded-lg bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary ring-1 ring-border-default transition-all hover:bg-border-default/50 hover:text-white disabled:opacity-50"
          >
            <Icon icon="lucide:rotate-cw" class="size-4" :class="{ 'animate-spin': isLoading }" />
            <span>Làm mới</span>
          </button>
        </div>

        <div
          class="overflow-hidden rounded-b-xl bg-bg-surface ring-1 ring-border-default/30 shadow-sm mt--6"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-bg-elevated/50 font-display text-text-secondary">
                <tr>
                  <th class="px-6 py-4 font-semibold uppercase tracking-wider min-w-[120px]">
                    Khu vực
                  </th>
                  <th class="px-6 py-4 font-semibold uppercase tracking-wider min-w-[200px]">
                    Loại vàng
                  </th>
                  <th class="px-6 py-4 font-semibold uppercase tracking-wider text-right">
                    Mua vào
                  </th>
                  <th class="px-6 py-4 font-semibold uppercase tracking-wider text-right">
                    Bán ra
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-default/50">
                <template v-if="isLoading">
                  <tr v-for="i in 5" :key="i" class="animate-pulse">
                    <td class="px-6 py-5"><div class="h-4 w-24 rounded bg-bg-elevated"></div></td>
                    <td class="px-6 py-5"><div class="h-4 w-40 rounded bg-bg-elevated"></div></td>
                    <td class="px-6 py-5">
                      <div class="ml-auto h-4 w-20 rounded bg-bg-elevated"></div>
                    </td>
                    <td class="px-6 py-5">
                      <div class="ml-auto h-4 w-20 rounded bg-bg-elevated"></div>
                    </td>
                  </tr>
                </template>

                <tr v-else-if="errorMsg">
                  <td colspan="4" class="px-6 py-12 text-center text-text-secondary">
                    <div class="flex flex-col items-center gap-3">
                      <Icon icon="lucide:alert-circle" class="size-8 text-accent-coral" />
                      <p>{{ errorMsg }}</p>
                    </div>
                  </td>
                </tr>

                <tr
                  v-else
                  v-for="(price, idx) in prices"
                  :key="idx"
                  class="group transition-colors hover:bg-bg-elevated/30"
                >
                  <td class="px-6 py-5 text-text-secondary">{{ price.city }}</td>
                  <td class="px-6 py-5 font-medium text-text-primary">{{ price.type }}</td>
                  <td
                    class="px-6 py-5 text-right font-display text-emerald-400 tabular-nums tracking-wide"
                  >
                    {{ price.buy || '-' }}
                  </td>
                  <td
                    class="px-6 py-5 text-right font-display text-accent-coral tabular-nums tracking-wide"
                  >
                    {{ price.sell || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Explainer snippet -->
        <div class="rounded-xl border border-accent-amber/20 bg-accent-amber/5 p-4 mt-4">
          <div class="flex gap-3">
            <Icon icon="lucide:info" class="mt-0.5 size-5 shrink-0 text-accent-amber" />
            <div class="space-y-1 text-sm text-text-secondary">
              <p>Dữ liệu được cập nhật từ Công ty TNHH MTV Vàng Bạc Đá Quý Sài Gòn (SJC).</p>
              <p>
                Đơn vị tính tùy thuộc vào SJC quy định (thực tế hiển thị là Giá x ngàn/chỉ). Hệ
                thống lấy dữ liệu trực tiếp và không thay đổi giá trị nhằm đảm bảo tính toán gốc.
              </p>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="mt-8 text-center text-sm text-text-secondary pb-8">
        <p>Designed by mtdes23</p>
        <a
          href="https://www.mtdes23.id.vn"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-accent-amber transition-colors"
          >www.mtdes23.id.vn</a
        >
      </footer>
    </div>
  </div>
</template>
