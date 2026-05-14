import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const devis = await prisma.devis.findMany({
      where: { client: { userId: session.user.id } },
      include: {
        client: true
      }
    })

    const csv = [
      'ID,Titre,Client,Montant,Statut,Date Création,Date Échéance',
      ...devis.map(devi => [
        devi.id,
        devi.titre || '',
        devi.client?.entreprise || devi.client?.nom || '',
        devi.montant || 0,
        devi.statut || '',
        devi.dateCreation.toISOString().split('T')[0],
        devi.dateEcheance.toISOString().split('T')[0]
      ].join(','))
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="devis_export.csv"'
      }
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export' },
      { status: 500 }
    )
  }
}
