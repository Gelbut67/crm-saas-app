import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // filtre par type
    const search = searchParams.get('search') // recherche texte
    const sortBy = searchParams.get('sortBy') || 'date' // date | type | client
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      client: { userId: session.user.id }
    }

    if (type && type !== 'tous') {
      where.type = type
    }

    if (search) {
      where.OR = [
        { contenu: { contains: search, mode: 'insensitive' } },
        { client: { nom: { contains: search, mode: 'insensitive' } } },
        { client: { entreprise: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const orderBy: any =
      sortBy === 'type' ? { type: sortOrder } :
      sortBy === 'client' ? { client: { nom: sortOrder } } :
      { date: sortOrder }

    const [total, interactions] = await Promise.all([
      prisma.interaction.count({ where }),
      prisma.interaction.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              entreprise: true,
              statut: true,
            }
          }
        }
      })
    ])

    return NextResponse.json({
      interactions: interactions.map(i => ({
        ...i,
        date: i.date.toISOString()
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Erreur interactions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
