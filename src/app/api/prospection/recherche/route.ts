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

const SEMANTIC_FALLBACK: Record<string, string[]> = {
  miel: ['miel','honey','apiculteur','apiculture','ruche','miellerie','apicole','abeille','beekeeper','propolis'],
  apiculteur: ['apiculteur','apiculture','miel','honey','ruche','miellerie','apicole','abeille','beekeeper'],
  biere: ['biere','beer','brasserie','brasseur','brewery','houblon','malt','malterie','ale','lager','craft'],
  brasserie: ['brasserie','brasseur','biere','beer','brewery','houblon','malt','microbrasserie'],
  vin: ['vin','wine','vigneron','vignoble','cave','winery','domaine','chateau','caviste','viticulture'],
  vigneron: ['vigneron','vignoble','vin','wine','cave','winery','domaine','viticulture'],
  fromage: ['fromage','fromager','fromagerie','cheese','laiterie','lait','dairy'],
  ferme: ['ferme','farm','agriculteur','agriculture','maraicher','eleveur','paysan','bio'],
  boulanger: ['boulanger','boulangerie','pain','bakery','patisserie','artisan','levain'],
  boucher: ['boucher','boucherie','viande','charcutier','charcuterie','butcher','carnivore'],
  restaurant: ['restaurant','brasserie','bistrot','cafe','eatery','traiteur','cuisine','gastronomie'],
  epicerie: ['epicerie','superette','alimentation','grocery','commerce'],
  charcutier: ['charcutier','charcuterie','boucher','boucherie','viande','jambon','saucisse'],
  chocolatier: ['chocolatier','chocolaterie','chocolate','confiseur','confiserie','patisserie'],
  poissonnier: ['poissonnier','poissonnerie','poisson','fish','fruits de mer','seafood'],
}

async function genererTagsOSM(prompt: string): Promise<{ tags: {key:string,value:string}[], keywords: string[] }> {
  if (!prompt.trim()) return { tags: [], keywords: [] }

  // Fallback semantique local (sans Groq)
  const promptNorm = prompt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const fallbackKws = SEMANTIC_FALLBACK[promptNorm] || prompt.split(/\s+/).filter((w: string) => w.length > 2)

  if (!process.env.GROQ_API_KEY) {
    return { tags: [], keywords: fallbackKws }
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Tu es expert en semantique commerciale et OpenStreetMap. L'utilisateur cherche: "${prompt}"\n\nGenere le CHAMP SEMANTIQUE COMPLET: tous les mots (fr+en) designant les memes metiers, produits, lieux associes. "miel" et "apiculteur" doivent generer les MEMES mots cles car ils appartiennent au meme univers.\n\nRegles:\n- minimum 15 mots-cles varies (metiers, produits, lieux, synonymes, anglais)\n- tags OSM les plus pertinents\n\nExemples:\n- "miel" ou "apiculteur" => tags:[craft=beekeeper,shop=honey], keywords:[miel,honey,apiculteur,apiculture,apicole,ruche,rucher,miellerie,abeille,beekeeper,apiary,propolis,cire,pollen,gelée royale,mellification,apiariste]\n- "biere" ou "brasserie" ou "brasseur" => tags:[craft=brewery,shop=beer,amenity=bar], keywords:[biere,beer,brasserie,brasseur,brewery,microbrasserie,houblon,malt,malterie,brassage,craft,ale,lager,ipa,stout,levure,fermentation,bieriste]\n- "vin" ou "vigneron" ou "cave" => tags:[craft=winery,shop=wine,amenity=winery], keywords:[vin,wine,vigneron,vignoble,cave,winery,domaine,chateau,cepage,vendange,vinification,sommelier,caviste,viticulture,millesime]\n- "boulanger" ou "boulangerie" ou "pain" => tags:[shop=bakery,craft=baker], keywords:[boulangerie,boulanger,pain,bakery,patisserie,viennoiserie,farine,levain,brioche,croissant,baker,artisan]\n\nReponds UNIQUEMENT avec JSON:\n{"tags":[{"key":"craft","value":"beekeeper"},{"key":"shop","value":"honey"}],"keywords":["mot1","mot2","mot3"...]}`
        }],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    })
    if (!res.ok) throw new Error('groq error')
    const data = await res.json()
    const result = JSON.parse(data.choices[0].message.content)
    const kws: string[] = (result.keywords || []).filter((k: string) => k.length > 2)
    console.log('[prospection] Groq keywords for "' + prompt + '":', kws.slice(0, 8).join(', ') + '...')
    return { tags: result.tags || [], keywords: kws }
  } catch (e) {
    console.warn('[prospection] Groq fallback:', e)
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

