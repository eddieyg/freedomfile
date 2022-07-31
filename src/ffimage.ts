import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { PDFDocument, PageSizes } from 'pdf-lib'
// const sharp = require('sharp')

interface SplitImageOptions {
  outputPath?: string,
  splitWidth: number | string, 
  splitHeight: number | string
}

/**
 * cut a picture into multiple pieces
 * @param inputs image file path
 * @param options SplitImageOptions
 * @returns 
 */
export async function splitImage (
  inputs: string[], 
  options: SplitImageOptions
) {
  const { outputPath } = options
  let { splitWidth, splitHeight } = options
  const pdfDoc = await PDFDocument.create()
  splitWidth = parseInt(splitWidth as unknown as string)
  splitHeight = parseInt(splitHeight as unknown as string)
  
  const result: (string | Uint8Array) [] = []
  let currIndex = 0
  while(currIndex < inputs.length) {
    const imagePath = inputs[currIndex]
    const imageBytes = fs.readFileSync(imagePath)
    const image = await pdfDoc.embedPng(imageBytes)
    const oneImageHeight = Math.ceil((image.width / splitWidth) * splitHeight)

    let currImageHeight = image.height
    let currImageSplit = 0
    while(currImageHeight) {
      let applyHeight
      if (currImageHeight >= oneImageHeight) {
        applyHeight = oneImageHeight
        currImageHeight -= oneImageHeight
      } else {
        applyHeight = currImageHeight
        currImageHeight = 0
      }
      const extractRes = (await sharpExtractPromise(
        imagePath,
        outputPath ? `${outputPath}/${currIndex}-${currImageSplit}.png` : '',
        currImageSplit * oneImageHeight,
        image.width,
        applyHeight

      )) as (string | Uint8Array)
      result.push(extractRes)
      currImageSplit++
    }
    currIndex++
  }
  
  return result
}

function sharpExtractPromise(
  imagePath: string, 
  outputPath: string, 
  top: number, 
  width: number, 
  height: number
) {
  return new Promise((resolve: any) => {
    const sharpIns = sharp(imagePath).extract({ left: 0, top, width, height })
    if (outputPath) {
      sharpIns.toFile(outputPath, (err: Error) => {
        if (!err) {
          resolve(outputPath)
        } else {
          console.log('sharpExtractPromise error', JSON.stringify(err))
        }
      })
    } else {
      sharpIns.toBuffer((err: Error, buffer: Buffer) => {
        if (!err) {
          resolve(buffer)
        } else {
          console.log('sharpExtractPromise error', JSON.stringify(err))
        }
      })
    }
  })
}
