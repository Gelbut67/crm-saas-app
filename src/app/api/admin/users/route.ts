import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        dateCreation: true,
        _count: { select: { clients: true } },
      },
      orderBy: { dateCreation: 'asc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
