export interface Answer {
  text: string
  score: number
}

export interface Question {
  id: number
  text: string
  category: string
  answers: Answer[]
  isEnd?: boolean
}

export interface ResultRange {
  min: number
  max: number
  label: string
  emoji: string
  description: string
  color: string
}

export const questions: Question[] = [
  // --- CẢM XÚC KHI ĐI LÀM ---
  {
    id: 1,
    category: 'Cảm xúc',
    text: 'Bạn cảm thấy thế nào vào tối Chủ nhật?',
    answers: [
      { text: 'Háo hức cho tuần mới 🎉', score: 0 },
      { text: 'Bình thường, không nghĩ gì nhiều', score: 1 },
      { text: 'Hơi lo lắng, uống trà thở dài', score: 2 },
      { text: 'Đang Google "cách nghỉ việc lịch sự nhất" 🔍', score: 4 },
    ],
  },
  {
    id: 2,
    category: 'Cảm xúc',
    text: 'Khi chuông báo thức buổi sáng đổ, phản ứng đầu tiên của bạn là?',
    answers: [
      { text: 'Bật dậy ngay, hôm nay có deadline hay ho lắm 💪', score: 0 },
      { text: 'Nhấn snooze một lần rồi dậy', score: 1 },
      { text: 'Nhấn snooze 5 lần và nguyền rủa bản thân', score: 2 },
      { text: 'Nằm đó tính xem có thể ốm giả được không', score: 4 },
    ],
  },
  {
    id: 3,
    category: 'Cảm xúc',
    text: 'Khi nghĩ đến công việc, từ đầu tiên xuất hiện trong đầu bạn là?',
    answers: [
      { text: '"Ý nghĩa" / "Đam mê"', score: 0 },
      { text: '"Lương" / "Ổn định"', score: 1 },
      { text: '"Mệt" / "Stress"', score: 2 },
      { text: '"Thoát" / "Cứu tôi với" / một loạt emoji 💀', score: 4 },
    ],
  },
  {
    id: 4,
    category: 'Cảm xúc',
    text: 'Bạn thường trông đợi điều gì nhất trong ngày làm việc?',
    answers: [
      { text: 'Giải quyết được bài toán khó, cảm giác thỏa mãn', score: 0 },
      { text: 'Buổi trưa ăn gì ngon một chút', score: 1 },
      { text: 'Đồng hồ chỉ 5 giờ chiều', score: 2 },
      { text: 'Hết ngày để về nhà nằm không suy nghĩ về ngày mai', score: 4 },
    ],
  },
  {
    id: 5,
    category: 'Cảm xúc',
    text: 'Khi nhận email/tin nhắn từ công ty vào buổi tối, bạn cảm thấy?',
    answers: [
      { text: 'Tò mò, có khi là tin hay ho', score: 0 },
      { text: 'Bình thường, nhìn qua rồi để sáng xử lý', score: 1 },
      { text: 'Khó chịu nhưng vẫn mở ra đọc', score: 2 },
      { text: 'Tim đập nhanh, mồ hôi tay, và hối hận vì đã không tắt thông báo', score: 4 },
    ],
  },
  // --- MỐI QUAN HỆ VỚI SẾP ---
  {
    id: 6,
    category: 'Sếp',
    text: 'Khi sếp gọi tên bạn trong cuộc họp, cảm giác đầu tiên của bạn là?',
    answers: [
      { text: 'Tự hào, sếp hay khen mình lắm', score: 0 },
      { text: 'Bình thường, chắc giao việc gì đó', score: 1 },
      { text: 'Lo lắng, mình có làm gì sai không nhỉ', score: 2 },
      { text: 'Hoảng loạn nội tâm và replay lại mọi việc tuần qua', score: 4 },
    ],
  },
  {
    id: 7,
    category: 'Sếp',
    text: 'Bạn mô tả phong cách quản lý của sếp như thế nào?',
    answers: [
      { text: 'Mentor tuyệt vời, học được nhiều thứ', score: 0 },
      { text: 'Okay, không tệ không xuất sắc', score: 1 },
      { text: 'Micromanage mọi thứ đến mức ngạt thở', score: 2 },
      { text: 'Nhân vật phản diện trong bộ phim về công sở của tôi', score: 4 },
    ],
  },
  {
    id: 8,
    category: 'Sếp',
    text: 'Khi sếp đưa ra quyết định mà bạn không đồng ý, bạn thường?',
    answers: [
      { text: 'Góp ý thẳng thắn và sếp lắng nghe', score: 0 },
      { text: 'Im lặng chấp nhận, dù không thích lắm', score: 1 },
      { text: 'Vent với đồng nghiệp sau khi họp xong', score: 2 },
      { text: 'Update CV ngay trong giờ làm', score: 4 },
    ],
  },
  {
    id: 9,
    category: 'Sếp',
    text: 'Sếp có ghi nhận công sức của bạn không?',
    answers: [
      { text: 'Luôn luôn, sếp rất biết ơn team', score: 0 },
      { text: 'Thỉnh thoảng, khi kết quả tốt', score: 1 },
      { text: 'Hiếm khi, công lao bị người khác nhận hết', score: 2 },
      { text: 'Không, nhưng sếp rất nhanh nhẹn khi cần đổ lỗi', score: 4 },
    ],
  },
  {
    id: 10,
    category: 'Sếp',
    text: 'Nếu gặp sếp ngoài đường, bạn sẽ làm gì?',
    answers: [
      { text: 'Chạy đến chào, thậm chí mời cà phê', score: 0 },
      { text: 'Chào xã giao bình thường', score: 1 },
      { text: 'Gật đầu rồi đi nhanh', score: 2 },
      { text: 'Đổi hướng đi, trốn vào tiệm gần nhất', score: 4 },
    ],
  },
  // --- ĐỒNG NGHIỆP ---
  {
    id: 11,
    category: 'Đồng nghiệp',
    text: 'Bạn cảm thấy thế nào về môi trường làm việc với đồng nghiệp?',
    answers: [
      { text: 'Như gia đình thứ hai, thân thiết lắm', score: 0 },
      { text: 'Lịch sự chuyên nghiệp, đủ để làm việc tốt', score: 1 },
      { text: 'Có vài người khó chịu nhưng chịu được', score: 2 },
      { text: 'Drama nhiều hơn phim Hàn, mệt mỏi hơn cả làm việc', score: 4 },
    ],
  },
  {
    id: 12,
    category: 'Đồng nghiệp',
    text: 'Khi bạn chia sẻ ý tưởng trong team, phản ứng thường là?',
    answers: [
      { text: 'Được đón nhận và triển khai ngay', score: 0 },
      { text: 'Thảo luận qua lại, đôi khi được dùng', score: 1 },
      { text: 'Im lặng khó hiểu rồi sang chủ đề khác', score: 2 },
      { text: 'Bị phớt lờ, nhưng 2 tuần sau có người trình bày lại y chang', score: 4 },
    ],
  },
  {
    id: 13,
    category: 'Đồng nghiệp',
    text: 'Bạn có bạn bè thật sự trong công ty không?',
    answers: [
      { text: 'Có vài người thân thiết, ra ngoài cũng chơi cùng nhau', score: 0 },
      { text: 'Có quen biết, nhưng chủ yếu chuyện công việc', score: 1 },
      { text: 'Không thật sự, ai cũng lo phần mình', score: 2 },
      { text: 'Không, và tôi đang cố tránh mặt hết', score: 4 },
    ],
  },
  {
    id: 14,
    category: 'Đồng nghiệp',
    text: 'Trong nhóm chat công ty, bạn thường làm gì?',
    answers: [
      { text: 'Tích cực trao đổi, đề xuất liên tục', score: 0 },
      { text: 'Reply khi cần thiết', score: 1 },
      { text: 'Read-only, xem thôi không nhắn', score: 2 },
      { text: 'Mute hết, chỉ mở ra khi sếp tag tên', score: 4 },
    ],
  },
  // --- LƯƠNG & ĐÃI NGỘ ---
  {
    id: 15,
    category: 'Lương',
    text: 'Bạn cảm thấy thế nào về mức lương hiện tại?',
    answers: [
      { text: 'Xứng đáng với công sức và thị trường', score: 0 },
      { text: 'Tạm ổn, dù có thể tốt hơn', score: 1 },
      { text: 'Thấp hơn thị trường nhưng lười tìm việc mới', score: 2 },
      { text: 'Tôi đang trả tiền để đi làm theo nghĩa bóng', score: 4 },
    ],
  },
  {
    id: 16,
    category: 'Lương',
    text: 'Lần cuối bạn được tăng lương là khi nào?',
    answers: [
      { text: 'Gần đây, được tăng đúng kỳ và xứng đáng', score: 0 },
      { text: 'Khoảng 1 năm trước', score: 1 },
      { text: 'Hơn 2 năm, mỗi lần review chỉ nghe hứa hẹn', score: 2 },
      { text: 'Không nhớ nổi, có lẽ từ hồi khủng long còn tồn tại', score: 4 },
    ],
  },
  {
    id: 17,
    category: 'Lương',
    text: 'Khi biết đồng nghiệp mới được trả cao hơn bạn dù kinh nghiệm ít hơn?',
    answers: [
      { text: 'Không biết và cũng không quan tâm', score: 0 },
      { text: 'Hơi khó chịu nhưng chấp nhận được', score: 2 },
      { text: 'Rất tức, nhưng không làm gì', score: 3 },
      { text: 'Gửi email xin gặp HR ngay lập tức và update LinkedIn', score: 4 },
    ],
  },
  {
    id: 18,
    category: 'Lương',
    text: 'Nếu không cần tiền, bạn có tiếp tục làm công việc này không?',
    answers: [
      { text: 'Có, vì tôi thật sự yêu thích nó', score: 0 },
      { text: 'Có thể, vì nó khá thú vị', score: 1 },
      { text: 'Không chắc, cần suy nghĩ thêm', score: 2 },
      { text: 'Absolutely not. Tôi đang làm chỉ vì tiền mà còn không đủ tiền', score: 4 },
    ],
  },
  // --- CƠ HỘI PHÁT TRIỂN ---
  {
    id: 19,
    category: 'Phát triển',
    text: 'Bạn học được gì mới trong 6 tháng qua từ công việc?',
    answers: [
      { text: 'Rất nhiều, công ty đầu tư vào đào tạo tích cực', score: 0 },
      { text: 'Một vài thứ nho nhỏ', score: 1 },
      { text: 'Không nhiều, công việc lặp đi lặp lại', score: 2 },
      { text: 'Chỉ học được cách chịu đựng và pha cà phê thật đặc', score: 4 },
    ],
  },
  {
    id: 20,
    category: 'Phát triển',
    text: 'Con đường thăng tiến tại công ty của bạn trông như thế nào?',
    answers: [
      { text: 'Rõ ràng, có lộ trình cụ thể cho từng vị trí', score: 0 },
      { text: 'Mờ nhạt nhưng vẫn có thể nhìn thấy', score: 1 },
      { text: 'Như đi trong sương mù không đèn', score: 2 },
      { text: 'Không tồn tại, trừ khi tôi kết hôn với con sếp', score: 4 },
    ],
  },
  {
    id: 21,
    category: 'Phát triển',
    text: 'Sau 3–5 năm nữa, bạn hình dung mình sẽ ở đâu?',
    answers: [
      { text: 'Tại đây, với vị trí cao hơn và dự án lớn hơn', score: 0 },
      { text: 'Chưa chắc, nhưng vẫn xem xét nơi này', score: 1 },
      { text: 'Chỗ khác, nhưng chưa biết đi đâu', score: 2 },
      { text: 'Bất cứ đâu ngoài đây, kể cả làm nông nghiệp', score: 4 },
    ],
  },
  {
    id: 22,
    category: 'Phát triển',
    text: 'Công việc hiện tại có liên quan đến mục tiêu nghề nghiệp dài hạn của bạn không?',
    answers: [
      { text: 'Rất liên quan, đây là bước đệm hoàn hảo', score: 0 },
      { text: 'Hơi liên quan, chấp nhận được', score: 1 },
      { text: 'Ít liên quan, nhưng vẫn có kỹ năng chuyển đổi', score: 2 },
      { text: 'Hoàn toàn không, tôi không biết mình đang làm gì ở đây', score: 4 },
    ],
  },
  // --- STRESS / BURNOUT ---
  {
    id: 23,
    category: 'Stress',
    text: 'Mức độ stress trung bình trong tuần làm việc của bạn là?',
    answers: [
      { text: 'Thấp, phần lớn thời gian tôi cảm thấy bình tĩnh', score: 0 },
      { text: 'Trung bình, đôi khi căng nhưng ổn', score: 1 },
      { text: 'Cao, thường xuyên cảm thấy bị áp lực', score: 2 },
      { text: 'Tôi quên cảm giác "không stress" là gì rồi', score: 4 },
    ],
  },
  {
    id: 24,
    category: 'Stress',
    text: 'Bạn có thường xuyên mang việc về nhà (tâm trí hoặc thực tế) không?',
    answers: [
      { text: 'Không, tôi tắt hẳn khi rời văn phòng', score: 0 },
      { text: 'Thỉnh thoảng khi deadline gần', score: 1 },
      { text: 'Thường xuyên, khó tắt não được', score: 2 },
      { text: 'Tôi không còn nhớ cuối tuần cảm giác như thế nào nữa', score: 4 },
    ],
  },
  {
    id: 25,
    category: 'Stress',
    text: 'Sức khỏe của bạn kể từ khi làm công việc này?',
    answers: [
      { text: 'Tốt hơn, tôi có thời gian tập thể thao và ngủ đủ giấc', score: 0 },
      { text: 'Không thay đổi nhiều', score: 1 },
      { text: 'Kém hơn một chút, ít ngủ, hay đau đầu', score: 2 },
      { text: 'Bác sĩ hỏi tôi đang làm nghề gì với giọng lo lắng', score: 4 },
    ],
  },
  {
    id: 26,
    category: 'Stress',
    text: 'Bạn có cảm thấy kiệt sức (burnout) không?',
    answers: [
      { text: 'Không, tôi vẫn còn nhiều năng lượng', score: 0 },
      { text: 'Đôi khi mệt nhưng sau nghỉ ngơi lại ổn', score: 1 },
      { text: 'Thường xuyên cảm thấy trống rỗng và thiếu động lực', score: 2 },
      { text: 'Tôi đã burnout từ quý trước, đang chạy bằng caffeine và spite', score: 4 },
    ],
  },
  {
    id: 27,
    category: 'Stress',
    text: 'Bạn có bao giờ mơ về công việc không?',
    answers: [
      { text: 'Không bao giờ, ngủ là để nghỉ ngơi', score: 0 },
      { text: 'Hiếm khi, chỉ lúc deadline lớn', score: 1 },
      { text: 'Thỉnh thoảng, hơi phiền', score: 2 },
      { text: 'Hàng đêm, và không phải giấc mơ đẹp', score: 4 },
    ],
  },
  // --- WORK-LIFE BALANCE ---
  {
    id: 28,
    category: 'Work-Life Balance',
    text: 'Bạn có đủ thời gian cho bản thân và gia đình không?',
    answers: [
      { text: 'Có, tôi có ranh giới rõ ràng', score: 0 },
      { text: 'Tạm đủ, đôi khi phải hy sinh một chút', score: 1 },
      { text: 'Không đủ, nhưng đang cố thích nghi', score: 2 },
      { text: 'Gia đình tôi đã lập group chat riêng không có tôi vì "em bận quá"', score: 4 },
    ],
  },
  {
    id: 29,
    category: 'Work-Life Balance',
    text: 'Trong kỳ nghỉ phép, bạn thường làm gì?',
    answers: [
      { text: 'Nghỉ hẳn, không check email', score: 0 },
      { text: 'Nghỉ nhưng đôi khi check nhanh', score: 1 },
      { text: 'Nửa nghỉ nửa làm, không yên tâm được', score: 2 },
      { text: 'Gần như không nghỉ được vì không ai đủ khả năng cover', score: 4 },
    ],
  },
  {
    id: 30,
    category: 'Work-Life Balance',
    text: 'Số giờ làm thực tế mỗi tuần của bạn so với hợp đồng?',
    answers: [
      { text: 'Đúng hoặc ít hơn một chút', score: 0 },
      { text: 'Hơn khoảng 5–10 tiếng', score: 1 },
      { text: 'Hơn hơn 10–20 tiếng, không được tính thêm lương', score: 2 },
      { text: 'Tôi làm nhiều đến mức công ty nên trả tiền thuê nhà cho tôi', score: 4 },
    ],
  },
  {
    id: 31,
    category: 'Work-Life Balance',
    text: 'Sở thích cá nhân của bạn có bị công việc ảnh hưởng không?',
    answers: [
      { text: 'Không, tôi vẫn duy trì được', score: 0 },
      { text: 'Ít hơn trước nhưng vẫn có', score: 1 },
      { text: 'Gần như không còn thời gian cho sở thích', score: 2 },
      { text: 'Sở thích của tôi bây giờ là nằm im không nghĩ về công việc', score: 4 },
    ],
  },
  // --- TÌNH HUỐNG GIẢ ĐỊNH VUI NHỘN ---
  {
    id: 32,
    category: 'Giả định',
    text: 'Nếu bạn trúng xổ số 10 tỷ đồng hôm nay, bạn sẽ?',
    answers: [
      { text: 'Vẫn đi làm vì tôi thích công việc này', score: 0 },
      { text: 'Đàm phán để làm part-time', score: 1 },
      { text: 'Nghỉ 3 tháng rồi tính tiếp', score: 2 },
      { text: 'Gửi đơn từ chức bằng fax lúc nửa đêm', score: 4 },
    ],
  },
  {
    id: 33,
    category: 'Giả định',
    text: 'Nếu được chọn lại từ đầu, bạn có chọn công việc này không?',
    answers: [
      { text: 'Có, không ngần ngại', score: 0 },
      { text: 'Có, nhưng sẽ thương lượng điều kiện tốt hơn', score: 1 },
      { text: 'Có thể không, sẽ xem xét nhiều options hơn', score: 2 },
      { text: 'Không, tôi sẽ học coding và remote từ Đà Lạt', score: 4 },
    ],
  },
  {
    id: 34,
    category: 'Giả định',
    text: 'Nếu công ty đột ngột đóng cửa vào ngày mai, cảm xúc đầu tiên của bạn là?',
    answers: [
      { text: 'Sốc và buồn, đây là nơi tôi gắn bó', score: 0 },
      { text: 'Lo lắng về tài chính, nhưng sẽ tìm được chỗ khác', score: 1 },
      { text: 'Nhẹ nhõm một nửa, lo lắng một nửa', score: 2 },
      { text: 'Nhảy múa trong đầu trong khi mặt vẫn thể hiện buồn phù hợp', score: 4 },
    ],
  },
  {
    id: 35,
    category: 'Giả định',
    text: 'Nếu bạn phải giới thiệu công ty mình với bạn bè đang tìm việc?',
    answers: [
      { text: 'Giới thiệu nhiệt tình, đây là nơi tốt', score: 0 },
      { text: 'Giới thiệu nhưng kèm vài lưu ý thực tế', score: 1 },
      { text: 'Ngập ngừng, "ừ... tùy bạn muốn gì"', score: 2 },
      { text: 'Nói thẳng "đừng, hãy bảo vệ bản thân"', score: 4 },
    ],
  },
  {
    id: 36,
    category: 'Giả định',
    text: 'Nếu bạn viết review ẩn danh về công ty trên Glassdoor/Glints?',
    answers: [
      { text: '5 sao, viết bài dài ca ngợi thật lòng', score: 0 },
      { text: '3-4 sao, balanced pros & cons', score: 1 },
      { text: '2-3 sao, nhiều cons hơn pros', score: 2 },
      { text: '1 sao, nhưng lo bị lộ danh tính nên chưa đăng', score: 4 },
    ],
  },
  // --- ĐÁNH GIÁ TỔNG QUAN ---
  {
    id: 37,
    category: 'Tổng quan',
    text: 'Buổi sáng thứ Hai, bạn bước vào văn phòng/mở máy tính với cảm giác?',
    answers: [
      { text: 'Năng lượng tốt, sẵn sàng cho tuần mới', score: 0 },
      { text: 'Bình thường, routine như mọi tuần', score: 1 },
      { text: 'Nặng nề, cần mất 30 phút để vào guồng', score: 2 },
      { text: 'Như đang bị dẫn độ đến một nơi mình không muốn đến', score: 4 },
    ],
  },
  {
    id: 38,
    category: 'Tổng quan',
    text: 'Bạn có cảm thấy công việc của mình có ý nghĩa không?',
    answers: [
      { text: 'Rất có, tôi thấy rõ tác động tích cực mình tạo ra', score: 0 },
      { text: 'Một phần, đủ để tiếp tục', score: 1 },
      { text: 'Ít, phần lớn như làm cho xong', score: 2 },
      {
        text: 'Không, tôi đang đóng góp vào thứ tôi thậm chí không hiểu tại sao tồn tại',
        score: 4,
      },
    ],
  },
  {
    id: 39,
    category: 'Tổng quan',
    text: 'Trong các buổi ăn cơm gia đình, bạn hay nói gì về công việc?',
    answers: [
      { text: 'Kể chuyện thú vị, dự án mới, đồng nghiệp dễ thương', score: 0 },
      { text: 'Nói qua loa, không nhiều không ít', score: 1 },
      { text: 'Tránh chủ đề, không muốn nhắc đến', score: 2 },
      { text: 'Duy nhất câu mà gia đình nghe: "stress lắm"', score: 4 },
    ],
  },
  {
    id: 40,
    category: 'Tổng quan',
    text: 'Câu nào mô tả đúng nhất cảm xúc của bạn với công việc hiện tại?',
    answers: [
      { text: '"Tôi may mắn khi có công việc này"', score: 0 },
      { text: '"Công việc này ổn, nhưng không phải mơ ước"', score: 1 },
      { text: '"Tôi đang ở đây vì chưa biết phải làm gì khác"', score: 2 },
      { text: '"Tôi đang đếm ngược từng ngày"', score: 4 },
    ],
  },
  // --- BONUS ---
  {
    id: 41,
    category: 'Bonus',
    text: 'Khi nghe "team building", phản ứng của bạn là?',
    answers: [
      { text: 'Thích, là dịp gắn kết team', score: 0 },
      { text: 'Ổn, đi cho vui', score: 1 },
      { text: 'Gượng cười và hy vọng không có hoạt động kỳ dị', score: 2 },
      { text: 'Lên kế hoạch xin nghỉ phép đúng ngày đó', score: 4 },
    ],
  },
  {
    id: 42,
    category: 'Bonus',
    text: 'Câu nào bạn đã từng nói (hoặc nghĩ) trong năm qua?',
    answers: [
      { text: '"Tôi rất vui khi làm việc ở đây"', score: 0 },
      { text: '"Ừ, cũng được"', score: 1 },
      { text: '"Sao mình lại làm ở đây nhỉ"', score: 2 },
      { text: '"Không, mình không ổn. Mình chỉ đang tồn tại thôi"', score: 4 },
    ],
  },
  {
    id: 43,
    category: 'Bonus',
    text: 'Khi nghe đồng nghiệp thông báo nghỉ việc, bạn cảm thấy?',
    answers: [
      { text: 'Tiếc nuối, team mất đi một người giỏi', score: 0 },
      { text: 'Chúc mừng họ bình thường', score: 1 },
      { text: 'Ghen tị nhẹ', score: 2 },
      { text: 'Ghen tị nặng và hỏi ngay "chỗ đó tuyển không"', score: 4 },
    ],
  },
  {
    id: 44,
    category: 'Bonus',
    text: 'Hồ sơ LinkedIn của bạn đang ở trạng thái nào?',
    answers: [
      { text: 'Không update vì không cần', score: 0 },
      { text: 'Update định kỳ cho chuyên nghiệp', score: 1 },
      { text: 'Đã bật "Open to Work" nhưng chưa nói với ai', score: 3 },
      { text: 'Avatar mới, bio mới, đang kết nối với recruiter từng DM', score: 4 },
    ],
  },
  {
    id: 45,
    category: 'Bonus',
    text: 'Cuối cùng: linh cảm ruột của bạn nói gì?',
    answers: [
      { text: '"Ở lại, nơi này vẫn còn nhiều thứ để cho mày"', score: 0 },
      { text: '"Cứ ở nhưng để mắt xung quanh"', score: 1 },
      { text: '"Đã đến lúc rồi đấy, nhưng cần chuẩn bị thêm"', score: 2 },
      { text: '"BRO. RA ĐI. NGAY BÂY GIỜ."', score: 4 },
    ],
    isEnd: true,
  },
]

export const resultRanges: ResultRange[] = [
  {
    min: 0,
    max: 8,
    label: 'Bạn đang ổn!',
    emoji: '😎',
    description:
      'Công việc hiện tại có vẻ phù hợp với bạn. Tiếp tục phát huy và đừng quên nghỉ ngơi đầy đủ nhé.',
    color: 'text-accent-sky',
  },
  {
    min: 9,
    max: 22,
    label: 'Có gì đó không ổn…',
    emoji: '🤔',
    description:
      'Có một vài tín hiệu đáng chú ý. Có thể nên ngồi xuống và suy nghĩ nghiêm túc hơn về những gì bạn thật sự muốn.',
    color: 'text-accent-amber',
  },
  {
    min: 23,
    max: 40,
    label: 'Đã đến lúc suy nghĩ nghiêm túc',
    emoji: '😬',
    description:
      'Công việc này đang ảnh hưởng không tốt đến bạn. Hãy cân nhắc tìm kiếm cơ hội mới trước khi burnout hoàn toàn.',
    color: 'text-accent-coral',
  },
  {
    min: 41,
    max: 60,
    label: 'Rời đi thôi bạn ơi!',
    emoji: '🚪',
    description:
      'Điểm số của bạn nói lên tất cả. CV đâu rồi? Cập nhật ngay đi. Bạn xứng đáng được hơn thế này.',
    color: 'text-accent-coral',
  },
]

export const funnyMessages: string[] = [
  'Hệ thống đã phân tích xong. Kết luận: bạn cần uống thêm cà phê và cập nhật CV.',
  'Quiz đã hoàn thành. Luật sư của bạn sẽ liên hệ với HR trong 3–5 ngày làm việc.',
  'Chúc mừng! Bạn vừa hoàn thành bước đầu tiên trong hành trình tìm lại bản thân. Bước tiếp theo: mở tab Indeed.',
  'Kết quả này hoàn toàn khoa học. Độ chính xác 100%. Chúng tôi chịu trách nhiệm 0%.',
  'Bạn đã trả lời 15 câu hỏi về công việc. Đó cũng là 15 lý do để suy nghĩ lại.',
  'Nếu bạn không đồng ý với kết quả, hãy thử làm lại. Kết quả vẫn sẽ như vậy.',
  'Disclaimer: Quiz này không phải lời khuyên tài chính, pháp lý, hay nghề nghiệp. Đây chỉ là gương phản chiếu.',
  'Bạn vừa dành 5 phút làm quiz thay vì làm việc. Điều đó tự nó đã nói lên nhiều thứ rồi.',
  'HR phòng bạn sẽ không bao giờ thấy kết quả này. Hoặc là vậy. Chúng tôi không chắc.',
  'Dữ liệu đã được gửi đến thuật toán AI tiên tiến nhất. Thuật toán đó nói: "bro, nghỉ đi".',
  'Kết quả này được tính toán bởi một đống câu hỏi ngẫu nhiên. Đừng tin 100%. Nhưng cũng đừng bỏ qua.',
  'Bạn vừa tự chẩn đoán tình trạng nghề nghiệp của mình. Bác sĩ khuyên bạn nên uống nhiều nước và cập nhật LinkedIn.',
  'Theo ghi nhận của chúng tôi, đây là lần thứ n bạn nghĩ đến việc nghỉ việc tuần này. Welcome.',
  'Quiz này không đảm bảo bạn sẽ tìm được việc mới sau khi nghỉ. Nhưng ít nhất bạn sẽ ngủ ngon hơn.',
  'Câu trả lời của bạn đã được lưu vào cloud. Cloud đó là não bạn. Hãy suy nghĩ kỹ.',
  'Không có kết quả nào là sai. Nhưng có kết quả nào khiến bạn thở phào không?',
  'Chúng tôi không phán xét bạn. Chúng tôi chỉ phán xét tình trạng công việc của bạn thôi.',
]
