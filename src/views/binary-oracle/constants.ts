import type { DailyOracleInfo } from './types'

export const LUCKY_NUMBERS = [
  8080, 3000, 3306, 5432, 400, 401, 403, 404, 419, 429, 500, 502, 503, 504, 127, 1024,
]

export const DEITIES = [
  // Đồng nghiệp & Vị trí ngồi
  'Người bạn ngồi ngay sau lưng bạn, có vầng trán sáng sủa và hay dùng bàn phím cơ gõ rất kêu.',
  'Vị "trưởng lão" ở góc văn phòng, người luôn dùng màn hình dọc và sở hữu chiếc cốc uống nước cá tính.',
  'Đồng nghiệp có tuổi Mùi hoặc tuổi Hợi, người thường xuyên mời bạn "order" trà sữa vào mỗi buổi chiều.',
  'Người bạn ngồi đối diện, luôn đeo tai nghe chống ồn nhưng chỉ cần bạn gọi "Fix bug em ơi" là tháo ra ngay.',
  'Đồng nghiệp tuổi Tý (thanh nhanh, tỉnh táo) — thường nhạy bén với bug logic vào giờ đêm',
  'Đồng nghiệp tuổi Mùi/Hợi (thân thiện) — sẵn sàng cho bạn mượn sạc và hỗ trợ morale khi chán việc',
  'Người ngồi cạnh cửa sổ (mệnh Hỏa) — truyền cảm hứng sáng tạo nhưng đôi khi gây nóng nảy trong tranh luận',
  'Người ngồi gần ổ cắm (mệnh Thủy) — quý nhân kỹ thuật, phù trợ khi cần network hoặc debug môi trường',
  'Quý nhân mệnh Thổ (thích sắp xếp, có sổ tay) — giúp ổn định dự án khi mọi thứ hỗn loạn',

  // Chức vụ & Vai trò
  'Chị đại QA/Tester với ánh mắt tinh tường, người sẽ tìm ra lỗi trước khi khách hàng kịp nhận thấy.',
  'Bạn Bridge SE có nụ cười hiền hậu, người luôn biết cách "đỡ đòn" cho Dev trước các yêu cầu từ Client.',
  'Người anh Senior "ẩn mình", người có thể giải quyết trong 5 phút những vấn đề bạn đã loay hoay cả ngày.',

  // Đặc điểm nhận dạng vui nhộn
  'Vị quý nhân thường xuyên mặc áo thun xám, đi dép tổ ong và có thói quen vừa code vừa lẩm bẩm một mình.',
  'Người bạn luôn mang theo sạc dự phòng và sẵn sàng cho mượn bất cứ khi nào bạn cần cứu vãn chiếc điện thoại hết pin.',
  'Đồng nghiệp sở hữu bộ sưu tập Bearbrick hoặc vịt cao su (Rubber Duck) đầy đủ nhất trên bàn làm việc.',
  'Người bạn có thói quen ghi chú mọi thứ vào sổ tay bằng những nét chữ cực kỳ ngay ngắn.',

  // Những "vị thần" ẩn danh
  'Bác bảo vệ vui tính ở bãi xe, người giúp bạn giữ gìn phương tiện để yên tâm "O.T" xuyên màn đêm.',
  'Cô lao công tận tụy, người âm thầm dọn dẹp những vỏ lon bò húc và túi snack trên bàn bạn mỗi sáng.',
  'Vị quý nhân "vô hình" đã viết câu trả lời trên Stack Overflow từ 10 năm trước đúng với vấn đề bạn đang gặp.',
]

export const DIRECTIONS = [
  // Hướng về phía công nghệ và ổn định
  'Hướng có sóng WiFi đủ 5 vạch để Zoom không biến giọng bạn thành robot giữa cuộc họp quan trọng.',
  'Tọa độ gần ổ cắm điện âm sàn, đảm bảo nguồn năng lượng cho Laptop luôn dồi dào, tránh sập nguồn giữa lúc build code.',
  'Hướng nhìn thẳng ra cửa sổ để đón ánh sáng tự nhiên, giúp điều tiết thị lực sau những giờ nhìn màn hình mỏi mệt.',
  'Vị trí "tựa sơn" (lưng dựa vào tường), giúp bạn yên tâm không bị đồng nghiệp hay sếp bất ngờ "soi" màn hình từ phía sau.',

  // Hướng cần tránh (Vị trí sát tinh)
  'Tránh xa máy pha cà phê - nơi dễ bị PM "tiện tay" giao thêm task hoặc thảo luận requirement ngoài giờ.',
  'Tránh ngồi trực diện dưới luồng điều hòa (máy lạnh), dễ gây tình trạng "đóng băng" não bộ và viêm họng mãn tính.',
  'Tránh hướng nhìn trực diện vào nhà vệ sinh hoặc khu vực pantry, nơi những mùi hương lạ dễ làm xao nhãng tâm trí khi đang Deep Work.',
  'Tránh xa bàn làm việc của "Thánh Drama" trong công ty, nơi có lượng thông tin rác lớn hơn cả log file của hệ thống.',

  // Hướng chiến lược cho sự nghiệp
  'Hướng ngồi gần khu vực của các Senior "tay to", dễ dàng thẩm thấu kiến thức và nhờ vả mỗi khi dính lỗi logic.',
  'Vị trí gần máy lọc nước, giúp bạn có cớ đứng dậy vận động và gặp gỡ các "quý nhân" từ phòng ban khác.',
  'Góc phòng yên tĩnh, cách xa lối đi lại chính, giúp duy trì trạng thái "Flow" lâu nhất có thể.',
  'Hướng ngồi có thể nhìn thấy quầy lễ tân từ xa, giúp bạn chủ động nhận biết khi nào có shipper giao "pháp bảo" trà sữa tới.',

  // Hướng tâm linh
  'Vị trí "Tụ tài tích đức": Ngồi cạnh người có thói quen viết Unit Test, vận may của bạn sẽ tăng lên nhờ code ít bug hơn.',
  'Hướng ngồi "Hóa giải thị phi": Tránh ngồi đối diện với người đang trong giai đoạn "O.T" căng thẳng, dễ bị lây lan năng lượng tiêu cực.',
]

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function pickByDate<T>(items: readonly T[], date: Date, salt: string): T {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${salt}-${date.getMilliseconds()}`
  const index = hashString(key) % items.length
  return items[index]!
}

export function getDailyOracleInfo(date = new Date()): DailyOracleInfo {
  return {
    luckyNumber: pickByDate(LUCKY_NUMBERS, date, 'lucky-number'),
    deity: pickByDate(DEITIES, date, 'deity'),
    direction: pickByDate(DIRECTIONS, date, 'direction'),
  }
}

// --- Hexagram-specific guidance (hours & actions)
export const AUSPICIOUS_HOURS: string[] = [
  // Giờ Thìn: Khởi đầu ngày mới, dương khí đang lên
  'Giờ Thìn (7h-9h): Khai quang Terminal, "thỉnh" một ly Americano không đường để thông tuệ tâm trí',
  'Giờ Thìn (7h-9h): Hóa giải mớ hỗn độn trong Inbox và Slack trước khi bắt đầu Deep Work',
  'Giờ Thìn (7h-9h): Tịnh hóa môi trường làm việc, dọn dẹp tab trình duyệt để tránh phân tâm',
  'Giờ Thìn (7h-9h): Mở PR nhỏ để test workflow và ghi chú rõ ràng cho reviewer',
  'Giờ Thìn (7h-9h): Chạy server local, kiểm tra logs và khởi động lại service nếu cần',
  'Giờ Thìn (7h-9h): Gửi quick message cảm ơn người review giúp giữ tinh thần đội nhóm',

  // Giờ Tỵ: Lúc hỏa khí vượng, tốt cho việc tranh luận và thực thi
  'Giờ Tỵ (9h-11h): Pháp hội Standup - Sync ngắn, dứt khoát, hóa giải các "blocker" tồn đọng',
  'Giờ Tỵ (9h-11h): Tập trung tối đa vào logic khó, giải quyết những dòng code "nghiệp quật"',
  'Giờ Tỵ (9h-11h): Giải mã Requirement từ PM, tránh hiểu lầm dẫn đến sai lệch về sau',
  'Giờ Tỵ (9h-11h): Refactor một hàm nhỏ để giảm nợ kỹ thuật',
  'Giờ Tỵ (9h-11h): Thử nghiệm A/B cho UI nhỏ để thu thập feedback nhanh',
  'Giờ Tỵ (9h-11h): Ghi chú rõ acceptance criteria vào ticket để tránh lộn xộn',

  // Giờ Ngọ: Chính Ngọ, dương cực sinh âm, nên nghỉ ngơi
  'Giờ Ngọ (11h-13h): Tu thân dưỡng tính qua giấc ngủ 20 phút để hồi phục "mana"',
  'Giờ Ngọ (11h-13h): Kết duyên cùng đồng nghiệp qua bữa trưa, tránh bàn chuyện Bug để tiêu hóa tốt',
  'Giờ Ngọ (11h-13h): Thí điểm deploy lên Staging (nếu mệnh lớn), bằng không hãy giữ im lặng',
  'Giờ Ngọ (11h-13h): Uống đủ nước và nghỉ mắt để tối ưu năng suất buổi chiều',
  'Giờ Ngọ (11h-13h): Kiểm tra bản backup và snapshot trước khi làm việc mạo hiểm',
  'Giờ Ngọ (11h-13h): Lập kế hoạch ngắn cho buổi chiều, chia task rõ ràng để tránh overcommit',

  // Giờ Mùi: Hỏa khí hạ nhiệt, thích hợp cho việc soi xét
  'Giờ Mùi (13h-15h): Soi xét nghiệp lực của đồng nghiệp thông qua Code Review với lòng bao dung',
  'Giờ Mùi (13h-15h): Tĩnh tâm Refactor các đoạn code "rác" để tích đức cho hệ thống',
  'Giờ Mùi (13h-15h): Hỗ trợ QA tái hiện lỗi, dùng sự nhẫn nại để hóa giải mâu thuẫn Dev-QA',
  'Giờ Mùi (13h-15h): Tối ưu feature/UX nhỏ để giảm số line hotfix về sau',
  'Giờ Mùi (13h-15h): Viết document ngắn cho module vừa sửa',
  'Giờ Mùi (13h-15h): Thực hiện một checklist deploy mock để luyện thói quen an toàn',

  // Giờ Thân: Kim khí bắt đầu mạnh, tốt cho việc hoàn thiện và tối ưu
  'Giờ Thân (15h-17h): Truy tìm Memory Leak và tối ưu Performance, gia trì sức mạnh cho Server',
  'Giờ Thân (15h-17h): Đóng gói tính năng, viết Documentation rõ ràng để hậu thế không oán thán',
  'Giờ Thân (15h-17h): Khai hỏa unit test, đảm bảo độ bao phủ (coverage) đạt mức cát tường',
  'Giờ Thân (15h-17h): Nên merge PR nhỏ, kiểm tra lại CI và dọn dẹp branch',
  'Giờ Thân (15h-17h): Sửa một hotfix nhỏ trước khi kết thúc ngày làm việc',

  // Giờ Dậu: Mặt trời xuống núi, nên thu hồi năng lượng
  'Giờ Dậu (17h-19h): Niêm phong Laptop, chuẩn bị "hồi hướng" bản thân về với gia đình',
  'Giờ Dậu (17h-19h): Ghi chép "sớ" công việc cho ngày mai để tâm hồn được thanh thản khi rời văn phòng',
  'Giờ Dậu (17h-19h): Commit và Push lần cuối (nhớ check kỹ tránh vỡ Pipeline lúc chuẩn bị về)',
  'Giờ Dậu (17h-19h): Chuẩn bị TODO list ngắn gọn cho ngày mai trước khi rời',
  'Giờ Dậu (17h-19h): Tắt máy/đăng xuất khỏi môi trường nhạy cảm để bảo mật',
]

export const INAUSPICIOUS_HOURS: string[] = [
  // Giờ Thìn: Đầu ngày, tâm chưa tĩnh, trí chưa thông
  'Giờ Thìn (7h-9h): Đại kỵ mổ xẻ kiến trúc Core khi chưa nạp đủ Caffeine, dễ dẫn đến loạn đao pháp',
  'Giờ Thìn (7h-9h): Tránh xóa các Branch cũ một cách tùy tiện, dễ xóa nhầm "long mạch" của dự án',
  'Giờ Thìn (7h-9h): Không nên tranh cãi về Tech Stack mới khi chưa tỉnh táo, dễ gây khẩu nghiệp với đồng nghiệp',
  'Giờ Thìn (7h-9h): Tránh review code quá gắt khi đồng đội vừa vào ca, dễ gây mất đoàn kết',
  'Giờ Thìn (7h-9h): Hạn chế merge các PR khổng lồ vừa mới được mở, vì dễ bỏ sót edge-case',

  // Giờ Tỵ: Hỏa vượng, dễ nóng nảy, mất tập trung
  'Giờ Tỵ (9h-11h): Hạn chế sa đà vào Drama trên Slack hay Facebook, dễ bị "vong" Deadline theo đuổi',
  'Giờ Tỵ (9h-11h): Tránh làm việc đa nhiệm (Multitasking) quá mức, thần hồn nát thần tính, Bug mọc như nấm',
  'Giờ Tỵ (9h-11h): Tránh quyết định đổi library chính trong sprint giữa chừng',
  'Giờ Tỵ (9h-11h): Đừng approve vội PR khi chưa test đầy đủ, dễ tạo debt cho QA',

  // Giờ Ngọ: Chính Ngọ, dương cực sinh âm, người đi ăn hết không có ai cứu giúp
  'Giờ Ngọ (11h-13h): Tuyệt đối cấm kỵ thay đổi cấu hình Production (Config) hay xóa Database, "bay màu" như chơi',
  'Giờ Ngọ (11h-13h): Tránh hứa hẹn Deadline với PM khi đang đói, lời nói lúc này thường thiếu sự tỉnh táo',
  'Giờ Ngọ (11h-13h): Hạn chế upgrade Library version mới mà không đọc kỹ Documentation, dễ dính "độc tố" bảo mật',
  'Giờ Ngọ (11h-13h): Không merge PR không có test trong thời gian nghỉ trưa của reviewer chính',
  'Giờ Ngọ (11h-13h): Tránh deploy hotfix vội vã nếu không có người trực theo dõi sau deploy',

  // Giờ Mùi: Giờ buồn ngủ, khí huyết dồn xuống dạ dày, não bộ đình trệ
  'Giờ Mùi (13h-15h): Tránh viết các hàm Logic phức tạp hoặc thuật toán đệ quy, rất dễ rơi vào vòng lặp vô tận',
  'Giờ Mùi (13h-15h): Không nên thực hiện "Force Push" lên nhánh chính, hậu quả khôn lường cho toàn đội',
  'Giờ Mùi (13h-15h): Tránh review code quá nhanh khi đang mệt, sẽ bỏ sót bug logic',

  // Giờ Thân: Sắp hết giờ làm, tâm lý nôn nóng dễ làm ẩu
  'Giờ Thân (15h-17h): Tránh bắt đầu một Task cực lớn (Big Task), dễ dẫn đến tình trạng "đầu voi đuôi chuột"',
  'Giờ Thân (15h-17h): Không nên lờ đi các cảnh báo (Warnings) của Compiler, nghiệp tụ vào lúc cuối ngày',
  'Giờ Thân (15h-17h): Tránh chỉnh code core khi đang rush, dễ tạo bug khó debug vào tối hôm đó',
  'Giờ Thân (15h-17h): Không deploy lớn khi không có người trực theo dõi trong buổi tối',

  // Giờ Dậu: Mặt trời lặn, âm khí vượng, giờ "về hưu" tạm thời
  'Giờ Dậu (17h-19h): ĐẠI KỴ: Deploy lên Production, đặc biệt là vào chiều thứ Sáu - Đây là con đường ngắn nhất dẫn đến mất ngủ cuối tuần',
  'Giờ Dậu (17h-19h): Tránh tranh cãi gắt gao về Bug trước khi ra về, dễ mang năng lượng tiêu cực về nhà',
  'Giờ Dậu (17h-19h): Hạn chế Merge code số lượng lớn mà chưa qua Review, dễ gây nghẽn mạch Pipeline',
  'Giờ Dậu (17h-19h): Không để lại task đòi hỏi on-call trong cuối tuần, đừng làm đồng đội mất ngủ',
  'Giờ Dậu (17h-19h): Tránh xóa tài khoản/test data quan trọng trước khi nghỉ, hậu quả khó lường',
]

export const SHOULD_DO: string[] = [
  // Kỹ thuật & Chất lượng
  'Viết unit test cho chức năng vừa sửa, đảm bảo độ bao phủ (coverage) đạt mức cát tường',
  'Cập nhật Documentation ngắn gọn, súc tích để hậu thế không lạc lối trong ma trận code',
  'Refactor lại những đoạn code "thối" (Code Smell) theo nguyên tắc hướng thiện (Clean Code)',
  'Review code cho đồng nghiệp bằng sự bao dung và góp ý mang tính xây dựng',
  'Kiểm tra lại Log và Monitor sau khi vừa triển khai tính năng mới để tâm hồn được yên bình',

  // Quản lý & Quy trình
  'Viết Commit Message rõ ràng, tuân theo chuẩn Conventional Commits để tra cứu tiền kiếp của code',
  'Tự tin đặt câu hỏi khi gặp khúc mắc quá 30 phút, tránh lún sâu vào u mê của sự bế tắc',
  'Cập nhật trạng thái task trên Jira để PM không "thỉnh" bạn trong giờ làm việc',
  'Nhớ logwork đầy đủ sau khi hoàn thành task để đồng đội nắm bắt tiến độ',

  // Tu thân (Sức khỏe Dev)
  'Uống đủ nước và đứng dậy vận động sau mỗi 45 phút Deep Work để khí huyết lưu thông',
  'Tẩy trần bàn làm việc, vệ sinh bàn phím để tăng cường vận khí và giảm vi khuẩn',
  'Backup dữ liệu quan trọng trước khi thực hiện những thay đổi mang tính "đảo lộn thế gian"',

  // AI & Automation (Best practices)
  'Sử dụng AI để tạo boilerplate hoặc gợi ý, nhưng luôn review và viết unit test cho code được sinh ra',
  'Lưu prompt và kết quả đầu ra khi sử dụng AI cho task quan trọng để phục vụ audit và reproducibility',
  'Viết test cases cụ thể để xác nhận AI-generated logic hoạt động như mong đợi',
  'Chuẩn hóa cách sử dụng AI (prompt templates) trong repo để đồng đội dễ tiếp cận và audit',
]

export const SHOULD_NOT_DO: string[] = [
  // Kỹ thuật & Vận hành
  'Deploy vào cuối giờ chiều thứ Sáu mà không có người on-call (Đại kỵ - Dễ mất cuối tuần)',
  'Hardcode các thông tin nhạy cảm (API Key, Password) trực tiếp vào mã nguồn (Dễ lộ thiên cơ)',
  'Sử dụng câu thần chú "It works on my machine" để thoái thác trách nhiệm khi gặp Bug',
  'Bỏ qua (Suppress) các cảnh báo từ Linter hoặc Compiler bằng cách dùng "any" vô tội vạ',
  'Force Push (git push -f) lên các nhánh chung mà chưa xin phép tổ tiên và đồng nghiệp',

  // Tư duy & Thái độ
  'Lẳng lặng sửa code trên môi trường Production mà không thông qua hệ thống quản lý phiên bản',
  'Ôm đồm quá nhiều Task cùng lúc dẫn đến tẩu hỏa nhập ma, không việc nào hoàn thành',
  'Tranh cãi gay gắt về ngôn ngữ lập trình hay Text Editor (Vim vs VS Code) gây mất đoàn kết nội bộ',
  'Vibe code từ AI mà không hiểu bản chất (Dễ rước "vong" Bug lạ vào nhà)',

  // Thói quen
  'Để hàng chục Tab trình duyệt không liên quan mở cùng lúc làm tiêu tốn tài nguyên máy tính và tâm trí',
  'Bỏ qua các buổi họp Sync quan trọng để rồi đi sai hướng so với đại cuộc của dự án',

  // AI & Automation (Cautions)
  'Sao chép thẳng code từ AI mà không review hoặc viết test — dễ mang bug và dependency rắc rối vào dự án',
  'Dùng AI để tạo ra các secret (API keys, passwords) rồi commit vào repo mà không kiểm tra bảo mật',
  'Tin tưởng hoàn toàn vào logic phức tạp do AI sinh ra mà không có thử nghiệm thực tế',
]

/**
 * Return guidance for a hexagram identified by id or binary string.
 * Uses deterministic hashing so the mapping is stable per-hexagram.
 */
export function getHexagramGuidance() {
  const date = new Date()

  return {
    auspicious: pickByDate(AUSPICIOUS_HOURS, date, 'auspicious-hour'),
    inauspicious: pickByDate(INAUSPICIOUS_HOURS, date, 'inauspicious-hour'),
    shouldDo: pickByDate(SHOULD_DO, date, 'should-do'),
    shouldNotDo: pickByDate(SHOULD_NOT_DO, date, 'should-not-do'),
  }
}
