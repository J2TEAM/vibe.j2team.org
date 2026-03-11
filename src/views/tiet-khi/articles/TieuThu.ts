import type { Article } from './types'

export const TieuThuArticle: Article = {
  title: 'Tiểu Thử: Khúc Dạo Đầu Của Mùa Nắng Lửa',
  subtitle: 'Tiết Khí Thứ 11 • 7-8 Tháng 7',
  quote: 'Tâm sen thanh tịnh, Lòng vững như đồng.',
  season: 'Hạ',
  theme: {
    primary: '#FB8500', // dawn-orange
    secondary: '#FFB5A7', // honey-yellow
    accent: '#FFD166', // lotus-blue
    bg: '#FDFCDC', // sun-bleached-sand
    text: '#2D6A4F', // prussian-blue
    selectionBg: '#FB8500',
    selectionText: '#ffffff',
  },
  decorations: [
    { emoji: '🪷', animation: 'pulse', position: { left: '-3rem', top: '0' } },
    { emoji: '👒', animation: 'bounce', position: { right: '-3rem', top: '-1rem' } },
    { emoji: '🏏', animation: 'shiver', position: { right: '10%', top: '20%' } },
  ],
  sections: [
    {
      id: 'y-nghia',
      title: '1. Ý Nghĩa và Đặc Điểm: Cái Nóng Còn E Ấp',
      content: `Sau Hạ Chí, khi bóng râm ngày càng ngắn lại và tiếng ve kêu ngày một rền rĩ hơn, đất trời bước vào tiết Tiểu Thử (小暑). Đây là tiết khí thứ 11 trong 24 tiết khí, thường bắt đầu vào khoảng ngày 7 hoặc 8 tháng 7 Dương lịch, khi Mặt Trời đi qua kinh độ 105°.

### Giải Nghĩa Tên Gọi
"Tiểu" (小) là nhỏ, bé; "Thử" (暑) là nắng nóng, oi bức. Tiểu Thử có nghĩa là "Nắng nóng nhỏ" hoặc "Mới chớm nóng".
Mặc dù tên gọi là "nhỏ", nhưng thực tế nhiệt độ lúc này đã tăng lên rất cao. Người xưa quan niệm rằng cái nóng vẫn chưa đến mức cực điểm (sẽ là Đại Thử kế tiếp), nên mới gọi là Tiểu Thử. Tuy nhiên, đây là giai đoạn mở đầu cho "Tam Phục" - những ngày nóng nhất trong năm.

### Sự Biến Đổi Của Thiên Thiên Nhiên
Đặc trưng lớn nhất của Tiểu Thử là "Nóng và Ẩm". Gió Đông Nam mang theo hơi nước từ biển vào lục địa, gặp nhiệt độ cao tạo nên kiểu thời tiết "xông hơi" rất khó chịu.

Cổ nhân ghi nhận ba hiện tượng (tam hậu) trong tiết này:
1. **Ôn phong chí:** Gió nóng bắt đầu thổi. Không còn là gió mát đầu hè, gió lúc này mang theo hơi nóng hầm hập.
2. **Dế mèn ở vách:** Do mặt đất quá nóng, dế mèn phải rời bỏ hang đất để tìm nơi mát mẻ hơn như các kẽ nứt trên tường vách.
3. **Ưng thủy chí:** Chim ưng con bắt đầu tập bay và học săn mồi, thể hiện sự tôi luyện trong khắc nghiệt.`,
    },
    {
      id: 'doi-song',
      title: '2. Ảnh Hưởng Đến Đời Sống: Mùa Phơi Phóng Và Thưởng Sen',
      content: `### Nông Nghiệp: Quản Lý Nước Và Mùa Vụ
- Đây là giai đoạn cây lúa và hoa màu phát triển nhanh nhất nhưng cũng dễ bị sâu bệnh và cỏ dại tấn công nhất.
- Mưa bão thường xuyên xuất hiện (bão nhiệt đới), nên công tác phòng chống lũ lụt, khơi thông dòng chảy là ưu tiên hàng đầu của nhà nông.

### Phong Tục: "Thực Tân" Và Phơi Đồ
- **Thực Tân (Ăn cơm mới):** Ở nhiều vùng lúa nước, sau khi thu hoạch lúa sớm, người dân sẽ xay xát gạo mới, nấu cơm cúng tổ tiên và mời xóm giềng cùng thưởng thức hương vị của mùa màng.
- **Phơi Đồ (Sái Phục):** Do độ ẩm cao, quần áo, sách vở dễ bị ẩm mốc. Tận dụng cái nắng gay gắt của Tiểu Thử, người xưa mang quần áo, chăn màn, sách vở ra phơi để diệt khuẩn, chống mốc. Tục này còn gọi là "Sái thư" (phơi sách).
- **Thưởng Sen:** Đây là lúc hoa sen nở rộ nhất trong đầm. Ngắm hoa sen, thưởng trà sen là thú vui tao nhã để xua tan cái nóng.`,
    },
    {
      id: 'duong-sinh',
      title: '3. Lời Khuyên Dưỡng Sinh: Dưỡng Tâm, Kiện Tỳ',
      content: `Tiểu Thử khí hậu nóng ẩm (Thấp nhiệt), con người dễ cảm thấy bứt rứt, chán ăn, mệt mỏi (gọi là "Khổ hạ").

### Ẩm Thực: Giải Nhiệt Nhưng Không Tham Lạnh
- **Ăn Ngó Sen và Đậu Xanh:** Ngó sen giúp thanh nhiệt, mát máu, an thần. Chè đậu xanh, nước đậu xanh giúp giải độc, tiêu thử cực tốt.
- **Lươn Vàng:** Dân gian có câu: *"Tiểu Thử lươn vàng béo như sâm"*. Đây là lúc lươn béo và bổ dưỡng nhất, thích hợp để bồi bổ khí huyết đã hao tổn do ra nhiều mồ hôi.
- **Tránh Đồ Sống Lạnh:** Dù trời nóng nhưng không nên ăn quá nhiều đồ lạnh, vì khí ẩm (thấp) đang vượng, ăn lạnh dễ làm tổn thương Tỳ vị, gây tiêu chảy.

### Sinh Hoạt: Tâm Tĩnh, Thân An
- **Tránh Nắng Gắt:** Hạn chế hoạt động mạnh ngoài trời vào buổi trưa.
- **Ngủ Trưa:** Giấc ngủ trưa ngắn giúp phục hồi năng lượng cho Tim (Tâm), vì mùa Hè tâm hỏa vượng, dễ gây mất ngủ, hồi hộp.
- **Điều Hòa Cảm Xúc:** Nóng nực dễ sinh cáu gắt. Hãy giữ tâm thái bình thản, "Tâm tĩnh tự nhiên lương" (Lòng tĩnh thì tự nhiên thấy mát).`,
    },
    {
      id: 'chiem-nghiem',
      title: '4. Tâm Tư và Chiêm Nghiệm: Sự Tôi Luyện',
      content: `Tiểu Thử dạy ta bài học về sự **Kiên Nhẫn** và **Tôi Luyện**.

Cái nóng của Tiểu Thử không phải là sự hủy diệt, mà là môi trường cần thiết để vạn vật trưởng thành. Hạt lúa cần nắng để chín, chim ưng cần gió nóng để tập bay cao. Không có áp lực của nhiệt độ, sẽ không có sự kết tinh của hương vị ngọt ngào.

Con người cũng vậy. Những giai đoạn khó khăn, "nóng bỏng" trong cuộc đời chính là lúc ta được tôi luyện bản lĩnh. Đừng trốn chạy thử thách, cũng đừng than vãn về sự khắc nghiệt. Hãy học cách dế mèn tìm nơi trú ẩn an toàn, học cách hoa sen vươn lên từ bùn lầy tỏa hương thơm ngát.

Hãy coi Tiểu Thử là lò bát quái để luyện nên "đôi mắt lửa, tròng vàng" của trí tuệ và sự kiên định. Chỉ khi đi qua những ngày nắng lửa, ta mới thấu hiểu giá trị của những cơn mưa rào và trân trọng bóng mát bình yên.

Nguyện chúc quý vị một mùa Tiểu Thử: **Tâm sen thanh tịnh, Lòng vững như đồng.**

*Biên soạn bởi Tịch Phong Thiên Sơn - 夕风天山*`,
    },
  ],
}
