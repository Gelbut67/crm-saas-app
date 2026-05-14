import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getAuthSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { currentPassword, newPassword, isForced } = await request.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Nouveau mot de passe trop court (6 caractères min)' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    if (!isForced) {
      if (!currentPassword) return NextResponse.json({ error: 'Mot de passe actuel requis' }, { status: 400 })
      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed, mustChangePassword: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
