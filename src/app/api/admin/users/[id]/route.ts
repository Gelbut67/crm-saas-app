import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getAuthSession } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { password } = await request.json()
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Mot de passe trop court (6 caractères min)' }, { status: 400 })
    }
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashed, mustChangePassword: true },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      )
    }

    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
