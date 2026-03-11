import { LapXuanArticle } from './LapXuan'
import { VuThuyArticle } from './VuThuy'
import { KinhTrapArticle } from './KinhTrap'
import { XuanPhanArticle } from './XuanPhan'
import { ThanhMinhArticle } from './ThanhMinh'
import { CocVuArticle } from './CocVu'
import { LapHaArticle } from './LapHa'
import { TieuManArticle } from './TieuMan'
import { MangChungArticle } from './MangChung'
import { HaChiArticle } from './HaChi'
import { TieuThuArticle } from './TieuThu'
import { DaiThuArticle } from './DaiThu'
import { LapThuArticle } from './LapThu'
import { XuThuArticle } from './XuThu'
import { BachLoArticle } from './BachLo'
import { ThuPhanArticle } from './ThuPhan'
import { HanLoArticle } from './HanLo'
import { SuongGiangArticle } from './SuongGiang'
import { LapDongArticle } from './LapDong'
import { TieuTuyetArticle } from './TieuTuyet'
import { DaiTuyetArticle } from './DaiTuyet'
import { DongChiArticle } from './DongChi'
import { TieuHanArticle } from './TieuHan'
import { DaiHanArticle } from './DaiHan'
import type { Article } from './types'

export const articles: Record<string, Article> = {
  'Lập Xuân': LapXuanArticle,
  'Vũ Thủy': VuThuyArticle,
  'Kinh Trập': KinhTrapArticle,
  'Xuân Phân': XuanPhanArticle,
  'Thanh Minh': ThanhMinhArticle,
  'Cốc Vũ': CocVuArticle,
  'Lập Hạ': LapHaArticle,
  'Tiểu Mãn': TieuManArticle,
  'Mang Chủng': MangChungArticle,
  'Hạ Chí': HaChiArticle,
  'Tiểu Thử': TieuThuArticle,
  'Đại Thử': DaiThuArticle,
  'Lập Thu': LapThuArticle,
  'Xử Thử': XuThuArticle,
  'Bạch Lộ': BachLoArticle,
  'Thu Phân': ThuPhanArticle,
  'Hàn Lộ': HanLoArticle,
  'Sương Giáng': SuongGiangArticle,
  'Lập Đông': LapDongArticle,
  'Tiểu Tuyết': TieuTuyetArticle,
  'Đại Tuyết': DaiTuyetArticle,
  'Đông Chí': DongChiArticle,
  'Tiểu Hàn': TieuHanArticle,
  'Đại Hàn': DaiHanArticle,
}

export type { Article, ArticleSection } from './types'
