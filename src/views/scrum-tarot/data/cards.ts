export interface TarotCard {
  id: string
  name: string
  arcana: string
  icon: string
  uprightMeaning: string
  reversedMeaning: string
  color: string
}

export const tarotCards: TarotCard[] = [
  {
    id: 'the-fool',
    name: 'GÃ THỰC TẬP SINH',
    arcana: 'The Fool',
    icon: '🐣',
    uprightMeaning:
      'Khởi đầu một module mới bằng framework vừa ra mắt hôm qua. Đầy dũng cảm nhưng sớm sẽ sml vì đéo có docs trên mạng.',
    reversedMeaning:
      'Làm hỏng DB Staging vì chạy Migration sai thư mục. Bị chửi sấp mặt nhưng vẫn cười trừ bí ẩn.',
    color: 'text-[#61DAFB]',
  },
  {
    id: 'the-magician',
    name: 'KẺ LẮP RÁP CODE',
    arcana: 'The Magician',
    icon: '🔮',
    uprightMeaning:
      'Phép màu copy-paste: Lấy code của một thằng Ả Rập năm 2011 trên forum bỏ vào và bỗng nhiên app chạy mà không ai hiểu vì sao.',
    reversedMeaning:
      'Code thì chạy, nhưng lúc hỏi giải thích luồng data thế nào thì gãi đầu: "Github Copilot nó tự viết anh ạ".',
    color: 'text-accent-coral',
  },
  {
    id: 'the-high-priestess',
    name: 'BÀ CHÚA TÀI LIỆU',
    arcana: 'The High Priestess',
    icon: '📜',
    uprightMeaning:
      'Trực giác mách bảo luồng Logic lỗi chỗ nào, lật lại đống Docs cũ 2 năm trước và tìm ra nguyên nhân cội nguồn.',
    reversedMeaning:
      'Bí ẩn tuyệt đối: Specs BA viết một đằng, KH nghiệm thu một nẻo, còn Dev thì code một nẻo khác. Tài liệu chỉ là trò lừa phỉnh.',
    color: 'text-accent-amber',
  },
  {
    id: 'the-empress',
    name: 'NỮ HOÀNG KẾ TOÁN',
    arcana: 'The Empress',
    icon: '💰',
    uprightMeaning:
      'Tháng này dự án mang lại lợi nhuận khủng. Ngân sách team rủng rỉnh, đi ăn nhậu ngập mặt cuối Sprint.',
    reversedMeaning:
      'Cắt giảm chi phí: Cắt luôn tài khoản AWS xịn mượt để chuyển về cái VPS giá rẻ chạy chậm như rùa bò.',
    color: 'text-emerald-400',
  },
  {
    id: 'the-emperor',
    name: 'Ô TRÙM DỰ ÁN',
    arcana: 'The Emperor',
    icon: '👑',
    uprightMeaning:
      'Một Leader thiết lập kỷ luật thép. Sprint chạy đúng lộ trình, Task chia đúng người, không có chuyện làm ngoài luồng.',
    reversedMeaning:
      'Độc tài Micromanagement: Đứng sau lưng nhìn bạn gõ từng dòng code, chửi vì sao không comment từng vòng lặp for.',
    color: 'text-red-500',
  },
  {
    id: 'the-hierophant',
    name: 'TỔNG TƯ LỆNH ARCHITECT',
    arcana: 'The Hierophant',
    icon: '🏛️',
    uprightMeaning:
      'Xây dựng một Design Pattern vững chắc từ đầu. Dù Dev mới vào có ngu đến rụng rốn cũng không phá nổi cấu trúc.',
    reversedMeaning:
      'Tham vọng lố bịch: Áp dụng Microservices với Kubernetes cho cái app Todo List 100 User truy cập.',
    color: 'text-blue-400',
  },
  {
    id: 'the-lovers',
    name: 'TÌNH NHÂN PAIR-PROGRAMMING',
    arcana: 'The Lovers',
    icon: '💖',
    uprightMeaning:
      'Hai bộ não vĩ đại hòa làm một. Bắt Bug trong nháy mắt, code nhanh x2, thấu hiểu nhau từng cái gõ phím.',
    reversedMeaning:
      'Xung đột đẫm máu: Thằng thì bảo dùng React, thằng thích Vue. Đấu khẩu trên Slack đến mức PM phải can.',
    color: 'text-pink-500',
  },
  {
    id: 'the-chariot',
    name: 'CUỘC ĐUA NƯỚC RÚT',
    arcana: 'The Chariot',
    icon: '🏎️',
    uprightMeaning:
      'Trạng thái Flow 100%. Gõ phím như gõ piano, càn quét 5 story points bự chỉ trong một buổi chiều.',
    reversedMeaning:
      'Lạc tay lái: Khách hàng đổi Requirement vào thứ 5, đâm sầm toàn bộ thiết kế, phải OT cày cuốc ngày cuối Sprint.',
    color: 'text-orange-400',
  },
  {
    id: 'strength',
    name: 'SỨC MẠNH OVERTIME',
    arcana: 'Strength',
    icon: '💪',
    uprightMeaning:
      'Uống 3 lon Bò Húc và cày qua đêm nhưng sáng hôm sau vẫn code như một cái máy chém khỏe khoắn.',
    reversedMeaning:
      'Kiệt quệ sinh lực: Code thì sai mà mắt thì mờ. Viết bug đè lên bug, cuối cùng đành xin đi ngủ nợ.',
    color: 'text-[#FF9900]',
  },
  {
    id: 'the-hermit',
    name: 'KẺ LƯU ĐÀY WFH',
    arcana: 'The Hermit',
    icon: '🧙',
    uprightMeaning:
      'Cô lập bản thân, ẩn mình qua màn hình tắt cam lúc Daily, chỉ sống về đêm và tự cày code lúc 2 giờ sáng giống Batman.',
    reversedMeaning:
      'Lạc lối trong bóng tối, cắm đầu code liên tục 5 ngày rồi phát hiện làm sai mẹ yêu cầu Story... chỉ vì lười chat hỏi lại PM.',
    color: 'text-[#8993BE]',
  },
  {
    id: 'wheel-of-fortune',
    name: 'BÁNH XE ON-CALL',
    arcana: 'Wheel of Fortune',
    icon: '🎡',
    uprightMeaning:
      'Vòng lặp không hồi kết. Cuối tuần của bạn đi chơi gấu hay ôm Laptop phụ thuộc vào một con xúc xắc xem bug có lòi ra không.',
    reversedMeaning:
      'Đến phiên trực nhưng đi nhậu xỉn, chuông Slack reo 50 lần mới tỉnh, lúc đó CEO đã nhắn tin riêng phàn nàn.',
    color: 'text-[#00ADD8]',
  },
  {
    id: 'justice',
    name: 'CÁN CÂN QA',
    arcana: 'Justice',
    icon: '⚖️',
    uprightMeaning:
      'Tìm ra một lỗi chí mạng ngay góc khuất nhất của UI, đập tan lòng tự hào hảo huyền của đội ngũ Dev bằng một cái video bằng chứng rành rành.',
    reversedMeaning:
      'Thẩm phán bất công: QA tạo bug vì những Test Case người ngoài hành tinh. Bao nhiêu người dùng thực tế sẽ... bấm phím cách 500 lần vào input password?',
    color: 'text-[#DC382D]',
  },
  {
    id: 'the-hanged-man',
    name: 'KÊU GÀO BỊ TREO',
    arcana: 'The Hanged Man',
    icon: '🪢',
    uprightMeaning:
      'Pull Request với 68 file thay đổi, bị treo ở trạng thái "Review Requested" 3 tuần mà không một Tech Lead nào dám bấm vào.',
    reversedMeaning:
      'Thèm Approve quá độ đành hy sinh nhân phẩm năn nỉ quỳ lạy các thành viên team khác thả tym LGTM cho kịp release cuối Sprint.',
    color: 'text-green-500',
  },
  {
    id: 'death',
    name: 'TỬ THẦN REFACTOR',
    arcana: 'Death',
    icon: '💀',
    uprightMeaning:
      'Sự kết thúc của Legacy Code. Team quyết định xoá toàn bộ và viết lại từ con số 0. Một chu kỳ đau khổ mới bắt đầu.',
    reversedMeaning:
      'Cố đấm ăn xôi đắp vá một đống code đã ung thư giai đoạn cuối. Kẻ nào maintain dự án này tiếp theo chắc chắn sẽ phải từ chức.',
    color: 'text-gray-400',
  },
  {
    id: 'temperance',
    name: 'KHÁCH HÀNG THẤT THƯỜNG',
    arcana: 'Temperance',
    icon: '🎭',
    uprightMeaning:
      'Cân bằng giữa các bên: Mặc dù KH đòi cái nút bay lượn màu mè, bạn vẫn deal thành công một cái nút đơn giản nhưng hiệu quả.',
    reversedMeaning:
      'Thiếu kiềm chế: Sáng muốn chức năng A, chiều đòi đổi lại y hệt bản nháp tuần trước. Khách hàng xé nát tính kiên nhẫn của Dev.',
    color: 'text-[#339933]',
  },
  {
    id: 'the-devil',
    name: 'KẺ ĐÒI NỢ KỸ THUẬT',
    arcana: 'The Devil',
    icon: '😈',
    uprightMeaning:
      'Mắc kẹt trong mớ ma trận Spaghetti code, bị trói buộc vào một architecture thối nát không dám đập đi xây lại vì sợ sập.',
    reversedMeaning:
      'Bỏ qua warning của IDE, tắt mẹ Linter, thêm dấu ! và // ts-ignore ở mọi biến để qua cửa ải deadline ma quỷ.',
    color: 'text-red-600',
  },
  {
    id: 'the-tower',
    name: 'THÁP SỤP ĐỔ',
    arcana: 'The Tower',
    icon: '⛈️',
    uprightMeaning:
      'Cúp điện Data Center, đứt cáp quang biển, AWS Outage. Toàn thể công ty gọi điện thoại cho On-call lúc 3h sáng.',
    reversedMeaning:
      'Thảm họa âm ỉ: Memory leak khiến app cứ 3 ngày sập 1 lần và giải pháp duy nhất là hẹn giờ "restart PM2".',
    color: 'text-purple-500',
  },
  {
    id: 'the-star',
    name: 'NGÔI SAO HY VỌNG',
    arcana: 'The Star',
    icon: '⭐',
    uprightMeaning:
      'Tìm thấy một Library mã nguồn mở trên Github giải quyết đúng y bon cái bài toán tốn 3 tuần suy nghĩ. 5 Star không nói nhiều.',
    reversedMeaning:
      'Thất vọng thảm sao: Lib được hứa hẹn như phép màu nhưng cài vào Conflict một rổ lỗi, Issue bị tác giả ngỏ lơ từ năm 2019.',
    color: 'text-yellow-200',
  },
  {
    id: 'the-moon',
    name: 'BÓNG ĐÊM BUG ẨN',
    arcana: 'The Moon',
    icon: '🌝',
    uprightMeaning:
      'Ảo giác trên giao diện: Chạy ngon ở local, nhưng lên Prod thỉnh thoảng CSS bị loạn 1 pixel làm các Dev trằn trọc mất ngủ.',
    reversedMeaning:
      'Kinh dị lúc nửa đêm: Bug lặn lúc sếp test, nhưng hễ lúc show Demo trực tiếp với hội đồng quản trị thì lù lù xuất hiện.',
    color: 'text-stone-300',
  },
  {
    id: 'the-sun',
    name: 'MẶT TRỜI HƯ DANH',
    arcana: 'The Sun',
    icon: '🌞',
    uprightMeaning:
      'Trình diễn Demo rực rỡ và lóa mắt Khách hàng. Code chạy ổn định mượt mà... vì môi trường Local của máy bạn là một hệ sinh thái thần tiên.',
    reversedMeaning:
      'Nắng gắt bỏng da: Đưa lên Staging cháy khét lẹt. DevOps tế sống bạn vì hardcode IP Database và thiếu biến môi trường trầm trọng.',
    color: 'text-yellow-400',
  },
  {
    id: 'the-judgement',
    name: 'PHIÊN TÒA CODE REVIEW',
    arcana: 'Judgement',
    icon: '⚖️',
    uprightMeaning:
      'Ánh sáng của Senior chiếu rọi vào PR. Soi từng cái dấu cách thư mục, ép áp dụng SOLID Pattern, không chừa đường sống.',
    reversedMeaning:
      'Ngụy biện, cãi chày cãi cối trên dòng comment github, cuối cùng buông xuôi bằng câu ma thuật: "Anh cứ merge đi thứ 2 em fix tiếp".',
    color: 'text-[#FF9900]',
  },
  {
    id: 'the-world',
    name: 'SỰ GIẢI THOÁT',
    arcana: 'The World',
    icon: '🌍',
    uprightMeaning:
      'Project Complete! Thanh toán hợp đồng, nhận bonus cuối năm, một cái kết viên mãn để bạn đi xõa ở Châu Âu.',
    reversedMeaning:
      'Treo trên cổ: App lởm nhưng khách hàng cứ đòi maintain thêm chức năng nhỏ hoài, không dứt điểm được để nhận đợt thanh toán cuối.',
    color: 'text-green-300',
  },
]
