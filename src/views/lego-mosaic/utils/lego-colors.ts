export interface LegoColor {
  id: number
  name: string
  rgb: [number, number, number]
  hex: string
}

/**
 * ~60 popular LEGO solid colors sourced from BrickLink color reference.
 * RGB values are the closest real-world approximations for on-screen rendering.
 */
export const LEGO_COLORS: LegoColor[] = [
  // ── Neutrals ──────────────────────────────────────────────────────────────
  { id: 1, name: 'White', rgb: [242, 243, 242], hex: '#F2F3F2' },
  { id: 2, name: 'Light Bluish Gray', rgb: [160, 165, 169], hex: '#A0A5A9' },
  { id: 3, name: 'Dark Bluish Gray', rgb: [99, 95, 98], hex: '#635F62' },
  { id: 4, name: 'Black', rgb: [27, 42, 52], hex: '#1B2A34' },

  // ── Skin tones / nougats ──────────────────────────────────────────────────
  { id: 5, name: 'Light Nougat', rgb: [254, 204, 176], hex: '#FECCB0' },
  { id: 6, name: 'Nougat', rgb: [204, 142, 105], hex: '#CC8E69' },
  { id: 7, name: 'Medium Dark Flesh', rgb: [175, 112, 71], hex: '#AF7047' },
  { id: 8, name: 'Dark Flesh', rgb: [127, 70, 37], hex: '#7F4625' },

  // ── Browns ────────────────────────────────────────────────────────────────
  { id: 9, name: 'Reddish Brown', rgb: [95, 49, 9], hex: '#5F3109' },
  { id: 10, name: 'Dark Brown', rgb: [53, 33, 0], hex: '#352100' },

  // ── Tans / sand yellows ───────────────────────────────────────────────────
  { id: 11, name: 'Tan', rgb: [222, 198, 156], hex: '#DEC69C' },
  { id: 12, name: 'Dark Tan', rgb: [138, 121, 93], hex: '#8A795D' },
  { id: 13, name: 'Sand Yellow', rgb: [219, 185, 128], hex: '#DBB980' },
  { id: 14, name: 'Earth Orange', rgb: [143, 79, 42], hex: '#8F4F2A' },

  // ── Reds ──────────────────────────────────────────────────────────────────
  { id: 15, name: 'Red', rgb: [196, 40, 27], hex: '#C4281B' },
  { id: 16, name: 'Dark Red', rgb: [114, 14, 15], hex: '#720E0F' },
  { id: 17, name: 'Coral', rgb: [255, 109, 88], hex: '#FF6D58' },
  { id: 18, name: 'Sand Red', rgb: [149, 98, 84], hex: '#956254' },

  // ── Pinks / magentas ──────────────────────────────────────────────────────
  { id: 19, name: 'Pink', rgb: [255, 155, 205], hex: '#FF9BCD' },
  { id: 20, name: 'Dark Pink', rgb: [211, 53, 157], hex: '#D3359D' },
  { id: 21, name: 'Magenta', rgb: [144, 31, 118], hex: '#901F76' },

  // ── Oranges ───────────────────────────────────────────────────────────────
  { id: 22, name: 'Bright Light Orange', rgb: [252, 175, 62], hex: '#FCAF3E' },
  { id: 23, name: 'Orange', rgb: [218, 133, 64], hex: '#DA8540' },
  { id: 24, name: 'Dark Orange', rgb: [168, 85, 0], hex: '#A85500' },

  // ── Yellows ───────────────────────────────────────────────────────────────
  { id: 25, name: 'Bright Light Yellow', rgb: [255, 240, 91], hex: '#FFF05B' },
  { id: 26, name: 'Yellow', rgb: [245, 205, 47], hex: '#F5CD2F' },
  { id: 27, name: 'Light Yellow', rgb: [249, 233, 153], hex: '#F9E999' },

  // ── Limes / olives ────────────────────────────────────────────────────────
  { id: 28, name: 'Light Lime', rgb: [218, 233, 145], hex: '#DAE991' },
  { id: 29, name: 'Medium Lime', rgb: [195, 217, 76], hex: '#C3D94C' },
  { id: 30, name: 'Lime', rgb: [166, 202, 85], hex: '#A6CA55' },
  { id: 31, name: 'Olive Green', rgb: [105, 113, 64], hex: '#697140' },

  // ── Greens ────────────────────────────────────────────────────────────────
  { id: 32, name: 'Light Green', rgb: [125, 191, 131], hex: '#7DBF83' },
  { id: 33, name: 'Medium Green', rgb: [149, 195, 121], hex: '#95C379' },
  { id: 34, name: 'Bright Green', rgb: [75, 159, 74], hex: '#4B9F4A' },
  { id: 35, name: 'Green', rgb: [75, 151, 74], hex: '#4B974A' },
  { id: 36, name: 'Dark Green', rgb: [39, 70, 44], hex: '#27462C' },
  { id: 37, name: 'Sand Green', rgb: [118, 160, 128], hex: '#76A080' },

  // ── Blues ─────────────────────────────────────────────────────────────────
  { id: 38, name: 'Bright Light Blue', rgb: [154, 203, 220], hex: '#9ACBDC' },
  { id: 39, name: 'Medium Blue', rgb: [115, 172, 206], hex: '#73ACCE' },
  { id: 40, name: 'Sky Blue', rgb: [91, 157, 214], hex: '#5B9DD6' },
  { id: 41, name: 'Blue', rgb: [13, 105, 171], hex: '#0D69AB' },
  { id: 42, name: 'Dark Blue', rgb: [20, 48, 68], hex: '#143044' },
  { id: 43, name: 'Sand Blue', rgb: [112, 142, 169], hex: '#708EA9' },

  // ── Azures / teals / turquoises ──────────────────────────────────────────
  { id: 44, name: 'Dark Azure', rgb: [11, 130, 175], hex: '#0B82AF' },
  { id: 45, name: 'Medium Azure', rgb: [66, 192, 202], hex: '#42C0CA' },
  { id: 46, name: 'Dark Turquoise', rgb: [17, 137, 131], hex: '#118983' },
  { id: 47, name: 'Light Aqua', rgb: [193, 227, 213], hex: '#C1E3D5' },
  { id: 48, name: 'Dark Aqua', rgb: [9, 96, 85], hex: '#096055' },

  // ── Purples / lavenders ───────────────────────────────────────────────────
  { id: 49, name: 'Lavender', rgb: [199, 172, 219], hex: '#C7ACDB' },
  { id: 50, name: 'Medium Lavender', rgb: [160, 110, 185], hex: '#A06EB9' },
  { id: 51, name: 'Purple', rgb: [129, 0, 123], hex: '#81007B' },
  { id: 52, name: 'Dark Purple', rgb: [73, 31, 96], hex: '#491F60' },
  { id: 53, name: 'Sand Purple', rgb: [136, 115, 153], hex: '#887399' },

  // ── Metallics ─────────────────────────────────────────────────────────────
  { id: 54, name: 'Flat Silver', rgb: [137, 135, 136], hex: '#898788' },
  { id: 55, name: 'Metallic Silver', rgb: [167, 168, 174], hex: '#A7A8AE' },
  { id: 56, name: 'Flat Dark Gold', rgb: [164, 125, 50], hex: '#A47D32' },
  { id: 57, name: 'Pearl Gold', rgb: [219, 172, 52], hex: '#DBAC34' },
  { id: 58, name: 'Copper', rgb: [174, 122, 90], hex: '#AE7A5A' },

  // ── Warm extras ───────────────────────────────────────────────────────────
  { id: 59, name: 'Warm Gold', rgb: [207, 166, 49], hex: '#CFA631' },
  { id: 60, name: 'Dark Flesh (Alt)', rgb: [104, 56, 26], hex: '#68381A' },
]

/** Pre-built flat Uint8Array: [r0,g0,b0, r1,g1,b1, ...] for tight-loop access */
export const COLOR_RGB_FLAT = new Uint8Array(LEGO_COLORS.length * 3)
LEGO_COLORS.forEach((c, i) => {
  COLOR_RGB_FLAT[i * 3] = c.rgb[0]
  COLOR_RGB_FLAT[i * 3 + 1] = c.rgb[1]
  COLOR_RGB_FLAT[i * 3 + 2] = c.rgb[2]
})
