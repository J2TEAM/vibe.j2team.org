import fs from 'fs';
import path from 'path';

const BASE_SENTENCES = [
    "Cười người hôm trước hôm sau người cười.",
    "Ăn quả nhớ kẻ trồng cây.",
    "Gần mực thì đen, gần đèn thì rạng.",
    "Học thầy không tày học bạn.",
    "Một con ngựa đau cả tàu bỏ cỏ.",
    "Tốt gỗ hơn tốt nước sơn.",
    "Lửa thử vàng gian nan thử sức.",
    "Đi một ngày đàng học một sàng khôn.",
    "Thương người như thể thương thân.",
    "Có công mài sắt có ngày nên kim.",
    "Muốn ăn thì lăn vào bếp.",
    "Phòng bệnh hơn chữa bệnh.",
    "Có chí thì nên.",
    "Có tật giật mình.",
    "Kiến tha lâu cũng đầy tổ.",
    "Cái khó ló cái khôn.",
    "Chớp đông nhay nháy gà gáy thì mưa.",
    "Ngưu tầm ngưu, mã tầm mã.",
    "Uống nước nhớ nguồn.",
    "Không thầy đố mày làm nên.",
    "Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau.",
    "Trăm nghe không bằng một thấy.",
    "Đâm lao thì phải theo lao.",
    "Chưa học bò đã lo học chạy.",
    "Gieo gió gặt bão.",
    "Nuôi ong tay áo, nuôi cáo trong nhà.",
    "Thùng rỗng kêu to.",
    "Ở hiền gặp lành.",
    "Vạn sự khởi đầu nan.",
    "Sai một li đi một dặm.",
    "Rừng vàng biển bạc.",
    "Hữu danh vô thực.",
    "Dĩ hòa vi quý.",
    "Đất lành chim đậu.",
    "Con hơn cha là nhà có phúc.",
    "Tai vách mạch rừng.",
    "Phép vua thua lệ làng.",
    "Bút sa gà chết.",
    "Đồng cam cộng khổ.",
    "Thuận buồm xuôi gió.",
    "Lá rụng về cội.",
    "Tre già măng mọc.",
    "Năng nhặt chặt bị.",
    "Khéo ăn thì no, khéo co thì ấm.",
    "Cá lớn nuốt cá bé.",
    "Ác giả ác báo.",
    "Cha chung không ai khóc.",
    "Lá lành đùm lá rách.",
    "Tránh vỏ dưa gặp vỏ dừa.",
    "Thấy người sang bắt quàng làm họ.",
    "Phú quý sinh lễ nghĩa.",
    "Tham thì thâm.",
    "Đói cho sạch, rách cho thơm.",
    "Quân tử nhất ngôn.",
    "Tích tiểu thành đại.",
    "Có mới nới cũ.",
    "Giàu đổi bạn, sang đổi vợ.",
    "Chim khôn kêu tiếng rảnh rang.",
    "Tay làm hàm nhai.",
    "Không có gì là không thể.",
    "Kiên nhẫn là chìa khóa của thành công.",
    "Sức mạnh nằm ở sự đoàn kết.",
    "Cuộc đời là những chuyến đi.",
    "Tri thức là sức mạnh.",
    "Một nụ cười bằng mười thang thuốc bổ.",
    "Thời gian là vàng bạc.",
    "Sức khỏe là vốn quý nhất.",
    "Hạnh phúc là sự lựa chọn.",
    "Cơ hội chỉ đến một lần.",
    "Hòa bình thế giới.",
    "Theo tình tình phớt, phớt tình tình theo.",
    "Nói trước bước không qua.",
    "Chết trong còn hơn sống đục.",
    "Trâu buộc ghét trâu ăn.",
    "Chó ngáp phải ruồi.",
    "Chuồn chuồn bay thấp thì mưa, bay cao thì nắng, bay vừa thì râm.",
    "Mưa dầm thấm lâu.",
    "Vắng chủ nhà gà vọc niêu tôm.",
    "Ao sâu cá cả.",
    "Cắm sừng làm ngơ.",
    "Con sâu làm rầu nồi canh.",
    "Hát hay không bằng hay hát.",
    "Điếc không sợ súng.",
    "Môi hở răng lạnh.",
    "Đèn nhà ai nhà nấy rạng.",
    "Khôn ngoan không lại với trời.",
    "Hoạn nạn mới biết bạn hiền.",
    "Thuốc đắng dã tật, sự thật mất lòng.",
    "Thức lâu mới biết đêm dài.",
    "Nước chảy đá mòn.",
    "Ăn chọn nơi, chơi chọn bạn.",
    "Ngọc không mài không sáng.",
    "Có kiêng có lành.",
    "Ếch ngồi đáy giếng.",
    "Nước đổ lá khoai.",
    "Bình yên là thứ quý giá nhất.",
    "Học hỏi không bao giờ là muộn.",
    "Sự im lặng đôi khi là câu trả lời tốt nhất.",
    "Mọi nỗ lực đều sẽ được đền đáp.",
    "Gia đình là nơi cuộc sống bắt đầu và tình yêu không bao giờ kết thúc."
];

function getRandomSentence() {
    return BASE_SENTENCES[Math.floor(Math.random() * BASE_SENTENCES.length)];
}

function generateParagraph(minSentences: number, maxSentences: number) {
    const numSentences = Math.floor(Math.random() * (maxSentences - minSentences + 1)) + minSentences;
    const sentences = [];
    for (let i = 0; i < numSentences; i++) {
        sentences.push(getRandomSentence());
    }
    return sentences.join(' ');
}

function generateList(count: number, minS: number, maxS: number) {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(`  "${generateParagraph(minS, maxS)}"`);
    }
    return result;
}

const shortTexts = generateList(100, 5, 5);
const mediumTexts = generateList(100, 6, 10);
const longTexts = generateList(100, 11, 20);

const output = `// Auto-generated corpus with fixed constraints
// Ngắn: 5 câu
// Trung bình: 6-10 câu
// Dài: 11-20 câu

export const SHORT_TEXTS = [
${shortTexts.join(',\n')}
];

export const MEDIUM_TEXTS = [
${mediumTexts.join(',\n')}
];

export const LONG_TEXTS = [
${longTexts.join(',\n')}
];

export const VIETNAMESE_TEXTS = [
  ...SHORT_TEXTS,
  ...MEDIUM_TEXTS,
  ...LONG_TEXTS
];

/**
 * Lấy một đoạn văn bản ngẫu nhiên.
 */
export function getRandomText(): string {
    const randomIndex = Math.floor(Math.random() * VIETNAMESE_TEXTS.length);
    return (VIETNAMESE_TEXTS[randomIndex] || SHORT_TEXTS[0]) as string;
}

/**
 * Tách đoạn văn thành mảng các từ
 */
export function getWordsFromText(text: string): string[] {
    return text.split(' ');
}
`;

fs.writeFileSync(path.join('.', 'src', 'views', 'typing-speed-test', 'data', 'texts.ts'), output);
console.log('Successfully generated text corpus!');
