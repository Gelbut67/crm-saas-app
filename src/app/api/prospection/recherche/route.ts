import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export const maxDuration = 30

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

async function genererTagsOSM(prompt: string): Promise<{ tags: {key:string,value:string}[], keywords: string[] }> {
  if (!prompt.trim()) return { tags: [], keywords: [] }
  if (!process.env.GROQ_API_KEY) {
    return { tags: [], keywords: prompt.split(/\s+/).filter((w: string) => w.length > 2) }
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Tu es expert OpenStreetMap. L'utilisateur cherche: "${prompt}"\n\nDonne les tags OSM et mots-cles (fr+en) pour trouver ces entreprises.\nExemples:\n- "apiculteur" => tags: craft=beekeeper, shop=honey | keywords: apiculteur,ruche,miel,beekeeper,honey\n- "brasserie" => tags: craft=brewery,amenity=bar | keywords: brasserie,brasseur,brewery,biere\n- "vigneron" => tags: craft=winery | keywords: vigneron,vignoble,cave,vin,winery\n- "boucher" => tags: shop=butcher | keywords: boucherie,boucher,viande\n- "boulanger" => tags: shop=bakery | keywords: boulangerie,boulanger,pain\n\nReponds UNIQUEMENT avec:\n{"tags":[{"key":"craft","value":"beekeeper"}],"keywords":["apiculteur","miel","ruche","beekeeper","honey"]}`
        }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    })
    if (!res.ok) throw new Error('groq error')
    const data = await res.json()
    const result = JSON.parse(data.choices[0].message.content)
    return { tags: result.tags || [], keywords: result.keywords || [] }
  } catch {
    return { tags: [], keywords: prompt.split(/\s+/).filter((w: string) => w.length > 2) }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lon = parseFloat(searchParams.get('lon') || '0')
    const rayon = Math.min(parseFloat(searchParams.get('rayon') || '5'), 150)
    const prompt = searchParams.get('prompt') || ''

    if (!lat || !lon) return NextResponse.json({ error: 'Coordonnees requises' }, { status: 400 })

    const tousDB = await prisma.client.findMany({
      where: { userId: session.user.id },
      select: { id: true, nom: true, entreprise: true, secteur: true, statut: true, adresse: true, ville: true, codePostal: true, departement: true, lat: true, lon: true }
    })

    const existants: any[] = tousDB
      .filter((c: any) => c.lat && c.lon)
      .map((c: any) => ({ ...c, distance: haversine(lat, lon, c.lat!, c.lon!), source: 'base' }))
      .filter((c: any) => c.distance <= rayon)
      .sort((a: any, b: any) => a.distance - b.distance)

    const nomsConnus = tousDB
      .flatMap((c: any) => [c.nom, c.entreprise].filter(Boolean))
      .map((n: any) => normaliser(n))

    const { tags: osmTags, keywords: osmKeywords } = await genererTagsOSM(prompt)

    return NextResponse.json({ existants, nomsConnus, osmTags, osmKeywords, rayon, position: { lat, lon } })
  } catch (error: any) {
    console.error('[prospection] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
