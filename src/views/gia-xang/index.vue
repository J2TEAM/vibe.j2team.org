<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

interface FuelPrice {
  name: string
  price: string
  change: string
}

const prices = ref<FuelPrice[]>([])
const isLoading = ref(true)
const updateTime = ref('')
const errorMsg = ref('')

const API_SOURCE = 'https://vnexpress.net/chu-de/gia-xang-dau-3026'

const formatPrice = (val: string) => {
  const cleaned = val.replace(/[^\d]/g, '')
  if (!cleaned) return ''
  return cleaned.replace(/(\d{1,3})(?=(\d{3})+(?!\d))/g, '$1.')
}

async function fetchPrices() {
  isLoading.value = true
  errorMsg.value = ''
  try {
    let html = ''

    // Direct Codetabs proxy (fastest and reliable in practice)
    try {
      const res = await fetch(
        `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(API_SOURCE)}`,
      )
      if (res.ok) html = await res.text()
      else throw new Error(`Codetabs error ${res.status}`)
    } catch (e) {
      console.warn('Codetabs failed', e)
    }

    if (!html) {
      const h = window.location.hostname
      if (h === 'localhost' || h === '127.0.0.1' || h.includes('vibe.j2team.org')) {
        prices.value = [
          { name: 'Xăng RON 95-III', price: '29.950', change: '- 3.880' },
          { name: 'Xăng E5 RON 92-II', price: '28.070', change: '- 2.040' },
          { name: 'Dầu Diesel', price: '37.890', change: '- 1.770' },
          { name: 'Dầu hỏa', price: '36.350', change: '- 4.100' },
        ]
        updateTime.value = new Date().toLocaleString('vi-VN') + ' (Dữ liệu mẫu)'
        isLoading.value = false
        return
      }
      throw new Error('Hiện tại không thể lấy dữ liệu. Vui lòng thử lại sau.')
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Find the price table
    const table = doc.querySelector('table')
    if (!table) throw new Error('Không tìm thấy bảng giá trên VnExpress')

    const newPrices: FuelPrice[] = []
    const rows = table.querySelectorAll('tr')

    // Extract update time from the header (Price from [Time] [Date])
    const headerRow = rows[0]
    if (headerRow) {
      const priceHeader = headerRow.querySelectorAll('th, td')[1]?.textContent || ''
      const timeMatch = priceHeader.match(/(\d{1,2}h\s+\d{1,2}\/\d{1,2}\/\d{4})/)
      updateTime.value =
        timeMatch && timeMatch[1] ? timeMatch[1] : new Date().toLocaleString('vi-VN')
    }

    rows.forEach((row, index) => {
      if (index === 0) return // Skip header
      const tds = row.querySelectorAll('td')
      if (tds.length >= 3) {
        const name = tds[0]?.textContent?.trim() || ''
        const priceRaw = tds[1]?.textContent?.trim() || ''
        const change = tds[2]?.textContent?.trim() || ''

        if (name && priceRaw && /\d/.test(priceRaw)) {
          newPrices.push({
            name,
            price: formatPrice(priceRaw),
            change: change,
          })
        }
      }
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
          class="flex size-16 items-center justify-center rounded-2xl bg-bg-surface shadow-[0_4px_16px_rgba(255,107,107,0.15)] ring-1 ring-border-default/50"
        >
          <Icon icon="lucide:fuel" class="size-8 text-accent-coral" />
        </div>
        <div class="space-y-2">
          <h1
            class="font-display text-4xl font-bold md:text-5xl tracking-tight text-white drop-shadow-sm"
          >
            Giá Xăng Dầu
          </h1>
          <p class="text-text-secondary">Giá bán lẻ xăng dầu hôm nay</p>
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
            <table class="w-full text-left text-sm">
              <thead class="bg-bg-elevated/50 font-display text-text-secondary">
                <tr>
                  <th class="px-6 py-4 font-semibold uppercase tracking-wider">Mặt hàng</th>
                  <th class="px-6 py-4 font-semibold uppercase tracking-wider text-right">
                    Giá (VNĐ/lít)
                  </th>
                  <th class="px-6 py-4 font-semibold uppercase tracking-wider text-right">
                    Thay đổi
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-default/50">
                <template v-if="isLoading">
                  <tr v-for="i in 5" :key="i" class="animate-pulse">
                    <td class="px-6 py-5"><div class="h-4 w-32 rounded bg-bg-elevated"></div></td>
                    <td class="px-6 py-5">
                      <div class="ml-auto h-4 w-20 rounded bg-bg-elevated"></div>
                    </td>
                    <td class="px-6 py-5">
                      <div class="ml-auto h-4 w-20 rounded bg-bg-elevated"></div>
                    </td>
                  </tr>
                </template>

                <tr v-else-if="errorMsg">
                  <td colspan="3" class="px-6 py-12 text-center text-text-secondary">
                    <div class="flex flex-col items-center gap-3">
                      <Icon icon="lucide:alert-circle" class="size-8 text-accent-amber" />
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
                  <td class="px-6 py-5 font-medium text-text-primary">{{ price.name }}</td>
                  <td
                    class="px-6 py-5 text-right font-display text-accent-sky tabular-nums tracking-wide"
                  >
                    {{ price.price }}
                  </td>
                  <td
                    class="px-6 py-5 text-right font-medium tracking-wide"
                    :class="
                      price.change.includes('-')
                        ? 'text-accent-coral'
                        : price.change.includes('+')
                          ? 'text-emerald-400'
                          : 'text-text-dim'
                    "
                  >
                    {{ price.change }}
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
              <p>Dữ liệu được cập nhật dựa trên biểu đồ giá xăng dầu bán lẻ từ Petrolimex.</p>
              <p>Mức giá có thể thay đổi tùy thuộc vào thời điểm điều chỉnh của cơ quan quản lý.</p>
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
          class="hover:text-accent-coral transition-colors"
          >www.mtdes23.id.vn</a
        >
      </footer>
    </div>
  </div>
</template>
