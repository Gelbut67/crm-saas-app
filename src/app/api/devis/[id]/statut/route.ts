import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { statut } = await request.json()
    
    if (!['en_cours', 'gagne', 'perdu', 'facture'].includes(statut)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    // Récupérer le devis actuel
    const devis = await prisma.devis.findUnique({
      where: { id: params.id },
      include: { client: true }
    })

    if (!devis) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le statut du devis
    const updatedDevis = await prisma.devis.update({
      where: { id: params.id },
      data: { statut }
    })

    // Calculer le nouveau CA du client
    const allDevis = await prisma.devis.findMany({
      where: { clientId: devis.clientId }
    })

    const caTotal = allDevis
      .filter(d => d.statut === 'gagne' || d.statut === 'facture')
      .reduce((sum, d) => sum + d.montant, 0)

    // Mettre à jour le CA du client
    await prisma.client.update({
      where: { id: devis.clientId },
      data: { caTotal }
    })

    return NextResponse.json({
      success: true,
      devis: updatedDevis,
      nouveauCA: caTotal
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    )
  }
}
