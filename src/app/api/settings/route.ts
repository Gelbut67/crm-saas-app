import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Récupérer un paramètre
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'La clé est requise' },
        { status: 400 }
      )
    }

    const setting = await prisma.settings.findUnique({
      where: { key }
    })

    if (!setting) {
      return NextResponse.json(
        { error: 'Paramètre non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      key: setting.key,
      value: JSON.parse(setting.value)
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du paramètre' },
      { status: 500 }
    )
  }
}

// POST - Créer ou mettre à jour un paramètre
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.key || !data.value) {
      return NextResponse.json(
        { error: 'La clé et la valeur sont requises' },
        { status: 400 }
      )
    }

    const setting = await prisma.settings.upsert({
      where: { key: data.key },
      update: {
        value: JSON.stringify(data.value)
      },
      create: {
        key: data.key,
        value: JSON.stringify(data.value)
      }
    })

    return NextResponse.json({
      key: setting.key,
      value: JSON.parse(setting.value)
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde du paramètre' },
      { status: 500 }
    )
  }
}
