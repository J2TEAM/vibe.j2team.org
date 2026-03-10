export interface SEOData {
  titleHead: string // The title of the page for SEO
  descriptionHead: string // The meta description for the page
  og_type: string // The Open Graph type (e.g., "website")
  og_image: string[] // Array of image URLs for Open Graph
}

export interface Category {
  _id: string
  name: string
  slug: string
}

export interface CategoriesState {
  categories: Category[]
}

export interface Countries {
  _id?: string
  name: string
  slug?: string
  code: string
}

export interface CountriesState {
  countries: Countries[]
}

interface SEOOnPage {
  og_type: string
  titleHead: string
  seoSchema: {
    '@context': string
    '@type': string
    name: string
    dateModified: string
    dateCreated: string
    url: string
    datePublished: string
    image: string
    director: string
  }
  descriptionHead: string
  og_image: string[]
  updated_time: number
  og_url: string
}

interface BreadCrumb {
  name: string
  slug: string
  position: number
  isCurrent?: boolean
}

interface Params {
  slug: string
}

interface TMDB {
  type: string
  id: string
  season: number
  vote_average: number
  vote_count: number
}

interface IMDb {
  id: string
}

interface CreatedModified {
  time: string
}

interface CategoryCountry {
  id: string
  name: string
  slug: string
}

export interface EpisodeData {
  name: string
  slug: string
  filename: string
  link_embed: string
  link_m3u8: string
}

export interface Episode {
  server_name: string
  server_data: EpisodeData[]
}

export interface Movie {
  tmdb: TMDB
  imdb: IMDb
  created: CreatedModified
  modified: CreatedModified
  _id: string
  name: string
  slug: string
  origin_name: string
  content: string
  type: string
  status: string
  thumb_url: string
  poster_url: string
  is_copyright: boolean
  sub_docquyen: boolean
  chieurap: boolean
  trailer_url: string
  time: string
  episode_current: string
  episode_total: string
  quality: string
  lang: string
  notify: string
  showtimes: string
  year: number
  view: number
  actor: string[]
  director: string[]
  category: CategoryCountry[]
  country: CategoryCountry[]
  episodes: Episode[]
}

export interface ResponseMovie {
  seoOnPage: SEOOnPage
  breadCrumb: BreadCrumb[]
  params: Params
  item: Movie
}

export interface Actor {
  tmdb_people_id: number
  adult: boolean
  gender: number
  gender_name: string
  name: string
  original_name: string
  character: string
  known_for_department: string
  profile_path: string
}
