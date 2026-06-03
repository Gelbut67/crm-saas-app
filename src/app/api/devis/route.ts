import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

// Désactiver le cache pour cette route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Récupérer tous les devis
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const devis = await prisma.devis.findMany({
      where: { client: { userId: session.user.id } },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            entreprise: true,
            email: true,
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    // Formater pour le frontend
    const formattedDevis = devis.map(devi => ({
      ...devi,
      dateCreation: devi.dateCreation.toISOString(),
      dateEcheance: devi.dateEcheance.toISOString()
    }))

    return NextResponse.json(formattedDevis, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des devis' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau devis
export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const data = await request.json()
    
    // Auto-incrémenter le numéro de devis
    let numero = data.numero
    if (!numero) {
      const session2 = await getAuthSession()
      const setting = session2 ? await prisma.settings.findFirst({
        where: { key: 'devis_numero_suivant', userId: session2.user.id }
      }) : null
      const current = parseInt(setting?.value || '100001')
      numero = String(current)
      const nextVal = String(current + 1)
      if (session2) {
        await prisma.settings.upsert({
          where: { key_userId: { key: 'devis_numero_suivant', userId: session2.user.id } },
          update: { value: nextVal },
          create: { key: 'devis_numero_suivant', value: nextVal, userId: session2.user.id },
        })
      }
    }

    const devis = await prisma.devis.create({
      data: {
        clientId: data.clientId,
        titre: data.titre || data.objet || 'Devis',
        montant: parseFloat(data.montant) || 0,
        statut: data.statut || 'en_cours',
        dateEcheance: new Date(data.dateEcheance || Date.now() + 30 * 86400000),
        description: data.description || null,
        dateCreation: new Date(),
        numero,
        objet: data.objet || null,
        civilite: data.civilite || null,
        lignes: data.lignes || null,
        delai: data.delai || null,
        livraison: data.livraison || null,
        conditionsPaiement: data.conditionsPaiement || null,
        validite: data.validite || null,
      },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            entreprise: true,
          }
        }
      }
    })

    return NextResponse.json(devis)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du devis' },
      { status: 500 }
    )
  }
}
