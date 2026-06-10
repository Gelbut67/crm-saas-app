import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { targetUserId } = await request.json()
  if (!targetUserId) return NextResponse.json({ error: 'Cible manquante' }, { status: 400 })

  const target = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!target) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const slot = Math.floor(Date.now() / 300000)
  const token = createHmac('sha256', process.env.NEXTAUTH_SECRET!)
    .update(`${session.user.id}:${targetUserId}:${slot}`)
    .digest('hex')

  return NextResponse.json({ token, adminId: session.user.id })
}
