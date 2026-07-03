import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { decrypt } from '@/lib/crypto'
import nodemailer from 'nodemailer'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { clientId, accountId, to, subject, body, aiGenerated, aiPrompt } = await request.json()
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Destinataire, objet et corps requis' }, { status: 400 })
    }

    let account = null
    if (accountId) {
      account = await prisma.emailAccount.findFirst({
        where: { id: accountId, userId: session.user.id }
      })
    }
    if (!account) {
      account = await prisma.emailAccount.findFirst({
        where: { userId: session.user.id, isDefault: true }
      })
    }
    if (!account) {
      account = await prisma.emailAccount.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
      })
    }
    if (!account) {
      return NextResponse.json({ error: 'Aucun compte email configuré' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure,
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: account.smtpUser,
        pass: decrypt(account.smtpPass),
      },
    })

    await transporter.verify()

    const info = await transporter.sendMail({
      from: {
        name: account.fromName || account.fromEmail,
        address: account.fromEmail,
      },
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br/>'),
    })

    const log = await prisma.emailLog.create({
      data: {
        userId: session.user.id,
        accountId: account.id,
        clientId: clientId || null,
        direction: 'outbound',
        subject,
        body,
        to,
        fromEmail: account.fromEmail,
        status: 'sent',
        aiGenerated: aiGenerated === true,
        aiPrompt: aiPrompt || null,
        sentAt: new Date(),
      }
    })

    return NextResponse.json({ ok: true, messageId: info.messageId, logId: log.id })
  } catch (error: any) {
    console.error('[email send] error:', error)
    return NextResponse.json({ error: error.message || 'Erreur envoi email' }, { status: 500 })
  }
}
