// Export utilities for PDF and Excel

export function exportToPDF(data, filename = 'export.pdf') {
  // Simple HTML to PDF using window.print
  const printWindow = window.open('', '_blank')
  const htmlContent = generateHTMLTable(data)
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
          th { background-color: #4CAF50; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          h1 { color: #4CAF50; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `)
  
  printWindow.document.close()
  printWindow.print()
}

export function exportToExcel(data, filename = 'export.xlsx') {
  // Convert data to CSV format
  if (!data || data.length === 0) {
    alert('אין נתונים לייצוא')
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || ''
        // Handle commas and quotes in values
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
    )
  ].join('\n')

  // Add BOM for Hebrew support
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename.replace('.xlsx', '.csv'))
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function generateHTMLTable(data) {
  if (!data || data.length === 0) {
    return '<p>אין נתונים</p>'
  }

  const headers = Object.keys(data[0])
  
  return `
    <h1>דוח משמרות</h1>
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

