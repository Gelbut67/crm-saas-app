import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/crypto'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const accounts = await prisma.emailAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        fromEmail: true,
        fromName: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpSecure: true,
        imapHost: true,
        imapPort: true,
        imapUser: true,
        imapSecure: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ accounts })
  } catch (error: any) {
    console.error('[email accounts] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const {
      label,
      fromEmail,
      fromName,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      imapHost,
      imapPort,
      imapUser,
      imapPass,
      imapSecure,
      isDefault,
    } = body

    if (!label || !fromEmail || !smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'Champs SMTP requis manquants' }, { status: 400 })
    }

    // Si ce compte est défini par défaut, désactiver les autres
    if (isDefault) {
      await prisma.emailAccount.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false }
      })
    }

    const account = await prisma.emailAccount.create({
      data: {
        userId: session.user.id,
        label,
        fromEmail,
        fromName: fromName || '',
        smtpHost,
        smtpPort: parseInt(smtpPort),
        smtpUser,
        smtpPass: encrypt(smtpPass),
        smtpSecure: smtpSecure !== false,
        imapHost: imapHost || null,
        imapPort: imapPort ? parseInt(imapPort) : null,
        imapUser: imapUser || null,
        imapPass: imapPass ? encrypt(imapPass) : null,
        imapSecure: imapSecure !== false,
        isDefault: isDefault === true,
      }
    })

    return NextResponse.json({ account: { ...account, smtpPass: undefined, imapPass: undefined } })
  } catch (error: any) {
    console.error('[email accounts] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id, ...body } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const existing = await prisma.emailAccount.findFirst({
      where: { id, userId: session.user.id }
    })
    if (!existing) return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })

    if (body.isDefault) {
      await prisma.emailAccount.updateMany({
        where: { userId: session.user.id, NOT: { id } },
        data: { isDefault: false }
      })
    }

    const updateData: any = {
      label: body.label,
      fromEmail: body.fromEmail,
      fromName: body.fromName || '',
      smtpHost: body.smtpHost,
      smtpPort: parseInt(body.smtpPort),
      smtpUser: body.smtpUser,
      smtpSecure: body.smtpSecure !== false,
      imapHost: body.imapHost || null,
      imapPort: body.imapPort ? parseInt(body.imapPort) : null,
      imapUser: body.imapUser || null,
      imapSecure: body.imapSecure !== false,
      isDefault: body.isDefault === true,
    }

    if (body.smtpPass) updateData.smtpPass = encrypt(body.smtpPass)
    if (body.imapPass) updateData.imapPass = encrypt(body.imapPass)

    const account = await prisma.emailAccount.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ account: { ...account, smtpPass: undefined, imapPass: undefined } })
  } catch (error: any) {
    console.error('[email accounts] PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    await prisma.emailAccount.deleteMany({
      where: { id, userId: session.user.id }
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[email accounts] DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
