import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export const maxDuration = 55

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normaliser(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function scorePrompt(item: any, stems: string[], champs: string[]): number {
  if (stems.length === 0) return 0
  const haystack = normaliser(champs.map(c => item[c] || '').join(' '))
  return stems.filter(stem => haystack.includes(stem)).length
}

// Trier par pertinence avec le prompt (les matching en premier), sans filtrer
function trierParPrompt(items: any[], prompt: string, champs: string[]): any[] {
  if (!prompt.trim()) return items
  const mots = normaliser(prompt).split(/\s+/).filter(m => m.length > 3)
  const stems = mots.map(m => m.length >= 7 ? m.slice(0, 6) : m)
  if (stems.length === 0) return items
  return [...items].sort((a, b) => {
    const sa = scorePrompt(a, stems, champs)
    const sb = scorePrompt(b, stems, champs)
    if (sb !== sa) return sb - sa
    return a.distance - b.distance
  })
}

// Overpass avec plusieurs miroirs de fallback
async function fetchOverpass(query: string): Promise<any[] | null> {
  const miroirs = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ]
  for (const url of miroirs) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 22000)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: query,
        signal: ctrl.signal,
      })
      clearTimeout(t)
      if (res.ok) {
        const data = await res.json()
        console.log('[prospection] Overpass OK via', url, '→', data.elements?.length, 'éléments')
        return data.elements || []
      }
    } catch (err: any) {
      console.warn('[prospection] Overpass échec', url, err?.message?.slice(0, 60))
    }
  }
  return null
}

async function trierAvecGroq(items: any[], prompt: string): Promise<any[]> {
  if (!process.env.GROQ_API_KEY || items.length === 0 || !prompt.trim()) return items
  try {
    const liste = items.slice(0, 60).map((it, i) =>
      `${i + 1}. [${it.id}] ${it.nom} – ${it.type || it.secteur || ''} – ${it.ville || ''} (${it.distance.toFixed(1)} km)`
    ).join('\n')
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `L'utilisateur cherche: "${prompt}"\nVoici des entreprises à proximité:\n${liste}\n\nTrie ces entreprises : mets CELLES QUI CORRESPONDENT EN PREMIER, les autres ensuite. Retourne TOUTES les IDs.\nRéponds UNIQUEMENT avec: {"ids": ["id1", "id2", ...]}`
        }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    })
    if (!res.ok) return items
    const data = await res.json()
    const result = JSON.parse(data.choices[0].message.content)
    const orderedIds: string[] = result.ids || []
    if (orderedIds.length === 0) return items
    const map = new Map(items.map(it => [it.id, it]))
    const ordered = orderedIds.map(id => map.get(id)).filter(Boolean)
    const restants = items.filter(it => !orderedIds.includes(it.id))
    return [...ordered, ...restants]
  } catch (e) {
    console.warn('[prospection] Groq error:', e)
    return items
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lon = parseFloat(searchParams.get('lon') || '0')
    const rayon = Math.min(parseFloat(searchParams.get('rayon') || '5'), 20)
    const prompt = searchParams.get('prompt') || ''

    if (!lat || !lon) return NextResponse.json({ error: 'Coordonnées requises' }, { status: 400 })

    // ── 1. Clients/prospects existants dans la DB ─────────────────────────────
    const tousDB = await prisma.client.findMany({
      where: { userId: session.user.id },
      select: { id: true, nom: true, entreprise: true, secteur: true, statut: true, adresse: true, ville: true, codePostal: true, departement: true, lat: true, lon: true }
    })

    // Clients avec coordonnées ET dans le rayon
    let existants: any[] = tousDB
      .filter(c => c.lat && c.lon)
      .map(c => ({ ...c, distance: haversine(lat, lon, c.lat!, c.lon!), source: 'base' }))
      .filter(c => c.distance <= rayon)

    // Trier par prompt (matching en premier) puis par distance
    existants = trierParPrompt(existants, prompt, ['nom', 'entreprise', 'secteur', 'ville'])
    if (!prompt.trim()) existants.sort((a, b) => a.distance - b.distance)

    // ── 2. Nouvelles entreprises via Overpass API (OpenStreetMap) ────────────
    const rayonM = Math.round(rayon * 1000)
    const overpassQuery = `[out:json][timeout:25];
(
  node["shop"]["name"](around:${rayonM},${lat},${lon});
  node["amenity"]["name"](around:${rayonM},${lat},${lon});
  node["craft"]["name"](around:${rayonM},${lat},${lon});
  node["office"]["name"](around:${rayonM},${lat},${lon});
  node["industrial"]["name"](around:${rayonM},${lat},${lon});
  node["tourism"]["name"](around:${rayonM},${lat},${lon});
  way["shop"]["name"](around:${rayonM},${lat},${lon});
  way["amenity"]["name"](around:${rayonM},${lat},${lon});
  way["craft"]["name"](around:${rayonM},${lat},${lon});
  way["office"]["name"](around:${rayonM},${lat},${lon});
);
out center;`

    // ── 2. Nouvelles entreprises via Overpass (miroirs de fallback) ─────────
    const nomsDB = new Set([
      ...tousDB.map(c => normaliser(c.nom || '')),
      ...tousDB.map(c => normaliser(c.entreprise || ''))
    ])

    let nouveaux: any[] = []
    const elements = await fetchOverpass(overpassQuery)

    if (elements) {
      nouveaux = elements
        .filter((e: any) => e.tags?.name)
        .map((e: any) => {
          const elat = e.lat ?? e.center?.lat
          const elon = e.lon ?? e.center?.lon
          if (!elat || !elon) return null
          const nom = e.tags.name
          if (nomsDB.has(normaliser(nom))) return null
          const cat = e.tags.craft || e.tags.shop || e.tags.amenity || e.tags.office || e.tags.industrial || e.tags.tourism || 'entreprise'
          return {
            id: `osm_${e.type}_${e.id}`,
            nom,
            type: cat,
            lat: elat,
            lon: elon,
            adresse: [e.tags['addr:housenumber'], e.tags['addr:street']].filter(Boolean).join(' ') || null,
            ville: e.tags['addr:city'] || e.tags['addr:town'] || e.tags['addr:village'] || null,
            codePostal: e.tags['addr:postcode'] || null,
            phone: e.tags.phone || e.tags['contact:phone'] || null,
            website: e.tags.website || e.tags['contact:website'] || null,
            email: e.tags.email || e.tags['contact:email'] || null,
            distance: haversine(lat, lon, elat, elon),
            source: 'osm'
          }
        })
        .filter(Boolean)
    }

    // Trier par prompt (matching en premier) puis IA Groq
    nouveaux = trierParPrompt(nouveaux, prompt, ['nom', 'type', 'ville'])
    if (prompt.trim() && nouveaux.length > 0) {
      nouveaux = await trierAvecGroq(nouveaux.slice(0, 60), prompt)
    } else {
      nouveaux.sort((a, b) => a.distance - b.distance)
    }

    return NextResponse.json({
      existants,
      nouveaux: nouveaux.slice(0, 60),
      position: { lat, lon },
      rayon,
      debug: { dbTotal: tousDB.length, dbAvecCoords: existants.length, osmTotal: elements?.length ?? -1, osmApres: nouveaux.length }
    })
  } catch (error: any) {
    console.error('[prospection] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
