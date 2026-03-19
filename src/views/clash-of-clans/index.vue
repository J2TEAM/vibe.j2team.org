<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '@vueuse/core'
import { getClanDetails, getClanWarLog } from './services/cocService'
import type { ClanDetails, WarLogEntry } from './types'
import Dashboard from './components/Dashboard.vue'
import MembersRank from './components/MembersRank.vue'
import CurrentWar from './components/CurrentWar.vue'

const clanTag = useLocalStorage('coc-clan-tag', '')
const loading = ref(false)
const error = ref<string | null>(null)
const clanData = ref<ClanDetails | null>(null)
const warLog = ref<WarLogEntry[]>([])
const activeTab = ref<'dashboard' | 'war' | 'members'>('dashboard')

const loadDemoData = () => {
  clanTag.value = '#2G9YRCRV2'
  fetchData()
}

const fetchData = async () => {
  if (!clanTag.value) return

  loading.value = true
  error.value = null
  try {
    const [clan, log] = await Promise.all([
      getClanDetails(clanTag.value),
      getClanWarLog(clanTag.value),
    ])
    clanData.value = clan
    warLog.value = log
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Không thể tải dữ liệu clan.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (clanTag.value && clanTag.value.trim() !== '') {
    fetchData()
  }
})

const handleChangeClan = () => {
  clanData.value = null
  clanTag.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary p-4 md:p-8 font-body">
    <div class="max-w-6xl mx-auto">
      <div class="mb-6">
        <RouterLink
          to="/"
          class="inline-flex items-center text-sm font-bold text-text-muted hover:text-accent-coral transition-colors"
        >
          <Icon icon="lucide:arrow-left" class="mr-2 w-4 h-4" /> Quay lại trang chủ
        </RouterLink>
      </div>

      <div
        v-if="!clanData && !loading"
        class="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <h1
          class="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-accent-coral tracking-tight mb-2"
        >
          Clan Tracker
        </h1>
        <p class="text-text-secondary mb-8">Theo dõi & phân tích clan Clash of Clans</p>

        <div
          class="w-full max-w-md bg-bg-surface p-6 rounded-xl border border-border-default shadow-lg"
        >
          <form @submit.prevent="fetchData" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nhập Tag của Clan</label>
              <input
                v-model="clanTag"
                type="text"
                placeholder="VD: #2G9YRCRV2"
                class="w-full px-4 py-2 bg-bg-elevated border border-border-default rounded-lg focus:ring-2 focus:ring-accent-coral outline-none uppercase font-mono"
              />
            </div>

            <button
              type="submit"
              class="w-full py-2 bg-accent-coral text-white font-bold rounded-lg hover:bg-opacity-90 transition-all flex justify-center items-center"
            >
              <Icon icon="lucide:search" class="mr-2" />
              Quét Clan
            </button>

            <div class="relative py-2">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-border-default"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="bg-bg-surface px-2 text-xs text-text-muted">HOẶC</span>
              </div>
            </div>

            <button
              type="button"
              @click="loadDemoData"
              class="w-full py-2 bg-bg-elevated hover:bg-bg-muted border border-border-default font-bold rounded-lg transition-all flex justify-center items-center"
            >
              <Icon icon="lucide:play" class="mr-2 text-accent-amber" />
              Tải dữ liệu mẫu
            </button>
            <div
              v-if="error"
              class="text-red-500 text-sm mt-2 p-3 bg-red-950/50 border border-red-900 rounded"
            >
              {{ error }}
            </div>
          </form>
        </div>
      </div>

      <div
        v-else-if="loading"
        class="flex flex-col items-center justify-center min-h-[60vh] text-accent-amber"
      >
        <Icon icon="lucide:loader-2" class="w-12 h-12 animate-spin mb-4" />
        <p class="text-lg font-semibold animate-pulse">Đang triệu hồi quân lính...</p>
      </div>

      <div v-else-if="clanData" class="space-y-6 animate-fade-up">
        <!-- App Header after load -->
        <div
          class="flex items-center justify-between bg-bg-surface p-4 rounded-xl border border-border-default mb-6"
        >
          <div class="flex items-center space-x-4">
            <h1
              class="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-accent-coral hidden sm:block"
            >
              Clan Tracker
            </h1>
            <div class="flex space-x-2">
              <button
                @click="activeTab = 'dashboard'"
                :class="
                  activeTab === 'dashboard'
                    ? 'bg-accent-coral text-white'
                    : 'bg-bg-elevated text-text-secondary hover:text-white'
                "
                class="px-4 py-2 rounded-lg font-bold transition-all flex items-center text-sm"
              >
                <Icon icon="lucide:layout-dashboard" class="mr-2" /> Tổng quan
              </button>
              <button
                @click="activeTab = 'war'"
                :class="
                  activeTab === 'war'
                    ? 'bg-accent-coral text-white'
                    : 'bg-bg-elevated text-text-secondary hover:text-white'
                "
                class="px-4 py-2 rounded-lg font-bold transition-all flex items-center text-sm"
              >
                <Icon icon="lucide:swords" class="mr-2" /> Chiến tranh
              </button>
              <button
                @click="activeTab = 'members'"
                :class="
                  activeTab === 'members'
                    ? 'bg-accent-coral text-white'
                    : 'bg-bg-elevated text-text-secondary hover:text-white'
                "
                class="px-4 py-2 rounded-lg font-bold transition-all flex items-center text-sm"
              >
                <Icon icon="lucide:users" class="mr-2" /> Thành viên
              </button>
            </div>
          </div>
          <button
            @click="handleChangeClan"
            class="text-sm font-medium text-red-400 hover:text-red-300 px-3 py-1 bg-red-900/20 rounded border border-red-900/30 flex items-center transition-colors"
          >
            <Icon icon="lucide:log-out" class="mr-1.5" /> Đổi Clan
          </button>
        </div>

        <!-- Render Tabs (v-show to preserve state across tab switches) -->
        <Dashboard v-show="activeTab === 'dashboard'" :clan="clanData" :warLog="warLog" />
        <CurrentWar
          v-show="activeTab === 'war'"
          :clanTag="clanData.tag"
          @memberClick="activeTab = 'members'"
        />
        <MembersRank v-show="activeTab === 'members'" :members="clanData.memberList" />
      </div>

      <!-- Footer Citation -->
      <div
        class="mt-12 flex flex-col items-center justify-center text-sm text-text-muted pb-8 space-y-2 animate-fade-up animate-delay-300"
      >
        <p>
          Crafted with <Icon icon="lucide:heart" class="inline text-red-500 w-4 h-4 mx-0.5" /> by
          <a
            href="https://behitek.com/"
            target="_blank"
            rel="noopener"
            class="text-accent-amber hover:text-accent-coral transition-colors font-bold"
            >Behitek</a
          >
        </p>
      </div>
    </div>
  </div>
</template>
