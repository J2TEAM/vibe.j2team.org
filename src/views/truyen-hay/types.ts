export interface Category {
  id: string
  name: string
  slug: string
}

export interface ChapterData {
  filename: string
  chapter_name: string
  chapter_title: string
  chapter_api_data: string
}

export interface ServerChapter {
  server_name: string
  server_data: ChapterData[]
}

export interface ComicItem {
  _id: string
  name: string
  slug: string
  origin_name: string[]
  status: string
  thumb_url: string
  sub_docquyen: boolean
  category: Category[]
  updatedAt: string
  chaptersLatest?: ChapterData[]
}

export interface ComicDetail {
  seoOnPage: unknown
  item: {
    _id: string
    name: string
    slug: string
    origin_name: string[]
    content: string
    status: string
    thumb_url: string
    author: string[]
    category: Category[]
    chapters: ServerChapter[]
    updatedAt: string
  }
}

export interface OTruyenResponse {
  status: string
  message: string
  data: {
    seoOnPage: unknown
    items: ComicItem[]
    type_list?: string
    APP_DOMAIN_FRONTEND: string
    APP_DOMAIN_CDN_IMAGE: string
    params: {
      type_slug: string
      filterCategory: string[]
      sortField: string
      sortType: string
      pagination: {
        totalItems: number
        totalItemsPerPage: number
        currentPage: number
        pageRanges: number
      }
    }
  }
}

export interface HistoryComic {
  slug: string
  name: string
  thumb_url: string
  last_watched: number
  chapter_name?: string
  chapter_server?: string
}

export interface BookmarkComic {
  slug: string
  name: string
  thumb_url: string
  bookmarked_at: number
}
