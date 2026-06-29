import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

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

function matchPrompt(items: any[], prompt: string, champs: string[]): any[] {
  if (!prompt.trim()) return items
  const mots = normaliser(prompt).split(/\s+/).filter(m => m.length > 3)
  const stems = mots.map(m => m.length >= 7 ? m.slice(0, 6) : m)
  if (stems.length === 0) return items
  return items.filter(item => {
    const haystack = champs.map(c => item[c] || '').join(' ')
    const h = normaliser(haystack)
    return stems.some(stem => h.includes(stem))
  })
}

async function filtrerAvecGroq(items: any[], prompt: string): Promise<any[]> {
  if (!process.env.GROQ_API_KEY || items.length === 0 || !prompt.trim()) return items
  try {
    const liste = items.slice(0, 80).map((it, i) => `${i + 1}. [${it.id}] ${it.nom} – ${it.type || it.secteur || ''} – ${it.ville || ''} (${it.distance.toFixed(1)} km)`).join('\n')
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Tu es un assistant commercial. L'utilisateur cherche: "${prompt}"\n\nVoici des entreprises à proximité:\n${liste}\n\nFiltre et trie uniquement celles qui correspondent à la demande. Si aucune ne correspond, retourne toutes.\nRéponds UNIQUEMENT avec: {"ids": ["id1", "id2", ...]}`
        }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    })
    if (!res.ok) return items
    const data = await res.json()
    const result = JSON.parse(data.choices[0].message.content)
    const ids = new Set(result.ids || [])
    if (ids.size === 0) return items
    const filtered = items.filter(it => ids.has(it.id))
    return filtered.length > 0 ? filtered : items
  } catch {
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
      where: { userId: session.user.id, lat: { not: null }, lon: { not: null } },
      select: { id: true, nom: true, entreprise: true, secteur: true, statut: true, adresse: true, ville: true, codePostal: true, departement: true, lat: true, lon: true }
    })

    let existants: any[] = tousDB
      .map(c => ({
        ...c,
        distance: haversine(lat, lon, c.lat!, c.lon!),
        source: 'base'
      }))
      .filter(c => c.distance <= rayon)

    if (prompt.trim()) {
      const keyFiltered = matchPrompt(existants, prompt, ['nom', 'entreprise', 'secteur', 'ville'])
      if (keyFiltered.length > 0) existants = keyFiltered
    }
    existants.sort((a, b) => a.distance - b.distance)

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

    let nouveaux: any[] = []
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      const osmRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: overpassQuery,
        signal: controller.signal
      })
      clearTimeout(timeout)

      if (osmRes.ok) {
        const osmData = await osmRes.json()
        const nomsDB = new Set([
          ...tousDB.map(c => normaliser(c.nom || '')),
          ...tousDB.map(c => normaliser(c.entreprise || ''))
        ])

        nouveaux = osmData.elements
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
    } catch (err) {
      console.error('[prospection] Overpass error:', err)
    }

    // Filtrer par mots-clés si prompt défini
    if (prompt.trim()) {
      const keyFiltered = matchPrompt(nouveaux, prompt, ['nom', 'type', 'ville'])
      if (keyFiltered.length > 0) nouveaux = keyFiltered
    }

    nouveaux.sort((a, b) => a.distance - b.distance)

    // Filtrage IA (Groq) si prompt défini
    if (prompt.trim() && nouveaux.length > 0) {
      nouveaux = await filtrerAvecGroq(nouveaux, prompt)
    }

    return NextResponse.json({
      existants,
      nouveaux: nouveaux.slice(0, 60),
      position: { lat, lon },
      rayon
    })
  } catch (error: any) {
    console.error('[prospection] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
