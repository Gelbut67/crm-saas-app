import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      contacts: (prospect as any).contacts?.map((contact: any) => ({
        ...contact,
        dateCreation: contact.dateCreation.toISOString()
      })) || [],
      interactions: (prospect as any).interactions?.map((int: any) => ({
        ...int,
        date: int.date.toISOString()
      })) || [],
      devis: (prospect as any).devis?.map((devis: any) => ({
        ...devis,
        dateCreation: devis.dateCreation.toISOString(),
        dateEcheance: devis.dateEcheance.toISOString()
      })) || []
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

// PUT - Mettre à jour un prospect
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    const prospect = await prisma.client.update({
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

    return NextResponse.json(prospect)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du prospect' },
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
