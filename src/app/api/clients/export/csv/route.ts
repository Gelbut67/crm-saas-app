import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    const csv = [
      'ID,Nom,Entreprise,Secteur,Email,Téléphone,CA Total,Date Création,Contacts',
      ...clients.map(client => [
        client.id,
        client.nom || '',
        client.entreprise || '',
        client.secteur || '',
        client.email || '',
        client.telephone || '',
        client.caTotal || 0,
        client.dateCreation.toISOString().split('T')[0],
        client.contacts.map(c => c.nom).join(';')
      ].join(','))
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="clients_export.csv"'
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
