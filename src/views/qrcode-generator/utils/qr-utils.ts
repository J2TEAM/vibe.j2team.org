// Note: Path2D only accepts the path data (d attribute), not the full <path> tag.
interface FrameConfig {
  path: string
  frame_border: number
  label_size: number
  label_offset: number
  label_pos: 'bottom' | 'top'
}

export const FRAMES: Record<string, FrameConfig> = {
  none: { path: '', frame_border: 0, label_size: 0, label_offset: 0, label_pos: 'bottom' },
  bottom: {
    path: 'M0,20.9h24v3.1H0V20.9z',
    frame_border: 1,
    label_size: 3,
    label_offset: 0,
    label_pos: 'bottom',
  },
  top: {
    path: 'M0,0h24v3.1H0V0z',
    frame_border: 1,
    label_size: 3,
    label_offset: 0,
    label_pos: 'top',
  },
  box: {
    path: 'M0,0v24h24V0H0zm21.9,21.9H2.1V2.1h19.7V21.9z',
    frame_border: 3,
    label_size: 0,
    label_offset: 0,
    label_pos: 'bottom',
  },
  'banner-top': {
    path: 'M0,0h24v4.9H0V0z M21.9,21.9H2.1V4.9h19.7V21.9z',
    frame_border: 3,
    label_size: 2,
    label_offset: -1,
    label_pos: 'top',
  },
  'banner-bottom': {
    path: 'M0,24h24v-4.9H0V24z M2.1,2.1h19.7v17H2.1V2.1z',
    frame_border: 3,
    label_size: 2,
    label_offset: -1,
    label_pos: 'bottom',
  },
}

interface PathConfig {
  path: string
}

export const MARKERS_IN: Record<string, PathConfig> = {
  default: { path: 'M0,0h6v6H0z' },
  trapezoid: { path: 'M6,6L0.5,6L0,0L6,0.5z' },
  bottom_left_arc: { path: 'M3,6L3,6C1.3,6,0,4.7,0,3l0-3l3,0c1.7,0,3,1.3,3,3v0C6,4.7,4.7,6,3,6z' },
  top_right_arc: { path: 'M6,6H3C1.3,6,0,4.7,0,3v0c0-1.7,1.3-3,3-3h0c1.7,0,3,1.3,3,3V6z' },
  arc_combo: { path: 'M6,6H3C1.3,6,0,4.7,0,3l0-3l3,0c1.7,0,3,1.3,3,3V6z' },
  circle: { path: 'M6,3A3,3 0 1,0 0,3A3,3 0 1,0 6,3' },
  rounded_rect: {
    path: 'M6,1.7v2.7C6,5.2,5.2,6,4.3,6H1.7C0.7,6,0,5.3,0,4.3V1.7C0,0.8,0.8,0,1.7,0h2.7C5.3,0,6,0.7,6,1.7z',
  },
  gear: {
    path: 'M3,0L3.4,0.7L4,0.2L4.1,0.9L4.9,0.7L4.8,1.5L5.6,1.5L5.2,2.2L5.9,2.5L5.3,3L5.9,3.5L5.2,3.8L5.6,4.5L4.8,4.5L4.9,5.3L4.1,5.1L4,5.8L3.4,5.3L3,6L2.5,5.3L1.9,5.8L1.8,5.1L1,5.3L1.1,4.5L0.4,4.5L0.7,3.8L0,3.5L0.6,3L0,2.5L0.7,2.2L0.4,1.5L1.1,1.5L1,0.7L1.8,0.9L1.9,0.2L2.5,0.7z',
  },
  cloud: {
    path: 'M3.2,0.3l0.6,1.3C4,1.8,4.1,1.9,4.3,1.9l1.4,0.2c0.2,0,0.3,0.3,0.2,0.5l-1,1C4.7,3.7,4.7,3.9,4.7,4.1L5,5.5 c0,0.2-0.2,0.4-0.4,0.3L3.3,5.2c-0.2-0.1-0.4-0.1-0.6,0L1.4,5.8C1.2,5.9,1,5.8,1,5.5l0.2-1.4c0-0.2,0-0.4-0.2-0.5l-1-1 C-0.1,2.4,0,2.2,0.2,2.1l1.4-0.2c0.2,0,0.4-0.2,0.5-0.3l0.6-1.3C2.9,0.1,3.1,0.1,3.2,0.3z',
  },
  rotated_square: { path: 'M0.9,0.9h4.2v4.2H0.9z' },
  floral_cross: {
    path: 'M3,5.1L3.9,6L6,6L6,3.9L5.1,3L6,2.1L6,0L3.9,0L3,0.9L2.1,0L0,0L0,2.1L0.9,3L0,3.9L0,6L2.1,6z',
  },
  four_corner_block: { path: 'M6,1.5H4.5V0H1.5V1.5H0V4.5H1.5V6H4.5V4.5H6z' },
  four_point_flower: {
    path: 'M4.5,1.5C4.5,0.7,3.8,0,3,0S1.5,0.7,1.5,1.5S2.2,3,3,3S4.5,2.3,4.5,1.5z',
  },
  scalloped_circle: {
    path: 'M3,5.1l0.4,0.4C3.7,5.8,4.1,6,4.5,6h0C5.3,6,6,5.3,6,4.5v0c0-0.4-0.2-0.8-0.4-1.1L5.1,3l0.4-0.4C5.8,2.3,6,1.9,6,1.5v0C6,0.7,5.3,0,4.5,0h0C4.1,0,3.7,0.2,3.4,0.4L3,0.9L2.6,0.4C2.3,0.2,1.9,0,1.5,0h0C0.7,0,0,0.7,0,1.5v0c0,0.4,0.2,0.8,0.4,1.1L0.9,3L0.4,3.4C0.2,3.7,0,4.1,0,4.5v0C0,5.3,0.7,6,1.5,6h0c0.4,0,0.8-0.2,1.1-0.4L3,5.1z',
  },
  heart: {
    path: 'M6,1.8C5.9,1,5.3,0.4,4.5,0.3C3.9,0.2,3.4,0.5,3,0.9C2.6,0.5,2.1,0.3,1.6,0.3C0.8,0.4,0.1,1,0,1.8 C0,2.3,0.1,2.7,0.3,3l0,0l0,0c0.1,0.1,0.2,0.2,0.3,0.3l1.9,2.2c0.3,0.3,0.7,0.3,0.9,0l1.8-1.9c0.1-0.1,0.3-0.3,0.4-0.5 C5.9,2.8,6.1,2.3,6,1.8z',
  },
  star: {
    path: 'M3.5,6C0.7,4.7,1.7,3,0,3.5C1.3,0.7,3,1.7,2.5,0C5.3,1.3,4.3,3,6,2.5C4.7,5.3,3,4.3,3.5,6z',
  },
  x_mark: {
    path: 'M3-1c0,2.2-1.8,4-4,4h0h0c2.2,0,4,1.8,4,4v0c0-2.2,1.8-4,4-4h0h0C4.8,3,3,1.2,3-1z',
  },
  grid_3x3: {
    path: 'M2,1A1,1 0 1,0 0,1A1,1 0 1,0 2,1 M4,1A1,1 0 1,0 2,1A1,1 0 1,0 4,1 M6,1A1,1 0 1,0 4,1A1,1 0 1,0 6,1 M2,3A1,1 0 1,0 0,3A1,1 0 1,0 2,3 M4,3A1,1 0 1,0 2,3A1,1 0 1,0 4,3 M6,3A1,1 0 1,0 4,3A1,1 0 1,0 6,3 M2,5A1,1 0 1,0 0,5A1,1 0 1,0 2,5 M4,5A1,1 0 1,0 2,5A1,1 0 1,0 4,5 M6,5A1,1 0 1,0 4,5A1,1 0 1,0 6,5',
  },
  cog: {
    path: 'M6,3c0-0.4-0.3-0.8-0.6-1C5.7,1.9,6,1.5,6,1.1C6,0.5,5.5,0,4.9,0C4.5,0,4.1,0.3,4,0.6C3.8,0.3,3.4,0,3,0S2.2,0.3,2,0.6C1.9,0.3,1.5,0,1.1,0C0.5,0,0,0.5,0,1.1c0,0.4,0.3,0.8,0.6,1C0.3,2.2,0,2.6,0,3s0.3,0.8,0.6,1C0.3,4.1,0,4.5,0,4.9C0,5.5,0.5,6,1.1,6c0.4,0,0.8-0.3,1-0.6C2.2,5.7,2.6,6,3,6s0.8-0.3,1-0.6C4.1,5.7,4.5,6,4.9,6C5.5,6,6,5.5,6,4.9c0-0.4-0.3-0.8-0.6-1C5.7,3.8,6,3.4,6,3z',
  },
  l_bracket: {
    path: 'M4.3,6H1.7C0.8,6,0,5.2,0,4.3V0h4.3C5.2,0,6,0.8,6,1.7v2.6C6,5.2,5.2,6,4.3,6z',
  },
  overlap: {
    path: 'M6,6C4.1,5.4,1.9,5.4,0,6c0.6-1.9,0.6-4.1,0-6c1.9,0.6,4.1,0.6,6,0C5.4,1.9,5.4,4.1,6,6z',
  },
  polygon: { path: 'M6,6L3,6L0,3L0,0L3,0L6,3z' },
  horizontal_lines: {
    path: 'M5.1,1.9H0.9C0.4,1.9,0,1.5,0,1v0c0-0.5,0.4-0.9,0.9-0.9h4.2C5.6,0.1,6,0.5,6,1v0C6,1.5,5.6,1.9,5.1,1.9z M5.1,3.9H0.9C0.4,3.9,0,3.5,0,3v0c0-0.5,0.4-0.9,0.9-0.9h4.2C5.6,2.1,6,2.5,6,3v0C6,3.5,5.6,3.9,5.1,3.9z M5.1,5.9H0.9C0.4,5.9,0,5.5,0,5v0c0-0.5,0.4-0.9,0.9-0.9h4.2C5.6,4.1,6,4.5,6,5v0C6,5.5,5.6,5.9,5.1,5.9z',
  },
  vertical_lines: {
    path: 'M4.1,5.1V0.9C4.1,0.4,4.5,0,5,0h0c0.5,0,0.9,0.4,0.9,0.9v4.2C5.9,5.6,5.5,6,5,6h0C4.5,6,4.1,5.6,4.1,5.1z M2.1,5.1V0.9C2.1,0.4,2.5,0,3,0h0c0.5,0,0.9,0.4,0.9,0.9v4.2C3.9,5.6,3.5,6,3,6h0C2.5,6,2.1,5.6,2.1,5.1z M0.1,5.1V0.9C0.1,0.4,0.5,0,1,0h0c0.5,0,0.9,0.4,0.9,0.9v4.2C1.9,5.6,1.5,6,1,6h0C0.5,6,0.1,5.6,0.1,5.1z',
  },
  tab: {
    path: 'M1.5,6C1.2,5.3,0.7,4.8,0,4.5v-3C0,0.7,0.7,0,1.5,0h3C4.8,0.7,5.3,1.2,6,1.5v3C6,5.3,5.3,6,4.5,6H1.5z',
  },
  flower_burst: {
    path: 'M5.9,5.9l-0.3,0L5.3,6L5,5.7l-0.3,0.1L4.4,5.8l-0.3,0L3.9,5.7l-0.3,0l-0.3,0.1L3,5.9l-0.3-0.1L2.4,5.8l-0.3,0l-0.2-0.1l-0.3,0l-0.3,0l-0.3,0.1L0.7,5.8L0.4,5.8L0.1,5.9L0,5.5L0.1,5.3L0,5L0.3,4.7L0.3,4.4L0.2,4.1L0.2,3.8L0.1,3.5L0.3,3.3L0.1,3L0.1,2.7L0.2,2.4L0.1,2.1L0.1,1.8L0.1,1.5L0.2,1.3L0.3,1L0,0.7L0,0.4L0.3,0.2L0.4,0.1L0.7,0.1L1,0.2L1.3,0.1L1.6,0.3L1.9,0.1L2.1,0.1L2.4,0.2L2.7,0.1L3,0.3L3.3,0.2L3.6,0.2L3.8,0.2L4.1,0.1L4.4,0.3L4.7,0.1L5,0.2L5.3,0.1L5.6,0L5.9,0L5.8,0.4L6,0.7L6,1L5.9,1.2L5.7,1.5L5.7,1.8L5.9,2.1L5.7,2.4L5.8,2.7L6,3L5.9,3.3L5.8,3.5L5.8,3.8L5.8,4.1L6,4.4L5.8,4.7L5.7,5L5.7,5.3L5.8,5.5z',
  },
}

export const MARKERS_OUT: Record<string, PathConfig> = {
  default: { path: 'M0,0v14h14V0H0z M12,12H2V2h10V12z' },
  style2: {
    path: 'M0,0l0.9,13c0,0.6,0.5,1,1,1h12V2c0-0.6-0.4-1-1-1L0,0z M12,12H3.8c-0.5,0-1-0.4-1-1L2,2l9,0.7c0.5,0,1,0.5,1,1 V12z',
  },
  style3: {
    path: 'M0,0l0,7c0,3.9,3.1,7,7,7h0c3.9,0,7-3.1,7-7v0c0-3.9-3.1-7-7-7H0z M7,12L7,12c-2.8,0-5-2.2-5-5V2h5c2.8,0,5,2.2,5,5v0 C12,9.8,9.8,12,7,12z',
  },
  style4: {
    path: 'M0,7L0,7c0,3.9,3.1,7,7,7h7V7c0-3.9-3.1-7-7-7h0C3.1,0,0,3.1,0,7z M12,12H7c-2.8,0-5-2.2-5-5v0c0-2.8,2.2-5,5-5h0 c2.8,0,5,2.2,5,5V12z',
  },
  style5: {
    path: 'M0,0l0,7c0,3.9,3.1,7,7,7h7V7c0-3.9-3.1-7-7-7H0z M12,12H7c-2.8,0-5-2.2-5-5V2h5c2.8,0,5,2.2,5,5V12z',
  },
  style6: {
    path: 'M0,0l0,7c0,3.9,3.1,7,7,7h7V7c0-3.9-3.1-7-7-7H0z M12,12H7c-2.8,0-5-2.2-5-5v0c0-2.8,2.2-5,5-5h0c2.8,0,5,2.2,5,5V12z',
  },
  style7: {
    path: 'M0,0l0,7c0,3.9,3.1,7,7,7h7V7c0-3.9-3.1-7-7-7H0z M7,12L7,12c-2.8,0-5-2.2-5-5v0c0-2.8,2.2-5,5-5h0c2.8,0,5,2.2,5,5v0 C12,9.8,9.8,12,7,12z',
  },
  style8: {
    path: 'M0,0l0,7c0,3.9,3.1,7,7,7h7V7c0-3.9-3.1-7-7-7H0z M7,12L7,12c-2.8,0-5-2.2-5-5V2h5c2.8,0,5,2.2,5,5v0C12,9.8,9.8,12,7,12z',
  },
  style9: {
    path: 'M0,0l0,14h14V0H0z M7,12L7,12c-2.8,0-5-2.2-5-5v0c0-2.8,2.2-5,5-5h0c2.8,0,5,2.2,5,5v0C12,9.8,9.8,12,7,12z',
  },
  style10: {
    path: 'M0,7L0,7c0,3.9,3.1,7,7,7h0c3.9,0,7-3.1,7-7v0c0-3.9-3.1-7-7-7h0C3.1,0,0,3.1,0,7z M7,12L7,12c-2.8,0-5-2.2-5-5v0 c0-2.8,2.2-5,5-5h0c2.8,0,5,2.2,5,5v0C12,9.8,9.8,12,7,12z',
  },
  style11: {
    path: 'M4.5,14h5.1C12,14,14,12,14,9.6V4.5C14,2,12,0,9.5,0H4.4C2,0,0,2,0,4.4v5.1C0,12,2,14,4.5,14z M12,4.8v4.4 c0,1.5-1.3,2.8-2.8,2.8H4.8C3.2,12,2,10.8,2,9.2V4.8C2,3.3,3.3,2,4.8,2h4.4C10.8,2,12,3.2,12,4.8z',
  },
  style12: {
    path: 'M0,0v9.6C0,12,2,14,4.4,14h5.1C12,14,14,12,14,9.6V4.4C14,2,12,0,9.6,0H0z M9.2,12H4.8C3.3,12,2,10.7,2,9.2V2h7.2 C10.7,2,12,3.3,12,4.8v4.4C12,10.7,10.7,12,9.2,12z',
  },
  style13: {
    path: 'M14,14V4.4C14,2,12,0,9.6,0H4.4C2,0,0,2,0,4.4v5.1C0,12,2,14,4.4,14H14z M4.8,2h4.4C10.7,2,12,3.3,12,4.8V12H4.8 C3.3,12,2,10.7,2,9.2V4.8C2,3.3,3.3,2,4.8,2z',
  },
  style14: {
    path: 'M0,0v9.6C0,12,2,14,4.4,14H14V4.4C14,2,12,0,9.6,0H0z M12,12H4.8C3.3,12,2,10.7,2,9.2V2h7.2C10.7,2,12,3.3,12,4.8V12z',
  },
  style15: { path: 'M14,0H4.4C2,0,0,2,0,4.4V14h14V0z M2,12V4.8C2,3.3,3.3,2,4.8,2H12v10H2z' },
  style16: {
    path: 'M13.8,1.1c-3.5,3.9-3.8-1.9-12.8-0.9c3.9,3.5-1.9,3.8-0.9,12.8c3.5-3.9,3.8,1.9,12.8,0.9C9.1,10.4,14.9,10.1,13.8,1.1z M9.4,13.2c-6.5-1.6-5.2-5.6-8.6-3.8c1.6-6.5,5.6-5.2,3.8-8.6c6.5,1.6,5.2,5.6,8.6,3.8C11.7,11.1,7.6,9.8,9.4,13.2z',
  },
  style17: {
    path: 'M14,3.1c0-0.4-0.3-0.8-0.6-1c0.4-0.2,0.6-0.5,0.6-1C14,0.5,13.5,0,12.9,0c-0.4,0-0.8,0.3-1,0.6 c-0.2-0.4-0.5-0.6-1-0.6s-0.8,0.3-1,0.6C9.8,0.3,9.4,0,9,0C8.5,0,8.2,0.3,8,0.6C7.8,0.3,7.4,0,7,0S6.2,0.3,6,0.6C5.8,0.3,5.5,0,5,0 C4.6,0,4.2,0.3,4,0.6C3.9,0.3,3.5,0,3.1,0s-0.8,0.3-1,0.6C1.9,0.3,1.5,0,1.1,0C0.5,0,0,0.5,0,1.1c0,0.4,0.3,0.8,0.6,1 C0.3,2.2,0,2.6,0,3.1s0.3,0.8,0.6,1C0.3,4.2,0,4.6,0,5c0,0.4,0.3,0.8,0.6,1C0.3,6.2,0,6.6,0,7s0.3,0.8,0.6,1C0.3,8.2,0,8.5,0,9 c0,0.4,0.3,0.8,0.6,1c-0.4,0.2-0.6,0.5-0.6,1s0.3,0.8,0.6,1c-0.4,0.2-0.6,0.5-0.6,1C0,13.5,0.5,14,1.1,14c0.4,0,0.8-0.3,1-0.6 c0.2,0.4,0.5,0.6,1,0.6s0.8-0.3,1-0.6C4.2,13.7,4.6,14,5,14c0.4,0,0.8-0.3,1-0.6C6.2,13.7,6.6,14,7,14s0.8-0.3,1-0.6 C8.2,13.7,8.5,14,9,14c0.4,0,0.8-0.3,1-0.6c0.2,0.4,0.5,0.6,1,0.6s0.8-0.3,1-0.6c0.2,0.4,0.5,0.6,1,0.6c0.6,0,1.1-0.5,1.1-1.1 c0-0.4-0.3-0.8-0.6-1c0.4-0.2,0.6-0.5,0.6-1s-0.3-0.8-0.6-1C13.7,9.8,14,9.4,14,9c0-0.4-0.3-0.8-0.6-1C13.7,7.8,14,7.4,14,7 s-0.3-0.8-0.6-1C13.7,5.8,14,5.5,14,5c0-0.4-0.3-0.8-0.6-1C13.7,3.9,14,3.5,14,3.1z M11.9,12.5c-0.2-0.4-0.5-0.6-1-0.6 s-0.8,0.3-1,0.6c-0.2-0.4-0.5-0.6-1-0.6c-0.4,0-0.8,0.3-1,0.6c-0.2-0.4-0.5-0.6-1-0.6s-0.8,0.3-1,0.6c-0.2-0.4-0.5-0.6-1-0.6 c-0.4,0-0.8,0.3-1,0.6c-0.2-0.4-0.5-0.6-1-0.6s-0.8,0.3-1,0.6C2,12.2,1.8,12,1.5,11.9c0.4-0.2,0.6-0.5,0.6-1s-0.3-0.8-0.6-1 c0.4-0.2,0.6-0.5,0.6-1c0-0.4-0.3-0.8-0.6-1c0.4-0.2,0.6-0.5,0.6-1S1.9,6.2,1.5,6c0.4-0.2,0.6-0.5,0.6-1c0-0.4-0.3-0.8-0.6-1 c0.4-0.2,0.6-0.5,0.6-1s-0.3-0.8-0.6-1C1.8,2,2,1.8,2.1,1.5c0.2,0.4,0.5,0.6,1,0.6s0.8-0.3,1-0.6c0.2,0.4,0.5,0.6,1,0.6 c0.4,0,0.8-0.3,1-0.6c0.2,0.4,0.5,0.6,1,0.6s0.8-0.3,1-0.6c0.2,0.4,0.5,0.6,1,0.6c0.4,0,0.8-0.3,1-0.6c0.2,0.4,0.5,0.6,1,0.6 s0.8-0.3,1-0.6C12,1.8,12.2,2,12.5,2.1c-0.4,0.2-0.6,0.5-0.6,1s0.3,0.8,0.6,1c-0.4,0.2-0.6,0.5-0.6,1c0,0.4,0.3,0.8,0.6,1 c-0.4,0.2-0.6,0.5-0.6,1s0.3,0.8,0.6,1c-0.4,0.2-0.6,0.5-0.6,1c0,0.4,0.3,0.8,0.6,1c-0.4,0.2-0.6,0.5-0.6,1s0.3,0.8,0.6,1 C12.2,12,12,12.2,11.9,12.5z',
  },
  style18: {
    path: 'M14,9.6V3c-1.7,0-3-1.3-3-3H4.4C2,0,0,2,0,4.4V11c1.7,0,3,1.3,3,3h6.6C12,14,14,12,14,9.6z M4.6,12C4.1,10.8,3.2,9.9,2,9.4 v-5C2,3.1,3.1,2,4.4,2h5c0.5,1.2,1.4,2.1,2.6,2.6v5c0,1.3-1.1,2.4-2.4,2.4H4.6z',
  },
  style19: {
    path: 'M13.8,1.8H14V0.2h-0.2V0h-1.6v0.2H12v0L11.7,0L11,0.4L10.3,0L9.7,0.4L9,0L8.3,0.4L7.7,0L7,0.4L6.3,0L5.7,0.4 L5,0L4.3,0.4L3.7,0L3,0.4L2.3,0L2,0.2v0H1.8V0H0.2v0.2H0v1.6h0.2V2h0L0,2.3L0.4,3L0,3.7l0.4,0.7L0,5l0.4,0.7L0,6.3L0.4,7L0,7.7 l0.4,0.7L0,9l0.4,0.7L0,10.3L0.4,11L0,11.7L0.2,12h0v0.2H0v1.6h0.2V14h1.6v-0.2H2v0L2.3,14L3,13.6L3.7,14l0.7-0.4L5,14l0.7-0.4 L6.3,14L7,13.6L7.7,14l0.7-0.4L9,14l0.7-0.4l0.7,0.4l0.7-0.4l0.7,0.4l0.3-0.2v0h0.2V14h1.6v-0.2H14v-1.6h-0.2V12h0l0.2-0.3L13.6,11 l0.4-0.7l-0.4-0.7L14,9l-0.4-0.7L14,7.7L13.6,7L14,6.3l-0.4-0.7L14,5l-0.4-0.7L14,3.7L13.6,3L14,2.3L13.8,2h0V1.8z M12.4,3L12,3.7 l0.4,0.7L12,5l0.4,0.7L12,6.3L12.4,7L12,7.7l0.4,0.7L12,9l0.4,0.7L12,10.3l0.4,0.7L12,11.7l0.2,0.3h0v0.2H12v0L11.7,12L11,12.4 L10.3,12l-0.7,0.4L9,12l-0.7,0.4L7.7,12L7,12.4L6.3,12l-0.7,0.4L5,12l-0.7,0.4L3.7,12L3,12.4L2.3,12L2,12.2v0H1.8V12h0L2,11.7 L1.6,11L2,10.3L1.6,9.7L2,9L1.6,8.3L2,7.7L1.6,7L2,6.3L1.6,5.7L2,5L1.6,4.3L2,3.7L1.6,3L2,2.3L1.8,2h0V1.8H2v0L2.3,2L3,1.6L3.7,2 l0.7-0.4L5,2l0.7-0.4L6.3,2L7,1.6L7.7,2l0.7-0.4L9,2l0.7-0.4L10.3,2L11,1.6L11.7,2L12,1.8v0h0.2V2h0L12,2.3L12.4,3z',
  },
  style20: {
    path: 'M0.2,0.1L0.1,0.6l0.1,0.5L0.2,1.6L0.1,2.1l0.1,0.5L0,3.1l0,0.5L0,4l0.1,0.5l0,0.5l0.1,0.5L0.1,6l0,0.5l0,0.5 l0.2,0.5L0.1,8l0.1,0.5L0,8.9l0.2,0.5L0,9.9l0.2,0.5l-0.1,0.5l0,0.5L0,11.9l0.2,0.5l-0.1,0.5l0.1,0.5l0,0.4L0.6,14l0.5,0l0.5-0.1 l0.5,0.1l0.5,0.1L3.1,14l0.5-0.1l0.5-0.1l0.5,0L5,13.9l0.5-0.1l0.5,0l0.5,0L7,13.9L7.5,14L8,14l0.5-0.2L9,13.9L9.4,14l0.5-0.2 l0.5,0.2l0.5-0.1l0.5,0l0.5-0.1l0.5,0l0.5,0l0.5,0l0.5,0.1l-0.1-0.5l0.2-0.5l-0.1-0.5l-0.1-0.5l0.2-0.5l-0.2-0.5l0.1-0.5L14,9.9 l-0.2-0.5L13.9,9L14,8.5L14,8l-0.2-0.5l0-0.5l0.1-0.5L13.8,6l0-0.5L14,5l0-0.5l-0.1-0.5l0.1-0.5l-0.2-0.5l0.1-0.5l0-0.5l0-0.5 l-0.1-0.5L14,0.6l-0.2-0.4l-0.4,0l-0.5,0L12.4,0l-0.5,0.2l-0.5,0l-0.5-0.1l-0.5,0L10,0l-0.5,0L9,0L8.5,0.2L8,0.2L7.5,0.1L7,0.1 L6.5,0.2L6,0L5.5,0.2L5.1,0.2L4.6,0.1L4.1,0.1L3.6,0L3.1,0.1L2.6,0L2.1,0.1l-0.5,0l-0.5,0L0.6,0.2L0.2,0.1z M11.9,11.9l-0.5-0.1 L10.9,12l-0.5-0.1L10,11.9l-0.5,0.1L9,11.8l-0.5,0l-0.5,0l-0.5,0.1l-0.5,0L6.5,12L6,11.9l-0.5,0l-0.5,0L4.6,12l-0.5-0.2L3.6,12 l-0.5-0.1L2.6,12l-0.4-0.1L2,11.4l0.1-0.5l0-0.5l0.1-0.5L2,9.5L2.1,9L2,8.5L2,8l0.2-0.5l0-0.5L2,6.5L2.1,6l0.1-0.5L2.2,5L2.1,4.5 L2,4.1l0-0.5l0.2-0.5L2,2.6L2,2l0.5,0l0.5,0.1l0.5,0.1l0.5,0L4.5,2L5,2.1l0.5,0.1L6,2l0.5,0.2L7,2.1l0.5,0L8,2l0.5,0L9,2l0.5,0 l0.5,0.1L10.4,2l0.5,0.2L11.4,2L12,2l-0.1,0.6L12,3.1l-0.1,0.5L11.8,4L12,4.5L11.9,5l-0.1,0.5l0,0.5L12,6.5L12,7l-0.1,0.5L12,8 l0,0.5l-0.2,0.5l0,0.5l0.1,0.5l-0.1,0.5l0.2,0.5l-0.1,0.5L11.9,11.9z',
  },
}

export const PATTERNS: Record<string, PathConfig> = {
  default: { path: 'M0,0h6v6h-6z' },
  flurry: {
    path: 'M5.9,5.9L5.6,5.9L5.3,6L5,5.7L4.7,5.8L4.4,5.8L4.1,5.8L3.9,5.7L3.6,5.7L3.3,5.8L3,5.9L2.7,5.8L2.4,5.8L2.1,5.8L1.9,5.7L1.6,5.7L1.3,5.7L1,5.8L0.7,5.8L0.4,5.8L0.1,5.9L0,5.5L0.1,5.3L0,5L0.3,4.7L0.3,4.4L0.2,4.1L0.2,3.8L0.1,3.5L0.3,3.3L0.1,3L0.1,2.7L0.2,2.4L0.1,2.1L0.1,1.8L0.1,1.5L0.2,1.3L0.3,1L0,0.7L0,0.4L0.3,0.2L0.4,0.1L0.7,0.1L1,0.2L1.3,0.1L1.6,0.3L1.9,0.1L2.1,0.1L2.4,0.2L2.7,0.1L3,0.3L3.3,0.2L3.6,0.2L3.8,0.2L4.1,0.1L4.4,0.3L4.7,0.1L5,0.2L5.3,0.1L5.6,0L5.9,0L5.8,0.4L6,0.7L6,1L5.9,1.2L5.7,1.5L5.7,1.8L5.9,2.1L5.7,2.4L5.8,2.7L6,3L5.9,3.3L5.8,3.5L5.8,3.8L5.8,4.1L6,4.4L5.8,4.7L5.7,5L5.7,5.3L5.8,5.5Z',
  },
  sdoz: { path: 'M6,6L0.5,6L0,0L6,0.5Z' },
  drop_in: { path: 'M3,6L3,6C1.3,6,0,4.7,0,3l0-3l3,0c1.7,0,3,1.3,3,3v0C6,4.7,4.7,6,3,6z' },
  drop: { path: 'M6,6H3C1.3,6,0,4.7,0,3v0c0-1.7,1.3-3,3-3h0c1.7,0,3,1.3,3,3V6z' },
  dropeye: { path: 'M6,6H3C1.3,6,0,4.7,0,3l0-3l3,0c1.7,0,3,1.3,3,3V6z' },
  circle: { path: 'M3,0a3,3 0 1,1 0,6a3,3 0 1,1 0,-6z' },
  dot: { path: 'M3,1a2,2 0 1,1 0,4a2,2 0 1,1 0,-4z' },
  rounded: {
    path: 'M6,1.7v2.7C6,5.2,5.2,6,4.3,6H1.7C0.7,6,0,5.3,0,4.3V1.7C0,0.8,0.8,0,1.7,0h2.7C5.3,0,6,0.7,6,1.7z',
  },
  sun: {
    path: 'M3,0L3.4,0.7L4,0.2L4.1,0.9L4.9,0.7L4.8,1.5L5.6,1.5L5.2,2.2L5.9,2.5L5.3,3L5.9,3.5L5.2,3.8L5.6,4.5L4.8,4.5L4.9,5.3L4.1,5.1L4,5.8L3.4,5.3L3,6L2.5,5.3L1.9,5.8L1.8,5.1L1,5.3L1.1,4.5L0.4,4.5L0.7,3.8L0,3.5L0.6,3L0,2.5L0.7,2.2L0.4,1.5L1.1,1.5L1,0.7L1.8,0.9L1.9,0.2L2.5,0.7Z',
  },
  star: {
    path: 'M3.2,0.3l0.6,1.3C4,1.8,4.1,1.9,4.3,1.9l1.4,0.2c0.2,0,0.3,0.3,0.2,0.5l-1,1C4.7,3.7,4.7,3.9,4.7,4.1L5,5.5 c0,0.2-0.2,0.4-0.4,0.3L3.3,5.2c-0.2-0.1-0.4-0.1-0.6,0L1.4,5.8C1.2,5.9,1,5.8,1,5.5l0.2-1.4c0-0.2,0-0.4-0.2-0.5l-1-1 C-0.1,2.4,0,2.2,0.2,2.1l1.4-0.2c0.2,0,0.4-0.2,0.5-0.3l0.6-1.3C2.9,0.1,3.1,0.1,3.2,0.3z',
  },
  diamond: { path: 'M3,0.9L5.1,3L3,5.1L0.9,3Z' },
  sparkle: {
    path: 'M3,0L3,0c0,1.7-1.3,3-3,3h0h0c1.7,0,3,1.3,3,3v0v0c0-1.7,1.3-3,3-3h0h0C4.3,3,3,1.7,3,0L3,0z',
  },
  danger: { path: 'M3,5.1L3.9,6H6V3.9L5.1,3L6,2.1V0H3.9L3,0.9L2.1,0H0V2.1L0.9,3L0,3.9V6H2.1Z' },
  cross: { path: 'M6,1.5H4.5V0H1.5V1.5H0V4.5H1.5V6H4.5V4.5H6Z' },
  plus: {
    path: 'M4.5,1.5C4.5,0.7,3.8,0,3,0S1.5,0.7,1.5,1.5V1.5C0.7,1.5,0,2.2,0,3s0.7,1.5,1.5,1.5V4.5C1.5,5.3,2.2,6,3,6s1.5-0.7,1.5-1.5V4.5C5.3,4.5,6,3.8,6,3s-0.7-1.5-1.5-1.5Z',
  },
  heart: {
    path: 'M6,1.8C5.9,1,5.3,0.4,4.5,0.3C3.9,0.2,3.4,0.5,3,0.9C2.6,0.5,2.1,0.3,1.6,0.3C0.8,0.4,0.1,1,0,1.8 C0,2.3,0.1,2.7,0.3,3l0,0l0,0c0.1,0.1,0.2,0.2,0.3,0.3l1.9,2.2c0.3,0.3,0.7,0.3,0.9,0l1.8-1.9c0.1-0.1,0.3-0.3,0.4-0.5 C5.9,2.8,6.1,2.3,6,1.8z',
  },
  nine_dots: {
    path: 'M0,1a1,1 0 1,0 2,0a1,1 0 1,0 -2,0 M2,1a1,1 0 1,0 2,0a1,1 0 1,0 -2,0 M4,1a1,1 0 1,0 2,0a1,1 0 1,0 -2,0 M0,3a1,1 0 1,0 2,0a1,1 0 1,0 -2,0 M2,3a1,1 0 1,0 2,0a1,1 0 1,0 -2,0 M4,3a1,1 0 1,0 2,0a1,1 0 1,0 -2,0 M0,5a1,1 0 1,0 2,0a1,1 0 1,0 -2,0 M2,5a1,1 0 1,0 2,0a1,1 0 1,0 -2,0 M4,5a1,1 0 1,0 2,0a1,1 0 1,0 -2,0',
  },
  diagonal: { path: 'M6,6L3,6L0,3L0,0L3,0L6,3Z' },
  vortex: {
    path: 'M3.5,6C0.7,4.7,1.7,3,0,3.5C1.3,0.7,3,1.7,2.5,0C5.3,1.3,4.3,3,6,2.5C4.7,5.3,3,4.3,3.5,6z',
  },
  bruised: {
    path: 'M1.5,6C1.2,5.3,0.7,4.8,0,4.5v-3C0,0.7,0.7,0,1.5,0h3C4.8,0.7,5.3,1.2,6,1.5v3C6,5.3,5.3,6,4.5,6H1.5z',
  },
}

export async function generateQrDataUrl(
  content: string,
  options: {
    color: { dark: string; light: string }
    width: number
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
    logo?: string | null
    markerOut?: string
    markerIn?: string
    pattern?: string
    frame?: {
      type: 'none' | 'bottom' | 'top' | 'box' | 'banner-top' | 'banner-bottom' | 'border'
      text: string
      textSize: number
      color: string
    }
  },
): Promise<string> {
  // @ts-expect-error - qrcode is loaded from remote CDN
  const qrcodeModule = await import('https://esm.sh/qrcode')
  const QRCode = qrcodeModule.default || qrcodeModule

  // Generate QR Matrix
  const qrData = QRCode.create(content, {
    errorCorrectionLevel: options.errorCorrectionLevel,
  })
  const modules = qrData.modules
  const h = modules.size
  const w = h
  const cellSize = options.width / h

  // Calculate extra height for frames
  let extraHeight = 0
  let offsetY = 0
  const frameType = options.frame?.type || 'none'
  const hasFrame = frameType !== 'none'
  const frameHeight = options.width * 0.25

  if (frameType === 'bottom' || frameType === 'banner-bottom') {
    extraHeight = frameHeight
  } else if (frameType === 'top' || frameType === 'banner-top') {
    extraHeight = frameHeight
    offsetY = frameHeight
  } else if (frameType === 'border') {
    extraHeight = 32
    offsetY = 16
  }

  const canvas = document.createElement('canvas')
  const totalWidth = frameType === 'border' ? options.width + 32 : options.width
  const totalHeight = options.width + extraHeight
  canvas.width = totalWidth
  canvas.height = totalHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  // Draw background
  if (options.color.light !== 'transparent') {
    ctx.fillStyle = options.color.light
    ctx.fillRect(0, 0, totalWidth, totalHeight)
  }

  const qrX = frameType === 'border' ? 16 : 0

  // Draw modules with pattern
  const patternData = PATTERNS[options.pattern || 'default'] || PATTERNS.default!
  const p2 = new Path2D(patternData.path)

  ctx.fillStyle = options.color.dark

  const isFinder = (r: number, c: number) => {
    return (r < 7 && c < 7) || (r < 7 && c >= w - 7) || (r >= h - 7 && c < 7)
  }

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (modules.get(c, r) && !isFinder(r, c)) {
        const x = qrX + c * cellSize
        const y = offsetY + r * cellSize
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(cellSize / 6, cellSize / 6)
        ctx.fill(p2)
        ctx.restore()
      }
    }
  }

  // Draw Markers
  const mOut = MARKERS_OUT[options.markerOut || 'default'] || MARKERS_OUT.default!
  const mIn = MARKERS_IN[options.markerIn || 'default'] || MARKERS_IN.default!
  const pOut = new Path2D(mOut.path)
  const pIn = new Path2D(mIn.path)

  const markersPos: [number, number][] = [
    [0, 0],
    [w - 7, 0],
    [0, h - 7],
  ]
  markersPos.forEach(([c, r]) => {
    const x = qrX + c * cellSize
    const y = offsetY + r * cellSize

    // Outer
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(cellSize / 2, cellSize / 2) // 14x14 grid to 7x7 modules
    ctx.fill(pOut)
    ctx.restore()

    // Inner
    ctx.save()
    ctx.translate(x + 2 * cellSize, y + 2 * cellSize)
    ctx.scale(cellSize / 2, cellSize / 2) // 6x6 grid to 3x3 modules
    ctx.fill(pIn)
    ctx.restore()
  })

  // Draw Frame
  if (hasFrame && options.frame) {
    const fData = FRAMES[frameType] || FRAMES.none!
    const fPath = new Path2D(fData.path)
    ctx.fillStyle = options.frame.color

    ctx.save()
    const scale = options.width / 24
    if (frameType === 'border') {
      ctx.strokeStyle = options.frame.color
      ctx.lineWidth = 8
      ctx.strokeRect(4, 4, totalWidth - 8, totalHeight - 8)
    } else {
      ctx.translate(qrX, offsetY === 0 ? 0 : 0) // Align to QR top/bottom
      if (frameType === 'top' || frameType === 'banner-top') {
        ctx.translate(0, -offsetY)
      }
      ctx.scale(scale, scale)
      ctx.fill(fPath)
    }
    ctx.restore()

    // Draw Frame Text
    if (options.frame.text && fData.label_size > 0) {
      const fontSize = (frameHeight * 0.4 * options.frame.textSize) / 100
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillStyle = options.color.light
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const textX = totalWidth / 2
      const textY = fData.label_pos === 'top' ? frameHeight / 2 : options.width + frameHeight / 2

      ctx.fillText(options.frame.text, textX, textY)
    }
  }

  // Draw Logo
  if (options.logo) {
    const img = new Image()
    img.src = options.logo
    await new Promise((resolve) => {
      img.onload = resolve
    })

    const logoSize = options.width * 0.2
    const x = qrX + (options.width - logoSize) / 2
    const y = offsetY + (options.width - logoSize) / 2

    ctx.fillStyle = options.color.light
    ctx.fillRect(x - 2, y - 2, logoSize + 4, logoSize + 4)
    ctx.drawImage(img, x, y, logoSize, logoSize)
  }

  return canvas.toDataURL('image/png')
}

export interface QrOptions {
  color: { dark: string; light: string }
  width: number
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  logo?: string | null
  markerOut?: string
  markerIn?: string
  pattern?: string
  frame?: {
    type: 'none' | 'bottom' | 'top' | 'box' | 'banner-top' | 'banner-bottom' | 'border'
    text: string
    textSize: number
    color: string
  }
}

export async function generateQrSvg(content: string, options: QrOptions): Promise<string> {
  const dataUrl = await generateQrDataUrl(content, options)

  // Calculate size
  let extraHeight = 0
  const frameHeight = options.width * 0.25
  const frameType = options.frame?.type || 'none'
  if (
    frameType === 'bottom' ||
    frameType === 'banner-bottom' ||
    frameType === 'top' ||
    frameType === 'banner-top'
  ) {
    extraHeight = frameHeight
  } else if (frameType === 'border') {
    extraHeight = 32
  }

  const totalWidth = frameType === 'border' ? options.width + 32 : options.width
  const totalHeight = options.width + extraHeight

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}"><image href="${dataUrl}" width="${totalWidth}" height="${totalHeight}" /></svg>`
}
