import type { Article } from './types'

export const LapDongArticle: Article = {
  title: 'Lập Đông: Sự Khởi Đầu Của Mùa Tàng Ẩn Và Nuôi Dưỡng Nội Lực',
  subtitle: 'Tiết Khí Thứ 19 • 7-8 Tháng 11',
  quote: 'Thân ấm áp, Tâm an nhiên, Tích tàng phúc khí.',
  season: 'Đông',
  theme: {
    primary: '#1D3557', // deep-navy
    secondary: '#A8DADC', // steel-blue
    accent: '#E63946', // ice-blue
    bg: '#F1FAEE', // frost-white
    text: '#1D3557', // ink-black
    selectionBg: '#1D3557',
    selectionText: '#ffffff',
  },
  decorations: [
    { emoji: '❄️', animation: 'pulse', position: { left: '-3rem', top: '0' } },
    { emoji: '🧥', animation: 'shiver', position: { right: '-3rem', top: '-1rem' } },
    { emoji: '🍲', animation: 'pulse', position: { right: '10%', top: '20%' } },
  ],
  sections: [
    {
      id: 'y-nghia',
      title: '1. Ý Nghĩa và Đặc Điểm: Cánh Cửa Mùa Đông Mở Ra',
      content: `Khi sắc đỏ của lá phong dần phai và bầu trời trở nên cao vời vợi nhưng xám đục, đất trời bước vào tiết Lập Đông (立冬). Đây là tiết khí thứ 19 trong 24 tiết khí, thường bắt đầu vào khoảng ngày 7 hoặc 8 tháng 11 Dương lịch, khi Mặt Trời đi qua kinh độ 225°.

### Giải Nghĩa Tên Gọi
"Lập" (立) nghĩa là xác lập, bắt đầu; "Đông" (冬) theo nghĩa cổ không chỉ là mùa đông, mà còn mang ý nghĩa là "chung" (kết thúc) và "tàng" (cất giữ). Lập Đông không chỉ là bắt đầu mùa đông, mà còn hàm ý rằng vụ mùa đã kết thúc, vạn vật cần được thu hoạch và cất giữ để nghỉ ngơi.

### Sự Biến Đổi Của Thiên Nhiên
Lúc này, khí Dương lặn sâu, khí Âm thịnh vượng. Nước bắt đầu lạnh buốt, đất đai cứng lại.

Cổ nhân ghi nhận ba hiện tượng (tam hậu) đặc trưng:
1. **Thủy thủy băng:** Nước bắt đầu đóng băng (ở những vùng vĩ độ cao). Dòng chảy trở nên chậm chạp và tĩnh lặng.
2. **Địa thủy đống:** Đất đai bắt đầu đông cứng lại do khí lạnh, không còn mềm xốp như mùa xuân hè.
3. **Trĩ nhập đại thủy vi bạng:** Chim trĩ (loài chim lớn) biến mất, trong khi đó ở ven sông hồ lại xuất hiện nhiều con nghêu, sò (bạng). Người xưa ngỡ rằng chim trĩ đã lặn xuống nước hóa thân thành nghêu sò để tránh rét, tượng trưng cho sự ẩn mình của dương khí.`,
    },
    {
      id: 'doi-song',
      title: '2. Ảnh Hưởng Đến Đời Sống: "Thu Liễm" Và "Bổ Đông"',
      content: `### Nông Nghiệp: "Ngày Tháng Mười Chưa Cười Đã Tối"
- **Thu hoạch và Cất trữ:** Đây là thời điểm nông nhàn sau khi đã thu hoạch xong lúa mùa và hoa màu. Công việc chính là phơi phóng, xay giã và cất trữ lương thực vào kho để dùng dần trong những ngày đông giá rét.
- **Cày ải và Ủ phân:** Đất ruộng được cày lật lên để ải, diệt trừ sâu bệnh và bón lót, chuẩn bị cho vụ Chiêm Xuân năm sau.

### Phong Tục: Tẩm Bổ Đầu Đông
- **Nghênh Đông:** Xưa kia, vào ngày này Thiên tử thường dẫn bá quan ra ngoại ô phía Bắc để làm lễ đón khí mùa đông, ban thưởng áo ấm cho quần thần, thể hiện sự quan tâm đến muôn dân trước cái lạnh sắp tới.
- **Bổ Đông (Tẩm bổ):** Dân gian có câu: *"Lập Đông bổ đông, bổ chủy không"*. Nghĩa là vào ngày này cần phải ăn các món bổ dưỡng để bồi đắp cơ thể, nếu không miệng sẽ trống rỗng (ý nói thiếu hụt năng lượng). Người miền Bắc thường ăn sủi cảo (bánh chẻo), người miền Nam ăn thịt gà, vịt, thịt dê hầm.`,
    },
    {
      id: 'duong-sinh',
      title: '3. Lời Khuyên Dưỡng Sinh: Dưỡng Tàng, Tránh Hàn',
      content: `Mùa Đông ứng với hành **Thủy**, tạng **Thận**. Nguyên tắc dưỡng sinh cốt lõi là **"Dưỡng Tàng"** (Nuôi dưỡng sự ẩn giấu) và **"Trừ Hàn"** (Chống lạnh).

### Sinh Hoạt: Thuận Theo Mặt Trời
- **Ngủ sớm dậy muộn:** "Tảo ngọa vãn khởi, tất đãi nhật quang". Nên đi ngủ sớm để dưỡng dương khí, và chỉ dậy khi mặt trời đã lên để tránh hàn khí buổi sớm làm tổn thương cơ thể.
- **Giữ ấm:** Đặc biệt chú ý giữ ấm **lưng** (nơi dương khí hội tụ) và **bàn chân** (nơi kinh mạch bắt đầu). Tránh để da thịt tiếp xúc trực tiếp với gió lạnh.

### Ẩm Thực: Ôn Bổ Thận Dương
- Cơ thể cần nhiều năng lượng để sinh nhiệt. Nên ăn các thực phẩm giàu protein và chất béo tốt.
- **Thực phẩm tính ôn:** Thịt dê, thịt bò, thịt gà, tôm, cá chạch.
- **Rau củ:** Củ cải trắng ("Đông ăn củ cải, hạ ăn gừng"), khoai lang, khoai sọ, các loại hạt (óc chó, hạt dẻ).
- **Màu Đen:** Thực phẩm màu đen đi vào Thận: Gạo nếp cẩm, đỗ đen, mộc nhĩ, vừng đen.`,
    },
    {
      id: 'chiem-nghiem',
      title: '4. Tâm Tư và Chiêm Nghiệm: Sức Mạnh Của Sự Tĩnh Lặng',
      content: `Lập Đông dạy ta bài học sâu sắc về sự **Nghỉ Ngơi** và **Tích Lũy**.

Nhìn cây cối trơ trọi lá cành, dòng sông im lìm không chảy, ta dễ lầm tưởng đó là sự chết chóc. Nhưng không, đó là một giấc ngủ cần thiết. Bên dưới lớp đất lạnh cứng kia, những hạt mầm đang âm thầm hút nhựa sống, chờ đợi thời cơ.

Con người cũng vậy. Chúng ta không thể lúc nào cũng "bung tỏa" như mùa Hạ, hay "gặt hái" như mùa Thu. Cần có những giai đoạn "Lập Đông" trong cuộc đời -- những lúc ta thu mình lại, sống chậm hơn, nhìn sâu vào bên trong để chữa lành những vết thương và bồi đắp nội lực.

Đừng sợ sự tĩnh lặng hay cô đơn của mùa đông. Chính trong sự tĩnh lặng ấy, trí tuệ được kết tinh và tâm hồn được thanh lọc. Hãy tận hưởng những ngày đông như một cơ hội để "làm mới" chính mình từ bên trong.

Nguyện chúc quý vị một mùa Lập Đông: **Thân ấm áp, Tâm an nhiên, Tích tàng phúc khí.**

*Biên soạn bởi Tịch Phong Thiên Sơn - 夕风天山*`,
    },
  ],
}
