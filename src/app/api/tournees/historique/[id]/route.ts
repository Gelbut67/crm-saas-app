import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

// PUT – marquer une visite comme effectuée (ou annuler), ou renommer la tournée
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Vérifier que la tournée appartient à l'utilisateur
    const tournee = await (prisma as any).tournee.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!tournee) return NextResponse.json({ error: 'Tournée introuvable' }, { status: 404 })

    const body = await request.json()

    // Cas 1 : marquer / démarquer une visite spécifique
    if (body.visiteId !== undefined) {
      const { visiteId, visite } = body

      const visiteRecord = await (prisma as any).tourneeVisite.findFirst({
        where: { id: visiteId, tourneeId: params.id },
      })
      if (!visiteRecord) return NextResponse.json({ error: 'Visite introuvable' }, { status: 404 })

      let interactionId = visiteRecord.interactionId

      if (visite && !visiteRecord.visite) {
        // Créer une interaction "visite" sur le client
        const interaction = await prisma.interaction.create({
          data: {
            clientId: visiteRecord.clientId,
            type: 'visite',
            contenu: `Visite lors de la tournée${tournee.nom ? ` "${tournee.nom}"` : ''} du ${new Date(tournee.date).toLocaleDateString('fr-FR')}`,
            date: new Date(tournee.date),
          },
        })
        interactionId = interaction.id
      }

      const updated = await (prisma as any).tourneeVisite.update({
        where: { id: visiteId },
        data: { visite, interactionId: visite ? interactionId : visiteRecord.interactionId },
      })

      return NextResponse.json(updated)
    }

    // Cas 2 : mettre à jour le nom / statut de la tournée
    const { nom, statut } = body
    const updated = await (prisma as any).tournee.update({
      where: { id: params.id },
      data: {
        ...(nom !== undefined && { nom }),
        ...(statut !== undefined && { statut }),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur PUT historique tournée:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE – supprimer une tournée
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const tournee = await (prisma as any).tournee.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!tournee) return NextResponse.json({ error: 'Tournée introuvable' }, { status: 404 })

    await (prisma as any).tournee.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur DELETE historique tournée:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
