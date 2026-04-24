'use client'

import { useState, useEffect, useCallback } from 'react'
import { FolderOpen, Trash2, Calendar, Eye, EyeOff } from 'lucide-react'
import UploadZone from '@/components/UploadZone'

interface SourceDocument {
  id: string
  name: string
  fileName: string
  fileType: string
  content: string
  createdAt: string
}

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf:   'bg-red-50 text-red-600',
  docx:  'bg-blue-50 text-blue-600',
  txt:   'bg-slate-100 text-slate-600',
  md:    'bg-slate-100 text-slate-600',
  eml:   'bg-amber-50 text-amber-600',
  email: 'bg-amber-50 text-amber-600',
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<SourceDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [previewing, setPreviewing] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/documents')
    const data = await res.json()
    setDocs(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const upload = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', file.name.replace(/\.[^.]+$/, ''))
    await fetch('/api/documents', { method: 'POST', body: fd })
    await load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this document?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    setDocs(d => d.filter(x => x.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Source Documents</h1>
        <p className="text-slate-500 text-sm mt-1">
          Emails, questionnaires, existing contracts, notes — anything SABLE can read and extract from.
        </p>
      </div>

      <UploadZone
        accept=".txt,.docx,.pdf,.md,.eml"
        hint="Supports .pdf, .docx, .txt, .eml and more"
        onUpload={upload}
      />

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse" />)}
        </div>
      )}

      {!loading && docs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <FolderOpen size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-sm text-slate-500">No source documents yet. Upload some above.</p>
        </div>
      )}

      <div className="space-y-3">
        {docs.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold uppercase ${FILE_TYPE_COLORS[doc.fileType] ?? 'bg-slate-100 text-slate-500'}`}>
                {doc.fileType}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{doc.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />{new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                  <span>{doc.content.length.toLocaleString()} chars extracted</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewing(previewing === doc.id ? null : doc.id)}
                  className="p-2 rounded-lg text-slate-300 hover:text-blue-400 hover:bg-blue-50 transition-colors"
                  title="Preview extracted text"
                >
                  {previewing === doc.id ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={() => remove(doc.id)}
                  className="p-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {previewing === doc.id && (
              <div className="border-t border-slate-50 px-4 pb-4 pt-3">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Extracted text preview</p>
                <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap font-mono leading-relaxed">
                  {doc.content.slice(0, 1500)}{doc.content.length > 1500 ? '\n…' : ''}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
