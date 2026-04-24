'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, FolderOpen, Wand2, CheckSquare, Square, Loader2, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Template {
  id: string; name: string; fileType: string; fields: string
  _count: { fills: number }; createdAt: string
}
interface SourceDocument {
  id: string; name: string; fileType: string; createdAt: string
}

export default function FillPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [docs, setDocs] = useState<SourceDocument[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/templates').then(r => r.json()),
      fetch('/api/documents').then(r => r.json()),
    ]).then(([t, d]) => {
      setTemplates(t)
      setDocs(d)
      setLoading(false)
    })
  }, [])

  const toggleDoc = (id: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const run = async () => {
    if (!selectedTemplate || selectedDocs.size === 0) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/fills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          documentIds: Array.from(selectedDocs),
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Fill failed')
      }
      const fill = await res.json()
      router.push(`/fill/${fill.id}`)
    } catch (e) {
      setError((e as Error).message)
      setGenerating(false)
    }
  }

  const selectedTpl = templates.find(t => t.id === selectedTemplate)
  const fieldCount = selectedTpl ? JSON.parse(selectedTpl.fields || '[]').length : 0
  const canRun = selectedTemplate && selectedDocs.size > 0 && !generating

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pt-16 text-center text-slate-400">
        <Loader2 size={24} className="animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Fill & Generate</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pick a template and source documents. SABLE&apos;s AI extracts every field and fills the document automatically.
        </p>
      </div>

      {/* Step 1 – Template */}
      <section className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
          <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-semibold shrink-0">1</span>
          <h2 className="text-sm font-semibold text-slate-700">Select a template</h2>
        </div>

        {templates.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500">No templates yet.</p>
            <Link href="/templates" className="text-sm text-blue-500 hover:underline mt-1 inline-block">
              Upload a template →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {templates.map(t => {
              const fields = JSON.parse(t.fields || '[]')
              const active = selectedTemplate === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(active ? null : t.id)}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                    active ? 'bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-blue-500' : 'bg-violet-50'}`}>
                    <FileText size={15} className={active ? 'text-white' : 'text-violet-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${active ? 'text-blue-700' : 'text-slate-800'}`}>{t.name}</p>
                    <p className="text-xs text-slate-400">{fields.length} fields · {t.fileType.toUpperCase()}</p>
                  </div>
                  {active && <ChevronRight size={14} className="text-blue-400 shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Step 2 – Documents */}
      <section className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
          <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-semibold shrink-0">2</span>
          <h2 className="text-sm font-semibold text-slate-700">Select source documents</h2>
          <span className="ml-auto text-xs text-slate-400">{selectedDocs.size} selected</span>
        </div>

        {docs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500">No source documents yet.</p>
            <Link href="/documents" className="text-sm text-blue-500 hover:underline mt-1 inline-block">
              Upload documents →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {docs.map(doc => {
              const checked = selectedDocs.has(doc.id)
              return (
                <button
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                    checked ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`shrink-0 ${checked ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold uppercase ${
                    checked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {doc.fileType}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${checked ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {doc.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      <FolderOpen size={10} className="inline mr-1" />
                      Added {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Step 3 – Generate */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 p-5">
        <div className="text-sm text-slate-500">
          {canRun
            ? <>Filling <strong className="text-slate-700">{fieldCount} fields</strong> from <strong className="text-slate-700">{selectedDocs.size}</strong> document{selectedDocs.size !== 1 ? 's' : ''}</>
            : 'Select a template and at least one document to continue.'
          }
        </div>
        <button
          onClick={run}
          disabled={!canRun}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {generating
            ? <><Loader2 size={15} className="animate-spin" /> Extracting & filling…</>
            : <><Wand2 size={15} /> Fill with AI</>
          }
        </button>
      </div>
    </div>
  )
}
