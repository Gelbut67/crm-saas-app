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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent('Réponds uniquement par le mot: OK')
    const text = result.response.text().trim()

    return NextResponse.json({
      ok: true,
      model: 'gemini-2.0-flash',
      reponse: text,
      message: 'Clé Gemini fonctionnelle ✓'
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || String(error),
      status: error?.status,
      hint: error?.status === 404
        ? 'Modèle introuvable — essayer gemini-1.5-flash-latest ou vérifier les droits de la clé'
        : error?.status === 403 || error?.status === 401
        ? 'Clé API invalide ou sans accès à ce modèle'
        : 'Erreur inattendue'
    })
  }
}
