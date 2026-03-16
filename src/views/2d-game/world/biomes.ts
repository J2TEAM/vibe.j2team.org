import type { BiomeType, BiomeConfig } from '../types'

export const BIOMES: Record<BiomeType, BiomeConfig> = {
  forest: {
    name: 'Khu Rừng Cổ',
    skyColors: ['#0f0f23', '#1a1a3e', '#2d1b4e', '#1a1a2e'],
    groundColor: '#3f3f28',
    grassColor: '#4ade80',
    grassColor2: '#22c55e',
    platformColor: '#6b5b45',
    platformTop: '#4ade80',
    treeColor: '#166534',
    treeTrunk: '#1a3a1a',
    mountainColor: '#1e1b4b',
    particleColor: '#4ade80',
    moonColor: '#fef3c7',
  },
  desert: {
    name: 'Sa Mạc Lửa',
    skyColors: ['#1a0a00', '#3d1f00', '#7c4a1a', '#cc8844'],
    groundColor: '#c2a23d',
    grassColor: '#d4b84a',
    grassColor2: '#b89530',
    platformColor: '#a08030',
    platformTop: '#d4b84a',
    treeColor: '#2d5a1e',
    treeTrunk: '#8b6914',
    mountainColor: '#5a3a1a',
    particleColor: '#f59e0b',
    moonColor: '#fbbf24',
  },
  ice: {
    name: 'Vùng Băng Giá',
    skyColors: ['#0a1628', '#1a2a4e', '#2a4a7e', '#4a7aae'],
    groundColor: '#8ab4d8',
    grassColor: '#b8e0f8',
    grassColor2: '#90c8e8',
    platformColor: '#6a9ac0',
    platformTop: '#c8e8f8',
    treeColor: '#4a8ab0',
    treeTrunk: '#5a7a8a',
    mountainColor: '#2a4a6e',
    particleColor: '#93c5fd',
    moonColor: '#e0f2fe',
  },
  volcano: {
    name: 'Núi Lửa Tối',
    skyColors: ['#1a0505', '#3a0a0a', '#5a1515', '#2a0808'],
    groundColor: '#3a2a2a',
    grassColor: '#ef4444',
    grassColor2: '#dc2626',
    platformColor: '#4a2a1a',
    platformTop: '#f97316',
    treeColor: '#2a1a0a',
    treeTrunk: '#1a0a00',
    mountainColor: '#2a0a0a',
    particleColor: '#ef4444',
    moonColor: '#fca5a5',
  },
}

const BIOME_ORDER: BiomeType[] = ['forest', 'desert', 'ice', 'volcano']

export function getBiomeForLevel(level: number): BiomeType {
  const idx = Math.floor((level - 1) / 3) % BIOME_ORDER.length
  return BIOME_ORDER[idx] ?? 'forest'
}

export function getBiomeConfig(level: number): BiomeConfig {
  return BIOMES[getBiomeForLevel(level)]
}
