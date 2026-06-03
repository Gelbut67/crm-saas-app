import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const KEYS = [
  'devis_societe_nom', 'devis_societe_tagline', 'devis_societe_adresse',
  'devis_societe_code_postal', 'devis_societe_ville', 'devis_societe_siret',
  'devis_societe_telephone', 'devis_societe_mobile', 'devis_societe_email',
  'devis_societe_nom_commercial', 'devis_societe_iban', 'devis_societe_logo_url',
  'devis_ville_emission', 'devis_texte_footer', 'devis_texte_introduction',
  'devis_numero_suivant',
]

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const settings = await prisma.settings.findMany({
      where: { userId: session.user.id, key: { in: KEYS } },
    })

    const result: Record<string, string> = {}
    for (const s of settings) result[s.key] = s.value
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur GET parametres devis:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const data: Record<string, string> = await request.json()

    for (const [key, value] of Object.entries(data)) {
      if (!KEYS.includes(key)) continue
      await prisma.settings.upsert({
        where: { key_userId: { key, userId: session.user.id } },
        update: { value },
        create: { key, value, userId: session.user.id },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur POST parametres devis:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
