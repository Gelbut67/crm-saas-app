import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

// GET - Récupérer un devis spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const devis = await prisma.devis.findUnique({
      where: {
        id: params.id,
      },
      include: {
        client: true,
      },
    })

    if (!devis) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Formater les dates
    const formattedDevis = {
      ...devis,
      dateCreation: devis.dateCreation.toISOString(),
      dateEcheance: devis.dateEcheance.toISOString(),
    }

    return NextResponse.json(formattedDevis)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du devis' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un devis
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const data = await request.json()
    
    // Récupérer l'ancien statut pour calculer le delta du CA
    const ancienDevis = await prisma.devis.findUnique({
      where: { id: params.id },
      include: { client: true }
    })
    
    if (!ancienDevis) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le devis
    const updatedDevis = await prisma.devis.update({
      where: {
        id: params.id,
      },
      data: {
        titre: data.titre,
        montant: data.montant,
        statut: data.statut,
        dateEcheance: new Date(data.dateEcheance),
        description: data.description,
        clientId: data.clientId,
      },
      include: {
        client: true,
      },
    })

    // Si le statut ou le montant a changé, recalculer le CA du client
    if (ancienDevis.statut !== data.statut || ancienDevis.montant !== data.montant || ancienDevis.clientId !== data.clientId) {
      // Recalculer le CA de l'ancien client si nécessaire
      if (ancienDevis.clientId !== data.clientId) {
        const anciensDevis = await prisma.devis.findMany({
          where: { clientId: ancienDevis.clientId }
        })
        
        const caAncienClient = anciensDevis
          .filter(d => d.statut === 'gagne' || d.statut === 'facture')
          .reduce((sum, d) => sum + d.montant, 0)
        
        await prisma.client.update({
          where: { id: ancienDevis.clientId },
          data: { caTotal: caAncienClient }
        })
      }
      
      // Recalculer le CA du nouveau client
      const nouveauxDevis = await prisma.devis.findMany({
        where: { clientId: data.clientId }
      })
      
      const caNouveauClient = nouveauxDevis
        .filter(d => d.statut === 'gagne' || d.statut === 'facture')
        .reduce((sum, d) => sum + d.montant, 0)
      
      await prisma.client.update({
        where: { id: data.clientId },
        data: { caTotal: caNouveauClient }
      })
    }

    // Formater la réponse
    const formattedDevis = {
      ...updatedDevis,
      dateCreation: updatedDevis.dateCreation.toISOString(),
      dateEcheance: updatedDevis.dateEcheance.toISOString(),
    }

    return NextResponse.json(formattedDevis)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du devis' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un devis
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const devis = await prisma.devis.findUnique({
      where: { id: params.id }
    })
    
    if (!devis) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le devis
    await prisma.devis.delete({
      where: { id: params.id }
    })

    // Recalculer le CA du client
    const autresDevis = await prisma.devis.findMany({
      where: { clientId: devis.clientId }
    })
    
    const caTotal = autresDevis
      .filter(d => d.statut === 'gagne' || d.statut === 'facture')
      .reduce((sum, d) => sum + d.montant, 0)
    
    await prisma.client.update({
      where: { id: devis.clientId },
      data: { caTotal }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du devis' },
      { status: 500 }
    )
  }
}
