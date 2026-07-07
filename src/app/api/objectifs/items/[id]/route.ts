import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

// PUT – marquer / démarquer une visite comme effectuée
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const item = await (prisma as any).weeklyObjectiveItem.findFirst({
      where: { id: params.id, objective: { userId: session.user.id } },
      include: { objective: true, client: { select: { nom: true, entreprise: true } } },
    })
    if (!item) return NextResponse.json({ error: 'Élément introuvable' }, { status: 404 })

    const { visite } = await request.json()

    let interactionId = item.interactionId

    if (visite && !item.visite) {
      if (!interactionId) {
        const interaction = await prisma.interaction.create({
          data: {
            clientId: item.clientId,
            type: 'visite',
            contenu: `Visite effectuée dans le cadre de l'objectif hebdomadaire (semaine du ${new Date(item.objective.weekStart).toLocaleDateString('fr-FR')})`,
          },
        })
        interactionId = interaction.id
      }
    }

    const updated = await (prisma as any).weeklyObjectiveItem.update({
      where: { id: params.id },
      data: {
        visite: !!visite,
        visitedAt: visite ? new Date() : null,
        interactionId: visite ? interactionId : item.interactionId,
      },
      include: { client: { select: { id: true, nom: true, entreprise: true, ville: true, codePostal: true, adresse: true, departement: true, statut: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur PUT objectif item:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE – retirer une entreprise de la liste de la semaine
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const item = await (prisma as any).weeklyObjectiveItem.findFirst({
      where: { id: params.id, objective: { userId: session.user.id } },
    })
    if (!item) return NextResponse.json({ error: 'Élément introuvable' }, { status: 404 })

    await (prisma as any).weeklyObjectiveItem.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur DELETE objectif item:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
