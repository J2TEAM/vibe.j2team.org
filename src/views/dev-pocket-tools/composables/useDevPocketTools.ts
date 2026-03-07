import { useBuilderTools } from './useBuilderTools'
import { useClipboardStatus } from './useClipboardStatus'
import { useDataTools } from './useDataTools'
import { useInspectTools } from './useInspectTools'
import { usePageNavigation } from './usePageNavigation'
import { useTimeTools } from './useTimeTools'

export function useDevPocketTools() {
  const navigation = usePageNavigation()
  const clipboard = useClipboardStatus()
  const builders = useBuilderTools()
  const data = useDataTools(clipboard.setCopyStatus)
  const time = useTimeTools()
  const inspect = useInspectTools()

  return {
    ...builders,
    ...clipboard,
    ...data,
    ...inspect,
    ...navigation,
    ...time,
  }
}
