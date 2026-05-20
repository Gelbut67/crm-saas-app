import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAuthSession } from '@/lib/auth'

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

// Fonction pour calculer la distance entre deux points (formule de Haversine - à vol d'oiseau)
function calculerDistanceVolOiseau(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Cache pour les calculs de distance en voiture
const routeCache = new Map<string, { distance: number, duration: number, geometry?: any }>()

// Fonction pour calculer la distance et durée réelles en voiture avec OSRM (gratuite)
async function calculerDistanceVoiture(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): Promise<{ distance: number, duration: number, geometry?: any }> {
  const cacheKey = `${lat1.toFixed(4)},${lon1.toFixed(4)}-${lat2.toFixed(4)},${lon2.toFixed(4)}`
  
  // Vérifier le cache
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!
  }
  
  try {
    // Utiliser l'API OSRM avec géométrie complète
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`
    const response = await fetch(url)
    
    if (response.ok) {
      const data = await response.json()
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const result = {
          distance: route.distance / 1000, // Convertir mètres en km
          duration: Math.round(route.duration / 60), // Convertir secondes en minutes
          geometry: route.geometry // GeoJSON de la route
        }
        routeCache.set(cacheKey, result)
        return result
      }
    }
  } catch (error) {
    console.error('Erreur calcul distance OSRM:', error)
  }
  
  // Fallback : estimation basée sur la distance à vol d'oiseau
  const distanceVolOiseau = calculerDistanceVolOiseau(lat1, lon1, lat2, lon2)
  return {
    distance: distanceVolOiseau * 1.3, // Facteur de correction pour routes
    duration: Math.round(distanceVolOiseau * 1.5) // ~50 km/h en moyenne
  }
}

// Cache pour éviter de refaire les mêmes requêtes de géocodage
const geocodeCache = new Map<string, { lat: number, lon: number }>()

// Throttle global pour Nominatim : max 1 req/seconde
let dernierAppelNominatim = 0
async function attendreNominatim() {
  const now = Date.now()
  const delai = Math.max(0, 1100 - (now - dernierAppelNominatim))
  if (delai > 0) await new Promise(resolve => setTimeout(resolve, delai))
  dernierAppelNominatim = Date.now()
}

// Fonction pour obtenir les coordonnées exactes via l'API Nominatim (OpenStreetMap)
async function obtenirCoordonnees(codePostal: string, ville: string, adresse?: string): Promise<{ lat: number, lon: number }> {
  const cacheKey = `${adresse || ''}-${codePostal}-${ville}`
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey)!

  const headers = { 'User-Agent': 'CRM-SaaS-App/1.0 contact@crm-app.fr' }

  // 1ère tentative : adresse complète (rue + code postal + ville)
  if (adresse) {
    try {
      await attendreNominatim()
      const query = encodeURIComponent(`${adresse}, ${codePostal} ${ville}, France`)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=fr`,
        { headers }
      )
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
          geocodeCache.set(cacheKey, coords)
          console.log(`Géocodage adresse complète OK: ${adresse}, ${codePostal} ${ville}`)
          return coords
        }
      }
    } catch (error) {
      console.error(`Erreur géocodage adresse complète pour ${adresse}:`, error)
    }
  }

  // 2ème tentative fallback : ville + code postal uniquement
  const cacheKeyVille = `${codePostal}-${ville}`
  if (geocodeCache.has(cacheKeyVille)) {
    const coords = geocodeCache.get(cacheKeyVille)!
    geocodeCache.set(cacheKey, coords)
    return coords
  }

  try {
    await attendreNominatim()
    const query = encodeURIComponent(`${ville}, ${codePostal}, France`)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=fr`,
      { headers }
    )
    if (response.ok) {
      const data = await response.json()
      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
        geocodeCache.set(cacheKeyVille, coords)
        geocodeCache.set(cacheKey, coords)
        console.log(`Géocodage ville OK: ${ville} (${codePostal})`)
        return coords
      }
    }
  } catch (error) {
    console.error(`Erreur géocodage pour ${ville}:`, error)
  }
  
  // Fallback : Coordonnées approximatives des départements français (centres)
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

// Récupère la matrice de durées via l'API OSRM Table (1 seul appel réseau)
async function obtenirMatriceDistances(points: { lat: number, lon: number }[]): Promise<number[][]> {
  try {
    const coords = points.map(p => `${p.lon},${p.lat}`).join(';')
    const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=duration`
    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()
      if (data.code === 'Ok' && data.durations) {
        // Convertir secondes → minutes
        return data.durations.map((row: number[]) => row.map((v: number) => Math.round(v / 60)))
      }
    }
  } catch (error) {
    console.error('Erreur OSRM Table:', error)
  }
  // Fallback : matrice via Haversine
  return points.map((a, i) => points.map((b, j) => {
    if (i === j) return 0
    const d = calculerDistanceVolOiseau(a.lat, a.lon, b.lat, b.lon)
    return Math.round(d * 1.5) // ~50 km/h
  }))
}

// Algorithme du plus proche voisin avec matrice pré-calculée
async function optimiserItineraire(
  clients: any[],
  pointDepart: { lat: number, lon: number },
  clientPrioritaire?: any
): Promise<any[]> {
  // Construire la liste de points : [domicile, ...clients]
  const points = [pointDepart, ...clients.map(c => c.coordonnees)]
  const matrice = await obtenirMatriceDistances(points)
  // matrice[0] = durées depuis le point de départ, matrice[i+1] = depuis le client i

  const visites: any[] = []
  const utilises = new Set<number>()
  let posIdx = 0 // index dans `points` (0 = domicile)

  // Si client prioritaire, le placer en premier
  if (clientPrioritaire) {
    const idx = clients.findIndex(c => c.id === clientPrioritaire.id)
    if (idx >= 0) {
      const ptIdx = idx + 1
      const route = await calculerDistanceVoiture(points[posIdx].lat, points[posIdx].lon, points[ptIdx].lat, points[ptIdx].lon)
      visites.push({ ...clients[idx], distance: Math.round(route.distance * 10) / 10, duree: matrice[posIdx][ptIdx], routeGeometry: route.geometry })
      utilises.add(idx)
      posIdx = ptIdx
    }
  }

  // Greedy nearest-neighbor sur la matrice
  while (utilises.size < clients.length) {
    let plusProche = -1
    let dureeMin = Infinity
    for (let i = 0; i < clients.length; i++) {
      if (utilises.has(i)) continue
      const duree = matrice[posIdx][i + 1]
      if (duree < dureeMin) { dureeMin = duree; plusProche = i }
    }
    if (plusProche === -1) break
    const ptIdx = plusProche + 1
    const route = await calculerDistanceVoiture(points[posIdx].lat, points[posIdx].lon, points[ptIdx].lat, points[ptIdx].lon)
    visites.push({ ...clients[plusProche], distance: Math.round(route.distance * 10) / 10, duree: matrice[posIdx][ptIdx], routeGeometry: route.geometry })
    utilises.add(plusProche)
    posIdx = ptIdx
  }

  return visites
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { typeTournee, heureDepart, heureRetour, dureeRdv, tempsPause, heurePause, departement, ville, pointDepart, rdvFixes, filtrerVisites, joursDepuisVisite, clientIds } = await request.json()

    // Construire les filtres
    const where: any = {}

    if (clientIds && Array.isArray(clientIds) && clientIds.length > 0) {
      // Mode sélection manuelle : on prend exactement ces clients
      where.id = { in: clientIds }
    } else {
      // Mode automatique : filtres type/dépt/ville
      if (typeTournee === 'client') {
        where.statut = 'client'
      } else if (typeTournee === 'prospect') {
        where.statut = 'prospect'
      }

      if (departement && departement !== 'tous') {
        where.departement = departement
      }

      if (ville && ville !== 'toutes') {
        where.ville = ville
      }
    }

    // Récupérer les clients/prospects avec adresse complète + dernière visite
    const clientsRaw = await prisma.client.findMany({
      where: {
        ...where,
        userId: session.user.id,
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
        statut: true,
        interactions: {
          where: { type: 'visite' },
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true }
        }
      }
    })

    // Filtrer et trier selon les visites
    const maintenant = new Date()
    const seuilVisite = new Date(maintenant.getTime() - (joursDepuisVisite || 30) * 24 * 60 * 60 * 1000)

    const clientsFiltres = filtrerVisites
      ? clientsRaw.filter(c => {
          if (c.interactions.length === 0) return true // jamais visité → garder
          return c.interactions[0].date < seuilVisite // visité il y a plus de X jours → garder
        })
      : clientsRaw

    // Prioriser : jamais visités d'abord, puis par date de visite la plus ancienne
    clientsFiltres.sort((a, b) => {
      const aVisited = a.interactions.length > 0
      const bVisited = b.interactions.length > 0
      if (!aVisited && bVisited) return -1
      if (aVisited && !bVisited) return 1
      if (!aVisited && !bVisited) return 0
      return a.interactions[0].date < b.interactions[0].date ? -1 : 1
    })

    const clients = clientsFiltres.map(({ interactions, ...rest }) => ({
      ...rest,
      derniereVisite: interactions.length > 0 ? interactions[0].date.toISOString() : null
    }))

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

    // Obtenir les coordonnées du point de départ si fourni
    let coordonneesDomicile = null
    if (pointDepart && pointDepart.codePostal && pointDepart.ville) {
      coordonneesDomicile = await obtenirCoordonnees(pointDepart.codePostal, pointDepart.ville, pointDepart.adresse)
      console.log('Point de départ:', pointDepart, 'Coordonnées:', coordonneesDomicile)
    }

    // Obtenir les coordonnées pour chaque client - SEQUENTIAL pour respecter Nominatim 1 req/sec
    const clientsAvecCoordonnees: any[] = []
    for (const client of clients) {
      const coordonnees = await obtenirCoordonnees(client.codePostal!, client.ville!, client.adresse ?? undefined)
      clientsAvecCoordonnees.push({ ...client, coordonnees })
    }

    // Séparer les RDV fixes des clients disponibles
    const rdvFixesIds = (rdvFixes || []).map((rdv: any) => rdv.clientId)
    const clientsLibres = clientsAvecCoordonnees.filter(c => !rdvFixesIds.includes(c.id))
    const clientsRdvFixes = rdvFixes ? rdvFixes.map((rdv: any) => {
      const client = clientsAvecCoordonnees.find(c => c.id === rdv.clientId)
      return { ...client, heureRdv: rdv.heureRdv }
    }).filter(Boolean) : []

    // Utiliser Google Gemini pour optimiser la tournée
    let itineraireOptimise
    
    if (genAI && clientsAvecCoordonnees.length > 0) {
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

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        const resultat = JSON.parse(text.replace(/```json\n?|```/g, '').trim())
        
        // Reconstruire l'itinéraire avec les distances
        itineraireOptimise = []
        let positionActuelle = clientsAvecCoordonnees[0].coordonnees
        
        for (const clientId of resultat.itineraire) {
          const client = clientsAvecCoordonnees.find(c => c.id === clientId)
          if (client) {
            const route = await calculerDistanceVoiture(
              positionActuelle.lat,
              positionActuelle.lon,
              client.coordonnees.lat,
              client.coordonnees.lon
            )
            
            itineraireOptimise.push({
              ...client,
              distance: Math.round(route.distance * 10) / 10,
              duree: route.duration,
              routeGeometry: route.geometry,
              heureRdv: clientsRdvFixes.find((c: any) => c.id === clientId)?.heureRdv
            })
            
            positionActuelle = client.coordonnees
          }
        }
      } catch (error) {
        console.error('Erreur Gemini:', error)
        // Fallback sur l'algorithme classique
        const clientPrioritaire = clientsRdvFixes.length > 0 ? clientsRdvFixes[0] : null
        const pointDepartCoord = coordonneesDomicile || (clientPrioritaire ? clientPrioritaire.coordonnees : clientsAvecCoordonnees[0].coordonnees)
        itineraireOptimise = await optimiserItineraire(clientsAvecCoordonnees, pointDepartCoord, clientPrioritaire)
      }
    } else {
      // Pas d'API Gemini, utiliser l'algorithme classique
      const clientPrioritaire = clientsRdvFixes.length > 0 ? clientsRdvFixes[0] : null
      const pointDepartCoord = coordonneesDomicile || (clientPrioritaire ? clientPrioritaire.coordonnees : clientsAvecCoordonnees[0].coordonnees)
      itineraireOptimise = await optimiserItineraire(clientsAvecCoordonnees, pointDepartCoord, clientPrioritaire)
    }

    console.log('Itinéraire optimisé:', itineraireOptimise?.length || 0, 'clients')

    // Pré-calculer les durées de retour domicile en 1 seul appel OSRM Table
    const retourDomicileDurees = new Map<string, number>()
    if (coordonneesDomicile && itineraireOptimise && itineraireOptimise.length > 0) {
      const pointsRetour = [coordonneesDomicile, ...itineraireOptimise.map((c: any) => c.coordonnees)]
      const matriceRetour = await obtenirMatriceDistances(pointsRetour)
      itineraireOptimise.forEach((c: any, i: number) => {
        retourDomicileDurees.set(c.id, matriceRetour[i + 1]?.[0] ?? 0)
      })
    }

    // Calculer les horaires
    const [heureH, minuteH] = heureDepart.split(':').map(Number)
    const [heureR, minuteR] = heureRetour.split(':').map(Number)
    const minutesDisponibles = (heureR * 60 + minuteR) - (heureH * 60 + minuteH)

    let minutesActuelles = heureH * 60 + minuteH
    const visites: any[] = []
    let distanceTotale = 0
    let dureeTrajetTotale = 0
    const pauseMinutes = tempsPause || 0
    const heurePauseMinutes = heurePause ? parseInt(heurePause.split(':')[0]) * 60 + parseInt(heurePause.split(':')[1]) : 12 * 60
    let pausePrise = pauseMinutes === 0

    for (let i = 0; i < itineraireOptimise.length; i++) {
      const client = itineraireOptimise[i]
      
      // Pour le premier client, calculer la distance depuis le domicile si défini
      let distanceDepuisDomicile = client.distance || 0
      let dureeDepuisDomicile = client.duree || 0
      let geometryDepuisDomicile = client.routeGeometry
      
      if (i === 0 && coordonneesDomicile && client.coordonnees) {
        const routeDepuisDomicile = await calculerDistanceVoiture(
          coordonneesDomicile.lat,
          coordonneesDomicile.lon,
          client.coordonnees.lat,
          client.coordonnees.lon
        )
        distanceDepuisDomicile = Math.round(routeDepuisDomicile.distance * 10) / 10
        dureeDepuisDomicile = routeDepuisDomicile.duration
        geometryDepuisDomicile = routeDepuisDomicile.geometry
      }
      
      console.log(`Client ${i + 1}:`, client.nom, 'Distance:', distanceDepuisDomicile, 'Durée:', dureeDepuisDomicile)

      // Durée de retour au domicile (pré-calculée)
      const dureeRetourDomicile = retourDomicileDurees.get(client.id) ?? 0
      
      // Calculer le temps de trajet vers ce client
      const travelDuration = (i === 0 && coordonneesDomicile ? dureeDepuisDomicile : (i > 0 ? client.duree : 0))

      // La pause sera-t-elle insérée PENDANT ce trajet ? (on franchit heurePauseMinutes après le trajet)
      const minutesApresTrajet = minutesActuelles + travelDuration
      const pauseAInserer = (!pausePrise && minutesApresTrajet >= heurePauseMinutes) ? pauseMinutes : 0

      // Vérifier si on a encore le temps (trajet + pause éventuelle + RDV + retour domicile)
      const tempsNecessaire = travelDuration + pauseAInserer + dureeRdv + dureeRetourDomicile
      if (minutesActuelles + tempsNecessaire > heureR * 60 + minuteR) {
        break // Plus de temps disponible (pause + retour domicile inclus)
      }

      // Ajouter le temps de trajet
      if (i === 0 && coordonneesDomicile) {
        minutesActuelles += dureeDepuisDomicile
        dureeTrajetTotale += dureeDepuisDomicile
      } else if (i > 0) {
        minutesActuelles += client.duree
        dureeTrajetTotale += client.duree
      }

      // Insérer la pause si l'heure de pause est atteinte après le trajet (avant l'arrivée chez le client)
      if (!pausePrise && minutesActuelles >= heurePauseMinutes) {
        minutesActuelles += pauseMinutes
        pausePrise = true
      }

      const heureArrivee = `${String(Math.floor(minutesActuelles / 60)).padStart(2, '0')}:${String(minutesActuelles % 60).padStart(2, '0')}`
      minutesActuelles += dureeRdv
      const heureDepartVisite = `${String(Math.floor(minutesActuelles / 60)).padStart(2, '0')}:${String(minutesActuelles % 60).padStart(2, '0')}`

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
        heureDepart: heureDepartVisite,
        distance: i === 0 && coordonneesDomicile ? distanceDepuisDomicile : (client.distance || 0),
        duree: i === 0 && coordonneesDomicile ? dureeDepuisDomicile : (client.duree || 0),
        coordonnees: client.coordonnees,
        heureRdv: client.heureRdv,
        routeGeometry: i === 0 && coordonneesDomicile ? geometryDepuisDomicile : client.routeGeometry,
        derniereVisite: client.derniereVisite || null
      })

      distanceTotale += (i === 0 && coordonneesDomicile ? distanceDepuisDomicile : (client.distance || 0))
    }

    // Calculer l'heure de retour réelle depuis le dernier client
    let heureRetourEstimee: string | null = null
    if (coordonneesDomicile && visites.length > 0) {
      const dernierClient = itineraireOptimise[visites.length - 1]
      if (dernierClient?.coordonnees) {
        const retour = await calculerDistanceVoiture(
          dernierClient.coordonnees.lat,
          dernierClient.coordonnees.lon,
          coordonneesDomicile.lat,
          coordonneesDomicile.lon
        )
        const dernierVisiteFin = visites[visites.length - 1]
        const [hFin, mFin] = dernierVisiteFin.heureDepart.split(':').map(Number)
        const minutesRetour = hFin * 60 + mFin + retour.duration
        heureRetourEstimee = `${String(Math.floor(minutesRetour / 60)).padStart(2, '0')}:${String(minutesRetour % 60).padStart(2, '0')}`
        distanceTotale += Math.round(retour.distance * 10) / 10
        dureeTrajetTotale += retour.duration
      }
    }

    return NextResponse.json({
      visites,
      stats: {
        nombreVisites: visites.length,
        distanceTotale: Math.round(distanceTotale),
        dureeTrajet: dureeTrajetTotale,
        heureRetourEstimee
      },
      pointDepart: coordonneesDomicile ? {
        lat: coordonneesDomicile.lat,
        lon: coordonneesDomicile.lon,
        adresse: `${pointDepart.adresse}, ${pointDepart.codePostal} ${pointDepart.ville}`
      } : null
    })
  } catch (error: any) {
    console.error('Erreur optimisation tournée:', error?.message || error)
    return NextResponse.json(
      { error: `Erreur lors de l'optimisation : ${error?.message || 'erreur inconnue'}` },
      { status: 500 }
    )
  }
}
