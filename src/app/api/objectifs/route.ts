import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { getLundiSemaine } from '@/lib/semaine'

export const dynamic = 'force-dynamic'

const clientSelect = {
  id: true,
  nom: true,
  entreprise: true,
  ville: true,
  codePostal: true,
  adresse: true,
  departement: true,
  statut: true,
}

// GET – récupère (ou crée) l'objectif de la semaine demandée, avec report auto des visites non faites
export async function GET(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const weekParam = searchParams.get('week')
    const refDate = weekParam ? new Date(weekParam) : new Date()
    const weekStart = getLundiSemaine(refDate)
    const currentWeekStart = getLundiSemaine(new Date())
    const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime()

    let objectif = await (prisma as any).weeklyObjective.findUnique({
      where: { userId_weekStart: { userId: session.user.id, weekStart } },
      include: { items: { include: { client: { select: clientSelect } }, orderBy: { createdAt: 'asc' } } },
    })

    if (!objectif) {
      objectif = await (prisma as any).weeklyObjective.create({
        data: { userId: session.user.id, weekStart },
        include: { items: { include: { client: { select: clientSelect } } } },
      })
    }

    // Report automatique des visites non faites des semaines précédentes vers la semaine courante
    if (isCurrentWeek) {
      const nonVisitesPrecedentes = await (prisma as any).weeklyObjectiveItem.findMany({
        where: {
          visite: false,
          objective: { userId: session.user.id, weekStart: { lt: weekStart } },
        },
        orderBy: { createdAt: 'asc' },
      })

      const clientsDejaPresents = new Set(objectif.items.map((i: any) => i.clientId))
      const dejaVus = new Set<string>()
      const aReporter = nonVisitesPrecedentes.filter((i: any) => {
        if (clientsDejaPresents.has(i.clientId) || dejaVus.has(i.clientId)) return false
        dejaVus.add(i.clientId)
        return true
      })

      if (aReporter.length > 0) {
        await (prisma as any).weeklyObjectiveItem.createMany({
          data: aReporter.map((i: any) => ({ objectiveId: objectif.id, clientId: i.clientId, reporte: true })),
          skipDuplicates: true,
        })
        objectif = await (prisma as any).weeklyObjective.findUnique({
          where: { id: objectif.id },
          include: { items: { include: { client: { select: clientSelect } }, orderBy: { createdAt: 'asc' } } },
        })
      }
    }

    return NextResponse.json(objectif)
  } catch (error) {
    console.error('Erreur GET objectifs:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST – ajoute un client/prospect à la liste de la semaine courante
export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { clientId } = await request.json()
    if (!clientId) return NextResponse.json({ error: 'clientId requis' }, { status: 400 })

    const weekStart = getLundiSemaine(new Date())

    const objectif = await (prisma as any).weeklyObjective.upsert({
      where: { userId_weekStart: { userId: session.user.id, weekStart } },
      update: {},
      create: { userId: session.user.id, weekStart },
    })

    try {
      const item = await (prisma as any).weeklyObjectiveItem.create({
        data: { objectiveId: objectif.id, clientId },
        include: { client: { select: clientSelect } },
      })
      return NextResponse.json(item)
    } catch {
      return NextResponse.json({ error: 'Cette entreprise est déjà dans la liste de cette semaine' }, { status: 409 })
    }
  } catch (error) {
    console.error('Erreur POST objectifs:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
