import { useStorage } from '@vueuse/core'
import { computed } from 'vue'

// 63 provinces definition
// The map has HOANG SA & TRUONG SA islands explicitly as well.
export const PROVINCES_63 = [
  'angiang',
  'baria',
  'baclieu',
  'bacgiang',
  'backan',
  'bacninh',
  'bentre',
  'binhduong',
  'binhdinh',
  'binhphuoc',
  'binhthuan',
  'camau',
  'caobang',
  'cantho',
  'danang',
  'daklak',
  'daknong',
  'dongnai',
  'dongthap',
  'dienbien',
  'gialai',
  'hagiang',
  'hanam',
  'hanoi',
  'hatinh',
  'haiduong',
  'haiphong',
  'haugiang',
  'hoabinh',
  'hcm',
  'hungyen',
  'khanhhoa',
  'kiengiang',
  'kontum',
  'laichau',
  'laocai',
  'langson',
  'lamdong',
  'longan',
  'namdinh',
  'nghean',
  'ninhbinh',
  'ninhthuan',
  'phutho',
  'phuyen',
  'quangbinh',
  'quangnam',
  'quangngai',
  'quangninh',
  'quangtri',
  'soctrang',
  'sonla',
  'tayninh',
  'thaibinh',
  'thainguyen',
  'thanhhoa',
  'tthue',
  'tiengiang',
  'travinh',
  'tuyenquang',
  'vinhlong',
  'vinhphuc',
  'yenbai',
]

export function useAdventureMap() {
  const visitedProvinces = useStorage<string[]>('vibe-vietnam-visited', [])

  const ISLAND_SYNC: Record<string, string> = {
    khanhhoa: 'truongsa',
    truongsa: 'khanhhoa',
    danang: 'hoangsa',
    hoangsa: 'danang',
  }

  const toggleProvince = (id: string) => {
    const idsToToggle = [id]
    if (ISLAND_SYNC[id]) {
      idsToToggle.push(ISLAND_SYNC[id])
    }

    const isSelected = visitedProvinces.value.includes(id)
    if (isSelected) {
      visitedProvinces.value = visitedProvinces.value.filter((p) => !idsToToggle.includes(p))
    } else {
      const toAdd = idsToToggle.filter((p) => !visitedProvinces.value.includes(p))
      visitedProvinces.value.push(...toAdd)
    }
  }

  const statLabel = computed(() => {
    // Don't count hoangsa and truongsa towards the 63 denominator, but let them select it.
    const selectedMain = visitedProvinces.value.filter((p) => PROVINCES_63.includes(p))
    return `${selectedMain.length} / 63`
  })

  const completionPercent = computed(() => {
    const selectedMain = visitedProvinces.value.filter((p) => PROVINCES_63.includes(p))
    return ((selectedMain.length / 63) * 100).toFixed(1)
  })

  return {
    visitedProvinces,
    toggleProvince,
    statLabel,
    completionPercent,
  }
}
