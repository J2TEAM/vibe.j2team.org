export type Lang = 'vi' | 'en'

export interface ChillI18n {
  backToHome: string
  title: string
  searchPlaceholder: string
  searchNoResults: string
  myList: string
  chillMusic: string
  visuals: string
  sounds: string
  close: string
  chillMusicPopupTitle: string
  chillListError: string
  retry: string
  // MusicPlayer
  previewDeezer: string
  deezer: string
  fullTrackLofi: string
  stop: string
  noTrackPlaying: string
  // TrackListCard
  remove: string
  emptyListHint: string
  // SoundMix
  soundsTitle: string
  soundsDescription: string
  rain: string
  birds: string
  keyboard: string
  // BackgroundSelector
  visualsTitle: string
  visualsDescription: string
  clearBackground: string
  backgroundNames: Record<string, string>
}

export const i18n: Record<Lang, ChillI18n> = {
  vi: {
    backToHome: 'Về trang chủ',
    title: 'Chill for Dev',
    searchPlaceholder: 'Tìm bài hát, nghệ sĩ...',
    searchNoResults: 'Không tìm thấy. Thử từ khóa khác.',
    myList: 'Danh sách của tôi',
    chillMusic: 'Chill music',
    visuals: 'Visuals',
    sounds: 'Sounds',
    close: 'Đóng',
    chillMusicPopupTitle: '// Chill music',
    chillListError: 'Không tải được danh sách.',
    retry: 'Thử lại',
    previewDeezer: 'Preview 30s từ Deezer · Nghe full trên',
    deezer: 'Deezer',
    fullTrackLofi: 'Full bài từ Lofi',
    stop: 'Dừng',
    noTrackPlaying: 'Chưa có bài đang phát — tìm và bấm vào một bài trong Music.',
    remove: 'Xóa',
    emptyListHint: 'Tìm bài ở ô trên và bấm vào để thêm.',
    soundsTitle: '// Âm thanh',
    soundsDescription: 'Thêm tiếng nền: mưa, chim, gõ phím để chill cùng nhạc.',
    rain: 'Mưa',
    birds: 'Chim',
    keyboard: 'Gõ phím',
    visualsTitle: '// Visuals',
    visualsDescription: 'Chọn ảnh nền, GIF hoặc video nền cho workspace.',
    clearBackground: 'Xóa nền',
    backgroundNames: {
      'nature-1': 'Rừng hồ',
      'night-sky': 'Đêm sao',
      'rain-window': 'Mưa bên cửa',
      cafe: 'Quán café',
      'lofi-room': 'Phòng chill',
      'gif-rain': 'Mưa (GIF)',
      'gif-cozy': 'Cozy (GIF)',
      'video-calm': 'Cảnh yên (video)',
      'video-rain': 'Mưa (video)',
      'video-forest': 'Rừng mưa (video)',
      'video-room': 'Phòng chill (video)',
    },
  },
  en: {
    backToHome: 'Back to home',
    title: 'Chill for Dev',
    searchPlaceholder: 'Search songs, artists...',
    searchNoResults: 'No results. Try different keywords.',
    myList: 'My list',
    chillMusic: 'Chill music',
    visuals: 'Visuals',
    sounds: 'Sounds',
    close: 'Close',
    chillMusicPopupTitle: '// Chill music',
    chillListError: 'Could not load list.',
    retry: 'Retry',
    previewDeezer: '30s preview from Deezer · Listen full on',
    deezer: 'Deezer',
    fullTrackLofi: 'Full track from Lofi',
    stop: 'Stop',
    noTrackPlaying: 'No track playing — search and click a track in Music.',
    remove: 'Remove',
    emptyListHint: 'Search above and click to add tracks.',
    soundsTitle: '// Sounds',
    soundsDescription:
      'Add background sounds: rain, birdsong, and keyboard typing to chill with the music.',
    rain: 'Rain',
    birds: 'Birds',
    keyboard: 'Keyboard',
    visualsTitle: '// Visuals',
    visualsDescription: 'Choose background image, GIF or video for your workspace.',
    clearBackground: 'Clear background',
    backgroundNames: {
      'nature-1': 'Lake forest',
      'night-sky': 'Starry night',
      'rain-window': 'Rain by window',
      cafe: 'Café',
      'lofi-room': 'Chill room',
      'gif-rain': 'Rain (GIF)',
      'gif-cozy': 'Cozy (GIF)',
      'video-calm': 'Calm scene (video)',
      'video-rain': 'Rain (video)',
      'video-forest': 'Rain forest (video)',
      'video-room': 'Chill room (video)',
    },
  },
}

const STORAGE_KEY = 'chill-for-dev-lang'

export function getStoredLang(): Lang {
  if (typeof localStorage === 'undefined') return 'vi'
  const v = localStorage.getItem(STORAGE_KEY) as Lang | null
  return v === 'en' || v === 'vi' ? v : 'vi'
}

export function setStoredLang(lang: Lang): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang)
}
