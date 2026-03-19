import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Récupérer un prospect spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prospect = await prisma.client.findUnique({
      where: {
        id: params.id,
        statut: 'prospect'
      },
      include: {
        interactions: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      )
    }

    // Formater pour le frontend
    const formattedProspect = {
      ...prospect,
      dateCreation: prospect.dateCreation.toISOString(),
      interactions: prospect.interactions.map(int => ({
        ...int,
        date: int.date.toISOString()
      }))
    }

    return NextResponse.json(formattedProspect)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du prospect' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un prospect
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Supprimer d'abord les interactions liées
    await prisma.interaction.deleteMany({
      where: {
        clientId: params.id
      }
    })

    // Supprimer le prospect
    await prisma.client.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du prospect' },
      { status: 500 }
    )
  }
}
