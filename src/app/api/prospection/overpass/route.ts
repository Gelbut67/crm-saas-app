import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export const maxDuration = 55

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
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
        const t = setTimeout(() => ctrl.abort(), 22000)
        const encoded = encodeURIComponent(query)
        const res = await fetch(`${url}?data=${encoded}`, { signal: ctrl.signal })
        clearTimeout(t)
        if (res.ok) {
          const data = await res.json()
          console.log('[overpass proxy]', url, '->', data.elements?.length ?? 0, 'elements')
          return NextResponse.json({ elements: data.elements || [], ok: true })
        }
        console.warn('[overpass proxy] status', res.status, url)
      } catch (e: any) {
        console.warn('[overpass proxy] error', url, e?.message?.slice(0, 60))
      }
    }

    return NextResponse.json({ elements: [], ok: false, error: 'mirrors_failed' })
  } catch (e: any) {
    return NextResponse.json({ elements: [], ok: false, error: e.message }, { status: 500 })
  }
}
