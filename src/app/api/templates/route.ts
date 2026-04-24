import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/db'
import { detectTemplateFields, extractText, getFileType, ensureUploadsDir, getUploadsDir } from '@/lib/parsers'

export async function GET() {
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      fileName: true,
      fileType: true,
      fields: true,
      createdAt: true,
      _count: { select: { fills: true } },
    },
  })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  await ensureUploadsDir()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const name = formData.get('name') as string | null
  const description = formData.get('description') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const fileType = getFileType(file.name)
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const filePath = path.join(getUploadsDir(), safeName)

  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)

  let content = ''
  try {
    content = await extractText(filePath, fileType)
  } catch {
    content = ''
  }

  const fields = detectTemplateFields(content)

  const template = await prisma.template.create({
    data: {
      name: name || file.name,
      description: description || null,
      fileName: file.name,
      filePath,
      fileType,
      fields: JSON.stringify(fields),
      content,
    },
  })

  return NextResponse.json(template, { status: 201 })
}
