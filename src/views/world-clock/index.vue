<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

interface City {
  id: string
  name: string
  timezone: string
  flag: string
  code: string
  country: string
  region: string
}

const DEFAULT_CITIES: City[] = [
  { id: 'vn-hcm', name: 'Hồ Chí Minh', country: 'Việt Nam', flag: '🇻🇳', code: 'vn', timezone: 'Asia/Ho_Chi_Minh', region: 'Châu Á' },
  { id: 'vn-hn', name: 'Hà Nội', country: 'Việt Nam', flag: '🇻🇳', code: 'vn', timezone: 'Asia/Ho_Chi_Minh', region: 'Châu Á' },
  { id: 'jp', name: 'Tokyo', country: 'Nhật Bản', flag: '🇯🇵', code: 'jp', timezone: 'Asia/Tokyo', region: 'Châu Á' },
  { id: 'us-ny', name: 'New York', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/New_York', region: 'Châu Mỹ' },
  { id: 'gb', name: 'London', country: 'Anh', flag: '🇬🇧', code: 'gb', timezone: 'Europe/London', region: 'Châu Âu' },
  { id: 'sg', name: 'Singapore', country: 'Singapore', flag: '🇸🇬', code: 'sg', timezone: 'Asia/Singapore', region: 'Châu Á' },
]

const ALL_CITIES: City[] = [
  // ===== VIỆT NAM =====
  { id: 'vn-hcm', name: 'Hồ Chí Minh', country: 'Việt Nam', flag: '🇻🇳', code: 'vn', timezone: 'Asia/Ho_Chi_Minh', region: 'Châu Á' },
  { id: 'vn-hn', name: 'Hà Nội', country: 'Việt Nam', flag: '🇻🇳', code: 'vn', timezone: 'Asia/Ho_Chi_Minh', region: 'Châu Á' },
  { id: 'vn-dn', name: 'Đà Nẵng', country: 'Việt Nam', flag: '🇻🇳', code: 'vn', timezone: 'Asia/Ho_Chi_Minh', region: 'Châu Á' },
  { id: 'vn-ct', name: 'Cần Thơ', country: 'Việt Nam', flag: '🇻🇳', code: 'vn', timezone: 'Asia/Ho_Chi_Minh', region: 'Châu Á' },
  { id: 'vn-hp', name: 'Hải Phòng', country: 'Việt Nam', flag: '🇻🇳', code: 'vn', timezone: 'Asia/Ho_Chi_Minh', region: 'Châu Á' },

  // ===== ĐÔNG NAM Á =====
  { id: 'sg', name: 'Singapore', country: 'Singapore', flag: '🇸🇬', code: 'sg', timezone: 'Asia/Singapore', region: 'Châu Á' },
  { id: 'th-bk', name: 'Bangkok', country: 'Thái Lan', flag: '🇹🇭', code: 'th', timezone: 'Asia/Bangkok', region: 'Châu Á' },
  { id: 'th-cm', name: 'Chiang Mai', country: 'Thái Lan', flag: '🇹🇭', code: 'th', timezone: 'Asia/Bangkok', region: 'Châu Á' },
  { id: 'id-jk', name: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', code: 'id', timezone: 'Asia/Jakarta', region: 'Châu Á' },
  { id: 'id-bl', name: 'Bali', country: 'Indonesia', flag: '🇮🇩', code: 'id', timezone: 'Asia/Makassar', region: 'Châu Á' },
  { id: 'id-sb', name: 'Surabaya', country: 'Indonesia', flag: '🇮🇩', code: 'id', timezone: 'Asia/Jakarta', region: 'Châu Á' },
  { id: 'my-kl', name: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', code: 'my', timezone: 'Asia/Kuala_Lumpur', region: 'Châu Á' },
  { id: 'ph', name: 'Manila', country: 'Philippines', flag: '🇵🇭', code: 'ph', timezone: 'Asia/Manila', region: 'Châu Á' },
  { id: 'mm', name: 'Yangon', country: 'Myanmar', flag: '🇲🇲', code: 'mm', timezone: 'Asia/Rangoon', region: 'Châu Á' },
  { id: 'kh', name: 'Phnom Penh', country: 'Campuchia', flag: '🇰🇭', code: 'kh', timezone: 'Asia/Phnom_Penh', region: 'Châu Á' },
  { id: 'la', name: 'Vientiane', country: 'Lào', flag: '🇱🇦', code: 'la', timezone: 'Asia/Vientiane', region: 'Châu Á' },
  { id: 'bn', name: 'Bandar Seri Begawan', country: 'Brunei', flag: '🇧🇳', code: 'bn', timezone: 'Asia/Brunei', region: 'Châu Á' },
  { id: 'tl', name: 'Dili', country: 'Timor-Leste', flag: '🇹🇱', code: 'tl', timezone: 'Asia/Dili', region: 'Châu Á' },

  // ===== ĐÔNG BẮC Á =====
  { id: 'jp-tk', name: 'Tokyo', country: 'Nhật Bản', flag: '🇯🇵', code: 'jp', timezone: 'Asia/Tokyo', region: 'Châu Á' },
  { id: 'jp-os', name: 'Osaka', country: 'Nhật Bản', flag: '🇯🇵', code: 'jp', timezone: 'Asia/Tokyo', region: 'Châu Á' },
  { id: 'jp-sp', name: 'Sapporo', country: 'Nhật Bản', flag: '🇯🇵', code: 'jp', timezone: 'Asia/Tokyo', region: 'Châu Á' },
  { id: 'kr-sl', name: 'Seoul', country: 'Hàn Quốc', flag: '🇰🇷', code: 'kr', timezone: 'Asia/Seoul', region: 'Châu Á' },
  { id: 'kr-bs', name: 'Busan', country: 'Hàn Quốc', flag: '🇰🇷', code: 'kr', timezone: 'Asia/Seoul', region: 'Châu Á' },
  { id: 'cn-bj', name: 'Bắc Kinh', country: 'Trung Quốc', flag: '🇨🇳', code: 'cn', timezone: 'Asia/Shanghai', region: 'Châu Á' },
  { id: 'cn-sh', name: 'Thượng Hải', country: 'Trung Quốc', flag: '🇨🇳', code: 'cn', timezone: 'Asia/Shanghai', region: 'Châu Á' },
  { id: 'cn-gz', name: 'Quảng Châu', country: 'Trung Quốc', flag: '🇨🇳', code: 'cn', timezone: 'Asia/Shanghai', region: 'Châu Á' },
  { id: 'cn-sz', name: 'Thâm Quyến', country: 'Trung Quốc', flag: '🇨🇳', code: 'cn', timezone: 'Asia/Shanghai', region: 'Châu Á' },
  { id: 'cn-cq', name: 'Trùng Khánh', country: 'Trung Quốc', flag: '🇨🇳', code: 'cn', timezone: 'Asia/Shanghai', region: 'Châu Á' },
  { id: 'hk', name: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰', code: 'hk', timezone: 'Asia/Hong_Kong', region: 'Châu Á' },
  { id: 'mo', name: 'Macau', country: 'Macau', flag: '🇲🇴', code: 'mo', timezone: 'Asia/Macau', region: 'Châu Á' },
  { id: 'tw', name: 'Taipei', country: 'Đài Loan', flag: '🇹🇼', code: 'tw', timezone: 'Asia/Taipei', region: 'Châu Á' },
  { id: 'mn', name: 'Ulaanbaatar', country: 'Mông Cổ', flag: '🇲🇳', code: 'mn', timezone: 'Asia/Ulaanbaatar', region: 'Châu Á' },

  // ===== NAM Á =====
  { id: 'in-mb', name: 'Mumbai', country: 'Ấn Độ', flag: '🇮🇳', code: 'in', timezone: 'Asia/Kolkata', region: 'Châu Á' },
  { id: 'in-dl', name: 'New Delhi', country: 'Ấn Độ', flag: '🇮🇳', code: 'in', timezone: 'Asia/Kolkata', region: 'Châu Á' },
  { id: 'in-bl', name: 'Bangalore', country: 'Ấn Độ', flag: '🇮🇳', code: 'in', timezone: 'Asia/Kolkata', region: 'Châu Á' },
  { id: 'in-cl', name: 'Kolkata', country: 'Ấn Độ', flag: '🇮🇳', code: 'in', timezone: 'Asia/Kolkata', region: 'Châu Á' },
  { id: 'in-ch', name: 'Chennai', country: 'Ấn Độ', flag: '🇮🇳', code: 'in', timezone: 'Asia/Kolkata', region: 'Châu Á' },
  { id: 'pk-kr', name: 'Karachi', country: 'Pakistan', flag: '🇵🇰', code: 'pk', timezone: 'Asia/Karachi', region: 'Châu Á' },
  { id: 'pk-is', name: 'Islamabad', country: 'Pakistan', flag: '🇵🇰', code: 'pk', timezone: 'Asia/Karachi', region: 'Châu Á' },
  { id: 'bd', name: 'Dhaka', country: 'Bangladesh', flag: '🇧🇩', code: 'bd', timezone: 'Asia/Dhaka', region: 'Châu Á' },
  { id: 'lk', name: 'Colombo', country: 'Sri Lanka', flag: '🇱🇰', code: 'lk', timezone: 'Asia/Colombo', region: 'Châu Á' },
  { id: 'np', name: 'Kathmandu', country: 'Nepal', flag: '🇳🇵', code: 'np', timezone: 'Asia/Kathmandu', region: 'Châu Á' },
  { id: 'bt', name: 'Thimphu', country: 'Bhutan', flag: '🇧🇹', code: 'bt', timezone: 'Asia/Thimphu', region: 'Châu Á' },
  { id: 'mv', name: 'Malé', country: 'Maldives', flag: '🇲🇻', code: 'mv', timezone: 'Indian/Maldives', region: 'Châu Á' },
  { id: 'af', name: 'Kabul', country: 'Afghanistan', flag: '🇦🇫', code: 'af', timezone: 'Asia/Kabul', region: 'Châu Á' },

  // ===== TRUNG Á =====
  { id: 'kz-al', name: 'Almaty', country: 'Kazakhstan', flag: '🇰🇿', code: 'kz', timezone: 'Asia/Almaty', region: 'Châu Á' },
  { id: 'kz-nu', name: 'Astana', country: 'Kazakhstan', flag: '🇰🇿', code: 'kz', timezone: 'Asia/Almaty', region: 'Châu Á' },
  { id: 'uz', name: 'Tashkent', country: 'Uzbekistan', flag: '🇺🇿', code: 'uz', timezone: 'Asia/Tashkent', region: 'Châu Á' },
  { id: 'tm', name: 'Ashgabat', country: 'Turkmenistan', flag: '🇹🇲', code: 'tm', timezone: 'Asia/Ashgabat', region: 'Châu Á' },
  { id: 'kg', name: 'Bishkek', country: 'Kyrgyzstan', flag: '🇰🇬', code: 'kg', timezone: 'Asia/Bishkek', region: 'Châu Á' },
  { id: 'tj', name: 'Dushanbe', country: 'Tajikistan', flag: '🇹🇯', code: 'tj', timezone: 'Asia/Dushanbe', region: 'Châu Á' },

  // ===== TRUNG ĐÔNG =====
  { id: 'ae-db', name: 'Dubai', country: 'UAE', flag: '🇦🇪', code: 'ae', timezone: 'Asia/Dubai', region: 'Trung Đông' },
  { id: 'ae-ad', name: 'Abu Dhabi', country: 'UAE', flag: '🇦🇪', code: 'ae', timezone: 'Asia/Dubai', region: 'Trung Đông' },
  { id: 'sa-rh', name: 'Riyadh', country: 'Ả Rập Xê Út', flag: '🇸🇦', code: 'sa', timezone: 'Asia/Riyadh', region: 'Trung Đông' },
  { id: 'sa-jd', name: 'Jeddah', country: 'Ả Rập Xê Út', flag: '🇸🇦', code: 'sa', timezone: 'Asia/Riyadh', region: 'Trung Đông' },
  { id: 'qa', name: 'Doha', country: 'Qatar', flag: '🇶🇦', code: 'qa', timezone: 'Asia/Qatar', region: 'Trung Đông' },
  { id: 'kw', name: 'Kuwait City', country: 'Kuwait', flag: '🇰🇼', code: 'kw', timezone: 'Asia/Kuwait', region: 'Trung Đông' },
  { id: 'bh', name: 'Manama', country: 'Bahrain', flag: '🇧🇭', code: 'bh', timezone: 'Asia/Bahrain', region: 'Trung Đông' },
  { id: 'om', name: 'Muscat', country: 'Oman', flag: '🇴🇲', code: 'om', timezone: 'Asia/Muscat', region: 'Trung Đông' },
  { id: 'il', name: 'Tel Aviv', country: 'Israel', flag: '🇮🇱', code: 'il', timezone: 'Asia/Jerusalem', region: 'Trung Đông' },
  { id: 'tr-is', name: 'Istanbul', country: 'Thổ Nhĩ Kỳ', flag: '🇹🇷', code: 'tr', timezone: 'Europe/Istanbul', region: 'Trung Đông' },
  { id: 'tr-ak', name: 'Ankara', country: 'Thổ Nhĩ Kỳ', flag: '🇹🇷', code: 'tr', timezone: 'Europe/Istanbul', region: 'Trung Đông' },
  { id: 'ir', name: 'Tehran', country: 'Iran', flag: '🇮🇷', code: 'ir', timezone: 'Asia/Tehran', region: 'Trung Đông' },
  { id: 'iq', name: 'Baghdad', country: 'Iraq', flag: '🇮🇶', code: 'iq', timezone: 'Asia/Baghdad', region: 'Trung Đông' },
  { id: 'lb', name: 'Beirut', country: 'Lebanon', flag: '🇱🇧', code: 'lb', timezone: 'Asia/Beirut', region: 'Trung Đông' },
  { id: 'jo', name: 'Amman', country: 'Jordan', flag: '🇯🇴', code: 'jo', timezone: 'Asia/Amman', region: 'Trung Đông' },
  { id: 'sy', name: 'Damascus', country: 'Syria', flag: '🇸🇾', code: 'sy', timezone: 'Asia/Damascus', region: 'Trung Đông' },
  { id: 'ye', name: 'Sanaa', country: 'Yemen', flag: '🇾🇪', code: 'ye', timezone: 'Asia/Aden', region: 'Trung Đông' },
  { id: 'am', name: 'Yerevan', country: 'Armenia', flag: '🇦🇲', code: 'am', timezone: 'Asia/Yerevan', region: 'Trung Đông' },
  { id: 'ge', name: 'Tbilisi', country: 'Georgia', flag: '🇬🇪', code: 'ge', timezone: 'Asia/Tbilisi', region: 'Trung Đông' },
  { id: 'az', name: 'Baku', country: 'Azerbaijan', flag: '🇦🇿', code: 'az', timezone: 'Asia/Baku', region: 'Trung Đông' },
  { id: 'cy', name: 'Nicosia', country: 'Cyprus', flag: '🇨🇾', code: 'cy', timezone: 'Asia/Nicosia', region: 'Trung Đông' },

  // ===== CHÂU ÂU TÂY =====
  { id: 'gb-ln', name: 'London', country: 'Anh', flag: '🇬🇧', code: 'gb', timezone: 'Europe/London', region: 'Châu Âu' },
  { id: 'gb-ed', name: 'Edinburgh', country: 'Anh', flag: '🇬🇧', code: 'gb', timezone: 'Europe/London', region: 'Châu Âu' },
  { id: 'fr-pa', name: 'Paris', country: 'Pháp', flag: '🇫🇷', code: 'fr', timezone: 'Europe/Paris', region: 'Châu Âu' },
  { id: 'fr-ly', name: 'Lyon', country: 'Pháp', flag: '🇫🇷', code: 'fr', timezone: 'Europe/Paris', region: 'Châu Âu' },
  { id: 'de-be', name: 'Berlin', country: 'Đức', flag: '🇩🇪', code: 'de', timezone: 'Europe/Berlin', region: 'Châu Âu' },
  { id: 'de-mu', name: 'Munich', country: 'Đức', flag: '🇩🇪', code: 'de', timezone: 'Europe/Berlin', region: 'Châu Âu' },
  { id: 'de-fr', name: 'Frankfurt', country: 'Đức', flag: '🇩🇪', code: 'de', timezone: 'Europe/Berlin', region: 'Châu Âu' },
  { id: 'de-hm', name: 'Hamburg', country: 'Đức', flag: '🇩🇪', code: 'de', timezone: 'Europe/Berlin', region: 'Châu Âu' },
  { id: 'it-rm', name: 'Rome', country: 'Ý', flag: '🇮🇹', code: 'it', timezone: 'Europe/Rome', region: 'Châu Âu' },
  { id: 'it-ml', name: 'Milan', country: 'Ý', flag: '🇮🇹', code: 'it', timezone: 'Europe/Rome', region: 'Châu Âu' },
  { id: 'es-md', name: 'Madrid', country: 'Tây Ban Nha', flag: '🇪🇸', code: 'es', timezone: 'Europe/Madrid', region: 'Châu Âu' },
  { id: 'es-bc', name: 'Barcelona', country: 'Tây Ban Nha', flag: '🇪🇸', code: 'es', timezone: 'Europe/Madrid', region: 'Châu Âu' },
  { id: 'pt', name: 'Lisbon', country: 'Bồ Đào Nha', flag: '🇵🇹', code: 'pt', timezone: 'Europe/Lisbon', region: 'Châu Âu' },
  { id: 'nl', name: 'Amsterdam', country: 'Hà Lan', flag: '🇳🇱', code: 'nl', timezone: 'Europe/Amsterdam', region: 'Châu Âu' },
  { id: 'be', name: 'Brussels', country: 'Bỉ', flag: '🇧🇪', code: 'be', timezone: 'Europe/Brussels', region: 'Châu Âu' },
  { id: 'ch-zu', name: 'Zurich', country: 'Thụy Sĩ', flag: '🇨🇭', code: 'ch', timezone: 'Europe/Zurich', region: 'Châu Âu' },
  { id: 'ch-ge', name: 'Geneva', country: 'Thụy Sĩ', flag: '🇨🇭', code: 'ch', timezone: 'Europe/Zurich', region: 'Châu Âu' },
  { id: 'at', name: 'Vienna', country: 'Áo', flag: '🇦🇹', code: 'at', timezone: 'Europe/Vienna', region: 'Châu Âu' },
  { id: 'ie', name: 'Dublin', country: 'Ireland', flag: '🇮🇪', code: 'ie', timezone: 'Europe/Dublin', region: 'Châu Âu' },
  { id: 'lu', name: 'Luxembourg', country: 'Luxembourg', flag: '🇱🇺', code: 'lu', timezone: 'Europe/Luxembourg', region: 'Châu Âu' },
  { id: 'mc', name: 'Monaco', country: 'Monaco', flag: '🇲🇨', code: 'mc', timezone: 'Europe/Monaco', region: 'Châu Âu' },
  { id: 'mt', name: 'Valletta', country: 'Malta', flag: '🇲🇹', code: 'mt', timezone: 'Europe/Malta', region: 'Châu Âu' },

  // ===== CHÂU ÂU BẮC =====
  { id: 'se', name: 'Stockholm', country: 'Thụy Điển', flag: '🇸🇪', code: 'se', timezone: 'Europe/Stockholm', region: 'Châu Âu' },
  { id: 'no', name: 'Oslo', country: 'Na Uy', flag: '🇳🇴', code: 'no', timezone: 'Europe/Oslo', region: 'Châu Âu' },
  { id: 'dk', name: 'Copenhagen', country: 'Đan Mạch', flag: '🇩🇰', code: 'dk', timezone: 'Europe/Copenhagen', region: 'Châu Âu' },
  { id: 'fi', name: 'Helsinki', country: 'Phần Lan', flag: '🇫🇮', code: 'fi', timezone: 'Europe/Helsinki', region: 'Châu Âu' },
  { id: 'is', name: 'Reykjavik', country: 'Iceland', flag: '🇮🇸', code: 'is', timezone: 'Atlantic/Reykjavik', region: 'Châu Âu' },
  { id: 'ee', name: 'Tallinn', country: 'Estonia', flag: '🇪🇪', code: 'ee', timezone: 'Europe/Tallinn', region: 'Châu Âu' },
  { id: 'lv', name: 'Riga', country: 'Latvia', flag: '🇱🇻', code: 'lv', timezone: 'Europe/Riga', region: 'Châu Âu' },
  { id: 'lt', name: 'Vilnius', country: 'Lithuania', flag: '🇱🇹', code: 'lt', timezone: 'Europe/Vilnius', region: 'Châu Âu' },

  // ===== CHÂU ÂU ĐÔNG =====
  { id: 'pl-wa', name: 'Warsaw', country: 'Ba Lan', flag: '🇵🇱', code: 'pl', timezone: 'Europe/Warsaw', region: 'Châu Âu' },
  { id: 'pl-kr', name: 'Krakow', country: 'Ba Lan', flag: '🇵🇱', code: 'pl', timezone: 'Europe/Warsaw', region: 'Châu Âu' },
  { id: 'cz', name: 'Prague', country: 'Séc', flag: '🇨🇿', code: 'cz', timezone: 'Europe/Prague', region: 'Châu Âu' },
  { id: 'hu', name: 'Budapest', country: 'Hungary', flag: '🇭🇺', code: 'hu', timezone: 'Europe/Budapest', region: 'Châu Âu' },
  { id: 'sk', name: 'Bratislava', country: 'Slovakia', flag: '🇸🇰', code: 'sk', timezone: 'Europe/Bratislava', region: 'Châu Âu' },
  { id: 'ro', name: 'Bucharest', country: 'Romania', flag: '🇷🇴', code: 'ro', timezone: 'Europe/Bucharest', region: 'Châu Âu' },
  { id: 'bg', name: 'Sofia', country: 'Bulgaria', flag: '🇧🇬', code: 'bg', timezone: 'Europe/Sofia', region: 'Châu Âu' },
  { id: 'gr', name: 'Athens', country: 'Hy Lạp', flag: '🇬🇷', code: 'gr', timezone: 'Europe/Athens', region: 'Châu Âu' },
  { id: 'hr', name: 'Zagreb', country: 'Croatia', flag: '🇭🇷', code: 'hr', timezone: 'Europe/Zagreb', region: 'Châu Âu' },
  { id: 'rs', name: 'Belgrade', country: 'Serbia', flag: '🇷🇸', code: 'rs', timezone: 'Europe/Belgrade', region: 'Châu Âu' },
  { id: 'si', name: 'Ljubljana', country: 'Slovenia', flag: '🇸🇮', code: 'si', timezone: 'Europe/Ljubljana', region: 'Châu Âu' },
  { id: 'ba', name: 'Sarajevo', country: 'Bosnia', flag: '🇧🇦', code: 'ba', timezone: 'Europe/Sarajevo', region: 'Châu Âu' },
  { id: 'al', name: 'Tirana', country: 'Albania', flag: '🇦🇱', code: 'al', timezone: 'Europe/Tirane', region: 'Châu Âu' },
  { id: 'mk', name: 'Skopje', country: 'Bắc Macedonia', flag: '🇲🇰', code: 'mk', timezone: 'Europe/Skopje', region: 'Châu Âu' },
  { id: 'me', name: 'Podgorica', country: 'Montenegro', flag: '🇲🇪', code: 'me', timezone: 'Europe/Podgorica', region: 'Châu Âu' },
  { id: 'md', name: 'Chișinău', country: 'Moldova', flag: '🇲🇩', code: 'md', timezone: 'Europe/Chisinau', region: 'Châu Âu' },
  { id: 'ua', name: 'Kyiv', country: 'Ukraine', flag: '🇺🇦', code: 'ua', timezone: 'Europe/Kiev', region: 'Châu Âu' },
  { id: 'by', name: 'Minsk', country: 'Belarus', flag: '🇧🇾', code: 'by', timezone: 'Europe/Minsk', region: 'Châu Âu' },

  // ===== NGA =====
  { id: 'ru-mo', name: 'Moscow', country: 'Nga', flag: '🇷🇺', code: 'ru', timezone: 'Europe/Moscow', region: 'Châu Âu' },
  { id: 'ru-sp', name: 'St. Petersburg', country: 'Nga', flag: '🇷🇺', code: 'ru', timezone: 'Europe/Moscow', region: 'Châu Âu' },
  { id: 'ru-ek', name: 'Yekaterinburg', country: 'Nga', flag: '🇷🇺', code: 'ru', timezone: 'Asia/Yekaterinburg', region: 'Châu Á' },
  { id: 'ru-nv', name: 'Novosibirsk', country: 'Nga', flag: '🇷🇺', code: 'ru', timezone: 'Asia/Novosibirsk', region: 'Châu Á' },
  { id: 'ru-vl', name: 'Vladivostok', country: 'Nga', flag: '🇷🇺', code: 'ru', timezone: 'Asia/Vladivostok', region: 'Châu Á' },

  // ===== CHÂU PHI =====
  { id: 'eg-cr', name: 'Cairo', country: 'Ai Cập', flag: '🇪🇬', code: 'eg', timezone: 'Africa/Cairo', region: 'Châu Phi' },
  { id: 'eg-al', name: 'Alexandria', country: 'Ai Cập', flag: '🇪🇬', code: 'eg', timezone: 'Africa/Cairo', region: 'Châu Phi' },
  { id: 'za-jb', name: 'Johannesburg', country: 'Nam Phi', flag: '🇿🇦', code: 'za', timezone: 'Africa/Johannesburg', region: 'Châu Phi' },
  { id: 'za-ct', name: 'Cape Town', country: 'Nam Phi', flag: '🇿🇦', code: 'za', timezone: 'Africa/Johannesburg', region: 'Châu Phi' },
  { id: 'ng-lg', name: 'Lagos', country: 'Nigeria', flag: '🇳🇬', code: 'ng', timezone: 'Africa/Lagos', region: 'Châu Phi' },
  { id: 'ng-ab', name: 'Abuja', country: 'Nigeria', flag: '🇳🇬', code: 'ng', timezone: 'Africa/Lagos', region: 'Châu Phi' },
  { id: 'ke', name: 'Nairobi', country: 'Kenya', flag: '🇰🇪', code: 'ke', timezone: 'Africa/Nairobi', region: 'Châu Phi' },
  { id: 'et', name: 'Addis Ababa', country: 'Ethiopia', flag: '🇪🇹', code: 'et', timezone: 'Africa/Addis_Ababa', region: 'Châu Phi' },
  { id: 'gh', name: 'Accra', country: 'Ghana', flag: '🇬🇭', code: 'gh', timezone: 'Africa/Accra', region: 'Châu Phi' },
  { id: 'sn', name: 'Dakar', country: 'Senegal', flag: '🇸🇳', code: 'sn', timezone: 'Africa/Dakar', region: 'Châu Phi' },
  { id: 'ci', name: 'Abidjan', country: 'Ivory Coast', flag: '🇨🇮', code: 'ci', timezone: 'Africa/Abidjan', region: 'Châu Phi' },
  { id: 'ma-cs', name: 'Casablanca', country: 'Morocco', flag: '🇲🇦', code: 'ma', timezone: 'Africa/Casablanca', region: 'Châu Phi' },
  { id: 'ma-rb', name: 'Rabat', country: 'Morocco', flag: '🇲🇦', code: 'ma', timezone: 'Africa/Casablanca', region: 'Châu Phi' },
  { id: 'tn', name: 'Tunis', country: 'Tunisia', flag: '🇹🇳', code: 'tn', timezone: 'Africa/Tunis', region: 'Châu Phi' },
  { id: 'dz', name: 'Algiers', country: 'Algeria', flag: '🇩🇿', code: 'dz', timezone: 'Africa/Algiers', region: 'Châu Phi' },
  { id: 'ly', name: 'Tripoli', country: 'Libya', flag: '🇱🇾', code: 'ly', timezone: 'Africa/Tripoli', region: 'Châu Phi' },
  { id: 'tz', name: 'Dar es Salaam', country: 'Tanzania', flag: '🇹🇿', code: 'tz', timezone: 'Africa/Dar_es_Salaam', region: 'Châu Phi' },
  { id: 'ug', name: 'Kampala', country: 'Uganda', flag: '🇺🇬', code: 'ug', timezone: 'Africa/Kampala', region: 'Châu Phi' },
  { id: 'zw', name: 'Harare', country: 'Zimbabwe', flag: '🇿🇼', code: 'zw', timezone: 'Africa/Harare', region: 'Châu Phi' },
  { id: 'zm', name: 'Lusaka', country: 'Zambia', flag: '🇿🇲', code: 'zm', timezone: 'Africa/Lusaka', region: 'Châu Phi' },
  { id: 'mg', name: 'Antananarivo', country: 'Madagascar', flag: '🇲🇬', code: 'mg', timezone: 'Indian/Antananarivo', region: 'Châu Phi' },
  { id: 'sd', name: 'Khartoum', country: 'Sudan', flag: '🇸🇩', code: 'sd', timezone: 'Africa/Khartoum', region: 'Châu Phi' },
  { id: 'cm', name: 'Yaoundé', country: 'Cameroon', flag: '🇨🇲', code: 'cm', timezone: 'Africa/Douala', region: 'Châu Phi' },
  { id: 'ao', name: 'Luanda', country: 'Angola', flag: '🇦🇴', code: 'ao', timezone: 'Africa/Luanda', region: 'Châu Phi' },
  { id: 'mz', name: 'Maputo', country: 'Mozambique', flag: '🇲🇿', code: 'mz', timezone: 'Africa/Maputo', region: 'Châu Phi' },

  // ===== BẮC MỸ =====
  { id: 'us-ny', name: 'New York', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/New_York', region: 'Châu Mỹ' },
  { id: 'us-la', name: 'Los Angeles', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/Los_Angeles', region: 'Châu Mỹ' },
  { id: 'us-ch', name: 'Chicago', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/Chicago', region: 'Châu Mỹ' },
  { id: 'us-hs', name: 'Houston', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/Chicago', region: 'Châu Mỹ' },
  { id: 'us-dx', name: 'Dallas', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/Chicago', region: 'Châu Mỹ' },
  { id: 'us-ph', name: 'Philadelphia', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/New_York', region: 'Châu Mỹ' },
  { id: 'us-mi', name: 'Miami', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/New_York', region: 'Châu Mỹ' },
  { id: 'us-at', name: 'Atlanta', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/New_York', region: 'Châu Mỹ' },
  { id: 'us-bo', name: 'Boston', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/New_York', region: 'Châu Mỹ' },
  { id: 'us-sf', name: 'San Francisco', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/Los_Angeles', region: 'Châu Mỹ' },
  { id: 'us-se', name: 'Seattle', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/Los_Angeles', region: 'Châu Mỹ' },
  { id: 'us-de', name: 'Denver', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/Denver', region: 'Châu Mỹ' },
  { id: 'us-lv', name: 'Las Vegas', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/Los_Angeles', region: 'Châu Mỹ' },
  { id: 'us-dc', name: 'Washington DC', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/New_York', region: 'Châu Mỹ' },
  { id: 'us-hn', name: 'Honolulu', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'Pacific/Honolulu', region: 'Châu Mỹ' },
  { id: 'us-ak', name: 'Anchorage', country: 'Mỹ', flag: '🇺🇸', code: 'us', timezone: 'America/Anchorage', region: 'Châu Mỹ' },
  { id: 'ca-to', name: 'Toronto', country: 'Canada', flag: '🇨🇦', code: 'ca', timezone: 'America/Toronto', region: 'Châu Mỹ' },
  { id: 'ca-va', name: 'Vancouver', country: 'Canada', flag: '🇨🇦', code: 'ca', timezone: 'America/Vancouver', region: 'Châu Mỹ' },
  { id: 'ca-mo', name: 'Montreal', country: 'Canada', flag: '🇨🇦', code: 'ca', timezone: 'America/Toronto', region: 'Châu Mỹ' },
  { id: 'ca-ca', name: 'Calgary', country: 'Canada', flag: '🇨🇦', code: 'ca', timezone: 'America/Edmonton', region: 'Châu Mỹ' },
  { id: 'ca-ot', name: 'Ottawa', country: 'Canada', flag: '🇨🇦', code: 'ca', timezone: 'America/Toronto', region: 'Châu Mỹ' },
  { id: 'mx-mc', name: 'Mexico City', country: 'Mexico', flag: '🇲🇽', code: 'mx', timezone: 'America/Mexico_City', region: 'Châu Mỹ' },
  { id: 'mx-gd', name: 'Guadalajara', country: 'Mexico', flag: '🇲🇽', code: 'mx', timezone: 'America/Mexico_City', region: 'Châu Mỹ' },
  { id: 'mx-mt', name: 'Monterrey', country: 'Mexico', flag: '🇲🇽', code: 'mx', timezone: 'America/Monterrey', region: 'Châu Mỹ' },

  // ===== TRUNG MỸ & CARIBE =====
  { id: 'gt', name: 'Guatemala City', country: 'Guatemala', flag: '🇬🇹', code: 'gt', timezone: 'America/Guatemala', region: 'Châu Mỹ' },
  { id: 'cr', name: 'San José', country: 'Costa Rica', flag: '🇨🇷', code: 'cr', timezone: 'America/Costa_Rica', region: 'Châu Mỹ' },
  { id: 'pa', name: 'Panama City', country: 'Panama', flag: '🇵🇦', code: 'pa', timezone: 'America/Panama', region: 'Châu Mỹ' },
  { id: 'cu', name: 'Havana', country: 'Cuba', flag: '🇨🇺', code: 'cu', timezone: 'America/Havana', region: 'Châu Mỹ' },
  { id: 'jm', name: 'Kingston', country: 'Jamaica', flag: '🇯🇲', code: 'jm', timezone: 'America/Jamaica', region: 'Châu Mỹ' },
  { id: 'do', name: 'Santo Domingo', country: 'Dominican Republic', flag: '🇩🇴', code: 'do', timezone: 'America/Santo_Domingo', region: 'Châu Mỹ' },
  { id: 'ht', name: 'Port-au-Prince', country: 'Haiti', flag: '🇭🇹', code: 'ht', timezone: 'America/Port-au-Prince', region: 'Châu Mỹ' },

  // ===== NAM MỸ =====
  { id: 'br-sp', name: 'São Paulo', country: 'Brazil', flag: '🇧🇷', code: 'br', timezone: 'America/Sao_Paulo', region: 'Châu Mỹ' },
  { id: 'br-rj', name: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', code: 'br', timezone: 'America/Sao_Paulo', region: 'Châu Mỹ' },
  { id: 'br-bs', name: 'Brasília', country: 'Brazil', flag: '🇧🇷', code: 'br', timezone: 'America/Sao_Paulo', region: 'Châu Mỹ' },
  { id: 'br-mn', name: 'Manaus', country: 'Brazil', flag: '🇧🇷', code: 'br', timezone: 'America/Manaus', region: 'Châu Mỹ' },
  { id: 'ar-ba', name: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', code: 'ar', timezone: 'America/Argentina/Buenos_Aires', region: 'Châu Mỹ' },
  { id: 'ar-co', name: 'Córdoba', country: 'Argentina', flag: '🇦🇷', code: 'ar', timezone: 'America/Argentina/Cordoba', region: 'Châu Mỹ' },
  { id: 'cl', name: 'Santiago', country: 'Chile', flag: '🇨🇱', code: 'cl', timezone: 'America/Santiago', region: 'Châu Mỹ' },
  { id: 'co-bg', name: 'Bogotá', country: 'Colombia', flag: '🇨🇴', code: 'co', timezone: 'America/Bogota', region: 'Châu Mỹ' },
  { id: 'co-md', name: 'Medellín', country: 'Colombia', flag: '🇨🇴', code: 'co', timezone: 'America/Bogota', region: 'Châu Mỹ' },
  { id: 've', name: 'Caracas', country: 'Venezuela', flag: '🇻🇪', code: 've', timezone: 'America/Caracas', region: 'Châu Mỹ' },
  { id: 'pe', name: 'Lima', country: 'Peru', flag: '🇵🇪', code: 'pe', timezone: 'America/Lima', region: 'Châu Mỹ' },
  { id: 'ec', name: 'Quito', country: 'Ecuador', flag: '🇪🇨', code: 'ec', timezone: 'America/Guayaquil', region: 'Châu Mỹ' },
  { id: 'bo', name: 'La Paz', country: 'Bolivia', flag: '🇧🇴', code: 'bo', timezone: 'America/La_Paz', region: 'Châu Mỹ' },
  { id: 'py', name: 'Asunción', country: 'Paraguay', flag: '🇵🇾', code: 'py', timezone: 'America/Asuncion', region: 'Châu Mỹ' },
  { id: 'uy', name: 'Montevideo', country: 'Uruguay', flag: '🇺🇾', code: 'uy', timezone: 'America/Montevideo', region: 'Châu Mỹ' },

  // ===== CHÂU ĐẠI DƯƠNG =====
  { id: 'au-sy', name: 'Sydney', country: 'Úc', flag: '🇦🇺', code: 'au', timezone: 'Australia/Sydney', region: 'Châu Đại Dương' },
  { id: 'au-ml', name: 'Melbourne', country: 'Úc', flag: '🇦🇺', code: 'au', timezone: 'Australia/Melbourne', region: 'Châu Đại Dương' },
  { id: 'au-br', name: 'Brisbane', country: 'Úc', flag: '🇦🇺', code: 'au', timezone: 'Australia/Brisbane', region: 'Châu Đại Dương' },
  { id: 'au-pe', name: 'Perth', country: 'Úc', flag: '🇦🇺', code: 'au', timezone: 'Australia/Perth', region: 'Châu Đại Dương' },
  { id: 'au-ad', name: 'Adelaide', country: 'Úc', flag: '🇦🇺', code: 'au', timezone: 'Australia/Adelaide', region: 'Châu Đại Dương' },
  { id: 'au-dn', name: 'Darwin', country: 'Úc', flag: '🇦🇺', code: 'au', timezone: 'Australia/Darwin', region: 'Châu Đại Dương' },
  { id: 'au-cb', name: 'Canberra', country: 'Úc', flag: '🇦🇺', code: 'au', timezone: 'Australia/Sydney', region: 'Châu Đại Dương' },
  { id: 'nz-ak', name: 'Auckland', country: 'New Zealand', flag: '🇳🇿', code: 'nz', timezone: 'Pacific/Auckland', region: 'Châu Đại Dương' },
  { id: 'nz-wl', name: 'Wellington', country: 'New Zealand', flag: '🇳🇿', code: 'nz', timezone: 'Pacific/Auckland', region: 'Châu Đại Dương' },
  { id: 'nz-ch', name: 'Christchurch', country: 'New Zealand', flag: '🇳🇿', code: 'nz', timezone: 'Pacific/Auckland', region: 'Châu Đại Dương' },
  { id: 'pg', name: 'Port Moresby', country: 'Papua New Guinea', flag: '🇵🇬', code: 'pg', timezone: 'Pacific/Port_Moresby', region: 'Châu Đại Dương' },
  { id: 'fj', name: 'Suva', country: 'Fiji', flag: '🇫🇯', code: 'fj', timezone: 'Pacific/Fiji', region: 'Châu Đại Dương' },
  { id: 'ws', name: 'Apia', country: 'Samoa', flag: '🇼🇸', code: 'ws', timezone: 'Pacific/Apia', region: 'Châu Đại Dương' },
  { id: 'gu', name: 'Hagåtña', country: 'Guam', flag: '🇬🇺', code: 'gu', timezone: 'Pacific/Guam', region: 'Châu Đại Dương' },
]

const REGIONS = ['Tất cả', 'Châu Á', 'Trung Đông', 'Châu Âu', 'Châu Phi', 'Châu Mỹ', 'Châu Đại Dương']

const now = ref(new Date())
const activeCities = ref<City[]>([...DEFAULT_CITIES])
const showPicker = ref(false)
const searchQuery = ref('')
const selectedRegion = ref('Tất cả')
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 1000)
})
onUnmounted(() => clearInterval(timer))

function getTimeInZone(timezone: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(now.value)
}

function getDateInZone(timezone: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: timezone, weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(now.value)
}

function getOffsetLabel(timezone: string) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: timezone, timeZoneName: 'shortOffset' }).formatToParts(now.value)
  return parts.find(p => p.type === 'timeZoneName')?.value ?? ''
}

function isNight(timezone: string) {
  const hour = parseInt(new Intl.DateTimeFormat('en', { timeZone: timezone, hour: 'numeric', hour12: false }).format(now.value))
  return hour < 6 || hour >= 20
}

function getAngle(timezone: string, unit: 'hour' | 'minute' | 'second') {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone, hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  }).formatToParts(now.value)
  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0')
  const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0')
  const s = parseInt(parts.find(p => p.type === 'second')?.value ?? '0')
  if (unit === 'hour') return ((h % 12) * 3600 + m * 60 + s) / 43200 * 360
  if (unit === 'minute') return (m * 60 + s) / 3600 * 360
  return s / 60 * 360
}

function removeCity(id: string) {
  activeCities.value = activeCities.value.filter(c => c.id !== id)
}

function toggleCity(city: City) {
  const exists = activeCities.value.find(c => c.id === city.id)
  if (exists) {
    activeCities.value = activeCities.value.filter(c => c.id !== city.id)
  } else {
    activeCities.value.push(city)
  }
}

function isActive(id: string) {
  return !!activeCities.value.find(c => c.id === id)
}

const filteredCities = computed(() => {
  return ALL_CITIES.filter(c => {
    const matchRegion = selectedRegion.value === 'Tất cả' || c.region === selectedRegion.value
    const q = searchQuery.value.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    return matchRegion && matchSearch
  })
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between px-4 sm:px-6 py-4 max-w-7xl w-full mx-auto">
      <RouterLink to="/" class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary">
        ← Trang chủ
      </RouterLink>
      <h1 class="font-display text-lg sm:text-xl font-bold text-accent-coral flex items-center gap-2">
        🌍 Đồng Hồ Thế Giới
      </h1>
      <button @click="showPicker = !showPicker" class="inline-flex items-center gap-1.5 border border-border-default bg-bg-surface px-3 py-1.5 text-sm text-text-secondary transition hover:border-accent-coral hover:text-text-primary">
        {{ showPicker ? '✕ Đóng' : '+ Thêm thành phố' }}
      </button>
    </header>

    <!-- City Picker -->
    <div v-if="showPicker" class="max-w-7xl w-full mx-auto px-4 sm:px-6 mb-6">
      <div class="border border-border-default bg-bg-surface p-4">
        <!-- Search + Filter -->
        <div class="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Tìm thành phố, quốc gia..."
            class="flex-1 bg-bg-deep border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-accent-coral"
          />
          <div class="flex flex-wrap gap-1">
            <button
              v-for="r in REGIONS" :key="r"
              @click="selectedRegion = r"
              class="px-2 py-1 text-xs border transition"
              :class="selectedRegion === r
                ? 'border-accent-coral text-accent-coral bg-bg-deep'
                : 'border-border-default text-text-secondary hover:border-accent-coral'"
            >{{ r }}</button>
          </div>
        </div>

        <!-- City list -->
        <div class="max-h-48 overflow-y-auto flex flex-wrap gap-2 pr-1">
          <button
            v-for="city in filteredCities" :key="city.id"
            @click="toggleCity(city)"
            class="flex items-center gap-1.5 border px-3 py-1.5 text-sm transition"
            :class="isActive(city.id)
              ? 'border-accent-coral text-accent-coral bg-bg-deep'
              : 'border-border-default text-text-secondary hover:border-accent-coral hover:text-text-primary bg-bg-deep'"
          >
            <img :src="`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${city.code}.svg`" class="w-5 h-3.5 object-cover rounded-sm" :alt="city.country" /> {{ city.name }}
            <span v-if="isActive(city.id)" class="text-xs">✓</span>
          </button>
          <span v-if="filteredCities.length === 0" class="text-text-secondary text-sm py-2">Không tìm thấy thành phố nào.</span>
        </div>

        <p class="text-text-secondary text-xs mt-3">Click để bật/tắt · Đang hiện {{ activeCities.length }} / {{ ALL_CITIES.length }} thành phố</p>
      </div>
    </div>

    <!-- Clock Grid -->
    <main class="flex-1 px-4 sm:px-6 pb-10 max-w-7xl w-full mx-auto">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        <div
          v-for="city in activeCities" :key="city.id"
          class="border border-border-default bg-bg-surface p-4 flex flex-col items-center gap-2 relative group transition hover:border-accent-coral"
        >
          <!-- Remove -->
          <button @click="removeCity(city.id)" class="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center text-text-secondary opacity-0 group-hover:opacity-100 transition hover:text-accent-coral text-base leading-none">×</button>

          <!-- City info -->
          <div class="text-center">
            <img :src="`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${city.code}.svg`" class="w-8 h-6 object-cover rounded-sm shadow mb-0.5" :alt="city.country" />
            <div class="font-display font-bold text-text-primary text-xs leading-tight">{{ city.name }}</div>
            <div class="text-text-secondary text-[10px]">{{ city.country }}</div>
          </div>

          <!-- Analog Clock -->
          <div class="relative w-20 h-20">
            <svg class="w-full h-full" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="56" :fill="isNight(city.timezone) ? '#0f172a' : '#1e293b'" stroke="currentColor" stroke-width="1.5" class="text-border-default" />
              <circle cx="60" cy="60" r="56" fill="none" stroke-width="1" :stroke="isNight(city.timezone) ? '#6366f1' : '#f97316'" opacity="0.25" />
              <line v-for="i in 12" :key="i"
                :x1="60 + 46 * Math.sin((i * 30) * Math.PI / 180)"
                :y1="60 - 46 * Math.cos((i * 30) * Math.PI / 180)"
                :x2="60 + 52 * Math.sin((i * 30) * Math.PI / 180)"
                :y2="60 - 52 * Math.cos((i * 30) * Math.PI / 180)"
                stroke="currentColor" stroke-width="1.5" class="text-text-secondary" opacity="0.4"
              />
              <!-- Hour -->
              <line x1="60" y1="60"
                :x2="60 + 26 * Math.sin(getAngle(city.timezone, 'hour') * Math.PI / 180)"
                :y2="60 - 26 * Math.cos(getAngle(city.timezone, 'hour') * Math.PI / 180)"
                stroke="white" stroke-width="3" stroke-linecap="round"
              />
              <!-- Minute -->
              <line x1="60" y1="60"
                :x2="60 + 36 * Math.sin(getAngle(city.timezone, 'minute') * Math.PI / 180)"
                :y2="60 - 36 * Math.cos(getAngle(city.timezone, 'minute') * Math.PI / 180)"
                stroke="white" stroke-width="2" stroke-linecap="round"
              />
              <!-- Second -->
              <line x1="60" y1="60"
                :x2="60 + 42 * Math.sin(getAngle(city.timezone, 'second') * Math.PI / 180)"
                :y2="60 - 42 * Math.cos(getAngle(city.timezone, 'second') * Math.PI / 180)"
                :stroke="isNight(city.timezone) ? '#818cf8' : '#f97316'"
                stroke-width="1.5" stroke-linecap="round"
              />
              <circle cx="60" cy="60" r="2.5" fill="white" />
            </svg>
            <div class="absolute top-0.5 right-0.5 text-[10px]">{{ isNight(city.timezone) ? '🌙' : '☀️' }}</div>
          </div>

          <!-- Digital -->
          <div class="text-center">
            <div class="font-display font-bold text-lg tabular-nums leading-tight text-text-primary">
              {{ getTimeInZone(city.timezone) }}
            </div>
            <div class="text-text-secondary text-[10px] mt-0.5">{{ getDateInZone(city.timezone) }}</div>
            <div class="text-[10px] font-semibold mt-0.5" :class="isNight(city.timezone) ? 'text-indigo-400' : 'text-orange-400'">
              {{ getOffsetLabel(city.timezone) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeCities.length === 0" class="text-center py-20 text-text-secondary">
        <div class="text-5xl mb-4">🌍</div>
        <p class="font-display">Chưa có thành phố nào. Nhấn "Thêm thành phố" để bắt đầu!</p>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-border-default py-4 px-6 text-center text-text-secondary text-xs">
      Made by
      <a href="https://kingcongstudio.com" target="_blank" rel="noopener" class="text-accent-coral hover:underline ml-1">KingCong Studio</a>
    </footer>
  </div>
</template>
