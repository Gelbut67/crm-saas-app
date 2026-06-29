import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export const maxDuration = 30

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractMeta(html: string, prop: string): string {
  const pats = [
    new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${prop}["']`, 'i'),
    new RegExp(`<meta[^>]*name=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${prop}["']`, 'i'),
  ]
  for (const p of pats) {
    const m = html.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function extractJsonLd(html: string): any {
  const TYPES = ['Organization','LocalBusiness','Store','Restaurant','Hotel','Corporation',
    'FoodEstablishment','Winery','Bakery','BarOrPub','Brewery','ProfessionalService']
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1])
      const arr = Array.isArray(data) ? data : [data]
      for (const item of arr) {
        const t = item['@type'] || ''
        if (TYPES.some(bt => (Array.isArray(t) ? t : [t]).includes(bt))) return item
      }
    } catch {}
  }
  return null
}

// Extraire le contenu du footer et des sections contact
function extractContactSections(html: string): string {
  const parts: string[] = []

  // Footer
  const footer = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i)
  if (footer) parts.push(stripHtml(footer[1]))

  // Sections avec class/id contenant "contact", "adresse", "address", "coordonnees", "footer"
  const sectionRe = /(?:id|class)=["'][^"']*(?:contact|adresse|address|coordonnees|footer|pied)[^"']*["'][^>]*>([\s\S]{20,800}?)(?=<(?:div|section|footer|article|aside|nav|header)\b|$)/gi
  let sm: RegExpExecArray | null
  while ((sm = sectionRe.exec(html)) !== null) {
    parts.push(stripHtml(sm[1]))
  }

  return parts.join(' ').slice(0, 2000)
}

function extractPhone(text: string): string {
  const m = text.match(/(?:\+33[\s.\-]?|0)[1-9](?:[\s.\-]?\d{2}){4}/)
  return m ? m[0].replace(/[\s.\-]/g, ' ').trim() : ''
}

function extractEmail(text: string): string {
  const m = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  return m ? m[0] : ''
}

function extractAddress(text: string): { adresse: string; ville: string; codePostal: string } {
  // Adresse complète : numéro + type de voie + nom + CP + ville
  const streetTypes = 'rue|avenue|av\\.?|boulevard|bd\\.?|allée|place|impasse|chemin|route|voie|passage|cité|villa|lieu[- ]dit|zone|parc|domaine|résidence|square|cours|quai|esplanade|promenade|hameau|mas|ferme'
  const full = new RegExp(
    `(\\d{1,4}[, ]+(?:${streetTypes})[^,\\n\\r<]{3,60})[,\\s]+([0-9]{5})[,\\s]+([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\\s\\-]{2,35})`,
    'i'
  )
  const m1 = text.match(full)
  if (m1) return { adresse: m1[1].trim(), codePostal: m1[2], ville: m1[3].trim().replace(/\s+/g, ' ') }

  // CP + ville seuls
  const m2 = text.match(/\b([0-9]{5})\b[\s,\-]+([A-ZÀ-Ÿ][a-zA-ZÀ-ÿ\s\-]{2,35})/)
  if (m2) return { adresse: '', codePostal: m2[1], ville: m2[2].trim().replace(/\s+/g, ' ') }

  return { adresse: '', ville: '', codePostal: '' }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { url } = await request.json()
    if (!url?.trim()) return NextResponse.json({ error: 'URL requise' }, { status: 400 })

    const targetUrl = url.startsWith('http') ? url : `https://${url}`

    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 12000)
    let html = ''
    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
        signal: ctrl.signal,
      })
      clearTimeout(t)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.text()
      html = raw.length > 120000 ? raw.slice(0, 120000) : raw
    } catch (e: any) {
      return NextResponse.json({ error: `Impossible d'accéder au site : ${e.message}` }, { status: 422 })
    }

    // Métadonnées
    const pageTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''
    const ogSiteName = extractMeta(html, 'og:site_name')
    const ogTitle = extractMeta(html, 'og:title')
    const ogDesc = extractMeta(html, 'og:description')
    const metaDesc = extractMeta(html, 'description') || ogDesc
    const jsonLd = extractJsonLd(html)

    // Texte : début + footer/contact (là où les adresses se trouvent)
    const fullText = stripHtml(html)
    const contactText = extractContactSections(html)
    const plainText = fullText.slice(0, 3000)
    // Texte enrichi pour l'extraction : début + sections contact + fin du texte (footer)
    const richText = [plainText, contactText, fullText.slice(-2000)].join('\n---\n')

    // Extraction de base
    let nom = jsonLd?.name || ogSiteName || ogTitle?.split(/[|\-–]/)[0]?.trim() || pageTitle?.split(/[|\-–]/)[0]?.trim() || ''
    let telephone = jsonLd?.telephone || extractPhone(richText)
    let email = jsonLd?.email || extractEmail(richText)
    let adresse = ''
    let ville = ''
    let codePostal = ''
    let secteur = ''

    // JSON-LD address (priorité)
    if (jsonLd?.address) {
      const a = typeof jsonLd.address === 'string' ? {} : jsonLd.address
      adresse = a.streetAddress || ''
      ville = a.addressLocality || ''
      codePostal = a.postalCode || ''
    }

    // Regex address (si JSON-LD incomplet)
    if (!adresse && !ville) {
      const extracted = extractAddress(richText)
      adresse = extracted.adresse
      ville = extracted.ville
      codePostal = extracted.codePostal
    }

    // Groq enrichissement — inclut sections contact + footer
    if (process.env.GROQ_API_KEY) {
      try {
        const ctx = [
          `URL: ${targetUrl}`,
          `Titre: ${pageTitle}`,
          `Description: ${metaDesc}`,
          `--- TEXTE PAGE (début) ---`,
          fullText.slice(0, 1500),
          `--- SECTIONS CONTACT / FOOTER ---`,
          contactText || fullText.slice(-1500),
        ].join('\n')

        const gr = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{
              role: 'user',
              content: `Tu analyses le contenu d'un site web d'entreprise. Extrais ces informations PRECISEMENT. L'adresse est souvent dans le footer ou la section contact.\n\n${ctx}\n\nRéponds UNIQUEMENT avec ce JSON (chaine vide si vraiment inconnu, NE PAS inventer):\n{"nom":"","secteur":"","telephone":"","email":"","adresse":"","ville":"","codePostal":"","description":""}\n\nPour secteur: Agroalimentaire, Agriculture, Viticulture, Apiculture, Brasserie-Distillerie, Hôtellerie-Restauration, Commerce de détail, Artisanat, BTP-Construction, Transport-Logistique, Services aux entreprises, Industrie, Santé, IT-Numérique, ou autre pertinent.`
            }],
            response_format: { type: 'json_object' },
            temperature: 0.1
          })
        })
        if (gr.ok) {
          const gd = await gr.json()
          const ex = JSON.parse(gd.choices[0].message.content)
          if (ex.nom) nom = ex.nom
          if (ex.secteur) secteur = ex.secteur
          if (!telephone && ex.telephone) telephone = ex.telephone
          if (!email && ex.email) email = ex.email
          if (!adresse && ex.adresse) adresse = ex.adresse
          if (!ville && ex.ville) ville = ex.ville
          if (!codePostal && ex.codePostal) codePostal = ex.codePostal
        }
      } catch (e) {
        console.warn('[import-url] Groq failed:', e)
      }
    }

    return NextResponse.json({
      nom: nom.slice(0, 100),
      entreprise: nom.slice(0, 100),
      website: targetUrl,
      telephone: telephone.slice(0, 30),
      email: email.slice(0, 100),
      adresse: adresse.slice(0, 200),
      ville: ville.slice(0, 100),
      codePostal: codePostal.slice(0, 10),
      secteur: secteur.slice(0, 100),
      description: metaDesc.slice(0, 500),
    })
  } catch (error: any) {
    console.error('[import-url] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
