<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { useIntervalFn } from '@vueuse/core'
import type { CurrentWar, WarMember, LeagueGroup, CWLWar } from '../types'
import {
  getClanCurrentWar,
  getClanWarLeagueGroup,
  getClanWarLeagueWar,
} from '../services/cocService'

const props = defineProps<{
  clanTag: string
}>()

defineEmits<{
  (e: 'memberClick', tag: string): void
}>()

const warType = ref<'classic' | 'cwl' | 'none'>('none')
const classicWar = ref<CurrentWar | null>(null)
const cwlGroup = ref<LeagueGroup | null>(null)
const cwlWars = ref<CWLWar[]>([])
const currentCwlRound = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)
const isRefreshing = ref(false)
const lastUpdated = ref(new Date())
const timer = ref('')
const timerLabel = ref('')

const parseCoCTimestamp = (timestamp: string): Date => {
  if (!timestamp) return new Date()
  if (timestamp.includes('-') && timestamp.includes(':')) return new Date(timestamp)

  const year = timestamp.slice(0, 4)
  const month = timestamp.slice(4, 6)
  const day = timestamp.slice(6, 8)
  const hour = timestamp.slice(9, 11)
  const min = timestamp.slice(11, 13)
  const sec = timestamp.slice(13, 15)
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}.000Z`)
}

const fetchWar = async (isBackgroundRefresh = false) => {
  try {
    if (isBackgroundRefresh) isRefreshing.value = true

    let foundCWL = false

    try {
      const leagueGroup = await getClanWarLeagueGroup(props.clanTag)
      cwlGroup.value = leagueGroup

      let activeRoundIndex = 0
      for (let i = 0; i < leagueGroup.rounds.length; i++) {
        const r = leagueGroup.rounds[i]
        if (r && r.warTags.some((tag) => tag !== '#0')) {
          activeRoundIndex = i
          break
        }
      }

      const activeRound = leagueGroup.rounds[activeRoundIndex]
      if (activeRound && activeRound.warTags) {
        const warPromises = activeRound.warTags
          .filter((tag) => tag !== '#0')
          .map((tag) => getClanWarLeagueWar(tag).catch(() => null))

        const wars = (await Promise.all(warPromises)).filter((w) => w !== null) as CWLWar[]
        const ourWar = wars.find(
          (w) => w.clan.tag === props.clanTag || w.opponent.tag === props.clanTag,
        )

        if (ourWar) {
          cwlWars.value = [ourWar]
          warType.value = 'cwl'
          currentCwlRound.value = activeRoundIndex
          lastUpdated.value = new Date()
          loading.value = false
          foundCWL = true
        }
      }
    } catch {
      // Ignore
    }

    if (!foundCWL) {
      const war = await getClanCurrentWar(props.clanTag)
      if (war && war.state !== 'notInWar') {
        classicWar.value = war
        warType.value = 'classic'
        lastUpdated.value = new Date()
      } else {
        warType.value = 'none'
      }
    }
  } catch {
    error.value = 'Không thể tải dữ liệu chiến tranh.'
    warType.value = 'none'
  } finally {
    loading.value = false
    if (isBackgroundRefresh) {
      setTimeout(() => {
        isRefreshing.value = false
      }, 1000)
    }
  }
}

const loadCwlRound = async (roundIndex: number) => {
  if (!cwlGroup.value || roundIndex < 0 || roundIndex >= cwlGroup.value.rounds.length) return

  isRefreshing.value = true
  const round = cwlGroup.value.rounds[roundIndex]
  if (!round) {
    isRefreshing.value = false
    return
  }

  try {
    const warPromises = round.warTags
      .filter((tag) => tag !== '#0')
      .map((tag) => getClanWarLeagueWar(tag).catch(() => null))

    const wars = (await Promise.all(warPromises)).filter((w) => w !== null) as CWLWar[]
    const ourWar = wars.find(
      (w) => w.clan.tag === props.clanTag || w.opponent.tag === props.clanTag,
    )

    if (ourWar) {
      cwlWars.value = [ourWar]
      currentCwlRound.value = roundIndex
    }
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 500)
  }
}

watch(
  () => props.clanTag,
  () => {
    loading.value = true
    fetchWar()
  },
  { immediate: true },
)

useIntervalFn(() => {
  fetchWar(true)
}, 60000)

const tick = ref(0)
useIntervalFn(() => {
  tick.value++
}, 1000)

const timeAgo = computed(() => {
  const currentTick = tick.value
  const seconds =
    Math.floor((new Date().getTime() - lastUpdated.value.getTime()) / 1000) +
    (currentTick === -999 ? 1 : 0)
  if (seconds < 5) return 'Vừa xong'
  if (seconds < 60) return `${seconds} giây trước`
  const minutes = Math.floor(seconds / 60)
  if (minutes === 1) return '1 phút trước'
  return `${minutes} phút trước`
})

const updateTimer = () => {
  const currentWarObj = warType.value === 'cwl' ? cwlWars.value[0] : classicWar.value
  if (!currentWarObj || currentWarObj.state === 'warEnded' || currentWarObj.state === 'notInWar')
    return

  const now = new Date().getTime()
  const targetDate =
    currentWarObj.state === 'preparation'
      ? parseCoCTimestamp(currentWarObj.startTime)
      : parseCoCTimestamp(currentWarObj.endTime)

  const distance = targetDate.getTime() - now

  if (distance < 0) {
    timer.value = '00h 00m 00s'
    return
  }

  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((distance % (1000 * 60)) / 1000)

  timer.value = `${hours}h ${minutes}m ${seconds}s`
  timerLabel.value =
    currentWarObj.state === 'preparation' ? 'Trận chiến bắt đầu sau' : 'Trận chiến kết thúc sau'
}

useIntervalFn(updateTimer, 1000)

const currentWar = computed(() => (warType.value === 'cwl' ? cwlWars.value[0] : classicWar.value))
const maxStars = computed(() => (currentWar.value ? currentWar.value.teamSize * 3 : 0))
const myStars = computed(() => currentWar.value?.clan.stars || 0)
const enemyStars = computed(() => currentWar.value?.opponent.stars || 0)
const isPerfectWar = computed(() => myStars.value === maxStars.value && maxStars.value > 0)
const totalRounds = computed(() =>
  cwlGroup.value
    ? cwlGroup.value.rounds.filter((r) => r.warTags.some((t) => t !== '#0')).length
    : 0,
)

const getAttackInfo = (member: WarMember, attackIndex: number, opponentMembers?: WarMember[]) => {
  if (!member.attacks || !member.attacks[attackIndex]) return null
  const attack = member.attacks[attackIndex]
  const defender = opponentMembers?.find((m) => m.tag === attack.defenderTag)
  return {
    targetId: defender ? defender.mapPosition : '?',
    stars: attack.stars,
    percent: attack.destructionPercentage,
  }
}

const getThImageUrl = (thLevel: number) =>
  `https://www.clash.ninja/images/entities/1_${thLevel}.png`
</script>

<template>
  <div v-if="loading" class="flex flex-col items-center justify-center h-64 text-accent-amber">
    <Icon icon="lucide:loader-2" class="w-12 h-12 animate-spin mb-4" />
    <p class="text-lg font-semibold animate-pulse">Đang tải bản đồ chiến tranh...</p>
  </div>

  <div
    v-else-if="error || warType === 'none'"
    class="flex flex-col items-center justify-center h-64 bg-bg-surface rounded-xl border border-border-default shadow-lg"
  >
    <Icon icon="lucide:refresh-cw" class="w-16 h-16 text-text-muted mb-4" />
    <h2 class="text-xl font-display font-bold text-text-primary">Không có chiến tranh</h2>
    <p class="text-text-secondary">Clan hiện không tham gia chiến tranh.</p>
    <button
      @click="fetchWar(true)"
      class="mt-4 flex items-center text-accent-coral hover:underline font-bold"
    >
      <Icon icon="lucide:refresh-cw" class="mr-2" /> Làm mới
    </button>
  </div>

  <div v-else-if="currentWar" class="space-y-6">
    <div
      class="flex items-center justify-between bg-bg-surface border border-border-default rounded-lg px-4 py-2 shadow-sm"
    >
      <div class="flex items-center space-x-2 text-sm text-text-secondary">
        <Icon
          icon="lucide:refresh-cw"
          :class="isRefreshing ? 'animate-spin text-green-400' : 'text-text-muted'"
          class="w-4 h-4"
        />
        <span v-if="isRefreshing" class="text-green-400 font-semibold">Đang cập nhật...</span>
        <span v-else>Tự động cập nhật mỗi phút</span>
        <span
          v-if="warType === 'cwl'"
          class="ml-4 px-3 py-1 bg-purple-900/30 border border-purple-700/50 rounded-lg text-purple-300 font-bold text-xs flex items-center"
        >
          <Icon icon="lucide:trophy" class="mr-1" /> GIẢI ĐẤU HỘI CHIẾN
        </span>
      </div>
      <div class="text-xs text-text-muted">
        Cập nhật lần cuối: <span class="text-text-primary font-mono">{{ timeAgo }}</span>
      </div>
    </div>

    <!-- CWL Nav -->
    <div
      v-if="warType === 'cwl' && cwlGroup"
      class="flex items-center justify-center bg-bg-surface border border-purple-700/30 rounded-lg px-4 py-3 shadow-md"
    >
      <button
        @click="loadCwlRound(currentCwlRound - 1)"
        :disabled="currentCwlRound === 0"
        class="p-2 rounded-lg transition-all"
        :class="
          currentCwlRound > 0
            ? 'bg-bg-elevated hover:bg-bg-muted text-text-primary'
            : 'bg-transparent border border-border-default text-text-muted cursor-not-allowed'
        "
      >
        <Icon icon="lucide:chevron-left" class="w-5 h-5" />
      </button>
      <div class="mx-6 text-center">
        <div class="text-sm text-text-secondary">Ngày Chiến tranh</div>
        <div class="text-2xl font-bold text-text-primary">
          {{ currentCwlRound + 1 }} <span class="text-text-muted text-lg">trên</span>
          {{ totalRounds }}
        </div>
      </div>
      <button
        @click="loadCwlRound(currentCwlRound + 1)"
        :disabled="currentCwlRound >= totalRounds - 1"
        class="p-2 rounded-lg transition-all"
        :class="
          currentCwlRound < totalRounds - 1
            ? 'bg-bg-elevated hover:bg-bg-muted text-text-primary'
            : 'bg-transparent border border-border-default text-text-muted cursor-not-allowed'
        "
      >
        <Icon icon="lucide:chevron-right" class="w-5 h-5" />
      </button>
    </div>

    <!-- Perfect War -->
    <div
      v-if="isPerfectWar && currentWar.state !== 'preparation'"
      class="bg-gradient-to-r from-yellow-900/40 via-amber-800/40 to-yellow-900/40 border-2 border-accent-amber rounded-xl p-4 shadow-xl shadow-amber-900/20 animate-pulse"
    >
      <div class="flex items-center justify-center space-x-3">
        <Icon
          icon="lucide:star"
          class="text-accent-amber animate-[spin_3s_linear_infinite]"
          width="32"
        />
        <div class="text-center">
          <h2 class="text-xl font-black text-accent-amber uppercase tracking-wider">
            Chiến tranh hoàn hảo!
          </h2>
          <p class="text-sm text-yellow-200">
            Đã giành được tất cả {{ maxStars }} sao! Thành tích xuất sắc! 🎉
          </p>
        </div>
        <Icon
          icon="lucide:star"
          class="text-accent-amber animate-[spin_3s_linear_infinite]"
          width="32"
        />
      </div>
    </div>

    <!-- VS Dashboard -->
    <div
      class="bg-bg-surface rounded-xl p-6 shadow-lg border-2 transition-all relative overflow-hidden"
      :class="
        isPerfectWar && currentWar.state !== 'preparation'
          ? 'border-accent-amber shadow-amber-900/20'
          : warType === 'cwl'
            ? 'border-purple-700/50'
            : 'border-border-default'
      "
    >
      <div
        class="absolute inset-0 pointer-events-none opacity-20"
        :class="
          isPerfectWar && currentWar.state !== 'preparation'
            ? 'bg-gradient-to-r from-accent-amber to-transparent'
            : warType === 'cwl'
              ? 'bg-gradient-to-r from-purple-500 to-transparent'
              : 'bg-gradient-to-r from-blue-500 to-red-500'
        "
      ></div>

      <div class="flex flex-col md:flex-row justify-between items-center relative z-10">
        <div class="flex items-center space-x-4">
          <img :src="currentWar.clan.badgeUrls.medium" class="w-16 h-16 drop-shadow-lg" alt="Us" />
          <div>
            <div class="text-2xl font-bold text-text-primary">{{ currentWar.clan.name }}</div>
            <div class="text-green-400 font-bold text-3xl flex items-center">
              {{ myStars }}
              <Icon icon="lucide:star" class="w-4 h-4 ml-1 fill-current text-text-muted" />
            </div>
            <div class="text-sm text-text-secondary">
              {{ currentWar.clan.destructionPercentage.toFixed(2) }}% Phá hủy
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center mx-8 my-4 md:my-0">
          <div class="text-4xl font-black italic text-text-muted opacity-50 mb-2">VS</div>
          <div
            class="flex items-center bg-bg-elevated px-5 py-2 rounded-lg border border-border-default"
          >
            <Icon icon="lucide:timer" class="text-accent-amber w-5 h-5 mr-2 flex-shrink-0" />
            <div class="text-center">
              <div class="text-xs text-text-muted uppercase tracking-wider whitespace-nowrap">
                {{ timerLabel }}
              </div>
              <div class="text-xl font-mono font-bold text-white whitespace-nowrap min-w-[160px]">
                {{ timer }}
              </div>
            </div>
          </div>
          <div class="mt-2 text-xs text-text-muted font-mono">
            {{ currentWar.teamSize }} vs {{ currentWar.teamSize }}
          </div>
        </div>

        <div class="flex items-center space-x-4 flex-row-reverse md:flex-row">
          <div class="text-right md:text-left">
            <div class="text-2xl font-bold text-text-primary">{{ currentWar.opponent.name }}</div>
            <div
              class="text-red-400 font-bold text-3xl flex items-center justify-end md:justify-start"
            >
              {{ enemyStars }}
              <Icon icon="lucide:star" class="w-4 h-4 ml-1 fill-current text-text-muted" />
            </div>
            <div class="text-sm text-text-secondary">
              {{ currentWar.opponent.destructionPercentage.toFixed(2) }}% Phá hủy
            </div>
          </div>
          <img
            :src="currentWar.opponent.badgeUrls.medium"
            class="w-16 h-16 drop-shadow-lg ml-0 md:ml-4 mr-4 md:mr-0"
            alt="Them"
          />
        </div>
      </div>

      <div class="mt-8 grid grid-cols-2 gap-8 relative z-10">
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-text-primary font-semibold">
              <Icon icon="lucide:star" class="inline w-3 h-3 text-current" /> Sao: {{ myStars }}/{{
                maxStars
              }}
              <span class="text-text-muted text-[10px] ml-2"
                >({{ currentWar.clan.attacks || 0 }}/{{ currentWar.teamSize * 2 }} lượt đánh)</span
              >
            </span>
            <span
              class="font-bold"
              :class="myStars === maxStars ? 'text-accent-amber' : 'text-green-400'"
            >
              {{ maxStars ? Math.round((myStars / maxStars) * 100) : 0 }}%
            </span>
          </div>
          <div class="h-3 bg-bg-muted rounded-full overflow-hidden border border-border-default">
            <div
              class="h-full transition-all duration-1000"
              :class="
                myStars === maxStars
                  ? 'bg-gradient-to-r from-yellow-400 to-accent-amber'
                  : 'bg-green-500'
              "
              :style="{ width: `${maxStars ? (myStars / maxStars) * 100 : 0}%` }"
            ></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-text-primary font-semibold">
              <Icon icon="lucide:star" class="inline w-3 h-3 text-current" /> Sao:
              {{ enemyStars }}/{{ maxStars }}
              <span class="text-text-muted text-[10px] ml-2"
                >({{ currentWar.opponent.attacks || 0 }}/{{ currentWar.teamSize * 2 }} lượt
                đánh)</span
              >
            </span>
            <span
              class="font-bold"
              :class="enemyStars === maxStars ? 'text-accent-amber' : 'text-red-400'"
            >
              {{ maxStars ? Math.round((enemyStars / maxStars) * 100) : 0 }}%
            </span>
          </div>
          <div class="h-3 bg-bg-muted rounded-full overflow-hidden border border-border-default">
            <div
              class="h-full transition-all duration-1000"
              :class="
                enemyStars === maxStars
                  ? 'bg-gradient-to-r from-yellow-400 to-accent-amber'
                  : 'bg-red-500'
              "
              :style="{ width: `${maxStars ? (enemyStars / maxStars) * 100 : 0}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lineups -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Us -->
      <div class="bg-bg-surface p-4 rounded-xl border border-border-default shadow-lg">
        <h3 class="text-lg font-bold text-text-primary mb-4 flex items-center">
          <Icon icon="lucide:swords" class="mr-2 text-green-400" /> Đội hình của chúng ta
        </h3>
        <div class="flex flex-col space-y-2">
          <template
            v-for="member in [...currentWar.clan.members].sort(
              (a, b) => a.mapPosition - b.mapPosition,
            )"
            :key="member.tag"
          >
            <div
              class="relative flex items-center bg-bg-elevated border border-border-default rounded-lg p-2 shadow-sm hover:shadow-md transition-all"
            >
              <div class="flex items-center w-1/3 min-w-[140px]">
                <div class="relative mr-3 w-10 h-10 flex-shrink-0">
                  <img
                    :src="getThImageUrl(member.townhallLevel)"
                    class="w-full h-full object-contain"
                    @error="
                      (e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }
                    "
                  />
                  <div
                    class="absolute -top-1 -left-1 w-4 h-4 flex items-center justify-center bg-black/80 text-white text-[10px] font-bold rounded-full border border-border-muted font-mono"
                  >
                    {{ member.mapPosition }}
                  </div>
                  <div
                    class="absolute -bottom-1 -right-1 px-1 bg-black/60 text-white text-[8px] font-bold rounded border border-border-muted backdrop-blur-sm"
                  >
                    TH{{ member.townhallLevel }}
                  </div>
                </div>
                <div class="overflow-hidden">
                  <button
                    @click="$emit('memberClick', member.tag)"
                    class="font-bold text-sm truncate text-left block w-full text-text-primary hover:text-accent-amber"
                  >
                    {{ member.name }}
                  </button>
                  <div class="text-[10px] text-text-muted truncate">{{ member.tag }}</div>
                </div>
              </div>
              <div class="flex-1 px-2 space-y-1">
                <template v-for="idx in [0, 1]" :key="idx">
                  <div
                    v-if="getAttackInfo(member, idx, currentWar.opponent.members)"
                    class="flex justify-between items-center px-2 py-1 rounded text-xs border-2 transition-all"
                    :class="
                      getAttackInfo(member, idx, currentWar.opponent.members)?.stars === 3
                        ? 'bg-amber-900/10 border-accent-amber/50'
                        : 'bg-bg-muted border-border-default'
                    "
                  >
                    <div class="flex items-center space-x-2">
                      <span class="text-text-muted font-mono font-bold"
                        >#{{
                          getAttackInfo(member, idx, currentWar.opponent.members)?.targetId
                        }}</span
                      >
                      <span
                        class="font-bold flex items-center"
                        :class="
                          getAttackInfo(member, idx, currentWar.opponent.members)?.stars === 3
                            ? 'text-accent-amber'
                            : 'text-text-secondary'
                        "
                      >
                        {{ getAttackInfo(member, idx, currentWar.opponent.members)?.stars }}
                        <Icon icon="lucide:star" class="ml-0.5 fill-current w-3 h-3" />
                      </span>
                    </div>
                    <div
                      :class="
                        getAttackInfo(member, idx, currentWar.opponent.members)?.percent === 100
                          ? 'text-green-400'
                          : 'text-text-muted'
                      "
                    >
                      {{ getAttackInfo(member, idx, currentWar.opponent.members)?.percent }}%
                    </div>
                  </div>
                  <div
                    v-else
                    class="flex justify-between items-center bg-bg-muted px-2 py-1 rounded text-xs text-text-muted border-2 border-transparent"
                  >
                    <span>Đánh {{ idx + 1 }}</span>
                    <span>--</span>
                  </div>
                </template>
              </div>
              <div class="w-16 text-right pl-2 border-l border-border-default ml-2">
                <div class="text-[10px] text-text-muted uppercase text-center mb-0.5">Def</div>
                <div class="flex flex-col items-center justify-center">
                  <span
                    v-if="member.opponentAttacks > 0"
                    class="text-xs font-bold text-white bg-bg-muted px-1.5 rounded"
                  >
                    {{ member.opponentAttacks }}
                    <span class="font-normal text-text-muted text-[9px]">lượt</span>
                  </span>
                  <span v-else class="text-xs text-text-muted">-</span>
                  <div v-if="member.bestOpponentAttack" class="flex items-center mt-1 text-xs">
                    <span
                      :class="
                        member.bestOpponentAttack.stars === 3 ? 'text-red-400' : 'text-text-muted'
                      "
                    >
                      {{ member.bestOpponentAttack.stars
                      }}<Icon icon="lucide:star" class="inline w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Enemy Lineup -->
      <div class="bg-bg-surface p-4 rounded-xl border border-border-default shadow-lg">
        <h3 class="text-lg font-bold text-text-primary mb-4 flex items-center justify-end">
          Đội hình đối thủ <Icon icon="lucide:skull" class="ml-2 text-red-400" />
        </h3>
        <div class="flex flex-col space-y-2">
          <template
            v-for="member in [...currentWar.opponent.members].sort(
              (a, b) => a.mapPosition - b.mapPosition,
            )"
            :key="member.tag"
          >
            <div
              class="relative flex items-center bg-bg-elevated border border-red-900/20 rounded-lg p-2 shadow-sm hover:shadow-md transition-all"
            >
              <div class="flex items-center w-1/3 min-w-[140px]">
                <div class="relative mr-3 w-10 h-10 flex-shrink-0">
                  <img
                    :src="getThImageUrl(member.townhallLevel)"
                    class="w-full h-full object-contain"
                    @error="
                      (e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }
                    "
                  />
                  <div
                    class="absolute -top-1 -left-1 w-4 h-4 flex items-center justify-center bg-black/80 text-white text-[10px] font-bold rounded-full border border-border-muted font-mono"
                  >
                    {{ member.mapPosition }}
                  </div>
                  <div
                    class="absolute -bottom-1 -right-1 px-1 bg-black/60 text-white text-[8px] font-bold rounded border border-border-muted backdrop-blur-sm"
                  >
                    TH{{ member.townhallLevel }}
                  </div>
                </div>
                <div class="overflow-hidden">
                  <button
                    @click="$emit('memberClick', member.tag)"
                    class="font-bold text-sm truncate text-left block w-full text-red-400 hover:text-red-300"
                  >
                    {{ member.name }}
                  </button>
                  <div class="text-[10px] text-text-muted truncate">{{ member.tag }}</div>
                </div>
              </div>
              <div class="flex-1 px-2 space-y-1">
                <template v-for="idx in [0, 1]" :key="idx">
                  <div
                    v-if="getAttackInfo(member, idx, currentWar.clan.members)"
                    class="flex justify-between items-center px-2 py-1 rounded text-xs border-2 transition-all bg-bg-muted border-border-default"
                  >
                    <div class="flex items-center space-x-2">
                      <span class="text-text-muted font-mono font-bold"
                        >#{{ getAttackInfo(member, idx, currentWar.clan.members)?.targetId }}</span
                      >
                      <span
                        class="font-bold flex items-center"
                        :class="
                          getAttackInfo(member, idx, currentWar.clan.members)?.stars === 3
                            ? 'text-accent-amber'
                            : 'text-text-secondary'
                        "
                      >
                        {{ getAttackInfo(member, idx, currentWar.clan.members)?.stars }}
                        <Icon icon="lucide:star" class="ml-0.5 fill-current w-3 h-3" />
                      </span>
                    </div>
                    <div
                      :class="
                        getAttackInfo(member, idx, currentWar.clan.members)?.percent === 100
                          ? 'text-green-400'
                          : 'text-text-muted'
                      "
                    >
                      {{ getAttackInfo(member, idx, currentWar.clan.members)?.percent }}%
                    </div>
                  </div>
                  <div
                    v-else
                    class="flex justify-between items-center bg-bg-muted px-2 py-1 rounded text-xs text-text-muted border-2 border-transparent"
                  >
                    <span>Đánh {{ idx + 1 }}</span>
                    <span>--</span>
                  </div>
                </template>
              </div>
              <div class="w-16 text-right pl-2 border-l border-border-default ml-2">
                <div class="text-[10px] text-text-muted uppercase text-center mb-0.5">Def</div>
                <div class="flex flex-col items-center justify-center">
                  <span
                    v-if="member.opponentAttacks > 0"
                    class="text-xs font-bold text-white bg-bg-muted px-1.5 rounded"
                  >
                    {{ member.opponentAttacks }}
                    <span class="font-normal text-text-muted text-[9px]">lượt</span>
                  </span>
                  <span v-else class="text-xs text-text-muted">-</span>
                  <div v-if="member.bestOpponentAttack" class="flex items-center mt-1 text-xs">
                    <span
                      :class="
                        member.bestOpponentAttack.stars === 3 ? 'text-red-400' : 'text-text-muted'
                      "
                    >
                      {{ member.bestOpponentAttack.stars
                      }}<Icon icon="lucide:star" class="inline w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
