'use client';

import { useState } from 'react'
import Link from 'next/link'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setSuccess(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Import Data</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Download Templates</h2>
        <div className="space-x-4">
          <Link 
            href="/templates/weapons.json" 
            className="text-blue-600 hover:underline"
            download
          >
            Download JSON Template
          </Link>
          <Link 
            href="/templates/weapons.csv" 
            className="text-blue-600 hover:underline"
            download
          >
            Download CSV Template
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload File</h2>
        <input
          type="file"
          accept=".json,.csv"
          onChange={handleFileChange}
          className="mb-4"
        />
        <button
          onClick={handleImport}
          disabled={!file || importing}
          className={`px-4 py-2 rounded ${
            !file || importing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {importing ? 'Importing...' : 'Import'}
        </button>
      </div>

      {error && (
        <div className="text-red-600 mb-4">
          Error: {error}
        </div>
      )}

      {success && (
        <div className="text-green-600 mb-4">
          Import completed successfully!
        </div>
      )}
    </div>
  )
} 