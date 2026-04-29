export const TOTAL_CHECKBOXES = 1_000_000_000
export const COLS = 31622
export const ROWS = Math.ceil(TOTAL_CHECKBOXES / COLS)
export const CELL_SIZE = 16
export const ZOOM_LEVELS = [
  0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4,
]
export const DEFAULT_ZOOM_INDEX = 11 // 1x zoom

// Spatial Index Configuration
export const GRID_CELL_SIZE = 256 // Size of spatial grid blocks in cell units
export const GRID_COLS = Math.ceil(COLS / GRID_CELL_SIZE)
export const GRID_ROWS = Math.ceil(ROWS / GRID_CELL_SIZE)

// Minimap Configuration
export const MINIMAP_SIZE = 200 // Size in pixels

// MQTT Configuration
export const MQTT_TOPIC = 'vibe-j2team-billion-checkboxes-sync-v3'
export const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt'

// Storage Configuration
export const STORAGE_KEY = 'billion-checkboxes-state'

// Debounce/Throttle Configuration
export const SAVE_DEBOUNCE_MS = 2000
export const MINIMAP_DEBOUNCE_MS = 16
export const SYNC_INTERVAL_MS = 5000
