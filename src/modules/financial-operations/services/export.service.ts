const exportToCSV = (filename: string, data: any[]) => {
  if (!data || !data.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => 
    Object.values(row).map(val => {
      const valStr = String(val).replace(/"/g, '""')
      return valStr.includes(',') ? `"${valStr}"` : valStr
    }).join(',')
  )
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const exportToExcel = (filename: string, data: any[]) => {
  // Simple XML/CSV fallback download for excel
  exportToCSV(filename, data)
}

export const ExportService = {
  exportToCSV,
  exportToExcel
}

export default ExportService
