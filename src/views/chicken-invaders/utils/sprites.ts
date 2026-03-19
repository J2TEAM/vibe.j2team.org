export const SPRITES = {
  // Phi thuyền
  player: `<svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]">
    <defs>
      <linearGradient id="shipGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#bae6fd" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>
      <linearGradient id="wingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#7dd3fc" />
        <stop offset="100%" stop-color="#0369a1" />
      </linearGradient>
    </defs>
    <path d="M 32 22 Q 56 26 60 50 Q 46 44 32 44 Q 18 44 4 50 Q 8 26 32 22 Z" fill="url(#wingGrad)" stroke="#38BDF8" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M 32 8 C 44 8 44 38 40 50 C 38 56 26 56 24 50 C 20 38 20 8 32 8 Z" fill="url(#shipGrad)" stroke="#38BDF8" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <ellipse cx="32" cy="28" rx="6" ry="10" fill="#e0f2fe" stroke="#38BDF8" stroke-width="1.5"/>
    <path d="M 30 22 Q 34 22 36 28" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.8"/>
  </svg>`,
  // Gà Minion thường
  chicken: `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M 10 36 C 4 36 4 46 12 44 M 54 36 C 60 36 60 46 52 44" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/><ellipse cx="32" cy="36" rx="22" ry="24" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/><path d="M 11 40 C 11 52 20 60 32 60 C 44 60 53 52 53 40 Q 32 48 11 40 Z" fill="currentColor" opacity="0.85" /><path d="M 11 40 Q 32 48 53 40" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="1.5" stroke-linecap="round"/><circle cx="24" cy="26" r="4" fill="#0f172a"/><circle cx="40" cy="26" r="4" fill="#0f172a"/><circle cx="25" cy="25" r="1.5" fill="#ffffff"/><circle cx="41" cy="25" r="1.5" fill="#ffffff"/><path d="M 28 32 Q 32 38 36 32 Q 32 30 28 32 Z" fill="#f59e0b" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><path d="M 32 12 C 26 2 20 8 24 14 C 24 14 30 18 32 20 C 34 18 40 14 40 14 C 44 8 38 2 32 12 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5" stroke-linejoin="round"/></svg>`,

  // Boss 0: Gà Chúa (Giant Chicken - Mắt dữ tợn, mào to)
  bossGiantChicken: `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M 8 40 C 0 40 0 50 10 48 M 56 40 C 64 40 64 50 54 48" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/><ellipse cx="32" cy="38" rx="26" ry="26" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/><path d="M 9 42 C 9 56 20 64 32 64 C 44 64 55 56 55 42 Q 32 50 9 42 Z" fill="currentColor" opacity="0.85" /><path d="M 9 42 Q 32 50 55 42" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="2" stroke-linecap="round"/><path d="M 18 24 L 28 28 L 24 30 Z" fill="#0f172a"/><path d="M 46 24 L 36 28 L 40 30 Z" fill="#0f172a"/><path d="M 28 34 Q 32 42 36 34 Q 32 32 28 34 Z" fill="#f59e0b" stroke="#d97706" stroke-width="2" stroke-linejoin="round"/><path d="M 32 10 C 24 0 16 6 22 14 C 22 14 28 18 32 20 C 36 18 42 14 42 14 C 48 6 40 0 32 10 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2" stroke-linejoin="round"/></svg>`,

  // Boss 1 & 4: Gà Trống Kính Râm (Rooster)
  bossRooster: `<svg viewBox="0 0 64 64" class="w-full h-full"><path d="M 24 16 L 20 4 L 30 10 L 36 2 L 40 12 L 48 8 L 42 18 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="32" cy="38" rx="24" ry="22" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/><path d="M 12 40 C 12 50 22 58 32 58 C 42 58 52 50 52 40 Q 32 46 12 40 Z" fill="currentColor" opacity="0.9" /><path d="M 18 26 L 46 26 L 42 32 L 34 32 L 32 28 L 30 32 L 22 32 Z" fill="#0f172a" stroke="#ffffff" stroke-width="1" stroke-linejoin="round"/><path d="M 28 34 Q 32 42 36 34 Q 32 32 28 34 Z" fill="#f59e0b" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/><path d="M 32 38 Q 30 44 32 46 Q 34 44 32 38 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/></svg>`,

  // Boss 2: UFO
  ufo: `<svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[0_0_20px_rgba(56,189,248,0.8)]"><path d="M 16 32 C 16 12 48 12 48 32" fill="#0ea5e9" opacity="0.7" stroke="#38bdf8" stroke-width="2"/><ellipse cx="32" cy="36" rx="28" ry="12" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/><circle cx="16" cy="36" r="3" fill="#38bdf8"/><circle cx="32" cy="40" r="3" fill="#38bdf8"/><circle cx="48" cy="36" r="3" fill="#38bdf8"/></svg>`,

  // Boss 3: Mecha Ship
  bossMecha: `<svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[0_0_20px_rgba(225,29,72,0.8)]"><path d="M 32 16 L 60 8 L 48 36 L 32 60 L 16 36 L 4 8 Z" fill="#334155" stroke="#94a3b8" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="32" r="12" fill="#be123c" stroke="#f43f5e" stroke-width="2"/><circle cx="32" cy="32" r="6" fill="#fecdd3"/><path d="M 32 60 L 28 48 L 36 48 Z" fill="#94a3b8"/></svg>`,

  // Boss 5: Mega chicken
  megaBoss: `<svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[0_0_25px_rgba(255,215,0,0.9)]">
      <path d="M 32 10 C 15 10 10 25 10 40 C 10 55 22 60 32 60 C 42 60 54 55 54 40 C 54 25 49 10 32 10" fill="#FFD700" stroke="#B8860B" stroke-width="3"/>
      <circle cx="22" cy="30" r="5" fill="white"/><circle cx="22" cy="30" r="2" fill="black"/>
      <circle cx="42" cy="30" r="5" fill="white"/><circle cx="42" cy="30" r="2" fill="black"/>
      <path d="M 28 42 Q 32 50 36 42" fill="none" stroke="#FF4500" stroke-width="3" stroke-linecap="round"/>
      <path d="M 10 35 Q 0 30 10 25 M 54 35 Q 64 30 54 25" fill="none" stroke="#FFD700" stroke-width="4"/>
      <path d="M 32 5 L 32 15 M 25 7 L 29 15 M 39 7 L 35 15" stroke="#FF4500" stroke-width="3" stroke-linecap="round"/>
    </svg>`,

  // Thiên thạch
  meteor: `<svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]"><path d="M 20 10 C 36 4 50 14 56 28 C 60 40 48 56 32 58 C 16 60 6 46 8 30 C 8 16 14 12 20 10 Z" fill="#78350f" stroke="#ea580c" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="24" r="4" fill="#451a03" opacity="0.8"/><circle cx="42" cy="38" r="6" fill="#451a03" opacity="0.8"/><circle cx="28" cy="46" r="3" fill="#451a03" opacity="0.8"/><circle cx="46" cy="20" r="2" fill="#451a03" opacity="0.6"/></svg>`,

  // Trứng
  egg: `<svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"><ellipse cx="32" cy="32" rx="22" ry="28" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/><path d="M 16 26 Q 32 16 48 26" stroke="#e2e8f0" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,

  // Két sắt
  safe: `<svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[0_0_15px_rgba(148,163,184,0.8)]"><rect x="8" y="12" width="48" height="40" rx="4" ry="4" fill="#475569" stroke="#94a3b8" stroke-width="3"/><rect x="14" y="18" width="36" height="28" rx="2" ry="2" fill="#334155" stroke="#64748b" stroke-width="2"/><circle cx="32" cy="32" r="8" fill="#1e293b" stroke="#cbd5e1" stroke-width="2"/><circle cx="32" cy="32" r="2" fill="#ef4444"/><path d="M 32 24 L 32 28 M 32 36 L 32 40 M 24 32 L 28 32 M 36 32 L 40 32" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/><rect x="46" y="20" width="4" height="6" rx="1" fill="#94a3b8"/><rect x="46" y="38" width="4" height="6" rx="1" fill="#94a3b8"/></svg>`,

  // Rương vũ khí
  stash: `<svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[0_0_15px_rgba(255,184,48,0.8)]"><rect x="12" y="18" width="40" height="32" rx="8" ry="8" fill="#b45309" stroke="#f59e0b" stroke-width="3"/><path d="M 12 34 C 25 34 39 34 52 34" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/><rect x="26" y="26" width="12" height="8" rx="4" ry="4" fill="#fcd34d" stroke="#d97706" stroke-width="1.5"/></svg>`,

  // Trái tim
  heart: `<svg viewBox="0 0 64 64" class="w-full h-full drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"><path d="M 32 50 C 32 50 12 34 12 20 C 12 12 20 8 26 12 C 32 16 32 16 32 16 C 32 16 32 16 38 12 C 44 8 52 12 52 20 C 52 34 32 50 32 50 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`,

  // Nâng cấp đạn
  giftBox: `<svg viewBox="0 0 64 64" class="w-full h-full">
      <path d="M 32 20 C 20 5 10 20 28 26 Z" fill="#ffffff" stroke="currentColor" stroke-width="2"/>
      <path d="M 32 20 C 44 5 54 20 36 26 Z" fill="#ffffff" stroke="currentColor" stroke-width="2"/>
      <rect x="16" y="28" width="32" height="28" rx="2" fill="currentColor"/>
      <rect x="12" y="20" width="40" height="8" rx="2" fill="currentColor"/>
      <rect x="28" y="20" width="8" height="36" fill="#ffffff"/>
    </svg>`,
}
