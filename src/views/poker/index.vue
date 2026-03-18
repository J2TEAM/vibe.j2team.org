<script setup lang="ts">
import { ref } from 'vue'
import type { LobbyConfig, FriendsConfig, PlayerAction } from './types'
import { usePokerGame } from './composables/use-poker-game'
import LobbyView from './components/LobbyView.vue'
import RulesView from './components/RulesView.vue'
import PokerTable from './components/PokerTable.vue'
import FriendsTable from './components/FriendsTable.vue'

type AppScreen = 'lobby' | 'rules' | 'bot-game' | 'friends-game'

const screen = ref<AppScreen>('lobby')
const friendsConfig = ref<FriendsConfig | null>(null)
const friendsKey = ref(0)

const game = usePokerGame()

function handleStartSolo(config: LobbyConfig) {
  game.initGame(config)
  screen.value = 'bot-game'
  game.startHand()
}

function handleStartFriends(config: FriendsConfig) {
  friendsConfig.value = config
  friendsKey.value++
  screen.value = 'friends-game'
}

function handleAction(action: PlayerAction) {
  const player = game.state.players.find((p) => p.id === game.localPlayerId.value)
  if (player) game.applyAction(player.id, action)
}

function handleNewHand() {
  game.startHand()
}

function handleLeave() {
  screen.value = 'lobby'
}
</script>

<template>
  <div class="h-screen overflow-hidden bg-bg-deep flex flex-col">
    <LobbyView
      v-if="screen === 'lobby'"
      class="flex-1 min-h-0"
      @start-solo="handleStartSolo"
      @start-friends="handleStartFriends"
      @open-rules="screen = 'rules'"
    />

    <RulesView v-else-if="screen === 'rules'" class="flex-1 min-h-0" @back="screen = 'lobby'" />

    <PokerTable
      v-else-if="screen === 'bot-game'"
      class="flex-1 min-h-0"
      :state="game.state"
      :local-player-id="game.localPlayerId.value"
      :is-my-turn="game.isMyTurn.value"
      @action="handleAction"
      @new-hand="handleNewHand"
      @leave="handleLeave"
    />

    <FriendsTable
      v-else-if="screen === 'friends-game' && friendsConfig"
      :key="friendsKey"
      class="flex-1 min-h-0"
      :config="friendsConfig"
      @leave="handleLeave"
    />
  </div>
</template>
