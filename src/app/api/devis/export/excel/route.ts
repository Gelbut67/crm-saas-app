import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    const devis = await prisma.devis.findMany({
      include: {
        client: true
      }
    })

    const data = devis.map(devi => ({
      ID: devi.id,
      Titre: devi.titre || '',
      Client: devi.client?.entreprise || devi.client?.nom || '',
      Montant: devi.montant || 0,
      Statut: devi.statut || '',
      'Date Création': devi.dateCreation.toISOString().split('T')[0],
      'Date Échéance': devi.dateEcheance.toISOString().split('T')[0]
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'Devis')
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="devis_export.xlsx"'
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
