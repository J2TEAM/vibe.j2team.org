// Lazy-load each solar term's HTML content (24 files, ~896 kB total).
// Uses import.meta.glob() so Vite splits each term into its own chunk,
// only fetched when the user clicks to view details. Cached after first load.
const termModules = import.meta.glob<{ [key: string]: string }>('./terms/*.ts')

const termFileMap: Record<string, string> = {
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

const cache = new Map<string, string>()

export async function getTermContent(termName: string): Promise<string | null> {
  if (cache.has(termName)) return cache.get(termName)!

  const fileName = termFileMap[termName]
  if (!fileName) return null

  const modulePath = `./terms/${fileName}.ts`
  const loader = termModules[modulePath]
  if (!loader) return null

  const mod = await loader()
  const content = mod[fileName]
  if (content) cache.set(termName, content)
  return content ?? null
}
