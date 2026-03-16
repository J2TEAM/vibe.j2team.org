import type { Article } from './types'

export const LapThuArticle: Article = {
  title: 'Lập Thu: Khúc Giao Mùa Dịu Dàng Và Sự Thu Liễm',
  subtitle: 'Tiết Khí Thứ 13 • 7-8 Tháng 8',
  quote: 'Phổi khỏe, Tâm an, Đời thanh thản.',
  season: 'Thu',
  theme: {
    primary: '#D4AF37', // autumn-gold
    secondary: '#B0C4DE', // set-sun-orange
    accent: '#CC5500', // cool-pine
    bg: '#F5F5F5', // cream-mist
    text: '#556B2F', // charcoal-teal
    selectionBg: '#D4AF37',
    selectionText: '#ffffff',
  },
  decorations: [
    { emoji: '🍂', animation: 'bounce', position: { left: '-3rem', top: '0' } },
    { emoji: '🌬️', animation: 'shiver', position: { right: '-3rem', top: '-1rem' } },
    { emoji: '🍉', animation: 'pulse', position: { right: '10%', top: '20%' } },
  ],
  sections: [
    {
      id: 'y-nghia',
      title: '1. Ý Nghĩa và Đặc Điểm: Chớm Thu Se Lạnh',
      content: `Trong dòng chảy vô tận của thời gian, Lập Thu (立秋) là một nốt lặng đầy ý nghĩa. Nó không ồn ào như Lập Hạ, không buốt giá như Lập Đông, mà mang theo sự dịu dàng, trầm lắng. Đây là tiết khí thứ 13 trong 24 tiết khí, thường bắt đầu vào khoảng ngày 7 hoặc 8 tháng 8 Dương lịch, khi Mặt Trời đi qua kinh độ 135°.

### Giải Nghĩa Tên Gọi
"Lập" (立) là xác lập, bắt đầu; "Thu" (秋) là mùa thu. Lập Thu đánh dấu sự bắt đầu của mùa thu. Trong văn hóa phương Đông, mùa thu ứng với hành **Kim**, chủ về sự thu liễm (thu vào), mát mẻ và khô ráo (táo khí).

### Sự Biến Đổi Của Thiên Nhiên
Tuy gọi là "Thu", nhưng cái nóng của mùa hạ (nắng quái) vẫn chưa dứt hẳn, dân gian gọi là "Thu lão hổ" (Hổ mùa thu - ý nói nắng thu còn dữ dội). Tuy nhiên, về đêm và sáng sớm, gió heo may đã mang theo chút se lạnh.

Cổ nhân ghi nhận ba hiện tượng (tam hậu) đặc trưng:
1. **Lương phong chí:** Gió mát bắt đầu thổi. Những cơn gió không còn hầm hập hơi nóng mà mang theo sự dễ chịu.
2. **Bạch lộ giáng:** Sương trắng bắt đầu xuất hiện vào buổi sớm (dù chưa nhiều như tiết Bạch Lộ), báo hiệu chênh lệch nhiệt độ ngày đêm tăng lên.
3. **Hàn thiền minh:** Ve sầu mùa lạnh (ve sầu mùa thu) bắt đầu kêu. Tiếng kêu của chúng trầm và buồn hơn tiếng ve mùa hạ.`,
    },
    {
      id: 'doi-song',
      title: '2. Ảnh Hưởng Đến Đời Sống: Mùa Gặt Và Tế Lễ',
      content: `### Nông Nghiệp: Thu Hoạch Và Gieo Trồng Vụ Thu Đông
- **Thu hoạch:** Ở nhiều vùng, đây là lúc thu hoạch lúa sớm, ngô, khoai. Nông dân tranh thủ nắng thu để phơi phóng nông sản.
- **Gieo trồng:** Tranh thủ độ ẩm còn sót lại của mùa mưa để gieo trồng các loại rau vụ đông (cải bắp, su hào, súp lơ).
- Câu tục ngữ *"Lập Thu trồng rau, ăn Tết vừa giàu"* phản ánh kinh nghiệm canh tác này.

### Phong Tục: "Thiếp Thu Phiêu" Và Tế Thu
- **Thiếp Thu Phiêu (Vỗ béo mùa thu):** Mùa hè nóng bức khiến người ta chán ăn, sụt cân (khổ hạ). Đến Lập Thu, trời mát mẻ hơn, người xưa có tục ăn các món bổ dưỡng (thường là thịt kho, thịt hầm) để bù đắp lại sức khỏe, gọi là "dán thêm mỡ mùa thu".
- **Cắn Thu (Giảo Thu):** Ăn dưa hấu hoặc dưa lưới vào ngày Lập Thu với ý nghĩa "cắn" lại cái nóng còn sót lại, cầu mong không bị rôm sảy hay bệnh tật vào mùa thu đông.
- **Tế Thu:** Làm lễ tạ ơn Thần Nông và Tổ tiên đã phù hộ cho một vụ mùa bội thu.`,
    },
    {
      id: 'duong-sinh',
      title: '3. Lời Khuyên Dưỡng Sinh: Dưỡng Phế, Tránh Hanh Khô',
      content: `Mùa Thu ứng với tạng **Phế (Phổi)**. Khí thu thường khô (Táo), dễ làm tổn thương Phế âm, gây ho khan, khô họng, nẻ da.

### Ẩm Thực: Nhuận Phế, Sinh Tân
- **Nguyên tắc:** "Thiểu tân tăng toan" (Bớt cay thêm chua). Vị cay (hành, tỏi, ớt) làm phát tán khí, hại Phế. Vị chua (cam, quýt, táo, nho) giúp thu liễm, giữ nước cho cơ thể.
- **Nên dùng:** Các thực phẩm màu trắng (đi vào Phế) và có tính nhuận như: lê, ngân nhĩ (nấm tuyết), củ sen, mật ong, đậu phụ, củ cải trắng.
- **Hạn chế:** Đồ nướng, chiên xào nhiều dầu mỡ gây nóng trong, làm trầm trọng thêm tình trạng khô háo.

### Sinh Hoạt: Thu Liễm Thần Khí
- **Ngủ nghỉ:** Nên đi ngủ sớm hơn để thuận theo sự thu liễm của khí âm, và dậy sớm để hít thở không khí trong lành của khí dương đầu thu.
- **Tránh lạnh:** Dù ban ngày nóng nhưng đêm đã lạnh. Cần chú ý đắp chăn mỏng, không để gió lùa trực tiếp vào người để tránh cảm lạnh mùa thu.
- **Tập luyện:** Các bài tập hít thở sâu, thiền định rất tốt để dưỡng Phổi và làm dịu tinh thần.`,
    },
    {
      id: 'chiem-nghiem',
      title: '4. Tâm Tư và Chiêm Nghiệm: Sự Buông Bỏ',
      content: `Lập Thu dạy ta bài học về sự **Buông Bỏ** và **Trở Về**.

Mùa Hạ là hướng ra bên ngoài, bung tỏa năng lượng. Mùa Thu là lúc quay vào bên trong, thu vén lại tâm hồn. Cây cối bắt đầu trút bỏ những chiếc lá không còn cần thiết để dồn nhựa sống nuôi thân và rễ.

Con người cũng vậy. Để chuẩn bị cho một mùa đông an lành, ta cần học cách buông bỏ những phiền muộn, những chấp niệm, những mối quan hệ độc hại đã "úa vàng". Đừng luyến tiếc quá khứ rực rỡ của mùa hạ, hãy trân trọng sự tĩnh lặng và sâu sắc của mùa thu.

Lập Thu là lúc để sống chậm lại, lắng nghe tiếng nói bên trong mình, và tìm kiếm sự bình yên từ những điều giản dị nhất.

Nguyện chúc quý vị một mùa Lập Thu: **Phổi khỏe, Tâm an, Đời thanh thản.**

*Biên soạn bởi Tịch Phong Thiên Sơn - 夕风天山*`,
    },
  ],
}
