import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET – liste des tournées sauvegardées
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const tournees = await (prisma as any).tournee.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      include: {
        visites: {
          orderBy: { ordre: 'asc' },
          include: {
            client: {
              select: {
                id: true,
                nom: true,
                entreprise: true,
                ville: true,
                codePostal: true,
                statut: true,
                interactions: {
                  where: { type: 'visite' },
                  select: { id: true, date: true },
                  orderBy: { date: 'desc' },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(tournees)
  } catch (error) {
    console.error('Erreur GET historique tournées:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST – sauvegarder une nouvelle tournée
export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { nom, date, visites } = await request.json()
    // visites: Array<{ clientId, ordre, heureArrivee, heureDepart }>

    const tournee = await (prisma as any).tournee.create({
      data: {
        nom: nom || null,
        date: date ? new Date(date) : new Date(),
        userId: session.user.id,
        statut: 'planifiee',
        visites: {
          create: visites.map((v: any) => ({
            clientId: v.clientId,
            ordre: v.ordre,
            heureArrivee: v.heureArrivee || null,
            heureDepart: v.heureDepart || null,
            visite: false,
          })),
        },
      },
      include: {
        visites: { orderBy: { ordre: 'asc' } },
      },
    })

    return NextResponse.json(tournee)
  } catch (error) {
    console.error('Erreur POST historique tournées:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
