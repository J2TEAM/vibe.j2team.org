<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import type { Card, Rank, Suit } from '../types'
import PlayingCard from './PlayingCard.vue'

defineEmits<{ back: [] }>()

type Tab = 'how' | 'hands'
const activeTab = ref<Tab>('how')

function c(rank: Rank, suit: Suit): Card {
  return { rank, suit }
}

const HAND_RANKINGS = [
  {
    name: 'Royal Flush',
    vi: 'Thùng Phá Sảnh Hoàng Gia',
    desc: '5 lá cùng chất từ 10 đến A',
    cards: [c(14, 'spades'), c(13, 'spades'), c(12, 'spades'), c(11, 'spades'), c(10, 'spades')],
  },
  {
    name: 'Straight Flush',
    vi: 'Thùng Phá Sảnh',
    desc: '5 lá cùng chất liên tiếp',
    cards: [c(9, 'hearts'), c(8, 'hearts'), c(7, 'hearts'), c(6, 'hearts'), c(5, 'hearts')],
  },
  {
    name: 'Four of a Kind',
    vi: 'Tứ Quý',
    desc: '4 lá cùng giá trị',
    cards: [c(13, 'clubs'), c(13, 'spades'), c(13, 'hearts'), c(13, 'diamonds'), c(7, 'clubs')],
  },
  {
    name: 'Full House',
    vi: 'Cù Lũ',
    desc: '3 lá + 2 lá cùng giá trị',
    cards: [c(12, 'spades'), c(12, 'hearts'), c(12, 'clubs'), c(9, 'spades'), c(9, 'hearts')],
  },
  {
    name: 'Flush',
    vi: 'Thùng',
    desc: '5 lá cùng chất',
    cards: [
      c(14, 'diamonds'),
      c(11, 'diamonds'),
      c(8, 'diamonds'),
      c(6, 'diamonds'),
      c(3, 'diamonds'),
    ],
  },
  {
    name: 'Straight',
    vi: 'Sảnh',
    desc: '5 lá liên tiếp',
    cards: [c(10, 'clubs'), c(9, 'hearts'), c(8, 'spades'), c(7, 'diamonds'), c(6, 'clubs')],
  },
  {
    name: 'Three of a Kind',
    vi: 'Tam Quý (Xám)',
    desc: '3 lá cùng giá trị',
    cards: [c(8, 'spades'), c(8, 'hearts'), c(8, 'clubs'), c(13, 'diamonds'), c(4, 'spades')],
  },
  {
    name: 'Two Pair',
    vi: 'Hai Đôi',
    desc: '2 cặp đôi',
    cards: [c(11, 'hearts'), c(11, 'clubs'), c(5, 'spades'), c(5, 'diamonds'), c(14, 'clubs')],
  },
  {
    name: 'One Pair',
    vi: 'Một Đôi',
    desc: '1 cặp đôi',
    cards: [c(10, 'spades'), c(10, 'hearts'), c(14, 'clubs'), c(8, 'diamonds'), c(4, 'spades')],
  },
  {
    name: 'High Card',
    vi: 'Bài Cao',
    desc: 'Lá bài cao nhất',
    cards: [c(14, 'hearts'), c(13, 'clubs'), c(9, 'spades'), c(7, 'diamonds'), c(3, 'clubs')],
  },
]
</script>

<template>
  <div class="h-full bg-bg-deep text-text-primary font-body flex flex-col overflow-hidden">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-2.5 border-b border-border-default bg-bg-surface flex-shrink-0"
    >
      <button
        class="flex items-center gap-1.5 text-text-dim hover:text-text-primary transition-colors text-sm"
        @click="$emit('back')"
      >
        <Icon icon="lucide:arrow-left" class="size-4" />
        Quay lại
      </button>
      <span class="font-display font-bold text-base text-text-primary">Luật chơi</span>
      <div class="w-16" />
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-border-default flex-shrink-0">
      <button
        :class="[
          'flex-1 py-2.5 text-sm font-display font-semibold transition-colors border-b-2',
          activeTab === 'how'
            ? 'border-accent-coral text-accent-coral'
            : 'border-transparent text-text-dim hover:text-text-secondary',
        ]"
        @click="activeTab = 'how'"
      >
        <Icon icon="lucide:book-open" class="size-4 inline mr-1" />
        Cách chơi
      </button>
      <button
        :class="[
          'flex-1 py-2.5 text-sm font-display font-semibold transition-colors border-b-2',
          activeTab === 'hands'
            ? 'border-accent-amber text-accent-amber'
            : 'border-transparent text-text-dim hover:text-text-secondary',
        ]"
        @click="activeTab = 'hands'"
      >
        <Icon icon="lucide:layers" class="size-4 inline mr-1" />
        Xếp hạng tay bài
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <!-- TAB: How to Play -->
      <div v-if="activeTab === 'how'" class="px-4 py-4 space-y-5 max-w-lg mx-auto">
        <div>
          <h3 class="font-display text-sm font-bold text-accent-coral mb-2">// MỤC TIÊU</h3>
          <p class="text-text-secondary text-sm leading-relaxed">
            Ghép <strong class="text-text-primary">5 lá bài tốt nhất</strong> từ 7 lá (2 lá riêng +
            5 lá chung) để thắng pot.
          </p>
        </div>

        <div>
          <h3 class="font-display text-sm font-bold text-accent-coral mb-2">// VÒNG CHƠI</h3>
          <div class="space-y-3">
            <div class="flex gap-3">
              <span class="text-accent-amber font-display font-bold text-xs min-w-16 pt-0.5"
                >PRE-FLOP</span
              >
              <p class="text-text-secondary text-sm">
                Mỗi người nhận 2 lá bài riêng (hole cards). SB và BB đặt cược bắt buộc. Vòng cược
                đầu tiên.
              </p>
            </div>
            <div class="flex gap-3">
              <span class="text-accent-amber font-display font-bold text-xs min-w-16 pt-0.5"
                >FLOP</span
              >
              <p class="text-text-secondary text-sm">Mở 3 lá bài chung. Vòng cược thứ 2.</p>
            </div>
            <div class="flex gap-3">
              <span class="text-accent-amber font-display font-bold text-xs min-w-16 pt-0.5"
                >TURN</span
              >
              <p class="text-text-secondary text-sm">
                Mở thêm 1 lá chung (tổng 4). Vòng cược thứ 3.
              </p>
            </div>
            <div class="flex gap-3">
              <span class="text-accent-amber font-display font-bold text-xs min-w-16 pt-0.5"
                >RIVER</span
              >
              <p class="text-text-secondary text-sm">
                Mở lá chung cuối (tổng 5). Vòng cược cuối cùng.
              </p>
            </div>
            <div class="flex gap-3">
              <span class="text-accent-amber font-display font-bold text-xs min-w-16 pt-0.5"
                >SHOWDOWN</span
              >
              <p class="text-text-secondary text-sm">
                So bài. Người có tay bài mạnh nhất thắng pot.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-display text-sm font-bold text-accent-coral mb-2">// HÀNH ĐỘNG</h3>
          <div class="space-y-2">
            <div class="flex items-start gap-2">
              <span class="text-accent-sky font-display font-bold text-xs min-w-14">Fold</span>
              <span class="text-text-secondary text-sm">Bỏ bài, mất cược đã đặt</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-accent-sky font-display font-bold text-xs min-w-14">Check</span>
              <span class="text-text-secondary text-sm">Qua lượt (chỉ khi không ai đặt cược)</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-accent-sky font-display font-bold text-xs min-w-14">Call</span>
              <span class="text-text-secondary text-sm">Theo cược hiện tại</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-accent-sky font-display font-bold text-xs min-w-14">Raise</span>
              <span class="text-text-secondary text-sm"
                >Tăng cược, buộc người khác phải theo hoặc bỏ</span
              >
            </div>
            <div class="flex items-start gap-2">
              <span class="text-accent-sky font-display font-bold text-xs min-w-14">All-in</span>
              <span class="text-text-secondary text-sm">Đặt tất cả chips còn lại</span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-display text-sm font-bold text-accent-coral mb-2">// BLINDS</h3>
          <p class="text-text-secondary text-sm leading-relaxed">
            <strong class="text-text-primary">Small Blind (SB)</strong> — người bên trái dealer đặt
            cược bắt buộc nhỏ.
            <br />
            <strong class="text-text-primary">Big Blind (BB)</strong> — người tiếp theo đặt gấp đôi
            SB.
            <br />
            Dealer button xoay theo chiều kim đồng hồ sau mỗi ván.
          </p>
        </div>
      </div>

      <!-- TAB: Hand Rankings -->
      <div v-if="activeTab === 'hands'" class="px-4 py-4 max-w-lg mx-auto">
        <p class="text-text-dim text-xs font-body mb-3">Từ mạnh nhất đến yếu nhất:</p>
        <div class="space-y-1">
          <div
            v-for="(hand, idx) in HAND_RANKINGS"
            :key="idx"
            class="flex items-center gap-3 px-3 py-2.5 border border-border-default bg-bg-surface"
          >
            <span
              class="text-accent-coral font-display font-bold text-sm w-5 text-right shrink-0"
              >{{ idx + 1 }}</span
            >
            <div class="flex gap-0.5 shrink-0">
              <PlayingCard v-for="(card, ci) in hand.cards" :key="ci" :card="card" small />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-display text-sm font-bold text-text-primary">{{ hand.vi }}</div>
              <div class="text-text-dim text-xs font-body">{{ hand.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
