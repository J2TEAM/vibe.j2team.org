import type { Hexagram } from './types'

export const HEXAGRAMS: Hexagram[] = [
  {
    id: 1,
    binary: '111111',
    name: 'Thuần Càn',
    animation: 'Rồng vàng gõ code với tốc độ ánh sáng',
    description:
      'Quẻ đại cát. Hôm nay sao Senior chiếu mệnh, trí tuệ mẫn tiệp, gõ phím như rồng bay phượng múa. Code viết ra tự chạy, Logic tự thông, Unit Test xanh mướt mà không cần sửa một dòng.',
    advice:
      'Thời cơ chín muồi để đòi tăng lương, propose công nghệ mới hoặc tranh thủ đẩy ngay những PR quan trọng. Đừng lãng phí ngày "thăng hoa" này cho những cuộc họp vô bổ.',
  },
  {
    id: 2,
    binary: '000000',
    name: 'Thuần Khôn',
    animation: 'Mặt đất dữ liệu vận hành ổn định',
    description:
      'Đất mẹ bao dung, hệ thống vạn dặm bình yên. Server chạy êm như tiếng thở của crush, Database không một vết gợn, Index tối ưu đến mức thần sầu. Đây là lúc vạn vật cộng hưởng.',
    advice:
      'Hãy đóng vai một con "Task" chăm chỉ. Đừng cố tạo ra những feature đột biến hay refactor những thứ đang chạy tốt. Cứ lẳng lặng mà làm, thành quả sẽ tự đến.',
  },
  {
    id: 3,
    binary: '100010',
    name: 'Thủy Lôi Truân',
    animation: 'Startup hỗn loạn với hàng loạt cảnh báo',
    description:
      'Vạn sự khởi đầu nan. Dự án mới init mà node_modules đã nặng vài GB, môi trường dev config mãi không xong, docker-compose build lỗi lên lỗi xuống. Cảm giác như cả thế giới đang chống lại bạn.',
    advice:
      'Bình tĩnh. Đừng cố đấm ăn xôi. Hãy xóa folder "dist", clear cache, cài lại win hoặc đơn giản là đi pha một gói mì. Kiên nhẫn gỡ rối từng chút một, dự án sẽ sớm lăn bánh.',
  },
  {
    id: 4,
    binary: '010001',
    name: 'Sơn Thủy Mông',
    animation: 'Intern lạc trong mê cung legacy code',
    description:
      'Sự mờ mịt bao trùm. Bạn như một Intern lạc giữa rừng Legacy Code của 10 năm trước, không docs, không comment, biến toàn đặt tên là a, b, c. Càng đọc càng thấy rối, càng sửa càng thấy sai.',
    advice:
      'Đừng ngồi đó mà đoán mò nghiệp vụ. Hãy tìm ngay một Senior "già rơ" nhất team, mời họ một ly cà phê và xin được khai sáng. Sự chủ động hỏi han là chìa khóa duy nhất lúc này.',
  },
  {
    id: 5,
    binary: '111010',
    name: 'Thủy Thiên Nhu',
    animation: 'Thanh tiến trình deploy đang chạy',
    description:
      'Pipeline đang chạy, vòng tròn xoay xoay như đang trêu ngươi. Sự nóng nảy lúc này chỉ khiến bạn dễ bấm nhầm nút Cancel hoặc Re-run vô nghĩa. Càng vội vã, Build càng dễ Fail.',
    advice:
      'Hãy áp dụng triết lý "Chờ đợi là hạnh phúc". Rời mắt khỏi màn hình, đi pha cà phê hoặc đi dạo một vòng. Khi tâm thế bình thản, kết quả Success sẽ tự hiện lên.',
  },
  {
    id: 6,
    binary: '010111',
    name: 'Thiên Thủy Tụng',
    animation: 'Màn hình Git conflict đỏ rực',
    description:
      'Tranh chấp bùng nổ! Git Conflict đỏ rực trên 50 files vì hai bên cùng refactor một logic. Ai cũng cho là mình đúng, không ai chịu nhường ai trong buổi họp Review.',
    advice:
      'Bình tĩnh resolve từng dòng một. Đây là lúc cần kỹ năng giao tiếp hơn là kỹ năng code. Hãy ngồi lại với đối phương, uống một ngụm trà và tìm tiếng nói chung trước khi Force Push.',
  },
  {
    id: 7,
    binary: '010000',
    name: 'Địa Thủy Sư',
    animation: 'Đội quân ticket xếp hàng chờ xử lý',
    description:
      'Quẻ của kỉ luật thép. Một quân đoàn Ticket (Bug, Feature, Task) đang xếp hàng chờ bạn xử lý. Nếu không có phương pháp điều phối tốt, bạn sẽ bị chúng nhấn chìm.',
    advice:
      'Hãy trở thành một chỉ huy tài ba. Phân loại ưu tiên P0, P1, P2 rõ ràng. Tập trung tiêu diệt từng task một theo đúng kế hoạch. Kỷ luật chính là sức mạnh giúp bạn về nhà đúng giờ.',
  },
  {
    id: 8,
    binary: '000010',
    name: 'Thủy Địa Tỷ',
    animation: 'Các service kết nối thành mạng lưới',
    description:
      'Sự gắn kết tuyệt vời. Các Microservices gọi nhau nhịp nhàng qua gRPC, API Contract khớp đến từng dấu phẩy. Mọi người trong team đang hiểu ý nhau mà không cần nói lời nào.',
    advice:
      'Đây là lúc để tăng cường giao lưu. Hãy cập nhật tài liệu Swagger, viết thêm hướng dẫn tích hợp. Sự minh bạch trong tài liệu sẽ củng cố thêm mối quan hệ bền chặt này.',
  },
  {
    id: 9,
    binary: '111011',
    name: 'Phong Thiên Tiểu Súc',
    animation: 'Refactor nhỏ nhưng đều đặn',
    description:
      'Tích tiểu thành đại. Bạn đang âm thầm refactor những hàm nhỏ, tối ưu vài dòng CSS rác. Nhìn qua thì có vẻ không đáng kể, nhưng nội lực hệ thống đang tăng lên từng ngày.',
    advice:
      'Đừng ham làm những cú Big Update chấn động. Cứ commit nhỏ, đều đặn và sạch sẽ. Kiến tha lâu cũng đầy tổ, code sạch lâu ngày sẽ thành một kiệt tác.',
  },
  {
    id: 10,
    binary: '110111',
    name: 'Thiên Trạch Lý',
    animation: 'Bước đi trên dây trong production',
    description:
      'Cưỡi trên lưng hổ! Bạn đang phải sửa code trực tiếp trên Production hoặc chạy lệnh SQL xóa dữ liệu mà không có câu lệnh BEGIN. Một bước sai là đi tong cái Tết.',
    advice:
      'Double-check, Triple-check! Hãy hít thở sâu, đảm bảo bạn đã có bản Backup mới nhất và luôn thủ sẵn phương án Rollback trong tay. Cẩn trọng là cha đẻ của sự an toàn.',
  },
  {
    id: 11,
    binary: '111000',
    name: 'Địa Thiên Thái',
    animation: 'Dashboard xanh mướt, hệ thống an yên',
    description:
      'Thanh bình thịnh trị. Dashboard Grafana xanh mướt một màu, không một cảnh báo, không một tiếng Ping Slack từ phía Client. Mọi thứ đang ở trạng thái cân bằng tuyệt đối.',
    advice:
      'Tận dụng khoảng thời gian "vàng" này để làm những việc ý nghĩa nhưng hay bị bỏ qua: viết Unit Test, cập nhật tài liệu kỹ thuật hoặc học thêm một ngôn ngữ mới. Đừng chỉ ngồi chơi.',
  },
  {
    id: 12,
    binary: '000111',
    name: 'Thiên Địa Bĩ',
    animation: 'Màn hình tối với nhiều cảnh báo downtime',
    description:
      'Bế tắc toàn tập. Server sập do cá mập cắn cáp, sếp mắng vì deadline trễ, người yêu chia tay vì bạn quá bận. Cảm giác như mọi nỗ lực đều đổ sông đổ biển.',
    advice:
      'Khi gặp vận Bĩ, tốt nhất là không nên manh động. Hãy giảm tốc độ, khoanh vùng những việc quan trọng nhất để duy trì sự sống. Im lặng, quan sát và chờ đợi cơn bão qua đi.',
  },
  {
    id: 13,
    binary: '101111',
    name: 'Thiên Hỏa Đồng Nhân',
    animation: 'Cộng đồng open-source cùng hợp lực',
    description:
      'Đồng lòng tát biển Đông cũng cạn. Bạn tìm thấy lời giải cho con Bug quái ác trên Stack Overflow hoặc nhận được sự hỗ trợ nhiệt tình từ một contributor lạ mặt trên Github.',
    advice:
      'Hãy mở rộng vòng tay hợp tác. Chia sẻ kiến thức của bạn cho những người xung quanh. Khi cả team cùng nhìn về một hướng, không có bài toán nào là không thể giải.',
  },
  {
    id: 14,
    binary: '111101',
    name: 'Hỏa Thiên Đại Hữu',
    animation: 'Kho tài nguyên và cơ hội mở rộng',
    description:
      'Đại phú đại quý. Công ty vừa gọi được vốn khủng, tài nguyên Server vô tận (Auto-scaling không giới hạn), bạn đang có trong tay mọi công cụ tốt nhất để làm việc.',
    advice:
      'Đừng lãng phí nguồn lực. Hãy đầu tư vào những kiến trúc bền vững, nâng cấp trải nghiệm người dùng. Có tiền (tài nguyên) thì phải biết tiêu cho xứng đáng.',
  },
  {
    id: 15,
    binary: '000100',
    name: 'Địa Sơn Khiêm',
    animation: 'Senior lặng lẽ hỗ trợ cả team',
    description:
      'Quẻ của sự đức độ. Một Senior thực thụ không cần phô trương, họ lặng lẽ fix những lỗi ngớ ngẩn của Intern và viết những dòng code sạch đến mức không ai nhận ra sự tồn tại của nó.',
    advice:
      'Hãy giữ thái độ cầu thị. Lắng nghe ý kiến của người khác, dù là người mới nhất team. Sự khiêm nhường sẽ giúp bạn nhận được sự tôn trọng và hỗ trợ khi cần thiết.',
  },
  {
    id: 16,
    binary: '001000',
    name: 'Lôi Địa Dự',
    animation: 'Nhịp làm việc rộn ràng cuối sprint',
    description:
      'Vui vẻ và hăng hái. Tinh thần của team đang lên cao vì sắp đến ngày Demo thành công. Tiếng gõ phím vang lên rộn rã như một bản nhạc giao hưởng giữa mùa Sprint.',
    advice:
      'Giữ vững phong độ này nhưng đừng vì quá hăng mà Deploy bừa bãi vào chiều thứ Sáu. Niềm vui sẽ trọn vẹn hơn khi bạn có một cuối tuần không phải trực sự cố.',
  },
  {
    id: 17,
    binary: '100110',
    name: 'Trạch Lôi Tùy',
    animation: 'Bảng xu hướng công nghệ liên tục cập nhật',
    description:
      'Thuận theo thời thế. Thị trường đang hot AI, Web3 hay Rust? Bạn cảm thấy cần phải cập nhật bản thân để không bị lỗi thời giữa dòng đời vạn biến.',
    advice:
      'Học hỏi là tốt, nhưng hãy chọn lọc. Đừng chạy theo mọi trào lưu như một kẻ mất phương hướng. Hãy chọn thứ thực sự giúp ích cho dự án hiện tại của bạn.',
  },
  {
    id: 18,
    binary: '011001',
    name: 'Sơn Phong Cổ',
    animation: 'Hệ thống cũ nát cần đại tu',
    description:
      'Đổ nát và trì trệ. Hệ thống Legacy Code nát đến mức mỗi lần sửa một chỗ là mười chỗ khác hỏng theo. Nợ kỹ thuật (Technical Debt) đã cao như núi Everest.',
    advice:
      'Cần một cuộc đại phẫu! Đừng cố vá víu thêm nữa. Hãy lập kế hoạch cải tổ từng lớp (Layer), giải quyết triệt để những chỗ "thối" nhất trước khi mọi thứ sụp đổ hoàn toàn.',
  },
  {
    id: 19,
    binary: '110000',
    name: 'Địa Trạch Lâm',
    animation: 'Quản lý xuất hiện trong buổi review code',
    description:
      'Sắp có biến lớn. Sếp tổng hoặc khách hàng quan trọng sắp xuống kiểm tra tiến độ. Một luồng gió mới (hoặc áp lực mới) đang tràn vào phòng làm việc của bạn.',
    advice:
      'Hãy chuẩn bị dữ liệu thật kỹ. Minh bạch mọi thông tin, từ tiến độ đến những rủi ro còn tồn đọng. Sự chân thành và chuẩn bị chu đáo sẽ giúp bạn ghi điểm.',
  },
  {
    id: 20,
    binary: '000011',
    name: 'Phong Địa Quan',
    animation: 'Màn hình monitoring dày đặc biểu đồ',
    description:
      'Quan sát sâu sắc. Thay vì cắm đầu vào code, bạn đang ngồi phân tích log, nhìn biểu đồ Grafana để tìm ra tại sao cứ đến 12h đêm là hệ thống lại chậm lại.',
    advice:
      'Dữ liệu không biết nói dối. Hãy tin vào Metrics và Traces hơn là tin vào trực giác của mình. Một chút thời gian quan sát kỹ sẽ giúp bạn tiết kiệm hàng tuần fix bug mò.',
  },
  {
    id: 21,
    binary: '100101',
    name: 'Hỏa Lôi Phệ Hạp',
    animation: 'Bug cứng đầu liên tục bật lại',
    description:
      'Cắn phải đá. Một con Bug cực kỳ "chó má" cứ liên tục xuất hiện dù bạn đã bảo là "Fix rồi". Nó đòi hỏi bạn phải dùng đến những biện pháp mạnh mẽ và kỷ luật nhất.',
    advice:
      'Đừng ngại dùng Debugger soi từng dòng mã máy. Hãy thiết lập một môi trường tái hiện lỗi hoàn hảo. Cắn chặt lấy nó cho đến khi tìm ra nguyên nhân gốc rễ mới thôi.',
  },
  {
    id: 22,
    binary: '101001',
    name: 'Sơn Hỏa Bí',
    animation: 'UI được đánh bóng tinh tế',
    description:
      'Tốt nước sơn hơn tốt gỗ. Giao diện (UI) lung linh, animation mượt mà, màu sắc chuẩn Pantone, nhưng bên dưới là một đống logic rối rắm và nợ kỹ thuật dày đặc.',
    advice:
      'Làm đẹp là cần thiết, nhưng đừng quên giá trị cốt lõi. Hãy dành thời gian để gia cố lại Logic bên dưới. Đừng để người dùng thất vọng khi bấm vào một cái nút đẹp mà chả có gì xảy ra.',
  },
  {
    id: 23,
    binary: '000001',
    name: 'Sơn Địa Bác',
    animation: 'Từng lớp tài nguyên bị cắt giảm',
    description:
      'Gọt bỏ và cắt giảm. Công ty đang trong giai đoạn thắt lưng buộc bụng, nhân sự bị layoff, ngân sách server bị cắt, dự án bị thu hẹp quy mô.',
    advice:
      'Hãy bảo toàn nội lực. Tập trung vào những kỹ năng cốt lõi nhất của bạn. Giữ thái độ tích cực nhưng cũng nên âm thầm cập nhật CV và Portfolio để sẵn sàng cho mọi tình huống.',
  },
  {
    id: 24,
    binary: '100000',
    name: 'Địa Lôi Phục',
    animation: 'Hệ thống reboot và hồi phục',
    description:
      'Sự trở lại của nhà vua. Sau một cú sập nguồn kinh hoàng, hệ thống đã được reboot thành công. Mọi thứ đang dần quay trở lại quỹ đạo ổn định ban đầu.',
    advice:
      'Kiểm tra hậu sự cố thật kỹ. Đừng chủ quan thấy nó chạy lại là xong. Hãy tìm hiểu tại sao nó sập để đảm bảo rằng lần "hồi phục" này là bền vững.',
  },
  {
    id: 25,
    binary: '100111',
    name: 'Thiên Lôi Vô Vọng',
    animation: 'Sự cố từ dịch vụ bên thứ ba',
    description:
      'Tai họa từ trên trời rơi xuống. AWS sập vùng Asia, hay Facebook API đổi policy mà không báo trước. Những việc này hoàn toàn nằm ngoài tầm kiểm soát của bạn.',
    advice:
      'Đừng tự dằn vặt mình. Hãy nhanh chóng xây dựng phương án Fallback, thông báo tình hình rõ ràng cho sếp và khách hàng. Trong cái khó ló cái khôn, hãy tìm hướng đi mới.',
  },
  {
    id: 26,
    binary: '111001',
    name: 'Sơn Thiên Đại Súc',
    animation: 'Kho tri thức kỹ thuật ngày càng lớn',
    description:
      'Tích lũy tri thức lớn. Sau nhiều năm "chinh chiến", bạn đã sở hữu một kho tàng kiến thức đồ sộ, từ thuật toán đến kiến trúc hệ thống, đủ để gánh cả team.',
    advice:
      'Hãy bắt đầu chia sẻ. Viết blog kỹ thuật, làm mentor cho đàn em hoặc đề xuất một chuẩn mực code mới cho công ty. Tri thức chỉ thực sự giá trị khi nó được lan tỏa.',
  },
  {
    id: 27,
    binary: '100001',
    name: 'Sơn Lôi Di',
    animation: 'Team dừng tay để nạp năng lượng',
    description:
      'Chuyện ăn uống và nghỉ ngơi. Cả team đang mải mê order trà sữa, bàn chuyện đi du lịch hay đơn giản là ngủ trưa sau một đêm thức trắng cày deadline.',
    advice:
      'Ăn được ngủ được là tiên. Đừng quá ép xác trước màn hình máy tính. Một cơ thể khỏe mạnh và một tâm trí thoải mái là "phần cứng" quan trọng nhất để chạy "phần mềm".',
  },
  {
    id: 28,
    binary: '011110',
    name: 'Trạch Phong Đại Quá',
    animation: 'Kiến trúc phức tạp vượt nhu cầu thực tế',
    description:
      'Quá tải vì quá giỏi. Bạn đang dùng một kiến trúc Microservices phức tạp chỉ để chạy một trang Landing Page đơn giản. Đây là điển hình của Over-engineering.',
    advice:
      'Hãy quay lại với sự đơn giản. Đừng cố dùng dao mổ trâu để giết kiến. KISS (Keep It Simple, Stupid) là tôn chỉ bạn cần áp dụng ngay lúc này.',
  },
  {
    id: 29,
    binary: '010010',
    name: 'Thuần Khảm',
    animation: 'Con thuyền nhỏ giữa biển Error 500',
    description:
      'Hiểm họa trùng trùng. Bug này chưa xong bug kia đã tới, Client mắng, Sếp giục, Server thì liên tục báo 500. Bạn cảm thấy mình đang chìm giữa biển khơi mù mịt.',
    advice:
      'Dừng lại và hít thở! Đừng cố fix trong trạng thái hoảng loạn. Hãy ngủ một giấc, tắt điện thoại, sau đó quay lại giải quyết từng cái một bằng một cái đầu lạnh.',
  },
  {
    id: 30,
    binary: '101101',
    name: 'Thuần Ly',
    animation: 'Server bốc nhiệt vì traffic tăng vọt',
    description:
      'Rực rỡ và nóng bỏng. Chiến dịch Marketing thành công rực rỡ khiến Traffic tăng vọt ngoài dự kiến. Server đang "toát mồ hôi hột", CPU luôn ở mức 99%.',
    advice:
      'Hãy chủ động điều phối tài nguyên. Bật Auto-scaling, tắt bớt những dịch vụ không cần thiết để ưu tiên cho luồng chính. Sự tỏa sáng cần đi đôi với sự kiểm soát.',
  },
  {
    id: 31,
    binary: '011100',
    name: 'Trạch Sơn Hàm',
    animation: 'Dev và Tester phối hợp nhịp nhàng',
    description:
      'Sự đồng cảm kỳ diệu. Dev hiểu ý Tester, Tester thấu hiểu nỗi khổ của Dev. Hai bên phối hợp nhịp nhàng như một cặp nhảy Tango chuyên nghiệp.',
    advice:
      'Duy trì sự giao tiếp tích cực này. Hãy khen ngợi đồng nghiệp khi họ làm tốt. Một môi trường làm việc thấu hiểu nhau sẽ đẩy chất lượng sản phẩm lên mức tối đa.',
  },
  {
    id: 32,
    binary: '001110',
    name: 'Lôi Phong Hằng',
    animation: 'Bánh xe bảo trì quay đều',
    description:
      'Sự kiên trì bền bỉ. Công việc bảo trì hàng ngày có vẻ nhàm chán (viết docs, dọn log, check security), nhưng nó là nền tảng giúp hệ thống trường tồn.',
    advice:
      'Đừng nản lòng trước những việc lặp đi lặp lại. Hãy tìm cách tự động hóa (Automation) chúng. Sự bền bỉ trong việc nhỏ sẽ dẫn đến thành công ở việc lớn.',
  },
  {
    id: 33,
    binary: '001111',
    name: 'Thiên Sơn Độn',
    animation: 'Chế độ tập trung tránh nhiễu',
    description:
      'Ẩn nấp chờ thời. Đây là lúc bạn cần rút lui khỏi những cuộc tranh luận vô bổ trên mạng hoặc những buổi họp "vô thưởng vô phạt" để tập trung vào việc quan trọng nhất.',
    advice:
      'Bật chế độ Do Not Disturb, đeo tai nghe chống ồn và "biến mất" vào thế giới code của riêng bạn. Rút lui không phải là hèn, mà là để bảo toàn trí tuệ cho nhiệm vụ cao cả.',
  },
  {
    id: 34,
    binary: '111100',
    name: 'Lôi Thiên Đại Tráng',
    animation: 'Trạng thái flow coding bùng nổ',
    description:
      'Chí khí ngút trời. Bạn đang ở trong trạng thái "Flow", code tuôn ra như suối, giải quyết những bài toán hóc búa nhất chỉ trong vài nốt nhạc. Sức mạnh của bạn lúc này là vô địch.',
    advice:
      'Tận dụng đà này để giải quyết các task tồn đọng. Nhưng hãy cẩn thận, đừng vì quá tự tin mà bỏ qua các bước kiểm thử cơ bản. Sức mạnh lớn cần đi kèm trách nhiệm lớn.',
  },
  {
    id: 35,
    binary: '000101',
    name: 'Hỏa Địa Tấn',
    animation: 'Bậc thang nghề nghiệp mở ra',
    description:
      'Tiến bộ vượt bậc. Thành quả lao động của bạn cuối cùng cũng được ghi nhận. Một vị trí mới, một mức lương mới hoặc một dự án "xịn xò" hơn đang chờ đón bạn.',
    advice:
      'Đừng ngủ quên trên chiến thắng. Hãy bắt đầu học những kỹ năng của vị trí cao hơn (như quản lý, thiết kế hệ thống). Càng lên cao, tầm nhìn càng phải rộng.',
  },
  {
    id: 36,
    binary: '101000',
    name: 'Địa Hỏa Minh Di',
    animation: 'Ánh sáng ý tưởng tạm thời bị che phủ',
    description:
      'Ánh sáng bị che lấp. Ý tưởng thiên tài của bạn bị sếp gạt đi, hoặc bạn phải làm một công việc thấp hơn năng lực của mình. Cảm giác như bị kìm hãm tài năng.',
    advice:
      'Hãy "giấu mình chờ thời". Đừng vội vàng phản kháng hay bỏ cuộc. Hãy âm thầm hoàn thiện ý tưởng đó trong bóng tối, chờ ngày đủ nắng hoa sẽ nở.',
  },
  {
    id: 37,
    binary: '101011',
    name: 'Phong Hỏa Gia Nhân',
    animation: 'Home office với nhịp sinh hoạt gia đình',
    description:
      'Việc nhà việc cửa. Những vấn đề gia đình, con cái hoặc không gian làm việc tại nhà (WFH) đang chiếm trọn tâm trí bạn. Sự ổn định ở nhà là gốc rễ của công việc.',
    advice:
      'Hãy sắp xếp lại góc làm việc cho thật chill. Thiết lập ranh giới rõ ràng với người thân để có sự tập trung. Nhà có ấm thì code mới mượt.',
  },
  {
    id: 38,
    binary: '110101',
    name: 'Hỏa Trạch Khuê',
    animation: 'API contract lệch pha giữa hai phía',
    description:
      'Sự khác biệt và mâu thuẫn. Frontend muốn kiểu này, Backend làm kiểu kia. Hai bên không hiểu ý nhau, dẫn đến những màn tranh cãi nảy lửa về Interface.',
    advice:
      'Chấp nhận sự khác biệt và tìm điểm chung. Hãy ngồi lại viết một bản API Contract thật chi tiết. Sự rõ ràng trong giao tiếp sẽ xóa tan mọi sự lệch pha.',
  },
  {
    id: 39,
    binary: '010100',
    name: 'Thủy Sơn Kiển',
    animation: 'Task bị chặn bởi phụ thuộc bên ngoài',
    description:
      'Gian nan vất vả. Task của bạn bị block vì chờ bên Third-party cung cấp tài liệu hoặc chờ một team khác merge code. Càng muốn nhanh lại càng bị chậm.',
    advice:
      'Đừng ngồi không chờ đợi. Hãy tranh thủ làm những task độc lập khác hoặc viết tài liệu, chuẩn bị các kịch bản test. Luôn có cách để tiến lên dù con đường chính bị chặn.',
  },
  {
    id: 40,
    binary: '001010',
    name: 'Lôi Thủy Giải',
    animation: 'Khoảnh khắc bug critical được đóng',
    description:
      'Giải tỏa áp lực. Những mâu thuẫn được tháo gỡ, con Bug nghiêm trọng nhất đã được tiêu diệt. Cả team như vừa trút bỏ được một gánh nặng ngàn cân.',
    advice:
      'Hãy ăn mừng một chút! Sau đó ngồi lại viết Post-mortem để lưu lại kinh nghiệm. Đừng để những sai lầm tương tự lặp lại trong tương lai.',
  },
  {
    id: 41,
    binary: '110001',
    name: 'Sơn Trạch Tổn',
    animation: 'Biểu đồ RAM leo thang vì memory leak',
    description:
      'Sự hao tổn âm thầm. Hệ thống bị Memory Leak, RAM bị ngốn sạch theo thời gian mà không rõ lý do. Đây là lúc phải chấp nhận hy sinh một số tính năng để bảo vệ tổng thể.',
    advice:
      'Hãy rà soát lại Lifecycle của các Object, giải phóng tài nguyên đúng lúc. Đôi khi bớt đi một chút "rườm rà" lại giúp hệ thống chạy nhanh hơn bội phần.',
  },
  {
    id: 42,
    binary: '100011',
    name: 'Phong Lôi Ích',
    animation: 'Hiệu năng tăng mạnh sau tối ưu',
    description:
      'Gia tăng lợi ích. Sau khi áp dụng Caching hoặc tối ưu thuật toán, hiệu năng hệ thống tăng vọt. User hài lòng, sếp khen ngợi, chi phí Server giảm đáng kể.',
    advice:
      'Thừa thắng xông lên! Hãy biến những cải tiến này thành quy chuẩn chung. Khi bạn làm điều tốt cho hệ thống, hệ thống sẽ trả lại lợi ích cho bạn.',
  },
  {
    id: 43,
    binary: '111110',
    name: 'Trạch Thiên Quải',
    animation: 'Nút release toàn cục sáng lên',
    description:
      'Quyết định dứt khoát. Đã đến giờ G, không thể chần chừ thêm nữa. Bạn phải đưa ra quyết định cuối cùng: Release hay không Release?',
    advice:
      'Hãy tin vào Checklist của mình. Nếu mọi thứ đã xanh, hãy mạnh dạn nhấn nút. Sự dứt khoát vào thời điểm then chốt là phẩm chất của một người dẫn dắt.',
  },
  {
    id: 44,
    binary: '011111',
    name: 'Thiên Phong Cấu',
    animation: 'Cảnh báo bảo mật từ thư viện phụ thuộc',
    description:
      'Gặp gỡ bất ngờ. Một lỗ hổng bảo mật nghiêm trọng (như Log4j) đột ngột xuất hiện trong thư viện mà bạn đang dùng. Một mối nguy tiềm ẩn vừa lộ diện.',
    advice:
      'Đừng chủ quan khinh địch. Hãy cập nhật bản vá ngay lập tức. Luôn cảnh giác với những thứ "miễn phí" hoặc những thư viện lạ không rõ nguồn gốc.',
  },
  {
    id: 45,
    binary: '000110',
    name: 'Trạch Địa Tụy',
    animation: 'Dòng dữ liệu hội tụ về trung tâm',
    description:
      'Hội tụ và đoàn kết. Mọi nguồn lực dữ liệu đang đổ về Big Data của bạn. Team đang tập hợp lại để chuẩn bị cho một trận đánh lớn.',
    advice:
      'Hãy tổ chức thật tốt. Một đống dữ liệu lộn xộn chỉ là rác, nhưng nếu được tổ chức bài bản, nó sẽ trở thành kho báu. Đoàn kết là sức mạnh, tổ chức là chìa khóa.',
  },
  {
    id: 46,
    binary: '011000',
    name: 'Địa Phong Thăng',
    animation: 'Thanh level-up trong nghề nghiệp',
    description:
      'Thăng tiến bền vững. Bạn đang đi đúng hướng trên lộ trình nghề nghiệp. Không quá nhanh nhưng chắc chắn, mỗi ngày bạn đều giỏi hơn chính mình hôm qua.',
    advice:
      'Hãy tiếp tục kiên trì. Đừng vì một chút thành công mà kiêu ngạo. Hãy tìm kiếm một Mentor giỏi để dẫn dắt bạn lên những đỉnh cao mới.',
  },
  {
    id: 47,
    binary: '010110',
    name: 'Trạch Thủy Khốn',
    animation: 'Đèn báo burn-out chớp đỏ',
    description:
      'Khốn cùng và mệt mỏi. Bạn bị kẹt trong đống Bug không lối thoát, deadline sát nút mà đầu óc trống rỗng. Đây là trạng thái Burn-out điển hình.',
    advice:
      'Hãy dừng lại! Code thêm lúc này chỉ tạo ra thêm Bug. Đi ngủ, đi nhậu hoặc đi xem phim. Hãy giải thoát tâm trí mình trước khi giải cứu hệ thống.',
  },
  {
    id: 48,
    binary: '011010',
    name: 'Thủy Phong Tỉnh',
    animation: 'Giếng nước ổn định nuôi hệ thống lâu dài',
    description:
      'Cái giếng tri thức. Hệ thống của bạn đã đi vào ổn định, phục vụ người dùng âm thầm như dòng nước giếng mát lành. Ai cần thì đến lấy, không ồn ào nhưng vô giá.',
    advice:
      'Bảo trì và gìn giữ. Đừng cố "đào thêm" hay "lấp đi" cái giếng đang hoạt động tốt. Sự ổn định là thứ quý giá nhất trong thế giới công nghệ đầy biến động.',
  },
  {
    id: 49,
    binary: '101110',
    name: 'Trạch Hỏa Cách',
    animation: 'Bảng tech stack chuyển sang thế hệ mới',
    description:
      'Cuộc cách mạng công nghệ. Đã đến lúc bỏ jQuery để sang React, bỏ Monolith để sang Microservices. Một sự thay đổi triệt để về tư duy và công cụ.',
    advice:
      'Đừng sợ hãi cái mới. Hãy lập một kế hoạch Migration thật chi tiết, đào tạo đội ngũ bài bản. Cuộc cách mạng thành công sẽ mang lại một sức sống hoàn toàn mới.',
  },
  {
    id: 50,
    binary: '011101',
    name: 'Hỏa Phong Đỉnh',
    animation: 'Kiến trúc hệ thống đứng vững như đỉnh trụ',
    description:
      'Quẻ của sự vững chãi. Kiến trúc hệ thống của bạn tuyệt vời đến mức có thể chịu tải gấp 10 lần hiện tại. Bạn đang nắm trong tay một "bảo vật" thực sự.',
    advice:
      'Hãy giữ vững vị thế này. Đây là lúc để scale dự án ra thị trường lớn hơn. Khi cái "đỉnh" đã vững, bạn có thể nấu bất cứ món ngon (feature) nào cho người dùng.',
  },
  {
    id: 51,
    binary: '001001',
    name: 'Thuần Chấn',
    animation: 'Notification dồn dập như sấm sét',
    description:
      'Sấm vang chớp giật. Notification nổ liên tục trên Slack, khách hàng gọi điện cháy máy vì một lỗi hệ thống nghiêm trọng. Cả công ty đang rúng động.',
    advice:
      'Bình tĩnh! Sấm sét có vang nhưng không kéo dài. Hãy tập trung xử lý sự cố gốc, đừng để tiếng ồn xung quanh làm bạn rối trí. Sau cơn mưa trời lại sáng.',
  },
  {
    id: 52,
    binary: '100100',
    name: 'Thuần Cấn',
    animation: 'Nút pause bật lên giữa guồng quay',
    description:
      'Dừng chân tại chỗ. Có những lúc bạn cần phải nói "Không" với những yêu cầu mới. Hệ thống cần thời gian để "thở" và ổn định thay vì cứ nạp thêm tính năng.',
    advice:
      'Hãy biết giới hạn của mình. Đừng ôm đồm quá nhiều thứ cùng lúc. Sự tĩnh lặng lúc này sẽ giúp bạn nhìn thấy những vấn đề mà lúc bận rộn bạn đã bỏ qua.',
  },
  {
    id: 53,
    binary: '001011',
    name: 'Phong Sơn Tiệm',
    animation: 'Thanh tiến độ tăng chậm mà chắc',
    description:
      'Tiến triển từ từ. Dự án không có những cú bứt phá chấn động nhưng tiến độ luôn đảm bảo, mỗi ngày đều hoàn thành một vài ticket. Một sự tăng trưởng rất lành mạnh.',
    advice:
      'Dục tốc bất đạt. Cứ giữ nhịp độ này, đừng vì nôn nóng mà đốt cháy giai đoạn. Thành công lớn là tổng hòa của những bước đi nhỏ đúng hướng.',
  },
  {
    id: 54,
    binary: '110100',
    name: 'Lôi Trạch Quy Muội',
    animation: 'Vai trò và năng lực lệch nhau',
    description:
      'Sai lầm trong sắp đặt. Bạn bị phân vào một task không đúng chuyên môn, hoặc tuyển nhầm một người không phù hợp vào team. Mọi thứ đang chạy một cách gượng ép.',
    advice:
      'Hãy mạnh dạn điều chỉnh. Thẳng thắn thừa nhận nếu task quá sức hoặc không phù hợp. Đặt đúng người vào đúng việc là cách tốt nhất để cứu vãn tình hình.',
  },
  {
    id: 55,
    binary: '101100',
    name: 'Lôi Hỏa Phong',
    animation: 'Bản phát hành đầy đủ tính năng',
    description:
      'Thời kỳ cực thịnh. Sản phẩm của bạn đang ở đỉnh cao, tính năng phong phú, người dùng đông đảo, doanh thu ấn tượng. Một cảm giác mãn nguyện bao trùm.',
    advice:
      'Cảnh giác với sự suy tàn sau đỉnh cao. Hãy bắt đầu nghiên cứu thế hệ sản phẩm tiếp theo. Đừng ngủ quên quá lâu trong ánh hào quang rực rỡ hiện tại.',
  },
  {
    id: 56,
    binary: '001101',
    name: 'Hỏa Sơn Lữ',
    animation: 'Lập trình viên di chuyển giữa nhiều môi trường',
    description:
      'Thân phận lữ hành. Bạn phải liên tục di chuyển giữa các dự án khác nhau, hoặc làm việc ở nhiều môi trường (Dev, Staging, UAT, Prod) lạ lẫm.',
    advice:
      'Hãy thích nghi nhanh chóng. Giữ cho mình một bộ "đồ nghề" (script, công cụ) linh hoạt để có thể code ở bất cứ đâu. Sự linh động là thế mạnh lớn nhất của bạn lúc này.',
  },
  {
    id: 57,
    binary: '011011',
    name: 'Thuần Tốn',
    animation: 'Luồng tối ưu nhẹ mà sâu',
    description:
      'Thuận theo tự nhiên. Giải pháp của bạn nhẹ nhàng, luồn lách qua các khe hẹp của hệ thống để tối ưu hiệu năng một cách tinh tế nhất. Như cơn gió mát thổi qua dòng code.',
    advice:
      'Hãy tiếp tục sự mềm mỏng và tinh tế đó. Đừng cố dùng bạo lực (brute-force) để giải quyết vấn đề. Một chút khéo léo sẽ mang lại kết quả bất ngờ.',
  },
  {
    id: 58,
    binary: '110110',
    name: 'Thuần Đoài',
    animation: 'Buổi demo thành công với nhiều nụ cười',
    description:
      'Vui vẻ và hài lòng. Buổi Demo sản phẩm nhận được những tràng pháo tay tán thưởng. Khách hàng cười tươi, team phấn khởi vì công sức được đền đáp.',
    advice:
      'Hãy tận hưởng niềm vui này cùng đồng đội. Nhưng nhớ đừng vì quá vui mà hứa thêm những feature không tưởng trong tương lai. Hãy giữ lời hứa thực tế.',
  },
  {
    id: 59,
    binary: '010011',
    name: 'Phong Thủy Hoán',
    animation: 'Đội ngũ tách ra hỗ trợ nhiều mặt trận',
    description:
      'Tan tác và giải tán. Dự án kết thúc, team mỗi người một ngả đi hỗ trợ các team khác. Cảm giác hụt hẫng khi những người gắn bó bấy lâu nay không còn ngồi cạnh.',
    advice:
      'Coi đây là cơ hội để học hỏi từ những môi trường mới. Giữ liên lạc với đồng đội cũ, mạng lưới (network) của bạn đang được mở rộng đấy.',
  },
  {
    id: 60,
    binary: '110010',
    name: 'Thủy Trạch Tiết',
    animation: 'Cổng API bật giới hạn truy cập',
    description:
      'Biết đủ là đủ. Bạn cần thiết lập Rate Limit cho API hoặc giới hạn số lượng Task nhận vào mỗi Sprint. Sự tiết chế giúp hệ thống và con người không bị quá tải.',
    advice:
      'Hãy nói "Không" một cách nghệ thuật. Giới hạn giúp chúng ta tập trung vào chất lượng hơn là số lượng. Một dự án có chừng mực là một dự án bền vững.',
  },
  {
    id: 61,
    binary: '110011',
    name: 'Phong Trạch Trung Phu',
    animation: 'Người dùng đặt niềm tin vào sản phẩm',
    description:
      'Lấy lòng tin làm gốc. Người dùng tin tưởng giao dữ liệu và tiền bạc cho hệ thống của bạn. Đây là một trách nhiệm cực kỳ lớn lao.',
    advice:
      'Đừng bao giờ phản bội niềm tin đó. Hãy ưu tiên bảo mật và quyền riêng tư lên hàng đầu. Một hệ thống có tâm sẽ luôn có được những người dùng trung thành.',
  },
  {
    id: 62,
    binary: '001100',
    name: 'Lôi Sơn Tiểu Quá',
    animation: 'Một lỗi nhỏ nhưng dễ lan rộng',
    description:
      'Sai sót nhỏ ở chi tiết. Một lỗi Typo trong nội dung email gửi khách hàng, hoặc một lỗi UI nhỏ ở góc màn hình. Dù nhỏ nhưng nó ảnh hưởng đến sự chuyên nghiệp.',
    advice:
      'Hotfix ngay lập tức! Đừng để những hạt sạn nhỏ làm hỏng cả một bữa tiệc lớn. Hãy chú trọng hơn vào khâu Review nội dung và hình ảnh.',
  },
  {
    id: 63,
    binary: '101010',
    name: 'Thủy Hỏa Ký Tế',
    animation: 'Pizza tới đúng giờ, pipeline chuyển xanh',
    description:
      'Mọi việc đã xong xuôi. Dự án đã go-live thành công, bug đã fix sạch, tiền bonus đã về tài khoản. Một cảm giác viên mãn và trọn vẹn.',
    advice:
      'Đừng lơ là cảnh giác. Trong cái thành công hôm nay đã nhen nhóm những vấn đề của ngày mai. Hãy chuẩn bị tâm thế cho những thử thách mới sắp tới.',
  },
  {
    id: 64,
    binary: '010101',
    name: 'Hỏa Thủy Vị Tế',
    animation: 'Checklist còn dang dở ở bước cuối',
    description:
      'Chưa xong đâu nhé! Tưởng là xong nhưng thực ra vẫn còn một vài Checklist chưa hoàn thiện, hoặc Client vừa nghĩ ra một "thay đổi nhỏ" vào phút chót.',
    advice:
      'Kiên trì đi đến cùng. Đừng bỏ cuộc ở mét cuối cùng của đường chạy. Hãy hoàn thành nốt những chi tiết nhỏ nhất để có một kết thúc thực sự trọn vẹn.',
  },
]

export const HEXAGRAMS_BY_BINARY: Record<string, Hexagram> = HEXAGRAMS.reduce<
  Record<string, Hexagram>
>((accumulator, hexagram) => {
  accumulator[hexagram.binary] = hexagram
  return accumulator
}, {})

export function findHexagramByBinary(binary: string): Hexagram | null {
  return HEXAGRAMS_BY_BINARY[binary] ?? null
}
