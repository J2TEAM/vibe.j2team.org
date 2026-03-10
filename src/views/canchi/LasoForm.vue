<script setup lang="ts">
import { ref } from 'vue'
import type { LasoInput } from './lib/canchi-engine'
import { solarToLunar, lunarToSolar } from './lib/canchi-engine'

export interface FormValues {
  ten: string
  gioiTinh: 'nam' | 'nu'
  ngay: number
  thang: number
  nam: number
  isDuongLich: boolean
  gio: number
  namXem: number
}

const props = defineProps<{
  initialValues?: FormValues
}>()

const emit = defineEmits<{
  submit: [input: LasoInput, formValues: FormValues]
}>()

const currentYear = new Date().getFullYear()

const ten = ref(props.initialValues?.ten ?? 'Lá Số CanChi')
const gioiTinh = ref<'nam' | 'nu'>(props.initialValues?.gioiTinh ?? 'nam')
const ngay = ref(props.initialValues?.ngay ?? 1)
const thang = ref(props.initialValues?.thang ?? 1)
const nam = ref(props.initialValues?.nam ?? 1990)
const isDuongLich = ref(props.initialValues?.isDuongLich ?? true)
const gio = ref(props.initialValues?.gio ?? 21)
const namXem = ref(props.initialValues?.namXem ?? currentYear)

function handleSubmit() {
  if (!ngay.value || !thang.value || !nam.value) {
    alert('Vui lòng nhập đầy đủ ngày sinh')
    return
  }

  let ngayAm: number, thangAm: number, namAm: number
  let ngayDuong: number | undefined, thangDuong: number | undefined, namDuong: number | undefined

  let adjNgay = ngay.value,
    adjThang = thang.value,
    adjNam = nam.value
  if (gio.value === 23) {
    if (isDuongLich.value) {
      const d = new Date(nam.value, thang.value - 1, ngay.value)
      d.setDate(d.getDate() + 1)
      adjNgay = d.getDate()
      adjThang = d.getMonth() + 1
      adjNam = d.getFullYear()
    } else {
      const solar = lunarToSolar(ngay.value, thang.value, nam.value)
      const d = new Date(solar.year, solar.month - 1, solar.day)
      d.setDate(d.getDate() + 1)
      adjNgay = d.getDate()
      adjThang = d.getMonth() + 1
      adjNam = d.getFullYear()
    }
  }

  if (isDuongLich.value || (gio.value === 23 && !isDuongLich.value)) {
    const lunar = solarToLunar(adjNgay, adjThang, adjNam)
    ngayAm = lunar.ngayAm
    thangAm = lunar.thangAm
    namAm = lunar.namAm
    ngayDuong = ngay.value
    thangDuong = thang.value
    namDuong = nam.value
    if (!isDuongLich.value) {
      const solar = lunarToSolar(ngay.value, thang.value, nam.value)
      ngayDuong = solar.day
      thangDuong = solar.month
      namDuong = solar.year
    }
  } else {
    ngayAm = ngay.value
    thangAm = thang.value
    namAm = nam.value
    const solar = lunarToSolar(ngay.value, thang.value, nam.value)
    ngayDuong = solar.day
    thangDuong = solar.month
    namDuong = solar.year
  }

  emit(
    'submit',
    {
      ngayAm,
      thangAm,
      namAm,
      gio: gio.value,
      gioiTinh: gioiTinh.value,
      namXem: namXem.value,
      ngayDuong,
      thangDuong,
      namDuong,
    },
    {
      ten: ten.value,
      gioiTinh: gioiTinh.value,
      ngay: ngay.value,
      thang: thang.value,
      nam: nam.value,
      isDuongLich: isDuongLich.value,
      gio: gio.value,
      namXem: namXem.value,
    },
  )
}

const gioOptions = [
  { value: 0, label: 'Tý sớm (0h - 0h59)' },
  { value: 1, label: 'Sửu (1h - 2h59)' },
  { value: 3, label: 'Dần (3h - 4h59)' },
  { value: 5, label: 'Mão (5h - 6h59)' },
  { value: 7, label: 'Thìn (7h - 8h59)' },
  { value: 9, label: 'Tỵ (9h - 10h59)' },
  { value: 11, label: 'Ngọ (11h - 12h59)' },
  { value: 13, label: 'Mùi (13h - 14h59)' },
  { value: 15, label: 'Thân (15h - 16h59)' },
  { value: 17, label: 'Dậu (17h - 18h59)' },
  { value: 19, label: 'Tuất (19h - 20h59)' },
  { value: 21, label: 'Hợi (21h - 22h59)' },
  { value: 23, label: 'Tý muộn (23h - 23h59)' },
]

const yearOptions = Array.from({ length: currentYear - 1929 }, (_, i) => currentYear - i)
const viewYearOptions = Array.from(
  { length: currentYear + 20 - 1929 },
  (_, i) => currentYear + 20 - i,
)

const inputClass =
  'w-full h-11 px-4 py-2 border border-border-default bg-bg-deep text-text-primary text-base font-medium focus:outline-none focus:border-accent-coral transition-colors'
const selectClass =
  'w-full h-11 px-4 py-2 border border-border-default bg-bg-deep text-text-primary text-base font-medium focus:outline-none focus:border-accent-coral cursor-pointer appearance-none'
const labelClass = 'text-sm font-medium text-text-secondary font-display'
</script>

<template>
  <div class="bg-bg-surface border border-border-default p-6 md:p-12 animate-fade-up">
    <form @submit.prevent="handleSubmit">
      <div class="flex flex-col items-center gap-6 md:gap-12">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8 md:gap-y-6 w-full">
          <!-- Họ và tên -->
          <div class="flex flex-col gap-1.5 col-span-2 md:col-span-1">
            <label for="nameInput" :class="labelClass">Họ và tên</label>
            <input
              id="nameInput"
              v-model="ten"
              type="text"
              placeholder="Họ và tên"
              :class="inputClass"
            />
          </div>

          <!-- Giới tính -->
          <div class="flex flex-col gap-1.5 col-span-2 md:col-span-1">
            <label for="genderSelect" :class="labelClass">Giới tính</label>
            <div class="relative">
              <select id="genderSelect" v-model="gioiTinh" :class="selectClass">
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
              </select>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-dim"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  class="fill-current h-4 w-4"
                >
                  <path
                    d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- Ngày sinh -->
          <div class="flex flex-col gap-1.5 col-span-2 md:col-span-1">
            <label :class="labelClass">Ngày sinh</label>
            <div class="grid grid-cols-3 gap-2">
              <div class="relative">
                <select v-model.number="ngay" required :class="selectClass">
                  <option v-for="d in 31" :key="d" :value="d">{{ d }}</option>
                </select>
                <div
                  class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-dim"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    class="fill-current h-4 w-4"
                  >
                    <path
                      d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                    />
                  </svg>
                </div>
              </div>
              <div class="relative">
                <select v-model.number="thang" required :class="selectClass">
                  <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
                </select>
                <div
                  class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-dim"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    class="fill-current h-4 w-4"
                  >
                    <path
                      d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                    />
                  </svg>
                </div>
              </div>
              <div class="relative">
                <select v-model.number="nam" required :class="selectClass">
                  <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
                <div
                  class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-dim"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    class="fill-current h-4 w-4"
                  >
                    <path
                      d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Loại lịch -->
          <div class="flex flex-col gap-1.5 col-span-2 md:col-span-1">
            <label for="calendarTypeSelect" :class="labelClass">Loại lịch</label>
            <div class="relative">
              <select
                id="calendarTypeSelect"
                :value="isDuongLich ? 'duong' : 'am'"
                :class="selectClass"
                @change="isDuongLich = ($event.target as HTMLSelectElement).value === 'duong'"
              >
                <option value="duong">Dương lịch</option>
                <option value="am">Âm lịch</option>
              </select>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-dim"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  class="fill-current h-4 w-4"
                >
                  <path
                    d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- Giờ sinh -->
          <div class="flex flex-col gap-1.5 col-span-2 md:col-span-1">
            <label for="hourSelect" :class="labelClass">Giờ sinh</label>
            <div class="relative">
              <select id="hourSelect" v-model.number="gio" :class="selectClass">
                <option v-for="opt in gioOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-dim"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  class="fill-current h-4 w-4"
                >
                  <path
                    d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- Năm xem -->
          <div class="flex flex-col gap-1.5 col-span-2 md:col-span-1">
            <label for="viewYearSelect" :class="labelClass">Năm xem</label>
            <div class="relative">
              <select id="viewYearSelect" v-model.number="namXem" :class="selectClass">
                <option v-for="y in viewYearOptions" :key="y" :value="y">{{ y }}</option>
              </select>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-dim"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  class="fill-current h-4 w-4"
                >
                  <path
                    d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit button -->
        <div class="flex justify-center">
          <button
            type="submit"
            class="flex justify-center items-center font-display font-semibold transition-all duration-300 bg-accent-coral text-bg-deep h-11 md:h-14 w-40 md:w-80 gap-2 md:gap-3 hover:bg-accent-coral/80"
          >
            <span class="md:text-lg">Xem kết quả</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-5 h-5 md:w-6 md:h-6"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
