/**
 * Project 42 - Narrative Orchestration Configuration
 * Defines the cinematic beats and scroll-driven thresholds for the experience.
 */

export interface SceneConfig {
  id: number
  threshold: number
  text?: string
  subtext?: string
  type: 'opening' | 'prologue' | 'narrative' | 'title' | 'credits'
  accent?: string
  subtextAccent?: string
}

export const SCENES: SceneConfig[] = [
  // --- ACT I: PROLOGUE & COSMOGENESIS ---
  {
    id: 0,
    threshold: 2.0,
    text: 'Where does everything begin?',
    subtext: 'scroll to discover',
    type: 'opening',
  },
  { id: 1, threshold: 5.0, text: '', type: 'narrative' }, // Silent contemplative pause

  { id: 2, threshold: 8.0, text: '13.8 billion years ago', type: 'prologue' },
  { id: 3, threshold: 11.0, text: '', type: 'narrative' }, // Silent contemplative pause

  { id: 4, threshold: 14.0, text: 'everything was nothing', type: 'title' },
  { id: 5, threshold: 17.0, text: '', type: 'narrative' }, // Silent contemplative pause

  // --- ACT II: THE SINGULARITY & EXPLOSION ---
  { id: 6, threshold: 20.0, text: 'pressure beyond measure...', type: 'narrative' },
  { id: 7, threshold: 24.0, text: '', type: 'narrative' }, // Compression transition: Particles vortex to center

  { id: 8, threshold: 27.0, text: "until it wasn't", type: 'title', accent: '#FFFFFF' },
  { id: 9, threshold: 33.0, text: '', type: 'narrative' }, // Shockwave transition: Particles expand outward

  // --- ACT III: PLANETARY GENESIS ---
  { id: 10, threshold: 45.0, text: '', type: 'narrative' }, // Silent contemplative pause: Earth formation phase
  { id: 11, threshold: 50.5, text: 'our home', type: 'title', accent: '#38BDF8' },
  { id: 12, threshold: 56.0, text: '', type: 'narrative' }, // Silent contemplative pause: Atmospheric dissipation

  // --- ACT IV: BIOLOGICAL EVOLUTION ---
  { id: 13, threshold: 75.0, text: 'life found a way', type: 'title', accent: '#FFB830' },
  { id: 14, threshold: 95.0, text: '', type: 'narrative' }, // DNA Helix majestic formation

  { id: 15, threshold: 100.0, text: '', type: 'narrative' }, // Molecular free-drift transition
  { id: 16, threshold: 105.0, text: '', type: 'narrative' },
  { id: 17, threshold: 115.0, text: '', type: 'narrative' },
  { id: 18, threshold: 135.0, text: '', type: 'narrative' },
  { id: 19, threshold: 145.0, text: 'four letters', type: 'title', accent: '#FFFFFF' },
  {
    id: 20,
    threshold: 155.0,
    text: 'that wrote every living thing',
    type: 'narrative',
    accent: '#FFB830',
  },
  { id: 21, threshold: 165.0, text: '', type: 'narrative' }, // Silent contemplative pause

  {
    id: 22,
    threshold: 175.0,
    text: 'if life is code —',
    subtext: 'who wrote it?',
    type: 'title',
    accent: '#FFB830',
  },
  { id: 23, threshold: 210.0, text: '', type: 'narrative' }, // Silent contemplative pause

  // --- ACT V: DIGITAL REVOLUTION ---
  { id: 24, threshold: 230.0, text: 'then we made our own', type: 'title' },
  { id: 25, threshold: 245.0, text: '', type: 'narrative' }, // Transition to Digital Void: Background shifts to Blue

  { id: 26, threshold: 260.0, text: '0   1', type: 'title', accent: '#38BDF8' },
  { id: 27, threshold: 275.0, text: '', type: 'narrative' }, // Matrix rain saturation phase

  {
    id: 28,
    threshold: 285.0,
    text: 'two symbols',
    subtext: 'that built every machine',
    type: 'narrative',
    accent: '#38BDF8',
  },
  { id: 29, threshold: 300.0, text: '', type: 'narrative' }, // Compression phase: Particles form a dense wall

  {
    id: 30,
    threshold: 345.0,
    text: 'it learned to speak',
    subtext: 'then to think',
    type: 'narrative',
    accent: '#38BDF8',
  },
  { id: 31, threshold: 375.0, text: '', type: 'narrative' }, // Silent contemplative pause: Observing the solid Cube

  {
    id: 32,
    threshold: 405.0,
    text: 'then it asked',
    subtext: "questions we couldn't answer",
    type: 'narrative',
    accent: '#FFFFFF',
  },
  { id: 33, threshold: 450.0, text: 'what makes you alive?', type: 'title', accent: '#FFFFFF' }, // Cube shatters into Digital DNA
  { id: 34, threshold: 480.0, text: '', type: 'narrative' }, // Silent contemplative pause: Observing Digital Helix

  { id: 35, threshold: 510.0, text: '', type: 'narrative' }, // Split transition: Digital DNA prepares for collision
  { id: 36, threshold: 535.0, text: '', type: 'narrative' }, // Collision approach phase

  // --- ACT VI: THE SYNERGY & FINALE ---
  {
    id: 37,
    threshold: 555.0,
    text: 'A T G C',
    subtext: '0 1 0 1',
    type: 'title',
    accent: '#FFB830',
    subtextAccent: '#38BDF8',
  },
  { id: 38, threshold: 570.0, text: '', type: 'narrative' }, // Silent contemplative pause
  {
    id: 39,
    threshold: 585.0,
    text: 'both just patterns',
    subtext: 'searching for meaning',
    type: 'narrative',
    accent: '#FFFFFF',
  },
  { id: 40, threshold: 600.0, text: '', type: 'narrative' }, // Silent contemplative pause

  {
    id: 41,
    threshold: 665.0,
    text: 'now the boundary fades',
    type: 'title',
    accent: '#FFFFFF',
  },
  { id: 42, threshold: 800.0, text: '', type: 'narrative' }, // Majestic Ascent Phase: Union of systems
  { id: 43, threshold: 900.0, text: 'what is a soul?', type: 'title', accent: '#FFFFFF' },
  { id: 44, threshold: 1000.0, text: '', type: 'narrative' }, // Dissolution phase: Particles fade to stardust
  { id: 45, threshold: 1060.0, text: '42', type: 'title', accent: '#FFFFFF' },

  // --- EPILOGUE: CREDITS ---
  { id: 46, threshold: 1100.0, text: '', type: 'narrative' }, // Final fade-out phase
  { id: 47, threshold: 1140.0, text: 'J2TEAM', type: 'title', accent: '#FF6B4A' },
  {
    id: 48,
    threshold: 1180.0,
    text: 'a project by',
    subtext: 'sanghynh',
    type: 'credits',
    accent: '#FFFFFF',
  },
  { id: 49, threshold: 1200.0, text: '', type: 'narrative' }, // Void before secret finale
  { id: 50, threshold: 1240.0, text: '', type: 'narrative' },
]
