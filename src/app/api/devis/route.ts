import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Récupérer tous les devis
export async function GET() {
  try {
    const devis = await prisma.devis.findMany({
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            entreprise: true,
            email: true,
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    // Formater pour le frontend
    const formattedDevis = devis.map(devi => ({
      ...devi,
      dateCreation: devi.dateCreation.toISOString(),
      dateEcheance: devi.dateEcheance.toISOString()
    }))

    return NextResponse.json(formattedDevis)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des devis' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau devis
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const devis = await prisma.devis.create({
      data: {
        ...data,
        dateCreation: new Date(),
        dateEcheance: new Date(data.dateEcheance),
      },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            entreprise: true,
          }
        }
      }
    })

    return NextResponse.json(devis)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du devis' },
      { status: 500 }
    )
  }
}
