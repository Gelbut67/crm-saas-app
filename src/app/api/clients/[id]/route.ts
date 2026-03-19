import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer un client spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: {
        id: params.id
      },
      include: {
        interactions: {
          orderBy: {
            date: 'desc'
          }
        },
        devis: {
          orderBy: {
            dateCreation: 'desc'
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Formater pour le frontend
    const formattedClient = {
      ...client,
      dateCreation: client.dateCreation.toISOString(),
      interactions: client.interactions.map(int => ({
        ...int,
        date: int.date.toISOString()
      })),
      devis: client.devis.map(devis => ({
        ...devis,
        dateCreation: devis.dateCreation.toISOString(),
        dateEcheance: devis.dateEcheance.toISOString()
      }))
    }

    return NextResponse.json(formattedClient)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du client' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un client
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Supprimer d'abord les interactions et les devis liés
    await prisma.interaction.deleteMany({
      where: {
        clientId: params.id
      }
    })

    await prisma.devis.deleteMany({
      where: {
        clientId: params.id
      }
    })

    // Supprimer le client
    await prisma.client.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du client' },
      { status: 500 }
    )
  }
}
