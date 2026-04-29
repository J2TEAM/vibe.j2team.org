# Quy tắc vChess (bản nháp)

Tài liệu này ghi lại các quy tắc của game để đồng bộ khi code và khi chơi. Người chưa biết cờ vua/cờ tướng vẫn có thể đọc phần bàn cờ và tọa độ bên dưới.

---

## 1. Bàn cờ và tọa độ

### Kích thước

- Bàn cờ là **lưới hình chữ nhật** gồm **9 cột** (theo chiều ngang) và **11 hàng** (theo chiều dọc).
- Mỗi **ô** là một ô vuông; **quân cờ đứng trong ô** (giống cờ vua), không đặt ở giao điểm giữa các đường.

### Hai trục để gọi tên ô

Ta dùng **một chữ cái** + **một chữ số** để chỉ đúng một ô, ví dụ `d5`, `a1`, `k9`.

| Trục | Quy ước | Ghi chú |
|------|---------|---------|
| **Chữ cái (a → k)** | Trục **dọc** (11 hàng) | **a** là hàng **dưới cùng** (gần người chơi phía “dưới” màn hình nếu bàn được vẽ quen thuộc), **k** là hàng **trên cùng**. |
| **Số (1 → 9)** | Trục **ngang** (9 cột) | **1** là cột **bên trái**, **9** là cột **bên phải**. |

Như vậy:

- **11 chữ** `a, b, c, d, e, f, g, h, i, j, k` tương ứng **11 hàng** (từ dưới lên trên).
- **9 số** `1 … 9` tương ứng **9 cột** (từ trái sang phải).

### Cách đọc một ô

- Viết **chữ trước, số sau**: ví dụ ô ở **hàng d** và **cột 5** là **`d5`**.
- Mỗi ô chỉ có **một** tên như vậy; không có hai cách gọi khác nhau cho cùng một ô.
- Góc **dưới–trái** của bàn là **`a1`** — tương tự cảm giác “góc nhà” như cờ vua (dưới + trái), nhưng ở đây chữ là **hàng**, số là **cột**.

### Vì sao đổi trục so với cờ vua thuần?

Trên bàn **rộng 9, dài 11**, nếu giữ đúng kiểu cờ vua (chữ cho cột, số cho hàng) thì số có thể lên tới **11** (ví dụ `a11`), dễ trông lạ hoặc khó đọc. Ta chọn **chữ cho hàng dài (11)** và **số cho hàng ngắn (9)** để mọi tên ô đều gọn (luôn là một chữ + một chữ số từ 1–9).

---

## 2. Bàn cờ đồng nhất

- **Không** có **cung** (không giới hạn vùng như cờ tướng).
- **Không** có **ô xen màu** như cờ vua — mọi ô **giống nhau** về mặt hình thức; chỉ có tọa độ để phân biệt.

---

## 3. Hình dạng quân cờ

- Mỗi quân là **hình vuông bo góc**; **ở giữa** là **hình đại diện** (icon) cho loại quân — phong cách gần cờ tướng nhưng **không dùng chữ** trên quân.

---

## 4. Các loại quân và luật di chuyển

Trong phần dưới, **“phía trước”** của một bên là hướng từ **sân nhà** của bên đó **về phía đối phương** (hướng tăng chữ cái cho bên dưới, giảm chữ cái cho bên trên — tùy cách bạn gán phe; khi code cần một hướng cố định cho từng màu).

### Xe

- Đi và ăn giống **xe cờ tướng** (thẳng ngang hoặc dọc, không giới hạn số ô, không nhảy qua quân).

### Mã

- Đi và ăn giống **mã cờ tướng** (chữ L), **bị chặn** nếu có quân đứng ở **ô cản chân** (ô liền kề theo hướng đi của mã).

### Tốt

- **Đi** hoặc **ăn** về **phía trước** **1 ô** theo một trong **ba hướng**: **thẳng trước**, **chéo trước trái**, **chéo trước phải**.
- **Không** đi ngang, **không** lùi, **không** phong cấp.

### Xạ thủ

- Có đúng **ba ô đích** nằm **phía trước** quân: cấu tạo từ **hai ô theo chữ L giống mã** và **một ô nằm giữa, cùng hàng ngang với hai ô đó** — **ba ô thẳng hàng** (một đường ngang gồm ba ô, hai đầu là “đầu mã”, ô giữa nằm trên cùng một hàng ngang với hai đầu đó).
- **Bị chặn** chỉ khi có quân (bất kỳ) ở **ô liền kề ngay trước mặt** (1 ô): khi đó **không** được đi/ăn bằng các nước xạ thủ (giống tinh thần **mã bị cản chân**).
- **Không** được ăn quân ở **ô ngay trước mặt 1 ô** (ô cạnh nhất theo hướng thẳng trước) — chỉ ăn được ở **ba ô** đã mô tả.

### Tượng

- Tập nước hợp lệ là **hợp** của **tốt** và **xạ thủ**: tổng cộng **sáu ô** phía trước (**ba ô tốt** + **ba ô xạ thủ**), các ô trùng nhau chỉ tính một lần nếu có.
- **Ô liền kề trước mặt có đồng minh:** **không** được đi vào ô đó; **ba nước kiểu xạ thủ** không dùng được; **chỉ** còn được **đi/ăn chéo 1 ô** (trái hoặc phải phía trước) nếu ô đích hợp lệ.
- **Ô liền kề trước mặt có quân địch:** **vẫn được ăn** quân địch ở ô đó bằng nưới **đi thẳng lên** (coi như nước tốt đi thẳng vào ô có địch).

### Vua

- **Đi** hoặc **ăn** sang **một trong tám ô** cạnh (ngang, dọc, chéo).
- **Không** có nhập thành; **không** bị giới hạn vùng — vua có thể đi bất kỳ ô nào trên bàn theo luật trên.
- **Lượt đi đầu tiên của vua** (chỉ một lần trong ván): được phép đi **một đoạn thẳng hai ô** theo **một trong tám hướng**, với điều kiện **ô ở giữa** trên đường đi **bắt buộc trống** (không nhảy qua quân).
- **Ô trung gian không được “đi xuyên qua” khi đang bị chiếu:** với nước vua **hai ô** đó, **ô ở giữa** (ô vua đi qua trước khi tới ô đích) **không** được đang bị quân địch tấn công — tương tự tinh thần **vua không được đi qua ô đang chiếu** khi nhập thành cờ vua.

### Đại bàng (ưng)

- Quân có **hai trạng thái** (hai “mặt”); khi đổi trạng thái thì **lật quân** trên bàn.

**Mặt đất (săn / vồ):**

- Chỉ **hai ô chéo phía trước**, mỗi ô **cách 1 ô** — giống hai hướng **chéo trước** của tốt, **không** giống **sĩ** cờ tướng (chéo trong cung).
- **Đi** và **ăn** được ở các ô đó; **không** đi ngang, **không** lùi theo nghĩa **lùi về phía sân nhà mình** (không bao giờ đi lùi về phía phía quân mình).

**Mặt trời / bay:**

- **Không** ăn quân.
- Được **bay** tới **bất kỳ ô trống** nào trên bàn. Khi **hạ cánh** xuống ô trống đó, quân **bắt buộc lật** sang mặt kia (để cân bằng game).

**Lật quân và lượt chơi:**

- **Xếp ban đầu:** mặt **đất**.
- **Chỉ được lật quân tại chỗ** (đổi sang mặt bay để lượt sau có thể bay) — **hết lượt** sau khi lật.
- **Lượt sau**, nếu đang ở mặt bay, mới được **di chuyển bay** tới ô khác (hoặc các thao tác hợp lệ khác theo mặt đang dùng).
- Sau khi bay xuống ô trống và lật về mặt đất, **cách đi mặt đất** vẫn như cũ (hai chéo phía trước, không lùi về phía phe mình).

### Sát thủ

- **Di chuyển thường (không ăn):** chỉ được tới các **ô trống** nằm **ngay sau đồng minh đầu tiên** trên cùng **một hàng ngang** hoặc **một hàng dọc** với sát thủ (phải có ít nhất một đồng minh trên cùng hàng/cột thì mới được đi). Nếu trên cùng tia có **đồng minh thứ hai**, phạm vi **dừng lại**: chỉ được đi vào các **ô trống nằm giữa đồng minh thứ nhất và đồng minh thứ hai** (không vượt qua đồng minh thứ hai).

- **Ăn quân (nhảy bắt):** không cần “ngòi” như pháo cờ tướng. Nếu **nhìn thấy** quân địch **trực tiếp** trên cùng một hàng hoặc cột, **không có quân nào chen giữa** sát thủ và quân địch đó, và **phía sau** quân địch có **ít nhất một ô trống**, thì sát thủ có thể **ăn** quân địch bằng cách **nhảy tới một ô trống** phía sau địch theo quy tắc sau:
  - Xét các ô trống **liền kề phía sau** mục tiêu và các ô trống **trên tia ra sau** từ mục tiêu.
  - Nếu phía sau trên tia đó còn **quân địch khác**, thì **không** tìm ô trống nữa ở xa hơn — **chỉ** được phép đi vào các **ô trống nằm giữa địch thứ nhất và địch thứ hai** (không nhảy qua địch thứ hai để xuống ô trống phía sau địch thứ hai).

### Giá trị vật chất (điểm tương đối)

**Mục đích:** Quy ước số nguyên (kiểu centipawn: một đơn vị nhỏ = 1 điểm) để ước lượng vật chất khi triển khai AI hoặc phân tích — **không** phải luật chơi trên bàn.

**Chuẩn:** **Một tốt = 100 điểm.** Các quân khác là **bội số tương đối** so với tốt; chọn số tròn (bội của 10) để **dễ cộng trừ, dễ code** và còn chỗ cho bonus nhỏ (ví dụ +5 kiểm soát ô) sau này.

| Quân | Điểm | Ghi chú |
|------|------|---------|
| **Xe** | 600 | Mạnh nhất trong bảng vật chất tĩnh. |
| **Sát thủ** | 450 | Thực tế **biến thiên** theo tia mở / bị chặn; có thể tinh chỉnh sau playtest. |
| **Tượng** | 340 | Tập nước rộng phía trước (hợp tốt + xạ thủ). |
| **Mã** | 320 | |
| **Xạ thủ** | 230 | Chỉ ba ô kiểu L phía trước; hẹp hơn mã. |
| **Tốt** | 100 | Chuẩn so sánh. |
| **Đại bàng (mặt đất)** | 100 | Cùng mức tham chiếu với tốt; **mặt bay** không ăn quân — **không** gán điểm vật chất riêng như quân bắt được (nếu cần, dùng bonus vị trí / mobility trong code). |
| **Vua** | — | **Không** cộng vào tổng vật chất; thắng / thua xử lý qua chiếu hết, stalemate, v.v. |

**Thứ tự tương đối (mặc định):** xe > sát thủ > tượng > mã > xạ thủ > tốt = đại bàng (đất).

*Bảng này là điểm khởi đầu; có thể điều chỉnh sau khi có engine tự đấu hoặc feedback người chơi.*

---

## 5. Xếp quân ban đầu

Cách xếp **bám theo cờ tướng** (9 cột), với quy ước tọa độ **a** là hàng phía **dưới** một bên, **k** là hàng phía **trên** bên kia (hai phe đối diện).

### Lượt đi

- **Phe dưới** (hàng **`a`**, quân ký hiệu **hoa** trong sơ đồ ASCII) **đi trước** nước đầu tiên; sau đó hai phe **luân phiên** một nước mỗi lượt.

| Quân | Số lượng | Vị trí (theo tinh thần cờ tướng) |
|------|----------|----------------------------------|
| **Xe** | 2 | Hai góc hàng đáy (như xe cờ tướng). |
| **Mã** | 2 | Trong cùng hàng đáy, cạnh xe (như mã cờ tướng). |
| **Tốt** | 5 | Hàng tốt cờ tướng — **ban đầu hai bên cách nhau 3 ô** theo chiều dọc (giống khoảng cách tốt cờ tướng). |
| **Xạ thủ** | 2 | Vị trí **pháo** cờ tướng (game không có pháo kiểu cờ tướng). |
| **Tượng** | 2 | Vị trí **tượng** cờ tướng. |
| **Vua** | 1 | **Giữa** hàng đáy (ô giữa như tướng/cờ tướng). |
| **Đại bàng** | 2 | **Hai bên cạnh vua**; ban đầu **mặt đất**; muốn bay thì **lật tại chỗ** (hết lượt), lượt sau mới bay được. |
| **Sát thủ** | 2 | **Hàng thứ hai** tính từ mép sân mỗi bên — **cột 3** và **cột 7**, đúng **trước mặt** (về phía trung tâm) mỗi con **tượng**. |

### Tham khảo engine cờ tướng (mailbox)

Ý **bàn mailbox** (ô `x` = ngoài bàn / off-board, ô `.` = trống trong phần chơi) và cách tổ chức mảng một chiều lấy cảm hứng từ engine **Wukong** (JavaScript, cờ tướng) — không dùng trực tiếp làm engine vChess, chỉ tham khảo cách **đánh chỉ số ô** và **duyệt hướng** cho đỡ vướng biên:

- Repo: [github.com/maksimKorzh/wukong-xiangqi](https://github.com/maksimKorzh/wukong-xiangqi)
- File engine: [wukong.js](https://github.com/maksimKorzh/wukong-xiangqi/blob/main/src/engine/wukong.js)

vChess **không cần** engine tìm kiếm mạnh; chỉ cần **sinh nước hợp lệ + chơi ổn** (PvP hoặc AI đơn giản).

### Ký hiệu ASCII / debug

| Ký tự | Quân | Ghi chú |
|-------|------|---------|
| `R` / `r` | Xe | Phe dưới hoa / phe trên thường (tuỳ quy ước hiển thị) |
| `N` / `n` | Mã | |
| `E` / `e` | Tượng | **E**lephant (tránh nhầm `B` bishop) |
| `G` / `g` | Xạ thủ | **G**unner (tránh `A` như sĩ cờ tướng) |
| `K` / `k` | Vua | |
| `P` / `p` | Tốt | |
| `S` / `s` | Sát thủ | |
| `H` / `h` | Đại bàng (mặt đất) | **H**awk |
| `F` / `f` | Đại bàng (mặt bay) | **F**ly — có thể chỉ dùng trong debug khi cần phân biệt |

### Sơ đồ bàn ban đầu (mailbox có viền `x`)

Đọc từ **trên xuống** = hàng **`k` → `a`**, **trái → phải** = cột **`1` → `9`**. Mỗi hàng chơi có dạng `x` + 9 ô + `x`. **Mailbox đúng nghĩa:** thêm **hai hàng toàn `x` phía trên** và **hai hàng toàn `x` phía dưới** vùng 11 hàng cờ (tổng **4 hàng viền** chỉ off-board), giống tinh thần bảng có **đệm** như Wukong — tránh nhầm với chỉ một lớp `x`. **Chữ thường** = phe trên (hàng `k`…`h`), **chữ hoa** = phe dưới (hàng `a`…`d`).

```
    cột:  1 2 3 4 5 6 7 8 9
          | | | | | | | | |
        x x x x x x x x x x x   ← viền trên (hàng off-board 1)
        x x x x x x x x x x x   ← viền trên (hàng off-board 2)
    k   x r n e h k h e n r x   ← hàng đáy phe trên
    j   x . . s . . . s . . x   ← sát thủ (j3, j7)
    i   x . g . . . . . g . x   ← xạ thủ (i2, i8 — chỗ pháo cờ tướng)
    h   x p . p . p . p . p x   ← tốt
    g   x . . . . . . . . . x
    f   x . . . . . . . . . x
    e   x . . . . . . . . . x   ← vùng giữa (3 hàng trống)
    d   x P . P . P . P . P x   ← tốt
    c   x . G . . . . . G . x   ← xạ thủ (c2, c8 — chỗ pháo cờ tướng)
    b   x . . S . . . S . . x   ← sát thủ (b3, b7)
    a   x R N E H K H E N R x   ← hàng đáy phe dưới (đại bàng mặt đất H)
        x x x x x x x x x x x   ← viền dưới (hàng off-board 1)
        x x x x x x x x x x x   ← viền dưới (hàng off-board 2)
```

- Ô **`.`** là **ô trống** trong phần chơi (khai cuộc).
- Viền **`x`** (kể cả **hai lớp** trên và **hai lớp** dưới) dùng khi code muốn **một mảng 11 cột × 15 hàng** (2 + 11 + 2) hoặc tương đương — bước theo vector thì **ô ngoài bàn** là `x`. Wukong dùng lưới lớn hơn (ví dụ 11×14) nhưng **cùng ý**: đệm quanh vùng chơi để giảm kiểm tra biên.

---

## 6. Chiếu, chiếu hết, hòa (tham khảo cờ vua quốc tế)

Phần này **lấy tinh thần từ luật cờ vua [FIDE](https://www.fide.com/FIDE/handbook/LawsOfChess.pdf)** (chiếu, chiếu hết, một số cách hòa) để có **chuẩn tham khảo** khi code và khi chơi. **Chưa phải bản luật chính thức của vChess** — có thể **điều chỉnh sau** khi test gameplay (đặc biệt các quân đặc biệt như sát thủ, đại bàng).

### 6.1. Chiếu

- **Chiếu:** Vua của phe **đang đến lượt** bị **một quân địch** “tấn công” ô vua đó theo **đúng luật di chuyển / ăn quân** của loại quân địch (kể cả các quân có cơ chế đặc biệt).
- **Không được** đi nước làm cho **vua của mình** sau nước đó **vẫn đang bị chiếu** hoặc **tự đi vào ô bị chiếu** (giống cờ vua).
- **Bắt buộc** trong lượt: nếu đang bị chiếu, mọi nước hợp lệ phải **làm hết bị chiếu** (di chuyển vua, chặn — nếu có quân chặn được — hoặc ăn quân đang chiếu).

*(vChess **không** dùng luật “hai vua nhìn thẳng nhau” của cờ tướng trừ khi sau này được bổ sung có chủ đích.)*

### 6.2. Chiếu hết (thắng)

- **Chiếu hết:** Phe đang đến lượt **đang bị chiếu** và **không còn nước đi hợp lệ** nào → **thua**. Phe kia **thắng**.

### 6.3. Hết nước nhưng không bị chiếu (stalemate)

- **Stalemate:** Phe đang đến lượt **không bị chiếu** nhưng **không có nước đi hợp lệ** nào.
- **Tham khảo FIDE (cờ vua):** Ván kết quả **hòa**.
- *Ghi chú:* Một số biến thể cờ tướng xử stalemate là **thua** phe hết nước — **không** áp dụng mặc định ở đây; nếu sau này đổi, cập nhật lại mục này.

### 6.4. Hòa do lặp lại thế cờ (threefold repetition)

- **Ý tưởng (giống FIDE):** Nếu **cùng một thế cờ** **xuất hiện ba lần** trong ván (không nhất thiết liên tiếp), **một bên có thể yêu cầu hòa** (hoặc client tự nhận diện nếu implement).

**Đề xuất luật “cùng thế cờ” trong vChess (để hash / so sánh trạng thái):**

Hai thế được coi là **giống hệt** khi trùng **toàn bộ** các thành phần sau:

1. **Bàn:** Vị trí và loại mọi quân (phe + loại quân); với **đại bàng** phải trùng cả **mặt đất / bay** (vì ảnh hưởng nước đi hợp lệ).
2. **Lượt:** **Phe đến lượt** phải giống nhau (cùng một phe sắp đi).
3. **Quyền vua (nước đi 2 ô lần đầu):** Với **mỗi vua**, cờ “**chưa từng** đi nước 2 ô” / “**đã** đi hoặc mất quyền” phải giống nhau (tương đương quyền nhập thành trong cờ vua — thay đổi khả năng nước hợp lệ).

**Không** cần lưu lịch sử đầy đủ: khi implement, mỗi lần **một nước hoàn tất**, tạo **khóa** (hash hoặc chuỗi cố định) từ `(1)(2)(3)` rồi **đếm số lần** khóa đó xuất hiện; **≥ 3** thì đủ điều kiện yêu cầu hòa theo mục này.

### 6.5. Hòa do 50 nước không ăn quân (50-move rule)

**Nửa nước (`halfmove`) là gì?**

- Trong tài liệu cờ vua (FIDE), **một nửa nước** = **một lần một phe đi đúng một nước** (tiếng Anh thường gọi là **ply** hoặc **half-move**).
- **Hai** nửa nước (phe dưới đi + phe trên đi) ≈ **một “nước đầy đủ”** theo cách nói thông thường của người chơi.
- Bộ đếm `halfmoveClock` **tăng 1** sau **mỗi** nửa nước **không** reset theo các quy tắc dưới; **reset về 0** khi xảy ra bất kỳ điều kiện reset nào trong cùng nước đó.

**Reset bộ đếm (đề xuất bám FIDE + vChess):**

- **Reset về 0** khi: **có quân bị ăn** **hoặc** **tốt di chuyển** (đi một ô, kể cả không ăn).
- *Tuỳ chọn sau playtest:* có thể thêm reset khi **lật đại bàng** (đổi mặt đất/bay) nếu muốn tránh kéo dài vô hạn chỉ bằng lật quân — **chưa bắt buộc** trong bản nháp này.

**Yêu cầu hòa:**

- Khi `halfmoveClock >= 100` (tức **100 nửa nước** liên tiếp không bị reset — tương đương luật **50 nước** trong cách đếm của cờ vua quốc tế), **một bên có thể yêu cầu hòa** (claim draw).
- Có thể hiển thị: “đủ điều kiện yêu cầu hòa (50 nước / 100 nửa nước)” khi đạt ngưỡng.

### 6.6. Hòa do đồng ý

- Hai bên **đồng ý hòa** bất kỳ lúc nào (nút “đề nghị hòa” / chấp nhận) — phổ biến trong cờ vua online; không thay thế các mục 6.4–6.5 nhưng bổ sung.

### 6.7. Tóm tắt triển khai

| Kết quả | Điều kiện (tóm tắt) |
|--------|----------------------|
| Thắng / Thua | Chiếu hết (mục 6.2) |
| Hòa | Stalemate (6.3); lặp thế 3 lần (6.4); 50 nước không ăn + yêu cầu (6.5); đồng ý (6.6) |

---

*Tài liệu trong thư mục `vchess` — cập nhật khi luật chơi được chốt. Luật mục 6 có thể thay đổi sau khi playtest.*
