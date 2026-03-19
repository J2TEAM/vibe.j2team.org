import { computed, onMounted, ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type {
  DayRecord,
  DeathRecord,
  Faction,
  GameHistory,
  GamePhase,
  NightRecord,
  NightStep,
  NightUiState,
  Player,
  RoleConfig,
  RoleId,
  TimeConfig,
} from './types'
import { NIGHT_CALL, NIGHT_ORDER, NIGHT_SLEEP, ROLE_STEP_MAP } from './types'

// ── Module-level pause flag ────────────────────────────────────────────────
let _isPaused = false

// ── Module-level night abort ID ───────────────────────────────────────────
let _currentNightId = 0

// ── Module-level speech settings (synced from useGame reactive state) ─────
let _speechRate = 0.9
let _voiceURI = ''

// ── Speech ────────────────────────────────────────────────────────────────────
function speakNow(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve()
      return
    }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'vi-VN'
    utter.rate = _speechRate
    const voices = window.speechSynthesis.getVoices()
    const voice = _voiceURI
      ? (voices.find((v) => v.voiceURI === _voiceURI) ??
        voices.find((v) => v.lang.startsWith('vi')))
      : voices.find((v) => v.lang.startsWith('vi'))
    if (voice) utter.voice = voice
    // Timeout fallback: ~80ms per char + 3s buffer (Chrome TTS onend bug)
    const timeout = setTimeout(resolve, Math.max(4000, text.length * 80 + 3000))
    utter.onend = () => {
      clearTimeout(timeout)
      resolve()
    }
    utter.onerror = () => {
      clearTimeout(timeout)
      resolve()
    }
    window.speechSynthesis.speak(utter)
  })
}

async function speak(text: string): Promise<void> {
  while (_isPaused) await sleep(200)
  return speakNow(text)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomDelay(min = 3000, max = 8000): Promise<void> {
  return sleep(min + Math.random() * (max - min))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

// ── State ─────────────────────────────────────────────────────────────────────
export function useGame() {
  // ── Speech settings (persisted) ──────────────────────────────────────────
  const speechRate = useLocalStorage('ww:speech-rate', 0.9)
  const selectedVoiceURI = useLocalStorage('ww:voice-uri', '')
  const availableVoices = ref<SpeechSynthesisVoice[]>([])

  function loadVoices() {
    if (!('speechSynthesis' in window)) return
    availableVoices.value = window.speechSynthesis.getVoices()
    // Auto-select first Vietnamese voice if none chosen yet
    if (!selectedVoiceURI.value) {
      const vi = availableVoices.value.find((v) => v.lang.startsWith('vi'))
      if (vi) selectedVoiceURI.value = vi.voiceURI
    }
    _voiceURI = selectedVoiceURI.value
    _speechRate = speechRate.value
  }

  onMounted(() => {
    loadVoices()
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  })

  watch(speechRate, (v) => {
    _speechRate = v
  })
  watch(selectedVoiceURI, (v) => {
    _voiceURI = v
  })

  function testSpeak() {
    speakNow('Xin chào, đây là giọng đọc thử nghiệm.')
  }

  const phase = ref<GamePhase>('setup')
  const roundNumber = ref(1)
  const winnerFaction = ref<Faction | null>(null)

  // Players
  const players = ref<Player[]>([])
  const playerNameInput = ref('')

  // Role config
  const roleConfig = ref<RoleConfig>({
    wolf: 2,
    'wolf-cub': 0,
    'cursed-wolf': 0,
    villager: 3,
    seer: 1,
    guard: 1,
    witch: 1,
    hunter: 0,
    disruptor: 0,
    traitor: 0,
    cupid: 0,
  })

  // Time config
  const timeConfig = ref<TimeConfig>({
    discussionSeconds: 300,
    nominateSeconds: 30,
    explainSeconds: 60,
    hangVoteSeconds: 30,
    nightDelayMs: 3000,
  })

  // Pause
  const isPaused = ref(false)

  // Role reveal
  const roleRevealIndex = ref(0)
  const roleRevealShowing = ref(false)

  // Night state
  const nightStep = ref<NightStep>('disruptor')
  const nightUiState = ref<NightUiState>('calling')
  const wolfVotes = ref<Record<string, string>>({}) // wolfId -> targetId
  const wolfFinalTargets = ref<string[]>([])
  const wolfCubDiedLastNight = ref(false)
  const seerTarget = ref<string | null>(null)
  const seerResult = ref<boolean | null>(null) // true = is wolf
  const guardTarget = ref<string | null>(null)
  const lastGuardTarget = ref<string | null>(null)
  const witchHealUsed = ref(false)
  const witchPoisonUsed = ref(false)
  const witchSaved = ref(false)
  const witchKillTarget = ref<string | null>(null)
  const hunterTarget = ref<string | null>(null) // persists each night (can change)
  const disruptorTarget = ref<string | null>(null)
  // Wolves voting UI state: which wolf's turn
  const wolfVotePlayerIndex = ref(0)

  // Cupid / lovers
  const cupidTarget1 = ref<string | null>(null)
  const cupidTarget2 = ref<string | null>(null)
  const loverIds = ref<[string, string] | null>(null)

  // Night snapshot for go-back
  const nightSnapshot = ref<{ players: string; round: number } | null>(null)

  // Night results for this round
  const currentNightDeaths = ref<DeathRecord[]>([])
  const currentNightSilenced = ref<string | null>(null)

  // Day state
  const dayDeaths = ref<DeathRecord[]>([]) // deaths to announce (includes pending hunter)
  const pendingHunterKill = ref<string | null>(null) // hunter hanged → kill next morning

  // Day discussion timer
  const discussionTimeLeft = ref(0)
  let discussionTimer: ReturnType<typeof setInterval> | null = null

  // Day nominate
  const nominateCurrentIndex = ref(0)
  const nominations = ref<Record<string, string | null>>({}) // voterId -> nomineeId | null

  // Day explain + hang
  const nominatedPlayers = ref<string[]>([])
  const explainCurrentIndex = ref(0)
  const explainTimeLeft = ref(0)
  let explainTimer: ReturnType<typeof setInterval> | null = null

  // Hang vote
  const hangVoteCurrentIndex = ref(0)
  const hangVotes = ref<Record<string, string | null>>({})
  const hangResult = ref<string | null>(null)

  // History
  const history = ref<GameHistory>({ nights: [], days: [] })

  // Promise resolver for night actions
  let resolveNightAction: (() => void) | null = null

  // ── Computed ───────────────────────────────────────────────────────────────
  const totalRoles = computed(() => Object.values(roleConfig.value).reduce((a, b) => a + b, 0))

  const livingPlayers = computed(() => players.value.filter((p) => p.alive))

  const livingWolves = computed(() => players.value.filter((p) => p.alive && p.faction === 'wolf'))

  const livingVillagers = computed(() =>
    players.value.filter((p) => p.alive && p.faction === 'villager'),
  )

  const setupValid = computed(() => {
    if (players.value.length < 3) return false
    if (players.value.length !== totalRoles.value) return false
    const wolfCount =
      roleConfig.value.wolf + roleConfig.value['wolf-cub'] + roleConfig.value['cursed-wolf']
    if (wolfCount < 1) return false
    const villagerCount = totalRoles.value - wolfCount
    if (villagerCount < 1) return false
    return true
  })

  const currentNominatePlayer = computed(
    () => livingPlayers.value[nominateCurrentIndex.value] ?? null,
  )

  const currentExplainPlayer = computed(
    () =>
      players.value.find((p) => p.id === nominatedPlayers.value[explainCurrentIndex.value]) ?? null,
  )

  const currentHangVotePlayer = computed(
    () => livingPlayers.value[hangVoteCurrentIndex.value] ?? null,
  )

  // The wolf being scouted (bitten this night) — for witch to see
  const witchNightVictim = computed(() => {
    // returns first wolf target that is NOT a wolf-in-disguise (witch just sees who's bitten)
    return wolfFinalTargets.value[0] ?? null
  })

  // Duplicate name check
  const duplicateNameError = computed(() => {
    const name = playerNameInput.value.trim()
    if (!name) return false
    return players.value.some((p) => p.name.toLowerCase() === name.toLowerCase())
  })

  // ── Pause ──────────────────────────────────────────────────────────────────
  function togglePause() {
    isPaused.value = !isPaused.value
    _isPaused = isPaused.value
    if (isPaused.value) {
      window.speechSynthesis.cancel()
      if (discussionTimer) {
        clearInterval(discussionTimer)
        discussionTimer = null
      }
      if (explainTimer) {
        clearInterval(explainTimer)
        explainTimer = null
      }
    } else {
      // Resume timers based on current phase
      if (phase.value === 'day-discussion' && discussionTimeLeft.value > 0) {
        discussionTimer = setInterval(() => {
          discussionTimeLeft.value--
          if (discussionTimeLeft.value <= 0) {
            clearInterval(discussionTimer!)
            speak('Hết thời gian thảo luận.').then(() => startNominate())
          }
        }, 1000)
      } else if (phase.value === 'day-explain' && explainTimeLeft.value > 0) {
        explainTimer = setInterval(() => {
          explainTimeLeft.value--
          if (explainTimeLeft.value <= 0) {
            clearInterval(explainTimer!)
            nextExplain()
          }
        }, 1000)
      }
    }
  }

  // ── Go back to night ───────────────────────────────────────────────────────
  function goBackToNight() {
    if (!nightSnapshot.value) return
    // Abort current night
    _currentNightId++
    window.speechSynthesis.cancel()
    isPaused.value = false
    _isPaused = false
    // Restore player states
    players.value = JSON.parse(nightSnapshot.value.players) as Player[]
    roundNumber.value = nightSnapshot.value.round
    // Clear timers
    if (discussionTimer) clearInterval(discussionTimer)
    if (explainTimer) clearInterval(explainTimer)
    discussionTimer = null
    explainTimer = null
    // Reset all night state
    wolfVotes.value = {}
    wolfFinalTargets.value = []
    wolfVotePlayerIndex.value = 0
    seerTarget.value = null
    seerResult.value = null
    guardTarget.value = null
    disruptorTarget.value = null
    witchSaved.value = false
    witchKillTarget.value = null
    currentNightDeaths.value = []
    currentNightSilenced.value = null
    cupidTarget1.value = null
    cupidTarget2.value = null
    resolveNightAction = null
    // Start night again
    beginNight()
  }

  // ── Setup actions ──────────────────────────────────────────────────────────
  function addPlayer() {
    const name = playerNameInput.value.trim()
    if (!name) return
    if (players.value.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return
    }
    players.value.push({
      id: crypto.randomUUID(),
      name,
      role: 'villager',
      faction: 'villager',
      alive: true,
      isSilenced: false,
    })
    playerNameInput.value = ''
  }

  function removePlayer(id: string) {
    players.value = players.value.filter((p) => p.id !== id)
  }

  function setRoleCount(role: RoleId, delta: number) {
    const current = roleConfig.value[role]
    roleConfig.value[role] = Math.max(0, current + delta)
  }

  function startGame() {
    if (!setupValid.value) return

    // Build role list and shuffle
    const roles: RoleId[] = []
    for (const [role, count] of Object.entries(roleConfig.value)) {
      for (let i = 0; i < count; i++) roles.push(role as RoleId)
    }
    const shuffledRoles = shuffle(roles)
    const shuffledPlayers = shuffle([...players.value])

    players.value = shuffledPlayers.map((p, i) => {
      const role = shuffledRoles[i]!
      const faction: Faction =
        role === 'wolf' || role === 'wolf-cub' || role === 'traitor' ? 'wolf' : 'villager'
      return { ...p, role, faction, alive: true, isSilenced: false }
    })

    roleRevealIndex.value = 0
    roleRevealShowing.value = false
    phase.value = 'role-reveal'
  }

  // ── Role reveal ────────────────────────────────────────────────────────────
  function showRoleCard() {
    roleRevealShowing.value = true
    const player = players.value[roleRevealIndex.value]
    if (player) speak(`Mời ${player.name} xem vai của mình.`)
  }

  function hideRoleCard() {
    roleRevealShowing.value = false
  }

  function nextRoleReveal() {
    roleRevealShowing.value = false
    roleRevealIndex.value++
    if (roleRevealIndex.value >= players.value.length) {
      speak('Tất cả đã xem xong. Game bắt đầu.').then(() => beginNight())
    }
  }

  // ── Night ──────────────────────────────────────────────────────────────────
  function beginNight() {
    // Reset night state
    wolfVotes.value = {}
    wolfFinalTargets.value = []
    wolfVotePlayerIndex.value = 0
    seerTarget.value = null
    seerResult.value = null
    guardTarget.value = null
    disruptorTarget.value = null
    witchSaved.value = false
    witchKillTarget.value = null
    currentNightDeaths.value = []
    currentNightSilenced.value = null
    cupidTarget1.value = null
    cupidTarget2.value = null

    // Reset silenced from last day
    players.value.forEach((p) => (p.isSilenced = false))

    // Save snapshot before running night
    nightSnapshot.value = { players: JSON.stringify(players.value), round: roundNumber.value }

    phase.value = 'night'
    runNightPhase()
  }

  // Check if a role was included in this game's config at all
  function isRoleInGame(step: NightStep): boolean {
    if (step === 'wolves') {
      return (
        roleConfig.value.wolf + roleConfig.value['wolf-cub'] + roleConfig.value['cursed-wolf'] > 0
      )
    }
    const stepRoles = ROLE_STEP_MAP[step]
    if (!stepRoles) return false
    const roleList = Array.isArray(stepRoles) ? stepRoles : [stepRoles]
    return roleList.some((r) => (roleConfig.value as Record<string, number>)[r]! > 0)
  }

  async function runNightPhase() {
    const myId = ++_currentNightId

    await speak(`Đêm thứ ${roundNumber.value} xuống. Mọi người hãy nhắm mắt.`)
    if (_currentNightId !== myId) return

    for (const step of NIGHT_ORDER) {
      if (_currentNightId !== myId) return
      if (!isRoleInGame(step)) continue

      // Cupid only acts on night 1
      if (step === 'cupid' && roundNumber.value > 1) {
        // Still fake-wait to hide info
        nightStep.value = step
        nightUiState.value = 'fake-wait'
        await speak(NIGHT_CALL[step])
        if (_currentNightId !== myId) return
        await randomDelay()
        if (_currentNightId !== myId) return
        await speak(NIGHT_SLEEP[step])
        nightUiState.value = 'sleeping'
        await sleep(timeConfig.value.nightDelayMs)
        continue
      }

      await runNightStep(step)
      if (_currentNightId !== myId) return
    }

    if (_currentNightId !== myId) return
    await speak('Trời sáng rồi. Mọi người hãy mở mắt.')

    if (_currentNightId !== myId) return
    resolveNight()
  }

  async function runNightStep(step: NightStep) {
    nightStep.value = step
    nightUiState.value = 'calling'

    await speak(NIGHT_CALL[step])

    const stepRoles = ROLE_STEP_MAP[step]
    const roleList = Array.isArray(stepRoles) ? stepRoles : stepRoles ? [stepRoles] : []

    // Check if any living player holds this role (wolves: check living wolf faction with wolf roles)
    let hasLivingRoleHolder = false
    if (step === 'wolves') {
      hasLivingRoleHolder = livingWolves.value.length > 0
    } else {
      hasLivingRoleHolder = players.value.some((p) => p.alive && roleList.includes(p.role))
    }

    if (!hasLivingRoleHolder) {
      nightUiState.value = 'fake-wait'
      await randomDelay()
    } else {
      nightUiState.value = 'acting'
      await waitForNightAction()
    }

    await speak(NIGHT_SLEEP[step])
    nightUiState.value = 'sleeping'
    await sleep(timeConfig.value.nightDelayMs)
  }

  function waitForNightAction(): Promise<void> {
    return new Promise((resolve) => {
      resolveNightAction = resolve
    })
  }

  function confirmNightAction() {
    if (resolveNightAction) {
      resolveNightAction()
      resolveNightAction = null
    }
  }

  // ── Night action setters ───────────────────────────────────────────────────
  function setDisruptorTarget(id: string) {
    disruptorTarget.value = id
  }

  function setWolfVote(wolfId: string, targetId: string) {
    wolfVotes.value = { ...wolfVotes.value, [wolfId]: targetId }
  }

  function confirmWolfVotes() {
    // Tally votes — most voted target wins; if tie pick first
    const tally: Record<string, number> = {}
    for (const targetId of Object.values(wolfVotes.value)) {
      tally[targetId] = (tally[targetId] ?? 0) + 1
    }
    // Sort by votes desc
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1])

    const canBiteTwo = wolfCubDiedLastNight.value
    wolfFinalTargets.value = sorted.slice(0, canBiteTwo ? 2 : 1).map(([id]) => id)
    wolfCubDiedLastNight.value = false // reset after use
    confirmNightAction()
  }

  function setSeerTarget(id: string) {
    seerTarget.value = id
    const target = players.value.find((p) => p.id === id)
    if (target) {
      // Cursed wolf that hasn't converted yet shows as "not wolf"
      seerResult.value = target.faction === 'wolf'
    }
  }

  function setGuardTarget(id: string) {
    guardTarget.value = id
  }

  function confirmGuard() {
    lastGuardTarget.value = guardTarget.value
    confirmNightAction()
  }

  function confirmSeer() {
    confirmNightAction()
  }

  function confirmDisruptor() {
    currentNightSilenced.value = disruptorTarget.value
    confirmNightAction()
  }

  function witchDoSave() {
    witchSaved.value = true
  }

  function witchSetKill(id: string | null) {
    witchKillTarget.value = id
  }

  function confirmWitch() {
    if (witchSaved.value) witchHealUsed.value = true
    if (witchKillTarget.value) witchPoisonUsed.value = true
    confirmNightAction()
  }

  function setHunterTarget(id: string) {
    hunterTarget.value = id
  }

  function confirmHunter() {
    confirmNightAction()
  }

  // ── Cupid actions ──────────────────────────────────────────────────────────
  function setCupidTarget(slot: 1 | 2, id: string) {
    if (slot === 1) cupidTarget1.value = id
    else cupidTarget2.value = id
  }

  function confirmCupid() {
    if (cupidTarget1.value && cupidTarget2.value) {
      loverIds.value = [cupidTarget1.value, cupidTarget2.value]
    }
    confirmNightAction()
  }

  // ── Traitor actions ────────────────────────────────────────────────────────
  function confirmTraitor() {
    confirmNightAction()
  }

  // ── Night resolution ───────────────────────────────────────────────────────
  function applyLoversChain(deaths: DeathRecord[]): DeathRecord[] {
    if (!loverIds.value) return deaths
    const [l1, l2] = loverIds.value
    const deadIds = new Set(deaths.map((d) => d.playerId))

    // Also include already-dead players
    players.value.filter((p) => !p.alive).forEach((p) => deadIds.add(p.id))

    const l1IsDying = deadIds.has(l1)
    const l2IsDying = deadIds.has(l2)

    const extra: DeathRecord[] = []
    if (l1IsDying && !l2IsDying && players.value.find((p) => p.id === l2)?.alive) {
      extra.push({ playerId: l2, reason: 'lover-death' })
    }
    if (l2IsDying && !l1IsDying && players.value.find((p) => p.id === l1)?.alive) {
      extra.push({ playerId: l1, reason: 'lover-death' })
    }
    return [...deaths, ...extra]
  }

  function resolveNight() {
    const deaths: DeathRecord[] = []

    // Step 1: Wolf bite targets
    for (const targetId of wolfFinalTargets.value) {
      const target = players.value.find((p) => p.id === targetId)
      if (!target || !target.alive) continue

      // Check if cursed wolf (not yet converted)
      if (target.role === 'cursed-wolf' && target.faction === 'villager') {
        const isProtected = guardTarget.value === targetId
        const isSaved = witchSaved.value && witchNightVictim.value === targetId

        if (isProtected) {
          // Guard blocks bite → no conversion, no death
        } else if (isSaved) {
          // Witch saves → no conversion, no death (heal used)
        } else {
          // Convert cursed wolf to wolf faction
          target.faction = 'wolf'
        }
        continue
      }

      // Normal target
      const isProtected = guardTarget.value === targetId
      const isSaved =
        witchSaved.value &&
        (wolfFinalTargets.value[0] === targetId || wolfFinalTargets.value.includes(targetId))

      if (!isProtected && !isSaved) {
        deaths.push({ playerId: targetId, reason: 'wolf' })
      }
    }

    // Step 2: Witch kill (guard does NOT block)
    if (witchKillTarget.value) {
      const target = players.value.find((p) => p.id === witchKillTarget.value)
      if (target && target.alive && !deaths.find((d) => d.playerId === target.id)) {
        deaths.push({ playerId: witchKillTarget.value, reason: 'witch-poison' })
      }
    }

    // Step 3: Hunter chain — if hunter dies tonight
    let wolfCubDied = false
    for (const d of deaths) {
      const p = players.value.find((pl) => pl.id === d.playerId)
      if (!p) continue
      if (p.role === 'hunter') {
        const target = players.value.find((pl) => pl.id === hunterTarget.value)
        if (target && target.alive && !deaths.find((dd) => dd.playerId === target.id)) {
          deaths.push({ playerId: target.id, reason: 'hunter-shot' })
        }
      }
      if (p.role === 'wolf-cub') wolfCubDied = true
    }

    // Also check witch-killed / hunter deaths for wolf-cub
    for (const d of deaths) {
      const p = players.value.find((pl) => pl.id === d.playerId)
      if (p?.role === 'wolf-cub') wolfCubDied = true
    }

    if (wolfCubDied) wolfCubDiedLastNight.value = true

    // Step 4: Lovers chain
    const finalDeaths = applyLoversChain(deaths)

    // Check lover wolf-cub deaths
    for (const d of finalDeaths) {
      if (!deaths.find((dd) => dd.playerId === d.playerId)) {
        const p = players.value.find((pl) => pl.id === d.playerId)
        if (p?.role === 'wolf-cub') wolfCubDiedLastNight.value = true
      }
    }

    // Apply deaths
    for (const d of finalDeaths) {
      const p = players.value.find((pl) => pl.id === d.playerId)
      if (p) {
        p.alive = false
        p.deathRound = roundNumber.value
        p.deathTime = 'night'
        p.deathReason = d.reason
      }
    }

    // Apply silenced for today
    if (currentNightSilenced.value) {
      const p = players.value.find((pl) => pl.id === currentNightSilenced.value)
      if (p && p.alive) p.isSilenced = true
    }

    // Record history
    const cursedConverted = players.value.find(
      (p) => p.role === 'cursed-wolf' && p.faction === 'wolf',
    )
    const nightRecord: NightRecord = {
      night: roundNumber.value,
      wolfTargets: wolfFinalTargets.value,
      seerTarget: seerTarget.value ?? undefined,
      seerIsWolf: seerResult.value ?? undefined,
      guardTarget: guardTarget.value ?? undefined,
      witchSaved: witchSaved.value ? (wolfFinalTargets.value[0] ?? undefined) : undefined,
      witchKilled: witchKillTarget.value ?? undefined,
      disruptorTarget: currentNightSilenced.value ?? undefined,
      hunterTarget: hunterTarget.value ?? undefined,
      deaths: finalDeaths,
      curseConverted: cursedConverted?.id,
      wolfCubDied,
    }
    history.value.nights.push(nightRecord)

    currentNightDeaths.value = finalDeaths

    // Add pending hunter kill from last day hanging (if any)
    if (pendingHunterKill.value) {
      const target = players.value.find((p) => p.id === pendingHunterKill.value)
      if (target && target.alive) {
        target.alive = false
        target.deathRound = roundNumber.value
        target.deathTime = 'night'
        target.deathReason = 'hunter-shot'
        currentNightDeaths.value = [
          ...currentNightDeaths.value,
          { playerId: pendingHunterKill.value, reason: 'hunter-shot' },
        ]
      }
      pendingHunterKill.value = null
    }

    dayDeaths.value = [...currentNightDeaths.value]
    phase.value = 'day-result'
    announceDayResult()
  }

  async function announceDayResult() {
    if (dayDeaths.value.length === 0) {
      await speak('Đêm qua là một đêm bình yên. Không ai chết.')
    } else {
      const names = dayDeaths.value
        .map((d) => players.value.find((p) => p.id === d.playerId)?.name)
        .filter(Boolean)
      await speak(`Đêm qua, ${names.join(', ')} đã chết.`)
    }

    // Announce silenced
    if (currentNightSilenced.value) {
      const p = players.value.find((pl) => pl.id === currentNightSilenced.value)
      if (p && p.alive) {
        await speak(`${p.name} bị cấm thảo luận hôm nay.`)
      }
    }

    // Check win condition after night deaths
    const winner = checkWinCondition()
    if (winner) {
      endGame(winner)
      return
    }
  }

  // ── Day result confirmation ────────────────────────────────────────────────
  function acknowledgeDayResult() {
    startDiscussion()
  }

  // ── Day discussion ─────────────────────────────────────────────────────────
  function startDiscussion() {
    phase.value = 'day-discussion'
    discussionTimeLeft.value = timeConfig.value.discussionSeconds
    speak('Bắt đầu thảo luận.')
    discussionTimer = setInterval(() => {
      discussionTimeLeft.value--
      if (discussionTimeLeft.value <= 0) {
        clearInterval(discussionTimer!)
        speak('Hết thời gian thảo luận.').then(() => startNominate())
      }
    }, 1000)
  }

  function skipDiscussion() {
    if (discussionTimer) clearInterval(discussionTimer)
    startNominate()
  }

  // ── Day nominate ───────────────────────────────────────────────────────────
  function startNominate() {
    phase.value = 'day-nominate'
    nominateCurrentIndex.value = 0
    nominations.value = {}
    const living = livingPlayers.value
    living.forEach((p) => (nominations.value[p.id] = null))
    if (living.length > 0) speak(`Bắt đầu bỏ phiếu đề cử. Mời ${living[0]!.name}.`)
  }

  function castNomination(nomineeId: string | null) {
    const voter = currentNominatePlayer.value
    if (!voter) return
    nominations.value[voter.id] = nomineeId
    nominateCurrentIndex.value++
    if (nominateCurrentIndex.value >= livingPlayers.value.length) {
      resolveNominations()
    } else {
      const next = livingPlayers.value[nominateCurrentIndex.value]
      if (next) speak(`Mời ${next.name}.`)
    }
  }

  function resolveNominations() {
    const tally: Record<string, number> = {}
    for (const nomineeId of Object.values(nominations.value)) {
      if (!nomineeId) continue
      tally[nomineeId] = (tally[nomineeId] ?? 0) + 1
    }
    if (Object.keys(tally).length === 0) {
      speak('Không ai bị đề cử. Trời tối rồi.').then(() => startNextNight())
      return
    }
    const maxVotes = Math.max(...Object.values(tally))
    nominatedPlayers.value = Object.entries(tally)
      .filter(([, v]) => v === maxVotes)
      .map(([id]) => id)

    explainCurrentIndex.value = 0
    startExplain()
  }

  // ── Day explain ────────────────────────────────────────────────────────────
  function startExplain() {
    phase.value = 'day-explain'
    const player = currentExplainPlayer.value
    if (!player) {
      startHangVote()
      return
    }
    speak(`Mời ${player.name} giải thích.`)
    explainTimeLeft.value = timeConfig.value.explainSeconds
    explainTimer = setInterval(() => {
      explainTimeLeft.value--
      if (explainTimeLeft.value <= 0) {
        clearInterval(explainTimer!)
        nextExplain()
      }
    }, 1000)
  }

  function nextExplain() {
    if (explainTimer) clearInterval(explainTimer)
    explainCurrentIndex.value++
    if (explainCurrentIndex.value >= nominatedPlayers.value.length) {
      startHangVote()
    } else {
      startExplain()
    }
  }

  // ── Day hang vote ──────────────────────────────────────────────────────────
  function startHangVote() {
    phase.value = 'day-hang'
    hangVoteCurrentIndex.value = 0
    hangVotes.value = {}
    hangResult.value = null
    const living = livingPlayers.value
    living.forEach((p) => (hangVotes.value[p.id] = null))
    speak('Bắt đầu bỏ phiếu treo cổ.')
    if (living.length > 0) speak(`Mời ${living[0]!.name}.`)
  }

  function castHangVote(targetId: string | null) {
    const voter = currentHangVotePlayer.value
    if (!voter) return
    hangVotes.value[voter.id] = targetId
    hangVoteCurrentIndex.value++
    if (hangVoteCurrentIndex.value >= livingPlayers.value.length) {
      resolveHangVote()
    } else {
      const next = livingPlayers.value[hangVoteCurrentIndex.value]
      if (next) speak(`Mời ${next.name}.`)
    }
  }

  function resolveHangVote() {
    const tally: Record<string, number> = {}
    for (const targetId of Object.values(hangVotes.value)) {
      if (!targetId) continue
      tally[targetId] = (tally[targetId] ?? 0) + 1
    }

    if (Object.keys(tally).length === 0) {
      hangResult.value = null
      speak('Không ai bị treo cổ.')
      recordDay(null)
      checkAndContinue()
      return
    }

    const maxVotes = Math.max(...Object.values(tally))
    const topVoted = Object.entries(tally).filter(([, v]) => v === maxVotes)

    if (topVoted.length > 1) {
      // Tie → no hanging
      hangResult.value = null
      speak('Hòa phiếu. Không ai bị treo cổ.')
      recordDay(null)
      checkAndContinue()
      return
    }

    const hangedId = topVoted[0]![0]
    const hanged = players.value.find((p) => p.id === hangedId)
    if (!hanged) return

    hanged.alive = false
    hanged.deathRound = roundNumber.value
    hanged.deathTime = 'day'
    hanged.deathReason = 'hanged'
    hangResult.value = hangedId

    // Check if hunter was hanged
    if (hanged.role === 'hunter' && hunterTarget.value) {
      const target = players.value.find((p) => p.id === hunterTarget.value)
      if (target && target.alive) {
        pendingHunterKill.value = hunterTarget.value
      }
    }

    // Check wolf-cub hanged
    if (hanged.role === 'wolf-cub') wolfCubDiedLastNight.value = true

    // Check lovers chain on hang
    const hangDeaths: DeathRecord[] = [{ playerId: hangedId, reason: 'hanged' }]
    const withLovers = applyLoversChain(hangDeaths)
    for (const d of withLovers) {
      if (d.playerId === hangedId) continue
      const loverPlayer = players.value.find((p) => p.id === d.playerId)
      if (loverPlayer && loverPlayer.alive) {
        loverPlayer.alive = false
        loverPlayer.deathRound = roundNumber.value
        loverPlayer.deathTime = 'day'
        loverPlayer.deathReason = 'lover-death'
        speak(`${loverPlayer.name} chết theo người yêu.`)
      }
    }

    speak(`${hanged.name} đã bị treo cổ.`)
    recordDay(hangedId)
    checkAndContinue()
  }

  function recordDay(hangedId: string | null) {
    const dayRecord: DayRecord = {
      day: roundNumber.value,
      silenced: currentNightSilenced.value ?? undefined,
      nominations: { ...nominations.value },
      nominated: nominatedPlayers.value,
      hangVotes: { ...hangVotes.value },
      hanged: hangedId ?? undefined,
      deaths: hangedId ? [{ playerId: hangedId, reason: 'hanged' }] : [],
    }
    history.value.days.push(dayRecord)
  }

  function checkAndContinue() {
    const winner = checkWinCondition()
    if (winner) {
      setTimeout(() => endGame(winner), 2000)
    } else {
      setTimeout(() => startNextNight(), 2000)
    }
  }

  function startNextNight() {
    roundNumber.value++
    beginNight()
  }

  // ── Win condition ──────────────────────────────────────────────────────────
  function checkWinCondition(): Faction | null {
    const wolves = livingWolves.value.length
    const villagers = livingVillagers.value.length
    if (wolves === 0) return 'villager'
    if (wolves >= villagers) return 'wolf'
    return null
  }

  function endGame(winner: Faction) {
    winnerFaction.value = winner
    const msg = winner === 'wolf' ? 'Phe Sói đã chiến thắng!' : 'Phe Dân đã chiến thắng!'
    speak(msg)
    phase.value = 'game-over'
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function resetGame() {
    phase.value = 'setup'
    players.value = []
    roundNumber.value = 1
    winnerFaction.value = null
    wolfCubDiedLastNight.value = false
    witchHealUsed.value = false
    witchPoisonUsed.value = false
    hunterTarget.value = null
    lastGuardTarget.value = null
    history.value = { nights: [], days: [] }
    loverIds.value = null
    cupidTarget1.value = null
    cupidTarget2.value = null
    nightSnapshot.value = null
    isPaused.value = false
    _isPaused = false
  }

  return {
    // State
    phase,
    roundNumber,
    winnerFaction,
    players,
    playerNameInput,
    roleConfig,
    timeConfig,
    // Speech settings
    speechRate,
    selectedVoiceURI,
    availableVoices,
    testSpeak,
    // Pause
    isPaused,
    togglePause,
    goBackToNight,
    nightSnapshot,
    // Role reveal
    roleRevealIndex,
    roleRevealShowing,
    // Night
    nightStep,
    nightUiState,
    wolfVotes,
    wolfFinalTargets,
    wolfCubDiedLastNight,
    wolfVotePlayerIndex,
    seerTarget,
    seerResult,
    guardTarget,
    lastGuardTarget,
    witchHealUsed,
    witchPoisonUsed,
    witchSaved,
    witchKillTarget,
    hunterTarget,
    disruptorTarget,
    witchNightVictim,
    currentNightSilenced,
    cupidTarget1,
    cupidTarget2,
    loverIds,
    // Day
    dayDeaths,
    discussionTimeLeft,
    nominateCurrentIndex,
    nominations,
    currentNominatePlayer,
    nominatedPlayers,
    explainCurrentIndex,
    explainTimeLeft,
    currentExplainPlayer,
    hangVoteCurrentIndex,
    hangVotes,
    hangResult,
    currentHangVotePlayer,
    // History
    history,
    // Computed
    totalRoles,
    livingPlayers,
    livingWolves,
    livingVillagers,
    setupValid,
    duplicateNameError,
    // Actions - setup
    addPlayer,
    removePlayer,
    setRoleCount,
    startGame,
    // Actions - role reveal
    showRoleCard,
    hideRoleCard,
    nextRoleReveal,
    // Actions - night
    setDisruptorTarget,
    confirmDisruptor,
    setWolfVote,
    confirmWolfVotes,
    setSeerTarget,
    confirmSeer,
    setGuardTarget,
    confirmGuard,
    witchDoSave,
    witchSetKill,
    confirmWitch,
    setHunterTarget,
    confirmHunter,
    setCupidTarget,
    confirmCupid,
    confirmTraitor,
    // Actions - day
    acknowledgeDayResult,
    skipDiscussion,
    castNomination,
    nextExplain,
    castHangVote,
    resetGame,
  }
}
