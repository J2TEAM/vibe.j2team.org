export async function downloadFile(blob: Blob | null, defaultFileName: string) {
  if (!blob) {
    console.error('downloadFile: blob is null or undefined')
    return
  }
  try {
    if ('showSaveFilePicker' in window) {
      const extension = defaultFileName.split('.').pop() || ''
      const types =
        extension === 'zip'
          ? [{ description: 'ZIP Archive', accept: { 'application/zip': ['.zip'] } }]
          : [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }]

      const handle = await (
        window as Window & {
          showSaveFilePicker: (options: Record<string, unknown>) => Promise<FileSystemFileHandle>
        }
      ).showSaveFilePicker({
        suggestedName: defaultFileName,
        types,
      })
      const writable = await handle.createWritable()
      const arrayBuffer = await blob.arrayBuffer()
      await writable.write(arrayBuffer)
      await writable.close()
      return
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') return
    console.warn('showSaveFilePicker failed, falling back to traditional download', err)
  }

  // Fallback: use traditional download without prompt to avoid annoying user
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = defaultFileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
