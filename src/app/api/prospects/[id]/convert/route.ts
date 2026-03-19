import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Convertir un prospect en client
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier que le prospect existe
    const prospect = await prisma.client.findUnique({
      where: { 
        id: params.id,
        statut: 'prospect'
      }
    })

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      )
    }

    // Convertir en client
    const client = await prisma.client.update({
      where: { id: params.id },
      data: { 
        statut: 'client',
        caTotal: 0
      }
    })

    return NextResponse.json({
      success: true,
      client
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la conversion du prospect' },
      { status: 500 }
    )
  }
}
