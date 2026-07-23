import { Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { corpusApi } from '../../api/corpusApi'
import { extractErrorMessage } from '../../lib/api'
import type { DocumentOut } from '../../lib/types'

export default function CorpusImportPanel() {
  const [documents, setDocuments] = useState<DocumentOut[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function loadDocuments() {
    setLoading(true)
    corpusApi
      .listDocuments()
      .then((response) => setDocuments(response.data))
      .finally(() => setLoading(false))
  }

  useEffect(loadDocuments, [])

  async function handleFile(file: File) {
    setError(null)
    setMessage(null)
    setImporting(true)
    try {
      const response = await corpusApi.importCorpus(file)
      setMessage(
        `✓ Đã import ${response.data.chunks_created} đoạn từ ${response.data.documents_created} tài liệu mới.`,
      )
      loadDocuments()
    } catch (err) {
      setError(extractErrorMessage(err, 'Import corpus thất bại.'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="card">
      <div className="admin-section-title">Corpus trích dẫn guideline</div>
      <p className="admin-section-subtitle">
        Import file JSON hoặc CSV chứa các đoạn guideline đã chunk hoá (cột tối thiểu:
        doc_title, location_label, content), hoặc import trực tiếp file JSON xuất ra từ pipeline
        xử lý guideline (có cấu trúc chapters/sections lồng nhau) để bác sĩ tìm và chọn khi trích dẫn.
      </p>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="alert alert-success">
          <span>{message}</span>
        </div>
      )}

      <label className="upload-dropzone flex-col items-center gap-2" style={{ display: 'flex' }}>
        <Upload size={20} color="var(--text-secondary)" />
        <span className="text-sm">{importing ? 'Đang import...' : 'Bấm để chọn file .json hoặc .csv'}</span>
        <input
          type="file"
          accept=".json,.csv"
          disabled={importing}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) handleFile(file)
            event.target.value = ''
          }}
        />
      </label>

      <div className="mt-4">
        <div className="field-label-block">Tài liệu đã import ({documents.length})</div>
        {loading ? (
          <div className="form-hint">Đang tải...</div>
        ) : documents.length === 0 ? (
          <div className="form-hint">Chưa có tài liệu nào.</div>
        ) : (
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {documents.map((document) => (
              <li key={document.doc_id} className="text-sm">
                {document.title} {document.publisher ? `· ${document.publisher}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
