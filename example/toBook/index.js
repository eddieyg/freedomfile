const { FFPdf } = require('../../src/index')

FFPdf.toTimes({
  sourcePath: 'source.pdf', 
  insertIndex: -2,
  times: 5,
  fillPagePath: 'report.pdf',
}, (data, errMsg) => {
  if (data) fs.writeFileSync(`source-after.pdf`, data)
})

FFPdf.toBook({
  sourcePath: 'report.pdf', 
  insertIndex: -2,
  fillPagePath: 'report.pdf',
}, (data) => {
  data && fs.writeFileSync(`report-after.pdf`, data)
})
