import type { Ending, ComboEnding } from '../types'

export const ENDINGS: Ending[] = [
  {
    visionId: 33,
    title: { en: 'The Sacred Forest', vi: 'Thánh Địa Xanh' },
    narrative: {
      en: 'The wild came back. Not because you told it to — because you made room. Ancient trees now stand where roads once ran. Something older than memory breathes here.',
      vi: 'Thiên nhiên hồi sinh. Không phải vì ai ra lệnh — mà vì bạn đã nhường chỗ. Những cây cổ thụ mọc lên nơi từng là lối mòn. Có gì đó cổ xưa hơn cả ký ức đang thở ở đây.',
    },
  },
  {
    visionId: 34,
    title: { en: 'The Living City', vi: 'Thành Phố Sống' },
    narrative: {
      en: "Your city never sleeps, but it isn't restless. Markets hum at midnight. Children cross bridges at dawn. The river runs through it like a heartbeat.",
      vi: 'Thành phố không ngủ, nhưng không hỗn loạn. Chợ xao xác lúc nửa đêm. Trẻ em qua cầu lúc bình minh. Dòng sông chảy qua như nhịp tim.',
    },
  },
  {
    visionId: 35,
    title: { en: 'The Eternal Loom', vi: 'Cửi Dệt Ngàn Năm' },
    narrative: {
      en: 'Every wall tells a story. Every garment holds a name. Your people make things the way they tell the truth — slowly, together, and to last.',
      vi: 'Mỗi bức tường đều kể chuyện. Mỗi tấm vải đều mang tên. Người dân làm mọi thứ như cách họ nói thật — chậm rãi, cùng nhau, và để trường tồn.',
    },
  },
  {
    visionId: 36,
    title: { en: 'The Wandering Academy', vi: 'Học Viện Viễn Phương' },
    narrative: {
      en: 'No one owns the knowledge here. Teachers arrive unannounced. Libraries appear in fishing boats and mountain passes. Your world thinks out loud.',
      vi: 'Tri thức không thuộc về ai. Thầy giáo xuất hiện bất ngờ. Thư viện hiện ra trên thuyền câu và đèo núi. Thế giới của bạn suy nghĩ thành lời.',
    },
  },
  {
    visionId: 37,
    title: { en: 'The Harmonic World', vi: 'Thế Giới Hòa Hợp' },
    narrative: {
      en: 'Nothing here is perfect. Everything here is enough. The city knows the forest. The forest feeds the city. Strangers arrive and immediately feel the balance.',
      vi: 'Không có gì hoàn hảo ở đây. Mọi thứ đều vừa đủ. Thành phố biết rừng. Rừng nuôi thành phố. Người lạ đến và lập tức cảm nhận được sự cân bằng.',
    },
  },
  {
    visionId: 38,
    title: { en: "The Dragon's Return", vi: 'Long Mạch Hồi Sinh' },
    narrative: {
      en: 'Every corner of the land is tended and alive. From the highest mist to the deepest port, something is growing. The old stories said dragons never left — now you understand why.',
      vi: 'Mỗi góc của vùng đất đều được chăm sóc và sống động. Từ đỉnh mù sương đến bến cảng sâu thẳm, có gì đó đang lớn lên. Cổ tích nói rồng chưa từng rời đi — giờ bạn hiểu tại sao.',
    },
  },
  {
    visionId: 39,
    title: { en: 'The Abundant Age', vi: 'Kỷ Nguyên Hưng Thịnh' },
    narrative: {
      en: 'Historians will argue about how it happened. The rivers are clean. The markets are full. The children have never known otherwise.',
      vi: 'Sử gia sẽ tranh luận về cách nó xảy ra. Sông trong. Chợ đầy. Trẻ em không biết thế giới có thể khác đi.',
    },
  },
  {
    visionId: 40,
    title: { en: 'The Ruined World', vi: 'Hoang Phế Hồi Sinh' },
    narrative: {
      en: 'You stopped tending. The world healed itself. The broken places became the interesting ones — where the moss crept back, where the rivers found new paths. Historians call it a dark period. The birds disagree.',
      vi: 'Bạn ngừng chăm sóc. Thế giới tự lành. Những nơi đổ nát trở thành nơi thú vị nhất — nơi rêu bò trở lại, nơi sông tìm đường mới. Sử gia gọi đó là thời kỳ tối tăm. Loài chim không đồng ý.',
    },
  },
  {
    visionId: 41,
    title: { en: 'The Empty Throne', vi: 'Ngai Vàng Bỏ Trống' },
    narrative: {
      en: 'Every world that called itself complete was lying. Yours just admitted it. No monuments. No grand titles. Just a place where things kept growing without being told to.',
      vi: 'Mọi thế giới tự xưng là hoàn chỉnh đều đang nói dối. Thế giới của bạn chỉ thừa nhận điều đó. Không đài tưởng niệm. Không danh hiệu vĩ đại. Chỉ là nơi mọi thứ tiếp tục lớn lên mà không cần ai bảo.',
    },
  },
]

export const COMBO_ENDINGS: ComboEnding[] = [
  {
    visionIds: [33, 35],
    title: { en: 'The Woven Wild', vi: 'Thiên Nhiên Được Dệt' },
  },
  {
    visionIds: [34, 36],
    title: { en: 'The Radiant Port', vi: 'Bến Cảng Rực Rỡ' },
  },
  {
    visionIds: [36, 38],
    title: { en: 'The Living Atlas', vi: 'Địa Đồ Sống' },
  },
  {
    visionIds: [37, 39],
    title: { en: 'The Patient Garden', vi: 'Khu Vườn Kiên Nhẫn' },
  },
  {
    visionIds: [33, 36],
    title: { en: 'The Thinking Forest', vi: 'Khu Rừng Biết Nghĩ' },
  },
  {
    visionIds: [34, 35],
    title: { en: 'The Craft Capital', vi: 'Kinh Đô Thủ Công' },
  },
  {
    visionIds: [38, 39],
    title: { en: 'The Full World', vi: 'Thế Giới Viên Mãn' },
  },
]
