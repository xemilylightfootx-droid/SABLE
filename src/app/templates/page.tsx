'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Trash2, Hash, Calendar } from 'lucide-react'
import UploadZone from '@/components/UploadZone'

interface TemplateField { name: string; placeholder: string; pattern: string }
interface Template {
  id: string
  name: string
  description: string | null
  fileName: string
  fileType: string
  fields: string
  createdAt: string
  _count: { fills: number }
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/templates')
    const data = await res.json()
    setTemplates(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const upload = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', file.name.replace(/\.[^.]+$/, ''))
    await fetch('/api/templates', { method: 'POST', body: fd })
    await load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this template?')) return
    await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    setTemplates(t => t.filter(x => x.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Templates</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload contract templates. Use <code className="bg-slate-100 px-1 rounded text-xs">{'{{FIELD}}'}</code>,{' '}
          <code className="bg-slate-100 px-1 rounded text-xs">[FIELD]</code>, or{' '}
          <code className="bg-slate-100 px-1 rounded text-xs">{'<<FIELD>>'}</code> as placeholders.
        </p>
      </div>

      <UploadZone
        accept=".txt,.docx,.pdf,.md"
        hint="Supports .txt, .docx, .pdf"
        onUpload={upload}
      />

      {loading && (
        <div className="grid grid-cols-1 gap-3">
          {[1,2].map(i => <div key={i} className="h-24 bg-white rounded-xl border border-slate-100 animate-pulse" />)}
        </div>
      )}

      {!loading && templates.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <FileText size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-sm text-slate-500">No templates yet. Upload one above.</p>
        </div>
      )}

      <div className="space-y-3">
        {templates.map(t => {
          const fields: TemplateField[] = JSON.parse(t.fields || '[]')
          const isOpen = expanded === t.id
          return (
            <div key={t.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : t.id)}
              >
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{t.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                    <span className="uppercase font-medium bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{t.fileType}</span>
                    <span className="flex items-center gap-1"><Hash size={10} />{fields.length} fields</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />{new Date(t.createdAt).toLocaleDateString()}
                    </span>
                    <span>{t._count.fills} fill{t._count.fills !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); remove(t.id) }}
                  className="p-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {isOpen && fields.length > 0 && (
                <div className="border-t border-slate-50 px-4 pb-4 pt-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Detected fields</p>
                  <div className="flex flex-wrap gap-2">
                    {fields.map(f => (
                      <span key={f.name} className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full font-mono">
                        {f.placeholder}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
