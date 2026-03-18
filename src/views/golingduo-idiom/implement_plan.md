# 📋 Implementation Plan — GolingDuo Idiom

> Sub-page thuộc dự án **vibe.j2team.org**
> Parody của Duolingo, nhưng lầy hơn, tối hơn, và dạy Idiom tiếng Anh cho người Việt.

---

## 1. Tổng Quan Dự Án

| Thông tin | Chi tiết |
|---|---|
| **Tên hiển thị** | GolingDuo Idiom 🦜 |
| **Slug** | `golingduo-idiom` |
| **Đường dẫn** | `src/views/golingduo-idiom/` |
| **Mô tả** | Học thành ngữ tiếng Anh kiểu lầy lội — dịch thẳng chết cười, nhưng học xong nhớ mãi |
| **Ngôn ngữ** | Tiếng Việt (chính) |
| **Không database** | ✅ Toàn bộ dùng `localStorage` + data tĩnh |
| **Responsive** | ✅ Mobile-first |

---

## 2. Cấu Trúc Thư Mục

```
src/views/golingduo-idiom/
├── index.vue                    # Entry point, router-view nội bộ
├── meta.ts                      # Tên, mô tả, tác giả cho launcher
│
├── data/
│   ├── idioms.ts                # ~80 idioms tĩnh (type-safe)
│   └── categories.ts            # Danh sách chủ đề + emoji + màu accent
│
├── composables/
│   ├── useProgress.ts           # localStorage: streak, XP, learned set
│   ├── useIdiomOfDay.ts         # Seed idiom theo ngày trong năm
│   ├── useQuiz.ts               # Quiz logic: shuffle, score, timer
│   └── useSpin.ts               # Random idiom + animation state
│
├── components/
│   ├── layout/
│   │   ├── AppHeader.vue        # Nav tabs + streak badge
│   │   └── AppFooter.vue        # Back to home link (bắt buộc theo rules)
│   │
│   ├── flashcard/
│   │   ├── FlipCard.vue         # 3D flip: literal → meaning → context
│   │   ├── FlipCardDeck.vue     # Stack nhiều card, swipe next/prev
│   │   └── IdiomOfDay.vue       # Card đặc biệt "Flex Của Ngày"
│   │
│   ├── quiz/
│   │   ├── QuizCard.vue         # Câu hỏi + 4 lựa chọn lầy lội
│   │   ├── QuizResult.vue       # Màn hình kết quả + XP earned
│   │   └── QuizTimer.vue        # Countdown bar (Time Attack mode)
│   │
│   ├── collection/
│   │   ├── CategoryGrid.vue     # Grid các chủ đề
│   │   ├── IdiomCard.vue        # Card nhỏ trong danh sách
│   │   └── SearchBar.vue        # Tìm kiếm idiom
│   │
│   ├── spin/
│   │   └── SpinWheel.vue        # Vòng quay fortune wheel (canvas/CSS)
│   │
│   └── gamification/
│       ├── StreakBadge.vue       # Hiển thị streak ngày liên tiếp
│       ├── XpBar.vue            # Thanh kinh nghiệm + level
│       └── BadgeUnlock.vue      # Popup unlock badge mới
│
└── views/                       # Các tab chính (internal navigation)
    ├── HomeTab.vue              # Flashcard + Idiom of Day + Streak
    ├── QuizTab.vue              # Quiz mode selector + game
    ├── CollectionTab.vue        # Browse + search by category
    ├── SpinTab.vue              # Vòng quay may mắn
    └── StatsTab.vue             # Progress, badges, streak calendar
```

---

## 3. Data Schema

### 3.1 Idiom

```typescript
// src/views/golingduo-idiom/data/idioms.ts

export interface Idiom {
  id: string                  // "raining-cats-dogs"
  phrase: string              // "It's raining cats and dogs"
  literal_vi: string          // "Trời đang mưa mèo và chó 🐱🐶"
  meaning_vi: string          // "Trời mưa rất to, như trút nước"
  funny_context: string       // "Dùng khi muốn flex với sếp..."
  example_en: string          // "I can't go out, it's raining cats and dogs."
  example_vi: string          // "Tao không ra được, đang mưa như trút nước ngoài đó."
  category: CategoryId
  difficulty: 'easy' | 'medium' | 'hard'
  emoji: string               // "🌧️"
  wrong_answers: string[]     // 3 đáp án sai cho quiz (đã soạn sẵn + lầy)
}
```

### 3.2 Category

```typescript
export interface Category {
  id: CategoryId
  label: string               // "Drama & Cảm Xúc"
  emoji: string               // "😭"
  accent: 'coral' | 'amber' | 'sky'   // Màu accent theo design system
  description: string         // "Khi drama bùng nổ, mày cần những câu này"
}

export type CategoryId =
  | 'drama'        // 😭 Drama & Cảm Xúc
  | 'work'         // 💼 Công Sở Sống Còn
  | 'love'         // ❤️ Yêu Đương Éo Le
  | 'money'        // 🤑 Flex Tài Chính
  | 'daily'        // 🍜 Đời Thường Việt Nam
  | 'motivation'   // 💪 Sống Ảo Motivate
  | 'food'         // 🍕 Ăn Uống Nói Chuyện
  | 'time'         // ⏰ Thời Gian & Deadline
```

### 3.3 Progress (localStorage)

```typescript
// Key: "golingduo-progress"
export interface UserProgress {
  learnedIds: string[]         // Danh sách ID đã học
  quizScores: QuizRecord[]     // Lịch sử quiz
  streak: {
    current: number            // Streak hiện tại (ngày)
    longest: number            // Kỷ lục
    lastActiveDate: string     // "2026-03-12" — để tính streak
  }
  xp: number                   // Tổng XP tích lũy
  unlockedBadges: BadgeId[]
  spinHistory: string[]        // ID các idiom từ vòng quay gần đây
}

export interface QuizRecord {
  date: string
  score: number
  total: number
  mode: 'classic' | 'time-attack'
  category: CategoryId | 'all'
}
```

### 3.4 Badge System

```typescript
export interface Badge {
  id: BadgeId
  name: string
  description: string         // Mô tả lầy lội
  emoji: string
  condition: (progress: UserProgress) => boolean
}

// Ví dụ badges:
// 🐣 "Newbie Mơ Tây"     — Học idiom đầu tiên
// 🔥 "Cháy Không Tắt"    — Streak 7 ngày
// 🧠 "Não To Bá Đạo"     — Học 50 idioms
// 🎯 "Bắn Không Trượt"   — Quiz 10/10
// 🌀 "Số Hên Vip Pro"    — Dùng vòng quay 10 lần
// 👑 "Người Việt Nói Tiếng Anh Như Tây" — Học hết tất cả
```

---

## 4. Chi Tiết Các Tính Năng

### 4.1 🃏 Flashcard — Tab Trang Chủ

**Luồng:**
1. Hiện **Idiom of the Day** ở đầu trang (seed theo `dayOfYear % idioms.length`)
2. Bên dưới là deck flashcard cuộn ngang
3. Mỗi card flip 3 lần:
   - **Mặt 1 (Câu tiếng Anh):** Phrase lớn + emoji
   - **Mặt 2 (Dịch thẳng 🤡):** `literal_vi` với font bold, màu amber
   - **Mặt 3 (Nghĩa thật + Context):** `meaning_vi` + `funny_context` + ví dụ
4. Nút **"Thuộc Rồi ✅"** → thêm vào `learnedIds`, +10 XP
5. Nút **"Học Lại 🔄"** → đẩy về cuối deck

**Design (theo Design System):**
```
Card: bg-bg-surface, border border-border-default, sharp corners
Flip animation: CSS transform-style: preserve-3d, 3D perspective
Mặt trước: text-accent-coral (phrase) + text-text-secondary (gợi ý "nhấn để lật")
Mặt 2: text-accent-amber (dịch thẳng buồn cười)
Mặt 3: text-text-primary (nghĩa thật) + bg-bg-elevated (context block)
Background number: số thứ tự idiom, text-accent-coral/5, font-display text-8xl
```

---

### 4.2 🎮 Quiz Mode — Tab Quiz

**Hai chế độ:**

| Mode | Mô tả |
|---|---|
| **Classic** | Không giới hạn thời gian, 10 câu, chọn đúng/sai |
| **Time Attack** | 30 giây/câu, có countdown bar, áp lực tối đa |

**Cấu trúc câu hỏi:**
- Hiển thị idiom phrase
- 4 lựa chọn (1 đúng + 3 sai từ `wrong_answers` đã soạn sẵn trong data)
- Đáp án sai được viết theo kiểu lầy: dịch thẳng, hiểu nhầm, meme reference
- Sau khi trả lời: hiện giải thích + funny context
- Kết thúc: màn hình kết quả với điểm số + XP earned + tên level đạt được

**XP theo kết quả quiz:**
```
10/10 → +100 XP + badge check
7-9/10 → +60 XP
4-6/10 → +30 XP
< 4/10 → +10 XP + câu an ủi lầy
```

**Design:**
```
Progress bar phía trên: bg-accent-coral/20 → bg-accent-coral
Câu hỏi: font-display text-2xl text-text-primary, căn giữa
Các lựa chọn: border border-border-default bg-bg-surface, hover:border-accent-coral
Đúng: border-accent-sky bg-accent-sky/10
Sai: border-accent-coral bg-accent-coral/10
Timer bar (Time Attack): animate-width, đổi màu khi gần hết
```

---

### 4.3 🗂️ Collection — Tab Duyệt

**Tính năng:**
- Grid các **category card** theo design system
- Click vào category → lọc danh sách idioms
- **Search bar** tìm kiếm realtime theo phrase hoặc meaning_vi
- Mỗi IdiomCard nhỏ gọn: phrase + emoji + difficulty badge
- Click mở **modal chi tiết** (full info, tương tự flip card mặt 3)
- Badge "✅ Đã thuộc" trên card nếu có trong learnedIds

**Design:**
```
Category grid: grid-cols-2 sm:grid-cols-4, mỗi card có border đổi màu theo accent
Search bar: border-border-default, focus:border-accent-coral
Difficulty badge: easy→sky, medium→amber, hard→coral (text-xs font-display)
Modal: bg-bg-surface, border border-accent-coral, với overlay bg-bg-deep/80
```

---

### 4.4 🎲 Spin Wheel — Tab Vòng Quay

**Cơ chế:**
- Vòng quay chia thành các ô theo category (8 ô)
- Nhấn **"QUAY THÔI!"** → animation quay có deceleration
- Dừng lại tại ô random → hiện 1 idiom ngẫu nhiên từ category đó
- Idiom hiện dưới dạng flip card thu nhỏ
- Nút "Quay Tiếp" hoặc "Học Luôn ✅"
- +5 XP mỗi lần spin

**Implementation:**
```
Canvas hoặc CSS conic-gradient + CSS transform rotate
Easing: cubic-bezier deceleration, tối thiểu 3 vòng trước khi dừng
Màu các ô: xen kẽ bg-accent-coral/20 và bg-accent-amber/20
Mũi tên chỉ: bg-accent-coral, absolute top, triangle clip-path
```

---

### 4.5 📊 Stats — Tab Thống Kê

**Hiển thị:**
- **Streak Calendar:** 30 ngày gần nhất, ô ngày học = filled coral, không học = dim
- **XP Bar** với level hiện tại và số XP cần lên level
- **Badges đã mở khóa** (grid, còn lại dạng silhouette mờ với dấu ?)
- **Quiz history** 5 record gần nhất
- **Tỉ lệ đã học:** `learnedIds.length / total` dạng progress circle

**Level System:**
```typescript
const LEVELS = [
  { min: 0,    label: '🐣 Newbie Mơ Tây' },
  { min: 100,  label: '📚 Đang Vào Số' },
  { min: 300,  label: '🧠 Não Đang Nở' },
  { min: 600,  label: '💬 Nói Được Đôi Câu' },
  { min: 1000, label: '🔥 Cháy Với Tiếng Anh' },
  { min: 2000, label: '👑 Người Việt Nói Tiếng Anh Như Tây' },
]
```

---

## 5. Navigation Nội Bộ

Vì đây là sub-page độc lập (không dùng Vue Router cha), navigation giữa các tab dùng **reactive state nội bộ** trong `index.vue`:

```vue
<!-- index.vue -->
<script setup>
const activeTab = ref<'home' | 'quiz' | 'collection' | 'spin' | 'stats'>('home')
</script>
```

Tab bar cố định ở bottom (mobile) hoặc top (desktop):

| Tab | Icon (Iconify) | Label |
|---|---|---|
| home | `fluent-emoji:books` | Học |
| quiz | `fluent-emoji:game-die` | Quiz |
| collection | `fluent-emoji:card-index-dividers` | Bộ Sưu Tập |
| spin | `fluent-emoji:ferris-wheel` | Vòng Quay |
| stats | `fluent-emoji:bar-chart` | Stats |

---

## 6. Áp Dụng Design System

### Màu sắc theo tính năng

| Tính năng | Accent chính | Lý do |
|---|---|---|
| Flashcard / Home | `coral` | Dominant accent, thu hút attention |
| Quiz | `amber` | Energy, warning (đang thi!) |
| Collection | `sky` | Calm, browsing mode |
| Spin Wheel | Xen kẽ coral + amber | Festive, vui vẻ |
| Stats | coral (streak) + amber (XP) | Consistent với gamification |

### Typography

```
Tên idiom phrase:     font-display text-2xl font-bold text-text-primary
Dịch thẳng (lầy):    font-display text-xl font-semibold text-accent-amber
Nghĩa thật:           font-body text-lg text-text-primary
Funny context:        font-body text-sm text-text-secondary italic
Category label:       font-display text-sm tracking-widest text-accent-coral
// prefix:            font-display text-sm tracking-widest (theo design system)
```

### Cards

Tất cả card tuân thủ: **sharp corners, no rounded-\***, hover lift + coral border:
```html
class="border border-border-default bg-bg-surface p-6
       transition-all duration-300
       hover:-translate-y-1 hover:border-accent-coral hover:bg-bg-elevated
       hover:shadow-lg hover:shadow-accent-coral/5"
```

### Animations

- Page load: `animate-fade-up` với `animate-delay-{1-7}` cho từng section
- Card flip: CSS 3D transform, `transition: transform 0.6s`
- Quiz answer reveal: scale bounce + border color transition
- XP gain: số XP bay lên rồi fade out (keyframe animation)
- Streak milestone: pulse border animation (`animate-pulse-border`)

---

## 7. meta.ts

```typescript
// src/views/golingduo-idiom/meta.ts
import type { PageMeta } from '@/types'

export default {
  name: 'GolingDuo Idiom 🦜',
  description: 'Học thành ngữ tiếng Anh kiểu lầy — dịch thẳng chết cười, nhưng nhớ mãi không quên',
  author: 'Your Name',
  authorUrl: 'https://www.facebook.com/yourprofile',
  category: 'Học Tập',
  showToolbar: true,
} satisfies PageMeta
```

---

## 8. Lộ Trình Triển Khai

### Phase 1 — Foundation (Ngày 1–2)
- [ ] Chạy `pnpm create:page golingduo-idiom`
- [ ] Viết `meta.ts`
- [ ] Tạo `data/idioms.ts` với ~30 idioms đầu (6 categories)
- [ ] Tạo `data/categories.ts`
- [ ] Viết `composables/useProgress.ts` (localStorage wrapper)
- [ ] Scaffold `index.vue` với tab navigation + AppHeader/AppFooter

### Phase 2 — Flashcard Core (Ngày 3–4)
- [ ] `FlipCard.vue` với 3D CSS flip animation (3 mặt)
- [ ] `FlipCardDeck.vue` với swipe/arrow navigation
- [ ] `IdiomOfDay.vue` với seed theo ngày
- [ ] Kết nối `useProgress` (mark learned, XP)
- [ ] `HomeTab.vue` hoàn chỉnh

### Phase 3 — Quiz Mode (Ngày 5–6)
- [ ] `useQuiz.ts` — shuffle, score logic
- [ ] `QuizCard.vue` — render câu hỏi + 4 đáp án lầy
- [ ] `QuizTimer.vue` — countdown bar cho Time Attack
- [ ] `QuizResult.vue` — kết quả + XP + câu kết lầy
- [ ] `QuizTab.vue` — mode selector + flow hoàn chỉnh

### Phase 4 — Collection (Ngày 7)
- [ ] `CategoryGrid.vue`
- [ ] `SearchBar.vue` với debounce (VueUse `useDebounceFn`)
- [ ] `IdiomCard.vue` + modal chi tiết
- [ ] `CollectionTab.vue` hoàn chỉnh
- [ ] Thêm data lên ~80 idioms

### Phase 5 — Spin & Stats (Ngày 8–9)
- [ ] `SpinWheel.vue` — CSS conic-gradient + rotate animation
- [ ] `useSpin.ts` — random logic + history
- [ ] `SpinTab.vue` hoàn chỉnh
- [ ] `StreakBadge.vue`, `XpBar.vue`, `BadgeUnlock.vue`
- [ ] `StatsTab.vue` — calendar + badges + history
- [ ] Badge unlock popup với animation

### Phase 6 — Polish & Submit (Ngày 10)
- [ ] Responsive check (mobile-first)
- [ ] Kiểm tra tất cả animation, transition mượt
- [ ] Review lại tất cả `funny_context` cho đủ lầy 😂
- [ ] Đảm bảo có back-link về trang chủ
- [ ] Test localStorage edge cases (lần đầu dùng, reset)
- [ ] Tạo PR

---

## 9. Danh Sách 80 Idioms (Phân theo Category)

### 😭 Drama & Cảm Xúc (12 idioms)
| Phrase | Literal VI | Nghĩa thật |
|---|---|---|
| Cry me a river | Khóc cho tao một con sông | Thôi đừng than vãn nữa |
| Spill the tea | Đổ trà ra | Kể chuyện drama đi |
| Bite the bullet | Cắn viên đạn | Cố chịu đựng vượt qua |
| On the fence | Ngồi trên hàng rào | Chưa quyết định được |
| Butterflies in my stomach | Có bướm trong bụng | Hồi hộp, bồn chồn |
| Pull someone's leg | Kéo chân ai đó | Nói đùa, trêu chọc |
| See eye to eye | Nhìn mắt qua mắt | Đồng ý, hiểu nhau |
| Bite off more than you can chew | Cắn nhiều hơn mày nhai được | Nhận việc quá sức |
| Burning bridges | Đốt cầu | Phá hỏng quan hệ vĩnh viễn |
| Cold shoulder | Vai lạnh | Cố tình lờ đi ai |
| Hit the nail on the head | Đóng đinh vào đầu | Nói đúng vấn đề |
| Beat around the bush | Đánh quanh bụi | Nói vòng vo, né tránh thẳng thắn |

### 💼 Công Sở Sống Còn (12 idioms)
| Phrase | Literal VI | Nghĩa thật |
|---|---|---|
| Under the weather | Dưới thời tiết | Không khoẻ, hơi bệnh |
| Back to the drawing board | Quay lại bảng vẽ | Bắt đầu lại từ đầu |
| Hit the ground running | Chạm đất là chạy luôn | Bắt đầu ngay và luôn |
| Think outside the box | Nghĩ ngoài cái hộp | Sáng tạo, tư duy khác |
| Cut corners | Cắt góc | Làm tắt, bỏ bước quan trọng |
| Get the ball rolling | Lăn quả bóng | Bắt đầu khởi động việc gì |
| Jump the gun | Nhảy theo súng | Làm quá sớm, nóng vội |
| Go the extra mile | Đi thêm một dặm nữa | Nỗ lực thêm hơn mức cần |
| In the loop | Trong vòng lặp | Được cập nhật thông tin |
| Touch base | Chạm vào gốc | Liên lạc nhanh để cập nhật |
| Ballpark figure | Con số sân bóng | Số ước tính gần đúng |
| Drop the ball | Thả quả bóng | Làm hỏng, bỏ lỡ trách nhiệm |

### ❤️ Yêu Đương Éo Le (10 idioms)
| Phrase | Literal VI | Nghĩa thật |
|---|---|---|
| Head over heels | Đầu qua gót chân | Yêu điên đảo, mê mẩn |
| Love at first sight | Tình yêu nhìn đầu tiên | Yêu từ cái nhìn đầu |
| On the same page | Trên cùng một trang | Hiểu nhau, đồng thuận |
| Have a crush | Có một vụ nghiền | Thích ai đó |
| Play hard to get | Chơi khó để nhận | Giả vờ không quan tâm |
| Wear your heart on your sleeve | Đeo tim trên tay áo | Lộ cảm xúc ra ngoài quá |
| Fall for someone | Ngã vì ai đó | Bắt đầu yêu ai |
| Tie the knot | Buộc nút | Kết hôn |
| Pop the question | Nổ câu hỏi | Cầu hôn |
| It takes two to tango | Cần hai người để nhảy tango | Hai bên đều có lỗi |

### 🤑 Flex Tài Chính (10 idioms)
| Phrase | Literal VI | Nghĩa thật |
|---|---|---|
| Break the bank | Phá vỡ ngân hàng | Tốn rất nhiều tiền |
| On the house | Trên ngôi nhà | Được miễn phí, chủ đãi |
| Penny pincher | Kẹp đồng xu | Người keo kiệt, tính toán |
| In the red | Trong màu đỏ | Đang bị lỗ, nợ tiền |
| In the black | Trong màu đen | Đang có lãi |
| Costs an arm and a leg | Tốn một tay và một chân | Đắt khủng khiếp |
| Nest egg | Trứng ổ | Tiền tiết kiệm dự phòng |
| Make ends meet | Làm hai đầu gặp nhau | Kiếm đủ tiền trang trải |
| Money doesn't grow on trees | Tiền không mọc trên cây | Tiền không phải tự nhiên có |
| Tighten your belt | Thắt chặt thắt lưng | Tiết kiệm hơn, chi tiêu ít đi |

### 🍜 Đời Thường Việt Nam (10 idioms)
| Phrase | Literal VI | Nghĩa thật |
|---|---|---|
| Piece of cake | Miếng bánh | Dễ như ăn kẹo |
| Bite the dust | Cắn bụi | Thất bại, ngã xuống |
| Hit the sack | Đánh vào bao | Đi ngủ |
| Kill two birds with one stone | Giết hai con chim bằng một hòn đá | Một mũi tên trúng hai đích |
| Spill the beans | Đổ hạt đậu | Lỡ miệng tiết lộ bí mật |
| Under the table | Dưới bàn | Làm chui, không chính thức |
| Wrap your head around | Quấn đầu mày quanh | Hiểu được điều gì đó |
| Sleep on it | Ngủ lên nó | Suy nghĩ thêm qua đêm đã |
| Hang in there | Treo ở đó | Cố lên, đừng bỏ cuộc |
| Give it a shot | Cho nó một phát | Thử xem sao |

### 💪 Sống Ảo Motivate (8 idioms)
| Phrase | Literal VI | Nghĩa thật |
|---|---|---|
| Bite the bullet | Cắn viên đạn | Bước qua khó khăn dũng cảm |
| Face the music | Đối mặt với âm nhạc | Chấp nhận hậu quả hành động |
| The ball is in your court | Quả bóng trong sân mày | Đến lượt mày quyết định rồi |
| Step up to the plate | Bước lên tấm đĩa | Nhận lấy trách nhiệm |
| Take the bull by the horns | Nắm bò bằng sừng | Đối mặt trực tiếp với vấn đề |
| Weather the storm | Vượt qua cơn bão | Sống sót qua giai đoạn khó |
| Light at the end of the tunnel | Ánh sáng cuối đường hầm | Hy vọng sau giai đoạn khó |
| Rise to the occasion | Nổi lên với dịp đó | Bứt phá khi được thử thách |

### ⏰ Thời Gian & Deadline (8 idioms)
| Phrase | Literal VI | Nghĩa thật |
|---|---|---|
| Against the clock | Chống lại đồng hồ | Đang đua với thời gian |
| In the nick of time | Trong khía của thời gian | Vừa kịp lúc, sát giờ |
| Beat the clock | Đánh bại đồng hồ | Làm xong trước deadline |
| Around the clock | Xung quanh đồng hồ | Làm liên tục 24/7 |
| A race against time | Cuộc đua chống lại thời gian | Đang rất gấp |
| On the dot | Trên chấm | Đúng giờ, đúng phút |
| Time flies | Thời gian bay | Thời gian trôi nhanh quá |
| At the eleventh hour | Vào giờ thứ mười một | Làm vào phút chót |

---

## 10. Các Quyết Định Kỹ Thuật

| Quyết định | Giải pháp | Lý do |
|---|---|---|
| Navigation nội bộ | `ref<TabId>` trong `index.vue` | Không cần nested Vue Router, sub-page độc lập |
| State persistence | `localStorage` qua `useProgress.ts` | Không có database, theo nguyên tắc dự án |
| Idiom of Day | `idioms[dayOfYear % idioms.length]` | Deterministic, không cần server |
| Spin wheel | CSS `conic-gradient` + `transform: rotate()` | Không cần thư viện canvas mới |
| Quiz shuffle | Fisher-Yates trong `useQuiz.ts` | Pure function, testable |
| Debounce search | `useDebounceFn` từ `@vueuse/core` | Đã có sẵn, không cần thêm dep |
| Icons | `@iconify/vue` với `fluent-emoji` set | Đã được cài sẵn trong dự án |
| Animations | CSS keyframes + Tailwind classes | Nhất quán với design system |

---

*Tài liệu này được tạo để làm guide triển khai cho trang `golingduo-idiom` trong dự án vibe.j2team.org.*
*Mọi component và composable phải hoạt động độc lập trong thư mục `src/views/golingduo-idiom/`.*
