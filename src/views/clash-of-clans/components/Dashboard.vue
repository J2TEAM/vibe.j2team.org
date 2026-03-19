<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({
  name: 'ClanDashboard',
})
import { Icon } from '@iconify/vue'
import type { ClanDetails, WarLogEntry } from '../types'

const props = defineProps<{
  clan: ClanDetails
  warLog: WarLogEntry[]
}>()

const winRate = computed(() => {
  if (props.warLog && props.warLog.length > 0) {
    const wins = props.warLog.filter((w) => w.result === 'win').length
    return Math.round((wins / props.warLog.length) * 100)
  }
  return 0
})

const donationData = computed(() => {
  return [...(props.clan.memberList || [])]
    .sort((a, b) => (b.donations || 0) - (a.donations || 0))
    .slice(0, 5)
    .map((m, index) => ({
      name: m.name,
      donations: m.donations || 0,
      rank: index + 1,
    }))
})

const maxDonations = computed(() => {
  return Math.max(...donationData.value.map((d) => d.donations), 1)
})

const totalDonations = computed(() => {
  return (props.clan.memberList || []).reduce((sum, m) => sum + (m.donations || 0), 0)
})

const totalReceived = computed(() => {
  return (props.clan.memberList || []).reduce((sum, m) => sum + (m.donationsReceived || 0), 0)
})

const avgDonations = computed(() => {
  return props.clan.members > 0 ? Math.round(totalDonations.value / props.clan.members) : 0
})

const clanPoints = computed(() =>
  typeof props.clan.clanPoints === 'number' ? props.clan.clanPoints.toLocaleString() : '0',
)
const versusPoints = computed(() =>
  typeof props.clan.clanVersusPoints === 'number'
    ? props.clan.clanVersusPoints.toLocaleString()
    : undefined,
)

const expandedWarIndex = ref<number | null>(null)

const toggleWar = (idx: number) => {
  if (expandedWarIndex.value === idx) expandedWarIndex.value = null
  else expandedWarIndex.value = idx
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  if (dateString.length === 20 && dateString.charAt(8) === 'T') {
    const year = dateString.substring(0, 4)
    const month = dateString.substring(4, 6)
    const day = dateString.substring(6, 8)
    const isoDate = `${year}-${month}-${day}`
    return new Date(isoDate).toLocaleDateString()
  }
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8 bg-bg-surface p-6 rounded-2xl border border-border-default shadow-lg"
    >
      <div class="flex items-center space-x-4">
        <img :src="clan.badgeUrls?.medium" :alt="clan.name" class="w-20 h-20 drop-shadow-lg" />
        <div>
          <h2 class="text-3xl font-display font-bold text-text-primary tracking-tight">
            {{ clan.name }}
          </h2>
          <p class="text-text-secondary font-mono">{{ clan.tag }} • Level {{ clan.clanLevel }}</p>
          <p class="text-sm text-text-muted mt-1 max-w-2xl">{{ clan.description }}</p>
        </div>
      </div>
      <div>
        <a
          :href="`https://link.clashofclans.com/en?action=OpenClanProfile&tag=${clan.tag.replace('#', '')}`"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center px-5 py-2.5 bg-accent-coral hover:bg-opacity-90 text-white rounded-xl font-bold transition-all shadow-lg shadow-coral-900/20"
        >
          <Icon icon="lucide:external-link" class="mr-2" />
          Xem trong game
        </a>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-bg-surface border border-border-default rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-text-secondary text-sm font-medium uppercase tracking-wider">
            Tổng điểm
          </h3>
          <Icon icon="lucide:trophy" class="text-accent-amber w-6 h-6" />
        </div>
        <div class="text-3xl font-bold text-text-primary">{{ clanPoints }}</div>
        <div v-if="versusPoints" class="text-xs text-text-muted mt-2">
          Hội chiến: {{ versusPoints }}
        </div>
      </div>

      <div class="bg-bg-surface border border-border-default rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-text-secondary text-sm font-medium uppercase tracking-wider">
            Thành viên
          </h3>
          <Icon icon="lucide:users" class="text-accent-sky w-6 h-6" />
        </div>
        <div class="text-3xl font-bold text-text-primary">{{ clan.members }}/50</div>
      </div>

      <div class="bg-bg-surface border border-border-default rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-text-secondary text-sm font-medium uppercase tracking-wider">
            Chuỗi thắng
          </h3>
          <Icon icon="lucide:sword" class="text-red-500 w-6 h-6" />
        </div>
        <div class="text-3xl font-bold text-text-primary">{{ clan.warWinStreak }}</div>
      </div>

      <div class="bg-bg-surface border border-border-default rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-text-secondary text-sm font-medium uppercase tracking-wider">
            Tỉ lệ thắng gần đây
          </h3>
          <Icon icon="lucide:trending-up" class="text-green-500 w-6 h-6" />
        </div>
        <div class="text-3xl font-bold text-text-primary">{{ winRate }}%</div>
        <div class="text-xs text-text-muted mt-2">Các trận chiến gần nhất</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top Donors -->
      <div class="bg-bg-surface border border-border-default rounded-xl p-6 shadow-lg">
        <h3 class="text-xl font-bold text-text-primary mb-6 flex items-center">
          <Icon icon="lucide:shield" class="w-5 h-5 mr-2 text-accent-amber" /> Đóng góp nhiều nhất
        </h3>
        <div class="space-y-3 mb-6">
          <div v-for="(item, idx) in donationData" :key="item.name" class="flex items-center">
            <span class="w-6 text-sm font-bold text-text-muted">#{{ item.rank }}</span>
            <span class="w-24 text-sm truncate text-text-secondary">{{ item.name }}</span>
            <div class="flex-1 ml-4 h-4 bg-bg-elevated rounded overflow-hidden">
              <div
                class="h-full rounded transition-all duration-500"
                :class="[
                  idx === 0
                    ? 'bg-yellow-500'
                    : idx === 1
                      ? 'bg-slate-400'
                      : idx === 2
                        ? 'bg-amber-600'
                        : 'bg-bg-muted',
                ]"
                :style="`width: ${(item.donations / maxDonations) * 100}%`"
              ></div>
            </div>
            <span class="ml-4 w-12 text-right text-sm font-mono font-bold">{{
              item.donations
            }}</span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 py-4 border-t border-border-default">
          <div class="bg-bg-elevated rounded-lg p-2.5 border border-border-muted text-center">
            <div class="text-[10px] text-text-muted uppercase mb-0.5">Tổng đã cho</div>
            <div class="text-lg font-bold text-accent-amber">
              {{ totalDonations.toLocaleString() }}
            </div>
          </div>
          <div class="bg-bg-elevated rounded-lg p-2.5 border border-border-muted text-center">
            <div class="text-[10px] text-text-muted uppercase mb-0.5">Tổng đã nhận</div>
            <div class="text-lg font-bold text-green-400">{{ totalReceived.toLocaleString() }}</div>
          </div>
          <div class="bg-bg-elevated rounded-lg p-2.5 border border-border-muted text-center">
            <div class="text-[10px] text-text-muted uppercase mb-0.5">Trung bình</div>
            <div class="text-lg font-bold text-accent-sky">{{ avgDonations.toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <!-- War Log -->
      <div
        class="bg-bg-surface border border-border-default rounded-xl p-6 shadow-lg overflow-hidden"
      >
        <h3 class="text-xl font-bold text-text-primary mb-6 flex items-center">
          <Icon icon="lucide:sword" class="w-5 h-5 mr-2 text-red-500" /> Lịch sử chiến đấu
        </h3>
        <div class="space-y-3">
          <div
            v-for="(war, idx) in warLog.slice(0, 10)"
            :key="idx"
            class="bg-bg-elevated rounded-lg border border-border-default overflow-hidden transition-all"
          >
            <div
              class="flex items-center justify-between p-3 cursor-pointer hover:bg-bg-muted transition-colors"
              @click="toggleWar(idx)"
            >
              <div class="flex items-center space-x-3">
                <div
                  class="w-1.5 h-12 rounded-full"
                  :class="
                    war.result === 'win'
                      ? 'bg-green-500'
                      : war.result === 'lose'
                        ? 'bg-red-500'
                        : 'bg-slate-500'
                  "
                ></div>
                <div>
                  <div class="font-semibold text-text-primary text-sm">{{ war.opponent.name }}</div>
                  <div class="text-xs text-text-muted">
                    {{ formatDate(war.endTime) }} • {{ war.teamSize }}v{{ war.teamSize }}
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-3">
                <div class="text-right mr-2">
                  <div class="text-sm font-bold font-mono">
                    <span class="text-green-400">{{ war.clan.stars }}</span>
                    <span class="text-text-muted mx-1">-</span>
                    <span class="text-red-400">{{ war.opponent.stars }}</span>
                  </div>
                  <div class="text-[10px] text-text-muted text-right">
                    {{ war.clan.destructionPercentage.toFixed(1) }}%
                  </div>
                </div>
                <Icon
                  :icon="expandedWarIndex === idx ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                  class="text-text-muted"
                />
              </div>
            </div>

            <div
              v-if="expandedWarIndex === idx"
              class="p-4 border-t border-border-default text-sm bg-bg-deep/50 animate-fade-up animate-duration-200"
            >
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-bg-surface p-2 rounded border border-border-default">
                  <div class="text-xs text-text-secondary uppercase mb-1">
                    Clan của tôi (Lvl {{ war.clan.clanLevel }})
                  </div>
                  <div class="flex justify-between items-end">
                    <div class="text-green-400 font-bold text-lg">
                      {{ war.clan.stars }}
                      <span class="text-xs text-text-muted font-normal">Sao</span>
                    </div>
                    <div class="text-text-secondary text-xs">
                      {{ war.clan.attacks }} <span class="text-text-muted">/</span>
                      {{ war.teamSize * 2 }} Lượt đánh
                    </div>
                  </div>
                </div>
                <div class="bg-bg-surface p-2 rounded border border-border-default">
                  <div class="text-xs text-text-secondary uppercase mb-1">
                    Đối thủ (Lvl {{ war.opponent.clanLevel }})
                  </div>
                  <div class="flex justify-between items-end">
                    <div class="text-red-400 font-bold text-lg">
                      {{ war.opponent.stars }}
                      <span class="text-xs text-text-muted font-normal">Sao</span>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="flex justify-between items-center text-xs text-text-muted border-t border-border-default pt-2"
              >
                <span
                  >XP Nhận được:
                  <span class="text-accent-amber font-bold">{{ war.clan.expEarned }}</span></span
                >
                <span
                  >Kết quả:
                  <span
                    class="uppercase font-bold"
                    :class="war.result === 'win' ? 'text-green-500' : 'text-red-500'"
                    >{{ war.result || 'N/A' }}</span
                  ></span
                >
              </div>
            </div>
          </div>
          <div v-if="!warLog || warLog.length === 0" class="text-text-muted text-center py-8">
            Nhật ký chiến tranh đang bị ẩn hoặc trống.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
