import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const data = await request.json()

    const reminder = await (prisma as any).reminder.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: {
        ...(data.titre !== undefined && { titre: data.titre.trim() }),
        ...(data.contenu !== undefined && { contenu: data.contenu?.trim() || null }),
        ...(data.echeance !== undefined && { echeance: new Date(data.echeance) }),
        ...(data.fait !== undefined && { fait: data.fait }),
        ...(data.notificationsAt !== undefined && {
          notificationsAt: data.notificationsAt?.length ? JSON.stringify(data.notificationsAt) : null,
        }),
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur reminder PUT:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    await (prisma as any).reminder.deleteMany({
      where: { id: params.id, userId: session.user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur reminder DELETE:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
