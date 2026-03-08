import { ref, computed } from 'vue'
import type { NavState, ViewName } from '../types'

interface BreadcrumbItem {
  label: string
  action?: () => void
}

const currentNav = ref<NavState>({ view: 'folder-list' })
const history: NavState[] = []

export function useNavigation() {
  function navigateTo(state: NavState) {
    history.push({ ...currentNav.value })
    currentNav.value = state
  }

  function goBack() {
    const prev = history.pop()
    if (prev) {
      currentNav.value = prev
    }
  }

  function goToFolders() {
    history.length = 0
    currentNav.value = { view: 'folder-list' }
  }

  function goToSets(folderId: string, folderName?: string) {
    navigateTo({ view: 'set-list', folderId, folderName })
  }

  function goToEditor(folderId: string, setId: string, folderName?: string, setName?: string) {
    navigateTo({
      view: 'card-editor',
      folderId,
      setId,
      folderName: folderName ?? currentNav.value.folderName,
      setName: setName ?? currentNav.value.setName,
    })
  }

  function goToStudyConfig(folderId: string, setId: string, folderName?: string, setName?: string) {
    navigateTo({
      view: 'study-config',
      folderId,
      setId,
      folderName: folderName ?? currentNav.value.folderName,
      setName: setName ?? currentNav.value.setName,
    })
  }

  function goToStudy(folderId: string, setId: string) {
    navigateTo({
      view: 'study-mode',
      folderId,
      setId,
      folderName: currentNav.value.folderName,
      setName: currentNav.value.setName,
    })
  }

  function goToStudyComplete(folderId: string, setId: string) {
    navigateTo({
      view: 'study-complete',
      folderId,
      setId,
      folderName: currentNav.value.folderName,
      setName: currentNav.value.setName,
    })
  }

  const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = []
    const nav = currentNav.value

    if (nav.view !== 'folder-list') {
      items.push({ label: 'Flash Card', action: goToFolders })
    }

    if (nav.folderId && nav.folderName && nav.view !== 'set-list') {
      items.push({ label: nav.folderName, action: () => goToSets(nav.folderId!, nav.folderName) })
    } else if (nav.view === 'set-list' && nav.folderName) {
      items.push({ label: nav.folderName })
    }

    if (nav.setId && nav.setName && nav.view !== 'card-editor') {
      items.push({
        label: nav.setName,
        action: () => goToEditor(nav.folderId!, nav.setId!, nav.folderName, nav.setName),
      })
    } else if (nav.view === 'card-editor' && nav.setName) {
      items.push({ label: nav.setName })
    }

    return items
  })

  const currentView = computed<ViewName>(() => currentNav.value.view)
  const currentFolderId = computed(() => currentNav.value.folderId)
  const currentSetId = computed(() => currentNav.value.setId)

  return {
    currentNav,
    currentView,
    currentFolderId,
    currentSetId,
    breadcrumbs,
    navigateTo,
    goBack,
    goToFolders,
    goToSets,
    goToEditor,
    goToStudyConfig,
    goToStudy,
    goToStudyComplete,
  }
}
