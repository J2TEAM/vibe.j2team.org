export type Category =
  | 'career'
  | 'wealth'
  | 'health'
  | 'relationships'
  | 'growth'
  | 'lifestyle'
  | 'impact'
  | 'technology'
  | 'alternative'
  | 'reflection'

export interface Question {
  id: number
  category: Category
  en: string
  vi: string
}

export const questions: Question[] = [
  // 1. Career & Achievement
  {
    id: 1,
    category: 'career',
    en: 'What if I become a world-leading expert in my current field?',
    vi: 'Sẽ ra sao nếu mình trở thành chuyên gia hàng đầu thế giới trong lĩnh vực hiện tại?',
  },
  {
    id: 2,
    category: 'career',
    en: 'What if I quit my job to start my own business tomorrow?',
    vi: 'Sẽ ra sao nếu mình nghỉ việc để bắt đầu kinh doanh riêng vào ngày mai?',
  },
  {
    id: 3,
    category: 'career',
    en: 'What if my business reaches a million-dollar revenue in 5 years?',
    vi: 'Sẽ ra sao nếu doanh nghiệp của mình đạt doanh thu triệu đô sau 5 năm?',
  },
  {
    id: 4,
    category: 'career',
    en: 'What if I decide to work remotely and travel the world?',
    vi: 'Sẽ ra sao nếu mình quyết định làm việc từ xa và đi du lịch vòng quanh thế giới?',
  },
  {
    id: 5,
    category: 'career',
    en: 'What if I learn a completely new skill and switch careers?',
    vi: 'Sẽ ra sao nếu mình học một kỹ năng mới hoàn toàn và đổi nghề?',
  },
  {
    id: 6,
    category: 'career',
    en: 'What if I write a book and it becomes a best-seller?',
    vi: 'Sẽ ra sao nếu mình viết một cuốn sách và nó trở thành tác phẩm bán chạy nhất?',
  },
  {
    id: 7,
    category: 'career',
    en: 'What if I retire early at the age of 40?',
    vi: 'Sẽ ra sao nếu mình nghỉ hưu sớm ở tuổi 40?',
  },
  {
    id: 8,
    category: 'career',
    en: 'What if I become an influencer for millions of people?',
    vi: 'Sẽ ra sao nếu mình trở thành người có sức ảnh hưởng đến hàng triệu người?',
  },
  {
    id: 9,
    category: 'career',
    en: 'What if I fail miserably in my biggest project? How will I bounce back?',
    vi: 'Sẽ ra sao nếu mình thất bại thảm hại trong dự án lớn nhất? Mình sẽ đứng dậy thế nào?',
  },
  {
    id: 10,
    category: 'career',
    en: 'What if I am invited to be the CEO of a major corporation?',
    vi: 'Sẽ ra sao nếu mình được mời làm Giám đốc điều hành của một tập đoàn lớn?',
  },

  // 2. Wealth & Finance
  {
    id: 11,
    category: 'wealth',
    en: 'What if I win the lottery tomorrow?',
    vi: 'Sẽ ra sao nếu mình trúng số vào ngày mai?',
  },
  {
    id: 12,
    category: 'wealth',
    en: 'What if I lose all my current assets? What is my first move?',
    vi: 'Sẽ ra sao nếu mình mất hết tài sản hiện có? Bước đi đầu tiên của mình là gì?',
  },
  {
    id: 13,
    category: 'wealth',
    en: 'What if my passive income is five times my living expenses?',
    vi: 'Sẽ ra sao nếu thu nhập thụ động của mình gấp 5 lần chi phí sinh hoạt?',
  },
  {
    id: 14,
    category: 'wealth',
    en: 'What if I choose to live minimally and cut 70% of my spending?',
    vi: 'Sẽ ra sao nếu mình chọn sống tối giản và cắt giảm 70% chi tiêu?',
  },
  {
    id: 15,
    category: 'wealth',
    en: 'What if I invest in a risky venture and win big?',
    vi: 'Sẽ ra sao nếu mình đầu tư vào một dự án mạo hiểm và thắng lớn?',
  },
  {
    id: 16,
    category: 'wealth',
    en: 'What if I can buy a house for my parents this year?',
    vi: 'Sẽ ra sao nếu mình có thể mua nhà cho bố mẹ ngay trong năm nay?',
  },
  {
    id: 17,
    category: 'wealth',
    en: 'What if I never have to worry about money for the rest of my life?',
    vi: 'Sẽ ra sao nếu mình không bao giờ phải lo lắng về tiền bạc trong suốt phần đời còn lại?',
  },
  {
    id: 18,
    category: 'wealth',
    en: 'What if I donate half of my monthly income to charity?',
    vi: 'Sẽ ra sao nếu mình quyên góp một nửa thu nhập hàng tháng cho từ thiện?',
  },
  {
    id: 19,
    category: 'wealth',
    en: 'What if I own a chain of rental properties?',
    vi: 'Sẽ ra sao nếu mình sở hữu một chuỗi bất động sản cho thuê?',
  },
  {
    id: 20,
    category: 'wealth',
    en: 'What if I establish a scholarship fund in my name?',
    vi: 'Sẽ ra sao nếu mình lập một quỹ học bổng mang tên mình?',
  },

  // 3. Health & Wellness
  {
    id: 21,
    category: 'health',
    en: 'What if I can live to be 120 years old and stay healthy?',
    vi: 'Sẽ ra sao nếu mình có thể sống đến 120 tuổi mà vẫn khỏe mạnh?',
  },
  {
    id: 22,
    category: 'health',
    en: "What if I train hard and have an athlete's body?",
    vi: 'Sẽ ra sao nếu mình tập luyện cường độ cao và có thân hình như vận động viên?',
  },
  {
    id: 23,
    category: 'health',
    en: 'What if I switch to a completely plant-based diet?',
    vi: 'Sẽ ra sao nếu mình chuyển sang chế độ ăn thuần thực vật?',
  },
  {
    id: 24,
    category: 'health',
    en: 'What if I complete an international full marathon?',
    vi: 'Sẽ ra sao nếu mình hoàn thành một cuộc đua marathon quốc tế?',
  },
  {
    id: 25,
    category: 'health',
    en: 'What if I take a gap year just to heal my mental health?',
    vi: 'Sẽ ra sao nếu mình nghỉ một năm chỉ để chữa lành sức khỏe tinh thần?',
  },
  {
    id: 26,
    category: 'health',
    en: 'What if I quit all stimulants (caffeine, alcohol, nicotine)?',
    vi: 'Sẽ ra sao nếu mình bỏ hoàn toàn các chất kích thích?',
  },
  {
    id: 27,
    category: 'health',
    en: 'What if I have total control over my sleep and energy levels?',
    vi: 'Sẽ ra sao nếu mình kiểm soát hoàn toàn giấc ngủ và mức năng lượng?',
  },
  {
    id: 28,
    category: 'health',
    en: 'What if I move to a place with pristine air and nature?',
    vi: 'Sẽ ra sao nếu mình chuyển đến một nơi có không khí trong lành và thiên nhiên?',
  },
  {
    id: 29,
    category: 'health',
    en: 'What if I become a yoga or meditation instructor?',
    vi: 'Sẽ ra sao nếu mình trở thành giáo viên yoga hoặc thiền định?',
  },
  {
    id: 30,
    category: 'health',
    en: 'What if I could cure a chronic illness I currently have?',
    vi: 'Sẽ ra sao nếu mình có thể chữa khỏi một căn bệnh mãn tính đang mắc phải?',
  },

  // 4. Relationships & Family
  {
    id: 31,
    category: 'relationships',
    en: 'What if I marry my current partner (or meet my soulmate next month)?',
    vi: 'Sẽ ra sao nếu mình kết hôn với người hiện tại (hoặc gặp tri kỷ vào tháng tới)?',
  },
  {
    id: 32,
    category: 'relationships',
    en: 'What if I choose to stay single for life to explore the world?',
    vi: 'Sẽ ra sao nếu mình chọn độc thân cả đời để khám phá thế giới?',
  },
  {
    id: 33,
    category: 'relationships',
    en: 'What if I have five children?',
    vi: 'Sẽ ra sao nếu mình có tận 5 đứa con?',
  },
  {
    id: 34,
    category: 'relationships',
    en: 'What if I move to a foreign country with my family?',
    vi: 'Sẽ ra sao nếu mình cùng gia đình chuyển đến một quốc gia xa lạ?',
  },
  {
    id: 35,
    category: 'relationships',
    en: 'What if I mend a broken relationship from the past?',
    vi: 'Sẽ ra sao nếu mình hàn gắn một mối quan hệ đã đổ vỡ trong quá khứ?',
  },
  {
    id: 36,
    category: 'relationships',
    en: 'What if I become the most influential person in my extended family?',
    vi: 'Sẽ ra sao nếu mình trở thành người có tầm ảnh hưởng nhất trong dòng họ?',
  },
  {
    id: 37,
    category: 'relationships',
    en: 'What if I lose my closest person? How will I keep going?',
    vi: 'Sẽ ra sao nếu mình mất đi người thân thiết nhất? Mình sẽ tiếp tục thế nào?',
  },
  {
    id: 38,
    category: 'relationships',
    en: 'What if I spend more quality time with my parents every day?',
    vi: 'Sẽ ra sao nếu mình dành nhiều thời gian chất lượng hơn cho bố mẹ mỗi ngày?',
  },
  {
    id: 39,
    category: 'relationships',
    en: 'What if I build a community of like-minded friends?',
    vi: 'Sẽ ra sao nếu mình xây dựng được một cộng đồng những người bạn cùng chí hướng?',
  },
  {
    id: 40,
    category: 'relationships',
    en: 'What if I decide to adopt a child?',
    vi: 'Sẽ ra sao nếu mình quyết định nhận con nuôi?',
  },

  // 5. Personal Growth
  {
    id: 41,
    category: 'growth',
    en: 'What if I become fluent in five different languages?',
    vi: 'Sẽ ra sao nếu mình thông thạo 5 ngôn ngữ khác nhau?',
  },
  {
    id: 42,
    category: 'growth',
    en: 'What if I read 100 books every year?',
    vi: 'Sẽ ra sao nếu mình đọc 100 cuốn sách mỗi năm?',
  },
  {
    id: 43,
    category: 'growth',
    en: 'What if I overcome my biggest fear?',
    vi: 'Sẽ ra sao nếu mình vượt qua được nỗi sợ lớn nhất của bản thân?',
  },
  {
    id: 44,
    category: 'growth',
    en: 'What if I could go back in time to change one decision?',
    vi: 'Sẽ ra sao nếu mình có thể quay lại quá khứ để thay đổi một quyết định?',
  },
  {
    id: 45,
    category: 'growth',
    en: 'What if I knew the exact date of my death? How would I live?',
    vi: 'Sẽ ra sao nếu mình biết chính xác ngày mình chết? Mình sẽ sống thế nào?',
  },
  {
    id: 46,
    category: 'growth',
    en: 'What if I could talk to the 80-year-old version of myself?',
    vi: 'Sẽ ra sao nếu mình có thể trò chuyện với phiên bản 80 tuổi của chính mình?',
  },
  {
    id: 47,
    category: 'growth',
    en: 'What if I attain absolute inner peace?',
    vi: 'Sẽ ra sao nếu mình đạt được sự an lạc tuyệt đối trong tâm hồn?',
  },
  {
    id: 48,
    category: 'growth',
    en: 'What if I spend a year living in a monastery?',
    vi: 'Sẽ ra sao nếu mình dành một năm sống trong tu viện?',
  },
  {
    id: 49,
    category: 'growth',
    en: 'What if I quit all social media for the next five years?',
    vi: 'Sẽ ra sao nếu mình bỏ mọi mạng xã hội trong 5 năm tới?',
  },
  {
    id: 50,
    category: 'growth',
    en: 'What if I have the ability to learn anything in 24 hours?',
    vi: 'Sẽ ra sao nếu mình có khả năng học bất cứ thứ gì trong vòng 24 giờ?',
  },

  // 6. Lifestyle & Experience
  {
    id: 51,
    category: 'lifestyle',
    en: 'What if I live on a deserted island for a year?',
    vi: 'Sẽ ra sao nếu mình sống trên đảo hoang trong 1 năm?',
  },
  {
    id: 52,
    category: 'lifestyle',
    en: 'What if I walk across the entire country?',
    vi: 'Sẽ ra sao nếu mình đi bộ xuyên Việt?',
  },
  {
    id: 53,
    category: 'lifestyle',
    en: 'What if I own a farm and grow my own food?',
    vi: 'Sẽ ra sao nếu mình sở hữu trang trại tự cung tự cấp?',
  },
  {
    id: 54,
    category: 'lifestyle',
    en: 'What if I become a pilot or an astronaut?',
    vi: 'Sẽ ra sao nếu mình trở thành phi công hoặc phi hành gia?',
  },
  {
    id: 55,
    category: 'lifestyle',
    en: 'What if I live in the most modern smart home?',
    vi: 'Sẽ ra sao nếu mình sống trong ngôi nhà thông minh hiện đại nhất?',
  },
  {
    id: 56,
    category: 'lifestyle',
    en: 'What if I could travel back to ancient times?',
    vi: 'Sẽ ra sao nếu mình du hành về thời cổ đại?',
  },
  {
    id: 57,
    category: 'lifestyle',
    en: 'What if I learn to deep-sea dive or climb Everest?',
    vi: 'Sẽ ra sao nếu mình học lặn sâu hoặc leo đỉnh Everest?',
  },
  {
    id: 58,
    category: 'lifestyle',
    en: 'What if I spend a summer learning a traditional art?',
    vi: 'Sẽ ra sao nếu mình dành một mùa hè học nghệ thuật truyền thống?',
  },
  {
    id: 59,
    category: 'lifestyle',
    en: 'What if I live in a van instead of a fixed house?',
    vi: 'Sẽ ra sao nếu mình sống trên xe van thay vì nhà cố định?',
  },
  {
    id: 60,
    category: 'lifestyle',
    en: 'What if I join a wildlife conservation project?',
    vi: 'Sẽ ra sao nếu mình tham gia dự án bảo tồn động vật hoang dã?',
  },

  // 7. Social Impact
  {
    id: 61,
    category: 'impact',
    en: 'What if I start a non-profit helping thousands of kids?',
    vi: 'Sẽ ra sao nếu mình sáng lập tổ chức phi lợi nhuận giúp hàng nghìn trẻ em?',
  },
  {
    id: 62,
    category: 'impact',
    en: 'What if I change an unjust law in my country?',
    vi: 'Sẽ ra sao nếu mình thay đổi được một đạo luật bất công trong nước?',
  },
  {
    id: 63,
    category: 'impact',
    en: 'What if I invent a technology that cleans the environment?',
    vi: 'Sẽ ra sao nếu mình sáng chế công nghệ làm sạch môi trường?',
  },
  {
    id: 64,
    category: 'impact',
    en: 'What if I am mentioned in history books?',
    vi: 'Sẽ ra sao nếu tên mình được ghi danh vào sách lịch sử?',
  },
  {
    id: 65,
    category: 'impact',
    en: 'What if I pass down great moral values to the next generation?',
    vi: 'Sẽ ra sao nếu mình truyền lại những giá trị đạo đức tốt đẹp cho thế hệ sau?',
  },
  {
    id: 66,
    category: 'impact',
    en: 'What if I build a completely free school?',
    vi: 'Sẽ ra sao nếu mình xây dựng một ngôi trường hoàn toàn miễn phí?',
  },
  {
    id: 67,
    category: 'impact',
    en: 'What if I become a politician with integrity and vision?',
    vi: 'Sẽ ra sao nếu mình trở thành chính trị gia có tâm và tầm nhìn?',
  },
  {
    id: 68,
    category: 'impact',
    en: 'What if I donate my entire estate after I pass away?',
    vi: 'Sẽ ra sao nếu mình hiến tặng toàn bộ tài sản sau khi mất?',
  },
  {
    id: 69,
    category: 'impact',
    en: "What if I save someone's life in a dangerous situation?",
    vi: 'Sẽ ra sao nếu mình cứu sống một người trong tình huống nguy hiểm?',
  },
  {
    id: 70,
    category: 'impact',
    en: 'What if I become a mediator between conflicting nations?',
    vi: 'Sẽ ra sao nếu mình trở thành người hòa giải giữa các quốc gia xung đột?',
  },

  // 8. Technology & The Future
  {
    id: 71,
    category: 'technology',
    en: 'What if I upload my consciousness to a computer?',
    vi: 'Sẽ ra sao nếu mình tải ý thức của mình lên máy tính?',
  },
  {
    id: 72,
    category: 'technology',
    en: 'What if my best friend is an AI robot?',
    vi: 'Sẽ ra sao nếu người bạn thân nhất của mình là robot AI?',
  },
  {
    id: 73,
    category: 'technology',
    en: 'What if I move to a colony on Mars?',
    vi: 'Sẽ ra sao nếu mình định cư trên sao Hỏa?',
  },
  {
    id: 74,
    category: 'technology',
    en: 'What if I can communicate with animals?',
    vi: 'Sẽ ra sao nếu mình có thể giao tiếp với động vật?',
  },
  {
    id: 75,
    category: 'technology',
    en: 'What if I have a superpower like mind-reading?',
    vi: 'Sẽ ra sao nếu mình có siêu năng lực như đọc tâm trí người khác?',
  },
  {
    id: 76,
    category: 'technology',
    en: 'What if the world has no currency, only kindness?',
    vi: 'Sẽ ra sao nếu thế giới không có tiền tệ, chỉ có sự tử tế?',
  },
  {
    id: 77,
    category: 'technology',
    en: 'What if I am the first to contact extraterrestrials?',
    vi: 'Sẽ ra sao nếu mình là người đầu tiên tiếp xúc với người ngoài hành tinh?',
  },
  {
    id: 78,
    category: 'technology',
    en: 'What if I can change my appearance in 5 minutes?',
    vi: 'Sẽ ra sao nếu mình có thể thay đổi ngoại hình trong 5 phút?',
  },
  {
    id: 79,
    category: 'technology',
    en: 'What if I can watch a "movie" of my life after I die?',
    vi: 'Sẽ ra sao nếu mình có thể xem lại "bộ phim" về cuộc đời sau khi mất?',
  },
  {
    id: 80,
    category: 'technology',
    en: "What if I discover I'm living in a simulation?",
    vi: 'Sẽ ra sao nếu mình phát hiện ra mình đang sống trong một bộ mô phỏng?',
  },

  // 9. Alternative Realities
  {
    id: 81,
    category: 'alternative',
    en: "What if I were born into the world's richest family?",
    vi: 'Sẽ ra sao nếu mình sinh ra trong gia đình giàu nhất thế giới?',
  },
  {
    id: 82,
    category: 'alternative',
    en: 'What if I lose my sight or hearing?',
    vi: 'Sẽ ra sao nếu mình mất đi thị giác hoặc thính giác?',
  },
  {
    id: 83,
    category: 'alternative',
    en: 'What if I live in an era without the internet?',
    vi: 'Sẽ ra sao nếu mình sống trong thời đại không có internet?',
  },
  {
    id: 84,
    category: 'alternative',
    en: 'What if I never met my current friends?',
    vi: 'Sẽ ra sao nếu mình chưa bao giờ gặp những người bạn hiện tại?',
  },
  {
    id: 85,
    category: 'alternative',
    en: 'What if I am the last person left on Earth?',
    vi: 'Sẽ ra sao nếu mình là người cuối cùng còn lại trên Trái Đất?',
  },
  {
    id: 86,
    category: 'alternative',
    en: 'What if everyone could hear my thoughts?',
    vi: 'Sẽ ra sao nếu mọi người đều nghe thấy suy nghĩ của mình?',
  },
  {
    id: 87,
    category: 'alternative',
    en: 'What if I never need to sleep and stay awake?',
    vi: 'Sẽ ra sao nếu mình không bao giờ cần ngủ và luôn tỉnh táo?',
  },
  {
    id: 88,
    category: 'alternative',
    en: 'What if I could live multiple lives at once?',
    vi: 'Sẽ ra sao nếu mình có thể sống nhiều cuộc đời cùng một lúc?',
  },
  {
    id: 89,
    category: 'alternative',
    en: 'What if I knew for sure that all my efforts would succeed?',
    vi: 'Sẽ ra sao nếu mình biết chắc mọi nỗ lực của mình đều sẽ thành công?',
  },
  {
    id: 90,
    category: 'alternative',
    en: 'What if today is the best day of my life?',
    vi: 'Sẽ ra sao nếu hôm nay là ngày tuyệt vời nhất trong cuộc đời mình?',
  },

  // 10. Self-Reflection
  {
    id: 91,
    category: 'reflection',
    en: 'What if I stop caring about what others think of me?',
    vi: 'Sẽ ra sao nếu mình ngừng quan tâm người khác nghĩ gì về mình?',
  },
  {
    id: 92,
    category: 'reflection',
    en: 'What if I start saying "Yes" to every opportunity?',
    vi: 'Sẽ ra sao nếu mình bắt đầu nói "Có" với mọi cơ hội?',
  },
  {
    id: 93,
    category: 'reflection',
    en: 'What if I start saying "No" to things that drain me?',
    vi: 'Sẽ ra sao nếu mình bắt đầu nói "Không" với những điều làm mình kiệt sức?',
  },
  {
    id: 94,
    category: 'reflection',
    en: 'What if I spend 30 minutes in silence every day?',
    vi: 'Sẽ ra sao nếu mình dành 30 phút tĩnh lặng mỗi ngày?',
  },
  {
    id: 95,
    category: 'reflection',
    en: 'What if I forgive everyone who ever hurt me?',
    vi: 'Sẽ ra sao nếu mình tha thứ cho mọi người từng làm tổn thương mình?',
  },
  {
    id: 96,
    category: 'reflection',
    en: 'What if I am already enough exactly as I am?',
    vi: 'Sẽ ra sao nếu mình đã là đủ ngay lúc này?',
  },
  {
    id: 97,
    category: 'reflection',
    en: 'What if I can master my emotions completely?',
    vi: 'Sẽ ra sao nếu mình làm chủ hoàn toàn cảm xúc của mình?',
  },
  {
    id: 98,
    category: 'reflection',
    en: 'What if I decide to be happy regardless of circumstances?',
    vi: 'Sẽ ra sao nếu mình quyết định hạnh phúc dù chuyện gì xảy ra?',
  },
  {
    id: 99,
    category: 'reflection',
    en: 'What if my purpose in life is simply to be kind?',
    vi: 'Sẽ ra sao nếu mục đích sống của mình chỉ đơn giản là tử tế?',
  },
  {
    id: 100,
    category: 'reflection',
    en: 'What if the future I dream of is already starting now?',
    vi: 'Sẽ ra sao nếu tương lai mình mơ ước đang bắt đầu ngay lúc này?',
  },
]

export function getRandomQuestion(): Question {
  return questions[Math.floor(Math.random() * questions.length)]!
}
