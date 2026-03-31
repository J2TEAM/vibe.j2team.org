/** Vietnamese + English words grouped by difficulty tier */

const easyWords = [
  'zombie',
  'brain',
  'run',
  'help',
  'fire',
  'kill',
  'dead',
  'bite',
  'dark',
  'fear',
  'hide',
  'fast',
  'gun',
  'door',
  'wall',
  'trap',
  'chay',
  'chet',
  'song',
  'lua',
  'dan',
  'ban',
  'tay',
  'mat',
  'mau',
  'den',
  'dao',
  'ken',
  'bay',
  'bon',
  'giu',
  'nha',
]

const mediumWords = [
  'zombie',
  'undead',
  'attack',
  'defend',
  'escape',
  'danger',
  'weapon',
  'bullet',
  'shield',
  'horror',
  'scream',
  'terror',
  'runner',
  'hunter',
  'target',
  'reload',
  'ambush',
  'strike',
  'chienbinh',
  'thoatnan',
  'vuongquoc',
  'tancong',
  'phongve',
  'quaivat',
  'mattroi',
  'suongtoi',
  'antoan',
  'nguyhiem',
  'sinhton',
  'chongcu',
  'lolang',
  'dodich',
  'thanphan',
]

const hardWords = [
  'survivor',
  'outbreak',
  'apocalypse',
  'barricade',
  'infection',
  'crossbow',
  'machete',
  'corridor',
  'fortress',
  'headshot',
  'desperate',
  'nightmare',
  'graveyard',
  'slaughter',
  'mutation',
  'nghiadiaxom',
  'tranchiendau',
  'taomaxom',
  'vuotquaman',
  'khunghoang',
  'matmabimat',
  'chienlucgia',
  'sinhtonvien',
]

export function getRandomWord(difficulty: number): string {
  let pool: string[]
  if (difficulty <= 3) {
    pool = easyWords
  } else if (difficulty <= 6) {
    pool = [...easyWords, ...mediumWords]
  } else {
    pool = [...easyWords, ...mediumWords, ...hardWords]
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? 'zombie'
}
