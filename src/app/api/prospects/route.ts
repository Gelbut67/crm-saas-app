import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Désactiver le cache pour cette route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Récupérer tous les prospects
export async function GET() {
  try {
    console.log('API Prospects GET - Début de la requête')
    
    // Test de connexion à la DB
    await prisma.$connect()
    console.log('API Prospects GET - Connecté à la DB')
    
    const prospects = await prisma.client.findMany({
      where: {
        statut: 'prospect'
      },
      orderBy: {
        dateCreation: 'desc'
      },
      include: {
        contacts: {
          orderBy: {
            isPrincipal: 'desc'
          }
        },
        interactions: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    })
    
    console.log(`API Prospects GET - ${prospects.length} prospects trouvés`)

    // Formater pour le frontend
    const formattedProspects = prospects.map((prospect: any) => ({
      ...prospect,
      dateCreation: prospect.dateCreation.toISOString(),
      contacts: prospect.contacts?.map((contact: any) => ({
        ...contact,
        dateCreation: contact.dateCreation.toISOString()
      })) || [],
      interactions: prospect.interactions?.map((int: any) => ({
        ...int,
        date: int.date.toISOString()
      })) || []
    }))

    return NextResponse.json(formattedProspects, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('API Prospects GET - Erreur détaillée:', error)
    
    if (error instanceof Error) {
      console.error('API Prospects GET - Message:', error.message)
      console.error('API Prospects GET - Stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des prospects',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Créer un nouveau prospect
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validation basique
    if (!data.entreprise || data.entreprise.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom de l\'entreprise est obligatoire' },
        { status: 400 }
      )
    }
    
    const prospect = await prisma.client.create({
      data: {
        nom: data.entreprise.trim(),
        email: data.email?.trim() || null,
        telephone: data.telephone?.trim() || null,
        entreprise: data.entreprise?.trim() || null,
        secteur: data.secteur?.trim() || null,
        adresse: data.adresse?.trim() || null,
        codePostal: data.codePostal?.trim() || null,
        ville: data.ville?.trim() || null,
        departement: data.departement?.trim() || null,
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
