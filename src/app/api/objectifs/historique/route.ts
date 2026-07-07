import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { getLundiSemaine } from '@/lib/semaine'

export const dynamic = 'force-dynamic'

// GET – historique des semaines précédentes (hors semaine courante)
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const weekStart = getLundiSemaine(new Date())

    const semaines = await (prisma as any).weeklyObjective.findMany({
      where: { userId: session.user.id, weekStart: { lt: weekStart } },
      orderBy: { weekStart: 'desc' },
      include: {
        items: {
          include: {
            client: { select: { id: true, nom: true, entreprise: true, ville: true, statut: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json(semaines)
  } catch (error) {
    console.error('Erreur GET historique objectifs:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
