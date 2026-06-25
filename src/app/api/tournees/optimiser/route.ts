import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export const maxDuration = 60 // secondes (Vercel Pro)

// Appel IA générique : Groq (gratuit, prioritaire) ou Gemini (fallback)
async function appelIA(prompt: string): Promise<string> {
  if (process.env.GROQ_API_KEY) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    })
    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return data.choices[0].message.content
  }
  if (process.env.GEMINI_API_KEY) {
    for (const v of ['v1', 'v1beta']) {
      const res = await fetch(`https://generativelanguage.googleapis.com/${v}/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      })
      if (res.ok) {
        const data = await res.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      }
    }
    throw new Error('Gemini indisponible')
  }
  throw new Error('Aucune clé IA configurée (GROQ_API_KEY ou GEMINI_API_KEY)')
}

const hasIA = !!(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY)

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

// Fallback synchrone rapide sans appel réseau (centres départements + variation)
function coordonneesFallbackRapide(codePostal: string, ville: string): { lat: number, lon: number } {
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
  // Variation basée sur le hash de la ville pour être déterministe
  const hash = ville.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const variation = (hash % 100) / 500
  return { lat: coords.lat + (variation - 0.1), lon: coords.lon + (variation - 0.1) }
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
  clientPrioritaire?: any,
  mandatoryIds?: string[]
): Promise<any[]> {
  const points = [pointDepart, ...clients.map(c => c.coordonnees)]
  const matrice = await obtenirMatriceDistances(points)

  const visites: any[] = []
  const utilises = new Set<number>()
  let posIdx = 0

  // Helper : visiter un client par son index dans `clients`
  const visiterClient = async (idx: number) => {
    const ptIdx = idx + 1
    const route = await calculerDistanceVoiture(points[posIdx].lat, points[posIdx].lon, points[ptIdx].lat, points[ptIdx].lon)
    visites.push({ ...clients[idx], distance: Math.round(route.distance * 10) / 10, duree: matrice[posIdx][ptIdx], routeGeometry: route.geometry })
    utilises.add(idx)
    posIdx = ptIdx
  }

  // 1. Clients obligatoires en PREMIER (nearest-neighbor parmi eux)
  const mandatorySet = new Set(mandatoryIds || [])
  const mandatoryIndices = clients
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c._mandatory || mandatorySet.has(c.id))
    .map(({ i }) => i)

  while (mandatoryIndices.some(i => !utilises.has(i))) {
    let plusProche = -1
    let dureeMin = Infinity
    for (const idx of mandatoryIndices) {
      if (utilises.has(idx)) continue
      const duree = matrice[posIdx][idx + 1]
      if (duree < dureeMin) { dureeMin = duree; plusProche = idx }
    }
    if (plusProche === -1) break
    await visiterClient(plusProche)
  }

  // 2. Client RDV prioritaire (si non déjà visité)
  if (clientPrioritaire) {
    const idx = clients.findIndex(c => c.id === clientPrioritaire.id)
    if (idx >= 0 && !utilises.has(idx)) await visiterClient(idx)
  }

  // 3. Greedy nearest-neighbor sur le reste
  while (utilises.size < clients.length) {
    let plusProche = -1
    let dureeMin = Infinity
    for (let i = 0; i < clients.length; i++) {
      if (utilises.has(i)) continue
      const duree = matrice[posIdx][i + 1]
      if (duree < dureeMin) { dureeMin = duree; plusProche = i }
    }
    if (plusProche === -1) break
    await visiterClient(plusProche)
  }

  return visites
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { typeTournee, heureDepart, heureRetour, dureeRdv, tempsPause, heurePause, departements, villes, pointDepart, rdvFixes, filtrerVisites, joursDepuisVisite, clientIds, excludeClientIds, mandatoryClientIds, promptIA } = await request.json()

    const selectClients = {
      id: true, nom: true, entreprise: true, adresse: true, secteur: true,
      ville: true, codePostal: true, departement: true, statut: true, lat: true, lon: true,
      interactions: { where: { type: 'visite' }, orderBy: { date: 'desc' }, take: 1, select: { date: true } }
    }
    const baseWhere = {
      userId: session.user.id,
      AND: [{ adresse: { not: null } }, { ville: { not: null } }, { codePostal: { not: null } }]
    }

    let clientsRaw: any[]

    console.log('[tournées] params reçus:', { mandatoryClientIds, clientIds, departements, villes, typeTournee })

    if (mandatoryClientIds && Array.isArray(mandatoryClientIds) && mandatoryClientIds.length > 0) {
      // Mode manuel enrichi : clients obligatoires + candidats de la zone
      const zoneWhere: any = { ...baseWhere }
      if (typeTournee === 'client') zoneWhere.statut = 'client'
      else if (typeTournee === 'prospect') zoneWhere.statut = 'prospect'
      if (Array.isArray(departements) && departements.length > 0) zoneWhere.departement = { in: departements }
      if (Array.isArray(villes) && villes.length > 0) zoneWhere.ville = { in: villes }

      const [mandatoryClients, zoneClients] = await Promise.all([
        (prisma.client.findMany as any)({ where: { ...baseWhere, id: { in: mandatoryClientIds } }, select: selectClients }),
        (prisma.client.findMany as any)({ where: { ...zoneWhere, id: { notIn: mandatoryClientIds } }, select: selectClients })
      ])
      console.log('[tournées] mandatoryClients trouvés:', mandatoryClients.length, '| zoneClients:', zoneClients.length)
      clientsRaw = [
        ...mandatoryClients.map((c: any) => ({ ...c, _mandatory: true })),
        ...zoneClients
      ]
    } else if (clientIds && Array.isArray(clientIds) && clientIds.length > 0) {
      clientsRaw = await (prisma.client.findMany as any)({ where: { ...baseWhere, id: { in: clientIds } }, select: selectClients })
    } else {
      const autoWhere: any = { ...baseWhere }
      if (typeTournee === 'client') autoWhere.statut = 'client'
      else if (typeTournee === 'prospect') autoWhere.statut = 'prospect'
      if (Array.isArray(departements) && departements.length > 0) autoWhere.departement = { in: departements }
      if (Array.isArray(villes) && villes.length > 0) autoWhere.ville = { in: villes }
      if (Array.isArray(excludeClientIds) && excludeClientIds.length > 0) autoWhere.id = { notIn: excludeClientIds }
      clientsRaw = await (prisma.client.findMany as any)({ where: autoWhere, select: selectClients })
    }

    // Filtrer et trier selon les visites
    const maintenant = new Date()
    const seuilVisite = new Date(maintenant.getTime() - (joursDepuisVisite || 30) * 24 * 60 * 60 * 1000)

    const clientsFiltres = filtrerVisites
      ? clientsRaw.filter(c => {
          if (c._mandatory) return true // toujours garder les clients obligatoires
          if (c.interactions.length === 0) return true // jamais visité → garder
          return c.interactions[0].date < seuilVisite // visité il y a plus de X jours → garder
        })
      : clientsRaw

    // Prioriser : obligatoires d'abord, puis jamais visités, puis par date de visite la plus ancienne
    clientsFiltres.sort((a, b) => {
      if (a._mandatory && !b._mandatory) return -1
      if (!a._mandatory && b._mandatory) return 1
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
    }

    // Utiliser les coordonnées stockées en DB ; géocoder progressivement les nouveaux (max 5/req)
    const clientsAvecCoordonnees: any[] = []
    let nbNouveauxGeocodages = 0
    const MAX_GEOCODAGES_PAR_REQUETE = 5
    for (const client of clients) {
      let coordonnees: { lat: number, lon: number }
      if (client.lat != null && client.lon != null) {
        // Coordonnées déjà connues → instantané
        coordonnees = { lat: client.lat, lon: client.lon }
      } else if (nbNouveauxGeocodages < MAX_GEOCODAGES_PAR_REQUETE) {
        // Appel Nominatim (respecté : max 5 par requête)
        nbNouveauxGeocodages++
        coordonnees = await obtenirCoordonnees(client.codePostal!, client.ville!, client.adresse ?? undefined)
        // Sauvegarder en DB pour les prochaines fois (fire-and-forget)
        ;(prisma.client.update as any)({ where: { id: client.id }, data: { lat: coordonnees.lat, lon: coordonnees.lon } }).catch(() => {})
      } else {
        // Quota atteint : fallback rapide sans Nominatim (sera précis au prochain appel)
        coordonnees = coordonneesFallbackRapide(client.codePostal!, client.ville!)
      }
      clientsAvecCoordonnees.push({ ...client, coordonnees })
    }
    if (nbNouveauxGeocodages > 0) {
      console.log(`Géocodage : ${nbNouveauxGeocodages} nouveaux clients géocodés et sauvés en DB`)
    }

    // Séparer les RDV fixes des clients disponibles
    const rdvFixesIds = (rdvFixes || []).map((rdv: any) => rdv.clientId)
    const clientsLibres = clientsAvecCoordonnees.filter(c => !rdvFixesIds.includes(c.id))
    const clientsRdvFixes = rdvFixes ? rdvFixes.map((rdv: any) => {
      const client = clientsAvecCoordonnees.find(c => c.id === rdv.clientId)
      return { ...client, heureRdv: rdv.heureRdv }
    }).filter(Boolean) : []

    // Utiliser l'IA (Groq / Gemini) pour optimiser la tournée
    let itineraireOptimise
    
    if (hasIA && clientsAvecCoordonnees.length > 0) {
      try {
        // Format compact pour l'IA : une ligne par client
        const formatClient = (c: any, i: number) => {
          const lastVisit = c.derniereVisite ? new Date(c.derniereVisite).toLocaleDateString('fr-FR') : 'jamais visité'
          const secteurInfo = c.secteur ? ` | secteur: ${c.secteur}` : ''
          const entrepriseInfo = c.entreprise ? ` / ${c.entreprise}` : ''
          return `${i + 1}. [${c.id}] ${c.nom}${entrepriseInfo} - ${c.ville}${secteurInfo} | ${lastVisit} | GPS: ${c.coordonnees.lat.toFixed(4)},${c.coordonnees.lon.toFixed(4)}`
        }

        // Pré-filtrer par mots-clés si promptIA est défini (l'IA ne reçoit que les clients pertinents)
        let candidatsIA = clientsLibres
        if (promptIA && promptIA.trim()) {
          const mots = promptIA.toLowerCase().split(/\s+/).filter((m: string) => m.length > 3)
          if (mots.length > 0) {
            const filtered = clientsLibres.filter((c: any) => {
              const haystack = [c.nom, c.entreprise, c.secteur, c.ville, c.departement].filter(Boolean).join(' ').toLowerCase()
              return mots.some((m: string) => haystack.includes(m))
            })
            if (filtered.length > 0) {
              candidatsIA = filtered
              console.log('[tournées] pré-filtre keyword: ' + mots.join(',') + ' → ' + filtered.length + '/' + clientsLibres.length + ' clients')
            }
          }
        }

        const obligatoiresInfo = mandatoryClientIds && mandatoryClientIds.length > 0
          ? clientsAvecCoordonnees.filter((c: any) => mandatoryClientIds.includes(c.id)).map((c: any) => `- [${c.id}] ${c.nom}${c.entreprise ? ' / ' + c.entreprise : ''}${c.secteur ? ' | ' + c.secteur : ''} - ${c.ville}`).join('\n')
          : 'Aucun'

        let prompt: string

        if (promptIA && promptIA.trim()) {
          prompt = `Tu es un assistant commercial expert en tournées de vente.

DEMANDE: "${promptIA}"

CONTRAINTES HORAIRES: Départ ${heureDepart} | Retour ${heureRetour} | RDV: ${dureeRdv} min
${(tempsPause || 0) > 0 ? `Pause: ${tempsPause} min à ${heurePause}` : ''}
${filtrerVisites ? `Filtre visite actif: seuls les clients non visités depuis plus de ${joursDepuisVisite} jours sont dans la liste.` : ''}

CLIENTS OBLIGATOIRES (EN PREMIER absolument):
${obligatoiresInfo}

CLIENTS DISPONIBLES PRÉ-FILTRÉS (${candidatsIA.length} correspondants à ta demande):
${candidatsIA.map(formatClient).join('\n')}

INSTRUCTIONS:
1. Ordonne ces clients par proximité géographique pour minimiser les trajets
2. Respecte la demande de l'utilisateur pour la priorisation (jamais visités en premier si demandé, etc.)
3. Inclus les clients OBLIGATOIRES EN PREMIER
4. Retourne TOUS les clients de la liste dans l'ordre optimal

RÉPONDS UNIQUEMENT avec ce JSON:
{"itineraire": ["id1", "id2", ...]}`
        } else {
          prompt = `Tu es un expert en optimisation de tournées commerciales.

CONTRAINTES: Départ ${heureDepart} | Retour ${heureRetour} | RDV: ${dureeRdv} min
${(tempsPause || 0) > 0 ? `Pause: ${tempsPause} min à ${heurePause}` : ''}

RDV FIXES:
${clientsRdvFixes.map((c: any, i: number) => `${i + 1}. ${c.nom} (${c.ville}) - ${c.heureRdv}`).join('\n') || 'Aucun'}

CLIENTS OBLIGATOIRES (EN PREMIER):
${obligatoiresInfo}

CLIENTS DISPONIBLES (${candidatsIA.length}):
${candidatsIA.map(formatClient).join('\n')}

OBJECTIF: Itinéraire optimal minimisant les distances. Obligatoires EN PREMIER.
RÉPONDS UNIQUEMENT avec: {"itineraire": ["id1", "id2", ...]}`
        }

        const text = await appelIA(prompt)
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
        console.error('Erreur IA:', error)
        // Fallback : si promptIA défini, filtre par mots-clés sur nom/entreprise/secteur
        let candidats = clientsAvecCoordonnees
        if (promptIA && promptIA.trim()) {
          const mots = promptIA.toLowerCase().split(/\s+/).filter((m: string) => m.length > 3)
          const filtered = clientsAvecCoordonnees.filter((c: any) => {
            const haystack = [c.nom, c.entreprise, c.secteur, c.ville].filter(Boolean).join(' ').toLowerCase()
            return mots.some((m: string) => haystack.includes(m))
          })
          // Garder les obligatoires même s'ils ne matchent pas les mots-clés
          const obligatoires = clientsAvecCoordonnees.filter((c: any) => mandatoryClientIds?.includes(c.id))
          const obligatoiresIds = new Set(obligatoires.map((c: any) => c.id))
          candidats = [...obligatoires, ...filtered.filter((c: any) => !obligatoiresIds.has(c.id))]
          if (candidats.length === 0) candidats = clientsAvecCoordonnees
          console.log('[tournées] fallback keyword filter: ' + mots.join(',') + ' → ' + candidats.length + ' clients')
        }
        const clientPrioritaire = clientsRdvFixes.length > 0 ? clientsRdvFixes[0] : null
        const pointDepartCoord = coordonneesDomicile || (clientPrioritaire ? clientPrioritaire.coordonnees : candidats[0].coordonnees)
        itineraireOptimise = await optimiserItineraire(candidats, pointDepartCoord, clientPrioritaire, mandatoryClientIds)
      }
    } else {
      // Pas d'API IA configurée : fallback keyword si promptIA défini
      let candidats = clientsAvecCoordonnees
      if (promptIA && promptIA.trim()) {
        const mots = promptIA.toLowerCase().split(/\s+/).filter((m: string) => m.length > 3)
        const filtered = clientsAvecCoordonnees.filter((c: any) => {
          const haystack = [c.nom, c.entreprise, c.secteur, c.ville].filter(Boolean).join(' ').toLowerCase()
          return mots.some((m: string) => haystack.includes(m))
        })
        const obligatoires = clientsAvecCoordonnees.filter((c: any) => mandatoryClientIds?.includes(c.id))
        const obligatoiresIds = new Set(obligatoires.map((c: any) => c.id))
        candidats = [...obligatoires, ...filtered.filter((c: any) => !obligatoiresIds.has(c.id))]
        if (candidats.length === 0) candidats = clientsAvecCoordonnees
        console.log('[tournées] no-ia keyword filter: ' + mots.join(',') + ' → ' + candidats.length + ' clients')
      }
      const clientPrioritaire = clientsRdvFixes.length > 0 ? clientsRdvFixes[0] : null
      const pointDepartCoord = coordonneesDomicile || (clientPrioritaire ? clientPrioritaire.coordonnees : candidats[0].coordonnees)
      itineraireOptimise = await optimiserItineraire(candidats, pointDepartCoord, clientPrioritaire, mandatoryClientIds)
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

    const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

    let minutesActuelles = heureH * 60 + minuteH
    const visites: any[] = []
    let ordreVisite = 1
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
      const isMandatory = client._mandatory || (Array.isArray(mandatoryClientIds) && mandatoryClientIds.includes(client.id))
      if (!isMandatory && minutesActuelles + tempsNecessaire > heureR * 60 + minuteR) {
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

      // Insérer la pause si l'heure de pause est atteinte après le trajet
      if (!pausePrise && minutesActuelles >= heurePauseMinutes) {
        const heureDebutPause = toHHMM(minutesActuelles)
        minutesActuelles += pauseMinutes
        const heureFinPause = toHHMM(minutesActuelles)
        visites.push({
          type: 'pause',
          ordre: null,
          heureArrivee: heureDebutPause,
          heureDepart: heureFinPause,
          duree: pauseMinutes,
          client: null,
          distance: 0,
          coordonnees: null,
          routeGeometry: null,
          derniereVisite: null,
        })
        pausePrise = true
      }

      // Pour les RDV fixes : attendre l'heure programmée si on arrive en avance
      if (client.heureRdv) {
        const [rdvH, rdvM] = client.heureRdv.split(':').map(Number)
        const rdvMinutes = rdvH * 60 + rdvM
        if (minutesActuelles < rdvMinutes) {
          minutesActuelles = rdvMinutes
        }
      }

      const heureArrivee = toHHMM(minutesActuelles)
      minutesActuelles += dureeRdv
      const heureDepartVisite = toHHMM(minutesActuelles)

      visites.push({
        type: 'visite',
        client: {
          id: client.id,
          nom: client.nom,
          entreprise: client.entreprise,
          adresse: client.adresse,
          ville: client.ville,
          codePostal: client.codePostal,
          statut: client.statut
        },
        ordre: ordreVisite++,
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

    // Ajouter les clients obligatoires qui ont été coupés par la limite horaire
    if (Array.isArray(mandatoryClientIds) && mandatoryClientIds.length > 0 && itineraireOptimise) {
      const visitedIds = new Set(visites.filter((v: any) => v.client).map((v: any) => v.client.id))
      const missingMandatory = itineraireOptimise.filter((c: any) =>
        (c._mandatory || mandatoryClientIds.includes(c.id)) && !visitedIds.has(c.id)
      )
      for (const client of missingMandatory) {
        const heureArrivee = toHHMM(minutesActuelles)
        minutesActuelles += dureeRdv
        const heureDepartVisite = toHHMM(minutesActuelles)
        visites.push({
          type: 'visite',
          client: { id: client.id, nom: client.nom, entreprise: client.entreprise, adresse: client.adresse, ville: client.ville, codePostal: client.codePostal, statut: client.statut },
          ordre: ordreVisite++,
          heureArrivee,
          heureDepart: heureDepartVisite,
          distance: client.distance || 0,
          duree: client.duree || 0,
          coordonnees: client.coordonnees,
          heureRdv: client.heureRdv || null,
          routeGeometry: client.routeGeometry || null,
          derniereVisite: client.derniereVisite || null
        })
        distanceTotale += client.distance || 0
        dureeTrajetTotale += client.duree || 0
        console.log('[tournées] client obligatoire ajouté hors plage horaire:', client.nom)
      }
    }

    // Calculer l'heure de retour réelle depuis le dernier client
    let heureRetourEstimee: string | null = null
    let distanceRetour = 0
    let dureeRetour = 0
    if (coordonneesDomicile && visites.length > 0) {
      const dernierClient = [...visites].reverse().find((v: any) => v.type === 'visite' && v.coordonnees)
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
        distanceRetour = Math.round(retour.distance * 10) / 10
        dureeRetour = retour.duration
      }
    }

    // Ajouter les cartes départ/retour domicile
    const adresseFormatted = pointDepart ? `${pointDepart.adresse}, ${pointDepart.codePostal} ${pointDepart.ville}` : ''
    if (coordonneesDomicile) {
      visites.unshift({
        type: 'depart_domicile',
        ordre: null,
        heureArrivee: heureDepart,
        heureDepart: heureDepart,
        adresse: adresseFormatted,
        distance: 0,
        duree: 0,
        client: null,
        coordonnees: null,
        routeGeometry: null,
        derniereVisite: null,
      })
      if (heureRetourEstimee) {
        visites.push({
          type: 'retour_domicile',
          ordre: null,
          heureArrivee: heureRetourEstimee,
          heureDepart: heureRetourEstimee,
          adresse: adresseFormatted,
          distance: distanceRetour,
          duree: dureeRetour,
          client: null,
          coordonnees: null,
          routeGeometry: null,
          derniereVisite: null,
        })
      }
    }

    return NextResponse.json({
      visites,
      stats: {
        nombreVisites: visites.filter((v: any) => v.type === 'visite').length,
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
