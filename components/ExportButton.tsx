'use client'

interface ExportButtonProps {
  markdown: string
}

export default function ExportButton({ markdown }: ExportButtonProps) {
  function handleExport() {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'GROUNDWORK.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-900/20"
    >
      Download GROUNDWORK.md
    </button>
  )
}
