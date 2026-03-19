import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    
    // Validation basique
    if (!data.nom || data.nom.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom du prospect est obligatoire' },
        { status: 400 }
      )
    }
    
    const prospect = await prisma.client.create({
      data: {
        nom: data.nom.trim(),
        email: data.email?.trim() || null,
        telephone: data.telephone?.trim() || null,
        entreprise: data.entreprise?.trim() || null,
        secteur: data.secteur?.trim() || null,
        statut: 'prospect',
        dateCreation: new Date(),
      }
    })

    return NextResponse.json(prospect)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du prospect: ' + (error instanceof Error ? error.message : 'Erreur inconnue') },
      { status: 500 }
    )
  }
}
