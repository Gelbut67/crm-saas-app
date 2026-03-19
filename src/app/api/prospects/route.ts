import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Récupérer tous les prospects
export async function GET() {
  try {
    const prospects = await prisma.client.findMany({
      where: {
        statut: 'prospect'
      },
      orderBy: {
        dateCreation: 'desc'
      },
      include: {
        interactions: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    // Formater pour le frontend
    const formattedProspects = prospects.map(prospect => ({
      ...prospect,
      dateCreation: prospect.dateCreation.toISOString(),
      interactions: prospect.interactions.map(int => ({
        ...int,
        date: int.date.toISOString()
      }))
    }))

    return NextResponse.json(formattedProspects)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des prospects' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau prospect
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const prospect = await prisma.client.create({
      data: {
        ...data,
        statut: 'prospect',
        dateCreation: new Date(),
      }
    })

    return NextResponse.json(prospect)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du prospect' },
      { status: 500 }
    )
  }
}
