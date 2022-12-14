import fs from 'fs'
import path from 'path'
import fsExtra from 'fs-extra'
import { describe, test, expect } from 'vitest'
import { PDFDocument, PageSizes } from 'pdf-lib'
import { FFPdf } from '../src/index'

describe('FFPdf', () => {
  test('toTimes', async () => {
    const sourcePath = path.join(__dirname, './pdf/toTimesBefore.pdf')
    const outputPath = path.join(__dirname, './pdf/toTimesAfter.pdf')
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)

    const timesResult = await FFPdf.toTimes({
      sourcePath,
      outputPath,
      times: 3
    })
    expect(timesResult.data).toBeInstanceOf(Uint8Array)
    expect(Boolean(timesResult.err)).toBeFalsy()
    const sourcePDF = await PDFDocument.load(fs.readFileSync(outputPath))
    expect(sourcePDF.getPages().length).toBe(6)
    fs.unlinkSync(outputPath)
  })

  test('toBook', async () => {
    const sourcePath = path.join(__dirname, './pdf/toBookBefore.pdf')
    const outputPath = path.join(__dirname, './pdf/toBookAfter.pdf')
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)

    const bookResult = await FFPdf.toBook({
      sourcePath,
      outputPath,
    })
    expect(bookResult.data).toBeInstanceOf(Uint8Array)
    expect(Boolean(bookResult.err)).toBeFalsy()
    const sourcePDF = await PDFDocument.load(fs.readFileSync(outputPath))
    expect(sourcePDF.getPages().length).toBe(3)
    const pdfDoc = await PDFDocument.create()
    const firstPage = await pdfDoc.embedPage(sourcePDF.getPages()[0])
    expect(firstPage.width).toBe(PageSizes.A3[1])
    expect(firstPage.height).toBe(PageSizes.A3[0])
    fs.unlinkSync(outputPath)
  })

  test('imageToA4Pdf', async () => {
    const sourcePath = path.join(__dirname, './image/long.png')
    const outputPath = path.join(__dirname, './image/imageToA4Pdf.pdf')
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)

    const result = await FFPdf.imageToA4Pdf(
      [sourcePath, sourcePath],
      outputPath
    )
    expect(result).toBeInstanceOf(Uint8Array)
    const pdfDoc = await PDFDocument.create()
    const resPdfDoc = await PDFDocument.load(fs.readFileSync(outputPath))
    const firstPage = await pdfDoc.embedPage(resPdfDoc.getPages()[0])
    expect(resPdfDoc.getPages().length).toBe(4)
    expect(firstPage.width).toBe(PageSizes.A4[0])
    expect(firstPage.height).toBe(PageSizes.A4[1])
    fs.unlinkSync(outputPath)
  })
})
