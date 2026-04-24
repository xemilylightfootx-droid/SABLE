import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractFieldsFromDocuments } from '@/lib/ai'
import { fillTemplate } from '@/lib/parsers'

export async function GET() {
  const fills = await prisma.fill.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { id: true, name: true, fileType: true } },
      documents: {
        include: { document: { select: { id: true, name: true, fileType: true } } },
      },
    },
  })
  return NextResponse.json(fills)
}

export async function POST(req: NextRequest) {
  const { templateId, documentIds } = (await req.json()) as {
    templateId: string
    documentIds: string[]
  }

  if (!templateId || !documentIds?.length) {
    return NextResponse.json(
      { error: 'templateId and documentIds are required' },
      { status: 400 }
    )
  }

  const template = await prisma.template.findUnique({ where: { id: templateId } })
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const sourceDocs = await prisma.sourceDocument.findMany({
    where: { id: { in: documentIds } },
  })
  if (!sourceDocs.length) {
    return NextResponse.json({ error: 'No source documents found' }, { status: 404 })
  }

  // Create the fill record in "processing" state
  const fill = await prisma.fill.create({
    data: {
      templateId,
      status: 'processing',
      documents: {
        create: sourceDocs.map(d => ({ documentId: d.id })),
      },
    },
  })

  // Run AI extraction
  let fieldValues: Record<string, unknown> = {}
  let outputText: string | null = null

  try {
    const templateFields = JSON.parse(template.fields) as Array<{
      name: string
      placeholder: string
      pattern: string
    }>

    const extraction = await extractFieldsFromDocuments(
      templateFields,
      sourceDocs.map(d => ({ name: d.name, content: d.content, fileType: d.fileType }))
    )

    fieldValues = extraction.fields

    // Build filled text immediately — no review step
    const fillMap: Record<string, string> = {}
    for (const [key, val] of Object.entries(extraction.fields)) {
      if (val.value) fillMap[key] = val.value
    }
    outputText = fillTemplate(template.content, fillMap)

    await prisma.fill.update({
      where: { id: fill.id },
      data: {
        status: 'complete',
        fieldValues: JSON.stringify(fieldValues),
        outputText,
      },
    })
  } catch (err) {
    await prisma.fill.update({
      where: { id: fill.id },
      data: { status: 'error' },
    })
    console.error('AI extraction error:', err)
    return NextResponse.json({ error: 'AI extraction failed' }, { status: 500 })
  }

  const result = await prisma.fill.findUnique({
    where: { id: fill.id },
    include: {
      template: { select: { id: true, name: true } },
      documents: {
        include: { document: { select: { id: true, name: true } } },
      },
    },
  })

  return NextResponse.json(result, { status: 201 })
}
