import type { Article } from './types'

export const DaiThuArticle: Article = {
  title: 'Đại Thử: Đỉnh Điểm Của Mùa Hạ Và Sự Tôi Luyện Của Lửa',
  subtitle: 'Tiết Khí Thứ 12 • 22-23 Tháng 7',
  quote: 'Vượt qua nắng lửa, Tâm sáng chí bền.',
  season: 'Hạ',
  theme: {
    primary: '#D00000', // furnace-red
    secondary: '#E85D04', // ember-orange
    accent: '#6A994E', // solar-flare
    bg: '#03071E', // midnight-ink
    text: '#FDFFFC', // sand-glow
    selectionBg: '#D00000',
    selectionText: '#ffffff',
  },
  decorations: [
    { emoji: '🔥', animation: 'pulse', position: { left: '-3rem', top: '0' } },
    { emoji: '🪰', animation: 'shiver', position: { right: '-3rem', top: '-1rem' } },
    { emoji: '🍉', animation: 'bounce', position: { right: '10%', top: '20%' } },
  ],
  sections: [
    {
      id: 'y-nghia',
      title: '1. Ý Nghĩa và Đặc Điểm: Lò Bát Quái Của Thiên Nhiên',
      content: `Sau Tiểu Thử oi ả, đất trời bước vào giai đoạn nóng bức nhất trong năm, đó chính là Đại Thử (大暑). Đây là tiết khí thứ 12 trong 24 tiết khí, thường bắt đầu vào khoảng ngày 22 hoặc 23 tháng 7 Dương lịch, khi Mặt Trời đi qua kinh độ 120°.

### Giải Nghĩa Tên Gọi
"Đại" (大) là lớn; "Thử" (暑) là nắng nóng. Đại Thử nghĩa là nắng nóng gay gắt đến cực điểm. Đây là lúc nhiệt độ không khí lên cao nhất, kết hợp với những cơn mưa rào mùa hạ tạo nên kiểu thời tiết "thấp nhiệt" (nóng ẩm) ngột ngạt như trong lồng hấp.

### Sự Biến Đổi Của Thiên Nhiên
Đại Thử thường trùng với giai đoạn "Trung Phục" - giai đoạn nóng nhất trong "Tam Phục". Cổ nhân ghi nhận ba hiện tượng (tam hậu) đầy thi vị:
1. **Phụ thảo vi huỳnh:** Cỏ mục sinh ra đom đóm. Trong cái nóng ẩm, cỏ cây mục nát, người xưa tin rằng chúng hóa thành đom đóm lập lòe trong đêm hè.
2. **Thổ nhuận溽 thử:** Đất đai ẩm ướt, không khí oi bức. Hơi nước bốc lên từ lòng đất nóng hổi.
3. **Đại vũ thời hành:** Mưa lớn thường xuyên xuất hiện. Những cơn giông tố dữ dội giúp giải tỏa bớt nhiệt lượng tích tụ.`,
    },
    {
      id: 'doi-song',
      title: '2. Ảnh Hưởng Đến Đời Sống: Chạy Đua Với Nắng Mưa',
      content: `### Nông Nghiệp: "Song Thương" (Hai Lần Cướp)
Đối với nhà nông, Đại Thử là thời điểm "Song thương" (Cướp thu và Cướp cấy).
- **Cướp thu:** Phải tranh thủ thu hoạch lúa sớm trước khi mưa bão ập đến.
- **Cướp cấy:** Phải gieo cấy lúa muộn ngay lập tức để kịp thời vụ.
- Cái nắng Đại Thử tuy khắc nghiệt với con người nhưng lại là nguồn năng lượng quý giá thúc đẩy cây trồng sinh trưởng thần tốc.

### Phong Tục: Uống Trà Phục, Đốt Thuyền Ôn
- **Uống Trà Phục:** Người xưa có thói quen uống trà thảo dược (trà Phục) làm từ kim ngân, cam thảo... để thanh nhiệt, giải độc trong những ngày nóng nhất.
- **Đốt Thuyền Ôn:** Ở các vùng ven sông biển, người dân có tục làm thuyền giấy chở các hình nhân tượng trưng cho dịch bệnh ("Ôn thần") rồi đốt đi hoặc thả trôi sông, cầu mong xua đuổi bệnh tật mùa hè.
- **Ăn Dứa (Thơm):** Ở một số vùng, người ta ăn dứa vào Đại Thử để giải khát và kích thích tiêu hóa.`,
    },
    {
      id: 'duong-sinh',
      title: '3. Lời Khuyên Dưỡng Sinh: Đông Ăn Củ Cải, Hạ Ăn Gừng',
      content: `Đại Thử là lúc "Dương thịnh Âm suy" ở bên ngoài, nhưng bên trong cơ thể, khí Âm lại dễ bị tổn thương do mồ hôi ra nhiều và thói quen ăn uống đồ lạnh.

### Ẩm Thực: Tại Sao Nên Ăn Gừng?
Câu tục ngữ "Đông ăn củ cải, Hạ ăn gừng" chứa đựng triết lý sâu sắc.
- Mùa hè, lỗ chân lông mở rộng, khí nóng bên ngoài xâm nhập, nhưng tỳ vị (dạ dày) bên trong lại dễ bị lạnh do ăn uống đồ mát, nước đá.
- Ăn một chút gừng tươi vào buổi sáng giúp làm ấm dạ dày, thăng dương khí, chống lại cái lạnh nội sinh và giải cảm nắng.

### Bổ Sung Nước Và Điện Giải
- Ra mồ hôi nhiều làm mất nước và muối khoáng. Cần uống nước chanh muối, nước dừa, canh đậu xanh, chè hạt sen để bù đắp.
- Ăn các món cháo loãng (cháo lá sen, cháo ý dĩ) để kiện tỳ, dễ tiêu hóa.

### Sinh Hoạt: Tránh "Tham Mát"
- Không nên để quạt hoặc điều hòa thổi thẳng vào người, đặc biệt khi đang đổ mồ hôi.
- Tránh tắm nước lạnh ngay khi vừa đi nắng về ("Hãn xuất bất kiến thấp" - Ra mồ hôi kỵ gặp nước). Điều này giúp tránh khí lạnh xâm nhập gây cảm mạo, đau xương khớp.`,
    },
    {
      id: 'chiem-nghiem',
      title: '4. Tâm Tư và Chiêm Nghiệm: Khổ Tận Cam Lai',
      content: `Đại Thử dạy ta bài học về sự **Kiên Trì** và **Chuyển Hóa**.

Cái nóng của Đại Thử như ngọn lửa trong lò luyện đan. Nó thiêu đốt những tạp chất, thử thách sức chịu đựng của muôn loài. Nhưng chính trong cái nóng cực điểm ấy, lúa mới chín vàng, sen mới ngát hương, và quả ngọt mới kết tinh đường mật.

Đời người cũng vậy. Những giai đoạn gian nan, "nóng bỏng" nhất thường là lúc ta đang đứng trước ngưỡng cửa của sự trưởng thành vượt bậc. Đừng sợ hãi sự khắc nghiệt. Hãy học cách "đổ mồ hôi" để thải trừ độc tố, học cách "ăn gừng" để giữ ấm ngọn lửa nhiệt huyết trong lòng.

Qua được Đại Thử là sẽ đến Lập Thu. Sau cơn mưa rào là cầu vồng rực rỡ. Hãy kiên tâm bền chí, vì "Khổ tận cam lai" - Hết đắng cay sẽ đến ngày ngọt bùi.

Nguyện chúc quý vị một mùa Đại Thử: **Vượt qua nắng lửa, Tâm sáng chí bền.**

*Biên soạn bởi Tịch Phong Thiên Sơn - 夕风天山*`,
    },
  ],
}
