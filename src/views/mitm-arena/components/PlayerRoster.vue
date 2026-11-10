<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { RoomView } from '../types'

const props = defineProps<{ view: RoomView; busy: boolean; isHost: boolean }>()
const emit = defineEmits<{ ready: []; start: [] }>()
const self = computed(() => props.view.players.find((player) => player.id === props.view.selfId))
const canStart = computed(
  () =>
    props.view.players.length === 3 &&
    props.view.players.every((player) => player.connected && player.ready),
)
const roleNames = { A: 'Người gửi', B: 'Người nhận', C: 'Người đứng giữa' }
</script>

<template>
  <section
    class="border border-border-default bg-bg-surface p-5 sm:p-7"
    aria-labelledby="roster-title"
  >
    <div class="mb-5 flex items-center justify-between gap-3">
      <h2 id="roster-title" class="font-display text-xl font-semibold">
        <span class="mr-2 text-accent-amber">//</span>Người cùng bàn
      </h2>
      <span class="font-mono text-xs text-text-secondary"
        >{{ view.players.filter((player) => player.connected).length }}/3</span
      >
    </div>
    <div class="space-y-3">
      <div
        v-for="player in view.players"
        :key="player.id"
        class="flex items-center gap-3 border border-border-default p-3"
        :class="player.id === view.selfId ? 'border-l-2 border-l-accent-coral' : ''"
      >
        <span
          class="flex size-10 shrink-0 items-center justify-center bg-bg-elevated font-display text-xl font-bold"
          :class="player.role === 'C' ? 'text-accent-amber' : 'text-accent-sky'"
          >{{ player.role }}</span
        >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">
            {{ player.name || 'Đang chờ người chơi'
            }}<span
              v-if="player.id === view.selfId"
              class="ml-1 text-xs font-normal text-accent-coral"
              >(bạn)</span
            ><span v-if="player.id === 'p0'" class="ml-1 text-xs font-normal text-text-secondary"
              >· chủ phòng</span
            >
          </p>
          <p class="mt-1 text-xs text-text-secondary">{{ roleNames[player.role] }}</p>
        </div>
        <div class="shrink-0 text-right">
          <p
            v-if="view.phase === 'lobby'"
            class="text-xs"
            :class="player.connected && player.ready ? 'text-accent-sky' : 'text-text-secondary'"
          >
            {{ !player.connected ? 'Chưa kết nối' : player.ready ? 'Sẵn sàng' : 'Đang chuẩn bị' }}
          </p>
          <p v-else class="font-display text-lg text-accent-amber">
            {{ player.score }}<span class="ml-1 font-body text-xs text-text-secondary">điểm</span>
          </p>
          <Icon
            v-if="player.connected"
            icon="lucide:wifi"
            class="mt-1 ml-auto size-3 text-accent-sky"
            aria-label="Đang kết nối"
          />
          <Icon
            v-else
            icon="lucide:wifi-off"
            class="mt-1 ml-auto size-3 text-text-dim"
            aria-label="Chưa kết nối"
          />
        </div>
      </div>
    </div>
    <div v-if="view.phase === 'lobby'" class="mt-5 space-y-3">
      <button
        type="button"
        data-testid="ready"
        :disabled="busy"
        class="w-full border px-4 py-3 text-sm font-semibold transition hover:bg-bg-elevated disabled:opacity-40"
        :class="
          self?.ready
            ? 'border-accent-sky text-accent-sky'
            : 'border-accent-amber text-accent-amber'
        "
        @click="emit('ready')"
      >
        <Icon
          :icon="self?.ready ? 'lucide:check' : 'lucide:hand'"
          class="mr-2 inline size-4"
          aria-hidden="true"
        />{{ self?.ready ? 'Đã sẵn sàng · nhấn để hủy' : 'Tôi đã sẵn sàng' }}
      </button>
      <button
        v-if="isHost"
        type="button"
        data-testid="start-game"
        :disabled="busy || !canStart"
        class="w-full bg-accent-coral px-4 py-3 text-sm font-semibold text-bg-deep transition hover:bg-accent-amber disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('start')"
      >
        Bắt đầu ván chơi
      </button>
      <p class="text-xs leading-relaxed text-text-secondary">
        {{
          canStart
            ? isHost
              ? 'Đủ 3 người sẵn sàng. Bạn có thể bắt đầu.'
              : 'Cả bàn đã sẵn sàng. Đợi chủ phòng bắt đầu.'
            : 'Cần đủ 3 người kết nối và cùng nhấn sẵn sàng.'
        }}
      </p>
    </div>
  </section>
</template>
