// TypeScript interfaces — port từ gach-bong/src/engine/types.ts

export interface MatchResult {
  valid: boolean
  path: [number, number][]
  turns: number
}

export interface HintResult {
  tile1: [number, number]
  tile2: [number, number]
  found: boolean
}

export interface ColorRGB {
  r: number
  g: number
  b: number
}

export interface RenderOptions {
  borderWidth?: number
  showBorder?: boolean
  cornerRadius?: number
  padding?: number
  enableTexture?: boolean
  textureIntensity?: number
  enableWear?: boolean
  wearAmount?: number
  enableBevel?: boolean
  bevelSize?: number
  saturation?: number
  brightness?: number
  opacity?: number
  showGrout?: boolean
  groutWidth?: number
  groutColor?: ColorRGB
}

export interface PaletteColors {
  primary: ColorRGB
  secondary: ColorRGB
  accent: ColorRGB
  background: ColorRGB
  detail: ColorRGB
}

export interface GachBongModule {
  initEngine(ctx: CanvasRenderingContext2D): void
  initGame(rows: number, cols: number, numPatterns: number): void
  renderBoard(tileSize: number): void
  renderSingleTile(
    row: number,
    col: number,
    tileSize: number,
    selected: boolean,
    highlighted: boolean,
  ): void
  renderPath(path: [number, number][], tileSize: number): void
  renderEmpty(row: number, col: number, tileSize: number): void
  checkMatch(r1: number, c1: number, r2: number, c2: number): MatchResult
  removePair(r1: number, c1: number, r2: number, c2: number): boolean
  getHint(): HintResult
  shuffleBoard(): void
  isBoardCleared(): boolean
  isBoardSolvable(): boolean
  getRemainingTiles(): number
  getBoardRows(): number
  getBoardCols(): number
  getTileAt(row: number, col: number): number
  getPaletteIdx(row: number, col: number): number
  getPatternCount(): number
  getPatternName(patternIdx: number): string
  getPaletteCount(): number
  renderPatternPreview(
    ctx: CanvasRenderingContext2D,
    patternIdx: number,
    paletteIdx: number,
    size: number,
  ): void
  renderPatternWithOptions(
    ctx: CanvasRenderingContext2D,
    patternIdx: number,
    paletteIdx: number,
    size: number,
    options: RenderOptions,
  ): void
  renderTessellation(
    ctx: CanvasRenderingContext2D,
    patternIdx: number,
    paletteIdx: number,
    gridCols: number,
    gridRows: number,
    tileSize: number,
    options: RenderOptions,
  ): void
  renderPatternCustomPalette(
    ctx: CanvasRenderingContext2D,
    patternIdx: number,
    pr: number,
    pg: number,
    pb: number,
    sr: number,
    sg: number,
    sb: number,
    ar: number,
    ag: number,
    ab: number,
    bgr: number,
    bgg: number,
    bgb: number,
    dr: number,
    dg: number,
    db: number,
    size: number,
    options: RenderOptions,
  ): void
  getPaletteColors(paletteIdx: number): PaletteColors
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface GameConfig {
  rows: number
  cols: number
  numPatterns: number
  timeLimit: number
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  easy: { rows: 6, cols: 6, numPatterns: 6, timeLimit: 300 },
  medium: { rows: 8, cols: 8, numPatterns: 8, timeLimit: 240 },
  hard: { rows: 10, cols: 10, numPatterns: 12, timeLimit: 180 },
}
