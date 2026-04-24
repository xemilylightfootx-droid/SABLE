import fs from 'fs/promises'
import path from 'path'

export interface TemplateField {
  name: string
  placeholder: string
  pattern: string
}

const FIELD_PATTERNS = [
  { id: 'double-curly', regex: /\{\{([^}]{1,80})\}\}/g, wrap: (s: string) => `{{${s}}}` },
  { id: 'angle',        regex: /<<([^>]{1,80})>>/g,     wrap: (s: string) => `<<${s}>>` },
  { id: 'square',       regex: /\[([A-Z][A-Z0-9 _/-]{1,60})\]/g, wrap: (s: string) => `[${s}]` },
  { id: 'single-curly', regex: /\{([A-Z][A-Z0-9 _/-]{1,60})\}/g, wrap: (s: string) => `{${s}}` },
]

export function detectTemplateFields(content: string): TemplateField[] {
  const seen = new Map<string, TemplateField>()

  for (const { id, regex, wrap } of FIELD_PATTERNS) {
    const re = new RegExp(regex.source, 'g')
    let match: RegExpExecArray | null
    while ((match = re.exec(content)) !== null) {
      const raw = match[1].trim()
      const key = raw.toUpperCase().replace(/\s+/g, '_')
      if (!seen.has(key)) {
        seen.set(key, { name: key, placeholder: wrap(raw), pattern: id })
      }
    }
  }

  return Array.from(seen.values())
}

export function fillTemplate(
  content: string,
  fieldValues: Record<string, string>
): string {
  let filled = content

  for (const { regex, wrap } of FIELD_PATTERNS) {
    const re = new RegExp(regex.source, 'g')
    filled = filled.replace(re, (_match, raw) => {
      const key = raw.trim().toUpperCase().replace(/\s+/g, '_')
      return fieldValues[key] ?? wrap(raw.trim())
    })
  }

  return filled
}

export async function extractText(filePath: string, fileType: string): Promise<string> {
  const buffer = await fs.readFile(filePath)
  const ext = fileType.toLowerCase()

  if (['txt', 'md', 'text', 'eml', 'email'].includes(ext)) {
    return buffer.toString('utf-8')
  }

  if (ext === 'pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    return data.text as string
  }

  if (ext === 'docx') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value as string
  }

  return buffer.toString('utf-8')
}

export function getFileType(fileName: string): string {
  return path.extname(fileName).toLowerCase().replace('.', '') || 'txt'
}

export function getUploadsDir(): string {
  return path.join(process.cwd(), 'uploads')
}

export async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(getUploadsDir(), { recursive: true })
}
