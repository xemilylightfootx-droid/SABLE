import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const fill = await prisma.fill.findUnique({
    where: { id: params.id },
    include: {
      template: true,
      documents: {
        include: { document: { select: { id: true, name: true, fileType: true } } },
      },
    },
  })
  if (!fill) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(fill)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.fill.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
