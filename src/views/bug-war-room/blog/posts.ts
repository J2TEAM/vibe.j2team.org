import type { BlogPost } from './types'
import { containmentTruocToiUuPost } from './posts/containment-truoc-toi-uu'
import { observabilityKhongChiLaDashboardPost } from './posts/observability-khong-chi-la-dashboard'
import { rollbackFeatureFlagAnToanPost } from './posts/rollback-feature-flag-an-toan'
import { trustKhongTuFixMaRaPost } from './posts/trust-khong-tu-fix-ma-ra'

export type { BlogPost } from './types'

export const bugWarRoomBlogPosts: BlogPost[] = [
  containmentTruocToiUuPost,
  trustKhongTuFixMaRaPost,
  observabilityKhongChiLaDashboardPost,
  rollbackFeatureFlagAnToanPost,
]
