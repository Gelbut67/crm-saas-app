import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const dueOnly = searchParams.get('dueOnly') === 'true'
    const includeDone = searchParams.get('includeDone') === 'true'

    const where: any = { userId: session.user.id }
    if (clientId) where.clientId = clientId
    if (!includeDone) where.fait = false
    if (dueOnly) where.echeance = { lte: new Date() }

    const reminders = await (prisma as any).reminder.findMany({
      where,
      orderBy: { echeance: 'asc' },
      include: {
        client: { select: { id: true, nom: true, entreprise: true, statut: true } }
      }
    })

    return NextResponse.json(reminders.map((r: any) => ({ ...r, echeance: r.echeance.toISOString(), dateCreation: r.dateCreation.toISOString() })))
  } catch (error) {
    console.error('Erreur reminders GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const data = await request.json()
    if (!data.titre || !data.echeance) {
      return NextResponse.json({ error: 'Titre et échéance requis' }, { status: 400 })
    }

    const reminder = await (prisma as any).reminder.create({
      data: {
        titre: data.titre.trim(),
        contenu: data.contenu?.trim() || null,
        echeance: new Date(data.echeance),
        clientId: data.clientId || null,
        userId: session.user.id,
      },
      include: {
        client: { select: { id: true, nom: true, entreprise: true, statut: true } }
      }
    })

    return NextResponse.json({ ...reminder, echeance: reminder.echeance.toISOString(), dateCreation: reminder.dateCreation.toISOString() })
  } catch (error) {
    console.error('Erreur reminders POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
