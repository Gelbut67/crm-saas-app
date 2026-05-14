import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { getAuthSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const clients = await prisma.client.findMany({
      where: {
        statut: 'client',
        userId: session.user.id,
      },
      include: {
        contacts: true
      }
    })

    const data = clients.map(client => ({
      ID: client.id,
      Nom: client.nom || '',
      Entreprise: client.entreprise || '',
      Secteur: client.secteur || '',
      Email: client.email || '',
      Téléphone: client.telephone || '',
      'CA Total': client.caTotal || 0,
      'Date Création': client.dateCreation.toISOString().split('T')[0],
      Contacts: client.contacts.map(c => c.nom).join('; ')
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'Clients')
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="clients_export.xlsx"'
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
