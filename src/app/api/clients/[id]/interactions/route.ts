import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les interactions d'un client
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const interactions = await prisma.interaction.findMany({
      where: {
        clientId: params.id
      },
      orderBy: {
        date: 'desc'
      }
    })

    const formattedInteractions = interactions.map(interaction => ({
      ...interaction,
      date: interaction.date.toISOString()
    }))

    return NextResponse.json(formattedInteractions)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des interactions' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle interaction
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: params.id }
    })
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Créer l'interaction
    const interaction = await prisma.interaction.create({
      data: {
        clientId: params.id,
        type: data.type,
        contenu: data.contenu,
        date: data.date ? new Date(data.date) : new Date()
      }
    })

    return NextResponse.json({
      ...interaction,
      date: interaction.date.toISOString()
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'interaction' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une interaction
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const interactionId = searchParams.get('interactionId')
    
    if (!interactionId) {
      return NextResponse.json(
        { error: 'ID d\'interaction manquant' },
        { status: 400 }
      )
    }

    await prisma.interaction.delete({
      where: { id: interactionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'interaction' },
      { status: 500 }
    )
  }
}
