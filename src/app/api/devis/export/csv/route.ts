import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const devis = await prisma.devis.findMany({
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
