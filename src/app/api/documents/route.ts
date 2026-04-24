import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/db'
import { extractText, getFileType, ensureUploadsDir, getUploadsDir } from '@/lib/parsers'

export async function GET() {
  const documents = await prisma.sourceDocument.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      fileName: true,
      fileType: true,
      content: true,
      createdAt: true,
    },
  })
  return NextResponse.json(documents)
}

export async function POST(req: NextRequest) {
  await ensureUploadsDir()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const name = formData.get('name') as string | null

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

  const document = await prisma.sourceDocument.create({
    data: {
      name: name || file.name,
      fileName: file.name,
      filePath,
      fileType,
      content,
    },
  })

  return NextResponse.json(document, { status: 201 })
}
