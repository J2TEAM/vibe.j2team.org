/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * CANCHI ENGINE - TypeScript
 */

// ============================================================================
// TYPES
// ============================================================================

export interface LasoInput {
  ngayAm: number
  thangAm: number
  namAm: number
  gio: number
  gioiTinh: 'nam' | 'nu'
  namXem?: number
  // Ngày dương lịch (để tính Can Chi Ngày)
  ngayDuong?: number
  thangDuong?: number
  namDuong?: number
}

export interface Sao {
  id: number
  ten: string
  cung: number
  dacTinh?: 'M' | 'V' | 'D' | 'H' | 'B'
  nguHanh?: 'hoa' | 'moc' | 'tho' | 'kim' | 'thuy'
  tuHoa?: 'loc' | 'quyen' | 'khoa' | 'ky'
  isTot?: boolean // true = cát tinh (cột trái), false = hung tinh (cột phải)
}

export interface Cung {
  viTri: number
  tenCung: string
  canCung: string
  chiCung: string
  tenCungMenh: string
  isMenh: boolean
  isThan: boolean
  saoChinhTinh: Sao[]
  saoPhu: Sao[]
  trangSinh: string
  daiHan: number
  tieuHan?: string
  nguyetHan?: number
  triet?: boolean
  tuan?: boolean
}

export interface Laso {
  input: LasoInput
  canNam: number
  chiNam: number
  canThang: number
  chiThang: number
  canNgay: number
  chiNgay: number
  canGio: number
  chiGio: number
  cungMenh: number
  cungThan: number
  cuc: number
  cucTen: string
  amDuong: string
  napAm: string
  tuoiHan: number
  isNghichLy: boolean
  cucSinhKhac: string
  cung: Cung[]
  tuHoa: {
    loc: string
    quyen: string
    khoa: string
    ky: string
  }
  trietLo: [number, number]
  tuanTriet: [number, number]
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CUNG_NAMES: Record<number, string> = {
  1: 'Tý',
  2: 'Sửu',
  3: 'Dần',
  4: 'Mão',
  5: 'Thìn',
  6: 'Tỵ',
  7: 'Ngọ',
  8: 'Mùi',
  9: 'Thân',
  10: 'Dậu',
  11: 'Tuất',
  12: 'Hợi',
}

export const CAN_NAMES: Record<number, string> = {
  1: 'Giáp',
  2: 'Ất',
  3: 'Bính',
  4: 'Đinh',
  5: 'Mậu',
  6: 'Kỷ',
  7: 'Canh',
  8: 'Tân',
  9: 'Nhâm',
  10: 'Quý',
}

export const CAN_SHORT: Record<number, string> = {
  1: 'G',
  2: 'Ấ',
  3: 'B',
  4: 'Đ',
  5: 'M',
  6: 'K',
  7: 'C',
  8: 'T',
  9: 'N',
  10: 'Q',
}

export const CUC_NAMES: Record<number, string> = {
  2: 'Thủy nhị Cục',
  3: 'Mộc tam Cục',
  4: 'Kim tứ Cục',
  5: 'Thổ ngũ Cục',
  6: 'Hỏa lục Cục',
}

export const MENH_CUNG_NAMES = [
  '',
  'Mệnh',
  'Phụ mẫu',
  'Phúc đức',
  'Điền trạch',
  'Quan lộc',
  'Nô bộc',
  'Thiên di',
  'Tật ách',
  'Tài bạch',
  'Tử tức',
  'Phu thê',
  'Huynh đệ',
]

// Tên 12 cung theo vị trí Mệnh
const CUNG_ORDER = [
  'Mệnh',
  'Phụ mẫu',
  'Phúc đức',
  'Điền trạch',
  'Quan lộc',
  'Nô bộc',
  'Thiên di',
  'Tật ách',
  'Tài bạch',
  'Tử tức',
  'Phu thê',
  'Huynh đệ',
]

// Tràng Sinh 12 vị
const TRANG_SINH_NAMES = [
  'Tràng sinh',
  'Mộc dục',
  'Quan đới',
  'Lâm quan',
  'Đế vượng',
  'Suy',
  'Bệnh',
  'Tử',
  'Mộ',
  'Tuyệt',
  'Thai',
  'Dưỡng',
]

// Bảng đổi giờ sang Chi giờ
const GIO_TO_CHI: Record<number, number> = {
  23: 1,
  0: 1, // Tý
  1: 2,
  2: 2, // Sửu
  3: 3,
  4: 3, // Dần
  5: 4,
  6: 4, // Mão
  7: 5,
  8: 5, // Thìn
  9: 6,
  10: 6, // Tỵ
  11: 7,
  12: 7, // Ngọ
  13: 8,
  14: 8, // Mùi
  15: 9,
  16: 9, // Thân
  17: 10,
  18: 10, // Dậu
  19: 11,
  20: 11, // Tuất
  21: 12,
  22: 12, // Hợi
}

// Bảng Nạp Âm (60 Giáp Tý) - Ngũ Hành bản mệnh theo năm sinh
const NAP_AM: Record<string, string> = {
  // Giáp Tý, Ất Sửu - Hải Trung Kim
  'Giáp Tý': 'Hải trung kim',
  'Ất Sửu': 'Hải trung kim',
  // Bính Dần, Đinh Mão - Lư Trung Hỏa
  'Bính Dần': 'Lư trung hỏa',
  'Đinh Mão': 'Lư trung hỏa',
  // Mậu Thìn, Kỷ Tỵ - Đại Lâm Mộc
  'Mậu Thìn': 'Đại lâm mộc',
  'Kỷ Tỵ': 'Đại lâm mộc',
  // Canh Ngọ, Tân Mùi - Lộ Bàng Thổ
  'Canh Ngọ': 'Lộ bàng thổ',
  'Tân Mùi': 'Lộ bàng thổ',
  // Nhâm Thân, Quý Dậu - Kiếm Phong Kim
  'Nhâm Thân': 'Kiếm phong kim',
  'Quý Dậu': 'Kiếm phong kim',
  // Giáp Tuất, Ất Hợi - Sơn Đầu Hỏa
  'Giáp Tuất': 'Sơn đầu hỏa',
  'Ất Hợi': 'Sơn đầu hỏa',
  // Bính Tý, Đinh Sửu - Giản Hạ Thủy
  'Bính Tý': 'Giản hạ thủy',
  'Đinh Sửu': 'Giản hạ thủy',
  // Mậu Dần, Kỷ Mão - Thành Đầu Thổ
  'Mậu Dần': 'Thành đầu thổ',
  'Kỷ Mão': 'Thành đầu thổ',
  // Canh Thìn, Tân Tỵ - Bạch Lạp Kim
  'Canh Thìn': 'Bạch lạp kim',
  'Tân Tỵ': 'Bạch lạp kim',
  // Nhâm Ngọ, Quý Mùi - Dương Liễu Mộc
  'Nhâm Ngọ': 'Dương liễu mộc',
  'Quý Mùi': 'Dương liễu mộc',
  // Giáp Thân, Ất Dậu - Tuyền Trung Thủy
  'Giáp Thân': 'Tuyền trung thủy',
  'Ất Dậu': 'Tuyền trung thủy',
  // Bính Tuất, Đinh Hợi - Ốc Thượng Thổ
  'Bính Tuất': 'Ốc thượng thổ',
  'Đinh Hợi': 'Ốc thượng thổ',
  // Mậu Tý, Kỷ Sửu - Thích Lịch Hỏa
  'Mậu Tý': 'Thích lịch hỏa',
  'Kỷ Sửu': 'Thích lịch hỏa',
  // Canh Dần, Tân Mão - Tùng Bách Mộc
  'Canh Dần': 'Tùng bách mộc',
  'Tân Mão': 'Tùng bách mộc',
  // Nhâm Thìn, Quý Tỵ - Trường Lưu Thủy
  'Nhâm Thìn': 'Trường lưu thủy',
  'Quý Tỵ': 'Trường lưu thủy',
  // Giáp Ngọ, Ất Mùi - Sa Trung Kim
  'Giáp Ngọ': 'Sa trung kim',
  'Ất Mùi': 'Sa trung kim',
  // Bính Thân, Đinh Dậu - Sơn Hạ Hỏa
  'Bính Thân': 'Sơn hạ hỏa',
  'Đinh Dậu': 'Sơn hạ hỏa',
  // Mậu Tuất, Kỷ Hợi - Bình Địa Mộc
  'Mậu Tuất': 'Bình địa mộc',
  'Kỷ Hợi': 'Bình địa mộc',
  // Canh Tý, Tân Sửu - Bích Thượng Thổ
  'Canh Tý': 'Bích thượng thổ',
  'Tân Sửu': 'Bích thượng thổ',
  // Nhâm Dần, Quý Mão - Kim Bạc Kim
  'Nhâm Dần': 'Kim bạc kim',
  'Quý Mão': 'Kim bạc kim',
  // Giáp Thìn, Ất Tỵ - Phú Đăng Hỏa
  'Giáp Thìn': 'Phú đăng hỏa',
  'Ất Tỵ': 'Phú đăng hỏa',
  // Bính Ngọ, Đinh Mùi - Thiên Hà Thủy
  'Bính Ngọ': 'Thiên hà thủy',
  'Đinh Mùi': 'Thiên hà thủy',
  // Mậu Thân, Kỷ Dậu - Đại Trạch Thổ
  'Mậu Thân': 'Đại trạch thổ',
  'Kỷ Dậu': 'Đại trạch thổ',
  // Canh Tuất, Tân Hợi - Thoa Xuyến Kim
  'Canh Tuất': 'Thoa xuyến kim',
  'Tân Hợi': 'Thoa xuyến kim',
  // Nhâm Tý, Quý Sửu - Tang Đố Mộc
  'Nhâm Tý': 'Tang đố mộc',
  'Quý Sửu': 'Tang đố mộc',
  // Giáp Dần, Ất Mão - Đại Khe Thủy
  'Giáp Dần': 'Đại khê thủy',
  'Ất Mão': 'Đại khê thủy',
  // Bính Thìn, Đinh Tỵ - Sa Trung Thổ
  'Bính Thìn': 'Sa trung thổ',
  'Đinh Tỵ': 'Sa trung thổ',
  // Mậu Ngọ, Kỷ Mùi - Thiên Thượng Hỏa
  'Mậu Ngọ': 'Thiên thượng hỏa',
  'Kỷ Mùi': 'Thiên thượng hỏa',
  // Canh Thân, Tân Dậu - Thạch Lựu Mộc
  'Canh Thân': 'Thạch lựu mộc',
  'Tân Dậu': 'Thạch lựu mộc',
  // Nhâm Tuất, Quý Hợi - Đại Hải Thủy
  'Nhâm Tuất': 'Đại hải thủy',
  'Quý Hợi': 'Đại hải thủy',
}

// Giờ chi và khoảng thời gian
const GIO_TIME_RANGE: Record<number, string> = {
  0: '0h - 0h59', // Tý sớm
  1: '1h - 2h59',
  3: '3h - 4h59',
  5: '5h - 6h59',
  7: '7h - 8h59',
  9: '9h - 10h59',
  11: '11h - 12h59',
  13: '13h - 14h59',
  15: '15h - 16h59',
  17: '17h - 18h59',
  19: '19h - 20h59',
  21: '21h - 22h59',
  23: '23h - 23h59', // Tý muộn
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

export function gioToChi(hour: number): number {
  return GIO_TO_CHI[hour] ?? 1
}

// Tính Can Tháng từ Can Năm và Chi Tháng (tháng âm lịch)
// Công thức Ngũ Dần Đầu: Giáp/Kỷ -> Bính Dần, Ất/Canh -> Mậu Dần, Bính/Tân -> Canh Dần, Đinh/Nhâm -> Nhâm Dần, Mậu/Quý -> Giáp Dần
export function tinhCanThang(canNam: number, chiThang: number): number {
  // canNam: 1-10 (Giáp-Quý)
  // Chi tháng Dần = 3
  // Can đầu tháng Dần (tháng 1 âm lịch) theo Can năm:
  // Giáp(1)/Kỷ(6) -> Bính(3), Ất(2)/Canh(7) -> Mậu(5), Bính(3)/Tân(8) -> Canh(7), Đinh(4)/Nhâm(9) -> Nhâm(9), Mậu(5)/Quý(10) -> Giáp(1)
  const canDanMap: Record<number, number> = {
    1: 3,
    6: 3, // Giáp, Kỷ -> Bính
    2: 5,
    7: 5, // Ất, Canh -> Mậu
    3: 7,
    8: 7, // Bính, Tân -> Canh
    4: 9,
    9: 9, // Đinh, Nhâm -> Nhâm
    5: 1,
    10: 1, // Mậu, Quý -> Giáp
  }
  const canDan = canDanMap[canNam]
  // Chi Tháng 1 = Dần (3), nên offset = chiThang - 3
  // Can = (canDan - 1 + offset) % 10 + 1
  const offset = (chiThang - 3 + 12) % 12
  const canThang = ((canDan - 1 + offset) % 10) + 1
  return canThang
}

// Tính Can Giờ từ Can Ngày và Chi Giờ
// Công thức Ngũ Tý Đầu theo bảng:
// Giáp/Kỷ (1,6) → Giáp Tý (1), Ất/Canh (2,7) → Bính Tý (3), Bính/Tân (3,8) → Mậu Tý (5), Đinh/Nhâm (4,9) → Canh Tý (7), Mậu/Quý (5,10) → Nhâm Tý (9)
export function tinhCanGio(canNgay: number, chiGio: number): number {
  // Can đầu giờ Tý theo Ngũ Tý Đầu
  // canNgay: 1=Giáp, 2=Ất, 3=Bính, 4=Đinh, 5=Mậu, 6=Kỷ, 7=Canh, 8=Tân, 9=Nhâm, 10=Quý
  const canTyBase = ((canNgay - 1) % 5) * 2 + 1
  // Từ Tý đi tới Chi Giờ (chiGio: 1=Tý, 2=Sửu, ...)
  const canGio = ((canTyBase - 1 + chiGio - 1) % 10) + 1
  return canGio
}

// Tính Julian Day Number từ ngày dương lịch
// Công thức: https://en.wikipedia.org/wiki/Julian_day
export function tinhJulianDay(ngay: number, thang: number, nam: number): number {
  const a = Math.floor((14 - thang) / 12)
  const y = nam + 4800 - a
  const m = thang + 12 * a - 3
  return (
    ngay +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  )
}

// Tính Can Chi Ngày từ ngày dương lịch
// Đã kiểm chứng với ngày 3/10/2000 = Giáp Ngọ
export function tinhCanChiNgay(
  ngay: number,
  thang: number,
  nam: number,
): { canNgay: number; chiNgay: number } {
  const jdn = tinhJulianDay(ngay, thang, nam)
  const canNgay = ((jdn + 9) % 10) + 1 // 1-10 (Giáp=1, Ất=2, ...)
  const chiNgay = ((jdn + 1) % 12) + 1 // 1-12 (Tý=1, Sửu=2, ...)
  return { canNgay, chiNgay }
}

// Lấy Nạp Âm (Ngũ Hành bản mệnh) theo Can Chi năm
export function getNapAm(can: number, chi: number): string {
  const canChi = `${CAN_NAMES[can]} ${CUNG_NAMES[chi]}`
  return NAP_AM[canChi] || ''
}

// Lấy khoảng thời gian của giờ (nhận giờ gốc, không phải chi giờ)
export function getGioTimeRange(gio: number): string {
  return GIO_TIME_RANGE[gio] || ''
}

export function anMenh(thangAm: number, chiGio: number): number {
  const cung = (((3 + thangAm - chiGio) % 12) + 12) % 12
  return cung === 0 ? 12 : cung
}

export function anThan(thangAm: number, chiGio: number): number {
  // base=1, đi thuận theo tháng và giờ
  const cung = (1 + thangAm + chiGio) % 12
  return cung === 0 ? 12 : cung
}

export function tinhCuc(canNam: number, cungMenh: number): number {
  // Bảng Cục theo Can năm + Cung Mệnh
  // Pattern: mỗi cặp cung liên tiếp dùng cùng Cục
  const CUC_TABLE: Record<number, Record<number, number>> = {
    // Giáp-Kỷ: Thủy(2), Hỏa(6), Mộc(3), Thổ(5), Kim(4), Hỏa(6)
    1: { 1: 2, 2: 2, 3: 6, 4: 6, 5: 3, 6: 3, 7: 5, 8: 5, 9: 4, 10: 4, 11: 6, 12: 6 }, // Giáp
    6: { 1: 2, 2: 2, 3: 6, 4: 6, 5: 3, 6: 3, 7: 5, 8: 5, 9: 4, 10: 4, 11: 6, 12: 6 }, // Kỷ
    // Ất-Canh: Hỏa(6), Thổ(5), Kim(4), Mộc(3), Thủy(2), Thổ(5)
    2: { 1: 6, 2: 6, 3: 5, 4: 5, 5: 4, 6: 4, 7: 3, 8: 3, 9: 2, 10: 2, 11: 5, 12: 5 }, // Ất
    7: { 1: 6, 2: 6, 3: 5, 4: 5, 5: 4, 6: 4, 7: 3, 8: 3, 9: 2, 10: 2, 11: 5, 12: 5 }, // Canh
    // Bính-Tân: Thổ(5), Mộc(3), Thủy(2), Kim(4), Hỏa(6), Mộc(3)
    3: { 1: 5, 2: 5, 3: 3, 4: 3, 5: 2, 6: 2, 7: 4, 8: 4, 9: 6, 10: 6, 11: 3, 12: 3 }, // Bính
    8: { 1: 5, 2: 5, 3: 3, 4: 3, 5: 2, 6: 2, 7: 4, 8: 4, 9: 6, 10: 6, 11: 3, 12: 3 }, // Tân
    // Đinh-Nhâm: Mộc(3), Kim(4), Hỏa(6), Thủy(2), Thổ(5), Kim(4)
    4: { 1: 3, 2: 3, 3: 4, 4: 4, 5: 6, 6: 6, 7: 2, 8: 2, 9: 5, 10: 5, 11: 4, 12: 4 }, // Đinh
    9: { 1: 3, 2: 3, 3: 4, 4: 4, 5: 6, 6: 6, 7: 2, 8: 2, 9: 5, 10: 5, 11: 4, 12: 4 }, // Nhâm
    // Mậu-Quý: Kim(4), Thủy(2), Thổ(5), Hỏa(6), Mộc(3), Thủy(2)
    5: { 1: 4, 2: 4, 3: 2, 4: 2, 5: 5, 6: 5, 7: 6, 8: 6, 9: 3, 10: 3, 11: 2, 12: 2 }, // Mậu
    10: { 1: 4, 2: 4, 3: 2, 4: 2, 5: 5, 6: 5, 7: 6, 8: 6, 9: 3, 10: 3, 11: 2, 12: 2 }, // Quý
  }

  // Validation
  if (!CUC_TABLE[canNam] || !CUC_TABLE[canNam][cungMenh]) {
    console.error('tinhCuc: Invalid canNam or cungMenh', { canNam, cungMenh })
    return 2 // Default to Thủy nhị cục
  }
  return CUC_TABLE[canNam][cungMenh]
}

export function anTuVi(cuc: number, ngayAm: number): number {
  // Bảng lookup - dùng du = ngay % cuc (không trừ 1)
  // Formula: cung = ((base - 1 + thuong) % 12) + 1
  // where du = ngay % cuc, thuong = floor((ngay-1)/cuc)
  const LOOKUP: Record<number, Record<number, number>> = {
    // THUY 2 CUC: du=1 => Dần(3), du=0 => Mão(4)
    2: { 1: 3, 0: 4 },
    // MOC 3 CUC: du=1 => Thìn(5), du=2 => Sửu(2), du=0 => Dần(3)
    3: { 1: 5, 2: 2, 0: 3 },
    // KIM 4 CUC: du=1 => Hợi(12), du=2 => Thìn(5), du=3 => Sửu(2), du=0 => Dần(3)
    4: { 1: 12, 2: 5, 3: 2, 0: 3 },
    // THO 5 CUC: du=1 => Ngọ(7), du=2 => Hợi(12), du=3 => Thìn(5), du=4 => Sửu(2), du=0 => Dần(3)
    5: { 1: 7, 2: 12, 3: 5, 4: 2, 0: 3 },
    // HOA 6 CUC: du=1 => Dậu(10), du=2 => Ngọ(7), du=3 => Hợi(12), du=4 => Thìn(5), du=5 => Sửu(2), du=0 => Dần(3)
    6: { 1: 10, 2: 7, 3: 12, 4: 5, 5: 2, 0: 3 },
  }

  // Validation
  if (isNaN(cuc) || isNaN(ngayAm) || !LOOKUP[cuc]) {
    console.error('anTuVi: Invalid cuc or ngayAm', { cuc, ngayAm })
    return 1 // Default
  }

  const du = ngayAm % cuc
  const thuong = Math.floor((ngayAm - 1) / cuc)

  if (LOOKUP[cuc][du] === undefined) {
    console.error('anTuVi: Invalid du', { cuc, ngayAm, du })
    return 1
  }

  const base = LOOKUP[cuc][du]
  const viTri = ((base - 1 + thuong) % 12) + 1
  return viTri
}

function pos(base: number, offset: number): number {
  return ((base - 1 + offset + 120) % 12) + 1
}

export function an14ChinhTinh(tuViPos: number): Record<string, number> {
  // Bảng Thiên Phủ theo Tử Vi (đối xứng qua trục Dần-Thân)
  const THIEN_PHU: Record<number, number> = {
    1: 5,
    2: 4,
    3: 3,
    4: 2,
    5: 1,
    6: 12,
    7: 11,
    8: 10,
    9: 9,
    10: 8,
    11: 7,
    12: 6,
  }

  const tv = tuViPos
  const tp = THIEN_PHU[tv]

  // Vòng Tử Vi: đi THUẬN từ Tử Vi
  // Liêm Trinh +4, Thiên Đồng +7, Vũ Khúc +8, Thái Dương +9, Thiên Cơ +11
  // Vòng Thiên Phủ: đi THUẬN từ Thiên Phủ
  // Thái Âm +1, Tham Lang +2, Cự Môn +3, Thiên Tướng +4, Thiên Lương +5, Thất Sát +6, Phá Quân +10
  return {
    'Tử Vi': tv,
    'Liêm Trinh': pos(tv, 4),
    'Thiên Đồng': pos(tv, 7),
    'Vũ Khúc': pos(tv, 8),
    'Thái Dương': pos(tv, 9),
    'Thiên Cơ': pos(tv, 11),
    'Thiên Phủ': tp,
    'Thái Âm': pos(tp, 1),
    'Tham Lang': pos(tp, 2),
    'Cự Môn': pos(tp, 3),
    'Thiên Tướng': pos(tp, 4),
    'Thiên Lương': pos(tp, 5),
    'Thất Sát': pos(tp, 6),
    'Phá Quân': pos(tp, 10),
  }
}

// ============================================================================
// LỘC TỒN & TỨ HÓA
// ============================================================================

export function anLocTon(canNam: number): number {
  const LOC_TON: Record<number, number> = {
    1: 3,
    2: 4,
    3: 6,
    4: 7,
    5: 6,
    6: 7,
    7: 9,
    8: 10,
    9: 12,
    10: 1,
  }
  return LOC_TON[canNam]
}

export function anKinhDuong(canNam: number): number {
  const KINH_DUONG: Record<number, number> = {
    1: 4,
    2: 5,
    3: 7,
    4: 8,
    5: 7,
    6: 8,
    7: 10,
    8: 11,
    9: 1,
    10: 2,
  }
  return KINH_DUONG[canNam]
}

export function anDaLa(canNam: number): number {
  const DA_LA: Record<number, number> = {
    1: 2,
    2: 3,
    3: 5,
    4: 6,
    5: 5,
    6: 6,
    7: 8,
    8: 9,
    9: 11,
    10: 12,
  }
  return DA_LA[canNam]
}

export function anTuHoa(canNam: number): [string, string, string, string] {
  const TU_HOA: Record<number, [string, string, string, string]> = {
    1: ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'],
    2: ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'],
    3: ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'],
    4: ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'],
    5: ['Tham Lang', 'Thái Âm', 'Hữu Bật', 'Thiên Cơ'],
    6: ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'],
    7: ['Thái Dương', 'Vũ Khúc', 'Thái Âm', 'Thiên Đồng'],
    8: ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'],
    9: ['Thiên Lương', 'Tử Vi', 'Tả Phụ', 'Vũ Khúc'],
    10: ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang'],
  }
  return TU_HOA[canNam]
}

// ============================================================================
// SÁT TINH
// ============================================================================

// Helper function
function normalize(n: number): number {
  const result = n % 12
  return result <= 0 ? result + 12 : result
}

function getTamHopGroup(chiNam: number): number {
  if ([3, 7, 11].includes(chiNam)) return 1 // Dần-Ngọ-Tuất
  if ([9, 1, 5].includes(chiNam)) return 2 // Thân-Tý-Thìn
  if ([6, 10, 2].includes(chiNam)) return 3 // Tỵ-Dậu-Sửu
  return 4 // Hợi-Mão-Mùi (12, 4, 8)
}

export function anHoaTinh(chiNam: number, chiGio: number): number {
  // Hỏa Tinh theo Tam Hợp
  // Nhóm 1 (Dần-Ngọ-Tuất): An Dần đi thuận
  // Nhóm 2 (Thân-Tý-Thìn): An Mão đi thuận
  // Nhóm 3 (Tỵ-Dậu-Sửu): An Dần đi nghịch
  // Nhóm 4 (Hợi-Mão-Mùi): An Thân đi nghịch
  const group = getTamHopGroup(chiNam)
  if (group === 1) return normalize(3 + (chiGio - 2)) // Dần đi thuận
  if (group === 2) return normalize(4 + (chiGio - 2)) // Mão đi thuận
  if (group === 3) return normalize(3 - (chiGio - 2)) // Dần đi nghịch
  return normalize(9 - (chiGio - 2)) // Thân đi nghịch
}

export function anLinhTinh(chiNam: number, chiGio: number): number {
  // Linh Tinh theo Tam Hợp
  // Nhóm 1 (Dần-Ngọ-Tuất): An Dần đi nghịch
  // Nhóm 2 (Thân-Tý-Thìn): An Dậu đi nghịch
  // Nhóm 3 (Tỵ-Dậu-Sửu): An Hợi đi thuận
  // Nhóm 4 (Hợi-Mão-Mùi): An Hợi đi thuận
  const group = getTamHopGroup(chiNam)
  if (group === 1) return normalize(3 - (chiGio - 2)) // Dần đi nghịch
  if (group === 2) return normalize(10 - (chiGio - 2)) // Dậu đi nghịch
  if (group === 3) return normalize(12 + (chiGio - 2)) // Hợi đi thuận
  return normalize(12 + (chiGio - 2)) // Hợi đi thuận
}

export function anDiaKhong(chiGio: number): number {
  // Địa Không = 13 - chiGio (an Hợi, đi nghịch)
  const result = 13 - chiGio
  return result <= 12 ? result : result - 12
}

export function anDiaKiep(chiGio: number): number {
  // Địa Kiếp = chiGio - 1 (an Hợi, đi thuận)
  const result = chiGio - 1
  return result > 0 ? result : 12
}

// ============================================================================
// PHU TINH
// ============================================================================

export function anTaPhu(thangAm: number): number {
  return ((5 - 1 + thangAm - 1) % 12) + 1 // Thìn + (thang-1)
}

export function anHuuBat(thangAm: number): number {
  return ((11 - 1 - (thangAm - 1) + 120) % 12) + 1 // Tuất - (thang-1)
}

export function anVanXuong(chiGio: number): number {
  return ((11 - 1 - (chiGio - 1) + 120) % 12) + 1 // Tuất - (gio-1)
}

export function anVanKhuc(chiGio: number): number {
  return ((5 - 1 + chiGio - 1) % 12) + 1 // Thìn + (gio-1)
}

export function anThienKhoi(canNam: number): number {
  // Giáp-Sửu, Ất-Tý, Bính-Hợi, Đinh-Hợi, Mậu-Sửu, Kỷ-Tý, Canh-Ngọ, Tân-Ngọ, Nhâm-Mão, Quý-Mão
  const THIEN_KHOI: Record<number, number> = {
    1: 2,
    2: 1,
    3: 12,
    4: 12,
    5: 2,
    6: 1,
    7: 7,
    8: 7,
    9: 4,
    10: 4,
  }
  return THIEN_KHOI[canNam]
}

export function anThienViet(canNam: number): number {
  // Giáp-Mùi, Ất-Thân, Bính-Dậu, Đinh-Dậu, Mậu-Mùi, Kỷ-Thân, Canh-Dần, Tân-Dần, Nhâm-Tỵ, Quý-Tỵ
  const THIEN_VIET: Record<number, number> = {
    1: 8,
    2: 9,
    3: 10,
    4: 10,
    5: 8,
    6: 9,
    7: 3,
    8: 3,
    9: 6,
    10: 6,
  }
  return THIEN_VIET[canNam]
}

// ============================================================================
// MỆNH CHỦ / THÂN CHỦ
// ============================================================================

export function getMenhChu(chiCungMenh: number): string {
  const MENH_CHU: Record<number, string> = {
    1: 'Tham Lang', // Tý
    2: 'Cự Môn', // Sửu
    3: 'Lộc Tồn', // Dần
    4: 'Văn Khúc', // Mão
    5: 'Liêm Trinh', // Thìn
    6: 'Vũ Khúc', // Tỵ
    7: 'Phá Quân', // Ngọ
    8: 'Vũ Khúc', // Mùi
    9: 'Liêm Trinh', // Thân
    10: 'Văn Khúc', // Dậu
    11: 'Lộc Tồn', // Tuất
    12: 'Cự Môn', // Hợi
  }
  return MENH_CHU[chiCungMenh]
}

export function getThanChu(chiNam: number): string {
  const THAN_CHU: Record<number, string> = {
    1: 'Linh Tinh', // Tý
    2: 'Thiên Tướng', // Sửu
    3: 'Thiên Lương', // Dần
    4: 'Thiên Đồng', // Mão
    5: 'Văn Xương', // Thìn
    6: 'Thiên Cơ', // Tỵ
    7: 'Hỏa Tinh', // Ngọ
    8: 'Thiên Tướng', // Mùi
    9: 'Thiên Lương', // Thân
    10: 'Thiên Đồng', // Dậu
    11: 'Văn Xương', // Tuất
    12: 'Thiên Cơ', // Hợi
  }
  return THAN_CHU[chiNam]
}

// ============================================================================
// VÒNG THÁI TUẾ - 12 SAO
// ============================================================================

const VONG_THAI_TUE = [
  'Thái Tuế',
  'Thiếu Dương',
  'Tang Môn',
  'Thiếu Âm',
  'Quan Phù',
  'Tử Phù',
  'Tuế Phá',
  'Long Đức',
  'Bạch Hổ',
  'Phúc Đức',
  'Điếu Khách',
  'Trực Phù',
]

export function getVongThaiTue(chiNam: number): Record<string, number> {
  const result: Record<string, number> = {}
  for (let i = 0; i < 12; i++) {
    const sao = VONG_THAI_TUE[i]
    const cung = ((chiNam - 1 + i) % 12) + 1
    result[sao] = cung
  }
  return result
}

// ============================================================================
// THIÊN MÃ, ĐÀO HOA, HỒNG LOAN
// ============================================================================

export function anThienMa(chiNam: number): number {
  // Tam Hợp cục: Dần Ngọ Tuất -> Thân, Thân Tý Thìn -> Dần, Tỵ Dậu Sửu -> Hợi, Hợi Mão Mùi -> Tỵ
  const THIEN_MA: Record<number, number> = {
    1: 3, // Tý -> Dần
    2: 12, // Sửu -> Hợi
    3: 9, // Dần -> Thân
    4: 6, // Mão -> Tỵ
    5: 3, // Thìn -> Dần
    6: 12, // Tỵ -> Hợi
    7: 9, // Ngọ -> Thân
    8: 6, // Mùi -> Tỵ
    9: 3, // Thân -> Dần
    10: 12, // Dậu -> Hợi
    11: 9, // Tuất -> Thân
    12: 6, // Hợi -> Tỵ
  }
  return THIEN_MA[chiNam]
}

export function anDaoHoa(chiNam: number): number {
  // Tam Hợp cục: Dần Ngọ Tuất -> Mão, Thân Tý Thìn -> Dậu, Tỵ Dậu Sửu -> Ngọ, Hợi Mão Mùi -> Tý
  const DAO_HOA: Record<number, number> = {
    1: 10, // Tý -> Dậu
    2: 7, // Sửu -> Ngọ
    3: 4, // Dần -> Mão
    4: 1, // Mão -> Tý
    5: 10, // Thìn -> Dậu
    6: 7, // Tỵ -> Ngọ
    7: 4, // Ngọ -> Mão
    8: 1, // Mùi -> Tý
    9: 10, // Thân -> Dậu
    10: 7, // Dậu -> Ngọ
    11: 4, // Tuất -> Mão
    12: 1, // Hợi -> Tý
  }
  return DAO_HOA[chiNam]
}

export function anHongLoan(chiNam: number): number {
  // Hồng Loan nghịch từ Mão: Tý->Mão(4), đi nghịch
  const cung = (5 - chiNam + 12) % 12
  return cung === 0 ? 12 : cung
}

export function anThienHy(chiNam: number): number {
  // Thiên Hỷ = Hồng Loan + 6 (đối cung)
  const hongLoan = anHongLoan(chiNam)
  return ((hongLoan - 1 + 6) % 12) + 1
}

// ============================================================================
// VÒNG TRÀNG SINH
// ============================================================================

const VONG_TRANG_SINH = [
  'Tràng sinh',
  'Mộc dục',
  'Quan đới',
  'Lâm quan',
  'Đế vượng',
  'Suy',
  'Bệnh',
  'Tử',
  'Mộ',
  'Tuyệt',
  'Thai',
  'Dưỡng',
]

// Vị trí khởi Tràng Sinh cố định theo Cục (luôn ở tứ sinh: Dần-Thân-Tỵ-Hợi)
const TRANG_SINH_START: Record<number, number> = {
  2: 9, // Thủy nhị cục -> Thân
  3: 12, // Mộc tam cục -> Hợi
  4: 6, // Kim tứ cục -> Tỵ
  5: 9, // Thổ ngũ cục -> Thân
  6: 3, // Hỏa lục cục -> Dần
}

export function getVongTrangSinh(
  cuc: number,
  isNam: boolean,
  isDuongNam: boolean,
): Record<string, number> {
  // Luôn khởi Tràng Sinh tại cùng vị trí theo Cục
  // Thuận (Dương Nam / Âm Nữ): đi thuận (+1)
  // Nghịch (Dương Nữ / Âm Nam): đi nghịch (-1)
  const isThuan = (isNam && isDuongNam) || (!isNam && !isDuongNam)
  const start = TRANG_SINH_START[cuc]
  const dir = isThuan ? 1 : -1

  const result: Record<string, number> = {}
  for (let i = 0; i < 12; i++) {
    const sao = VONG_TRANG_SINH[i]
    const cung = ((start - 1 + i * dir + 120) % 12) + 1
    result[sao] = cung
  }
  return result
}

// ============================================================================
// VÒNG BÁC SĨ
// ============================================================================

const VONG_BAC_SI = [
  'Bác Sĩ',
  'Lực Sĩ',
  'Thanh Long',
  'Tiểu Hao',
  'Tướng Quân',
  'Tấu Thư',
  'Phi Liêm',
  'Hỷ Thần',
  'Bệnh Phù',
  'Đại Hao',
  'Phục Binh',
  'Quan Phủ',
]

const CAN_DUONG = [1, 3, 5, 7, 9]

export function getVongBacSi(canNam: number, isNam: boolean): Record<string, number> {
  const locTonPos = anLocTon(canNam) // Bác sĩ đồng cung Lộc Tồn
  const isDuong = CAN_DUONG.includes(canNam)

  // Dương nam / Âm nữ -> thuận
  const isThuan = (isDuong && isNam) || (!isDuong && !isNam)
  const direction = isThuan ? 1 : -1

  const result: Record<string, number> = {}
  for (let i = 0; i < 12; i++) {
    const sao = VONG_BAC_SI[i]
    const cung = ((locTonPos - 1 + i * direction + 120) % 12) + 1
    result[sao] = cung
  }
  return result
}

// ============================================================================
// CÁC SAO THEO CHI NĂM
// ============================================================================

export function anCoThan(chiNam: number): number {
  const CO_THAN: Record<number, number> = {
    1: 3,
    2: 3,
    3: 6,
    4: 6,
    5: 6,
    6: 9,
    7: 9,
    8: 9,
    9: 12,
    10: 12,
    11: 12,
    12: 3,
  }
  return CO_THAN[chiNam]
}

export function anQuaTu(chiNam: number): number {
  const QUA_TU: Record<number, number> = {
    1: 11,
    2: 11,
    3: 2,
    4: 2,
    5: 2,
    6: 5,
    7: 5,
    8: 5,
    9: 8,
    10: 8,
    11: 8,
    12: 11,
  }
  return QUA_TU[chiNam]
}

export function anGiaiThan(chiNam: number): number {
  // Nghịch từ Tuất: Tý(1)->Tuất(11), đi nghịch
  const cung = (12 - chiNam + 12) % 12
  return cung === 0 ? 12 : cung
}

export function anPhuongCac(chiNam: number): number {
  return anGiaiThan(chiNam) // Cùng công thức
}

export function anHoaCai(chiNam: number): number {
  const HOA_CAI: Record<number, number> = {
    1: 5,
    2: 2,
    3: 11,
    4: 8,
    5: 5,
    6: 2,
    7: 11,
    8: 8,
    9: 5,
    10: 2,
    11: 11,
    12: 8,
  }
  return HOA_CAI[chiNam]
}

export function anKiepSat(chiNam: number): number {
  const KIEP_SAT: Record<number, number> = {
    1: 6,
    2: 3,
    3: 12,
    4: 9,
    5: 6,
    6: 3,
    7: 12,
    8: 9,
    9: 6,
    10: 3,
    11: 12,
    12: 9,
  }
  return KIEP_SAT[chiNam]
}

export function anLongTri(chiNam: number): number {
  // Thuận từ Thìn: Tý(1)->Thìn(5), +4
  const cung = chiNam + 4
  return cung <= 12 ? cung : cung - 12
}

export function anPhoenixCac(chiNam: number): number {
  // Phượng Các = Giải Thần
  return anGiaiThan(chiNam)
}

export function anNguyetDuc(chiNam: number): number {
  // Thuận từ Tỵ: Tý(1)->Tỵ(6), +5
  const cung = chiNam + 5
  return cung <= 12 ? cung : cung - 12
}

export function anPhaToai(chiNam: number): number {
  const PHA_TOAI: Record<number, number> = {
    1: 6,
    2: 2,
    3: 10,
    4: 6,
    5: 2,
    6: 10,
    7: 6,
    8: 2,
    9: 10,
    10: 6,
    11: 2,
    12: 10,
  }
  return PHA_TOAI[chiNam]
}

export function anThienHu(chiNam: number): number {
  // Thuận từ Ngọ: +6
  const cung = chiNam + 6
  return cung <= 12 ? cung : cung - 12
}

export function anThienHy2(chiNam: number): number {
  // Nghịch từ Dậu
  const cung = (11 - chiNam + 12) % 12
  return cung === 0 ? 12 : cung
}

export function anThienKhong(chiNam: number): number {
  // Thuận từ Sửu: +1
  const cung = chiNam + 1
  return cung <= 12 ? cung : 1
}

export function anThienKhoc(chiNam: number): number {
  // Nghịch từ Ngọ
  const cung = (8 - chiNam + 12) % 12
  return cung === 0 ? 12 : cung
}

export function anThienDuc(chiNam: number): number {
  // Thuận từ Dậu: +9
  const cung = chiNam + 9
  return cung <= 12 ? cung : cung - 12
}

// Thiên La, Địa Võng (cố định)
export const THIEN_LA = 5 // Luôn ở Thìn
export const DIA_VONG = 11 // Luôn ở Tuất

// ============================================================================
// CÁC SAO THEO CAN NĂM
// ============================================================================

export function anLuuHa(canNam: number): number {
  const LUU_HA: Record<number, number> = {
    1: 10,
    2: 11,
    3: 8,
    4: 9,
    5: 6,
    6: 7,
    7: 5,
    8: 4,
    9: 12,
    10: 3,
  }
  return LUU_HA[canNam]
}

export function anQuocAn(canNam: number): number {
  const QUOC_AN: Record<number, number> = {
    1: 11,
    2: 12,
    3: 2,
    4: 3,
    5: 2,
    6: 3,
    7: 5,
    8: 6,
    9: 8,
    10: 9,
  }
  return QUOC_AN[canNam]
}

export function anThienPhuc(canNam: number): number {
  const THIEN_PHUC: Record<number, number> = {
    1: 10,
    2: 9,
    3: 1,
    4: 12,
    5: 4,
    6: 3,
    7: 7,
    8: 6,
    9: 7,
    10: 6,
  }
  return THIEN_PHUC[canNam]
}

export function anThienQuan(canNam: number): number {
  const THIEN_QUAN: Record<number, number> = {
    1: 8,
    2: 5,
    3: 6,
    4: 3,
    5: 4,
    6: 10,
    7: 12,
    8: 10,
    9: 11,
    10: 7,
  }
  return THIEN_QUAN[canNam]
}

export function anThienTru(canNam: number): number {
  const THIEN_TRU: Record<number, number> = {
    1: 6,
    2: 7,
    3: 1,
    4: 6,
    5: 7,
    6: 9,
    7: 3,
    8: 7,
    9: 10,
    10: 11,
  }
  return THIEN_TRU[canNam]
}

export function anDuongPhu(canNam: number): number {
  const DUONG_PHU: Record<number, number> = {
    1: 8,
    2: 9,
    3: 11,
    4: 12,
    5: 11,
    6: 12,
    7: 2,
    8: 3,
    9: 5,
    10: 6,
  }
  return DUONG_PHU[canNam]
}

// ============================================================================
// CÁC SAO THEO THÁNG
// ============================================================================

export function anThienDieu(thangAm: number): number {
  // Thiên Diêu/Riêu: Tháng 1 -> Sửu(2), thuận, +1
  const cung = thangAm + 1
  return cung <= 12 ? cung : cung - 12
}

export function anThienY(thangAm: number): number {
  // Thiên Y: giống Thiên Diêu
  return anThienDieu(thangAm)
}

export function anThienGiai(thangAm: number): number {
  // Thiên Giải: Tháng 1 -> Thân(9), +8
  const cung = thangAm + 8
  return cung <= 12 ? cung : cung - 12
}

export function anThienHinh(thangAm: number): number {
  // Thiên Hình: Tháng 1 -> Dậu(10), +9
  const cung = thangAm + 9
  return cung <= 12 ? cung : cung - 12
}

export function anDiaGiai(thangAm: number): number {
  // Địa Giải: Tháng 1 -> Mùi(8), +7
  const cung = thangAm + 7
  return cung <= 12 ? cung : cung - 12
}

// ============================================================================
// THAI PHỤ, PHONG CÁO - theo Chi giờ
// ============================================================================

export function anThaiPhu(chiGio: number): number {
  // Thai Phụ: An Ngọ, đi thuận theo giờ. Tý(1)->Ngọ(7)
  const cung = (chiGio + 6) % 12
  return cung === 0 ? 12 : cung
}

export function anPhongCao(chiGio: number): number {
  // Phong Cáo: An Dần, đi thuận theo giờ. Tý(1)->Dần(3)
  const cung = (chiGio + 2) % 12
  return cung === 0 ? 12 : cung
}

// ============================================================================
// TAM THAI, BÁT TỌA - theo Tả Phụ/Hữu Bật + Ngày
// ============================================================================

export function anTamThai(taPhu: number, ngayAm: number): number {
  // Tam Thai: Từ Tả Phụ đếm thuận đến ngày sinh
  // Tả Phụ + (ngày - 1)
  const cung = ((taPhu - 1 + ngayAm - 1 + 120) % 12) + 1
  return cung
}

export function anBatToa(huuBat: number, ngayAm: number): number {
  // Bát Tọa: Từ Hữu Bật đếm nghịch đến ngày sinh
  // Hữu Bật - (ngày - 1)
  const cung = ((huuBat - 1 - (ngayAm - 1) + 120) % 12) + 1
  return cung
}

// ============================================================================
// ĐẨU QUÂN - theo Thái Tuế (chi năm) + Tháng + Chi giờ
// ============================================================================

export function anDauQuan(chiNam: number, thangAm: number, chiGio: number): number {
  // Đẩu Quân: Gọi Thái Tuế là tháng Giêng, tính tháng nghịch, từ đó đếm giờ thuận
  // Thái Tuế = chi năm = tháng giêng
  // Tháng nghịch: chi năm - (tháng - 1) = chi năm - tháng + 1
  // Giờ thuận: + (giờ - 1)
  // Result: chi năm - tháng + 1 + giờ - 1 = chi năm + giờ - tháng
  const cung = ((chiNam - 1 + chiGio - 1 - (thangAm - 1) + 120) % 12) + 1
  return cung
}

// ============================================================================
// THIÊN THỌ, THIÊN TÀI - theo cung Mệnh/Thân + Chi năm
// ============================================================================

export function anThienTho(cungThan: number, chiNam: number): number {
  // Thiên Thọ: Gọi năm Tý ở cung Thân, tính thuận đến năm sinh
  // cung Thân + (chi năm - 1)
  const cung = ((cungThan - 1 + chiNam - 1 + 120) % 12) + 1
  return cung
}

export function anThienTai(cungMenh: number, chiNam: number): number {
  // Thiên Tài: Gọi năm Tý ở cung Mệnh, tính thuận đến năm sinh
  // cung Mệnh + (chi năm - 1)
  const cung = ((cungMenh - 1 + chiNam - 1 + 120) % 12) + 1
  return cung
}

// ============================================================================
// THIÊN THƯƠNG, THIÊN SỨ - theo cung Mệnh
// ============================================================================

export function anThienThuong(cungMenh: number): number {
  // Thiên Thương: Luôn ở cung Nô Bộc (Mệnh + 5)
  return ((cungMenh - 1 + 5) % 12) + 1
}

export function anThienSu(cungMenh: number): number {
  // Thiên Sứ: Luôn ở cung Tật Ách (Mệnh + 7)
  return ((cungMenh - 1 + 7) % 12) + 1
}

// ============================================================================
// ÂN QUANG, THIÊN QUÝ - theo VX/VK + Ngày sinh
// ============================================================================

export function anAnQuang(vanXuong: number, ngaySinh: number): number {
  // Ân Quang: Từ VX đếm thuận đến ngày sinh, lùi 1 cung (nghịch)
  // VX + (ngày - 1) - 1 = VX + ngày - 2
  const cung = ((vanXuong - 1 + ngaySinh - 2 + 120) % 12) + 1
  return cung
}

export function anThienQuy(vanKhuc: number, ngaySinh: number): number {
  // Thiên Quý: Từ VK đếm nghịch đến ngày sinh, lùi 1 cung (thuận)
  // VK - (ngày - 1) + 1 = VK - ngày + 2
  const cung = ((vanKhuc - 1 - ngaySinh + 2 + 120) % 12) + 1
  return cung
}

// ============================================================================
// SAO LƯU NIÊN (THEO NĂM XEM, NGOẠI TRỪ LN VĂN TINH THEO NĂM SINH)
// ============================================================================

export function anLuuNienVanTinh(canNam: number): number {
  // LN Văn Tinh theo thiên can năm SINH (không phải năm xem)
  // Giáp -> Tị, Ất -> Ngọ, Bính/Mậu -> Thân, Đinh/Kỷ -> Dậu,
  // Canh -> Hợi, Tân -> Tý, Nhâm -> Dần, Quý -> Mão
  const LN_VAN_TINH_MAP: Record<number, number> = {
    1: 6, // Giáp -> Tị
    2: 7, // Ất -> Ngọ
    3: 9, // Bính -> Thân
    4: 10, // Đinh -> Dậu
    5: 9, // Mậu -> Thân
    6: 10, // Kỷ -> Dậu
    7: 12, // Canh -> Hợi
    8: 1, // Tân -> Tý
    9: 3, // Nhâm -> Dần
    10: 4, // Quý -> Mão
  }
  return LN_VAN_TINH_MAP[canNam] || 1
}

export function getSaoLuuNien(
  canNamXem: number,
  chiNamXem: number,
  canNam: number,
): Record<string, number> {
  const result: Record<string, number> = {}

  // L. Thái Tuế = cung Chi năm xem
  result['L. Thái Tuế'] = chiNamXem

  // L. Tang Môn = Thái Tuế + 2 (vòng Thái Tuế)
  result['L. Tang Môn'] = ((chiNamXem - 1 + 2) % 12) + 1

  // L. Bạch Hổ = Thái Tuế + 8 (vòng Thái Tuế)
  result['L. Bạch Hổ'] = ((chiNamXem - 1 + 8) % 12) + 1

  // L. Lộc Tồn, L. Kình Dương, L. Đà La (theo Can năm xem)
  result['L. Lộc Tồn'] = anLocTon(canNamXem)
  result['L. Kình Dương'] = anKinhDuong(canNamXem)
  result['L. Đà La'] = anDaLa(canNamXem)

  // L. Thiên Mã, L. Đào Hoa, L. Kiếp Sát (theo Chi năm xem)
  result['L. Thiên Mã'] = anThienMa(chiNamXem)
  result['L. Đào Hoa'] = anDaoHoa(chiNamXem)
  result['L. Kiếp Sát'] = anKiepSat(chiNamXem)

  // L. Thiên Khốc, L. Thiên Hư (theo Chi năm xem)
  result['L. Thiên Khốc'] = anThienKhoc(chiNamXem)
  result['L. Thiên Hư'] = anThienHu(chiNamXem)

  // LN Văn Tinh (theo Can năm SINH, không phải năm xem)
  result['LN Văn Tinh'] = anLuuNienVanTinh(canNam)

  return result
}

// ============================================================================
// TIỂU HẠN
// ============================================================================

export function getTieuHanStart(chiNam: number): number {
  // Cung gốc Tiểu Hạn theo Tam Hợp
  // Dần(3)/Ngọ(7)/Tuất(11) → Thìn(5)
  // Thân(9)/Tý(1)/Thìn(5) → Tuất(11)
  // Tỵ(6)/Dậu(10)/Sửu(2) → Mùi(8)
  // Hợi(12)/Mão(4)/Mùi(8) → Sửu(2)
  const TAM_HOP_CUNG_GOC: Record<number, number> = {
    3: 5,
    7: 5,
    11: 5, // Dần, Ngọ, Tuất -> Thìn (5)
    9: 11,
    1: 11,
    5: 11, // Thân, Tý, Thìn -> Tuất (11)
    6: 8,
    10: 8,
    2: 8, // Tỵ, Dậu, Sửu -> Mùi (8)
    12: 2,
    4: 2,
    8: 2, // Hợi, Mão, Mùi -> Sửu (2)
  }
  return TAM_HOP_CUNG_GOC[chiNam]
}

export function tinhTieuHan(chiNam: number, isNam: boolean): Record<number, number> {
  // Tiểu Hạn: Chi năm đặt tại cung gốc Tam Hợp
  // Nam đi thuận, Nữ đi nghịch (không phân biệt Âm/Dương năm)
  const cungGoc = getTieuHanStart(chiNam)
  const direction = isNam ? 1 : -1

  // Trả về: {cung: chi_tieu_han}
  const result: Record<number, number> = {}
  for (let cung = 1; cung <= 12; cung++) {
    const step = ((cung - cungGoc) * direction + 1200) % 12
    const chi = ((chiNam - 1 + step) % 12) + 1
    result[cung] = chi
  }
  return result
}

// Tính Nguyệt Hạn: "nghịch tháng thuận giờ"
// Từ cung Tiểu Hạn (= tháng 1) đi nghịch đến tháng sinh,
// rồi từ đó kể giờ Tý đi thuận đến giờ sinh → cung đó = tháng Giêng.
// Sau đó luôn đi thuận cho 12 tháng.
export function tinhNguyetHan(
  cungTieuHan: number,
  thangSinh: number,
  chiGioSinh: number,
): Record<number, number> {
  // Bước 1: Từ cung Tiểu Hạn nghịch (thangSinh - 1) bước
  // Bước 2: Từ đó thuận (chiGioSinh - 1) bước
  const cungThangGieng = ((cungTieuHan - 1 - (thangSinh - 1) + (chiGioSinh - 1) + 120) % 12) + 1

  const result: Record<number, number> = {}
  for (let thang = 1; thang <= 12; thang++) {
    const cung = ((cungThangGieng - 1 + (thang - 1) + 120) % 12) + 1
    result[cung] = thang
  }
  return result
}

// ============================================================================
// CAN CUNG (NGŨ HỔ ĐỘN)
// ============================================================================

export function tinhCanCung(canNam: number): Record<number, number> {
  // Ngũ Hổ Độn: Tìm Can của cung Dần (cung 3) theo Can năm
  // Ngũ Hổ Độn:
  // Giáp-Kỷ -> Bính Dần, Ất-Canh -> Mậu Dần, Bính-Tân -> Canh Dần,
  // Đinh-Nhâm -> Nhâm Dần, Mậu-Quý -> Giáp Dần
  const CAN_DAN: Record<number, number> = {
    1: 3, // Giáp -> Bính Dần
    2: 5, // Ất -> Mậu Dần
    3: 7, // Bính -> Canh Dần
    4: 9, // Đinh -> Nhâm Dần
    5: 1, // Mậu -> Giáp Dần
    6: 3, // Kỷ -> Bính Dần
    7: 5, // Canh -> Mậu Dần
    8: 7, // Tân -> Canh Dần
    9: 9, // Nhâm -> Nhâm Dần
    10: 1, // Quý -> Giáp Dần
  }

  const canDan = CAN_DAN[canNam]
  const result: Record<number, number> = {}

  for (let i = 1; i <= 12; i++) {
    // Từ Dần (3) đến các cung khác
    const offset = (i - 3 + 12) % 12
    result[i] = ((canDan - 1 + offset) % 10) + 1
  }

  return result
}

// ============================================================================
// TRIỆT LỘ / TUẦN TRUNG
// ============================================================================

// Sao Triệt - an theo Thiên Can của năm sinh
// Giáp-Kỷ: Thân-Dậu (9-10), Ất-Canh: Ngọ-Mùi (7-8), Bính-Tân: Thìn-Tỵ (5-6)
// Đinh-Nhâm: Dần-Mão (3-4), Mậu-Quý: Tý-Sửu (1-2)
export function tinhTrietLo(canNam: number): [number, number] {
  const TRIET_TABLE: Record<number, [number, number]> = {
    1: [9, 10], // Giáp -> Thân-Dậu
    6: [9, 10], // Kỷ   -> Thân-Dậu
    2: [7, 8], // Ất   -> Ngọ-Mùi
    7: [7, 8], // Canh -> Ngọ-Mùi
    3: [5, 6], // Bính -> Thìn-Tỵ
    8: [5, 6], // Tân  -> Thìn-Tỵ
    4: [3, 4], // Đinh -> Dần-Mão
    9: [3, 4], // Nhâm -> Dần-Mão
    5: [1, 2], // Mậu  -> Tý-Sửu
    10: [1, 2], // Quý  -> Tý-Sửu
  }
  return TRIET_TABLE[canNam] || [1, 2]
}

// Sao Tuần - an theo tuần thủ Giáp (năm sinh thuộc tuần Giáp nào)
// Giáp Tý: Tuất-Hợi (11-12), Giáp Dần: Tý-Sửu (1-2), Giáp Thìn: Dần-Mão (3-4)
// Giáp Ngọ: Thìn-Tỵ (5-6), Giáp Thân: Ngọ-Mùi (7-8), Giáp Tuất: Thân-Dậu (9-10)
export function tinhTuanTriet(canNam: number, chiNam: number): [number, number] {
  // Tìm tuần thủ Giáp: tính offset từ Giáp
  // Can: 1=Giáp -> offset=0, 2=Ất -> offset=1, ..., 10=Quý -> offset=9
  const canOffset = canNam - 1 // 0-9

  // Chi của tuần thủ = Chi năm - canOffset
  // VD: Kỷ Tỵ (can=6, chi=6): canOffset=5, tuần thủ chi = 6-5=1 (Tý) -> Giáp Tý
  const tuanThuChi = ((((chiNam - 1 - canOffset) % 12) + 12) % 12) + 1

  // Bảng Tuần theo tuần thủ Chi
  const TUAN_TABLE: Record<number, [number, number]> = {
    1: [11, 12], // Giáp Tý   -> Tuất-Hợi
    3: [1, 2], // Giáp Dần  -> Tý-Sửu
    5: [3, 4], // Giáp Thìn -> Dần-Mão
    7: [5, 6], // Giáp Ngọ  -> Thìn-Tỵ
    9: [7, 8], // Giáp Thân -> Ngọ-Mùi
    11: [9, 10], // Giáp Tuất -> Thân-Dậu
  }

  return TUAN_TABLE[tuanThuChi] || [11, 12]
}

// ============================================================================
// MIẾU VƯỢNG HÃM
// ============================================================================

const MIEU_VUONG_HAM: Record<
  number,
  { M: number[]; V: number[]; D: number[]; H: number[]; B: number[] }
> = {
  1: { M: [3, 6, 7, 9], V: [5, 11], D: [2, 8, 12], H: [1], B: [4, 10] }, // Tử Vi
  2: { M: [5, 11], V: [1, 3, 7, 9], D: [2, 8], H: [4, 6, 10, 12], B: [] }, // Liêm Trinh
  3: { M: [3, 9], V: [1], D: [4, 6, 12], H: [2, 5, 7, 8, 10, 11], B: [] }, // Thiên Đồng
  4: { M: [2, 5, 8, 11], V: [1, 3, 7, 9], D: [4, 10], H: [6, 12], B: [] }, // Vũ Khúc
  5: { M: [6, 7], V: [3, 4, 5], D: [2, 8], H: [1, 9, 10, 11, 12], B: [] }, // Thái Dương
  6: { M: [4, 5, 10, 11], V: [6, 8, 9], D: [1, 2, 7], H: [3, 12], B: [] }, // Thiên Cơ
  7: { M: [1, 3, 7, 9], V: [5, 11], D: [2, 4, 6, 8, 10, 12], H: [], B: [] }, // Thiên Phủ (không hãm)
  8: { M: [10, 11, 12], V: [1, 9], D: [2, 8], H: [3, 4, 5, 6, 7], B: [] }, // Thái Âm
  9: { M: [2, 8], V: [5, 11], D: [3, 9], H: [1, 4, 6, 7, 10, 12], B: [] }, // Tham Lang
  10: { M: [4, 10], V: [1, 3, 7], D: [9, 12], H: [2, 5, 6, 8, 11], B: [] }, // Cự Môn
  11: { M: [3, 9], V: [1, 5, 7, 11], D: [2, 6, 8, 12], H: [4, 10], B: [] }, // Thiên Tướng
  12: { M: [1, 5, 7], V: [3, 4, 9, 11], D: [2, 8], H: [6, 10, 12], B: [] }, // Thiên Lương
  13: { M: [1, 3, 7, 9], V: [6, 12], D: [2, 8], H: [4, 5, 10, 11], B: [] }, // Thất Sát
  14: { M: [1, 7], V: [2, 8], D: [5, 11], H: [3, 4, 6, 9, 10, 12], B: [] }, // Phá Quân
}

// Lục Sát Tinh - chỉ có Đắc hoặc Hãm (không có M/V/B)
const SAT_TINH_DAC_DIA: Record<string, number[]> = {
  'Địa Không': [3, 6, 9, 12], // Dần Tỵ Thân Hợi (Tứ Sinh)
  'Địa Kiếp': [3, 6, 9, 12], // Dần Tỵ Thân Hợi (Tứ Sinh)
  'Kình Dương': [2, 5, 8, 11], // Sửu Thìn Mùi Tuất (Tứ Mộ)
  'Đà La': [2, 5, 8, 11], // Sửu Thìn Mùi Tuất (Tứ Mộ)
  'Hỏa Tinh': [3, 4, 6, 7], // Dần Mão Tỵ Ngọ
  'Linh Tinh': [3, 6, 7], // Dần Tị Ngọ (Hỏa tinh - đắc tại cung Hỏa)
  'Bạch Hổ': [3, 4, 9, 10], // Dần Mão Thân Dậu
}

// Phụ tinh quan trọng - Đắc/Hãm
const PHU_TINH_DAC_DIA: Record<string, number[]> = {
  'Văn Xương': [5, 11, 2, 8, 6, 12], // Thìn Tuất Sửu Mùi Tỵ Hợi
  'Văn Khúc': [5, 11, 2, 8, 6, 12], // Thìn Tuất Sửu Mùi Tỵ Hợi
  // Thiên Khôi, Thiên Việt: quý nhân tinh, không có đắc hãm
  'Thiên Mã': [3, 6, 9, 12], // Dần Tỵ Thân Hợi (Tứ Sinh) - Hỏa tinh
  // Hồng Loan: không có đắc hãm
  // Thiên Hỷ: không có đắc hãm
  'Thiên Diêu': [3, 4, 9, 10], // Dần Mão Thân Dậu
  'Thiên Hình': [3, 4, 9, 10], // Dần Mão Thân Dậu
  'Đại Hao': [3, 4, 9, 10], // Dần Mão Thân Dậu
  'Tiểu Hao': [3, 4, 9, 10], // Dần Mão Thân Dậu
  'Tang Môn': [3, 9, 4, 10], // Dần Thân Mão Dậu - Đắc địa (Mộc tinh)
  'Thiên Khốc': [1, 3, 7, 9], // Tý Dần Ngọ Thân - Đắc địa
}

const SAO_ID: Record<string, number> = {
  'Tử Vi': 1,
  'Liêm Trinh': 2,
  'Thiên Đồng': 3,
  'Vũ Khúc': 4,
  'Thái Dương': 5,
  'Thiên Cơ': 6,
  'Thiên Phủ': 7,
  'Thái Âm': 8,
  'Tham Lang': 9,
  'Cự Môn': 10,
  'Thiên Tướng': 11,
  'Thiên Lương': 12,
  'Thất Sát': 13,
  'Phá Quân': 14,
}

export function getDacTinh(saoTen: string, cungSo: number): 'M' | 'V' | 'D' | 'H' | 'B' | null {
  // Chính tinh (14 sao)
  const saoId = SAO_ID[saoTen]
  if (saoId && MIEU_VUONG_HAM[saoId]) {
    const data = MIEU_VUONG_HAM[saoId]
    if (data.M.includes(cungSo)) return 'M'
    if (data.V.includes(cungSo)) return 'V'
    if (data.D.includes(cungSo)) return 'D'
    if (data.H.includes(cungSo)) return 'H'
    if (data.B.includes(cungSo)) return 'B'
    return 'B'
  }

  // Lục sát tinh - chỉ Đắc hoặc Hãm
  if (SAT_TINH_DAC_DIA[saoTen]) {
    return SAT_TINH_DAC_DIA[saoTen].includes(cungSo) ? 'D' : 'H'
  }

  // Phụ tinh quan trọng - chỉ Đắc hoặc Hãm
  if (PHU_TINH_DAC_DIA[saoTen]) {
    return PHU_TINH_DAC_DIA[saoTen].includes(cungSo) ? 'D' : 'H'
  }

  // Tứ Hóa: Hóa Kỵ luôn (H), các Hóa khác không hiển thị đặc tính
  if (saoTen === 'Hóa Kỵ') return 'H'
  if (saoTen === 'Hóa Lộc' || saoTen === 'Hóa Quyền' || saoTen === 'Hóa Khoa') return null

  return null // Không có đắc hãm cho sao này
}

// ============================================================================
// NGŨ HÀNH SAO
// ============================================================================

const SAO_NGU_HANH: Record<string, 'hoa' | 'moc' | 'tho' | 'kim' | 'thuy'> = {
  // HOA (Hỏa)
  'Hỏa Tinh': 'hoa',
  'Linh Tinh': 'hoa',
  'Liêm Trinh': 'hoa',
  'Thái Dương': 'hoa',
  'Địa Không': 'hoa',
  'Địa Kiếp': 'hoa',
  'Thiên Khôi': 'hoa',
  'Thiên Việt': 'hoa',
  'Thiên Mã': 'hoa',
  'Thiên Không': 'hoa',
  'Thiên Đức': 'hoa',
  'Thiên Giải': 'hoa',
  'Thiên Hình': 'hoa',
  'Thiên Quan': 'hoa',
  'Nguyệt Đức': 'hoa',
  'Phá Toái': 'hoa',
  'Kiếp Sát': 'hoa',
  'Thái Tuế': 'hoa',
  'Thiếu Dương': 'hoa',
  'Tang Môn': 'moc',
  'Quan Phù': 'hoa',
  'Tử Phù': 'hoa',
  'Tuế Phá': 'hoa',
  'Điếu Khách': 'hoa',
  'Trực Phù': 'hoa',
  'Hỷ Thần': 'hoa',
  'Đại Hao': 'hoa',
  'Tiểu Hao': 'hoa',
  'Lực Sĩ': 'hoa',
  'Phi Liêm': 'hoa',
  'Phục Binh': 'hoa',
  'Quan Phủ': 'hoa',
  'Đẩu Quân': 'hoa',
  // Sao Lưu niên - Hỏa
  'L. Thái Tuế': 'hoa',
  'L. Thiên Mã': 'hoa',
  'L. Kiếp Sát': 'hoa',

  // MOC (Mộc)
  'Thiên Cơ': 'moc',
  'Tham Lang': 'moc',
  'Thiên Lương': 'moc',
  'Đào Hoa': 'moc',
  'Giải Thần': 'moc',
  'Phượng Các': 'moc',
  'Bát Tọa': 'moc',
  'Ân Quang': 'moc',
  'Đường Phù': 'moc',
  'Tướng Quân': 'moc',
  'Hóa Lộc': 'moc',
  'Hóa Quyền': 'moc',
  'Hóa Khoa': 'moc',
  // Sao Lưu niên - Mộc
  'L. Tang Môn': 'moc',
  'L. Đào Hoa': 'moc',

  // THO (Thổ)
  'Tử Vi': 'tho',
  'Thiên Phủ': 'tho',
  'Lộc Tồn': 'tho',
  'Tả Phù': 'tho',
  'Cô Thần': 'tho',
  'Quả Tú': 'tho',
  'Thiên Thọ': 'tho',
  'Thiên Tài': 'tho',
  'Thiên Phúc': 'tho',
  'Thiên Trù': 'tho',
  'Thiên Thương': 'tho',
  'Thiên Quý': 'tho',
  'Quốc Ấn': 'tho',
  'Phong Cáo': 'tho',
  'Địa Giải': 'tho',
  'Phúc Đức': 'tho',
  'Bệnh Phù': 'tho',
  // Sao Lưu niên - Thổ
  'L. Lộc Tồn': 'tho',

  // KIM
  'Vũ Khúc': 'kim',
  'Thất Sát': 'kim',
  'Kình Dương': 'kim',
  'Đà La': 'kim',
  'Văn Xương': 'kim',
  'Thai Phụ': 'kim',
  'Hoa Cái': 'kim',
  'Bạch Hổ': 'kim',
  'Tấu Thư': 'kim',
  'Thiên La': 'kim',
  'Địa Võng': 'kim',
  // Sao Lưu niên - Kim
  'L. Bạch Hổ': 'kim',
  'L. Kình Dương': 'kim',
  'L. Đà La': 'kim',
  'LN Văn Tinh': 'kim',

  // THUY (Thủy)
  'Thiên Đồng': 'thuy',
  'Thiên Tướng': 'thuy',
  'Phá Quân': 'thuy',
  'Thái Âm': 'thuy',
  'Cự Môn': 'thuy',
  'Hữu Bật': 'thuy',
  'Văn Khúc': 'thuy',
  'Hồng Loan': 'thuy',
  'Thiên Hỷ': 'thuy',
  'Thiên Diêu': 'thuy',
  'Thiên Y': 'thuy',
  'Long Trì': 'thuy',
  'Long Đức': 'thuy',
  'Lưu Hà': 'thuy',
  'Thiên Hư': 'thuy',
  'Thiên Khốc': 'thuy',
  'Thiên Sứ': 'thuy',
  'Tam Thai': 'thuy',
  'Thanh Long': 'thuy',
  'Bác Sĩ': 'thuy',
  'Thiếu Âm': 'thuy',
  'Hóa Kỵ': 'thuy',
  // Sao Lưu niên - Thủy
  'L. Thiên Khốc': 'thuy',
  'L. Thiên Hư': 'thuy',
}

// SAO TỐT/XẤU
const SAO_TOT: Record<string, boolean> = {
  // Cát tinh (saoTot = 1) - Cột trái
  'Tử Vi': true,
  'Thiên Cơ': true,
  'Thái Dương': true,
  'Vũ Khúc': true,
  'Thiên Đồng': true,
  'Liêm Trinh': true,
  'Thiên Phủ': true,
  'Thái Âm': true,
  'Tham Lang': true,
  'Cự Môn': true,
  'Thiên Tướng': true,
  'Thiên Lương': true,
  'Thất Sát': true,
  'Phá Quân': true,
  'Lộc Tồn': true,
  'Tả Phù': true,
  'Hữu Bật': true,
  'Văn Xương': true,
  'Văn Khúc': true,
  'Thiên Khôi': true,
  'Thiên Việt': true,
  'Thiên Mã': true,
  'Đào Hoa': true,
  'Hồng Loan': true,
  'Thiên Hỷ': true,
  'Hóa Lộc': true,
  'Hóa Quyền': true,
  'Hóa Khoa': true,
  'Bác Sĩ': true,
  'Lực Sĩ': true,
  'Thanh Long': true,
  'Phúc Đức': true,
  'Hỷ Thần': true,
  'Thiếu Dương': true,
  'Thiếu Âm': true,
  'Long Đức': true,
  'Long Trì': true,
  'Nguyệt Đức': true,
  'Thiên Đức': true,
  'Ân Quang': true,
  'Thiên Quý': true,
  'Thiên Y': true,
  'Thiên Giải': true,
  'Địa Giải': true,
  'Giải Thần': true,
  'Phượng Các': true,
  'Đường Phù': true,
  'Thai Phụ': true,
  'Phong Cáo': true,
  'Tam Thai': true,
  'Bát Tọa': true,
  'Thiên Thọ': true,
  'Thiên Tài': true,
  'Thiên Quan': true,
  'Thiên Phúc': true,
  'Thiên Trù': true,
  'Quốc Ấn': true,
  'Hoa Cái': true,
  'Tấu Thư': true,

  // Hung tinh (saoTot = 0) - Cột phải
  'Kình Dương': false,
  'Đà La': false,
  'Hỏa Tinh': false,
  'Linh Tinh': false,
  'Địa Không': false,
  'Địa Kiếp': false,
  'Thiên Không': false,
  'Hóa Kỵ': false,
  'Thái Tuế': false,
  'Tang Môn': false,
  'Quan Phù': false,
  'Tử Phù': false,
  'Tuế Phá': false,
  'Bạch Hổ': false,
  'Điếu Khách': false,
  'Trực Phù': false,
  'Bệnh Phù': false,
  'Đại Hao': false,
  'Tiểu Hao': false,
  'Phục Binh': false,
  'Quan Phủ': false,
  'Phi Liêm': false,
  'Tướng Quân': false,
  'Cô Thần': false,
  'Quả Tú': false,
  'Kiếp Sát': false,
  'Phá Toái': false,
  'Thiên Hư': false,
  'Thiên Khốc': false,
  'Lưu Hà': false,
  'Thiên Hình': false,
  'Thiên Diêu': false,
  'Đẩu Quân': false,
  'Thiên Thương': false,
  'Thiên Sứ': false,
  'Thiên La': false,
  'Địa Võng': false,
  // Sao Lưu niên - Hung
  'L. Thái Tuế': false,
  'L. Tang Môn': false,
  'L. Bạch Hổ': false,
  'L. Kình Dương': false,
  'L. Đà La': false,
  'L. Kiếp Sát': false,
  'L. Thiên Khốc': false,
  'L. Thiên Hư': false,
  // Sao Lưu niên - Cát
  'L. Lộc Tồn': true,
  'L. Thiên Mã': true,
  'L. Đào Hoa': true,
  'LN Văn Tinh': true,
}

export function isSaoTot(saoTen: string): boolean | undefined {
  return SAO_TOT[saoTen]
}

export function getNguHanh(saoTen: string): 'hoa' | 'moc' | 'tho' | 'kim' | 'thuy' | undefined {
  return SAO_NGU_HANH[saoTen]
}

// ============================================================================
// TRÀNG SINH
// ============================================================================

export function tinhTrangSinh(
  cuc: number,
  cung: number,
  isNam: boolean,
  isDuongNam: boolean,
): string {
  // Luôn khởi Tràng Sinh tại cùng vị trí theo Cục, chỉ khác chiều đi
  const isThuan = (isNam && isDuongNam) || (!isNam && !isDuongNam)
  const start = TRANG_SINH_START[cuc]
  const dir = isThuan ? 1 : -1

  const idx = ((cung - start) * dir + 120) % 12
  return TRANG_SINH_NAMES[idx]
}

// ============================================================================
// ĐẠI HẠN
// ============================================================================

export function tinhDaiHan(
  cuc: number,
  cungMenh: number,
  gioiTinh: 'nam' | 'nu',
  amDuong: 'am' | 'duong',
): Record<number, number> {
  // Thuận: Nam Dương, Nữ Âm
  // Nghịch: Nam Âm, Nữ Dương
  const thuan =
    (gioiTinh === 'nam' && amDuong === 'duong') || (gioiTinh === 'nu' && amDuong === 'am')

  const result: Record<number, number> = {}
  for (let i = 0; i < 12; i++) {
    const cung = thuan ? ((cungMenh - 1 + i) % 12) + 1 : ((cungMenh - 1 - i + 120) % 12) + 1
    result[cung] = cuc + i * 10
  }
  return result
}

// ============================================================================
// HIGH-LEVEL API
// ============================================================================

export function tinhLaso(input: LasoInput): Laso {
  const { ngayAm, thangAm, namAm, gio, gioiTinh, ngayDuong, thangDuong, namDuong } = input

  // Tính Can Chi năm
  const canNam = ((namAm - 4) % 10) + 1
  const chiNam = ((namAm - 4) % 12) + 1

  // Âm Dương năm
  const amDuong: 'am' | 'duong' = canNam % 2 === 1 ? 'duong' : 'am'
  const isDuongNam = canNam % 2 === 1
  const isNam = gioiTinh === 'nam'

  // Chi giờ và Chi tháng
  const chiGio = gioToChi(gio)
  const chiThang = ((thangAm + 1) % 12) + 1 // Tháng 1 = Dần (3)

  // Can Tháng
  const canThang = tinhCanThang(canNam, chiThang)

  // Can Chi Ngày - tính từ ngày dương lịch bằng Julian Day
  // Tý muộn (23h) = đã thuộc ngày mới → +1 ngày dương để tính Can Chi
  let canNgay = 0
  let chiNgay = 0
  let canGio = 0
  if (ngayDuong && thangDuong && namDuong) {
    let solarD = ngayDuong,
      solarM = thangDuong,
      solarY = namDuong
    if (gio === 23) {
      // Tý muộn: +1 ngày dương cho Can Chi Ngày
      const d = new Date(namDuong, thangDuong - 1, ngayDuong)
      d.setDate(d.getDate() + 1)
      solarD = d.getDate()
      solarM = d.getMonth() + 1
      solarY = d.getFullYear()
    }
    const canChiNgay = tinhCanChiNgay(solarD, solarM, solarY)
    canNgay = canChiNgay.canNgay
    chiNgay = canChiNgay.chiNgay
    canGio = tinhCanGio(canNgay, chiGio)
  }

  // An Mệnh, An Thân
  const cungMenh = anMenh(thangAm, chiGio)
  const cungThan = anThan(thangAm, chiGio)

  // Tính Cục
  const cuc = tinhCuc(canNam, cungMenh)

  // An Tử Vi
  const tuViPos = anTuVi(cuc, ngayAm)

  // An 14 chính tinh
  const chinhTinh = an14ChinhTinh(tuViPos)

  // Can cung
  const canCung = tinhCanCung(canNam)

  // Đại hạn
  const daiHan = tinhDaiHan(cuc, cungMenh, gioiTinh, amDuong)

  // Chiều đi (thuận/nghịch lý)
  const isThuan = (isNam && isDuongNam) || (!isNam && !isDuongNam)

  // Tiểu Hạn và Nguyệt Hạn
  const namXem = input.namXem || new Date().getFullYear()
  const tieuHan = tinhTieuHan(chiNam, isNam)
  // Tìm cung Tiểu Hạn của năm xem (chi năm xem)
  const chiNamXem = ((namXem - 4) % 12) + 1
  const canNamXem = ((namXem - 4) % 10) + 1
  // Cung Tiểu Hạn năm xem = cung có tieuHan[cung] === chiNamXem
  let cungTieuHanNamXem = 1
  for (let c = 1; c <= 12; c++) {
    if (tieuHan[c] === chiNamXem) {
      cungTieuHanNamXem = c
      break
    }
  }
  const nguyetHan = tinhNguyetHan(cungTieuHanNamXem, thangAm, chiGio)

  // Triệt/Tuần
  const trietLo = tinhTrietLo(canNam)
  const tuanTriet = tinhTuanTriet(canNam, chiNam)

  // Tứ Hóa
  const [loc, quyen, khoa, ky] = anTuHoa(canNam)

  // === CÁC SAO PHỤ ===
  const locTon = anLocTon(canNam)
  const kinhDuong = anKinhDuong(canNam)
  const daLa = anDaLa(canNam)
  const hoaTinh = anHoaTinh(chiNam, chiGio)
  const linhTinh = anLinhTinh(chiNam, chiGio)
  const diaKhong = anDiaKhong(chiGio)
  const diaKiep = anDiaKiep(chiGio)
  const taPhu = anTaPhu(thangAm)
  const huuBat = anHuuBat(thangAm)
  const vanXuong = anVanXuong(chiGio)
  const vanKhuc = anVanKhuc(chiGio)
  const thienKhoi = anThienKhoi(canNam)
  const thienViet = anThienViet(canNam)

  // Thiên Mã, Đào Hoa, Hồng Loan, Thiên Hỷ (theo chi năm)
  const thienMa = anThienMa(chiNam)
  const daoHoa = anDaoHoa(chiNam)
  const hongLoan = anHongLoan(chiNam)
  const thienHy = anThienHy(chiNam)

  // Vòng Thái Tuế (12 sao)
  const vongThaiTue = getVongThaiTue(chiNam)

  // Vòng Bác Sĩ (12 sao)
  const vongBacSi = getVongBacSi(canNam, isNam)

  // Các sao theo Chi năm khác
  const coThan = anCoThan(chiNam)
  const quaTu = anQuaTu(chiNam)
  const giaiThan = anGiaiThan(chiNam)
  const phuongCac = anPhuongCac(chiNam)
  const hoaCai = anHoaCai(chiNam)
  const kiepSat = anKiepSat(chiNam)
  const longTri = anLongTri(chiNam)
  const nguyetDuc = anNguyetDuc(chiNam)
  const phaToai = anPhaToai(chiNam)
  const thienHu = anThienHu(chiNam)
  const thienKhong = anThienKhong(chiNam)
  const thienKhoc = anThienKhoc(chiNam)
  const thienDuc = anThienDuc(chiNam)

  // Các sao theo Can năm
  const luuHa = anLuuHa(canNam)
  const quocAn = anQuocAn(canNam)
  const thienPhuc = anThienPhuc(canNam)
  const thienQuan = anThienQuan(canNam)
  const thienTru = anThienTru(canNam)
  const duongPhu = anDuongPhu(canNam)

  // Các sao theo Tháng
  const thienDieu = anThienDieu(thangAm)
  const thienY = anThienY(thangAm)
  const thienGiai = anThienGiai(thangAm)
  const thienHinh = anThienHinh(thangAm)
  const diaGiai = anDiaGiai(thangAm)

  // Các sao theo Chi giờ
  const thaiPhu = anThaiPhu(chiGio)
  const phongCao = anPhongCao(chiGio)

  // Tam Thai, Bát Tọa (theo Tả Phụ/Hữu Bật + ngày)
  const tamThai = anTamThai(taPhu, ngayAm)
  const batToa = anBatToa(huuBat, ngayAm)

  // Đẩu Quân (theo chi năm + tháng + chi giờ)
  const dauQuan = anDauQuan(chiNam, thangAm, chiGio)

  // Thiên Thọ, Thiên Tài (theo cung Mệnh/Thân + chi năm)
  const thienTho = anThienTho(cungThan, chiNam)
  const thienTai = anThienTai(cungMenh, chiNam)

  // Thiên Thương, Thiên Sứ (theo cung Mệnh)
  const thienThuong = anThienThuong(cungMenh)
  const thienSu = anThienSu(cungMenh)

  // Ân Quang, Thiên Quý (theo VX/VK + ngày sinh)
  const anQuang = anAnQuang(vanXuong, ngayAm)
  const thienQuy = anThienQuy(vanKhuc, ngayAm)

  // Sao Lưu niên (theo năm xem, ngoại trừ LN Văn Tinh theo Can năm sinh)
  const saoLuuNien = getSaoLuuNien(canNamXem, chiNamXem, canNam)

  // Build 12 cung
  const cungArr: Cung[] = []

  for (let i = 1; i <= 12; i++) {
    // Tên 12 cung LUÔN đi nghịch chiều kim đồng hồ (giảm Chi) từ Mệnh
    // Thuận/nghịch chỉ ảnh hưởng đại hạn, KHÔNG ảnh hưởng tên cung
    const menhOffset = (i - cungMenh + 12) % 12
    const tenCungMenh = CUNG_ORDER[menhOffset]

    // Chính tinh tại cung này
    const saoChinhTinh: Sao[] = []
    for (const [ten, viTri] of Object.entries(chinhTinh)) {
      if (viTri === i) {
        const dacTinh = getDacTinh(ten, i)
        saoChinhTinh.push({
          id: SAO_ID[ten],
          ten,
          cung: i,
          dacTinh: dacTinh || undefined,
          nguHanh: getNguHanh(ten),
          isTot: isSaoTot(ten),
        })
      }
    }

    // Sao phụ tại cung này
    const saoPhu: Sao[] = []

    const addSaoPhu = (ten: string, viTri: number, id: number) => {
      if (viTri === i) {
        const dacTinh = getDacTinh(ten, i)
        saoPhu.push({
          id,
          ten,
          cung: i,
          nguHanh: getNguHanh(ten),
          isTot: isSaoTot(ten),
          dacTinh: dacTinh || undefined,
        })
      }
    }

    // Sao phụ chính
    addSaoPhu('Lộc Tồn', locTon, 20)
    addSaoPhu('Kình Dương', kinhDuong, 52)
    addSaoPhu('Đà La', daLa, 51)
    addSaoPhu('Hỏa Tinh', hoaTinh, 56)
    addSaoPhu('Linh Tinh', linhTinh, 55)
    addSaoPhu('Địa Không', diaKhong, 53)
    addSaoPhu('Địa Kiếp', diaKiep, 54)
    addSaoPhu('Tả Phù', taPhu, 18)
    addSaoPhu('Hữu Bật', huuBat, 17)
    addSaoPhu('Văn Xương', vanXuong, 15)
    addSaoPhu('Văn Khúc', vanKhuc, 16)
    addSaoPhu('Thiên Khôi', thienKhoi, 21)
    addSaoPhu('Thiên Việt', thienViet, 22)

    // Thiên Mã, Đào Hoa, Hồng Loan, Thiên Hỷ
    addSaoPhu('Thiên Mã', thienMa, 23)
    addSaoPhu('Đào Hoa', daoHoa, 24)
    addSaoPhu('Hồng Loan', hongLoan, 25)
    addSaoPhu('Thiên Hỷ', thienHy, 26)

    // Vòng Thái Tuế (12 sao)
    for (const [saoTen, cung] of Object.entries(vongThaiTue)) {
      addSaoPhu(saoTen, cung, 100 + Object.keys(vongThaiTue).indexOf(saoTen))
    }

    // Vòng Bác Sĩ (12 sao)
    for (const [saoTen, cung] of Object.entries(vongBacSi)) {
      addSaoPhu(saoTen, cung, 120 + Object.keys(vongBacSi).indexOf(saoTen))
    }

    // Các sao theo Chi năm khác
    addSaoPhu('Cô Thần', coThan, 30)
    addSaoPhu('Quả Tú', quaTu, 31)
    addSaoPhu('Giải Thần', giaiThan, 32)
    addSaoPhu('Phượng Các', phuongCac, 33)
    addSaoPhu('Hoa Cái', hoaCai, 34)
    addSaoPhu('Kiếp Sát', kiepSat, 35)
    addSaoPhu('Long Trì', longTri, 36)
    addSaoPhu('Nguyệt Đức', nguyetDuc, 37)
    addSaoPhu('Phá Toái', phaToai, 38)
    addSaoPhu('Thiên Hư', thienHu, 39)
    addSaoPhu('Thiên Không', thienKhong, 40)
    addSaoPhu('Thiên Khốc', thienKhoc, 41)
    addSaoPhu('Thiên Đức', thienDuc, 42)
    addSaoPhu('Thiên La', THIEN_LA, 43)
    addSaoPhu('Địa Võng', DIA_VONG, 44)

    // Các sao theo Can năm
    addSaoPhu('Lưu Hà', luuHa, 45)
    addSaoPhu('Quốc Ấn', quocAn, 46)
    addSaoPhu('Thiên Phúc', thienPhuc, 47)
    addSaoPhu('Thiên Quan', thienQuan, 48)
    addSaoPhu('Thiên Trù', thienTru, 49)
    addSaoPhu('Đường Phù', duongPhu, 50)

    // Các sao theo Tháng
    addSaoPhu('Thiên Diêu', thienDieu, 60)
    addSaoPhu('Thiên Y', thienY, 61)
    addSaoPhu('Thiên Giải', thienGiai, 62)
    addSaoPhu('Thiên Hình', thienHinh, 63)
    addSaoPhu('Địa Giải', diaGiai, 64)

    // Các sao theo Chi giờ
    addSaoPhu('Thai Phụ', thaiPhu, 70)
    addSaoPhu('Phong Cáo', phongCao, 71)

    // Tam Thai, Bát Tọa
    addSaoPhu('Tam Thai', tamThai, 72)
    addSaoPhu('Bát Tọa', batToa, 73)

    // Đẩu Quân
    addSaoPhu('Đẩu Quân', dauQuan, 74)

    // Thiên Thọ, Thiên Tài
    addSaoPhu('Thiên Thọ', thienTho, 75)
    addSaoPhu('Thiên Tài', thienTai, 76)

    // Thiên Thương, Thiên Sứ
    addSaoPhu('Thiên Thương', thienThuong, 77)
    addSaoPhu('Thiên Sứ', thienSu, 78)

    // Ân Quang, Thiên Quý
    addSaoPhu('Ân Quang', anQuang, 79)
    addSaoPhu('Thiên Quý', thienQuy, 80)

    // Sao Lưu niên (theo năm xem)
    for (const [saoTen, cung] of Object.entries(saoLuuNien)) {
      addSaoPhu(saoTen, cung, 110 + Object.keys(saoLuuNien).indexOf(saoTen))
    }

    // Tìm vị trí của sao có Tứ Hóa để thêm sao Hóa Lộc/Quyền/Khoa/Kỵ
    const tuHoaSao: Sao[] = []
    const tuHoaNguHanh: Record<string, 'hoa' | 'moc' | 'tho' | 'kim' | 'thuy'> = {
      'Hóa Lộc': 'moc',
      'Hóa Quyền': 'moc',
      'Hóa Khoa': 'moc',
      'Hóa Kỵ': 'thuy',
    }
    const tuHoaTot: Record<string, boolean> = {
      'Hóa Lộc': true,
      'Hóa Quyền': true,
      'Hóa Khoa': true,
      'Hóa Kỵ': false,
    }

    // Tìm sao có Tứ Hóa trong cung này và thêm sao Hóa tương ứng
    const checkTuHoa = (saoTen: string, hoaTen: string, hoaId: number) => {
      // Check trong chính tinh
      for (const sao of saoChinhTinh) {
        if (sao.ten === saoTen) {
          tuHoaSao.push({
            id: hoaId,
            ten: hoaTen,
            cung: i,
            nguHanh: tuHoaNguHanh[hoaTen],
            isTot: tuHoaTot[hoaTen],
            dacTinh: getDacTinh(hoaTen, i) || undefined,
          })
          return
        }
      }
      // Check trong sao phụ
      for (const sao of saoPhu) {
        if (sao.ten === saoTen) {
          tuHoaSao.push({
            id: hoaId,
            ten: hoaTen,
            cung: i,
            nguHanh: tuHoaNguHanh[hoaTen],
            isTot: tuHoaTot[hoaTen],
            dacTinh: getDacTinh(hoaTen, i) || undefined,
          })
          return
        }
      }
    }

    checkTuHoa(loc, 'Hóa Lộc', 200)
    checkTuHoa(quyen, 'Hóa Quyền', 201)
    checkTuHoa(khoa, 'Hóa Khoa', 202)
    checkTuHoa(ky, 'Hóa Kỵ', 203)

    // Thứ tự ưu tiên sao (số nhỏ = ưu tiên cao)
    const SAO_PRIORITY: Record<string, number> = {
      // Lục sát tinh - ưu tiên cao nhất
      'Kình Dương': 1,
      'Đà La': 1,
      'Hỏa Tinh': 1,
      'Linh Tinh': 1,
      'Địa Không': 1,
      'Địa Kiếp': 1,
      // Sao phụ quan trọng
      'Lộc Tồn': 2,
      'Tả Phù': 2,
      'Hữu Bật': 2,
      'Văn Xương': 2,
      'Văn Khúc': 2,
      'Thiên Khôi': 2,
      'Thiên Việt': 2,
      'Thiên Mã': 3,
      'Đào Hoa': 3,
      'Hồng Loan': 3,
      'Thiên Hỷ': 3,
      'Thiên Không': 3,
      // Tứ Hóa
      'Hóa Lộc': 4,
      'Hóa Quyền': 4,
      'Hóa Khoa': 4,
      'Hóa Kỵ': 4,
    }

    const getPriority = (ten: string): number => SAO_PRIORITY[ten] || 10

    // Sắp xếp saoPhu theo thứ tự ưu tiên
    saoPhu.sort((a, b) => getPriority(a.ten) - getPriority(b.ten))

    // Sắp xếp tuHoaSao theo thứ tự ưu tiên (Lộc/Quyền/Khoa trước Kỵ)
    tuHoaSao.sort((a, b) => {
      const order = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ']
      return order.indexOf(a.ten) - order.indexOf(b.ten)
    })

    // Chèn Tứ Hóa sau sao phụ quan trọng (priority <= 3)
    const insertIndex = saoPhu.findIndex((s) => getPriority(s.ten) > 3)
    if (insertIndex === -1) {
      saoPhu.push(...tuHoaSao)
    } else {
      saoPhu.splice(insertIndex, 0, ...tuHoaSao)
    }

    cungArr.push({
      viTri: i,
      tenCung: CUNG_NAMES[i],
      canCung: CAN_NAMES[canCung[i]],
      chiCung: CUNG_NAMES[i],
      tenCungMenh,
      isMenh: i === cungMenh,
      isThan: i === cungThan,
      saoChinhTinh,
      saoPhu,
      trangSinh: tinhTrangSinh(cuc, i, isNam, isDuongNam),
      daiHan: daiHan[i],
      tieuHan: CUNG_NAMES[tieuHan[i]],
      nguyetHan: nguyetHan[i],
      triet: trietLo.includes(i),
      tuan: tuanTriet.includes(i),
    })
  }

  // Tính các trường mới
  const napAm = getNapAm(canNam, chiNam)
  const isNghichLy = !isThuan

  // Tính tuổi hạn (năm xem - năm sinh + 1, theo tuổi mụ)
  const tuoiHan = namXem - namAm + 1

  // Cục sinh khắc bản mệnh
  // Ngũ hành Cục: 2=Thủy, 3=Mộc, 4=Kim, 5=Thổ, 6=Hỏa
  // Ngũ hành Bản mệnh lấy từ Nạp Âm
  const cucHanh: Record<number, string> = { 2: 'thủy', 3: 'mộc', 4: 'kim', 5: 'thổ', 6: 'hỏa' }
  const menhHanhFromNapAm = napAm.toLowerCase()
  const cucH = cucHanh[cuc]

  // Quan hệ sinh khắc
  const sinhMap: Record<string, string> = {
    thủy: 'mộc',
    mộc: 'hỏa',
    hỏa: 'thổ',
    thổ: 'kim',
    kim: 'thủy',
  }
  const khacMap: Record<string, string> = {
    thủy: 'hỏa',
    mộc: 'thổ',
    hỏa: 'kim',
    thổ: 'thủy',
    kim: 'mộc',
  }

  let cucSinhKhac = ''
  if (menhHanhFromNapAm.includes(sinhMap[cucH])) {
    cucSinhKhac = 'Cục sinh Bản mệnh'
  } else if (menhHanhFromNapAm.includes(cucH)) {
    cucSinhKhac = 'Cục hòa Bản mệnh'
  } else if (menhHanhFromNapAm.includes(khacMap[cucH])) {
    cucSinhKhac = 'Cục khắc Bản mệnh'
  } else {
    // Tìm ngược lại: bản mệnh sinh/khắc Cục
    const menhH = Object.keys(sinhMap).find((h) => menhHanhFromNapAm.includes(h)) || ''
    if (sinhMap[menhH] === cucH) {
      cucSinhKhac = 'Bản mệnh sinh Cục'
    } else if (khacMap[menhH] === cucH) {
      cucSinhKhac = 'Bản mệnh khắc Cục'
    }
  }

  return {
    input,
    canNam,
    chiNam,
    canThang,
    chiThang,
    canNgay,
    chiNgay,
    canGio,
    chiGio,
    cungMenh,
    cungThan,
    cuc,
    cucTen: CUC_NAMES[cuc],
    amDuong: amDuong === 'duong' ? 'Dương' : 'Âm',
    napAm,
    tuoiHan,
    isNghichLy,
    cucSinhKhac,
    cung: cungArr,
    tuHoa: { loc, quyen, khoa, ky },
    trietLo,
    tuanTriet,
  }
}

// Export helper
export function formatCanChi(can: number, chi: number): string {
  return `${CAN_NAMES[can]} ${CUNG_NAMES[chi]}`
}

// ============================================================================
// LUNAR CALENDAR CONVERSION — Astronomical computation (no lookup tables)
//
// Based on:
//   - Jean Meeus, "Astronomical Algorithms" (2nd ed.)
//   - Edward M. Reingold & Nachum Dershowitz, "Calendrical Calculations"
//   - Helmer Aslaksen, "The Mathematics of the Chinese Calendar"
//
// Vietnamese calendar rules:
//   1. First day of lunar month = day containing New Moon (Sóc)
//   2. Normal year = 12 months; leap year = 13 months
//   3. Winter Solstice (Đông Chí) always falls in month 11
//   4. In a leap year, the first month after month 11 without a Major Solar Term
//      (Trung khí) is the leap month
//   5. All calculations use timezone UTC+7 (meridian 105°E)
// ============================================================================

const LUNAR_PI = Math.PI
const VN_TIMEZONE = 7 // Vietnam UTC+7

/** Integer part (floor) */
function INT(x: number): number {
  return Math.floor(x)
}

// --- Julian Day Number conversions (Meeus, Chapter 7) ---

function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = INT((14 - mm) / 12)
  const y = yy + 4800 - a
  const m = mm + 12 * a - 3
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045
  if (jd < 2299161) {
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083
  }
  return jd
}

function jdToDate(jd: number): [number, number, number] {
  let a: number, b: number, c: number
  if (jd > 2299160) {
    a = jd + 32044
    b = INT((4 * a + 3) / 146097)
    c = a - INT((b * 146097) / 4)
  } else {
    b = 0
    c = jd + 32082
  }
  const d = INT((4 * c + 3) / 1461)
  const e = c - INT((1461 * d) / 4)
  const m = INT((5 * e + 2) / 153)
  const day = e - INT((153 * m + 2) / 5) + 1
  const month = m + 3 - 12 * INT(m / 10)
  const year = b * 100 + d - 4800 + INT(m / 10)
  return [day, month, year]
}

// --- New Moon computation (Meeus, Chapter 49) ---

/**
 * Compute the Julian Day Number of the k-th New Moon after 1900-01-01.
 */
function getNewMoonDay(k: number, timeZone: number): number {
  const T = k / 1236.85
  const T2 = T * T
  const T3 = T2 * T
  const dr = LUNAR_PI / 180

  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)

  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3

  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M)
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr)
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr)
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr))
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M))
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr))
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M))

  let deltat: number
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2
  }

  const JdNew = Jd1 + C1 - deltat
  return INT(JdNew + 0.5 + timeZone / 24)
}

// --- Sun longitude (Meeus, Chapter 25 + nutation from Chapter 22) ---

/**
 * Compute the sun's ecliptic longitude sector (0-11) at midnight on Julian Day jdn.
 * 0 = Xuân Phân (0°-30°), ..., 9 = Đông Chí (270°-300°)
 */
function getSunLongitude(jdn: number, timeZone: number): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525
  const T2 = T * T
  const dr = LUNAR_PI / 180

  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2

  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M)
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M)

  // Nutation correction
  const omega = 125.04 - 1934.136 * T
  let L = L0 + DL - 0.00569 - 0.00478 * Math.sin(omega * dr)

  L = L * dr
  L = L - LUNAR_PI * 2 * INT(L / (LUNAR_PI * 2))
  if (L < 0) L += LUNAR_PI * 2

  return INT((L / LUNAR_PI) * 6)
}

// --- Lunar month 11 (chứa Đông Chí) ---

function getLunarMonth11(yy: number, timeZone: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021
  const k = INT(off / 29.530588853)
  let nm = getNewMoonDay(k, timeZone)
  const sunLong = getSunLongitude(nm, timeZone)
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone)
  }
  return nm
}

// --- Leap month detection ---

function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5)
  let last = 0
  let i = 1
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  do {
    last = arc
    i++
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
  } while (arc !== last && i < 14)
  return i - 1
}

// --- Public API ---

export interface LunarDate {
  ngayAm: number
  thangAm: number
  namAm: number
  thangNhuan: boolean
}

export function solarToLunar(day: number, month: number, year: number): LunarDate {
  const dayNumber = jdFromDate(day, month, year)
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853)
  let monthStart = getNewMoonDay(k + 1, VN_TIMEZONE)
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, VN_TIMEZONE)
  }

  let a11 = getLunarMonth11(year, VN_TIMEZONE)
  let b11 = a11
  let lunarYear: number

  if (a11 >= monthStart) {
    lunarYear = year
    a11 = getLunarMonth11(year - 1, VN_TIMEZONE)
  } else {
    lunarYear = year + 1
    b11 = getLunarMonth11(year + 1, VN_TIMEZONE)
  }

  const lunarDay = dayNumber - monthStart + 1
  const diff = INT((monthStart - a11) / 29)
  let lunarLeap = false
  let lunarMonth = diff + 11

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, VN_TIMEZONE)
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10
      if (diff === leapMonthDiff) {
        lunarLeap = true
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1
  }

  return { ngayAm: lunarDay, thangAm: lunarMonth, namAm: lunarYear, thangNhuan: lunarLeap }
}

export function lunarToSolar(
  ngayAm: number,
  thangAm: number,
  namAm: number,
  isLeapMonth: boolean = false,
): { day: number; month: number; year: number } {
  let a11: number, b11: number
  if (thangAm < 11) {
    a11 = getLunarMonth11(namAm - 1, VN_TIMEZONE)
    b11 = getLunarMonth11(namAm, VN_TIMEZONE)
  } else {
    a11 = getLunarMonth11(namAm, VN_TIMEZONE)
    b11 = getLunarMonth11(namAm + 1, VN_TIMEZONE)
  }

  let off = thangAm - 11
  if (off < 0) {
    off += 12
  }

  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, VN_TIMEZONE)
    let leapMonth = leapOff - 2
    if (leapMonth < 0) {
      leapMonth += 12
    }
    if (isLeapMonth && thangAm !== leapMonth) {
      return { day: 0, month: 0, year: 0 } // Invalid leap month
    } else if (isLeapMonth || off >= leapOff) {
      off += 1
    }
  }

  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853)
  const monthStart = getNewMoonDay(k + off, VN_TIMEZONE)
  const [day, month, year] = jdToDate(monthStart + ngayAm - 1)
  return { day, month, year }
}
