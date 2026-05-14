import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const data = await request.json()
    const { nom, email, password, role } = data

    if (!nom || !email || !password) {
      return NextResponse.json(
        { error: 'Nom, email et mot de passe sont obligatoires' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        nom,
        email,
        password: hashedPassword,
        role: role || 'commercial',
        mustChangePassword: true,
      },
      select: { id: true, nom: true, email: true, role: true, dateCreation: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Erreur création utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    )
  }
}
