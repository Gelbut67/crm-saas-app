import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Fonction pour calculer la distance entre deux points (formule de Haversine simplifiée)
function calculerDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Fonction pour obtenir les coordonnées approximatives d'une ville (simulation)
async function obtenirCoordonnees(codePostal: string, ville: string): Promise<{ lat: number, lon: number }> {
  // Dans une vraie application, utiliser une API de géocodage (Google Maps, OpenStreetMap, etc.)
  // Pour la démo, on génère des coordonnées basées sur le code postal
  const baseLatitude = 48.8566 // Paris comme référence
  const baseLongitude = 2.3522
  
  const offset = parseInt(codePostal.substring(0, 2)) / 100
  return {
    lat: baseLatitude + (offset - 0.5),
    lon: baseLongitude + (offset - 0.5)
  }
}

// Algorithme du plus proche voisin pour optimiser la tournée
function optimiserItineraire(
  clients: any[],
  pointDepart: { lat: number, lon: number }
): any[] {
  const visites: any[] = []
  const clientsRestants = [...clients]
  let positionActuelle = pointDepart

  while (clientsRestants.length > 0) {
    let plusProche = 0
    let distanceMin = Infinity

    // Trouver le client le plus proche
    for (let i = 0; i < clientsRestants.length; i++) {
      const distance = calculerDistance(
        positionActuelle.lat,
        positionActuelle.lon,
        clientsRestants[i].coordonnees.lat,
        clientsRestants[i].coordonnees.lon
      )
      if (distance < distanceMin) {
        distanceMin = distance
        plusProche = i
      }
    }

    const clientChoisi = clientsRestants[plusProche]
    visites.push({
      ...clientChoisi,
      distance: Math.round(distanceMin),
      duree: Math.round(distanceMin * 1.5) // Estimation: 1.5 min par km
    })

    positionActuelle = clientChoisi.coordonnees
    clientsRestants.splice(plusProche, 1)
  }

  return visites
}

export async function POST(request: Request) {
  try {
    const { typeTournee, heureDepart, heureRetour, dureeRdv, departement, ville } = await request.json()

    // Construire les filtres
    const where: any = {}
    
    if (typeTournee === 'client') {
      where.statut = 'client'
    } else if (typeTournee === 'prospect') {
      where.statut = 'prospect'
    }
    // Pour 'mixte', pas de filtre sur le statut

    if (departement && departement !== 'tous') {
      where.departement = departement
    }

    if (ville && ville !== 'toutes') {
      where.ville = ville
    }

    // Récupérer les clients/prospects avec adresse complète
    const clients = await prisma.client.findMany({
      where: {
        ...where,
        AND: [
          { adresse: { not: null } },
          { ville: { not: null } },
          { codePostal: { not: null } }
        ]
      },
      select: {
        id: true,
        nom: true,
        entreprise: true,
        adresse: true,
        ville: true,
        codePostal: true,
        departement: true,
        statut: true
      }
    })

    if (clients.length === 0) {
      return NextResponse.json({
        visites: [],
        stats: {
          nombreVisites: 0,
          distanceTotale: 0,
          dureeTrajet: 0
        }
      })
    }

    // Obtenir les coordonnées pour chaque client
    const clientsAvecCoordonnees = await Promise.all(
      clients.map(async (client) => {
        const coordonnees = await obtenirCoordonnees(client.codePostal!, client.ville!)
        return { ...client, coordonnees }
      })
    )

    // Point de départ (première adresse ou centre approximatif)
    const pointDepart = clientsAvecCoordonnees[0].coordonnees

    // Optimiser l'itinéraire
    const itineraireOptimise = optimiserItineraire(clientsAvecCoordonnees, pointDepart)

    // Calculer les horaires
    const [heureH, minuteH] = heureDepart.split(':').map(Number)
    const [heureR, minuteR] = heureRetour.split(':').map(Number)
    const minutesDisponibles = (heureR * 60 + minuteR) - (heureH * 60 + minuteH)

    let minutesActuelles = heureH * 60 + minuteH
    const visites: any[] = []
    let distanceTotale = 0
    let dureeTrajetTotale = 0

    for (let i = 0; i < itineraireOptimise.length; i++) {
      const client = itineraireOptimise[i]
      
      // Vérifier si on a encore le temps
      const tempsNecessaire = (i > 0 ? client.duree : 0) + dureeRdv
      if (minutesActuelles + tempsNecessaire > heureR * 60 + minuteR) {
        break // Plus de temps disponible
      }

      // Ajouter le temps de trajet
      if (i > 0) {
        minutesActuelles += client.duree
        dureeTrajetTotale += client.duree
      }

      const heureArrivee = `${String(Math.floor(minutesActuelles / 60)).padStart(2, '0')}:${String(minutesActuelles % 60).padStart(2, '0')}`
      minutesActuelles += dureeRdv
      const heureDepart = `${String(Math.floor(minutesActuelles / 60)).padStart(2, '0')}:${String(minutesActuelles % 60).padStart(2, '0')}`

      visites.push({
        client: {
          id: client.id,
          nom: client.nom,
          entreprise: client.entreprise,
          adresse: client.adresse,
          ville: client.ville,
          codePostal: client.codePostal,
          statut: client.statut
        },
        ordre: i + 1,
        heureArrivee,
        heureDepart,
        distance: client.distance || 0,
        duree: client.duree || 0
      })

      distanceTotale += client.distance || 0
    }

    return NextResponse.json({
      visites,
      stats: {
        nombreVisites: visites.length,
        distanceTotale: Math.round(distanceTotale),
        dureeTrajet: dureeTrajetTotale
      }
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'optimisation de la tournée' },
      { status: 500 }
    )
  }
}
