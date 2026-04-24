import Link from 'next/link'
import { prisma } from '@/lib/db'
import { FileText, FolderOpen, Wand2, ArrowRight, CheckCircle2, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const [templateCount, docCount, fillCount, recentFills] = await Promise.all([
    prisma.template.count(),
    prisma.sourceDocument.count(),
    prisma.fill.count(),
    prisma.fill.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        template: { select: { name: true } },
        documents: { include: { document: { select: { name: true } } } },
      },
    }),
  ])

  const stats = [
    { label: 'Templates', value: templateCount, icon: FileText, href: '/templates', color: 'bg-violet-50 text-violet-600' },
    { label: 'Source Documents', value: docCount, icon: FolderOpen, href: '/documents', color: 'bg-blue-50 text-blue-600' },
    { label: 'Fills Generated', value: fillCount, icon: Wand2, href: '/fill', color: 'bg-emerald-50 text-emerald-600' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Upload a template, drop in any source document — SABLE fills it with AI.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow group"
          >
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-800">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
            <ArrowRight size={15} className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-gradient-to-br from-navy-800 to-slate-800 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Ready to fill a document?</h2>
          <p className="text-slate-400 text-sm mt-1">
            Select a template and your source material — AI does the rest.
          </p>
        </div>
        <Link
          href="/fill"
          className="shrink-0 bg-blue-500 hover:bg-blue-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Wand2 size={15} /> Fill & Generate
        </Link>
      </div>

      {/* Recent fills */}
      {recentFills.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent fills</h2>
          <div className="space-y-2">
            {recentFills.map(fill => (
              <Link
                key={fill.id}
                href={`/fill/${fill.id}`}
                className="flex items-center gap-4 bg-white border border-slate-100 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow group"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  fill.status === 'complete' ? 'bg-emerald-50' : 'bg-amber-50'
                }`}>
                  {fill.status === 'complete'
                    ? <CheckCircle2 size={15} className="text-emerald-500" />
                    : <Clock size={15} className="text-amber-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{fill.template.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {fill.documents.map(d => d.document.name).join(', ')}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(fill.createdAt).toLocaleDateString()}
                </span>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {fillCount === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <Wand2 size={32} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 text-sm font-medium">No fills yet</p>
          <p className="text-slate-400 text-xs mt-1">
            Upload a template and some source documents to get started.
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <Link href="/templates" className="text-sm text-blue-500 hover:underline">Add a template</Link>
            <span className="text-slate-300">·</span>
            <Link href="/documents" className="text-sm text-blue-500 hover:underline">Add documents</Link>
          </div>
        </div>
      )}
    </div>
  )
}
