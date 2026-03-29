import { computed, type ComputedRef, type Ref } from 'vue'
import type { FillPhaseCode, RefuelUiState } from '../types'

export type UseRefuelStationMachineOptions = {
  isParked: Ref<boolean>
  isParking: Ref<boolean>
  fillingState: Ref<'idle' | 'filling' | 'complete'>
  fillPhaseCode: Ref<FillPhaseCode>
}

export function useRefuelUiState(opts: UseRefuelStationMachineOptions): ComputedRef<RefuelUiState> {
  return computed(() => {
    if (opts.fillingState.value === 'filling') {
      const p = opts.fillPhaseCode.value
      if (p === 'prep' || p === 'walk') return 'approaching'
      if (p === 'couple' || p === 'hose') return 'fuelFlowPriming'
      if (p === 'tank') return 'refueling'
    }
    if (opts.fillingState.value === 'complete') return 'completed'
    if (opts.isParking.value) return 'parking'
    if (opts.isParked.value) return 'parked'
    return 'idle'
  })
}

export function stationStatusLabel(
  ui: RefuelUiState,
  fillPhaseCode: FillPhaseCode,
  fillingState: 'idle' | 'filling' | 'complete',
): string {
  if (fillingState === 'filling') {
    switch (fillPhaseCode) {
      case 'prep':
        return 'Lấy vòi tại trụ...'
      case 'walk':
        return 'Kéo ống tới xe...'
      case 'couple':
        return 'Đang cắm vòi vào xe...'
      case 'hose':
        return 'Xăng đang lấp ống...'
      case 'tank':
        return 'Đang đổ xăng'
      default:
        break
    }
  }
  if (fillingState === 'complete') return 'Hoàn tất — đã đầy bình'

  switch (ui) {
    case 'idle':
      return 'Đậu xe để bắt đầu'
    case 'parking':
      return 'Đang đậu xe...'
    case 'parked':
      return 'Sẵn sàng đổ xăng'
    case 'error':
      return 'Có lỗi — thử Reset'
    default:
      return 'Chờ thao tác'
  }
}
