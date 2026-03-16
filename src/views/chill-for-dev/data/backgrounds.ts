import type { BackgroundType } from '../stores/workspaceStore'

export interface BackgroundOption {
  id: string
  name: string
  type: BackgroundType
  url: string
  thumb?: string
}

/** Ảnh nền / GIF / video — Mixkit & Unsplash */
export const backgroundOptions: BackgroundOption[] = [
  {
    id: 'nature-1',
    name: 'Rừng hồ',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920',
    thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
  },
  {
    id: 'night-sky',
    name: 'Đêm sao',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920',
    thumb: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400',
  },
  {
    id: 'rain-window',
    name: 'Mưa bên cửa',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=1920',
    thumb: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=400',
  },
  {
    id: 'cafe',
    name: 'Quán café',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920',
    thumb: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
  },
  {
    id: 'lofi-room',
    name: 'Phòng chill',
    type: 'image',
    url: 'https://cdna.artstation.com/p/assets/images/images/038/426/502/large/cristian-pulisic-bedroom-150.jpg?1623075705',
    thumb:
      'https://cdna.artstation.com/p/assets/images/images/038/426/502/large/cristian-pulisic-bedroom-150.jpg?1623075705',
  },
  {
    id: 'gif-rain',
    name: 'Mưa (GIF)',
    type: 'gif',
    url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif',
    thumb: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy_s.gif',
  },
  {
    id: 'gif-cozy',
    name: 'Cozy (GIF)',
    type: 'gif',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    thumb: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy_s.gif',
  },
  {
    id: 'video-calm',
    name: 'Cảnh yên (video)',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/22728/22728-720.mp4',
    thumb: 'https://assets.mixkit.co/videos/22728/22728-thumb-720-0.jpg',
  },
  {
    id: 'video-rain',
    name: 'Mưa (video)',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/2717/2717-720.mp4',
    thumb: 'https://assets.mixkit.co/videos/2717/2717-thumb-720-0.jpg',
  },
  {
    id: 'video-room',
    name: 'Phòng chill (video)',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/1251/1251-720.mp4',
    thumb: 'https://assets.mixkit.co/videos/1251/1251-thumb-720-0.jpg',
  },
]
