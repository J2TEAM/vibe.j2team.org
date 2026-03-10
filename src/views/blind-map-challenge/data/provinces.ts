import type { Province } from '../types'

export const provinces: Province[] = [
    // ========================
    // VÙNG BẮC (25 tỉnh/thành phố)
    // ========================
    // Đồng bằng sông Hồng
    { id: 'ha-noi', name: 'Hà Nội', shortName: 'HN', zone: 'Bắc', region: 'Đồng bằng sông Hồng', capital: 'Hà Nội', area: 3358, population: 8053663, svgPathId: 'VN-HN', neighbors: ['vinh-phuc', 'thai-nguyen', 'bac-giang', 'bac-ninh', 'hung-yen', 'ha-nam', 'hoa-binh', 'phu-tho'] },
    { id: 'hai-phong', name: 'Hải Phòng', shortName: 'HP', zone: 'Bắc', region: 'Đồng bằng sông Hồng', capital: 'Hải Phòng', area: 1561, population: 2028514, svgPathId: 'VN-HP', neighbors: ['quang-ninh', 'hai-duong', 'thai-binh'] },
    { id: 'hai-duong', name: 'Hải Dương', shortName: 'HD', zone: 'Bắc', region: 'Đồng bằng sông Hồng', capital: 'Hải Dương', area: 1668, population: 1892254, svgPathId: 'VN-HD', neighbors: ['bac-giang', 'bac-ninh', 'hung-yen', 'thai-binh', 'hai-phong', 'quang-ninh'] },
    { id: 'hung-yen', name: 'Hưng Yên', shortName: 'HY', zone: 'Bắc', region: 'Đồng bằng sông Hồng', capital: 'Hưng Yên', area: 926, population: 1252731, svgPathId: 'VN-HY', neighbors: ['ha-noi', 'bac-ninh', 'hai-duong', 'thai-binh', 'ha-nam'] },
    { id: 'thai-binh', name: 'Thái Bình', shortName: 'TB', zone: 'Bắc', region: 'Đồng bằng sông Hồng', capital: 'Thái Bình', area: 1570, population: 1860447, svgPathId: 'VN-TB', neighbors: ['ha-nam', 'hung-yen', 'hai-duong', 'hai-phong', 'nam-dinh'] },
    { id: 'ha-nam', name: 'Hà Nam', shortName: 'HNm', zone: 'Bắc', region: 'Đồng bằng sông Hồng', capital: 'Phủ Lý', area: 860, population: 852800, svgPathId: 'VN-HNm', neighbors: ['ha-noi', 'hung-yen', 'thai-binh', 'nam-dinh', 'ninh-binh', 'hoa-binh'] },
    { id: 'nam-dinh', name: 'Nam Định', shortName: 'NĐ', zone: 'Bắc', region: 'Đồng bằng sông Hồng', capital: 'Nam Định', area: 1652, population: 1833500, svgPathId: 'VN-ND', neighbors: ['ha-nam', 'thai-binh', 'ninh-binh'] },
    { id: 'ninh-binh', name: 'Ninh Bình', shortName: 'NB', zone: 'Bắc', region: 'Đồng bằng sông Hồng', capital: 'Ninh Bình', area: 1378, population: 982930, svgPathId: 'VN-NB', neighbors: ['ha-nam', 'nam-dinh', 'thanh-hoa', 'hoa-binh'] },
    { id: 'vinh-phuc', name: 'Vĩnh Phúc', shortName: 'VP', zone: 'Bắc', region: 'Đồng bằng sông Hồng', capital: 'Vĩnh Yên', area: 1236, population: 1151300, svgPathId: 'VN-VP', neighbors: ['ha-noi', 'phu-tho', 'tuyen-quang', 'thai-nguyen'] },
    { id: 'bac-ninh', name: 'Bắc Ninh', shortName: 'BN', zone: 'Bắc', region: 'Đồng bằng sông Hồng', capital: 'Bắc Ninh', area: 823, population: 1368840, svgPathId: 'VN-BN', neighbors: ['ha-noi', 'bac-giang', 'hai-duong', 'hung-yen'] },

    // Đông Bắc
    { id: 'quang-ninh', name: 'Quảng Ninh', shortName: 'QN', zone: 'Bắc', region: 'Đông Bắc', capital: 'Hạ Long', area: 6102, population: 1320324, svgPathId: 'VN-QN', neighbors: ['lang-son', 'bac-giang', 'hai-duong', 'hai-phong'] },
    { id: 'bac-giang', name: 'Bắc Giang', shortName: 'BG', zone: 'Bắc', region: 'Đông Bắc', capital: 'Bắc Giang', area: 3848, population: 1803950, svgPathId: 'VN-BG', neighbors: ['lang-son', 'thai-nguyen', 'ha-noi', 'bac-ninh', 'hai-duong', 'quang-ninh'] },
    { id: 'phu-tho', name: 'Phú Thọ', shortName: 'PT', zone: 'Bắc', region: 'Đông Bắc', capital: 'Việt Trì', area: 3534, population: 1463726, svgPathId: 'VN-PT', neighbors: ['tuyen-quang', 'yen-bai', 'son-la', 'hoa-binh', 'ha-noi', 'vinh-phuc'] },
    { id: 'thai-nguyen', name: 'Thái Nguyên', shortName: 'TN', zone: 'Bắc', region: 'Đông Bắc', capital: 'Thái Nguyên', area: 3526, population: 1286751, svgPathId: 'VN-TN', neighbors: ['bac-kan', 'tuyen-quang', 'vinh-phuc', 'ha-noi', 'bac-giang', 'lang-son'] },
    { id: 'lang-son', name: 'Lạng Sơn', shortName: 'LS', zone: 'Bắc', region: 'Đông Bắc', capital: 'Lạng Sơn', area: 8310, population: 781655, svgPathId: 'VN-LS', neighbors: ['cao-bang', 'bac-kan', 'thai-nguyen', 'bac-giang', 'quang-ninh'] },
    { id: 'cao-bang', name: 'Cao Bằng', shortName: 'CB', zone: 'Bắc', region: 'Đông Bắc', capital: 'Cao Bằng', area: 6700, population: 530341, svgPathId: 'VN-CB', neighbors: ['ha-giang', 'tuyen-quang', 'bac-kan', 'lang-son'] },
    { id: 'bac-kan', name: 'Bắc Kạn', shortName: 'BK', zone: 'Bắc', region: 'Đông Bắc', capital: 'Bắc Kạn', area: 4859, population: 313905, svgPathId: 'VN-BK', neighbors: ['cao-bang', 'tuyen-quang', 'thai-nguyen', 'lang-son'] },
    { id: 'tuyen-quang', name: 'Tuyên Quang', shortName: 'TQ', zone: 'Bắc', region: 'Đông Bắc', capital: 'Tuyên Quang', area: 5867, population: 784811, svgPathId: 'VN-TQ', neighbors: ['ha-giang', 'cao-bang', 'bac-kan', 'thai-nguyen', 'vinh-phuc', 'phu-tho', 'yen-bai'] },
    { id: 'ha-giang', name: 'Hà Giang', shortName: 'HG', zone: 'Bắc', region: 'Đông Bắc', capital: 'Hà Giang', area: 7945, population: 854689, svgPathId: 'VN-HG', neighbors: ['cao-bang', 'tuyen-quang', 'yen-bai', 'lao-cai'] },

    // Tây Bắc
    { id: 'lao-cai', name: 'Lào Cai', shortName: 'LC', zone: 'Bắc', region: 'Tây Bắc', capital: 'Lào Cai', area: 6364, population: 730420, svgPathId: 'VN-LC', neighbors: ['ha-giang', 'yen-bai', 'lai-chau'] },
    { id: 'yen-bai', name: 'Yên Bái', shortName: 'YB', zone: 'Bắc', region: 'Tây Bắc', capital: 'Yên Bái', area: 6886, population: 821030, svgPathId: 'VN-YB', neighbors: ['lao-cai', 'ha-giang', 'tuyen-quang', 'phu-tho', 'son-la', 'lai-chau'] },
    { id: 'lai-chau', name: 'Lai Châu', shortName: 'LCh', zone: 'Bắc', region: 'Tây Bắc', capital: 'Lai Châu', area: 9068, population: 460196, svgPathId: 'VN-LCh', neighbors: ['lao-cai', 'yen-bai', 'son-la', 'dien-bien'] },
    { id: 'dien-bien', name: 'Điện Biên', shortName: 'ĐB', zone: 'Bắc', region: 'Tây Bắc', capital: 'Điện Biên Phủ', area: 9541, population: 598856, svgPathId: 'VN-DB', neighbors: ['lai-chau', 'son-la'] },
    { id: 'son-la', name: 'Sơn La', shortName: 'SL', zone: 'Bắc', region: 'Tây Bắc', capital: 'Sơn La', area: 14174, population: 1228921, svgPathId: 'VN-SL', neighbors: ['lai-chau', 'dien-bien', 'yen-bai', 'phu-tho', 'hoa-binh', 'thanh-hoa'] },
    { id: 'hoa-binh', name: 'Hoà Bình', shortName: 'HB', zone: 'Bắc', region: 'Tây Bắc', capital: 'Hoà Bình', area: 4608, population: 854131, svgPathId: 'VN-HB', neighbors: ['son-la', 'phu-tho', 'ha-noi', 'ha-nam', 'ninh-binh', 'thanh-hoa'] },

    // ========================
    // VÙNG TRUNG (19 tỉnh/thành phố)
    // ========================
    // Bắc Trung Bộ
    { id: 'thanh-hoa', name: 'Thanh Hoá', shortName: 'TH', zone: 'Trung', region: 'Bắc Trung Bộ', capital: 'Thanh Hoá', area: 11120, population: 3640128, svgPathId: 'VN-TH', neighbors: ['hoa-binh', 'son-la', 'ninh-binh', 'nghe-an'] },
    { id: 'nghe-an', name: 'Nghệ An', shortName: 'NA', zone: 'Trung', region: 'Bắc Trung Bộ', capital: 'Vinh', area: 16490, population: 3327791, svgPathId: 'VN-NA', neighbors: ['thanh-hoa', 'ha-tinh'] },
    { id: 'ha-tinh', name: 'Hà Tĩnh', shortName: 'HT', zone: 'Trung', region: 'Bắc Trung Bộ', capital: 'Hà Tĩnh', area: 5997, population: 1289058, svgPathId: 'VN-HT', neighbors: ['nghe-an', 'quang-binh'] },
    { id: 'quang-binh', name: 'Quảng Bình', shortName: 'QB', zone: 'Trung', region: 'Bắc Trung Bộ', capital: 'Đồng Hới', area: 8065, population: 895430, svgPathId: 'VN-QB', neighbors: ['ha-tinh', 'quang-tri'] },
    { id: 'quang-tri', name: 'Quảng Trị', shortName: 'QTr', zone: 'Trung', region: 'Bắc Trung Bộ', capital: 'Đông Hà', area: 4739, population: 632820, svgPathId: 'VN-QTr', neighbors: ['quang-binh', 'thua-thien-hue'] },
    { id: 'thua-thien-hue', name: 'Thừa Thiên Huế', shortName: 'TTH', zone: 'Trung', region: 'Bắc Trung Bộ', capital: 'Huế', area: 5033, population: 1163583, svgPathId: 'VN-TTH', neighbors: ['quang-tri', 'da-nang', 'quang-nam'] },

    // Nam Trung Bộ
    { id: 'da-nang', name: 'Đà Nẵng', shortName: 'ĐN', zone: 'Trung', region: 'Nam Trung Bộ', capital: 'Đà Nẵng', area: 1285, population: 1134310, svgPathId: 'VN-DN', neighbors: ['thua-thien-hue', 'quang-nam'] },
    { id: 'quang-nam', name: 'Quảng Nam', shortName: 'QNm', zone: 'Trung', region: 'Nam Trung Bộ', capital: 'Tam Kỳ', area: 10438, population: 1480000, svgPathId: 'VN-QNm', neighbors: ['da-nang', 'thua-thien-hue', 'quang-ngai', 'kon-tum'] },
    { id: 'quang-ngai', name: 'Quảng Ngãi', shortName: 'QNg', zone: 'Trung', region: 'Nam Trung Bộ', capital: 'Quảng Ngãi', area: 5153, population: 1231000, svgPathId: 'VN-QNg', neighbors: ['quang-nam', 'kon-tum', 'gia-lai', 'binh-dinh'] },
    { id: 'binh-dinh', name: 'Bình Định', shortName: 'BĐ', zone: 'Trung', region: 'Nam Trung Bộ', capital: 'Quy Nhơn', area: 6050, population: 1487000, svgPathId: 'VN-BD', neighbors: ['quang-ngai', 'gia-lai', 'phu-yen'] },
    { id: 'phu-yen', name: 'Phú Yên', shortName: 'PY', zone: 'Trung', region: 'Nam Trung Bộ', capital: 'Tuy Hoà', area: 5060, population: 903700, svgPathId: 'VN-PY', neighbors: ['binh-dinh', 'gia-lai', 'dak-lak', 'khanh-hoa'] },
    { id: 'khanh-hoa', name: 'Khánh Hoà', shortName: 'KH', zone: 'Trung', region: 'Nam Trung Bộ', capital: 'Nha Trang', area: 5218, population: 1231107, svgPathId: 'VN-KH', neighbors: ['phu-yen', 'dak-lak', 'lam-dong', 'ninh-thuan'] },
    { id: 'ninh-thuan', name: 'Ninh Thuận', shortName: 'NT', zone: 'Trung', region: 'Nam Trung Bộ', capital: 'Phan Rang-Tháp Chàm', area: 3358, population: 590282, svgPathId: 'VN-NT', neighbors: ['khanh-hoa', 'lam-dong', 'binh-thuan'] },
    { id: 'binh-thuan', name: 'Bình Thuận', shortName: 'BTh', zone: 'Trung', region: 'Nam Trung Bộ', capital: 'Phan Thiết', area: 7828, population: 1231000, svgPathId: 'VN-BTh', neighbors: ['ninh-thuan', 'lam-dong', 'dong-nai'] },

    // Tây Nguyên
    { id: 'kon-tum', name: 'Kon Tum', shortName: 'KT', zone: 'Trung', region: 'Tây Nguyên', capital: 'Kon Tum', area: 9690, population: 540438, svgPathId: 'VN-KT', neighbors: ['quang-nam', 'quang-ngai', 'gia-lai'] },
    { id: 'gia-lai', name: 'Gia Lai', shortName: 'GL', zone: 'Trung', region: 'Tây Nguyên', capital: 'Pleiku', area: 15537, population: 1513847, svgPathId: 'VN-GL', neighbors: ['kon-tum', 'quang-ngai', 'binh-dinh', 'phu-yen', 'dak-lak'] },
    { id: 'dak-lak', name: 'Đắk Lắk', shortName: 'ĐL', zone: 'Trung', region: 'Tây Nguyên', capital: 'Buôn Ma Thuột', area: 13030, population: 1869322, svgPathId: 'VN-DL', neighbors: ['gia-lai', 'phu-yen', 'khanh-hoa', 'lam-dong', 'dak-nong'] },
    { id: 'dak-nong', name: 'Đắk Nông', shortName: 'ĐNo', zone: 'Trung', region: 'Tây Nguyên', capital: 'Gia Nghĩa', area: 6516, population: 622200, svgPathId: 'VN-DNo', neighbors: ['dak-lak', 'lam-dong', 'binh-phuoc'] },
    { id: 'lam-dong', name: 'Lâm Đồng', shortName: 'LĐ', zone: 'Trung', region: 'Tây Nguyên', capital: 'Đà Lạt', area: 9773, population: 1296906, svgPathId: 'VN-LD', neighbors: ['dak-lak', 'dak-nong', 'khanh-hoa', 'ninh-thuan', 'binh-thuan', 'dong-nai', 'binh-phuoc'] },

    // ========================
    // VÙNG NAM (19 tỉnh/thành phố)
    // ========================
    // Đông Nam Bộ
    { id: 'ho-chi-minh', name: 'TP. Hồ Chí Minh', shortName: 'HCM', zone: 'Nam', region: 'Đông Nam Bộ', capital: 'TP. Hồ Chí Minh', area: 2095, population: 9227000, svgPathId: 'VN-HCM', neighbors: ['binh-duong', 'dong-nai', 'tay-ninh', 'long-an', 'ba-ria-vung-tau'] },
    { id: 'ba-ria-vung-tau', name: 'Bà Rịa - Vũng Tàu', shortName: 'BRVT', zone: 'Nam', region: 'Đông Nam Bộ', capital: 'Bà Rịa', area: 1989, population: 1148313, svgPathId: 'VN-BRVT', neighbors: ['dong-nai', 'ho-chi-minh'] },
    { id: 'binh-duong', name: 'Bình Dương', shortName: 'BDg', zone: 'Nam', region: 'Đông Nam Bộ', capital: 'Thủ Dầu Một', area: 2695, population: 2426561, svgPathId: 'VN-BDg', neighbors: ['binh-phuoc', 'tay-ninh', 'ho-chi-minh', 'dong-nai'] },
    { id: 'dong-nai', name: 'Đồng Nai', shortName: 'ĐNa', zone: 'Nam', region: 'Đông Nam Bộ', capital: 'Biên Hoà', area: 5907, population: 3097107, svgPathId: 'VN-DNa', neighbors: ['lam-dong', 'binh-phuoc', 'binh-duong', 'ho-chi-minh', 'ba-ria-vung-tau', 'binh-thuan'] },
    { id: 'tay-ninh', name: 'Tây Ninh', shortName: 'TNi', zone: 'Nam', region: 'Đông Nam Bộ', capital: 'Tây Ninh', area: 4041, population: 1169165, svgPathId: 'VN-TNi', neighbors: ['binh-phuoc', 'binh-duong', 'ho-chi-minh', 'long-an'] },
    { id: 'binh-phuoc', name: 'Bình Phước', shortName: 'BP', zone: 'Nam', region: 'Đông Nam Bộ', capital: 'Đồng Xoài', area: 6871, population: 994679, svgPathId: 'VN-BP', neighbors: ['dak-nong', 'lam-dong', 'dong-nai', 'binh-duong', 'tay-ninh'] },

    // Đồng bằng sông Cửu Long
    { id: 'long-an', name: 'Long An', shortName: 'LA', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Tân An', area: 4492, population: 1688547, svgPathId: 'VN-LA', neighbors: ['tay-ninh', 'ho-chi-minh', 'tien-giang', 'dong-thap'] },
    { id: 'tien-giang', name: 'Tiền Giang', shortName: 'TG', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Mỹ Tho', area: 2510, population: 1764185, svgPathId: 'VN-TG', neighbors: ['long-an', 'dong-thap', 'vinh-long', 'ben-tre'] },
    { id: 'ben-tre', name: 'Bến Tre', shortName: 'BT', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Bến Tre', area: 2360, population: 1288463, svgPathId: 'VN-BTr', neighbors: ['tien-giang', 'vinh-long', 'tra-vinh'] },
    { id: 'vinh-long', name: 'Vĩnh Long', shortName: 'VL', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Vĩnh Long', area: 1479, population: 1022791, svgPathId: 'VN-VL', neighbors: ['dong-thap', 'tien-giang', 'ben-tre', 'tra-vinh', 'can-tho'] },
    { id: 'dong-thap', name: 'Đồng Tháp', shortName: 'ĐT', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Cao Lãnh', area: 3374, population: 1599504, svgPathId: 'VN-DT', neighbors: ['long-an', 'tien-giang', 'vinh-long', 'can-tho', 'an-giang'] },
    { id: 'an-giang', name: 'An Giang', shortName: 'AG', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Long Xuyên', area: 3536, population: 1908352, svgPathId: 'VN-AG', neighbors: ['dong-thap', 'can-tho', 'kien-giang'] },
    { id: 'can-tho', name: 'Cần Thơ', shortName: 'CT', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Cần Thơ', area: 1439, population: 1235171, svgPathId: 'VN-CTh', neighbors: ['an-giang', 'dong-thap', 'vinh-long', 'hau-giang', 'kien-giang'] },
    { id: 'hau-giang', name: 'Hậu Giang', shortName: 'HGi', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Vị Thanh', area: 1602, population: 733017, svgPathId: 'VN-HGi', neighbors: ['can-tho', 'kien-giang', 'soc-trang', 'bac-lieu'] },
    { id: 'kien-giang', name: 'Kiên Giang', shortName: 'KG', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Rạch Giá', area: 6346, population: 1723067, svgPathId: 'VN-KG', neighbors: ['an-giang', 'can-tho', 'hau-giang', 'bac-lieu', 'ca-mau'] },
    { id: 'soc-trang', name: 'Sóc Trăng', shortName: 'ST', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Sóc Trăng', area: 3311, population: 1199653, svgPathId: 'VN-ST', neighbors: ['hau-giang', 'tra-vinh', 'bac-lieu'] },
    { id: 'tra-vinh', name: 'Trà Vinh', shortName: 'TV', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Trà Vinh', area: 2295, population: 1009168, svgPathId: 'VN-TV', neighbors: ['ben-tre', 'vinh-long', 'soc-trang'] },
    { id: 'bac-lieu', name: 'Bạc Liêu', shortName: 'BL', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Bạc Liêu', area: 2584, population: 907236, svgPathId: 'VN-BLi', neighbors: ['hau-giang', 'kien-giang', 'soc-trang', 'ca-mau'] },
    { id: 'ca-mau', name: 'Cà Mau', shortName: 'CM', zone: 'Nam', region: 'Đồng bằng sông Cửu Long', capital: 'Cà Mau', area: 5221, population: 1194476, svgPathId: 'VN-CM', neighbors: ['kien-giang', 'bac-lieu'] },
]
