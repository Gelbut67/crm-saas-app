import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export const maxDuration = 55

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const { query } = await request.json()
    if (!query) return NextResponse.json({ elements: [] })

    for (const url of MIRRORS) {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 25000)
        // GET avec data= est le mode le plus fiable pour Overpass
        const res = await fetch(`${url}?data=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        clearTimeout(t)
        if (res.ok) {
          const data = await res.json()
          console.log('[overpass proxy]', url, '->', data.elements?.length, 'elements')
          return NextResponse.json(data)
        }
        console.warn('[overpass proxy] non-ok', url, res.status)
      } catch (e: any) {
        console.warn('[overpass proxy] error', url, e?.message?.slice(0, 80))
      }
    }

    return NextResponse.json({ elements: [], error: 'all mirrors failed' })
  } catch (e: any) {
    console.error('[overpass proxy] fatal', e)
    return NextResponse.json({ elements: [], error: e.message }, { status: 500 })
  }
}
