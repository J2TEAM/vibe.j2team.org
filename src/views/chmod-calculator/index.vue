<template>
  <div
    class="w-full flex flex-col items-center font-sans text-slate-300 selection:bg-accent-coral/30 p-3 sm:p-4 md:p-8"
  >
    <div class="w-full max-w-5xl flex items-center justify-between mb-6 md:mb-8 gap-2">
      <RouterLink
        to="/"
        class="group flex items-center gap-1 sm:gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-accent-coral/30 text-slate-300 py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg sm:rounded-xl transition-all shadow-sm"
      >
        <Icon
          icon="heroicons:arrow-left-16-solid"
          class="w-4 h-4 sm:w-5 sm:h-5 text-accent-coral group-hover:-translate-x-1 transition-transform"
        />
        <span class="text-sm sm:text-base group-hover:text-white transition-colors">Trang chủ</span>
      </RouterLink>
      <span class="text-xs sm:text-sm md:text-xl text-slate-500 font-mono truncate"
        >~/chmod_calculator</span
      >
    </div>

    <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
      <div
        class="group/main relative lg:col-span-2 bg-slate-900 rounded-2xl md:rounded-3xl shadow-2xl border border-slate-800 hover:border-accent-coral/30 hover:shadow-[0_0_40px_-15px_rgba(255,127,80,0.2)] p-4 sm:p-6 md:p-8 transition-all duration-500 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950"
      >
        <div
          class="absolute -top-20 -right-20 w-40 h-40 bg-accent-coral/5 blur-[60px] rounded-full group-hover/main:bg-accent-coral/15 transition-colors duration-700"
        ></div>

        <div class="relative z-10">
          <div
            class="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-slate-800"
          >
            <div
              class="bg-slate-950 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800 shadow-inner group-hover/main:border-accent-coral/30 group-hover/main:shadow-[0_0_15px_rgba(255,127,80,0.1)] transition-all duration-500"
            >
              <Icon
                icon="heroicons:shield-exclamation"
                class="w-6 h-6 sm:w-8 sm:h-8 text-accent-coral drop-shadow-[0_0_8px_rgba(255,127,80,0.5)]"
              />
            </div>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Chmod Calculator
            </h1>
          </div>

          <div
            class="overflow-x-auto border border-slate-800 rounded-xl md:rounded-2xl mb-6 md:mb-8 bg-slate-950/50"
          >
            <table class="w-full text-left border-collapse min-w-[280px]">
              <thead>
                <tr class="bg-slate-900 border-b border-slate-800">
                  <th class="p-2 sm:p-4 w-1/4"></th>
                  <th
                    v-for="role in rolesHeader"
                    :key="role.key"
                    class="p-2 sm:p-4 text-slate-400 font-semibold text-center uppercase text-[10px] sm:text-xs"
                  >
                    <div class="flex flex-col sm:block items-center leading-tight">
                      <span>{{ role.label }}</span>
                      <span class="text-accent-coral/70 sm:ml-1">({{ role.key }})</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="permission in permissions"
                  :key="permission.value"
                  class="border-b border-slate-800/50 hover:bg-slate-800/80 transition-colors"
                >
                  <td class="p-2 sm:p-4 font-medium text-slate-200 text-xs sm:text-sm">
                    <div
                      class="flex flex-col sm:flex-row sm:items-center group/perm cursor-default"
                    >
                      <span class="group-hover/perm:text-white transition-colors">{{
                        permission.label
                      }}</span>
                      <span
                        class="text-slate-500 font-mono text-[10px] sm:text-sm sm:ml-1.5 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 group-hover/perm:border-accent-coral/30 group-hover/perm:text-accent-coral transition-colors"
                        >{{ permission.value }}</span
                      >
                    </div>
                  </td>
                  <td v-for="role in roles" :key="role" class="p-2 sm:p-4 text-center">
                    <input
                      type="checkbox"
                      v-model="state[role][permission.key]"
                      class="w-4 h-4 sm:w-5 sm:h-5 accent-accent-coral bg-slate-800 border-slate-700 rounded cursor-pointer transition-transform hover:scale-125 hover:shadow-[0_0_10px_rgba(255,127,80,0.4)]"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:gap-6">
            <div
              class="bg-slate-950 rounded-xl md:rounded-2xl p-6 sm:p-8 border border-slate-800/80 text-center relative overflow-hidden group/result shadow-inner"
            >
              <div
                class="absolute inset-0 bg-accent-coral/5 blur-[50px] rounded-full opacity-50 group-hover/result:opacity-100 transition-opacity duration-500"
              ></div>

              <div class="relative z-10 flex flex-col items-center justify-center gap-3">
                <div
                  class="text-5xl sm:text-6xl md:text-7xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-white to-accent-coral tracking-[0.15em] drop-shadow-[0_5px_15px_rgba(255,127,80,0.3)] group-hover/result:scale-105 transition-transform duration-300"
                >
                  {{ numericResult }}
                </div>

                <div class="w-16 h-[2px] bg-slate-800 rounded-full my-1"></div>

                <div
                  class="text-xl sm:text-2xl md:text-3xl font-mono text-slate-400 font-medium tracking-[0.2em] group-hover/result:text-slate-300 transition-colors"
                >
                  {{ stringResult }}
                </div>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2 mb-3 px-1">
              <label class="flex items-center gap-3 cursor-pointer group/sudo select-none">
                <input type="checkbox" v-model="useSudo" class="sr-only" />

                <div
                  class="relative w-10 h-6 rounded-full transition-all duration-300 border"
                  :class="
                    useSudo
                      ? 'bg-accent-coral/20 border-accent-coral/50 shadow-[0_0_10px_rgba(255,127,80,0.2)]'
                      : 'bg-slate-950 border-slate-700 group-hover/sudo:border-slate-500'
                  "
                >
                  <div
                    class="absolute top-1 left-1 w-4 h-4 rounded-full transition-all duration-300"
                    :class="
                      useSudo
                        ? 'translate-x-4 bg-accent-coral shadow-[0_0_8px_rgba(255,127,80,0.8)]'
                        : 'translate-x-0 bg-slate-500 group-hover/sudo:bg-slate-400'
                    "
                  ></div>
                </div>

                <span
                  class="text-sm font-medium font-mono transition-all duration-300"
                  :class="
                    useSudo
                      ? 'text-accent-coral drop-shadow-[0_0_5px_rgba(255,127,80,0.4)]'
                      : 'text-slate-500 group-hover/sudo:text-slate-400'
                  "
                >
                  sudo
                </span>
              </label>

              <div class="flex-1 w-full relative group/path">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon
                    icon="heroicons:folder"
                    class="w-4 h-4 text-slate-500 group-focus-within/path:text-accent-coral transition-colors"
                  />
                </div>
                <input
                  type="text"
                  v-model="customPath"
                  placeholder="Nhập path (vd: /var/www/html)"
                  class="w-full bg-slate-950 border border-slate-800 focus:border-accent-coral/50 focus:ring-1 focus:ring-accent-coral/50 text-slate-300 text-sm font-mono rounded-xl py-2 pl-9 pr-4 transition-all outline-none placeholder:text-slate-600 shadow-inner"
                />
              </div>
            </div>

            <div
              class="relative group/cmd flex items-center bg-slate-950 border border-slate-800 hover:border-accent-coral/50 rounded-xl overflow-hidden transition-colors shadow-sm mt-2"
            >
              <div
                class="flex-1 py-3 px-4 md:py-4 md:px-6 pr-[100px] md:pr-[120px] font-mono text-sm md:text-lg overflow-x-auto whitespace-nowrap"
              >
                <span
                  v-if="useSudo"
                  class="text-rose-400 font-bold mr-2 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                  >sudo</span
                >

                <span class="text-accent-coral font-bold drop-shadow-[0_0_8px_rgba(255,127,80,0.5)]"
                  >chmod</span
                >
                <span class="text-slate-200 mx-2">{{ numericResult }}</span>

                <span
                  class="text-slate-400"
                  :class="{ 'text-slate-500 italic': !customPath.trim() }"
                >
                  {{ customPath.trim() || 'path' }}
                </span>
              </div>

              <button
                @click="copy()"
                v-if="isSupported"
                class="absolute right-1.5 sm:right-2 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,127,80,0.3)]"
                :class="
                  copied
                    ? 'bg-accent-coral text-slate-950 px-3 sm:px-4'
                    : 'bg-slate-800 text-slate-300 hover:bg-accent-coral hover:text-slate-900 px-2 sm:px-2.5'
                "
              >
                <Icon
                  :icon="
                    copied ? 'heroicons:check-circle-20-solid' : 'heroicons:document-duplicate'
                  "
                  class="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                />
                <span v-if="copied" class="text-xs sm:text-sm font-bold whitespace-nowrap"
                  >Copied</span
                >
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1 flex flex-col gap-4 sm:gap-6">
        <AboutCard />
        <AuthorCard />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'

import AboutCard from './AboutCard.vue'
import AuthorCard from './AuthorCard.vue'

// 1. Định nghĩa các Interface để TS hiểu cấu trúc dữ liệu
interface PermissionState {
  read: boolean
  write: boolean
  execute: boolean
}

interface RoleHeader {
  label: string
  key: string
}

interface Permission {
  label: string
  value: number
  key: keyof PermissionState // Ràng buộc key phải là 1 trong 3: read, write, execute
}

// 2. Khai báo dữ liệu với kiểu đã định nghĩa
const rolesHeader: RoleHeader[] = [
  { label: 'Owner', key: 'u' },
  { label: 'Group', key: 'g' },
  { label: 'Public', key: 'o' },
]

const roles = ['owner', 'group', 'public'] as const

const permissions: Permission[] = [
  { label: 'Read', value: 4, key: 'read' },
  { label: 'Write', value: 2, key: 'write' },
  { label: 'Execute', value: 1, key: 'execute' },
]

// 3. Khởi tạo State với kiểu dữ liệu State
const state = reactive({
  owner: { read: false, write: false, execute: false },
  group: { read: false, write: false, execute: false },
  public: { read: false, write: false, execute: false },
}) as Record<'owner' | 'group' | 'public', PermissionState>
const customPath = ref<string>('')
const useSudo = ref<boolean>(false)

// 4. Các Computed logic
const numericResult = computed<string>(() =>
  roles
    .map(
      (role) =>
        (state[role].read ? 4 : 0) + (state[role].write ? 2 : 0) + (state[role].execute ? 1 : 0),
    )
    .join(''),
)

const stringResult = computed<string>(() =>
  roles
    .map(
      (role) =>
        (state[role].read ? 'r' : '-') +
        (state[role].write ? 'w' : '-') +
        (state[role].execute ? 'x' : '-'),
    )
    .join(''),
)

const commandText = computed<string>(() => {
  const prefix = useSudo.value ? 'sudo ' : ''
  const targetPath = customPath.value.trim() !== '' ? customPath.value.trim() : 'path'
  return `${prefix}chmod ${numericResult.value} ${targetPath}`
})

// 5. Clipboard
const { copy, copied, isSupported } = useClipboard({ source: commandText })
</script>
