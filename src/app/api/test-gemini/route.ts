import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'GEMINI_API_KEY absente du fichier .env' })
    }

    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']
    const errors: any[] = []

    for (const modelName of models) {
      for (const apiVersion of ['v1', 'v1beta']) {
        try {
          const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Réponds uniquement par le mot: OK' }] }] })
          })
          const data = await res.json()
          if (res.ok) {
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
            return NextResponse.json({ ok: true, model: modelName, apiVersion, reponse: text, message: `✓ ${modelName} (${apiVersion})` })
          }
          errors.push({ model: modelName, apiVersion, status: res.status, error: data?.error?.message?.slice(0, 120) })
        } catch (err: any) {
          errors.push({ model: modelName, error: err?.message?.slice(0, 80) })
        }
      }
    }

    // Lister les modèles réellement disponibles pour cette clé
    let modelsDisponibles: string[] = []
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
      const listData = await listRes.json()
      modelsDisponibles = (listData.models || []).map((m: any) => m.name)
    } catch {}

    return NextResponse.json({ ok: false, message: 'Aucun modèle disponible', errors, modelsDisponibles })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || String(error),
      status: error?.status
    })
  }
}
