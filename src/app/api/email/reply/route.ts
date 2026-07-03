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

    const { inboundId, prompt, subject, to, originalBody, clientId } = await request.json()

    // Récupérer le message original si inboundId fourni
    let original: any = null
    if (inboundId) {
      original = await prisma.emailLog.findFirst({
        where: { id: inboundId, userId: session.user.id, direction: 'inbound' }
      })
    }

    const client = clientId ? await prisma.client.findFirst({
      where: { id: clientId, userId: session.user.id },
      include: { contacts: true }
    }) : null

    const contact = client?.contacts?.find(c => c.isPrincipal) || client?.contacts?.[0]
    const nomContact = contact?.nom || client?.nom || client?.entreprise || 'Madame, Monsieur'
    const entreprise = client?.entreprise || client?.nom || ''
    const secteur = client?.secteur || ''
    const originalText = original?.body || originalBody || ''
    const originalSubject = original?.subject || subject || 'RE: ...'
    const dest = to || original?.fromEmail || client?.email || contact?.email

    if (!dest) return NextResponse.json({ error: 'Destinataire inconnu' }, { status: 400 })

    const signatureSetting = await prisma.settings.findFirst({
      where: { userId: session.user.id, key: 'signatureEmail' }
    })
    const signature = signatureSetting?.value || ''

    let replyBody = ''

    if (process.env.GROQ_API_KEY) {
      const ctx = [
        `Tu réponds à un email professionnel en français. Rédige une réponse complète, structurée et utile (150 à 300 mots).`,
        `Destinataire : ${nomContact} ${entreprise ? `(${entreprise})` : ''}`,
        `Secteur : ${secteur}`,
        `Sujet original : ${originalSubject}`,
        `Email reçu :`,
        originalText.slice(0, 2500),
        `\nInstructions du commercial : ${prompt || 'Réponds de manière professionnelle, structurée et utile, en citant les points clés du message original.'}`,
        `\nSTRUCTURE DE LA RÉPONSE :`,
        `1. Accuse réception et reformule la demande du client en 1 phrase.`,
        `2. Apporte une réponse concrète, personnalisée et argumentée.`,
        `3. Si pertinent, propose la suite / un rendez-vous / une démo.`,
        `4. Formule de politesse + signature : ${signature || 'Cordialement, [ton nom]'}`,
        `\nRÈGLES : ton professionnel et chaleureux, pas de formule creuse, pas d'emoji, un seul appel à l'action.`,
        `Réponds UNIQUEMENT avec ce JSON : {"objet":"","corps":""}`
      ].join('\n')

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: ctx }],
          response_format: { type: 'json_object' },
          temperature: 0.6,
          max_tokens: 4096
        })
      })
      if (res.ok) {
        const data = await res.json()
        const generated = JSON.parse(data.choices[0].message.content)
        replyBody = generated.corps || ''
      }
    }

    if (!replyBody) {
      replyBody = `Bonjour ${nomContact},\n\nMerci pour votre retour. J'ai bien pris note de votre demande et je reviens vers vous très rapidement avec une réponse détaillée.\n\nN'hésitez pas si vous avez des précisions à apporter d'ici là.\n\n${signature || 'Cordialement,'}`
    }

    const finalSubject = `RE: ${originalSubject.replace(/^RE:\s*/i, '')}`

    return NextResponse.json({
      to: dest,
      subject: finalSubject,
      body: replyBody,
      inboundId: original?.id,
      clientId: client?.id,
      aiGenerated: true,
      aiPrompt: prompt,
    })
  } catch (error: any) {
    console.error('[email reply] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // Envoyer la réponse générée
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { inboundId, clientId, to, subject, body, accountId } = await request.json()

    let account = null
    if (accountId) account = await prisma.emailAccount.findFirst({ where: { id: accountId, userId: session.user.id } })
    if (!account) account = await prisma.emailAccount.findFirst({ where: { userId: session.user.id, isDefault: true } })
    if (!account) account = await prisma.emailAccount.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' } })
    if (!account) return NextResponse.json({ error: 'Aucun compte email' }, { status: 400 })

    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure,
      auth: { user: account.smtpUser, pass: decrypt(account.smtpPass) }
    })

    await transporter.verify()

    const info = await transporter.sendMail({
      from: { name: account.fromName || account.fromEmail, address: account.fromEmail },
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br/>')
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
        aiGenerated: true,
        sentAt: new Date()
      }
    })

    if (inboundId) {
      await prisma.emailLog.update({
        where: { id: inboundId },
        data: { status: 'replied' }
      })
    }

    return NextResponse.json({ ok: true, messageId: info.messageId, logId: log.id })
  } catch (error: any) {
    console.error('[email reply send] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
