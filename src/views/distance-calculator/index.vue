<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getPreciseDistance } from 'geolib'

const rawA = ref('')
const rawB = ref('')
const lat1 = ref('')
const lon1 = ref('')
const lat2 = ref('')
const lon2 = ref('')

const geolibKm = ref('0.000')
const geolibMeters = ref('0')
const haversineKm = ref('0.00')

const showResults = ref(false)
const showError = ref(false)
const errorMessage = ref('Vui lòng nhập đầy đủ tọa độ hợp lệ.')

function parseInput(
  rawValue: string,
  setLat: (value: string) => void,
  setLon: (value: string) => void,
) {
  if (!rawValue) return

  const latRegex = /["']?(?:lat|latitude)["']?[\s:=]+([-+]?[0-9]*\.?[0-9]+)/i
  const lonRegex = /["']?(?:lon|lng|longitude)["']?[\s:=]+([-+]?[0-9]*\.?[0-9]+)/i

  const latMatch = rawValue.match(latRegex)
  const lonMatch = rawValue.match(lonRegex)

  if (latMatch?.[1]) {
    setLat(latMatch[1])
  }
  if (lonMatch?.[1]) {
    setLon(lonMatch[1])
  }

  if (!latMatch && !lonMatch) {
    const simplePairRegex = /([-+]?[0-9]+\.?[0-9]+)\s*,\s*([-+]?[0-9]+\.?[0-9]+)/
    const pairMatch = rawValue.match(simplePairRegex)
    if (pairMatch) {
      setLat(pairMatch[1])
      setLon(pairMatch[2])
    }
  }

  if (lat1.value && lon1.value && lat2.value && lon2.value) {
    calculateDistance()
  }
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

function calculateDistance() {
  const lat1Input = lat1.value
  const lon1Input = lon1.value
  const lat2Input = lat2.value
  const lon2Input = lon2.value

  if (!lat1Input || !lon1Input || !lat2Input || !lon2Input) {
    errorMessage.value = 'Vui lòng nhập đầy đủ tọa độ hợp lệ.'
    showError.value = true
    showResults.value = false
    return
  }

  const lat1Number = parseFloat(lat1Input)
  const lon1Number = parseFloat(lon1Input)
  const lat2Number = parseFloat(lat2Input)
  const lon2Number = parseFloat(lon2Input)

  if (
    Number.isNaN(lat1Number) ||
    Number.isNaN(lon1Number) ||
    Number.isNaN(lat2Number) ||
    Number.isNaN(lon2Number)
  ) {
    errorMessage.value = 'Dữ liệu nhập vào không phải là số hợp lệ.'
    showError.value = true
    showResults.value = false
    return
  }

  showError.value = false

  const R = 6371
  const dLat = deg2rad(lat2Number - lat1Number)
  const dLon = deg2rad(lon2Number - lon1Number)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1Number)) *
      Math.cos(deg2rad(lat2Number)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c

  const preciseMeters = getPreciseDistance(
    { latitude: lat1Number, longitude: lon1Number },
    { latitude: lat2Number, longitude: lon2Number },
  )
  const preciseKm = preciseMeters / 1000

  haversineKm.value = d.toLocaleString('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  geolibKm.value = preciseKm.toLocaleString('vi-VN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
  geolibMeters.value = preciseMeters.toLocaleString('vi-VN')

  showResults.value = true
}
</script>

<template>
  <div
    class="min-h-screen bg-bg-deep text-text-primary font-body flex items-center justify-center px-4 py-10"
    @keydown.enter="calculateDistance"
  >
    <RouterLink
      to="/"
      class="group absolute left-4 top-4 inline-flex items-center gap-1 text-accent-sky transition hover:text-accent-coral"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 transition-transform group-hover:-translate-x-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      <span class="font-medium">Trang chủ</span>
    </RouterLink>

    <div
      class="w-full max-w-md overflow-hidden rounded-2xl border border-border-default bg-bg-surface shadow-xl"
    >
      <div class="bg-accent-sky/80 px-6 py-5 text-center text-white">
        <h1 class="text-2xl font-bold">Tính Khoảng Cách</h1>
        <p class="mt-1 text-sm text-white/80">Giữa hai tọa độ địa lý (Lat, Lon)</p>
      </div>

      <div class="space-y-6 p-8">
        <div class="space-y-3">
          <div
            class="flex items-center justify-between border-b border-border-default pb-2 text-accent-sky"
          >
            <div class="flex items-center gap-2 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Điểm A</span>
            </div>
          </div>

          <div class="mb-2">
            <input
              v-model="rawA"
              type="text"
              placeholder="Dán JSON/Text vào đây (vd: {lat: 10.7, lon: 106.6} )"
              class="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary focus:border-accent-sky focus:outline-none"
              @input="
                parseInput(
                  rawA,
                  (value) => (lat1.value = value),
                  (value) => (lon1.value = value),
                )
              "
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs uppercase tracking-wide text-text-dim">Vĩ độ (Lat)</label>
              <input
                v-model="lat1"
                type="number"
                step="any"
                placeholder="VD: 10.762"
                class="w-full rounded-lg border border-border-default bg-bg-surface px-4 py-2 text-sm focus:border-accent-sky focus:outline-none"
              />
            </div>
            <div class="space-y-1">
              <label class="block text-xs uppercase tracking-wide text-text-dim"
                >Kinh độ (Lon)</label
              >
              <input
                v-model="lon1"
                type="number"
                step="any"
                placeholder="VD: 106.660"
                class="w-full rounded-lg border border-border-default bg-bg-surface px-4 py-2 text-sm focus:border-accent-sky focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div
            class="flex items-center justify-between border-b border-border-default pb-2 text-accent-coral"
          >
            <div class="flex items-center gap-2 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>Điểm B</span>
            </div>
          </div>

          <div class="mb-2">
            <input
              v-model="rawB"
              type="text"
              placeholder="Dán JSON/Text vào đây (vd: {lat: 21.0, lon: 105.8} )"
              class="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary focus:border-accent-coral focus:outline-none"
              @input="
                parseInput(
                  rawB,
                  (value) => (lat2.value = value),
                  (value) => (lon2.value = value),
                )
              "
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs uppercase tracking-wide text-text-dim">Vĩ độ (Lat)</label>
              <input
                v-model="lat2"
                type="number"
                step="any"
                placeholder="VD: 21.028"
                class="w-full rounded-lg border border-border-default bg-bg-surface px-4 py-2 text-sm focus:border-accent-coral focus:outline-none"
              />
            </div>
            <div class="space-y-1">
              <label class="block text-xs uppercase tracking-wide text-text-dim"
                >Kinh độ (Lon)</label
              >
              <input
                v-model="lon2"
                type="number"
                step="any"
                placeholder="VD: 105.854"
                class="w-full rounded-lg border border-border-default bg-bg-surface px-4 py-2 text-sm focus:border-accent-coral focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-sky px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
          @click="calculateDistance"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Tính Toán Ngay</span>
        </button>

        <div v-if="showResults" class="space-y-4">
          <div
            class="relative overflow-hidden rounded-xl border border-accent-sky/30 bg-accent-sky/10 p-4 transition hover:scale-[1.02]"
          >
            <div
              class="absolute right-0 top-0 rounded-bl-lg bg-accent-sky px-2 py-1 text-[10px] font-bold uppercase text-white"
            >
              Geolib (Chính xác)
            </div>
            <h3 class="mb-1 text-center text-xs font-bold tracking-widest text-accent-sky/80">
              KHOẢNG CÁCH THỰC TẾ
            </h3>
            <div class="flex items-baseline justify-center gap-2 text-accent-sky">
              <span class="text-5xl font-extrabold tracking-tight">{{ geolibKm }}</span>
              <span class="text-xl font-semibold">km</span>
            </div>
            <div class="mt-1 text-center text-sm font-medium text-accent-sky">
              = <span>{{ geolibMeters }}</span> mét
            </div>
          </div>

          <div
            class="relative rounded-xl border border-border-default bg-bg-elevated p-3 text-text-dim opacity-80 transition hover:opacity-100"
          >
            <div
              class="absolute right-0 top-0 rounded-bl-lg bg-bg-elevated px-2 py-1 text-[10px] font-bold"
            >
              Haversine (Tham khảo)
            </div>
            <div class="flex items-baseline justify-center gap-2 text-text-dim">
              <span class="text-xs uppercase">Công thức đơn giản:</span>
              <span class="text-xl font-bold">{{ haversineKm }}</span>
              <span class="text-sm font-semibold">km</span>
            </div>
          </div>
        </div>

        <div
          v-if="showError"
          class="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-500"
        >
          {{ errorMessage }}
        </div>
      </div>

      <div
        class="border-t border-border-default bg-bg-elevated p-4 text-center text-xs text-text-dim"
      >
        Sử dụng công thức Haversine • Bán kính Trái Đất ~ 6371km
      </div>
    </div>
  </div>
</template>
