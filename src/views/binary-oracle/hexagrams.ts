import type { Hexagram } from './types'

export const HEXAGRAMS: Hexagram[] = [
  {
    id: 1,
    binary: '111111',
    name: 'Thuần Càn',
    symbol: '䷀',
    type: 'Quẻ Đại Cát',
    description:
      'Tượng trưng cho Trời, mang đức tính cương kiện, mạnh mẽ và sáng tạo vô biên. Đây là quẻ thuần dương, đại diện cho bậc quân tử, người lãnh đạo hoặc sự khởi đầu vĩ đại. Mọi việc đang ở thời kỳ cực thịnh, như rồng bay trên trời cao, ánh sáng soi thấu khắp nơi.',
    advice:
      'Hãy giữ vững lòng kiên trì và chính đạo. Cần nhận thức rằng cực thịnh dễ dẫn đến suy vi (vật cực tất phản), do đó phải luôn khiêm tốn, không được kiêu ngạo hay chủ quan. Đây là lúc để hành động mạnh mẽ nhưng phải có kế hoạch thận trọng.',
  },
  {
    id: 2,
    binary: '000000',
    name: 'Thuần Khôn',
    symbol: '䷁',
    type: 'Quẻ Đại Cát',
    description:
      'Tượng trưng cho Đất, mang đức nhu thuận, bao dung và nâng đỡ vạn vật. Đây là quẻ thuần âm, đại diện cho người mẹ, bề tôi hoặc sự hỗ trợ âm thầm. Khôn đại diện cho sự tĩnh lặng, sự phục tùng theo lẽ phải để đạt được thành công bền vững.',
    advice:
      'Đừng cố gắng đứng đầu hay dẫn dắt trong thời gian này, hãy đóng vai trò là người hỗ trợ hoặc người thực thi. Thành công đến từ sự nhẫn nại, dịu dàng và lòng bao dung. Hãy thuận theo tự nhiên và đi theo sau người có kinh nghiệm.',
  },
  {
    id: 3,
    binary: '100010',
    name: 'Thủy Lôi Truân',
    symbol: '䷂',
    type: 'Quẻ Hung',
    description:
      'Tượng trưng cho sự gian nan lúc mới bắt đầu. Sấm động trong nước, vạn vật mới nảy mầm còn non yếu đã gặp phải hiểm nguy. Đây là giai đoạn hỗn loạn, đầy rào cản nhưng ẩn chứa mầm mống của sự sinh trưởng mãnh liệt.',
    advice:
      'Không nên vội vã tiến lên hay khởi sự lớn ngay lập tức. Cần tìm kiếm sự trợ giúp từ những người có uy tín (quý nhân). Hãy kiên nhẫn tích lũy nguồn lực, chỉnh đốn nội bộ và chờ đợi thời cơ khi sự hỗn loạn lắng xuống.',
  },
  {
    id: 4,
    binary: '010001',
    name: 'Sơn Thủy Mông',
    symbol: '䷃',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho sự non nớt, mờ mịt, giống như suối mới chảy ra dưới chân núi, chưa rõ đường đi. Đây là thời kỳ của sự thiếu kinh nghiệm, cần được giáo dục, khai sáng và dẫn dắt để thoát khỏi sự u mê.',
    advice:
      'Hãy giữ thái độ thành tâm và khiêm nhường khi cầu học. Thành công chỉ đến khi bạn sẵn sàng lắng nghe và học hỏi từ những người đi trước. Tránh sự nóng nảy hay tự phụ vì sự thiếu hiểu biết sẽ dẫn đến sai lầm.',
  },
  {
    id: 5,
    binary: '111010',
    name: 'Thủy Thiên Nhu',
    symbol: '䷄',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự chờ đợi trong tin tưởng. Phía trước có hiểm nguy (nước) nhưng dưới chân là nền tảng vững chắc (trời). Đây là lúc cần sự kiên nhẫn, không nên mạo hiểm vượt sông khi chưa đủ điều kiện.',
    advice:
      'Hãy dùng thời gian này để nghỉ ngơi, ăn uống bồi bổ và củng cố tinh thần. Đừng nóng vội trước khó khăn, hãy để mọi thứ diễn biến tự nhiên. Sự kiên định và lòng tin sẽ giúp bạn vượt qua hiểm nguy một cách bình an.',
  },
  {
    id: 6,
    binary: '010111',
    name: 'Thiên Thủy Tụng',
    symbol: '䷅',
    type: 'Quẻ Hung',
    description:
      'Tượng trưng cho sự tranh chấp, kiện tụng và bất hòa. Do quan điểm trái ngược (Trời đi lên, Nước chảy xuống) nên không thể gặp nhau, dẫn đến mâu thuẫn. Càng cố chấp theo đuổi thắng thua thì càng gặp tai họa.',
    advice:
      'Nên dừng lại và tìm cách hòa giải sớm nhất có thể. Dù bạn có lý, việc kéo dài tranh chấp cũng mang lại sự mệt mỏi và tổn thất. Hãy tìm người trung gian có uy tín để phân xử và chấp nhận nhượng bộ để đổi lấy sự bình yên.',
  },
  {
    id: 7,
    binary: '010000',
    name: 'Địa Thủy Sư',
    symbol: '䷆',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho quân đội và sự huy động sức mạnh tập thể. Nước ẩn trong lòng đất đại diện cho sức mạnh tiềm tàng nhưng cần sự tổ chức chặt chẽ, kỷ luật nghiêm minh để đạt được mục tiêu.',
    advice:
      'Để thành công, bạn cần sự đoàn kết và một người lãnh đạo có tài, có đức. Hãy chú trọng vào việc xây dựng kỷ luật và sự minh bạch trong tổ chức. Mọi hành động phải dựa trên chính nghĩa mới có thể thu phục được lòng người.',
  },
  {
    id: 8,
    binary: '000010',
    name: 'Thủy Địa Tỷ',
    symbol: '䷇',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự thân thiện, liên kết và chọn lựa đồng minh. Nước trên mặt đất hòa quyện, hỗ trợ lẫn nhau. Đây là thời cơ tốt để tạo dựng các mối quan hệ xã hội và tìm kiếm sự đồng thuận.',
    advice:
      'Hãy chủ động tìm kiếm sự hợp tác nhưng cần chọn lọc đối phương một cách kỹ lưỡng. Sự chân thành là chìa khóa để giữ vững các liên kết. Người đến muộn hoặc thiếu lòng tin sẽ gặp khó khăn, hãy nhanh chóng quyết định.',
  },
  {
    id: 9,
    binary: '111011',
    name: 'Phong Thiên Tiểu Súc',
    symbol: '䷈',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho sự tích lũy nhỏ, mây kéo đến nhưng chưa mưa. Sức mạnh chưa đủ để tạo nên thay đổi lớn lao, giống như gió thổi trên trời cao nhưng không thể giữ chân được mây lâu.',
    advice:
      'Cần kiên nhẫn tích tiểu thành đại. Đây không phải là lúc để thực hiện những kế hoạch tham vọng. Hãy tập trung hoàn thiện những chi tiết nhỏ, cải thiện bản thân và chờ đợi nguồn lực đủ mạnh để bứt phá.',
  },
  {
    id: 10,
    binary: '110111',
    name: 'Thiên Trạch Lý',
    symbol: '䷉',
    type: 'Quẻ Cát',
    description:
      "Tượng trưng cho phép tắc, lễ nghi và cách hành xử. Hình ảnh 'dẫm lên đuôi hổ' nhưng hổ không cắn cho thấy nếu biết giữ lễ, cẩn trọng và khéo léo thì dù ở trong tình thế nguy hiểm vẫn có thể thoát ra an toàn.",
    advice:
      'Hãy giữ thái độ cung kính, tuân thủ đúng quy tắc và chuẩn mực đạo đức. Sự chân thành và cách ứng xử tinh tế sẽ giúp bạn vượt qua những rào cản khó khăn nhất mà không gây xung đột với người có quyền thế.',
  },
  {
    id: 11,
    binary: '111000',
    name: 'Địa Thiên Thái',
    symbol: '䷊',
    type: 'Quẻ Đại Cát',
    description:
      'Tượng trưng cho sự giao hòa tuyệt vời giữa trời và đất. Khí dương đi lên, khí âm đi xuống gặp nhau tạo nên sự hanh thông, thái bình và thịnh vượng. Đây là thời điểm vạn vật sinh sôi, lòng người đồng thuận.',
    advice:
      "Hãy tận dụng tối đa thời cơ này để triển khai các kế hoạch lớn. Tuy nhiên, phải luôn ghi nhớ câu 'hết thái đến bĩ', không được hưởng lạc quá đà mà quên việc chuẩn bị cho những giai đoạn khó khăn có thể quay lại.",
  },
  {
    id: 12,
    binary: '000111',
    name: 'Thiên Địa Bĩ',
    symbol: '䷋',
    type: 'Quẻ Đại Hung',
    description:
      'Tượng trưng cho sự bế tắc, không thông suốt. Trời đất không giao hòa, kẻ xấu lấn át người tốt, thông tin bị cắt đứt. Mọi nỗ lực trong giai đoạn này thường không đem lại kết quả như ý.',
    advice:
      'Nên thu mình ẩn dật, kiên nhẫn giữ vững đạo đức cá nhân. Đừng cố gắng thay đổi hoàn cảnh một cách cưỡng ép vì sẽ chỉ chuốc lấy thất bại. Hãy chờ đợi cho đến khi thời vận đen tối này qua đi.',
  },
  {
    id: 13,
    binary: '101111',
    name: 'Thiên Hỏa Đồng Nhân',
    symbol: '䷌',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự đoàn kết và tinh thần cộng đồng. Lửa rực sáng dưới trời, soi chiếu sự đồng lòng của mọi người. Đây là quẻ tốt cho việc hội họp, thành lập hội nhóm hoặc hợp tác kinh doanh.',
    advice:
      'Hãy mở rộng lòng mình và hành xử công khai, minh bạch. Đừng vì lợi ích cá nhân mà bỏ qua lợi ích chung. Sự đại đồng và vô tư sẽ mang lại thành công vang dội và sự ủng hộ từ đám đông.',
  },
  {
    id: 14,
    binary: '111101',
    name: 'Hỏa Thiên Đại Hữu',
    symbol: '䷍',
    type: 'Quẻ Đại Cát',
    description:
      'Tượng trưng cho sự giàu có, sở hữu lớn lao. Mặt trời trên cao soi sáng vạn vật, mang lại sự rực rỡ và thịnh vượng. Bạn đang sở hữu nguồn lực, uy tín hoặc tài sản đáng kể.',
    advice:
      'Giàu sang đi đôi với trách nhiệm. Hãy dùng quyền lực và tài sản của mình để giúp đỡ người khác và ngăn chặn điều ác. Sự khiêm tốn lúc này là vô cùng quan trọng để bảo vệ thành quả khỏi sự đố kỵ.',
  },
  {
    id: 15,
    binary: '001000',
    name: 'Địa Sơn Khiêm',
    symbol: '䷎',
    type: 'Quẻ Đại Cát',
    description:
      'Tượng trưng cho đức tính khiêm tốn. Núi cao vốn vĩ đại nhưng lại nằm dưới đất phẳng. Đây là quẻ duy nhất trong Kinh Dịch mà cả 6 hào đều tốt, khẳng định giá trị bền vững của sự nhún nhường.',
    advice:
      'Hãy giữ thái độ khiêm nhường trong mọi tình huống. Càng có tài năng hay thành công thì càng phải tôn trọng người khác. Sự khiêm tốn không làm bạn yếu đi mà tạo nên sức mạnh nội tâm cực lớn và sự an toàn tuyệt đối.',
  },
  {
    id: 16,
    binary: '000100',
    name: 'Lôi Địa Dự',
    symbol: '䷏',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự vui vẻ, chuẩn bị và nhiệt huyết. Sấm nổ trên mặt đất mang lại sự phấn chấn, lay động lòng người. Đây là thời điểm thích hợp để tổ chức các hoạt động văn hóa, giải trí hoặc bắt đầu dự án mới.',
    advice:
      'Hãy lan tỏa niềm vui và sự lạc quan đến mọi người xung quanh. Tuy nhiên, đừng quá chìm đắm trong hưởng lạc mà quên đi việc dự phòng cho tương lai. Sự hào hứng cần đi kèm với kế hoạch cụ thể.',
  },
  {
    id: 17,
    binary: '100110',
    name: 'Trạch Lôi Tùy',
    symbol: '䷐',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự thuận theo tự nhiên và tùy thời ứng biến. Sấm ở trong đầm lầy, đại diện cho việc biết nghỉ ngơi và đi theo tiếng gọi của thời đại hoặc nhu cầu của số đông.',
    advice:
      'Đừng cố chấp với những kế hoạch cũ kỹ nếu hoàn cảnh đã thay đổi. Hãy quan sát xu hướng và học cách thích nghi. Đi theo lẽ phải và người có đức sẽ mang lại kết quả thuận lợi mà không tốn quá nhiều sức lực.',
  },
  {
    id: 18,
    binary: '011001',
    name: 'Sơn Phong Cổ',
    symbol: '䷑',
    type: 'Quẻ Hung',
    description:
      'Tượng trưng cho sự đổ nát, thối rữa do trì trệ lâu ngày (sâu mọt đục khoét). Những vấn đề từ quá khứ đang gây hậu quả hiện tại, đòi hỏi một cuộc cải cách triệt để.',
    advice:
      "Đây là lúc phải dũng cảm đối mặt với sai lầm và dọn dẹp những 'đống đổ nát'. Hãy lập kế hoạch cải tổ một cách quyết liệt nhưng có lộ trình (3 ngày trước và 3 ngày sau khởi sự). Đừng chần chừ thêm nữa.",
  },
  {
    id: 19,
    binary: '110000',
    name: 'Địa Trạch Lâm',
    symbol: '䷒',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự tiến đến, giám sát và phát triển. Giống như mùa xuân đang đến gần, năng lượng tích cực đang dâng cao. Bậc bề trên đang quan tâm và dìu dắt kẻ dưới một cách bao dung.',
    advice:
      "Hãy nắm bắt cơ hội để mở rộng và phát triển mạnh mẽ. Tuy nhiên, quẻ cũng cảnh báo 'đến tháng thứ 8 sẽ có hung', nghĩa là thành công này không vĩnh cửu, cần lo liệu trước cho lúc thoái trào.",
  },
  {
    id: 20,
    binary: '000011',
    name: 'Phong Địa Quán',
    symbol: '䷓',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho sự quan sát và làm gương. Gió thổi trên mặt đất, đi khắp nơi để quan sát và cũng để mọi người thấy. Đây là lúc cần tĩnh lặng để suy ngẫm về bản thân và thế giới.',
    advice:
      'Hãy dừng các hành động vội vã để chiêm nghiệm. Đây là thời gian tốt cho việc nghiên cứu, học tập hoặc tu dưỡng tinh thần. Hãy chú trọng vào hình ảnh và uy tín cá nhân vì mọi người đang quan sát bạn.',
  },
  {
    id: 21,
    binary: '100101',
    name: 'Hỏa Lôi Phệ Hạp',
    symbol: '䷔',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho việc cắn đứt vật cản giữa hai hàm răng. Trong cuộc sống, đây là hình ảnh của pháp luật, hình phạt và sự giải quyết dứt điểm các chướng ngại vật để lập lại sự công bằng.',
    advice:
      'Cần hành động quyết đoán, không được nhu nhược. Nếu có tranh chấp hoặc rào cản, hãy dùng lý trí và luật lệ để giải quyết tận gốc. Sự nghiêm minh và minh bạch sẽ giúp mọi thứ trở lại quỹ đạo.',
  },
  {
    id: 22,
    binary: '101001',
    name: 'Sơn Hỏa Bí',
    symbol: '䷕',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho sự trang sức, vẻ đẹp bề ngoài và nghệ thuật. Lửa sáng dưới chân núi làm cảnh vật thêm lung linh nhưng chỉ là vẻ đẹp phù hoa, không thay đổi được bản chất cốt lõi.',
    advice:
      'Hãy chú trọng đến hình thức và cách trình bày để tạo ấn tượng tốt. Tuy nhiên, không nên quá lạm dụng vẻ ngoài mà bỏ quên giá trị thực chất bên trong. Chỉ nên dùng vẻ đẹp này để hỗ trợ cho những việc nhỏ.',
  },
  {
    id: 23,
    binary: '000001',
    name: 'Sơn Địa Bác',
    symbol: '䷖',
    type: 'Quẻ Đại Hung',
    description:
      'Tượng trưng cho sự tan rã, bóc tách và suy tàn cực độ. Núi cao bị xói mòn sắp sụp xuống đất. Kẻ tiểu nhân đang chiếm ưu thế tuyệt đối, nền tảng đang lung lay dữ dội.',
    advice:
      "Tuyệt đối không nên tiến hành bất cứ kế hoạch nào. Hãy giữ mình, ẩn nấp và chờ đợi. Đây là lúc 'im lặng là vàng'. Hãy chú trọng bảo vệ những gì còn lại và chờ đợi quy luật của tự nhiên làm thay đổi thời thế.",
  },
  {
    id: 24,
    binary: '100000',
    name: 'Địa Lôi Phục',
    symbol: '䷗',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự quay trở lại, hồi sinh của dương khí sau thời kỳ tăm tối. Mầm sống bắt đầu nảy nở trong lòng đất. Đây là điểm khởi đầu của một chu kỳ mới tốt đẹp hơn.',
    advice:
      'Hãy tiến lên một cách từ tốn, không nên vội vã bùng nổ ngay. Quá trình phục hồi cần thời gian. Hãy rà soát lại những bài học cũ để áp dụng vào hành trình mới. Sự tự tin sẽ dần được củng cố.',
  },
  {
    id: 25,
    binary: '100111',
    name: 'Thiên Lôi Vô Vọng',
    symbol: '䷘',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho sự chân thành, tự nhiên và không vọng động. Hành động đúng với quy luật trời đất, không mưu cầu tư lợi thì sẽ không gặp tai họa. Sự vô tình có thể mang lại kết quả bất ngờ.',
    advice:
      'Hãy làm việc với cái tâm trong sáng nhất, không toan tính thiệt hơn. Đừng cố gắng điều khiển kết quả theo ý mình. Nếu hành xử ngay thẳng mà vẫn gặp rủi ro, đó là do định mệnh, hãy bình thản đón nhận.',
  },
  {
    id: 26,
    binary: '111001',
    name: 'Sơn Thiên Đại Súc',
    symbol: '䷙',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự tích lũy lớn lao về đạo đức, tài sản và kiến thức. Sức mạnh to lớn của Trời được chứa đựng trong lòng Núi vững chãi. Đây là lúc năng lượng đã chín muồi để làm những việc phi thường.',
    advice:
      'Hãy tự tin thực hiện những dự án lớn hoặc đi xa (vượt sông lớn). Hãy sử dụng những kinh nghiệm và nguồn lực đã tích lũy bấy lâu để khẳng định vị thế của mình. Sự kiên định sẽ dẫn đến thành công vang dội.',
  },
  {
    id: 27,
    binary: '100001',
    name: 'Sơn Lôi Di',
    symbol: '䷚',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho việc nuôi dưỡng. Hình ảnh hàm răng đang nhai, nhắc nhở về việc ăn uống (thể chất) và lời nói, tư tưởng (tinh thần). Cách bạn nuôi mình và nuôi người phản ánh tư cách của bạn.',
    advice:
      'Hãy cẩn trọng trong lời nói và tiết độ trong ăn uống. Chú ý trau dồi tri thức và đạo đức. Nếu bạn đang dẫn dắt người khác, hãy đảm bảo rằng bạn cung cấp cho họ những giá trị tích cực và đúng đắn.',
  },
  {
    id: 28,
    binary: '011110',
    name: 'Trạch Phong Đại Quá',
    symbol: '䷛',
    type: 'Quẻ Hung',
    description:
      'Tượng trưng cho sự quá tải, gánh nặng vượt mức chịu đựng. Cột nhà quá yếu so với mái quá nặng, tình thế đang ở ngưỡng cực đoan, dễ dẫn đến đổ vỡ nếu không xử lý kịp thời.',
    advice:
      'Cần một sự quyết đoán phi thường hoặc một giải pháp đột phá để thoát khỏi áp lực. Đừng sợ hãi khi phải đứng một mình chống lại đám đông. Hãy tìm cách giảm bớt gánh nặng ngay lập tức trước khi mọi thứ sụp đổ.',
  },
  {
    id: 29,
    binary: '010010',
    name: 'Thuần Khảm',
    symbol: '䷜',
    type: 'Quẻ Đại Hung',
    description:
      'Tượng trưng cho sự nguy hiểm trùng trùng, vực thẳm này nối tiếp vực thẳm khác. Giống như dòng nước chảy vào chỗ hiểm, đòi hỏi sự dũng cảm và lòng tin sắt đá mới có thể vượt qua.',
    advice:
      'Giữ vững lòng tin và sự chân thành. Đừng sợ hãi khó khăn mà hãy học cách linh hoạt như nước, len lỏi qua các khe hở để thoát ra. Tuyệt đối không được dừng lại hay bỏ cuộc trong lúc nguy nan này.',
  },
  {
    id: 30,
    binary: '101101',
    name: 'Thuần Ly',
    symbol: '䷝',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự rực rỡ, sáng suốt và sự bám víu. Lửa cần có củi để cháy, người cần có lý tưởng hoặc chỗ dựa đúng đắn để tỏa sáng. Đây là thời điểm của trí tuệ và sự thấu suốt.',
    advice:
      'Hãy tìm cho mình một chỗ dựa vững chắc (người thầy, đạo lý, hoặc tổ chức tốt). Tránh sự nóng nảy, đốt cháy giai đoạn. Sự dịu dàng và sáng suốt như ánh mặt trời sẽ mang lại sự thành công lâu bền.',
  },
  {
    id: 31,
    binary: '001110',
    name: 'Trạch Sơn Hàm',
    symbol: '䷞',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự cảm thông và giao cảm giữa hai tâm hồn. Hồ nước trên đỉnh núi, âm dương tương ứng tạo nên sức hút tự nhiên. Đây là quẻ rất tốt cho tình yêu, hôn nhân và các mối quan hệ đối tác.',
    advice:
      'Hãy giữ lòng chân thành và cởi mở để đón nhận sự kết nối. Đừng dùng mưu mẹo, hãy để mọi thứ diễn ra tự nhiên dựa trên sự thấu hiểu lẫn nhau. Sự chân thành sẽ dẫn đến một mối quan hệ bền chặt.',
  },
  {
    id: 32,
    binary: '011100',
    name: 'Lôi Phong Hằng',
    symbol: '䷟',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự bền vững, lâu dài và kiên định. Sấm và Gió luôn đồng hành cùng nhau. Đây là đức tính của sự chung thủy, duy trì nề nếp và kế hoạch đã đề ra.',
    advice:
      'Đừng thay đổi mục tiêu hay phương pháp lúc này. Thành công đến từ sự kiên trì bền bỉ theo đuổi con đường đã chọn. Hãy giữ vững đạo đức và kỷ luật, sự nóng vội muốn thay đổi sẽ chỉ mang lại thất bại.',
  },
  {
    id: 33,
    binary: '001111',
    name: 'Thiên Sơn Độn',
    symbol: '䷠',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho sự ẩn nấp, rút lui để bảo toàn lực lượng. Trời cao lánh xa Núi, khi kẻ xấu đang mạnh lên, người quân tử biết rút lui đúng lúc không phải là hèn nhát mà là sự sáng suốt.',
    advice:
      'Hãy biết khi nào nên dừng lại và rút lui. Đừng cố gắng đối đầu trực diện khi thời thế không ủng hộ. Việc rút lui này giúp bạn có thời gian tu dưỡng và chờ đợi thời cơ phục thù trong tương lai.',
  },
  {
    id: 34,
    binary: '111100',
    name: 'Lôi Thiên Đại Tráng',
    symbol: '䷡',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sức mạnh to lớn, sự thịnh vượng và uy thế. Sấm nổ vang trời, đại diện cho năng lượng đang ở mức cao nhất, có thể làm rung chuyển mọi thứ.',
    advice:
      'Có sức mạnh nhưng phải biết tự kiềm chế (dùng lễ để chế ngự sức mạnh). Đừng cậy thế mà làm điều càn quấy hoặc quá tự tin dẫn đến sa ngã. Sức mạnh thực sự nằm ở việc biết dừng đúng lúc.',
  },
  {
    id: 35,
    binary: '000101',
    name: 'Hỏa Địa Tấn',
    symbol: '䷢',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự tiến bộ rực rỡ, như mặt trời vừa mọc lên khỏi mặt đất, xua tan bóng tối. Bạn đang nhận được sự tin tưởng, thăng tiến và phần thưởng xứng đáng.',
    advice:
      'Hãy tiếp tục phát huy năng lực và sự chính trực của mình. Đây là lúc để tỏa sáng và nhận lấy những trọng trách mới. Hãy đối xử tử tế với cấp dưới và trung thành với cấp trên để giữ vững vị thế.',
  },
  {
    id: 36,
    binary: '101000',
    name: 'Hỏa Địa Minh Di',
    symbol: '䷣',
    type: 'Quẻ Hung',
    description:
      'Tượng trưng cho sự tổn thương, bóng tối lấn át ánh sáng. Mặt trời lặn xuống lòng đất, đại diện cho thời kỳ khó khăn, tài năng bị vùi dập hoặc phải đối mặt với sự bất công.',
    advice:
      'Hãy khéo léo che giấu tài năng và ánh sáng của mình để tránh bị hãm hại (giả ngây giả ngô). Trong lòng vẫn giữ vững chí hướng nhưng bên ngoài phải nhẫn nhịn để bảo toàn bản thân qua cơn hoạn nạn.',
  },
  {
    id: 37,
    binary: '101011',
    name: 'Phong Hỏa Gia Nhân',
    symbol: '䷤',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho đạo gia đình, sự tề gia và trật tự nội bộ. Lửa cháy sinh ra gió, đại diện cho sức ảnh hưởng từ bên trong ra bên ngoài. Gia đình có hòa thuận thì vạn sự mới hưng thịnh.',
    advice:
      'Hãy tập trung chỉnh đốn các vấn đề nội bộ, gia đình hoặc tổ chức nhỏ của bạn. Mỗi người cần làm đúng bổn phận và vị trí của mình. Sự nghiêm túc và yêu thương trong gia đình là nền tảng cho mọi thành công bên ngoài.',
  },
  {
    id: 38,
    binary: '110101',
    name: 'Hỏa Trạch Khuê',
    symbol: '䷥',
    type: 'Quẻ Hung',
    description:
      'Tượng trưng cho sự trái ngược, chia rẽ và hận thù. Lửa bốc lên cao, nước đầm lầy thấm xuống dưới, hai bên đi về hai hướng khác nhau, không tìm được tiếng nói chung.',
    advice:
      'Trong sự khác biệt, hãy tìm kiếm những điểm chung nhỏ nhất để chung sống hòa bình (cầu đồng tồn dị). Đừng cố gắng ép buộc người khác theo ý mình. Chỉ nên làm những việc nhỏ, tránh khởi sự lớn vì sự chia rẽ sẽ làm hỏng việc.',
  },
  {
    id: 39,
    binary: '001010',
    name: 'Thủy Sơn Kiển',
    symbol: '䷦',
    type: 'Quẻ Hung',
    description:
      'Tượng trưng cho sự gian nan, khập khiễng và bế tắc. Phía trước có vực sâu (Nước), phía sau là núi cao, tiến thoái lưỡng nan. Đây là giai đoạn đầy rẫy những rào cản khách quan.',
    advice:
      'Nên dừng lại để tự kiểm điểm và tìm kiếm sự giúp đỡ từ những người thông thái ở phương Nam hoặc phương Tây. Đừng cố gắng vượt qua một mình bằng sức mạnh cơ bắp. Sự tĩnh lặng và tìm đồng minh là lối thoát duy nhất.',
  },
  {
    id: 40,
    binary: '010100',
    name: 'Lôi Thủy Giải',
    symbol: '䷧',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự giải tỏa, cởi bỏ và tha thứ. Sấm chớp và mưa làm tan đi không khí ngột ngạt, khó khăn dần qua đi, những vướng mắc được tháo gỡ.',
    advice:
      'Hãy nhanh chóng quay trở lại trạng thái bình thường sau cơn khủng hoảng. Hãy tha thứ cho những sai lầm của người khác và xóa bỏ những nợ nần cũ. Đây là lúc để tiến về phía trước một cách nhẹ nhàng.',
  },
  {
    id: 41,
    binary: '110001',
    name: 'Sơn Trạch Tổn',
    symbol: '䷨',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho sự giảm bớt, hy sinh cái nhỏ để được cái lớn hoặc bớt cái dưới bồi cho cái trên. Tuy là tổn thất nhưng nếu thực hiện với lòng thành kính thì lại mang lại phúc đức.',
    advice:
      'Hãy học cách kiểm soát ham muốn và sự nóng nảy. Đôi khi việc chịu thiệt thòi một chút ở hiện tại sẽ mang lại lợi ích lâu dài về sau. Sự chân thành và tiết kiệm là chìa khóa để vượt qua giai đoạn này.',
  },
  {
    id: 42,
    binary: '100011',
    name: 'Phong Lôi Ích',
    symbol: '䷩',
    type: 'Quẻ Đại Cát',
    description:
      'Tượng trưng cho sự gia tăng, bồi bổ và lợi ích. Gió và Sấm bổ trợ cho nhau, đại diện cho thời cơ thuận lợi để cải cách, giúp đỡ mọi người và phát triển sự nghiệp.',
    advice:
      'Hãy mạnh dạn tiến hành những thay đổi lớn. Thấy điều thiện thì nên theo, thấy lỗi lầm thì nên sửa ngay. Việc giúp đỡ người khác và phụng sự cộng đồng lúc này sẽ mang lại lợi ích cực lớn cho chính bạn.',
  },
  {
    id: 43,
    binary: '111110',
    name: 'Trạch Thiên Quải',
    symbol: '䷪',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho sự quyết liệt, dứt khoát và trừ bỏ kẻ xấu. Đầm lầy dâng cao định lấn át trời, đại diện cho một cuộc đối đầu cuối cùng để loại bỏ những tiêu cực tích tụ.',
    advice:
      'Phải hành động một cách công khai, minh bạch và quyết đoán. Tránh dùng bạo lực hay mưu hèn kế bẩn, hãy dùng chính nghĩa để thuyết phục. Cần cảnh giác cao độ vì kẻ xấu khi bị dồn vào đường cùng sẽ rất nguy hiểm.',
  },
  {
    id: 44,
    binary: '011111',
    name: 'Thiên Phong Cấu',
    symbol: '䷫',
    type: 'Quẻ Hung',
    description:
      'Tượng trưng cho sự gặp gỡ bất ngờ nhưng ẩn chứa hiểm nguy. Một hào âm mới xuất hiện dưới 5 hào dương, đại diện cho những tác động tiêu cực nhỏ bé bắt đầu len lỏi vào hệ thống vững chắc.',
    advice:
      'Cẩn thận với những lời mời chào quá hấp dẫn hoặc những người mới xuất hiện có vẻ ngoài nhu mì. Đừng để những thói hư tật xấu hay những tư tưởng lệch lạc bắt rễ. Hãy tỉnh táo bảo vệ nguyên tắc của mình.',
  },
  {
    id: 45,
    binary: '000110',
    name: 'Trạch Địa Tụy',
    symbol: '䷬',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự hội tụ, tụ họp và đoàn kết. Nước đổ về đầm lầy trên mặt đất, đại diện cho việc mọi người cùng tập hợp lại quanh một mục tiêu hoặc một vị lãnh đạo có uy tín.',
    advice:
      'Hãy chuẩn bị lễ vật và lòng thành để cúng tế (hoặc thể hiện lòng tri ân). Sự đoàn kết cần được duy trì bằng những quy tắc chung và sự bao dung. Đây là lúc để xây dựng đội ngũ và củng cố sức mạnh tập thể.',
  },
  {
    id: 46,
    binary: '011000',
    name: 'Địa Phong Thăng',
    symbol: '䷭',
    type: 'Quẻ Đại Cát',
    description:
      'Tượng trưng cho sự thăng tiến dần dần và vững chắc. Cây mọc lên từ lòng đất, từng chút một nhưng không gì ngăn cản được. Đây là quẻ của sự nỗ lực bền bỉ mang lại thành quả cao quý.',
    advice:
      'Hãy tự tin tiến bước và tìm kiếm sự giúp đỡ từ những bậc tiền bối. Đừng nóng vội, hãy đi theo lộ trình đã định. Sự thăng tiến này là kết quả của một quá trình tu dưỡng lâu dài, hãy trân trọng nó.',
  },
  {
    id: 47,
    binary: '010110',
    name: 'Trạch Thủy Khốn',
    symbol: '䷮',
    type: 'Quẻ Đại Hung',
    description:
      'Tượng trưng cho sự cùng cực, khốn đốn và bị vây hãm. Đầm lầy không có nước, đại diện cho sự cạn kiệt nguồn lực, lời nói không ai tin, hành động bị cản trở.',
    advice:
      'Trong lúc khốn cùng, lời nói không có giá trị, hãy dùng hành động và sự im lặng để chứng minh phẩm giá. Hãy giữ vững niềm tin vào chính đạo, khó khăn này là bài kiểm tra bản lĩnh cuối cùng trước khi bạn bước sang trang mới.',
  },
  {
    id: 48,
    binary: '011010',
    name: 'Thủy Phong Tỉnh',
    symbol: '䷯',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho cái Giếng, nguồn sống không bao giờ cạn và không thay đổi. Dù đời người thay đổi nhưng đạo lý và những giá trị căn bản vẫn như giếng nước, nuôi dưỡng tất cả.',
    advice:
      'Hãy quay về bồi đắp những giá trị cốt lõi, đạo đức và kỹ năng nền tảng. Đừng mải mê chạy theo những thứ phù phiếm bên ngoài. Việc giúp đỡ người khác bằng kiến thức và lòng tốt của mình sẽ mang lại sự tôn trọng lâu dài.',
  },
  {
    id: 49,
    binary: '101110',
    name: 'Trạch Hỏa Cách',
    symbol: '䷰',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự thay đổi, cách mạng và đổi mới. Lửa trong đầm lầy tạo nên sự biến đổi mãnh liệt. Đây là lúc những cái cũ kỹ cần phải được thay thế bằng những cái mới phù hợp hơn.',
    advice:
      'Chỉ nên thực hiện thay đổi khi thời cơ đã hoàn toàn chín muồi và bạn có được lòng tin của mọi người. Sự đổi mới phải dựa trên chính nghĩa và đem lại lợi ích chung mới có thể thành công rực rỡ.',
  },
  {
    id: 50,
    binary: '011101',
    name: 'Hỏa Phong Đỉnh',
    symbol: '䷱',
    type: 'Quẻ Đại Cát',
    description:
      'Tượng trưng cho cái Đỉnh (vạc báu), biểu tượng của quyền lực, sự vững chãi và thành tựu sau khi đã cải cách. Đây là giai đoạn nuôi dưỡng tài năng và thiết lập trật tự mới cao quý.',
    advice:
      'Hãy chú trọng vào việc tuyển dụng và trọng dụng người tài. Giữ gìn sự uy nghiêm và đạo đức trong quản lý. Thành công lúc này mang tính biểu tượng cao, hãy làm gương cho người khác noi theo.',
  },
  {
    id: 51,
    binary: '100100',
    name: 'Thuần Chấn',
    symbol: '䷲',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho Sấm sét, sự kinh động và thức tỉnh. Tiếng sấm vang rền khiến mọi người sợ hãi nhưng cũng là lúc để vạn vật bừng tỉnh khỏi cơn mê.',
    advice:
      'Khi gặp những biến cố bất ngờ, hãy giữ bình tĩnh để không làm rơi chén rượu (giữ được sự điềm tĩnh). Hãy dùng sự kinh động này để nhìn lại lỗi lầm của bản thân và sửa đổi, tai họa sẽ biến thành phúc đức.',
  },
  {
    id: 52,
    binary: '001001',
    name: 'Thuần Cấn',
    symbol: '䷳',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho Núi, sự ngưng nghỉ và tĩnh lặng tuyệt đối. Đây là lúc cần phải biết dừng lại đúng lúc, giữ cho tâm trí không bị xao động bởi những ham muốn bên ngoài.',
    advice:
      'Hãy học cách kiểm soát suy nghĩ và hành động của mình. Đừng làm gì cả khi lòng chưa yên. Việc giữ được sự tĩnh lặng trong nội tâm lúc này là thành tựu lớn nhất, giúp bạn tránh được mọi sai lầm.',
  },
  {
    id: 53,
    binary: '001011',
    name: 'Phong Sơn Tiệm',
    symbol: '䷴',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự tiến triển tuần tự, như chim hồng bay dần lên cao. Mọi sự thành công bền vững đều cần thời gian và các bước đi đúng quy trình, không thể đốt cháy giai đoạn.',
    advice:
      'Hãy kiên nhẫn thực hiện từng bước một theo kế hoạch. Đặc biệt tốt cho việc hôn nhân hoặc các hợp đồng dài hạn. Sự vội vàng lúc này sẽ làm hỏng kết quả đẹp đẽ đang dần hình thành.',
  },
  {
    id: 54,
    binary: '110100',
    name: 'Lôi Trạch Quy Muội',
    symbol: '䷵',
    type: 'Quẻ Hung',
    description:
      'Tượng trưng cho việc em gái về nhà chồng (lấy lẽ), đại diện cho những mối quan hệ sai lệch, không đúng danh phận hoặc sự nóng vội trong hành động dẫn đến kết quả không bền vững.',
    advice:
      'Cần xem xét lại các mối quan hệ và cam kết hiện tại. Đừng vì những cảm xúc nhất thời mà đưa ra quyết định sai lầm cho tương lai. Hãy thận trọng với những gì không bắt đầu từ sự chính thống và minh bạch.',
  },
  {
    id: 55,
    binary: '101100',
    name: 'Lôi Hỏa Phong',
    symbol: '䷶',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho sự rực rỡ, phong phú và cực thịnh. Giống như mặt trời ban trưa chiếu sáng khắp nơi, mọi thứ đang ở đỉnh cao của sự phát triển.',
    advice:
      'Hãy tận hưởng và chia sẻ sự thịnh vượng này với mọi người. Tuy nhiên, hãy nhớ rằng sau giờ Ngọ mặt trời sẽ lặn. Hãy chuẩn bị tâm thế cho sự thay đổi sắp tới và đừng để sự kiêu ngạo làm mờ mắt.',
  },
  {
    id: 56,
    binary: '001101',
    name: 'Hỏa Sơn Lữ',
    symbol: '䷷',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho người lữ hành, sự phiêu bạt và không có nơi cư trú cố định. Lửa cháy trên núi, di chuyển nhanh và dễ lụi tàn nếu không có nguồn nuôi dưỡng ổn định.',
    advice:
      'Trong giai đoạn tạm thời này, hãy giữ thái độ khiêm nhường và thận trọng khi giao tiếp với người lạ. Đừng quá tham vọng vào những lợi ích lâu dài ở những nơi bạn chỉ đi ngang qua. Hãy tập trung vào mục tiêu ngắn hạn.',
  },
  {
    id: 57,
    binary: '011011',
    name: 'Thuần Tốn',
    symbol: '䷸',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho Gió, sự nhu thuận và thâm nhập sâu sắc. Gió thổi khắp nơi, len lỏi vào mọi ngóc ngách, đại diện cho sức mạnh của sự mềm mỏng và bền bỉ.',
    advice:
      'Hãy dùng sự khéo léo và kiên trì để thuyết phục người khác thay vì dùng áp lực mạnh mẽ. Hãy tìm kiếm lời khuyên từ những người có kinh nghiệm và hành động theo những mục tiêu nhỏ, tích tiểu thành đại.',
  },
  {
    id: 58,
    binary: '110110',
    name: 'Thuần Đoài',
    symbol: '䷹',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho Đầm lầy, sự vui vẻ và giao tiếp. Hai hồ nước nối liền nhau, mang lại sự tươi mát và niềm vui cho mọi người xung quanh thông qua ngôn ngữ và sự chia sẻ.',
    advice:
      'Hãy dùng sự chân thành và niềm vui để kết nối với mọi người. Lời nói ngọt ngào đúng lúc sẽ giải quyết được nhiều vấn đề hơn là sự cứng nhắc. Tuy nhiên, đừng vì vui quá đà mà nói những lời thiếu suy nghĩ.',
  },
  {
    id: 59,
    binary: '010011',
    name: 'Phong Thủy Hoán',
    symbol: '䷺',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho sự tan biến, giải tán các vướng mắc hoặc chia rẽ. Gió thổi trên mặt nước làm tan đi những tảng băng, đại diện cho việc xóa bỏ hận thù hoặc tái cấu trúc lại tổ chức.',
    advice:
      'Đây là lúc để hòa giải và gắn kết mọi người xung quanh một niềm tin chung (như tôn giáo hay lý tưởng lớn). Hãy dùng lòng bao dung để hóa giải mọi mâu thuẫn và cùng nhau vượt qua khó khăn.',
  },
  {
    id: 60,
    binary: '110010',
    name: 'Thủy Trạch Tiết',
    symbol: '䷻',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho các đốt tre, sự chừng mực và tiết độ. Nước trong đầm lầy nếu quá nhiều sẽ tràn, cần có bờ đê để giữ lại. Sự tiết chế là cần thiết để duy trì sự ổn định.',
    advice:
      'Hãy đặt ra những giới hạn cho bản thân và công việc. Tiết kiệm và chừng mực sẽ mang lại sự bình an. Tuy nhiên, đừng đặt ra những quy tắc quá khắc khe khiến bản thân và người khác cảm thấy nghẹt thở.',
  },
  {
    id: 61,
    binary: '110011',
    name: 'Phong Trạch Trung Phu',
    symbol: '䷼',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho lòng tin chân thành từ tận đáy lòng. Gió thổi trên mặt hồ tĩnh lặng, đại diện cho sức mạnh của sự trung thực có thể làm lay động cả đất trời và muông thú.',
    advice:
      'Hãy đối xử với mọi người bằng sự chân thành tuyệt đối. Lòng tin là tài sản quý giá nhất của bạn lúc này. Nếu bạn có tâm trong sáng, mọi dự định khó khăn đến đâu cũng sẽ được sự giúp đỡ từ quý nhân.',
  },
  {
    id: 62,
    binary: '001100',
    name: 'Lôi Sơn Tiểu Quá',
    symbol: '䷽',
    type: 'Quẻ Hung',
    description:
      'Tượng trưng cho sự vượt quá một chút trong những việc nhỏ. Chim bay quá cao dễ gặp nguy hiểm, chỉ nên hạ thấp để tìm sự an toàn. Đây không phải là lúc để làm những việc lớn lao.',
    advice:
      'Hãy hành động cực kỳ cẩn thận và khiêm tốn. Trong chi tiêu nên tiết kiệm hơn bình thường, trong tang lễ nên buồn thương hơn bình thường. Tập trung vào những chi tiết nhỏ và giữ mình ở vị trí thấp.',
  },
  {
    id: 63,
    binary: '101010',
    name: 'Thủy Hỏa Ký Tế',
    symbol: '䷾',
    type: 'Quẻ Cát',
    description:
      'Tượng trưng cho việc đã hoàn thành, mọi thứ đã vào đúng vị trí của nó. Nước ở trên, lửa ở dưới nấu chín thức ăn. Đây là trạng thái cân bằng và thành công mỹ mãn nhất.',
    advice:
      'Thành công đã đạt được nhưng đây chính là lúc nguy hiểm nhất vì sự chủ quan sẽ dẫn đến suy vi. Hãy cảnh giác với những biến cố nhỏ nhất và duy trì trật tự hiện tại một cách cẩn trọng nhất có thể.',
  },
  {
    id: 64,
    binary: '010101',
    name: 'Hỏa Thủy Vị Tế',
    symbol: '䷿',
    type: 'Quẻ Bình',
    description:
      'Tượng trưng cho việc chưa hoàn thành, mọi thứ vẫn còn đang dở dang và cần nỗ lực cuối cùng. Lửa ở trên, nước ở dưới không giao nhau, nhưng lại mở ra một chu kỳ mới đầy hy vọng.',
    advice:
      'Đừng nản lòng khi thấy kết quả chưa đến. Hãy kiên nhẫn và cẩn trọng như con cáo nhỏ vượt sông, chỉ cần một chút sơ suất cuối cùng cũng làm hỏng việc. Một khởi đầu mới đang chờ đợi bạn phía trước.',
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
