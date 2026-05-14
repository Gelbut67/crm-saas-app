import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

// Désactiver le cache pour cette route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Récupérer tous les devis
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const devis = await prisma.devis.findMany({
      where: { client: { userId: session.user.id } },
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

    return NextResponse.json(formattedDevis, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
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
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

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
