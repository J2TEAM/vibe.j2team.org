<script setup lang="ts">
import GameContainer from './components/GameContainer.vue'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Digits Packing Puzzle - J2TEAM Vibe',
  meta: [
    {
      name: 'description',
      content:
        'Xếp hình số từ 0-9 trên bảng 5x4 với các đoạn thẳng 7-segment display. Game puzzle thú vị với drag-and-drop và xoay pieces.',
    },
  ],
})
</script>

<template>
  <GameContainer />
</template>
