/** Giá trị mặc định đồng hồ Fischer — UI/localStorage có thể ghi đè. */
export const VCHESS_CLOCK_DEFAULTS = {
  initialMinutes: 15,
  incrementSeconds: 30,
} as const

export type VChessClockSettings = {
  initialMinutes: number
  incrementSeconds: number
}
