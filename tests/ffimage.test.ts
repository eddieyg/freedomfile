import fs from 'fs'
import path from 'path'
import { describe, test, expect } from 'vitest'
import fsExtra from 'fs-extra'
import { PDFDocument } from 'pdf-lib'
import { FFImage } from '../src/index'

describe('FFImage', () => {
  test('splitImage', async () => {
    const sourcePath = path.join(__dirname, './image/long.png')
    const outputPath = path.join(__dirname, './image/splitimage')
    if (fs.existsSync(outputPath)) fsExtra.removeSync(outputPath)
    fsExtra.ensureDirSync(outputPath)

    const pdfDoc = await PDFDocument.create()
    const sourceImage = await pdfDoc.embedPng(fs.readFileSync(sourcePath))
    const splitWidth = sourceImage.width
    const splitHeight = (sourceImage.height - 300) / 2
    const result = await FFImage.splitImage(
      [sourcePath],
      {
        outputPath,
        splitWidth,
        splitHeight,
      }
    )
    expect(result.length).toBe(3)
    const firstImage = await pdfDoc.embedPng(fs.readFileSync(result[0] as string))
    expect(firstImage.width).toBe(splitWidth)
    expect(firstImage.height).toBe(splitHeight)
    fsExtra.removeSync(outputPath)
  })
})
