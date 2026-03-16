// ──────────────────────────────────────────────
// Bộ bài Tarot hoàn chỉnh 78 lá — Tiếng Việt
// 22 Ẩn Chính (id 0–21) + 56 Ẩn Phụ (id 22–77)
// ──────────────────────────────────────────────

import type { TarotCard } from '../types'

// ── Ẩn Chính (Major Arcana) ────────────────────

const majorArcana: TarotCard[] = [
  {
    id: 0,
    name: 'Kẻ Ngốc',
    arcana: 'major',
    keywords: ['khởi đầu mới', 'ngây thơ', 'tự do', 'phiêu lưu'],
    uprightMeaning:
      'Một khởi đầu mới đang chờ đón bạn. Hãy ôm lấy điều chưa biết với sự hồn nhiên và dũng cảm bước nhảy — vũ trụ đang ủng hộ hành trình của bạn.',
    reversedMeaning:
      'Sự liều lĩnh hoặc nỗi sợ hãi trước điều chưa biết đang kìm hãm bạn. Hãy dừng lại và xem xét liệu bạn đang bốc đồng hay quá thận trọng.',
  },
  {
    id: 1,
    name: 'Nhà Ảo Thuật',
    arcana: 'major',
    keywords: ['hiện thực hóa', 'tài năng', 'sức mạnh ý chí', 'hành động'],
    uprightMeaning:
      'Bạn đã có đủ mọi công cụ và tài năng cần thiết. Hãy tập trung ý chí để biến ước mơ thành hiện thực.',
    reversedMeaning:
      'Tiềm năng chưa được khai phá hoặc sự lừa dối. Hãy cẩn thận với những mánh khóe — dù là từ chính bạn hay từ người khác.',
  },
  {
    id: 2,
    name: 'Nữ Tư Tế',
    arcana: 'major',
    keywords: ['trực giác', 'bí ẩn', 'tri thức nội tâm', 'tiềm thức'],
    uprightMeaning:
      'Hãy tin vào trực giác và nhìn sâu hơn bề mặt. Câu trả lời nằm bên trong bạn — hãy lắng nghe tiếng nói nội tâm.',
    reversedMeaning:
      'Bạn có thể đang phớt lờ trực giác hoặc giấu kín bí mật. Hãy kết nối lại với trí tuệ bên trong và để sự thật được phơi bày.',
  },
  {
    id: 3,
    name: 'Hoàng Hậu',
    arcana: 'major',
    keywords: ['sung túc', 'nuôi dưỡng', 'thiên nhiên', 'sáng tạo'],
    uprightMeaning:
      'Giai đoạn phát triển và dồi dào bao quanh bạn. Hãy chăm sóc các dự án và mối quan hệ — chúng sẽ nở rộ tuyệt đẹp.',
    reversedMeaning:
      'Bế tắc sáng tạo hoặc phụ thuộc quá mức vào người khác. Hãy khôi phục sự cân bằng giữa cho đi và nhận lại.',
  },
  {
    id: 4,
    name: 'Hoàng Đế',
    arcana: 'major',
    keywords: ['quyền lực', 'kỷ luật', 'ổn định', 'lãnh đạo'],
    uprightMeaning:
      'Hãy nắm quyền với sự tự tin và thiết lập trật tự. Kỷ luật và tư duy chiến lược sẽ tạo nền tảng vững chắc cho bạn.',
    reversedMeaning:
      'Sự cứng nhắc hoặc độc đoán. Kiểm soát quá mức kìm hãm sự phát triển — hãy nới lỏng và xem xét liệu quyền lực đã trở thành bạo quyền.',
  },
  {
    id: 5,
    name: 'Giáo Hoàng',
    arcana: 'major',
    keywords: ['truyền thống', 'tri thức tâm linh', 'dẫn dắt', 'niềm tin'],
    uprightMeaning:
      'Hãy tìm kiếm sự hướng dẫn từ trí tuệ và truyền thống đã được thiết lập. Một người thầy có thể mang đến kiến thức bạn cần lúc này.',
    reversedMeaning:
      'Đặt câu hỏi về quy ước và tự tìm con đường riêng. Hãy thoát khỏi những niềm tin cứng nhắc không còn phục vụ sự phát triển của bạn.',
  },
  {
    id: 6,
    name: 'Đôi Tình Nhân',
    arcana: 'major',
    keywords: ['tình yêu', 'hòa hợp', 'lựa chọn', 'kết nối'],
    uprightMeaning:
      'Một mối liên kết ý nghĩa hoặc lựa chọn quan trọng đang ở trước mặt. Hãy theo trái tim nhưng vẫn trung thành với giá trị sâu xa nhất.',
    reversedMeaning:
      'Bất hòa, lệch giá trị, hoặc né tránh lựa chọn khó khăn. Hãy suy ngẫm điều gì thực sự quan trọng trước khi cam kết.',
  },
  {
    id: 7,
    name: 'Cỗ Xe Chiến',
    arcana: 'major',
    keywords: ['quyết tâm', 'ý chí', 'chiến thắng', 'kiểm soát'],
    uprightMeaning:
      'Chiến thắng nhờ quyết tâm sắt đá. Hãy kết hợp các lực lượng đối lập, tập trung vào mục tiêu và tiến lên với sự tự tin.',
    reversedMeaning:
      'Thiếu định hướng hoặc hung hăng không mục đích. Bạn có thể đang ép buộc kết quả — hãy lùi lại và điều chỉnh hướng đi.',
  },
  {
    id: 8,
    name: 'Sức Mạnh',
    arcana: 'major',
    keywords: ['dũng cảm', 'kiên nhẫn', 'nội lực', 'từ bi'],
    uprightMeaning:
      'Sức mạnh thực sự đến từ bên trong. Hãy đối mặt thử thách với lòng dũng cảm nhẹ nhàng và sự kiên định — sức mạnh mềm chiến thắng bạo lực.',
    reversedMeaning:
      'Tự nghi ngờ hoặc yếu đuối nội tâm. Bạn có thể cảm thấy bất lực, nhưng sức mạnh bạn cần đã có sẵn bên trong — hãy kết nối lại.',
  },
  {
    id: 9,
    name: 'Ẩn Sĩ',
    arcana: 'major',
    keywords: ['tìm kiếm nội tâm', 'suy ngẫm', 'cô độc', 'trí tuệ'],
    uprightMeaning:
      'Hãy rút lui khỏi sự ồn ào và tìm câu trả lời bên trong. Đây là thời điểm để suy ngẫm sâu sắc và tìm ánh sáng nội tâm.',
    reversedMeaning:
      'Cô lập quá mức hoặc từ chối nhìn vào bên trong. Hãy cân bằng giữa cô đơn và kết nối — đừng để sự rút lui thành cô độc.',
  },
  {
    id: 10,
    name: 'Vòng Quay Vận Mệnh',
    arcana: 'major',
    keywords: ['thay đổi', 'chu kỳ', 'số phận', 'bước ngoặt'],
    uprightMeaning:
      'Vòng quay đang xoay có lợi cho bạn. Hãy đón nhận thay đổi và nhận ra rằng cuộc sống vận hành theo chu kỳ — đây là khoảnh khắc chuyển biến tích cực.',
    reversedMeaning:
      'Kháng cự sự thay đổi không thể tránh hoặc giai đoạn xui xẻo. Hãy nhớ rằng chu kỳ xấu rồi sẽ qua — hãy kiên cường và thích nghi.',
  },
  {
    id: 11,
    name: 'Công Lý',
    arcana: 'major',
    keywords: ['sự thật', 'công bằng', 'nhân quả', 'trách nhiệm'],
    uprightMeaning:
      'Sự thật và công bằng sẽ chiến thắng. Hành động của bạn có hậu quả — hãy đưa ra quyết định với sự chính trực và tin rằng công lý sẽ được thực thi.',
    reversedMeaning:
      'Thiếu trung thực hoặc trốn tránh trách nhiệm. Kết quả không công bằng có thể xuất phát từ tư duy thiên lệch. Hãy tìm kiếm sự thật.',
  },
  {
    id: 12,
    name: 'Người Treo Ngược',
    arcana: 'major',
    keywords: ['buông bỏ', 'góc nhìn mới', 'hy sinh', 'tạm dừng'],
    uprightMeaning:
      'Hãy buông bỏ sự kiểm soát và nhìn thế giới từ một góc khác. Sự tạm dừng tự nguyện này mang lại hiểu biết sâu sắc và trưởng thành tâm linh.',
    reversedMeaning:
      'Trì hoãn, do dự, hoặc hy sinh không cần thiết. Bạn có thể đang kháng cự sự thay đổi cần thiết — hãy ngừng trì hoãn và hành động.',
  },
  {
    id: 13,
    name: 'Tử Thần',
    arcana: 'major',
    keywords: ['chuyển hóa', 'kết thúc', 'tái sinh', 'thay đổi'],
    uprightMeaning:
      'Một sự chuyển hóa mạnh mẽ đang diễn ra. Hãy buông bỏ điều không còn phục vụ bạn — kết thúc mở ra không gian cho những khởi đầu tươi đẹp.',
    reversedMeaning:
      'Kháng cự sự thay đổi cần thiết hoặc sợ buông bỏ. Bám víu vào quá khứ ngăn cản sự tái sinh đang chờ đợi phía bên kia.',
  },
  {
    id: 14,
    name: 'Tiết Chế',
    arcana: 'major',
    keywords: ['cân bằng', 'điều độ', 'kiên nhẫn', 'hòa hợp'],
    uprightMeaning:
      'Hãy tìm con đường trung dung và thực hành kiên nhẫn. Pha trộn các lực lượng đối lập thành sự hòa hợp — điều độ và bình tĩnh sẽ dẫn bạn đến mục tiêu.',
    reversedMeaning:
      'Mất cân bằng, thái quá, hoặc thiếu tầm nhìn dài hạn. Hãy sắp xếp lại ưu tiên và khôi phục sự cân bằng trước khi tiến lên.',
  },
  {
    id: 15,
    name: 'Ác Quỷ',
    arcana: 'major',
    keywords: ['ràng buộc', 'vật chất', 'bóng tối', 'cám dỗ'],
    uprightMeaning:
      'Hãy xem xét điều gì đang trói buộc bạn — nghiện ngập, thói quen độc hại, hay nỗi ám ảnh vật chất. Nhận thức là bước đầu tiên để giải thoát.',
    reversedMeaning:
      'Giải phóng khỏi xiềng xích. Bạn đang giành lại sức mạnh và buông bỏ những ràng buộc không lành mạnh. Tự do đang trong tầm tay.',
  },
  {
    id: 16,
    name: 'Tháp Sụp Đổ',
    arcana: 'major',
    keywords: ['biến động', 'sụp đổ', 'thức tỉnh', 'giải phóng'],
    uprightMeaning:
      'Một biến động bất ngờ lay chuyển nền tảng của bạn. Dù gây sốc, sự phá hủy này dọn đường để xây dựng lại trên nền tảng vững chắc hơn.',
    reversedMeaning:
      'Tránh né thảm họa hoặc kháng cự sự sụp đổ không thể tránh. Trì hoãn khoảnh khắc sụp đổ chỉ kéo dài nỗi đau — hãy đón nhận sự đột phá.',
  },
  {
    id: 17,
    name: 'Ngôi Sao',
    arcana: 'major',
    keywords: ['hy vọng', 'niềm tin', 'đổi mới', 'cảm hứng'],
    uprightMeaning:
      'Sau cơn bão đến ngôi sao. Hy vọng được đổi mới, cảm hứng và sự thanh thản tràn ngập tâm hồn bạn. Hãy tin rằng bạn đang đi đúng đường.',
    reversedMeaning:
      'Mất niềm tin hoặc mất kết nối với hy vọng. Bạn có thể cảm thấy thiếu cảm hứng — hãy tìm những nguồn ánh sáng nhỏ để thắp lại tinh thần.',
  },
  {
    id: 18,
    name: 'Mặt Trăng',
    arcana: 'major',
    keywords: ['ảo ảnh', 'nỗi sợ', 'tiềm thức', 'trực giác'],
    uprightMeaning:
      'Không phải mọi thứ đều như vẻ bề ngoài. Hãy vượt qua ảo tưởng và nỗi sợ bằng cách tin vào trực giác — tiềm thức chứa đựng thông điệp quan trọng.',
    reversedMeaning:
      'Sự rõ ràng đang dần xuất hiện từ sự bối rối. Nỗi sợ đang được giải phóng và sự thật đang dần lộ ra. Hãy tin vào quá trình.',
  },
  {
    id: 19,
    name: 'Mặt Trời',
    arcana: 'major',
    keywords: ['niềm vui', 'thành công', 'sức sống', 'tích cực'],
    uprightMeaning:
      'Niềm vui rạng rỡ và thành công tỏa sáng trên bạn. Đây là thời điểm của sự rõ ràng, ấm áp và lễ hội — hãy mở rộng vòng tay đón cuộc sống.',
    reversedMeaning:
      'Giai đoạn tạm thời thiếu vui vẻ hoặc lạc quan bị che mờ. Mặt trời vẫn chiếu sáng sau những đám mây — đừng đánh mất điều tốt đẹp.',
  },
  {
    id: 20,
    name: 'Phán Xét',
    arcana: 'major',
    keywords: ['tái sinh', 'suy ngẫm', 'phán quyết', 'tiếng gọi nội tâm'],
    uprightMeaning:
      'Khoảnh khắc phán quyết và tái sinh. Hãy suy ngẫm về hành trình, lắng nghe tiếng gọi nội tâm và vươn lên để đáp ứng mục đích cao hơn.',
    reversedMeaning:
      'Tự nghi ngờ hoặc từ chối rút kinh nghiệm từ quá khứ. Sự phán xét khắc nghiệt với bản thân cản trở sự phát triển — hãy tha thứ cho chính mình.',
  },
  {
    id: 21,
    name: 'Thế Giới',
    arcana: 'major',
    keywords: ['hoàn thành', 'thành tựu', 'trọn vẹn', 'viên mãn'],
    uprightMeaning:
      'Một chu kỳ đến hồi kết tuyệt đẹp. Bạn đã đạt được sự trọn vẹn và hòa hợp — hãy ăn mừng cột mốc này trước khi hành trình tiếp theo bắt đầu.',
    reversedMeaning:
      'Mục tiêu chưa hoàn thành hoặc đi đường tắt. Có điều gì đó còn dang dở — hãy hoàn tất trước khi vội vã bước vào chương tiếp theo.',
  },
]

// ── Ẩn Phụ — Bộ Gậy (Lửa: hành động, sáng tạo, đam mê) ──

const wands: TarotCard[] = [
  {
    id: 22,
    name: 'Át Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 1,
    keywords: ['cảm hứng', 'cơ hội mới', 'tia sáng sáng tạo'],
    uprightMeaning:
      'Một năng lượng sáng tạo bùng nổ khởi động dự án mới. Hãy nắm bắt cơ hội với đam mê và để nhiệt huyết dẫn đường.',
    reversedMeaning:
      'Trì hoãn hoặc thiếu động lực. Tia lửa đang có nhưng bị chặn — hãy dọn dẹp chướng ngại và kết nối lại với đam mê.',
  },
  {
    id: 23,
    name: 'Hai Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 2,
    keywords: ['lên kế hoạch', 'quyết định', 'khám phá'],
    uprightMeaning:
      'Bạn đứng ở ngã rẽ với thế giới trong tay. Hãy lên kế hoạch táo bạo và đưa ra quyết định mở rộng chân trời.',
    reversedMeaning:
      'Nỗi sợ điều chưa biết giữ bạn trong vùng an toàn. Thiếu kế hoạch dẫn đến bỏ lỡ cơ hội.',
  },
  {
    id: 24,
    name: 'Ba Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 3,
    keywords: ['mở rộng', 'tầm nhìn xa', 'tiến triển'],
    uprightMeaning:
      'Kế hoạch của bạn đang thành hình và sự mở rộng đang diễn ra. Hãy nhìn về phía trước với tự tin — thuyền của bạn đang cập bến.',
    reversedMeaning:
      'Trở ngại làm chậm tiến độ. Thất vọng với kết quả chậm — hãy đánh giá lại chiến lược và kiên nhẫn.',
  },
  {
    id: 25,
    name: 'Bốn Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 4,
    keywords: ['lễ hội', 'đoàn tụ', 'hòa hợp'],
    uprightMeaning:
      'Thời điểm ăn mừng vui vẻ và ổn định. Các cột mốc đã đạt được và cộng đồng tụ họp trong hòa hợp.',
    reversedMeaning:
      'Cảm giác không được chào đón hoặc thiếu sự hỗ trợ. Lễ hội có vẻ trống rỗng — hãy giải quyết những căng thẳng ngầm.',
  },
  {
    id: 26,
    name: 'Năm Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 5,
    keywords: ['xung đột', 'cạnh tranh', 'căng thẳng'],
    uprightMeaning:
      'Cạnh tranh lành mạnh thúc đẩy bạn phát triển. Hãy đón nhận thử thách — xung đột có thể là chất xúc tác cho sự cải thiện.',
    reversedMeaning:
      'Né tránh xung đột hoặc bất ổn nội tâm. Căng thẳng bị kìm nén cần được giải quyết trước khi leo thang.',
  },
  {
    id: 27,
    name: 'Sáu Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 6,
    keywords: ['chiến thắng', 'công nhận', 'thành công'],
    uprightMeaning:
      'Sự công nhận và chiến thắng công khai. Nỗ lực của bạn được ghi nhận — hãy tận hưởng làn sóng thành công với sự khiêm tốn.',
    reversedMeaning:
      'Thiếu sự công nhận hoặc tự hào giả tạo. Thành công thiếu thực chất — hãy đảm bảo thành tựu được thực sự xứng đáng.',
  },
  {
    id: 28,
    name: 'Bảy Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 7,
    keywords: ['kiên trì', 'phòng thủ', 'giữ vững'],
    uprightMeaning:
      'Hãy đứng vững với niềm tin. Thách thức đến từ mọi phía nhưng vị thế của bạn rất mạnh — hãy bảo vệ điều quan trọng.',
    reversedMeaning:
      'Cảm giác choáng ngợp hoặc bỏ cuộc quá dễ. Bạn có thể đang chiến đấu những trận chiến không đáng tiêu hao năng lượng.',
  },
  {
    id: 29,
    name: 'Tám Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 8,
    keywords: ['hành động nhanh', 'chuyển động', 'đà tiến'],
    uprightMeaning:
      'Mọi thứ đang chuyển động nhanh. Tiến triển mau lẹ và những phát triển thú vị đến nhanh chóng — hãy tập trung và tận dụng đà tiến.',
    reversedMeaning:
      'Chậm trễ, bực bội với tốc độ, hoặc quyết định vội vàng. Hãy chậm lại và đảm bảo bạn đang đi đúng hướng.',
  },
  {
    id: 30,
    name: 'Chín Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 9,
    keywords: ['bền bỉ', 'kiên cường', 'trận chiến cuối'],
    uprightMeaning:
      'Bạn đã dày dạn kinh nghiệm và gần đến đích. Hãy dựa vào sự bền bỉ — một cú đẩy cuối cùng sẽ đưa bạn qua.',
    reversedMeaning:
      'Kiệt sức hoặc cố chấp. Hãy biết khi nào cần nghỉ ngơi và khi nào tiếp tục chiến đấu — kiệt sức chẳng giúp ai.',
  },
  {
    id: 31,
    name: 'Mười Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 10,
    keywords: ['gánh nặng', 'trách nhiệm', 'nỗ lực'],
    uprightMeaning:
      'Bạn đang mang gánh nặng lớn. Dù sự cống hiến đáng ngưỡng mộ, hãy cân nhắc chia sẻ — bạn không cần làm tất cả một mình.',
    reversedMeaning:
      'Trút bỏ gánh nặng hoặc trốn tránh trách nhiệm. Hãy giảm tải trước khi nó đè bẹp tinh thần bạn.',
  },
  {
    id: 32,
    name: 'Thị Đồng Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 11,
    keywords: ['nhiệt huyết', 'khám phá', 'tự do'],
    uprightMeaning:
      'Tia lửa nhiệt huyết trẻ trung mang đến ý tưởng mới. Hãy khám phá với sự tò mò và để tinh thần phiêu lưu dẫn đường.',
    reversedMeaning:
      'Thiếu định hướng hoặc năng lượng bất ổn. Hãy tập trung nhiệt huyết phân tán thành hành động có ý nghĩa.',
  },
  {
    id: 33,
    name: 'Hiệp Sĩ Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 12,
    keywords: ['năng lượng', 'đam mê', 'phiêu lưu'],
    uprightMeaning:
      'Xông pha với đam mê cháy bỏng. Năng lượng táo bạo và phiêu lưu thúc đẩy bạn — hãy hành động với dũng cảm và tự tin.',
    reversedMeaning:
      'Bốc đồng hoặc kiệt sức do hành động liều lĩnh. Hãy kiềm chế ngọn lửa bằng chiến lược trước khi xông pha.',
  },
  {
    id: 34,
    name: 'Nữ Hoàng Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 13,
    keywords: ['tự tin', 'quyết đoán', 'ấm áp'],
    uprightMeaning:
      'Tỏa sáng tự tin và truyền cảm hứng cho người khác. Sự quyết đoán và ấm áp của bạn thu hút thành công và bạn đồng hành trung thành.',
    reversedMeaning:
      'Bất an ẩn sau vẻ ngoài mạnh mẽ. Sự ghen tị hoặc đòi hỏi làm suy yếu sức hút tự nhiên của bạn.',
  },
  {
    id: 35,
    name: 'Quốc Vương Gậy',
    arcana: 'minor',
    suit: 'wands',
    number: 14,
    keywords: ['lãnh đạo', 'tầm nhìn', 'doanh nhân'],
    uprightMeaning:
      'Dẫn dắt bằng tầm nhìn và sức hút. Tinh thần doanh nhân và khả năng lãnh đạo táo bạo truyền cảm hứng cho mọi người.',
    reversedMeaning:
      'Lãnh đạo chuyên quyền hoặc kỳ vọng phi thực tế. Quyền lực thiếu sự đồng cảm tạo ra bất mãn — hãy dẫn dắt bằng trái tim.',
  },
]

// ── Ẩn Phụ — Bộ Cốc (Nước: cảm xúc, mối quan hệ, trực giác) ──

const cups: TarotCard[] = [
  {
    id: 36,
    name: 'Át Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 1,
    keywords: ['tình yêu mới', 'thức tỉnh cảm xúc', 'từ bi'],
    uprightMeaning:
      'Chiếc cốc tràn đầy cảm xúc mang đến tình yêu mới hoặc kết nối tâm linh sâu sắc. Hãy mở lòng để đón nhận.',
    reversedMeaning:
      'Trống rỗng cảm xúc hoặc cảm xúc bị chặn. Bạn có thể đang kìm nén cảm xúc cần được bày tỏ và giải phóng.',
  },
  {
    id: 37,
    name: 'Hai Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 2,
    keywords: ['đối tác', 'kết hợp', 'hấp dẫn lẫn nhau'],
    uprightMeaning:
      'Một mối quan hệ đẹp hình thành qua sự tôn trọng và hấp dẫn lẫn nhau. Hai tâm hồn gặp gỡ trong sự hòa hợp và cân bằng.',
    reversedMeaning:
      'Mối quan hệ mất cân bằng hoặc lòng tin bị phá vỡ. Giá trị lệch lạc tạo căng thẳng — cần giao tiếp chân thành.',
  },
  {
    id: 38,
    name: 'Ba Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 3,
    keywords: ['ăn mừng', 'tình bạn', 'cộng đồng'],
    uprightMeaning:
      'Tụ họp bạn bè và ăn mừng. Cộng đồng, hợp tác sáng tạo và niềm vui chung nâng cao tinh thần.',
    reversedMeaning:
      'Cô lập xã hội hoặc quá đà. Tin đồn hoặc bị loại trừ làm giảm bầu không khí — hãy chọn vòng tròn bạn bè cẩn thận.',
  },
  {
    id: 39,
    name: 'Bốn Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 4,
    keywords: ['thờ ơ', 'suy tư', 'không hài lòng'],
    uprightMeaning:
      'Rút lui cảm xúc và suy tư. Bạn có thể đang bỏ lỡ cơ hội ngay trước mắt — hãy ngẩng đầu lên.',
    reversedMeaning:
      'Động lực và nhận thức được đổi mới. Bạn sẵn sàng tái tham gia cuộc sống và chấp nhận những món quà cảm xúc mới.',
  },
  {
    id: 40,
    name: 'Năm Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 5,
    keywords: ['mất mát', 'đau buồn', 'hối tiếc'],
    uprightMeaning:
      'Nỗi đau về những gì đã mất che phủ những gì còn lại. Hãy cho phép bản thân thương tiếc, nhưng cũng nhận ra những chiếc cốc vẫn đứng.',
    reversedMeaning:
      'Chấp nhận và tiến lên. Quá trình chữa lành bắt đầu khi bạn buông bỏ hối tiếc và ôm lấy những gì vẫn còn.',
  },
  {
    id: 41,
    name: 'Sáu Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 6,
    keywords: ['hoài niệm', 'hồn nhiên', 'ký ức tuổi thơ'],
    uprightMeaning:
      'Những ký ức ngọt ngào và niềm vui hồn nhiên trỗi dậy. Hãy kết nối lại với đứa trẻ bên trong hoặc người nào đó từ quá khứ.',
    reversedMeaning:
      'Sống trong quá khứ hoặc từ chối trưởng thành. Hoài niệm trở nên không lành mạnh khi ngăn cản bạn sống trong hiện tại.',
  },
  {
    id: 42,
    name: 'Bảy Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 7,
    keywords: ['ảo tưởng', 'lựa chọn', 'mơ mộng'],
    uprightMeaning:
      'Nhiều lựa chọn và giấc mơ làm mờ tầm nhìn. Hãy phân biệt ảo tưởng với thực tế và cam kết một con đường có ý nghĩa.',
    reversedMeaning:
      'Sự rõ ràng xuyên qua ảo tưởng. Bạn sẵn sàng đưa ra lựa chọn thực tế sau khi nhìn thấu sương mù mơ mộng.',
  },
  {
    id: 43,
    name: 'Tám Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 8,
    keywords: ['rời bỏ', 'tìm kiếm sự thật', 'vỡ mộng'],
    uprightMeaning:
      'Bạn dũng cảm rời bỏ điều không còn thỏa mãn. Cuộc tìm kiếm ý nghĩa sâu xa đòi hỏi dũng cảm nhưng mang lại sự trưởng thành.',
    reversedMeaning:
      'Sợ rời bỏ quen thuộc hoặc lang thang vô mục đích. Hãy quyết định dứt khoát: cam kết hoàn toàn hoặc bước đi.',
  },
  {
    id: 44,
    name: 'Chín Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 9,
    keywords: ['ước mơ thành hiện thực', 'mãn nguyện', 'hài lòng'],
    uprightMeaning:
      'Ước mơ của bạn đang thành hiện thực. Sự mãn nguyện và hài lòng tràn đầy chiếc cốc — hãy tận hưởng khoảnh khắc viên mãn này.',
    reversedMeaning:
      'Hạnh phúc hời hợt hoặc ước mơ chưa thành. Tiện nghi vật chất thiếu chiều sâu cảm xúc khiến bạn vẫn thấy thiếu thốn.',
  },
  {
    id: 45,
    name: 'Mười Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 10,
    keywords: ['hòa thuận', 'gia đình', 'viên mãn cảm xúc'],
    uprightMeaning:
      'Sự viên mãn cảm xúc tối thượng — gia đình yêu thương, hòa hợp sâu sắc và hạnh phúc lâu dài. Trái tim bạn thực sự về nhà.',
    reversedMeaning:
      'Bất hòa gia đình hoặc giấc mơ hạnh phúc tan vỡ. Hãy nỗ lực sửa chữa mối quan hệ và định nghĩa lại hạnh phúc.',
  },
  {
    id: 46,
    name: 'Thị Đồng Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 11,
    keywords: ['cơ hội sáng tạo', 'thông điệp trực giác', 'tò mò'],
    uprightMeaning:
      'Một thông điệp thú vị hoặc cảm hứng sáng tạo xuất hiện. Hãy đón nhận với sự ngạc nhiên và trái tim mở rộng.',
    reversedMeaning:
      'Thiếu chín chắn cảm xúc hoặc bế tắc sáng tạo. Đừng để sự tự nghi bịt miệng tiếng nói nội tâm — hãy thể hiện bản thân.',
  },
  {
    id: 47,
    name: 'Hiệp Sĩ Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 12,
    keywords: ['lãng mạn', 'quyến rũ', 'trí tưởng tượng'],
    uprightMeaning:
      'Năng lượng lãng mạn và giàu trí tưởng tượng tràn vào. Hãy theo trái tim với sự duyên dáng — để sự quyến rũ và sáng tạo dẫn đường.',
    reversedMeaning:
      'Kỳ vọng phi thực tế hoặc thất thường. Quyến rũ thiếu thực chất dẫn đến thất vọng — hãy nối đất giấc mơ.',
  },
  {
    id: 48,
    name: 'Nữ Hoàng Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 13,
    keywords: ['từ bi', 'nuôi dưỡng', 'trực giác'],
    uprightMeaning:
      'Lòng từ bi sâu sắc và trí tuệ trực giác dẫn đường. Hãy nuôi dưỡng bản thân và người khác bằng sự đồng cảm và trí tuệ cảm xúc.',
    reversedMeaning:
      'Phụ thuộc cảm xúc hoặc hy sinh bản thân. Hãy đặt ranh giới lành mạnh — bạn không thể rót từ chiếc cốc rỗng.',
  },
  {
    id: 49,
    name: 'Quốc Vương Cốc',
    arcana: 'minor',
    suit: 'cups',
    number: 14,
    keywords: ['cân bằng cảm xúc', 'rộng lượng', 'ngoại giao'],
    uprightMeaning:
      'Bậc thầy cảm xúc dẫn dắt bằng lòng từ bi và trí tuệ. Sự bình tĩnh và cân bằng của bạn mang lại hòa hợp cho xung quanh.',
    reversedMeaning:
      'Thao túng cảm xúc hoặc biến động ẩn dưới vẻ bình tĩnh. Hãy giải quyết cảm xúc bị kìm nén trước khi chúng tràn ra.',
  },
]

// ── Ẩn Phụ — Bộ Kiếm (Khí: trí tuệ, xung đột, sự thật) ──

const swords: TarotCard[] = [
  {
    id: 50,
    name: 'Át Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 1,
    keywords: ['minh mẫn', 'đột phá', 'sự thật'],
    uprightMeaning:
      'Một đột phá trí tuệ mạnh mẽ xuyên qua sự bối rối. Ý tưởng mới và sự minh mẫn trao quyền hành động quyết đoán.',
    reversedMeaning:
      'Phán đoán mờ mịt hoặc lạm dụng trí tuệ. Tâm trí sắc bén thiếu trí tuệ có thể gây tổn thương — hãy suy nghĩ trước khi cắt.',
  },
  {
    id: 51,
    name: 'Hai Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 2,
    keywords: ['quyết định khó', 'bế tắc', 'né tránh'],
    uprightMeaning:
      'Một lựa chọn khó khăn đòi hỏi sự chú ý. Né tránh quyết định chỉ kéo dài sự căng thẳng — hãy tháo tấm bịt mắt.',
    reversedMeaning:
      'Thông tin mới xuất hiện giúp đưa ra quyết định. Bế tắc được phá vỡ khi góc nhìn mới đến.',
  },
  {
    id: 52,
    name: 'Ba Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 3,
    keywords: ['đau lòng', 'nỗi buồn', 'sự thật đau đớn'],
    uprightMeaning:
      'Một sự thật đau đớn xuyên thấu trái tim. Hãy cho phép bản thân đau buồn — xử lý nỗi đau dẫn đến sự chữa lành.',
    reversedMeaning:
      'Bắt đầu phục hồi từ nỗi đau lòng. Điều tồi tệ nhất đã qua — hãy buông bỏ nỗi đau và mở lòng để chữa lành.',
  },
  {
    id: 53,
    name: 'Bốn Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 4,
    keywords: ['nghỉ ngơi', 'phục hồi', 'suy tư'],
    uprightMeaning:
      'Nghỉ ngơi không phải là lười biếng — đó là sự chuẩn bị. Hãy rút lui, nạp lại năng lượng và để tâm trí phục hồi sau những trận chiến gần đây.',
    reversedMeaning:
      'Bồn chồn hoặc kiệt sức do từ chối nghỉ ngơi. Cơ thể và tâm trí đòi hỏi sự tạm dừng — hãy lắng nghe.',
  },
  {
    id: 54,
    name: 'Năm Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 5,
    keywords: ['xung đột', 'thất bại', 'chiến thắng cay đắng'],
    uprightMeaning:
      'Trận chiến thắng với cái giá quá cao. Hãy cân nhắc liệu chiến thắng có xứng đáng với thiệt hại trong các mối quan hệ.',
    reversedMeaning:
      'Mong muốn hòa giải sau xung đột. Hạ kiếm xuống mở cánh cửa cho sự giải quyết và hòa bình.',
  },
  {
    id: 55,
    name: 'Sáu Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 6,
    keywords: ['chuyển tiếp', 'buông bỏ', 'vùng nước lặng'],
    uprightMeaning:
      'Bạn đang rời khỏi bão tố hướng về vùng nước bình lặng hơn. Sự chuyển tiếp có thể cay đắng nhưng cần thiết để chữa lành.',
    reversedMeaning:
      'Kháng cự tiến lên hoặc hành lý chưa giải quyết. Bạn không thể đến bờ yên bình nếu vẫn bám víu vào cơn bão.',
  },
  {
    id: 56,
    name: 'Bảy Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 7,
    keywords: ['lừa dối', 'chiến lược', 'bí mật'],
    uprightMeaning:
      'Chiến lược khôn ngoan cần thiết, nhưng hãy cẩn thận với sự lừa dối. Bạn đang khôn khéo hay thiếu trung thực? Hãy kiểm tra động cơ.',
    reversedMeaning:
      'Bí mật bị phơi bày hoặc thú nhận. Sự lừa dối sụp đổ — trung thực, dù khó khăn, là con đường duy nhất.',
  },
  {
    id: 57,
    name: 'Tám Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 8,
    keywords: ['hạn chế', 'tự giam', 'bế tắc'],
    uprightMeaning:
      'Bạn cảm thấy bị giam cầm, nhưng nhà tù phần lớn do chính bạn tạo ra. Hãy thay đổi góc nhìn và những ràng buộc sẽ nới lỏng.',
    reversedMeaning:
      'Phá vỡ niềm tin giới hạn. Bạn nhận ra mình có nhiều sức mạnh hơn bạn tưởng — hãy bước ra khỏi lồng.',
  },
  {
    id: 58,
    name: 'Chín Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 9,
    keywords: ['lo âu', 'ác mộng', 'bất an'],
    uprightMeaning:
      'Lo âu và suy nghĩ đen tối quấy rầy sự bình yên. Những nỗi sợ này có thể tồi tệ hơn trong tâm trí so với thực tế.',
    reversedMeaning:
      'Bắt đầu đối phó với lo âu. Bạn đang học rằng lo lắng không ngăn được thảm họa — nó chỉ ngăn niềm vui.',
  },
  {
    id: 59,
    name: 'Mười Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 10,
    keywords: ['kết thúc', 'đáy vực', 'bình minh mới'],
    uprightMeaning:
      'Bạn đã chạm đáy — nhưng con đường duy nhất giờ là đi lên. Kết thúc đau đớn này dọn đường cho sự đổi mới hoàn toàn.',
    reversedMeaning:
      'Kháng cự cái kết không thể tránh hoặc phục hồi từ sự tàn phá. Điều tồi tệ nhất đã qua — bình minh theo sau đêm tối nhất.',
  },
  {
    id: 60,
    name: 'Thị Đồng Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 11,
    keywords: ['tò mò', 'nhanh nhạy', 'cảnh giác'],
    uprightMeaning:
      'Tâm trí sắc bén, tò mò sẵn sàng khám phá ý tưởng mới. Hãy giữ sự nhanh nhạy trí tuệ và giao tiếp với sự rõ ràng.',
    reversedMeaning:
      'Ngồi lê đôi mách, lời nói vội vàng, hoặc nói mà không làm. Hãy suy nghĩ trước khi nói — lời nói có sức nặng.',
  },
  {
    id: 61,
    name: 'Hiệp Sĩ Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 12,
    keywords: ['tham vọng', 'tư duy nhanh', 'quyết đoán'],
    uprightMeaning:
      'Xông pha với sự mãnh liệt trí tuệ. Tham vọng và tư duy nhanh dọn đường — nhưng đừng giẫm lên người khác.',
    reversedMeaning:
      'Vội vàng liều lĩnh hoặc đốt cầu. Tốc độ thiếu phương hướng chỉ là hỗn loạn — hãy chậm lại và lên chiến lược.',
  },
  {
    id: 62,
    name: 'Nữ Hoàng Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 13,
    keywords: ['giao tiếp rõ ràng', 'độc lập', 'sáng suốt'],
    uprightMeaning:
      'Nhìn xuyên ảo tưởng với sự sáng suốt sắc bén. Giao tiếp trực tiếp và đưa ra quyết định từ tư duy rõ ràng, độc lập.',
    reversedMeaning:
      'Lạnh lùng xa cách hoặc chỉ trích quá mức. Trí tuệ thiếu đồng cảm tạo ra sự cô lập — hãy cân bằng lý trí và trái tim.',
  },
  {
    id: 63,
    name: 'Quốc Vương Kiếm',
    arcana: 'minor',
    suit: 'swords',
    number: 14,
    keywords: ['quyền lực trí tuệ', 'sự thật', 'lãnh đạo đạo đức'],
    uprightMeaning:
      'Dẫn dắt bằng sự minh mẫn trí tuệ và niềm tin đạo đức. Quyền lực của bạn đến từ sự thật, logic và phán xét công bằng.',
    reversedMeaning:
      'Lạm dụng sức mạnh trí tuệ hoặc hùng biện thao túng. Quyền lực không có đạo đức trở thành áp bức.',
  },
]

// ── Ẩn Phụ — Bộ Tiền (Đất: vật chất, công việc, thịnh vượng) ──

const pentacles: TarotCard[] = [
  {
    id: 64,
    name: 'Át Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 1,
    keywords: ['cơ hội mới', 'thịnh vượng', 'hiện thực hóa'],
    uprightMeaning:
      'Cơ hội vàng cho sự phát triển tài chính xuất hiện. Hãy gieo hạt giống này một cách khôn ngoan và nhìn nó lớn lên thành sự dồi dào.',
    reversedMeaning:
      'Bỏ lỡ cơ hội hoặc kế hoạch tài chính kém. Hạt giống đang có nhưng đất chưa sẵn sàng — hãy chuẩn bị trước.',
  },
  {
    id: 65,
    name: 'Hai Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 2,
    keywords: ['cân bằng', 'thích nghi', 'ưu tiên'],
    uprightMeaning:
      'Bạn tung hứng nhiều ưu tiên với kỹ năng và sự khéo léo. Hãy linh hoạt và duy trì sự cân bằng qua hoàn cảnh thay đổi.',
    reversedMeaning:
      'Choáng ngợp bởi quá nhiều trách nhiệm. Phải có thứ gì đó nhượng bộ — hãy ưu tiên trước khi bạn đánh rơi mọi thứ.',
  },
  {
    id: 66,
    name: 'Ba Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 3,
    keywords: ['làm việc nhóm', 'tay nghề', 'hợp tác'],
    uprightMeaning:
      'Kỹ năng của bạn được công nhận trong nhóm. Nỗ lực hợp tác và sự cống hiến cho nghề mang lại kết quả xuất sắc.',
    reversedMeaning:
      'Thiếu tinh thần đồng đội hoặc chất lượng kém. Bướng bỉnh làm một mình hoặc cắt xén góc gây hại kết quả cuối cùng.',
  },
  {
    id: 67,
    name: 'Bốn Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 4,
    keywords: ['an toàn', 'bảo tồn', 'kiểm soát'],
    uprightMeaning:
      'An ninh tài chính qua quản lý cẩn thận. Bảo vệ những gì bạn đã xây dựng, nhưng đừng để thận trọng thành tích trữ.',
    reversedMeaning:
      'Tham lam, quá chú trọng vật chất, hoặc sợ mất mát. Nắm giữ tiền quá chặt chặn dòng chảy dồi dào.',
  },
  {
    id: 68,
    name: 'Năm Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 5,
    keywords: ['khó khăn tài chính', 'thiếu thốn', 'cô lập'],
    uprightMeaning:
      'Giai đoạn khó khăn tài chính hoặc cảm giác bị bỏ rơi ngoài giá lạnh. Sự giúp đỡ luôn có — bạn chỉ cần tìm kiếm.',
    reversedMeaning:
      'Phục hồi từ mất mát tài chính. Điều tồi tệ nhất đang qua và nguồn lực mới xuất hiện — hãy mở lòng đón nhận sự giúp đỡ.',
  },
  {
    id: 69,
    name: 'Sáu Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 6,
    keywords: ['rộng lượng', 'chia sẻ', 'cho và nhận'],
    uprightMeaning:
      'Sự rộng lượng tuôn chảy theo cả hai hướng. Hãy chia sẻ sự dồi dào với người khác, hoặc biết ơn nhận sự hỗ trợ khi được đề nghị.',
    reversedMeaning:
      'Sự hào phóng có điều kiện hoặc mất cân bằng quyền lực trong việc cho đi. Lòng từ thiện thực sự không mong đợi điều gì đáp lại.',
  },
  {
    id: 70,
    name: 'Bảy Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 7,
    keywords: ['kiên nhẫn', 'đầu tư', 'tầm nhìn dài hạn'],
    uprightMeaning:
      'Khoản đầu tư kiên nhẫn của bạn đang dần đơm hoa. Hãy tin vào quá trình — không phải vụ thu hoạch nào cũng đến nhanh, nhưng sẽ đến.',
    reversedMeaning:
      'Thiếu kiên nhẫn với kết quả chậm hoặc nỗ lực lãng phí. Hãy đánh giá lại liệu khoản đầu tư thời gian và công sức có xứng đáng.',
  },
  {
    id: 71,
    name: 'Tám Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 8,
    keywords: ['kỹ năng', 'tay nghề', 'siêng năng'],
    uprightMeaning:
      'Sự cống hiến cho nghề mang lại sự thành thạo. Hãy tiếp tục mài giũa kỹ năng với kiên nhẫn — sự xuất sắc được xây từng chi tiết.',
    reversedMeaning:
      'Cầu toàn hoặc nhàm chán. Bạn có thể mắc kẹt trong công việc lặp đi lặp lại không có sự phát triển — hãy tìm thử thách mới.',
  },
  {
    id: 72,
    name: 'Chín Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 9,
    keywords: ['xa hoa', 'tự lập', 'thành tựu'],
    uprightMeaning:
      'Bạn đã xây dựng cuộc sống thoải mái và độc lập bằng chính nỗ lực. Hãy tận hưởng thành quả lao động với niềm tự hào.',
    reversedMeaning:
      'Phụ thuộc quá mức vào tiện nghi vật chất hoặc sống vượt khả năng. Sự giàu có thực sự không chỉ là sở hữu.',
  },
  {
    id: 73,
    name: 'Mười Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 10,
    keywords: ['giàu có', 'di sản', 'thịnh vượng gia đình'],
    uprightMeaning:
      'Sự giàu có bền vững, di sản gia đình và thịnh vượng qua nhiều thế hệ. Nỗ lực của bạn tạo an ninh vượt xa bản thân.',
    reversedMeaning:
      'Tranh chấp tài chính gia đình hoặc mất di sản. Chú trọng vật chất gây căng thẳng mối quan hệ — hãy nhớ điều thực sự quan trọng.',
  },
  {
    id: 74,
    name: 'Thị Đồng Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 11,
    keywords: ['tham vọng', 'học hỏi', 'dự án mới'],
    uprightMeaning:
      'Người học trò háo hức sẵn sàng học hỏi và phát triển. Cơ hội thực tiễn cho giáo dục hoặc dự án tài chính mới xuất hiện.',
    reversedMeaning:
      'Thiếu tập trung hoặc trì hoãn. Tham vọng lớn thiếu hành động — hãy cam kết làm việc thực sự.',
  },
  {
    id: 75,
    name: 'Hiệp Sĩ Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 12,
    keywords: ['chăm chỉ', 'kỷ luật', 'trách nhiệm'],
    uprightMeaning:
      'Nỗ lực đều đặn, đáng tin cậy đưa bạn đến mục tiêu. Không phải cách nhanh nhất, nhưng đáng tin cậy và kỹ lưỡng nhất.',
    reversedMeaning:
      'Trì trệ, lười biếng, hoặc cầu toàn ám ảnh. Tiến bộ đòi hỏi chuyển động — đừng để thói quen thành hố sâu.',
  },
  {
    id: 76,
    name: 'Nữ Hoàng Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 13,
    keywords: ['nuôi dưỡng sung túc', 'chăm sóc thực tế', 'gia đình'],
    uprightMeaning:
      'Tạo môi trường ấm áp, dồi dào cho bản thân và người thân. Sự nuôi dưỡng thực tế mang lại sự mãn nguyện sâu sắc.',
    reversedMeaning:
      'Bỏ bê bản thân vì theo đuổi vật chất. Mất cân bằng công việc-cuộc sống — hãy chăm sóc khu vườn của chính mình trước.',
  },
  {
    id: 77,
    name: 'Quốc Vương Tiền',
    arcana: 'minor',
    suit: 'pentacles',
    number: 14,
    keywords: ['giàu có', 'nhạy bén kinh doanh', 'lãnh đạo vững vàng'],
    uprightMeaning:
      'Bậc thầy thế giới vật chất xây dựng đế chế bằng kiên nhẫn và trí tuệ. Khả năng lãnh đạo tài chính mang lại thịnh vượng bền vững.',
    reversedMeaning:
      'Tham lam, nghiện công việc, hoặc liều lĩnh tài chính. Giàu có thiếu giá trị tạo nên vương quốc rỗng tuếch.',
  },
]

// ── Xuất bộ bài hoàn chỉnh 78 lá ──

export const allCards: TarotCard[] = [...majorArcana, ...wands, ...cups, ...swords, ...pentacles]

/** Tìm lá bài theo ID */
export function getCardById(id: number): TarotCard | undefined {
  return allCards.find((c) => c.id === id)
}

/** Lấy tất cả lá bài theo bộ */
export function getCardsBySuit(suit: TarotCard['suit']): TarotCard[] {
  return allCards.filter((c) => c.suit === suit)
}

/** Lấy tất cả Ẩn Chính (Major Arcana) */
export function getMajorArcana(): TarotCard[] {
  return majorArcana
}
