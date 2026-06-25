import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAuthSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'GEMINI_API_KEY absente du fichier .env' })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-001', 'gemini-1.5-flash']
    const errors: any[] = []

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent('Réponds uniquement par le mot: OK')
        const text = result.response.text().trim()
        return NextResponse.json({
          ok: true,
          model: modelName,
          reponse: text,
          message: `Clé Gemini fonctionnelle ✓ (modèle: ${modelName})`
        })
      } catch (err: any) {
        errors.push({ model: modelName, status: err?.status, error: err?.message?.slice(0, 120) })
      }
    }

    return NextResponse.json({ ok: false, message: 'Aucun modèle disponible', errors })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || String(error),
      status: error?.status
    })
  }
}
