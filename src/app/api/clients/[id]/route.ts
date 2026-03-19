import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
