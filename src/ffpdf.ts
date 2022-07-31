import fs from 'fs'
import { PDFDocument, PageSizes, rgb } from 'pdf-lib'
import { splitImage } from './ffimage'

interface PdfResult {
  data: null | Uint8Array
  err: string
}

interface ToTimesOptions {
  // PDF file path
  sourcePath: string
  // output path
  outputPath?: string
  // fill page pdf file path
  fillPagePath?: string
  // fill page insert index
  insertIndex?: number
  // pdf pages times
  times: number
}

/**
 * The number of PDF pages processed to a specified multiple  
 * 
 * For example:  
 * toTimes({  
 *   sourcePath: 'a.pdf',  
 *   outputPath: 'b.pdf',  
 *   times: 4  
 * })  
 * // if a.pdf pages is 2, b.pdf pages is 4  
 * // if a.pdf pages is 6, b.pdf pages is 8  
 */
 export async function toTimes(options: ToTimesOptions): Promise<PdfResult> {
  const { sourcePath, outputPath, insertIndex, times = 1, fillPagePath } = options
  const result: PdfResult = {
    data: null,
    err: ''
  }
  if (!fs.existsSync(sourcePath)) {
    result.err = `toTimes()，${sourcePath} The path file does not exist！`
    return result
  }

  try {
    const blankDoc = await PDFDocument.create()
    const sourcePDF = await PDFDocument.load(fs.readFileSync(sourcePath))
    const pageNum = sourcePDF.getPages().length
    let fillPDF
    let needAdd = pageNum % times ? (times - pageNum % times) : 0
    let pageInsertIndex = insertIndex //  the blank page insert posiotion
    if (fillPagePath && fs.existsSync(fillPagePath)) {
      fillPDF = await PDFDocument.load(fs.readFileSync(fillPagePath))
    }
    if (typeof insertIndex === 'undefined') {
      pageInsertIndex = pageNum
    } else if (insertIndex < 0) {
      pageInsertIndex = pageNum + insertIndex
    }
    while(needAdd--) {
      // Fill in blank pages
      let page = blankDoc.addPage()
      if (fillPDF) {
        let fillPage = await blankDoc.embedPage(fillPDF.getPages()[0])
        page.drawPage(fillPage, {
          x: 0,
          y: 0,
        })
      } else {
        page.drawLine({
          start: { x: 0, y: 0 },
          end: { x: 0, y: 0 },
          thickness: 0,
          color: rgb(0, 0, 0),
          opacity: 0,
        })
      }
    }
    const docPages = await sourcePDF.copyPages(blankDoc, blankDoc.getPageIndices())
    docPages.forEach(page => sourcePDF.insertPage(pageInsertIndex as number, page))
    let resBuffer = await sourcePDF.save()
    outputPath && fs.writeFileSync(`${outputPath}`, resBuffer)
    result.data = resBuffer
    return result
  } catch(err: any) {
    result.err = `toTimes()，${err.message}`
    return result
  }
}

interface ToBookOptions {
  // A4 PDF file path
  sourcePath: string
  // output A3 PDF file path
  outputPath?: string
  fillPagePath?: string
  insertIndex?: number
}

/**
 * A4 process to A3 typesetting PDF
 * example:
 *  toBook({
 *    sourcePath: 'a.pdf',
 *    outputPath: 'b.pdf'
 *  })
 *  // a.pdf page sort is: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
 *  // b.pdf page sort is: 8 1 | 2 7 | 6 3 | 4 5
 */
export async function toBook(options: ToBookOptions): Promise<PdfResult> {
  const { sourcePath, outputPath, insertIndex, fillPagePath } = options
  const result: PdfResult = {
    data: null,
    err: ''
  }
  if (!fs.existsSync(sourcePath)) {
    result.err = `toBook()，${sourcePath} The path file does not exist！`
    return result
  }

  try {
    const timesResult = await toTimes({
      sourcePath, 
      insertIndex, 
      times: 2, 
      fillPagePath 
    })
    if (timesResult.err) {
      result.err = timesResult.err
      return result
    }
    const sourcePDF = await PDFDocument.load(timesResult.data as Uint8Array)
    const resPDF = await PDFDocument.create()

    const pageWidth = PageSizes.A3[1]
    const pageHeight = PageSizes.A3[0]
    const pageNum = sourcePDF.getPages().length
    let pageIndexs = Array.apply(null, { length: pageNum } as unknown[]).map((e, i) => i)
    let count = 1

    while(count <= (pageNum / 2)) {
      let page = resPDF.addPage([pageWidth, pageHeight])
      let start = pageIndexs[count - 1]
      let end = pageIndexs[pageNum - count]
      let left = await resPDF.embedPage(sourcePDF.getPages()[
        count % 2 ? end : start
      ])
      let right = await resPDF.embedPage(sourcePDF.getPages()[
        count % 2 ? start : end
      ])
      page.drawPage(left, {
        x: 0,
        y: 0,
      })
      page.drawPage(right, {
        x: pageWidth - right.width,
        y: 0,
      })
      count++
    }

    let resBuffer = await resPDF.save()
    outputPath && fs.writeFileSync(`${outputPath}`, resBuffer)
    result.data = resBuffer
    return result
    
  } catch(err: any) {
    result.err = `toBook()，${err.message}`
    return result
  }
}

export async function imageToA4Pdf(inputs: string[], outputPath: string) {
  const pdfDoc = await PDFDocument.create()
  const splitImages = await splitImage(inputs, {
    splitWidth: PageSizes.A4[0],
    splitHeight: PageSizes.A4[1],
  })

  while(splitImages.length) {
    const page = pdfDoc.addPage(PageSizes.A4)
    const imageBytes = splitImages.shift() as Uint8Array
    const pngImage = await pdfDoc.embedPng(imageBytes)
    const imageSize = pngImage.scaleToFit(
      page.getWidth(),
      page.getHeight()
    )
    page.drawImage(pngImage, {
      x: 0,
      y: page.getHeight() - imageSize.height,
      width: imageSize.width,
      height: imageSize.height,
    })
  }
  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync(outputPath, pdfBytes)
  return pdfBytes
}
