export interface Character {
  id: string
  name: string
  sprites: Record<string, string>
}

export type CharacterPosition = 'left' | 'center' | 'right'
export type CharacterAnimation = 'slide-in' | 'fade-in' | 'none'
export type SceneEffect = 'shake' | 'flash' | 'fade-to-black' | 'red-tint' | 'glow'
export type BgTransition = 'crossfade' | 'fade-through-black' | 'instant'

export interface StageDirection {
  characterId: string
  sprite: string
  position: CharacterPosition
  animation?: CharacterAnimation
}

export interface Choice {
  label: string
  next: string
}

export interface DialogueLine {
  characterId?: string
  text: string
}

export interface Scene {
  id: string
  background: string
  bgTransition?: BgTransition
  effect?: SceneEffect
  stage: StageDirection[]
  dialogue: DialogueLine[]
  choices?: Choice[]
  next?: string
  isEnding?: boolean
  endingTitle?: string
}

export interface StoryData {
  title: string
  characters: Character[]
  scenes: Scene[]
}
