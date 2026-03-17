import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import type { SplitterRange } from '../types'

export class PdfSplitter {
  static async split(
    file: File,
    mode: 'ranges' | 'single',
    numPages: number,
    ranges: SplitterRange[],
  ): Promise<{ blob: Blob; fileName: string }> {
    const arrayBuffer = await file.arrayBuffer()
    const sourcePdf = await PDFDocument.load(arrayBuffer)
    const zip = new JSZip()
    const baseName = file.name.replace(/\.[^/.]+$/, '')

    let count = 0
    if (mode === 'single') {
      for (let i = 0; i < numPages; i++) {
        const newPdf = await PDFDocument.create()
        const [page] = await newPdf.copyPages(sourcePdf, [i])
        if (page) {
          newPdf.addPage(page)
          const bytes = await newPdf.save()
          zip.file(`${baseName}_p${i + 1}.pdf`, bytes)
          count++
        }
      }
    } else {
      for (const range of ranges) {
        const newPdf = await PDFDocument.create()
        const indices = []
        const start = Math.max(1, Math.min(range.start, numPages))
        const end = Math.max(start, Math.min(range.end, numPages))

        for (let p = start - 1; p < end; p++) indices.push(p)
        const pages = await newPdf.copyPages(sourcePdf, indices)
        pages.forEach((p) => {
          if (p) newPdf.addPage(p)
        })
        const bytes = await newPdf.save()
        zip.file(`${baseName}_range_${start}-${end}.pdf`, bytes)
        count++
      }
    }

    let finalBlob: Blob
    let finalSlug: string
    const zipFiles = Object.values(zip.files)

    if (count === 1 && zipFiles[0]) {
      const fileData = await zipFiles[0].async('uint8array')
      finalBlob = new Blob([fileData as ArrayBufferView], { type: 'application/pdf' })
      finalSlug = Object.keys(zip.files)[0] || 'split.pdf'
    } else {
      finalBlob = await zip.generateAsync({ type: 'blob' })
      finalSlug = `${baseName}_split.zip`
    }

    return { blob: finalBlob, fileName: finalSlug }
  }
}
