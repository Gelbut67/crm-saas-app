import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Récupérer tous les clients
    const clients = await prisma.client.findMany({
      include: {
        interactions: true,
        devis: true,
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    // Récupérer tous les devis
    const devis = await prisma.devis.findMany({
      include: {
        client: {
          select: {
            nom: true,
            entreprise: true,
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    // Séparer les clients et prospects (statut = 'prospect')
    const prospects = clients.filter(client => client.statut === 'prospect')
    const clientsActifs = clients.filter(client => client.statut === 'client')

    // Formater les données pour le dashboard
    const formattedClients = clientsActifs.map(client => ({
      id: client.id,
      nomEntreprise: client.entreprise || client.nom,
      secteur: client.secteur,
      caTotal: client.caTotal,
      dateCreation: client.dateCreation,
      contacts: [{
        nom: client.nom,
        email: client.email,
        telephone: client.telephone,
      }]
    }))

    const formattedDevis = devis.map(devis => ({
      id: devis.id,
      titre: devis.titre,
      montant: devis.montant,
      statut: devis.statut,
      dateEcheance: devis.dateEcheance.toISOString(),
      dateCreation: devis.dateCreation.toISOString(),
      client: devis.client
    }))

    const formattedProspects = prospects.map(prospect => ({
      id: prospect.id,
      nomEntreprise: prospect.entreprise || prospect.nom,
      secteur: prospect.secteur,
      dateCreation: prospect.dateCreation,
      contacts: [{
        nom: prospect.nom,
        email: prospect.email,
        telephone: prospect.telephone,
      }]
    }))

    return NextResponse.json({
      clients: formattedClients,
      devis: formattedDevis,
      prospects: formattedProspects,
    })
  } catch (error) {
    console.error('Erreur dashboard:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des données' },
      { status: 500 }
    )
  }
}
