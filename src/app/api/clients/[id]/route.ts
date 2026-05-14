import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

// GET - Récupérer un client spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const client = await prisma.client.findUnique({
      where: {
        id: params.id
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

    if (!client || client.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Formater pour le frontend
    const formattedClient = {
      ...client,
      dateCreation: client.dateCreation.toISOString(),
      contacts: (client as any).contacts?.map((contact: any) => ({
        ...contact,
        dateCreation: contact.dateCreation.toISOString()
      })) || [],
      interactions: (client as any).interactions?.map((int: any) => ({
        ...int,
        date: int.date.toISOString()
      })) || [],
      devis: (client as any).devis?.map((devis: any) => ({
        ...devis,
        dateCreation: devis.dateCreation.toISOString(),
        dateEcheance: devis.dateEcheance.toISOString()
      })) || []
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

// PUT - Mettre à jour un client
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const data = await request.json()
    
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        entreprise: data.entreprise?.trim() || null,
        secteur: data.secteur?.trim() || null,
        adresse: data.adresse?.trim() || null,
        codePostal: data.codePostal?.trim() || null,
        ville: data.ville?.trim() || null,
        departement: data.departement?.trim() || null,
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du client' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un client
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Supprimer d'abord les interactions et les devis liés
    await prisma.interaction.deleteMany({
      where: {
        clientId: params.id
      }
    })

    await prisma.devis.deleteMany({
      where: {
        clientId: params.id
      }
    })

    // Supprimer le client
    await prisma.client.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du client' },
      { status: 500 }
    )
  }
}
