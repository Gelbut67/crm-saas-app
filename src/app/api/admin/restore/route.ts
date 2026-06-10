import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getAuthSession()
  if (!session || !session.user.impersonatedBy) {
    return NextResponse.json({ error: 'Pas en mode impersonation' }, { status: 400 })
  }

  const adminId = session.user.impersonatedBy
  const admin = await prisma.user.findUnique({ where: { id: adminId } })
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Admin introuvable' }, { status: 404 })
  }

  const slot = Math.floor(Date.now() / 300000)
  const token = createHmac('sha256', process.env.NEXTAUTH_SECRET!)
    .update(`restore:${adminId}:${slot}`)
    .digest('hex')

  return NextResponse.json({ token, adminId })
}
