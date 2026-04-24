'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, Download, ArrowLeft,
  FileText, FolderOpen, Loader2, ChevronDown, ChevronUp, Info
} from 'lucide-react'
import clsx from 'clsx'

interface ExtractedField {
  value: string | null
  confidence: number
  source: string
  reasoning: string
}

interface Fill {
  id: string
  status: string
  fieldValues: string
  outputText: string | null
  createdAt: string
  template: {
    id: string
    name: string
    fileType: string
    fields: string
    content: string
  }
  documents: Array<{
    document: { id: string; name: string; fileType: string }
  }>
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.8 ? 'bg-emerald-100 text-emerald-700' :
                value >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {pct}%
    </span>
  )
}

export default function FillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [fill, setFill] = useState<Fill | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showOutput, setShowOutput] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/fills/${id}`)
    if (res.ok) setFill(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center pt-24 text-slate-400">
        <Loader2 size={28} className="animate-spin mb-3" />
        <p className="text-sm">Loading fill result…</p>
      </div>
    )
  }

  if (!fill) {
    return (
      <div className="max-w-2xl mx-auto pt-16 text-center">
        <XCircle size={32} className="mx-auto text-red-300 mb-3" />
        <p className="text-slate-600 font-medium">Fill not found</p>
        <Link href="/fill" className="text-sm text-blue-500 hover:underline mt-2 inline-block">
          ← Back to Fill & Generate
        </Link>
      </div>
    )
  }

  const fieldValues: Record<string, ExtractedField> = (() => {
    try { return JSON.parse(fill.fieldValues) } catch { return {} }
  })()

  const templateFields: Array<{ name: string; placeholder: string; pattern: string }> = (() => {
    try { return JSON.parse(fill.template.fields) } catch { return [] }
  })()

  const filledCount = Object.values(fieldValues).filter(f => f?.value).length
  const totalCount = templateFields.length
  const avgConfidence = Object.values(fieldValues).length
    ? Object.values(fieldValues).reduce((s, f) => s + (f?.confidence ?? 0), 0) / Object.values(fieldValues).length
    : 0

  const toggleExpand = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/fill"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-800">{fill.template.name}</h1>
          <p className="text-sm text-slate-500">
            Generated {new Date(fill.createdAt).toLocaleString()}
          </p>
        </div>
        <div className={clsx(
          'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full',
          fill.status === 'complete' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
        )}>
          {fill.status === 'complete'
            ? <><CheckCircle2 size={14} /> Complete</>
            : <><XCircle size={14} /> Error</>
          }
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Fields filled', value: `${filledCount} / ${totalCount}`, sub: 'from source docs' },
          { label: 'Avg confidence', value: `${Math.round(avgConfidence * 100)}%`, sub: 'across all fields' },
          { label: 'Sources used', value: fill.documents.length, sub: `document${fill.documents.length !== 1 ? 's' : ''}` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-2xl font-semibold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Sources */}
      <div className="bg-white rounded-xl border border-slate-100 px-5 py-4">
        <p className="text-xs font-semibold text-slate-400 uppercase mb-2.5">Source documents</p>
        <div className="flex flex-wrap gap-2">
          {fill.documents.map(({ document: doc }) => (
            <span key={doc.id} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
              <FolderOpen size={11} /> {doc.name}
            </span>
          ))}
        </div>
      </div>

      {/* Field breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-slate-700">Extracted fields</h2>
          <button
            onClick={() => setExpanded(
              expanded.size === templateFields.length
                ? new Set()
                : new Set(templateFields.map(f => f.name))
            )}
            className="text-xs text-blue-500 hover:underline"
          >
            {expanded.size === templateFields.length ? 'Collapse all' : 'Expand all'}
          </button>
        </div>

        {templateFields.map(field => {
          const extracted = fieldValues[field.name]
          const hasValue = extracted?.value != null
          const isOpen = expanded.has(field.name)

          return (
            <div key={field.name} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <button
                onClick={() => toggleExpand(field.name)}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-slate-50/50 transition-colors"
              >
                <div className={clsx(
                  'w-2 h-2 rounded-full shrink-0',
                  hasValue
                    ? extracted.confidence >= 0.8 ? 'bg-emerald-400'
                      : extracted.confidence >= 0.5 ? 'bg-amber-400' : 'bg-red-400'
                    : 'bg-slate-200'
                )} />
                <code className="text-xs font-mono text-slate-500 shrink-0 w-48 truncate">{field.placeholder}</code>
                <p className={clsx(
                  'flex-1 text-sm truncate',
                  hasValue ? 'text-slate-800 font-medium' : 'text-slate-400 italic'
                )}>
                  {hasValue ? extracted.value : 'Not found'}
                </p>
                {hasValue && <ConfidenceBadge value={extracted.confidence} />}
                <div className="text-slate-300 ml-1">
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {isOpen && extracted && (
                <div className="border-t border-slate-50 px-5 py-3 bg-slate-50/40 space-y-2">
                  <div className="flex items-start gap-1.5 text-xs text-slate-500">
                    <FolderOpen size={12} className="mt-0.5 shrink-0 text-blue-400" />
                    <span><strong>Source:</strong> {extracted.source}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-slate-500">
                    <Info size={12} className="mt-0.5 shrink-0 text-slate-400" />
                    <span>{extracted.reasoning}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Output preview + download */}
      {fill.outputText && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700">Filled document</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOutput(!showOutput)}
                className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                {showOutput ? 'Hide preview' : 'Show preview'}
              </button>
              <a
                href={`/api/fills/${fill.id}/generate`}
                download
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download size={12} /> Download
              </a>
            </div>
          </div>

          {showOutput && (
            <div className="p-5">
              <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-4 overflow-auto max-h-96 whitespace-pre-wrap font-mono leading-relaxed border border-slate-100">
                {fill.outputText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
