/**
 * Key mappings for our virtual keyboard.
 * Mapping the native KeyboardEvent.code to labels for display.
 */

export interface KeyInfo {
  code: string
  label: string
  labelShift?: string
  width?: string // Tailwind classes for width
  height?: string // Tailwind classes for height
  isSmall?: boolean // Font size for smaller labels (e.g. F1, Caps, etc)
  spanH?: boolean
  spanV?: boolean
  gridArea?: string // For precise grid placement
}

// Row 0: Esc, F1-F12, PrtSc, ScLk, Pause
export const ROW_FUNCTION = [
  { code: 'Escape', label: 'Esc', width: 'flex-1' },
  { code: 'GAP_1', label: '', width: 'w-4' }, // Spacer
  { code: 'F1', label: 'F1', flex: 1 },
  { code: 'F2', label: 'F2', flex: 1 },
  { code: 'F3', label: 'F3', flex: 1 },
  { code: 'F4', label: 'F4', flex: 1 },
  { code: 'GAP_2', label: '', width: 'w-4' }, // Spacer
  { code: 'F5', label: 'F5', flex: 1 },
  { code: 'F6', label: 'F6', flex: 1 },
  { code: 'F7', label: 'F7', flex: 1 },
  { code: 'F8', label: 'F8', flex: 1 },
  { code: 'GAP_3', label: '', width: 'w-4' }, // Spacer
  { code: 'F9', label: 'F9', flex: 1 },
  { code: 'F10', label: 'F10', flex: 1 },
  { code: 'F11', label: 'F11', flex: 1 },
  { code: 'F12', label: 'F12', flex: 1 },
  { code: 'GAP_4', label: '', width: 'w-4' }, // Spacer
  { code: 'PrintScreen', label: 'PrtSc', flex: 1, isSmall: true },
  { code: 'ScrollLock', label: 'ScLk', flex: 1, isSmall: true },
  { code: 'Pause', label: 'Pause', flex: 1, isSmall: true },
]

export const ROW_1 = [
  { code: 'Backquote', label: '`', labelShift: '~' },
  { code: 'Digit1', label: '1', labelShift: '!' },
  { code: 'Digit2', label: '2', labelShift: '@' },
  { code: 'Digit3', label: '3', labelShift: '#' },
  { code: 'Digit4', label: '4', labelShift: '$' },
  { code: 'Digit5', label: '5', labelShift: '%' },
  { code: 'Digit6', label: '6', labelShift: '^' },
  { code: 'Digit7', label: '7', labelShift: '&' },
  { code: 'Digit8', label: '8', labelShift: '*' },
  { code: 'Digit9', label: '9', labelShift: '(' },
  { code: 'Digit0', label: '0', labelShift: ')' },
  { code: 'Minus', label: '-', labelShift: '_' },
  { code: 'Equal', label: '=', labelShift: '+' },
  { code: 'Backspace', label: 'Backspace', width: 'w-[100px]', isSmall: true },
]

export const ROW_2 = [
  { code: 'Tab', label: 'Tab', width: 'w-[68px]', isSmall: true },
  { code: 'KeyQ', label: 'Q' },
  { code: 'KeyW', label: 'W' },
  { code: 'KeyE', label: 'E' },
  { code: 'KeyR', label: 'R' },
  { code: 'KeyT', label: 'T' },
  { code: 'KeyY', label: 'Y' },
  { code: 'KeyU', label: 'U' },
  { code: 'KeyI', label: 'I' },
  { code: 'KeyO', label: 'O' },
  { code: 'KeyP', label: 'P' },
  { code: 'BracketLeft', label: '[', labelShift: '{' },
  { code: 'BracketRight', label: ']', labelShift: '}' },
  { code: 'Backslash', label: '\\', labelShift: '|', width: 'w-[72px]' },
]

export const ROW_3 = [
  { code: 'CapsLock', label: 'Caps', width: 'w-[84px]', isSmall: true },
  { code: 'KeyA', label: 'A' },
  { code: 'KeyS', label: 'S' },
  { code: 'KeyD', label: 'D' },
  { code: 'KeyF', label: 'F' },
  { code: 'KeyG', label: 'G' },
  { code: 'KeyH', label: 'H' },
  { code: 'KeyJ', label: 'J' },
  { code: 'KeyK', label: 'K' },
  { code: 'KeyL', label: 'L' },
  { code: 'Semicolon', label: ';', labelShift: ':' },
  { code: 'Quote', label: "'", labelShift: '"' },
  { code: 'Enter', label: 'Enter', width: 'w-[105px]', isSmall: true },
]

export const ROW_4 = [
  { code: 'ShiftLeft', label: 'Shift', width: 'w-[102px]', isSmall: true },
  { code: 'KeyZ', label: 'Z' },
  { code: 'KeyX', label: 'X' },
  { code: 'KeyC', label: 'C' },
  { code: 'KeyV', label: 'V' },
  { code: 'KeyB', label: 'B' },
  { code: 'KeyN', label: 'N' },
  { code: 'KeyM', label: 'M' },
  { code: 'Comma', label: ',', labelShift: '<' },
  { code: 'Period', label: '.', labelShift: '>' },
  { code: 'Slash', label: '/', labelShift: '?' },
  { code: 'ShiftRight', label: 'Shift', width: 'w-[136px]', isSmall: true },
]

export const ROW_5 = [
  { code: 'ControlLeft', label: 'Ctrl', width: 'w-[64px]', isSmall: true },
  { code: 'MetaLeft', label: 'Win', width: 'w-[64px]', isSmall: true },
  { code: 'AltLeft', label: 'Alt', width: 'w-[64px]', isSmall: true },
  { code: 'Space', label: '', width: 'flex-1' },
  { code: 'AltRight', label: 'Alt', width: 'w-[64px]', isSmall: true },
  { code: 'MetaRight', label: 'Win', width: 'w-[64px]', isSmall: true }, // or Fn
  { code: 'ContextMenu', label: 'Menu', width: 'w-[64px]', isSmall: true },
  { code: 'ControlRight', label: 'Ctrl', width: 'w-[64px]', isSmall: true },
]

export const ROW_NAVIGATION = [
  { code: 'Insert', label: 'Ins', isSmall: true },
  { code: 'Home', label: 'Home', isSmall: true },
  { code: 'PageUp', label: 'PgUp', isSmall: true },
  { code: 'Delete', label: 'Del', isSmall: true },
  { code: 'End', label: 'End', isSmall: true },
  { code: 'PageDown', label: 'PgDn', isSmall: true },
]

export const ARROWS = [
  { code: 'ArrowUp', label: '↑' },
  { code: 'ArrowLeft', label: '←' },
  { code: 'ArrowDown', label: '↓' },
  { code: 'ArrowRight', label: '→' },
]

export const NUMPAD = [
  { code: 'NumLock', label: 'Num', gridArea: '1 / 1' },
  { code: 'NumpadDivide', label: '/', gridArea: '1 / 2' },
  { code: 'NumpadMultiply', label: '*', gridArea: '1 / 3' },
  { code: 'NumpadSubtract', label: '-', gridArea: '1 / 4' },
  { code: 'Numpad7', label: '7', gridArea: '2 / 1' },
  { code: 'Numpad8', label: '8', gridArea: '2 / 2' },
  { code: 'Numpad9', label: '9', gridArea: '2 / 3' },
  { code: 'NumpadAdd', label: '+', spanV: true, gridArea: '2 / 4 / 4 / 5' }, // Hàng 2-4
  { code: 'Numpad4', label: '4', gridArea: '3 / 1' },
  { code: 'Numpad5', label: '5', gridArea: '3 / 2' },
  { code: 'Numpad6', label: '6', gridArea: '3 / 3' },
  { code: 'Numpad1', label: '1', gridArea: '4 / 1' },
  { code: 'Numpad2', label: '2', gridArea: '4 / 2' },
  { code: 'Numpad3', label: '3', gridArea: '4 / 3' },
  { code: 'NumpadEnter', label: 'Ent', spanV: true, gridArea: '4 / 4 / 6 / 5' }, // Hàng 4-6
  { code: 'Numpad0', label: '0', spanH: true, gridArea: '5 / 1 / 6 / 3' }, // Cột 1-3
  { code: 'NumpadDecimal', label: '.', gridArea: '5 / 3' },
]
