import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Désactiver le cache pour cette route
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
        contacts: {
          orderBy: {
            isPrincipal: 'desc'
          }
        },
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
    const formattedClients = clients.map((client: any) => ({
      ...client,
      dateCreation: client.dateCreation.toISOString(),
      contacts: client.contacts?.map((contact: any) => ({
        ...contact,
        dateCreation: contact.dateCreation.toISOString()
      })) || [],
      interactions: client.interactions?.map((int: any) => ({
        ...int,
        date: int.date.toISOString()
      })) || [],
      devis: client.devis?.map((devis: any) => ({
        ...devis,
        dateCreation: devis.dateCreation.toISOString(),
        dateEcheance: devis.dateEcheance.toISOString()
      })) || []
    }))

    return NextResponse.json(formattedClients, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des clients' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau client ou prospect
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validation basique - soit nom soit entreprise doit être fourni
    if (!data.nom && !data.entreprise) {
      return NextResponse.json(
        { error: 'Le nom ou l\'entreprise est obligatoire' },
        { status: 400 }
      )
    }
    
    // Créer le client/prospect
    const client = await prisma.client.create({
      data: {
        nom: data.nom?.trim() || data.entreprise?.trim() || '',
        email: data.email?.trim() || null,
        telephone: data.telephone?.trim() || null,
        telephonePortable: data.telephonePortable?.trim() || null,
        telephoneFixe: data.telephoneFixe?.trim() || null,
        entreprise: data.entreprise?.trim() || null,
        secteur: data.secteur?.trim() || null,
        adresse: data.adresse?.trim() || null,
        codePostal: data.codePostal?.trim() || null,
        ville: data.ville?.trim() || null,
        departement: data.departement?.trim() || null,
        caTotal: parseFloat(data.caTotal) || 0,
        statut: data.statut || 'client',
        dateCreation: new Date(),
      }
    })

    // Créer un contact principal si des informations de contact sont fournies
    if (data.nom || data.email || data.telephonePortable || data.telephoneFixe) {
      await prisma.contact.create({
        data: {
          clientId: client.id,
          nom: data.nom?.trim() || data.entreprise?.trim() || 'Contact principal',
          email: data.email?.trim() || null,
          telephonePortable: data.telephonePortable?.trim() || null,
          telephoneFixe: data.telephoneFixe?.trim() || null,
          isPrincipal: true,
          dateCreation: new Date(),
        }
      })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création: ' + (error instanceof Error ? error.message : 'Erreur inconnue') },
      { status: 500 }
    )
  }
}
