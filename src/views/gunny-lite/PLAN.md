# Plan: Gunny Lite — Trò chơi mô phỏng Gunny trên trình duyệt

## Tổng quan

Game mô phỏng Gunny (DDTank) chạy trên trình duyệt, dựa trên Vue 3 + Canvas 2D. Phạm vi: **2 người chơi cùng máy (hotseat) + chế độ đấu với AI**. Không có backend, không có multiplayer mạng.

---

## Cấu trúc thư mục đề xuất

```
src/views/gunny-lite/
  index.vue                  # Entry point: khởi tạo game, màn hình chính/menu
  meta.ts                    # Đã có
  types.ts                   # Tất cả TypeScript types
  components/
    GameCanvas.vue            # Canvas renderer chính (terrain + characters + projectiles)
    HUD.vue                   # Angle gauge, power bar, wind indicator, HP/stamina bars
    TurnOrder.vue             # Thanh thứ tự lượt (turn/delay bar)
    WeaponSelect.vue          # Chọn vũ khí trước trận
    BuffPanel.vue             # Chọn vật phẩm buff trong lượt
    ResultScreen.vue          # Màn hình kết quả (thắng/thua)
  composables/
    useGameLoop.ts            # Game loop dùng useRafFn từ VueUse
    usePhysics.ts             # Engine đạn đạo (trajectory simulation)
    useTerrain.ts             # Địa hình phá hủy được (bitmap masking trên OffscreenCanvas)
    useGameState.ts           # Trạng thái game: turn/delay system, character stats
    useInput.ts               # Keyboard/mouse input handling
    useAI.ts                  # Simple AI: tính góc + lực hướng vào địa hình/địch
  utils/
    ballistics.ts             # Thuần toán học: trajectory equations, wind compensation
    damage.ts                 # Công thức tính sát thương, critical, delay
    terrain.ts                # Pixel operations: circle erase, collision detection
```

---

## Các hệ thống cốt lõi — Thứ tự ưu tiên

### Phase 1: Engine vật lý (nền tảng, phải làm trước)

**1. Terrain System** (`useTerrain.ts`)
- Địa hình lưu dưới dạng **OffscreenCanvas** làm collision mask (pixel đen = có đất, trắng = rỗng)
- Khi đạn nổ tại `(x, y)` với bán kính `R`: xóa các pixel trong hình tròn trên mask
- Dùng `ctx.getImageData` / `ctx.putImageData` để đọc/ghi pixel
- Dùng Quadtree hoặc chunked grid để tối ưu collision queries
- Khi địa hình bên dưới nhân vật bị xóa → kích hoạt trạng thái **rơi tự do**

**2. Ballistics Engine** (`usePhysics.ts` + `utils/ballistics.ts`)

Công thức quỹ đạo (từ nghiên cứu):
```
x(t) = x₀ + (v₀·cos θ)·t + ½·a_wind·t²
y(t) = y₀ + (v₀·sin θ)·t - ½·g·t²
```
- `v₀`: lực bắn (0–100, người chơi giữ Space)
- `θ`: góc bắn (điều chỉnh bằng phím ↑/↓)
- `g`: trọng lực (hằng số, mặc định ~9.8 game units/s²)
- `a_wind`: gia tốc ngang từ gió (thay đổi mỗi lượt)
- Simulate theo từng tick (dt), không dùng analytical path để dễ kiểm tra collision

**3. Collision Detection**
- Mỗi tick của đạn: kiểm tra `getImageData` tại pixel hiện tại trên terrain mask → nổ nếu va chạm
- Kiểm tra va chạm với bounding box nhân vật (AABB)
- Nếu đạn ra ngoài biên map → hủy

---

### Phase 2: Gameplay Loop

**4. Turn/Delay System** (`useGameState.ts`)

Công thức delay cho mỗi lượt:
```
Total_Delay = (D_base + ΣD_items) × (1 − Agility / K)
```
- Sau mỗi lượt bắn: cộng delay vào tổng delay của nhân vật
- Nhân vật có tổng delay thấp nhất → lượt tiếp theo
- Hỗ trợ **turn đôi** (bắn nhẹ = delay thấp → có thể đi lại ngay)
- Hiển thị turn order bar có tên + avatar theo thứ tự delay

**5. Player Controls** (`useInput.ts`)
- **Góc**: `ArrowUp`/`ArrowDown` (giới hạn bởi loại vũ khí)
- **Lực**: giữ `Space` để tích lực (Power Bar tăng dần), thả để bắn
- **Di chuyển**: `ArrowLeft`/`ArrowRight` (tiêu stamina, tăng delay)
- **Bay (Teleport)**: nếu có vật phẩm Bay
- Đồng hồ đếm ngược mỗi lượt (mặc định 15 giây)

**6. Wind System**
- Mỗi lượt: random hướng (trái/phải) và cường độ gió (0–10)
- Animate chỉ báo gió khi gió thay đổi (effect thị giác mạnh)
- Giá trị gió ảnh hưởng trực tiếp vào `a_wind` trong trajectory

**7. HUD** (`HUD.vue`)
- **Angle Gauge**: số góc hiện tại + giới hạn vũ khí + vạch góc lượt trước
- **Power Bar**: thanh dọc có vạch chia mỗi 5 đơn vị, fill khi giữ Space
- **Wind Indicator**: mũi tên hướng + số giá trị, animate khi đổi
- **HP Bars**: thanh máu mỗi nhân vật (coral khi nguy hiểm)
- **Stamina Bar**: 240 điểm cơ bản, hiển thị tiêu thụ dự kiến khi hover buff

---

### Phase 3: Weapons & Items

**8. Hệ thống Vũ khí** (5 loại cơ bản từ nghiên cứu)

| Vũ khí | Góc | Chỉ số mạnh | Đặc điểm |
|--------|-----|-------------|----------|
| Lựu đạn | 55°–70° | Thủ, May mắn | Đào hố cực mạnh, nổ rộng |
| Lu gạch | 20°–65° | Công, Thủ | Sát thương ổn định |
| Sấm sét | 20°–55° | May mắn | Bạo kích cao |
| Phi tiêu | 15°–50° | Nhanh nhẹn | Delay thấp, cướp lượt |
| Tủ lạnh | 50°–70° | Toàn diện | Tốt cho địa hình phức tạp |

**9. Công thức sát thương** (`utils/damage.ts`)
```
A (damage out) = weapon_dmg × (1 + ATK / 1000)
B (damage reduction) = armor × (1 + DEF / 1000)
Final = (A − B) × buff_coefficient × crit_coefficient
```
- Critical: xác suất từ Luck, hệ số ×1.5 hoặc ×2.0
- Crit_coefficient = 1.0 nếu không bạo kích

**10. Vật phẩm Buff** (`BuffPanel.vue`)
- Tăng sát thương: 10% / 20% / 30% / 40% / 50%
- Tấn công thêm: +1 viên (giảm damage/viên để cân bằng)
- Ba tia (Trident): 3 viên theo hình quạt
- Bay (Teleport): di chuyển tự do, không tiêu stamina theo hương
- Giới hạn stamina 240 điểm/lượt; buff = stamina + delay

---

### Phase 4: AI & Polish

**11. Simple AI** (`useAI.ts`)
- Chiến thuật mặc định: góc 65° ± gió × 2
- Điều chỉnh lực theo khoảng cách đến địch
- 30% xác suất chọn chiến thuật đào hố (góc cao 85°–90°)
- Random nhỏ ±3° để AI không hoàn hảo

**12. Character Stats** (đơn giản hóa cho Lite)

| Chỉ số | Tác dụng |
|--------|----------|
| Tấn công (ATK) | Tăng sát thương (công thức A) |
| Phòng thủ (DEF) | Tăng giáp giảm sát thương (công thức B) |
| Nhanh nhẹn (AGI) | Giảm delay, tăng stamina tối đa |
| May mắn (LCK) | Tăng tỉ lệ và hệ số bạo kích |

2 nhân vật mặc định với build khác nhau: **Glass Canon** (ATK cao, DEF thấp) vs **Tank** (DEF cao, AGI thấp)

---

## Kỹ thuật Địa hình Phá hủy (chi tiết triển khai)

```
// useTerrain.ts — Bitmap Masking approach
const terrainCanvas = new OffscreenCanvas(MAP_WIDTH, MAP_HEIGHT)
const ctx = terrainCanvas.getContext('2d')

function explode(cx: number, cy: number, radius: number) {
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
}

function isSolid(x: number, y: number): boolean {
  const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
  return pixel[3] > 128  // alpha > 0 = solid terrain
}
```

- Map texture vẽ riêng (decorative layer), terrain mask chỉ để collision
- Vẽ lại terrain visual mỗi frame bằng cách composite mask lên texture

---

## Luồng game (Game Flow)

```
Menu → Chọn vũ khí → Game bắt đầu
  └─ Lặp lượt:
       1. Xét delay → chọn nhân vật tiếp theo
       2. Hiển thị BuffPanel → chọn buff (tiêu stamina)
       3. Timer 15s: điều chỉnh góc/lực
       4. Bắn → simulate trajectory từng tick
       5. Va chạm? → gây sát thương + phá địa hình
       6. Check rơi (gravity loop cho các entity)
       7. Check thắng/thua → hiện ResultScreen
       8. Cộng delay → sort → next turn
```

---

## Design System

- Background: `bg-bg-deep` (#0F1923)
- Canvas border: `border border-border-default`
- HUD panels: `bg-bg-surface` / `bg-bg-elevated`
- HP bar fill: `bg-accent-coral`
- Power bar fill: `bg-accent-amber`
- Wind indicator: `text-accent-sky`
- Font heading: `font-display` (Anybody)
- Section markers: `//` prefix với coral

---

## Phạm vi MVP (có thể ship)

- [ ] Terrain + ballistics + collision hoạt động
- [ ] 2 nhân vật, 2 vũ khí (Lu gạch + Lựu đạn)
- [ ] HUD đầy đủ (angle, power, wind, HP)
- [ ] Turn/Delay system
- [ ] Chế độ 2 người cùng máy
- [ ] Game over condition (rơi khỏi map hoặc cạn HP)

## Tính năng mở rộng (sau MVP)

- [ ] 5 loại vũ khí
- [ ] Hệ thống buff đầy đủ
- [ ] AI opponent
- [ ] Character stats (4 chỉ số)
- [ ] Hiệu ứng âm thanh
- [ ] 3 map khác nhau
- [ ] Turn order bar animation
