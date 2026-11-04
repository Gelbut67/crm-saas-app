import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    if (!process.env.XAI_API_KEY && !process.env.GROQ_API_KEY) {
      return NextResponse.json({ ok: false, error: 'XAI_API_KEY (ou GROQ_API_KEY) absente du fichier .env' })
    }

    const errors: any[] = []

    if (process.env.XAI_API_KEY) {
      const model = process.env.GROK_MODEL || 'grok-4.3'
      try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.XAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Réponds uniquement: OK' }] })
        })
        const data = await res.json()
        if (res.ok) {
          return NextResponse.json({ ok: true, provider: 'Grok', model, reponse: data.choices?.[0]?.message?.content?.trim(), message: `✓ Grok (${model}) fonctionne` })
        }
        errors.push({ provider: 'Grok', model, status: res.status, error: (data?.error?.message || data?.error || '').toString().slice(0, 120) })
      } catch (err: any) {
        errors.push({ provider: 'Grok', error: err?.message?.slice(0, 80) })
      }
    }

    if (process.env.GROQ_API_KEY) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Réponds uniquement: OK' }], max_tokens: 5 })
        })
        const data = await res.json()
        if (res.ok) {
          return NextResponse.json({ ok: true, provider: 'Groq', model: 'llama-3.3-70b-versatile', reponse: data.choices?.[0]?.message?.content?.trim(), message: '✓ Groq fonctionne (gratuit, 14 400 req/jour)', errors })
        }
        errors.push({ provider: 'Groq', status: res.status, error: data?.error?.message?.slice(0, 120) })
      } catch (err: any) {
        errors.push({ provider: 'Groq', error: err?.message?.slice(0, 80) })
      }
    }

    return NextResponse.json({ ok: false, message: 'Aucun fournisseur IA disponible', errors })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message }, { status: 500 })
  }
}
