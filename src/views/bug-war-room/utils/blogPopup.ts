import type { BlogPost } from '../blog/types'
import { getLearningBlogHtml } from './popupTemplates'

interface LearningSignalEntry {
  severity: string
  note: string
  createdAt: string
}

interface LearningBlogPopupOptions {
  targetTab?: Window
  popupSourceWindow: Window
  posts: BlogPost[]
  signals: LearningSignalEntry[]
  blogUiStateStorageKey: string
  publicShareUrl: string
  onBlocked: () => void
  onInitError: () => void
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function parseDateScore(value: string): number {
  const ts = Date.parse(value)
  return Number.isNaN(ts) ? 0 : ts
}

export function hydrateLearningBlogPopup(options: LearningBlogPopupOptions): void {
  const {
    targetTab,
    popupSourceWindow,
    posts,
    signals,
    blogUiStateStorageKey,
    publicShareUrl,
    onBlocked,
    onInitError,
  } = options

  const blogTab = targetTab ?? popupSourceWindow.open('', '_blank')
  if (!blogTab) {
    onBlocked()
    return
  }

  const html = getLearningBlogHtml(publicShareUrl)

  try {
    blogTab.document.open()
    blogTab.document.write(html)
    blogTab.document.close()

    const homeSection = blogTab.document.getElementById('blog-home') as HTMLElement | null
    const homeList = blogTab.document.getElementById('blog-home-list') as HTMLElement | null
    const detailSection = blogTab.document.getElementById('blog-detail') as HTMLElement | null
    const detailToc = blogTab.document.getElementById('blog-detail-toc') as HTMLElement | null
    const detailContent = blogTab.document.getElementById('blog-detail-content') as HTMLElement | null
    const searchInput = blogTab.document.getElementById('blog-search-input') as HTMLInputElement | null
    const tagCombobox = blogTab.document.getElementById('blog-tag-combobox') as HTMLInputElement | null
    const tagOptions = blogTab.document.getElementById('blog-tag-options') as HTMLDataListElement | null
    const sortCombobox = blogTab.document.getElementById('blog-sort-combobox') as HTMLInputElement | null
    const clearTagFilterBtn = blogTab.document.getElementById('blog-clear-tag-filter-btn') as HTMLButtonElement | null
    const resetAllFilterBtn = blogTab.document.getElementById('blog-reset-all-filter-btn') as HTMLButtonElement | null
    const homeResultCount = blogTab.document.getElementById('blog-home-result-count') as HTMLElement | null
    const signalList = blogTab.document.getElementById('blog-signal-list') as HTMLElement | null
    const signalEmpty = blogTab.document.getElementById('blog-signal-empty') as HTMLElement | null
    const homeBtn = blogTab.document.getElementById('blog-home-btn') as HTMLButtonElement | null
    const backListBtn = blogTab.document.getElementById('blog-back-list-btn') as HTMLButtonElement | null

    let currentSectionIds: string[] = []
    let activeBlogView: 'home' | 'detail' = 'home'
    let activeBlogSlug = ''
    let searchKeyword = ''
    let activeTagInput = ''
    let activeTagQuery = ''
    let activeSortMode = 'newest'

    const storage = popupSourceWindow.localStorage
    const allTags = Array.from(new Set(
      posts.flatMap((post) => post.tags.map((tag) => tag.trim())).filter((tag) => tag.length > 0),
    )).sort((a, b) => a.localeCompare(b, 'vi'))

    const syncTagOptions = (): void => {
      if (!tagOptions) {
        return
      }

      const optionsHtml = [
        '<option value="all"></option>',
        ...allTags.map((tag) => `<option value="${escapeHtml(tag)}"></option>`),
      ]
      tagOptions.innerHTML = optionsHtml.join('')
    }

    const parseBlogUiState = (raw: string | null): {
      searchKeyword: string
      activeTagInput: string
      activeSortMode: string
      activeBlogView: 'home' | 'detail'
      activeBlogSlug: string
    } => {
      if (!raw) {
        return {
          searchKeyword: '',
          activeTagInput: '',
          activeSortMode: 'newest',
          activeBlogView: 'home',
          activeBlogSlug: '',
        }
      }

      try {
        const parsed = JSON.parse(raw) as {
          searchKeyword?: string
          activeTagInput?: string
          activeSortMode?: string
          activeBlogView?: string
          activeBlogSlug?: string
        }

        const acceptedModes = ['newest', 'oldest', 'read-long', 'read-short', 'title-az', 'title-za']
        const mode = parsed.activeSortMode && acceptedModes.includes(parsed.activeSortMode)
          ? parsed.activeSortMode
          : 'newest'

        return {
          searchKeyword: typeof parsed.searchKeyword === 'string' ? parsed.searchKeyword : '',
          activeTagInput: typeof parsed.activeTagInput === 'string' ? parsed.activeTagInput : '',
          activeSortMode: mode,
          activeBlogView: parsed.activeBlogView === 'detail' ? 'detail' : 'home',
          activeBlogSlug: typeof parsed.activeBlogSlug === 'string' ? parsed.activeBlogSlug : '',
        }
      } catch {
        return {
          searchKeyword: '',
          activeTagInput: '',
          activeSortMode: 'newest',
          activeBlogView: 'home',
          activeBlogSlug: '',
        }
      }
    }

    const saveBlogUiState = (): void => {
      try {
        storage.setItem(blogUiStateStorageKey, JSON.stringify({
          searchKeyword,
          activeTagInput,
          activeSortMode,
          activeBlogView,
          activeBlogSlug,
        }))
      } catch {
        // Storage can be disabled in strict privacy modes.
      }
    }

    const restoredBlogUi = parseBlogUiState(storage.getItem(blogUiStateStorageKey))
    searchKeyword = restoredBlogUi.searchKeyword
    activeTagInput = restoredBlogUi.activeTagInput
    activeTagQuery = activeTagInput && normalizeSearchText(activeTagInput) !== 'all'
      ? normalizeSearchText(activeTagInput)
      : ''
    activeSortMode = restoredBlogUi.activeSortMode
    activeBlogView = restoredBlogUi.activeBlogView
    activeBlogSlug = restoredBlogUi.activeBlogSlug

    const getSortedPosts = (targetPosts: BlogPost[]): BlogPost[] => {
      const sorted = [...targetPosts]

      sorted.sort((a, b) => {
        if (activeSortMode === 'oldest') {
          return parseDateScore(a.publishedAt) - parseDateScore(b.publishedAt)
        }

        if (activeSortMode === 'read-long') {
          return b.readMinutes - a.readMinutes
        }

        if (activeSortMode === 'read-short') {
          return a.readMinutes - b.readMinutes
        }

        if (activeSortMode === 'title-az') {
          return a.title.localeCompare(b.title, 'vi')
        }

        if (activeSortMode === 'title-za') {
          return b.title.localeCompare(a.title, 'vi')
        }

        return parseDateScore(b.publishedAt) - parseDateScore(a.publishedAt)
      })

      return sorted
    }

    const getFilteredPosts = (): BlogPost[] => {
      const keyword = normalizeSearchText(searchKeyword)

      const filtered = posts.filter((post) => {
        if (activeTagQuery && !post.tags.some((tag) => normalizeSearchText(tag).includes(activeTagQuery))) {
          return false
        }

        if (!keyword) {
          return true
        }

        const textToSearch = normalizeSearchText([
          post.title,
          post.excerpt,
          post.author,
          post.tags.join(' '),
          post.sections.map((section) => `${section.heading} ${section.paragraphs.join(' ')}`).join(' '),
        ].join(' '))

        return textToSearch.includes(keyword)
      })

      return getSortedPosts(filtered)
    }

    const renderSignals = (): void => {
      if (!signalList || !signalEmpty) {
        return
      }

      const entries = signals.slice(0, 4)
      if (entries.length === 0) {
        signalList.innerHTML = ''
        signalEmpty.classList.remove('hidden')
        return
      }

      signalEmpty.classList.add('hidden')
      signalList.innerHTML = entries.map((entry) => {
        return `<li><strong>${escapeHtml(entry.severity)}</strong> - ${escapeHtml(entry.note)} (${escapeHtml(entry.createdAt)})</li>`
      }).join('')
    }

    const renderHome = (): void => {
      if (!homeSection || !homeList || !detailSection || !backListBtn) {
        return
      }

      homeSection.classList.remove('hidden')
      detailSection.classList.add('hidden')
      backListBtn.classList.add('hidden')
      currentSectionIds = []
      activeBlogView = 'home'
      activeBlogSlug = ''
      saveBlogUiState()

      const filteredPosts = getFilteredPosts()
      if (homeResultCount) {
        const suffix = filteredPosts.length === posts.length && !searchKeyword && !activeTagQuery
          ? `${filteredPosts.length} bài`
          : `${filteredPosts.length}/${posts.length} bài phù hợp`
        homeResultCount.textContent = suffix
      }

      if (filteredPosts.length === 0) {
        homeList.innerHTML = '<div class="home-empty">Không tìm thấy bài viết phù hợp. Hãy thử từ khóa khác hoặc bỏ lọc tag.</div>'
        return
      }

      homeList.innerHTML = filteredPosts.map((post) => {
        const coverImageHtml = post.coverImageUrl
          ? `<img class="post-cover" src="${escapeHtml(post.coverImageUrl)}" alt="${escapeHtml(post.coverImageAlt ?? post.title)}" loading="lazy" />`
          : ''
        const tagsHtml = post.tags.map((tag) => `<button type="button" class="tag tag-clickable" data-filter-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join('')
        return `<article class="post-card">
          <p class="post-kicker">BUG WAR ROOM BLOG</p>
          ${coverImageHtml}
          <button type="button" class="post-title-btn" data-blog-slug="${escapeHtml(post.slug)}">${escapeHtml(post.title)}</button>
          <p class="post-meta">Tác giả: ${escapeHtml(post.author)} • Ngày đăng: ${escapeHtml(post.publishedAt)}${post.updatedAt ? ` • Cập nhật: ${escapeHtml(post.updatedAt)}` : ''} • ${post.readMinutes} phút đọc</p>
          <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
          <div class="tags">${tagsHtml}</div>
        </article>`
      }).join('')
    }

    const updateActiveTocLink = (): void => {
      if (!detailToc || currentSectionIds.length === 0 || detailSection?.classList.contains('hidden')) {
        return
      }

      let activeId = currentSectionIds[0]
      for (const id of currentSectionIds) {
        const section = blogTab.document.getElementById(id)
        if (!section) {
          continue
        }

        const top = section.getBoundingClientRect().top
        if (top <= 140) {
          activeId = id
        }
      }

      detailToc.querySelectorAll('.toc-side-link').forEach((node) => {
        node.classList.remove('active')
      })
      const activeLink = detailToc.querySelector(`[data-target="${activeId}"]`)
      if (activeLink) {
        activeLink.classList.add('active')
      }
    }

    const renderDetail = (slug: string): void => {
      if (!homeSection || !detailSection || !detailToc || !detailContent || !backListBtn) {
        return
      }

      const post = posts.find((item) => item.slug === slug)
      if (!post) {
        renderHome()
        return
      }

      homeSection.classList.add('hidden')
      detailSection.classList.remove('hidden')
      backListBtn.classList.remove('hidden')
      activeBlogView = 'detail'
      activeBlogSlug = slug
      saveBlogUiState()

      const coverImageHtml = post.coverImageUrl
        ? `<img class="detail-cover" src="${escapeHtml(post.coverImageUrl)}" alt="${escapeHtml(post.coverImageAlt ?? post.title)}" loading="lazy" />`
        : ''
      const tagsHtml = post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
      const imageLinksHtml = post.imageLinks && post.imageLinks.length > 0
        ? `<div class="image-links">
            <p>Link ảnh tham khảo theo chủ đề bài viết:</p>
            <ul>
              ${post.imageLinks.map((item) => `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)}</a></li>`).join('')}
            </ul>
          </div>`
        : ''
      const sectionBlocks = post.sections.map((section, sectionIndex) => {
        const sectionId = `blog-post-${post.slug}-section-${sectionIndex + 1}`
        const paragraphsHtml = section.paragraphs.map((paragraph) => `<li>${escapeHtml(paragraph)}</li>`).join('')
        return `<section class="blog-section" id="${escapeHtml(sectionId)}">
          <h3 class="blog-section-heading">
            <span class="section-index">${sectionIndex + 1}</span>
            <span>${escapeHtml(section.heading)}</span>
          </h3>
          <ol class="section-points">${paragraphsHtml}</ol>
        </section>`
      })

      detailContent.innerHTML = `
        <p class="post-kicker">BUG WAR ROOM BLOG / CHI TIẾT</p>
        <h2>${escapeHtml(post.title)}</h2>
        <p class="post-meta">Tác giả: ${escapeHtml(post.author)} • Ngày đăng: ${escapeHtml(post.publishedAt)}${post.updatedAt ? ` • Cập nhật: ${escapeHtml(post.updatedAt)}` : ''} • ${post.readMinutes} phút đọc</p>
        ${coverImageHtml}
        <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
        <p class="blog-reading-note">Gợi ý đọc nhanh: xem mục lục bên phải để nhảy theo chủ đề, mỗi phần đã tách thành các ý chính để theo dõi dễ hơn.</p>
        <div class="tags">${tagsHtml}</div>
        ${imageLinksHtml}
        ${sectionBlocks.join('')}
      `

      currentSectionIds = post.sections.map((_, sectionIndex) => `blog-post-${post.slug}-section-${sectionIndex + 1}`)
      detailToc.innerHTML = post.sections.map((section, sectionIndex) => {
        const sectionId = `blog-post-${post.slug}-section-${sectionIndex + 1}`
        return `<a href="#${escapeHtml(sectionId)}" data-target="${escapeHtml(sectionId)}" class="toc-side-link">${sectionIndex + 1}. ${escapeHtml(section.heading)}</a>`
      }).join('')

      detailToc.querySelectorAll('.toc-side-link').forEach((node) => {
        node.addEventListener('click', (event) => {
          event.preventDefault()
          const target = (node as HTMLElement).dataset.target
          if (!target) {
            return
          }

          const section = blogTab.document.getElementById(target)
          if (!section) {
            return
          }

          section.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      })

      updateActiveTocLink()
      blogTab.scrollTo({ top: 0, behavior: 'auto' })
    }

    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        renderHome()
        blogTab.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }

    if (backListBtn) {
      backListBtn.addEventListener('click', () => {
        renderHome()
        blogTab.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }

    if (homeList) {
      homeList.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        const tagFilterTrigger = target.closest('[data-filter-tag]') as HTMLElement | null
        if (tagFilterTrigger) {
          const tag = tagFilterTrigger.dataset.filterTag
          if (tag) {
            activeTagInput = tag
            activeTagQuery = normalizeSearchText(tag)
            if (tagCombobox) {
              tagCombobox.value = tag
            }
            saveBlogUiState()
            renderHome()
            blogTab.scrollTo({ top: 0, behavior: 'smooth' })
          }
          return
        }

        const trigger = target.closest('[data-blog-slug]') as HTMLElement | null
        if (!trigger) {
          return
        }

        const slug = trigger.dataset.blogSlug
        if (!slug) {
          return
        }

        renderDetail(slug)
      })
    }

    if (searchInput) {
      searchInput.value = searchKeyword
      searchInput.addEventListener('input', () => {
        searchKeyword = searchInput.value
        saveBlogUiState()
        renderHome()
      })
    }

    if (tagCombobox) {
      tagCombobox.value = activeTagInput
      tagCombobox.addEventListener('focus', () => {
        tagCombobox.select()
      })

      tagCombobox.addEventListener('input', () => {
        const raw = tagCombobox.value.trim()
        activeTagInput = raw
        const normalized = normalizeSearchText(raw)
        activeTagQuery = normalized === 'all' ? '' : normalized
        saveBlogUiState()
        renderHome()
      })

      tagCombobox.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
          return
        }

        activeTagInput = ''
        activeTagQuery = ''
        tagCombobox.value = ''
        saveBlogUiState()
        renderHome()
      })
    }

    if (sortCombobox) {
      sortCombobox.value = activeSortMode
      sortCombobox.addEventListener('focus', () => {
        sortCombobox.select()
      })

      sortCombobox.addEventListener('input', () => {
        const mode = normalizeSearchText(sortCombobox.value)
        const acceptedModes = ['newest', 'oldest', 'read-long', 'read-short', 'title-az', 'title-za']
        activeSortMode = acceptedModes.includes(mode) ? mode : 'newest'
        if (!acceptedModes.includes(mode)) {
          sortCombobox.value = 'newest'
        }
        saveBlogUiState()
        renderHome()
      })
    }

    if (clearTagFilterBtn) {
      clearTagFilterBtn.addEventListener('click', () => {
        activeTagInput = ''
        activeTagQuery = ''
        if (tagCombobox) {
          tagCombobox.value = ''
        }
        saveBlogUiState()
        renderHome()
      })
    }

    if (resetAllFilterBtn) {
      resetAllFilterBtn.addEventListener('click', () => {
        activeTagInput = ''
        activeTagQuery = ''
        searchKeyword = ''
        activeSortMode = 'newest'
        if (tagCombobox) {
          tagCombobox.value = ''
        }
        if (searchInput) {
          searchInput.value = ''
        }
        if (sortCombobox) {
          sortCombobox.value = 'newest'
        }
        saveBlogUiState()
        renderHome()
      })
    }

    syncTagOptions()

    const exportBtn = blogTab.document.getElementById('blog-export-pdf-btn') as HTMLButtonElement | null
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        blogTab.focus()
        blogTab.print()
      })
    }

    const backTopBtn = blogTab.document.getElementById('blog-back-to-top') as HTMLButtonElement | null
    if (backTopBtn) {
      backTopBtn.addEventListener('click', () => {
        blogTab.scrollTo({ top: 0, behavior: 'smooth' })
      })

      const onBlogScroll = () => {
        backTopBtn.style.display = blogTab.scrollY > 420 ? 'block' : 'none'
        updateActiveTocLink()
      }
      blogTab.addEventListener('scroll', onBlogScroll)
      onBlogScroll()
    }

    renderSignals()
    if (activeBlogView === 'detail' && activeBlogSlug) {
      renderDetail(activeBlogSlug)
    } else {
      renderHome()
    }

  } catch {
    if (!targetTab) {
      blogTab.close()
      onInitError()
    }
  }
}
