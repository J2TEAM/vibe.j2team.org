import type { Article } from './types'

export const ThanhMinhArticle: Article = {
  title: 'Thanh Minh: Bầu Trời Trong Sáng Và Lễ Tảo Mộ Tri Ân',
  subtitle: 'Tiết Khí Thứ 5 • 4-5 Tháng 4',
  quote: 'Tâm sáng như gương, Lòng an như đất.',
  season: 'Xuân',
  theme: {
    primary: '#A7C7E7', // emerald-green
    secondary: '#50C878', // pure-sky
    accent: '#8D6E63', // sacred-earth
    bg: '#F5F5F5', // incense-smoke
    text: '#2C3E50', // deep-text
    selectionBg: '#A7C7E7',
    selectionText: '#ffffff',
  },
  decorations: [
    { emoji: '🪁', animation: 'bounce', position: { left: '-3rem', top: '0' } },
    { emoji: '🌿', animation: 'pulse', position: { right: '-3rem', top: '-1rem' } },
    { emoji: '✨', animation: 'pulse', position: { right: '10%', top: '20%' } },
  ],
  sections: [
    {
      id: 'y-nghia',
      title: '1. Ý Nghĩa và Đặc Điểm: Sự Tinh Khôi Của Đất Trời',
      content: `Trong chuỗi ngọc 24 tiết khí, Thanh Minh (清明) là viên ngọc sáng trong nhất. Không còn cái ẩm ướt của Vũ Thủy, không còn tiếng sấm rền của Kinh Trập, Thanh Minh mang đến một không gian tĩnh tại, sáng sủa và tràn đầy sinh khí. Tiết khí này thường bắt đầu vào khoảng ngày 4 hoặc 5 tháng 4 Dương lịch, khi Mặt Trời đi qua kinh độ 15°.

### Giải Nghĩa Tên Gọi
"Thanh" (清) nghĩa là trong trẻo, tinh khiết; "Minh" (明) nghĩa là sáng sủa, quang minh. Thanh Minh hàm ý chỉ thời điểm bầu trời trở nên quang đãng, không khí trong lành, cây cỏ tốt tươi.

### Sự Chuyển Mình Của Thiên Nhiên
Lúc này, gió Đông Nam bắt đầu thổi mạnh, xua tan những đám mây xám xịt còn sót lại của mùa xuân. Nhiệt độ ấm lên rõ rệt, lượng mưa tăng dần nhưng là những cơn mưa rào nhanh đến nhanh đi, để lại bầu trời xanh ngắt.

Cổ nhân quan sát thấy ba hiện tượng (tam hậu) đặc trưng:
1. **Đồng thủy hoa (Cây ngô đồng nở hoa):** Màu hoa trắng hoặc tím nhạt của cây ngô đồng báo hiệu mùa xuân đã đi vào độ chín.
2. **Điền thử hóa vi an (Chuột đồng hóa chim cút):** Đây là quan niệm dân gian, cho rằng chuột ưa bóng tối (âm) biến mất, nhường chỗ cho chim cút (dương) xuất hiện, ý nói dương khí đã thịnh.
3. **Hồng thủy kiến (Cầu vồng xuất hiện):** Sau những cơn mưa rào, ánh nắng rực rỡ tạo nên cầu vồng, biểu tượng của sự giao hòa tươi đẹp giữa trời và đất.`,
    },
    {
      id: 'doi-song',
      title: '2. Ảnh Hưởng Đến Đời Sống: Giao Cảm Giữa Người Và Đất',
      content: `### Phong Tục: Tảo Mộ Đạp Thanh
Câu thơ của Nguyễn Du đã trở thành kinh điển: *"Thanh Minh trong tiết tháng Ba / Lễ là tảo mộ hội là đạp thanh"*.

- **Lễ Tảo Mộ:** Đây là phong tục quan trọng nhất. Con cháu tìm về phần mộ tổ tiên để dọn dẹp cỏ dại, đắp lại nấm đất, thắp nén hương thơm. Đó không chỉ là sự tu sửa về vật chất mà còn là sự kết nối tâm linh, nhắc nhở về đạo lý "Uống nước nhớ nguồn".
- **Hội Đạp Thanh:** Nghĩa là dẫm lên cỏ xanh. Sau những ngày đông lạnh giá, đây là lúc mọi người du xuân, đi dạo trên những thảm cỏ xanh mướt để hòa mình vào sinh khí của đất trời.
- **Thả Diều:** Người xưa tin rằng thả diều trong ngày Thanh Minh giúp xả bỏ bệnh tật, xui xẻo bay theo gió lên trời cao.

### Nông Nghiệp: Trồng Dưa Trỉa Đậu
Tiết trời ấm áp, độ ẩm vừa phải là điều kiện vàng cho cây trồng phát triển. Ngạn ngữ có câu: *"Thanh Minh xuống mạ, Cốc Vũ trồng bông"*. Nông dân tranh thủ thời tiết tốt để gieo trồng các loại hoa màu vụ Nam, đặc biệt là các loại dưa và đậu.`,
    },
    {
      id: 'duong-sinh',
      title: '3. Lời Khuyên Dưỡng Sinh: Điều Hòa Can Khí',
      content: `Thanh Minh là lúc gan (Tạng Can) hoạt động mạnh mẽ nhất (Can khí vượng). Nếu không biết cách điều dưỡng, dễ sinh ra các chứng bệnh như cao huyết áp, chóng mặt, hay cáu gắt.

### Ẩm Thực: "Thanh Đạm" Là Thượng Sách
- **Nguyên tắc:** Giảm bớt đồ bổ béo, cay nóng để tránh làm Can hỏa bốc lên. Ưu tiên thực phẩm thanh đạm, mát gan.
- **Nên dùng:** Các loại rau củ mùa xuân như rau chân vịt (cải bó xôi), ngải cứu,荠菜 (rau tề thái), măng tre. Trà hoa cúc hoặc trà kỷ tử cũng rất tốt để làm sáng mắt, mát gan.
- **Hạn chế:** Tôm, cua, măng (với người đau dạ dày) và các thực phẩm dễ gây dị ứng, vì mùa này phấn hoa nhiều, cơ thể nhạy cảm.

### Sinh Hoạt: Hòa Mình Với Thiên Nhiên
- Hãy ra ngoài nhiều hơn. Việc đi bộ, hít thở không khí trong lành trong tiết Thanh Minh giúp cơ thể thải trừ trược khí (khí xấu) tích tụ trong mùa đông và nạp vào thanh khí (khí sạch).
- Tránh tâm trạng u uất. Dù tảo mộ gợi nhớ người đã khuất, nhưng hãy biến nỗi buồn thành lòng biết ơn nhẹ nhàng, giữ tâm hồn khoáng đạt để khí huyết lưu thông.`,
    },
    {
      id: 'chiem-nghiem',
      title: '4. Tâm Tư và Chiêm Nghiệm: Sự Sống Và Cái Chết',
      content: `Thanh Minh mang đến cho ta một bài học triết lý sâu sắc về **Sự Tiếp Nối**.

Tại sao trong tiết trời tươi đẹp nhất của sự sống, ta lại đi thăm viếng người đã khuất? Đó là để nhắc nhở rằng: Sự sống và cái chết không phải là hai thái cực đối lập, mà là một vòng luân hồi. Cây cỏ xanh tươi mọc lên từ đất, cũng như thế hệ con cháu trưởng thành nhờ phúc đức của tổ tiên.

"Thanh Minh" không chỉ là trời trong, mà còn là **Tâm Trong**. Đứng trước nấm mồ của người xưa, giữa đất trời bao là, con người chợt nhận ra sự nhỏ bé và ngắn ngủi của kiếp người. Từ đó mà biết buông bỏ những tranh đoạt vô nghĩa, gột rửa những vẩn đục trong lòng, để tâm hồn trở nên "Thanh" và "Minh" như bầu trời tháng Ba.

Hãy trân trọng hiện tại, sống hiếu nghĩa và chân thành. Bởi lẽ, sự tưởng nhớ đẹp nhất đối với người đã khuất chính là việc người đang sống biết sống một cuộc đời tử tế và hạnh phúc.

Nguyện chúc quý vị một mùa Thanh Minh: Tâm sáng như gương, Lòng an như đất.

*Biên soạn bởi Tịch Phong Thiên Sơn - 夕风天山*`,
    },
  ],
}
