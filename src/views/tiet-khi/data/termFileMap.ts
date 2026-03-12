/**
 * Ánh xạ tên tiết khí (tiếng Việt) → tên file (Latin, không dấu).
 * Dùng chung cho cả content.ts và articles/index.ts.
 */
export const termFileMap: Record<string, string> = {
  'Lập Xuân': 'LapXuan',
  'Vũ Thủy': 'VuThuy',
  'Kinh Trập': 'KinhTrap',
  'Xuân Phân': 'XuanPhan',
  'Thanh Minh': 'ThanhMinh',
  'Cốc Vũ': 'CocVu',
  'Lập Hạ': 'LapHa',
  'Tiểu Mãn': 'TieuMan',
  'Mang Chủng': 'MangChung',
  'Hạ Chí': 'HaChi',
  'Tiểu Thử': 'TieuThu',
  'Đại Thử': 'DaiThu',
  'Lập Thu': 'LapThu',
  'Xử Thử': 'XuThu',
  'Bạch Lộ': 'BachLo',
  'Thu Phân': 'ThuPhan',
  'Hàn Lộ': 'HanLo',
  'Sương Giáng': 'SuongGiang',
  'Lập Đông': 'LapDong',
  'Tiểu Tuyết': 'TieuTuyet',
  'Đại Tuyết': 'DaiTuyet',
  'Đông Chí': 'DongChi',
  'Tiểu Hàn': 'TieuHan',
  'Đại Hàn': 'DaiHan',
}
