import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const fill = await prisma.fill.findUnique({
    where: { id: params.id },
    include: { template: { select: { name: true } } },
  })

  if (!fill || !fill.outputText) {
    return NextResponse.json({ error: 'Output not available' }, { status: 404 })
  }

  const filename = `${fill.template.name.replace(/[^a-zA-Z0-9-_]/g, '_')}_filled.txt`

  return new NextResponse(fill.outputText, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
