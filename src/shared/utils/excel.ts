export interface ExcelColumn {
  header: string
  key: string
  width?: number
}

/** Writes rows to an .xlsx file and triggers a browser download. exceljs is loaded lazily. */
export type ExcelRow = Record<string, string | number | boolean | null | undefined>

export interface ExcelSheet {
  name: string
  columns: ExcelColumn[]
  rows: ExcelRow[]
}

export const exportToExcel = (fileName: string, columns: ExcelColumn[], rows: ExcelRow[], sheetName = 'Sheet1') =>
  exportSheetsToExcel(fileName, [{ name: sheetName, columns, rows }])

export async function exportSheetsToExcel(fileName: string, sheets: ExcelSheet[]): Promise<void> {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31))
    ws.columns = sheet.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? Math.max(14, c.header.length + 4) }))
    ws.getRow(1).font = { bold: true }
    sheet.rows.forEach((r) => ws.addRow(r))
  }
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
