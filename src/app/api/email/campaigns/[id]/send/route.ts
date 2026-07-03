import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { decrypt } from '@/lib/crypto'
import nodemailer from 'nodemailer'

export const maxDuration = 60

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const campaignId = params.id
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: campaignId, userId: session.user.id },
      include: {
        recipients: {
          where: { status: 'pending' },
          include: { client: { include: { contacts: true } } }
        }
      }
    })

    if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

    const account = await prisma.emailAccount.findFirst({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    })
    if (!account) return NextResponse.json({ error: 'Aucun compte email' }, { status: 400 })

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'sending' }
    })

    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure,
      auth: { user: account.smtpUser, pass: decrypt(account.smtpPass) }
    })

    let sent = 0
    let failed = 0

    for (const recipient of campaign.recipients) {
      const client = recipient.client
      const contact = client.contacts?.find(c => c.isPrincipal) || client.contacts?.[0]
      const nom = contact?.nom || client.nom || client.entreprise || 'Madame, Monsieur'
      const entreprise = client.entreprise || client.nom || ''
      const ville = client.ville || ''
      const secteur = client.secteur || ''

      let body = campaign.prompt
      let subject = campaign.subject

      // Générer avec Groq si clé présente
      if (process.env.GROQ_API_KEY) {
        try {
          const ctx = [
            `Tu es un commercial B2B. Rédige un email personnalisé en français.`,
            `Destinataire : ${nom}`,
            `Entreprise : ${entreprise}`,
            `Secteur : ${secteur}`,
            `Ville : ${ville}`,
            `Sujet demandé : ${campaign.subject}`,
            `Instructions : ${campaign.prompt}`,
            `Règles : email professionnel, 3-5 paragraphes, personnalisé, appel à l'action clair.`,
            `Réponds UNIQUEMENT avec JSON : {"objet":"","corps":""}`
          ].join('\n')

          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: ctx }],
              response_format: { type: 'json_object' },
              temperature: 0.7
            })
          })
          if (res.ok) {
            const data = await res.json()
            const generated = JSON.parse(data.choices[0].message.content)
            subject = generated.objet || subject
            body = generated.corps || body
          }
        } catch (e) {
          console.warn('[campaign] Groq failed for recipient', recipient.id, e)
        }
      }

      try {
        await transporter.sendMail({
          from: { name: account.fromName || account.fromEmail, address: account.fromEmail },
          to: recipient.email,
          subject,
          text: body,
          html: body.replace(/\n/g, '<br/>')
        })

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'sent', sentAt: new Date() }
        })

        await prisma.emailLog.create({
          data: {
            userId: session.user.id,
            accountId: account.id,
            clientId: client.id,
            campaignId: campaign.id,
            direction: 'outbound',
            subject,
            body,
            to: recipient.email,
            fromEmail: account.fromEmail,
            status: 'sent',
            aiGenerated: true,
            aiPrompt: campaign.prompt,
            sentAt: new Date()
          }
        })

        sent++
      } catch (e: any) {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'failed', error: e.message }
        })
        failed++
      }
    }

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'sent',
        sent: { increment: sent },
        failed: { increment: failed },
        sentAt: new Date()
      }
    })

    return NextResponse.json({ ok: true, sent, failed })
  } catch (error: any) {
    console.error('[campaign send] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
