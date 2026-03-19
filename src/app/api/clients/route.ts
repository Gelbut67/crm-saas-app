import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Récupérer tous les clients
export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      where: {
        statut: 'client'
      },
      orderBy: {
        dateCreation: 'desc'
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

    // Formater pour le frontend
    const formattedClients = clients.map(client => ({
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
    }))

    return NextResponse.json(formattedClients)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des clients' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau client
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validation basique
    if (!data.nom || data.nom.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom du client est obligatoire' },
        { status: 400 }
      )
    }
    
    const client = await prisma.client.create({
      data: {
        nom: data.nom.trim(),
        email: data.email?.trim() || null,
        telephone: data.telephone?.trim() || null,
        entreprise: data.entreprise?.trim() || null,
        secteur: data.secteur?.trim() || null,
        caTotal: parseFloat(data.caTotal) || 0,
        statut: 'client',
        dateCreation: new Date(),
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du client: ' + (error instanceof Error ? error.message : 'Erreur inconnue') },
      { status: 500 }
    )
  }
}
