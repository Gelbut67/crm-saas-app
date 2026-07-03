import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { decrypt } from '@/lib/crypto'
import nodemailer from 'nodemailer'

export const maxDuration = 60

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const campaigns = await prisma.emailCampaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { recipients: true } }
      }
    })

    return NextResponse.json({ campaigns })
  } catch (error: any) {
    console.error('[campaigns] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { name, subject, prompt, recipients, status } = await request.json()
    if (!name || !subject || !prompt || !recipients?.length) {
      return NextResponse.json({ error: 'Nom, sujet, prompt et destinataires requis' }, { status: 400 })
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        userId: session.user.id,
        name,
        subject,
        prompt,
        status: status || 'draft',
        total: recipients.length,
        recipients: {
          create: recipients.map((r: any) => ({
            clientId: r.clientId,
            email: r.email,
            status: 'pending'
          }))
        }
      }
    })

    return NextResponse.json({ campaign })
  } catch (error: any) {
    console.error('[campaigns] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await request.json()
    await prisma.emailCampaign.deleteMany({
      where: { id, userId: session.user.id }
    })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[campaigns] DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
