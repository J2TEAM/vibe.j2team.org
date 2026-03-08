export const BUG_WAR_ROOM_STORAGE_PREFIX = 'bug-war-room-'

export const bugWarRoomStorageKeys = {
  bestScore: `${BUG_WAR_ROOM_STORAGE_PREFIX}best-score`,
  playerAlias: `${BUG_WAR_ROOM_STORAGE_PREFIX}player-alias`,
  shareDraft: `${BUG_WAR_ROOM_STORAGE_PREFIX}share-draft`,
  shareDraftAt: `${BUG_WAR_ROOM_STORAGE_PREFIX}share-draft-at`,
  characterAnimationEnabled: `${BUG_WAR_ROOM_STORAGE_PREFIX}character-animation-enabled`,
  docsCollapsed: `${BUG_WAR_ROOM_STORAGE_PREFIX}docs-collapsed`,
  actionLogCollapsedMobile: `${BUG_WAR_ROOM_STORAGE_PREFIX}action-log-collapsed-mobile`,
  learningJournal: `${BUG_WAR_ROOM_STORAGE_PREFIX}learning-journal`,
  careerLearningXp: `${BUG_WAR_ROOM_STORAGE_PREFIX}career-learning-xp`,
  learningCollapsed: `${BUG_WAR_ROOM_STORAGE_PREFIX}learning-collapsed`,
  uiFocusMode: `${BUG_WAR_ROOM_STORAGE_PREFIX}ui-focus-mode`,
  tacticalPanelCollapsed: `${BUG_WAR_ROOM_STORAGE_PREFIX}tactical-panel-collapsed`,
  postmortemCollapsed: `${BUG_WAR_ROOM_STORAGE_PREFIX}postmortem-collapsed`,
  resultHistory: `${BUG_WAR_ROOM_STORAGE_PREFIX}result-history`,
  resultHistoryCollapsed: `${BUG_WAR_ROOM_STORAGE_PREFIX}result-history-collapsed`,
  blogUiState: `${BUG_WAR_ROOM_STORAGE_PREFIX}blog-ui-state`,
} as const

export const bugWarRoomStoragePrefixes = {
  dailyBest: `${BUG_WAR_ROOM_STORAGE_PREFIX}daily-best-`,
  dailyLeaderboard: `${BUG_WAR_ROOM_STORAGE_PREFIX}daily-leaderboard-`,
} as const
