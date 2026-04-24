'use client'

import { useRef, useState, DragEvent, ChangeEvent } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface UploadZoneProps {
  accept?: string
  hint?: string
  onUpload: (file: File) => Promise<void>
}

export default function UploadZone({ accept, hint, onUpload }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lastFile, setLastFile] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handle = async (file: File) => {
    setUploading(true)
    setLastFile(file.name)
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handle(file)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handle(file)
    e.target.value = ''
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={clsx(
        'relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all select-none',
        dragging
          ? 'border-blue-400 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onChange}
        disabled={uploading}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-sm font-medium">Uploading {lastFile}…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <Upload size={22} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">
              Drop a file here, or <span className="text-blue-500">browse</span>
            </p>
            {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
          </div>
          {lastFile && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <FileText size={11} /> {lastFile} uploaded
            </div>
          )}
        </div>
      )}
    </div>
  )
}
