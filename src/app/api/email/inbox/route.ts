import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'
import { decrypt } from '@/lib/crypto'
import Imap from 'imap'
import { simpleParser } from 'mailparser'

export const maxDuration = 45

function openInbox(imap: Imap): Promise<void> {
  return new Promise((resolve, reject) => {
    imap.openBox('INBOX', true, (err, box) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const account = await prisma.emailAccount.findFirst({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    })

    if (!account || !account.imapHost || !account.imapPort || !account.imapUser || !account.imapPass) {
      return NextResponse.json({ error: 'Aucun compte IMAP configuré' }, { status: 400 })
    }

    const imap = new Imap({
      host: account.imapHost,
      port: account.imapPort,
      tls: account.imapSecure !== false,
      user: account.imapUser,
      password: decrypt(account.imapPass),
      connTimeout: 15000,
      authTimeout: 15000,
    })

    await new Promise<void>((resolve, reject) => {
      imap.once('ready', resolve)
      imap.once('error', reject)
      imap.connect()
    })

    await openInbox(imap)

    const messages: any[] = await new Promise((resolve, reject) => {
      const results: any[] = []
      imap.search(['UNSEEN', ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]], (err, uids) => {
        if (err) { reject(err); return }
        if (!uids || uids.length === 0) { resolve([]); return }
        const f = imap.fetch(uids.slice(-30), { bodies: '', struct: true })
        f.on('message', (msg, seqno) => {
          let body = ''
          msg.on('body', (stream, info) => {
            stream.on('data', chunk => body += chunk.toString('utf8'))
          })
          msg.once('end', async () => {
            try {
              const parsed = await simpleParser(body)
              const fromAddr = parsed.from as any
              const toAddrs = Array.isArray(parsed.to) ? parsed.to : [parsed.to]
              results.push({
                uid: uids[seqno - 1],
                messageId: parsed.messageId,
                from: fromAddr?.text || '',
                fromEmail: fromAddr?.value?.[0]?.address || '',
                to: toAddrs.map((a: any) => a?.text).filter(Boolean).join(', ') || '',
                subject: parsed.subject || '',
                date: parsed.date,
                text: parsed.text || '',
                html: parsed.html || '',
              })
            } catch (e) {
              console.warn('[inbox] parse error:', e)
            }
          })
        })
        f.once('error', reject)
        f.once('end', () => {
          setTimeout(() => resolve(results), 500)
        })
      })
    })

    imap.end()

    // Associer aux clients existants par email
    const clients = await prisma.client.findMany({
      where: { userId: session.user.id },
      include: { contacts: true }
    })

    const findClientId = (email: string) => {
      const e = email.toLowerCase().trim()
      for (const c of clients) {
        if (c.email?.toLowerCase().trim() === e) return c.id
        const contact = c.contacts.find(ct => ct.email?.toLowerCase().trim() === e)
        if (contact) return c.id
      }
      return null
    }

    const enriched = messages.map(m => ({
      ...m,
      clientId: findClientId(m.fromEmail)
    }))

    // Sauvegarder en EmailLog pour les nouveaux messages
    for (const m of enriched) {
      if (!m.messageId) continue
      const exists = await prisma.emailLog.findFirst({
        where: { externalId: m.messageId, userId: session.user.id }
      })
      if (!exists) {
        await prisma.emailLog.create({
          data: {
            userId: session.user.id,
            accountId: account.id,
            clientId: m.clientId,
            direction: 'inbound',
            subject: m.subject,
            body: m.text || m.html || '',
            to: account.fromEmail,
            fromEmail: m.fromEmail,
            status: 'received',
            externalId: m.messageId,
          }
        })
      }
    }

    return NextResponse.json({ messages: enriched })
  } catch (error: any) {
    console.error('[email inbox] error:', error)
    return NextResponse.json({ error: error.message || 'Erreur IMAP' }, { status: 500 })
  }
}
