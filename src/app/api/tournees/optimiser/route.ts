import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

// Fonction pour obtenir les coordonnées approximatives basées sur le code postal français
async function obtenirCoordonnees(codePostal: string, ville: string): Promise<{ lat: number, lon: number }> {
  // Coordonnées approximatives des départements français (centres)
  const coordonneesDepartements: { [key: string]: { lat: number, lon: number } } = {
    '01': { lat: 46.2, lon: 5.2 }, '02': { lat: 49.5, lon: 3.4 }, '03': { lat: 46.3, lon: 3.3 },
    '04': { lat: 44.1, lon: 6.2 }, '05': { lat: 44.7, lon: 6.2 }, '06': { lat: 43.7, lon: 7.2 },
    '07': { lat: 44.7, lon: 4.4 }, '08': { lat: 49.7, lon: 4.7 }, '09': { lat: 43.0, lon: 1.5 },
    '10': { lat: 48.3, lon: 4.1 }, '11': { lat: 43.2, lon: 2.4 }, '12': { lat: 44.3, lon: 2.6 },
    '13': { lat: 43.5, lon: 5.0 }, '14': { lat: 49.2, lon: -0.4 }, '15': { lat: 45.0, lon: 2.5 },
    '16': { lat: 45.7, lon: 0.2 }, '17': { lat: 45.7, lon: -0.6 }, '18': { lat: 47.1, lon: 2.4 },
    '19': { lat: 45.3, lon: 1.8 }, '21': { lat: 47.3, lon: 5.0 }, '22': { lat: 48.5, lon: -2.8 },
    '23': { lat: 46.2, lon: 2.0 }, '24': { lat: 45.0, lon: 0.7 }, '25': { lat: 47.2, lon: 6.0 },
    '26': { lat: 44.9, lon: 5.0 }, '27': { lat: 49.1, lon: 1.2 }, '28': { lat: 48.4, lon: 1.5 },
    '29': { lat: 48.2, lon: -4.1 }, '30': { lat: 44.0, lon: 4.1 }, '31': { lat: 43.6, lon: 1.4 },
    '32': { lat: 43.7, lon: 0.6 }, '33': { lat: 44.8, lon: -0.6 }, '34': { lat: 43.6, lon: 3.9 },
    '35': { lat: 48.1, lon: -1.7 }, '36': { lat: 46.8, lon: 1.7 }, '37': { lat: 47.4, lon: 0.7 },
    '38': { lat: 45.2, lon: 5.7 }, '39': { lat: 46.7, lon: 5.6 }, '40': { lat: 43.9, lon: -0.5 },
    '41': { lat: 47.6, lon: 1.3 }, '42': { lat: 45.4, lon: 4.4 }, '43': { lat: 45.0, lon: 3.9 },
    '44': { lat: 47.2, lon: -1.6 }, '45': { lat: 47.9, lon: 2.4 }, '46': { lat: 44.4, lon: 1.4 },
    '47': { lat: 44.2, lon: 0.6 }, '48': { lat: 44.5, lon: 3.5 }, '49': { lat: 47.5, lon: -0.6 },
    '50': { lat: 49.1, lon: -1.3 }, '51': { lat: 49.0, lon: 4.0 }, '52': { lat: 48.1, lon: 5.1 },
    '53': { lat: 48.1, lon: -0.8 }, '54': { lat: 48.7, lon: 6.2 }, '55': { lat: 49.0, lon: 5.4 },
    '56': { lat: 47.7, lon: -2.8 }, '57': { lat: 49.1, lon: 6.2 }, '58': { lat: 47.0, lon: 3.5 },
    '59': { lat: 50.6, lon: 3.1 }, '60': { lat: 49.4, lon: 2.1 }, '61': { lat: 48.7, lon: 0.1 },
    '62': { lat: 50.5, lon: 2.4 }, '63': { lat: 45.8, lon: 3.1 }, '64': { lat: 43.3, lon: -0.4 },
    '65': { lat: 43.2, lon: 0.1 }, '66': { lat: 42.7, lon: 2.9 }, '67': { lat: 48.6, lon: 7.5 },
    '68': { lat: 47.8, lon: 7.2 }, '69': { lat: 45.8, lon: 4.8 }, '70': { lat: 47.6, lon: 6.2 },
    '71': { lat: 46.7, lon: 4.5 }, '72': { lat: 48.0, lon: 0.2 }, '73': { lat: 45.6, lon: 6.4 },
    '74': { lat: 46.0, lon: 6.4 }, '75': { lat: 48.9, lon: 2.3 }, '76': { lat: 49.5, lon: 1.1 },
    '77': { lat: 48.6, lon: 2.9 }, '78': { lat: 48.8, lon: 1.9 }, '79': { lat: 46.3, lon: -0.5 },
    '80': { lat: 49.9, lon: 2.3 }, '81': { lat: 43.9, lon: 2.1 }, '82': { lat: 44.0, lon: 1.4 },
    '83': { lat: 43.4, lon: 6.2 }, '84': { lat: 44.0, lon: 5.1 }, '85': { lat: 46.7, lon: -1.4 },
    '86': { lat: 46.6, lon: 0.3 }, '87': { lat: 45.8, lon: 1.3 }, '88': { lat: 48.2, lon: 6.5 },
    '89': { lat: 47.8, lon: 3.6 }, '90': { lat: 47.6, lon: 6.9 }, '91': { lat: 48.6, lon: 2.3 },
    '92': { lat: 48.9, lon: 2.2 }, '93': { lat: 48.9, lon: 2.4 }, '94': { lat: 48.8, lon: 2.5 },
    '95': { lat: 49.0, lon: 2.1 }
  }
  
  const dept = codePostal.substring(0, 2)
  const coords = coordonneesDepartements[dept] || { lat: 48.8566, lon: 2.3522 }
  
  // Ajouter une petite variation aléatoire pour différencier les villes du même département
  const variation = (parseInt(codePostal.substring(2)) % 100) / 1000
  return {
    lat: coords.lat + (variation - 0.05),
    lon: coords.lon + (variation - 0.05)
  }
}

// Algorithme du plus proche voisin pour optimiser la tournée
function optimiserItineraire(
  clients: any[],
  pointDepart: { lat: number, lon: number },
  clientPrioritaire?: any
): any[] {
  const visites: any[] = []
  let clientsRestants = [...clients]
  let positionActuelle = pointDepart

  // Si un client prioritaire est défini, commencer par lui
  if (clientPrioritaire) {
    const distance = calculerDistance(
      positionActuelle.lat,
      positionActuelle.lon,
      clientPrioritaire.coordonnees.lat,
      clientPrioritaire.coordonnees.lon
    )
    
    visites.push({
      ...clientPrioritaire,
      distance: Math.round(distance * 10) / 10,
      duree: Math.round(distance * 1.2) // 1.2 min par km (vitesse moyenne 50 km/h)
    })
    
    positionActuelle = clientPrioritaire.coordonnees
    clientsRestants = clientsRestants.filter(c => c.id !== clientPrioritaire.id)
  }

  // Optimiser le reste de la tournée
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
      distance: Math.round(distanceMin * 10) / 10,
      duree: Math.round(distanceMin * 1.2) // 1.2 min par km
    })

    positionActuelle = clientChoisi.coordonnees
    clientsRestants.splice(plusProche, 1)
  }

  return visites
}

export async function POST(request: Request) {
  try {
    const { typeTournee, heureDepart, heureRetour, dureeRdv, departement, ville, rdvFixes } = await request.json()

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

    // Séparer les RDV fixes des clients disponibles
    const rdvFixesIds = (rdvFixes || []).map((rdv: any) => rdv.clientId)
    const clientsLibres = clientsAvecCoordonnees.filter(c => !rdvFixesIds.includes(c.id))
    const clientsRdvFixes = rdvFixes ? rdvFixes.map((rdv: any) => {
      const client = clientsAvecCoordonnees.find(c => c.id === rdv.clientId)
      return { ...client, heureRdv: rdv.heureRdv }
    }).filter(Boolean) : []

    // Utiliser OpenAI pour optimiser la tournée
    let itineraireOptimise
    
    if (process.env.OPENAI_API_KEY && clientsLibres.length > 0) {
      try {
        // Préparer les données pour l'IA
        const prompt = `Tu es un expert en optimisation de tournées commerciales. 

CONTRAINTES:
- Heure de départ: ${heureDepart}
- Heure de retour: ${heureRetour}
- Durée moyenne d'un RDV: ${dureeRdv} minutes

RDV FIXES (OBLIGATOIRES À CES HORAIRES):
${clientsRdvFixes.map((c: any, i: number) => `${i + 1}. ${c.nom} (${c.ville}) - RDV FIXÉ À ${c.heureRdv}`).join('\n') || 'Aucun'}

CLIENTS DISPONIBLES (à placer entre les RDV fixes):
${clientsLibres.map((c: any, i: number) => `${i + 1}. ${c.nom} - ${c.ville} (${c.codePostal}) - Coordonnées: ${c.coordonnees.lat.toFixed(4)}, ${c.coordonnees.lon.toFixed(4)}`).join('\n')}

OBJECTIF: Crée un itinéraire optimal qui:
1. RESPECTE ABSOLUMENT les horaires des RDV fixes
2. Insère les clients disponibles entre les RDV fixes pour minimiser les distances
3. Optimise le temps de trajet total
4. Respecte les contraintes horaires (départ/retour)

RÉPONDS UNIQUEMENT avec un JSON contenant un tableau 'itineraire' avec les IDs des clients dans l'ordre optimal, sans explication.
Format: {"itineraire": ["id1", "id2", "id3", ...]}`

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Tu es un expert en optimisation logistique. Tu réponds uniquement en JSON valide, sans markdown ni explication." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })

        const reponse = completion.choices[0].message.content
        const resultat = JSON.parse(reponse!.replace(/```json\n?|```/g, '').trim())
        
        // Reconstruire l'itinéraire avec les distances
        itineraireOptimise = []
        let positionActuelle = clientsAvecCoordonnees[0].coordonnees
        
        for (const clientId of resultat.itineraire) {
          const client = clientsAvecCoordonnees.find(c => c.id === clientId)
          if (client) {
            const distance = calculerDistance(
              positionActuelle.lat,
              positionActuelle.lon,
              client.coordonnees.lat,
              client.coordonnees.lon
            )
            
            itineraireOptimise.push({
              ...client,
              distance: Math.round(distance * 10) / 10,
              duree: Math.round(distance * 1.2),
              heureRdv: clientsRdvFixes.find((c: any) => c.id === clientId)?.heureRdv
            })
            
            positionActuelle = client.coordonnees
          }
        }
      } catch (error) {
        console.error('Erreur OpenAI:', error)
        // Fallback sur l'algorithme classique
        const pointDepart = clientsAvecCoordonnees[0].coordonnees
        itineraireOptimise = optimiserItineraire(clientsAvecCoordonnees, pointDepart)
      }
    } else {
      // Pas d'API OpenAI ou pas de clients libres, utiliser l'algorithme classique
      const pointDepart = clientsAvecCoordonnees[0].coordonnees
      itineraireOptimise = optimiserItineraire(clientsAvecCoordonnees, pointDepart)
    }

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
