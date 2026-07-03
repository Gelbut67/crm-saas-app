import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { clientId, prompt, object, contexte } = await request.json()
    if (!clientId) return NextResponse.json({ error: 'clientId requis' }, { status: 400 })

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: session.user.id },
      include: { contacts: true }
    })
    if (!client) return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })

    const contactPrincipal = client.contacts.find(c => c.isPrincipal) || client.contacts[0]
    const nomContact = contactPrincipal?.nom || client.nom || client.entreprise || 'Madame, Monsieur'
    const entreprise = client.entreprise || client.nom || ''
    const secteur = client.secteur || ''
    const ville = client.ville || ''

    const systemPrompt = `Tu es un commercial B2B expert. Tu rédiges un email professionnel en français, chaleureux mais pas trop familier, destiné à un prospect ou client.\n\nInfos du destinataire :\n- Nom contact : ${nomContact}\n- Entreprise : ${entreprise}\n- Secteur : ${secteur}\n- Ville : ${ville}\n\n${contexte ? `Contexte / historique :\n${contexte}\n\n` : ''}${prompt ? `Instructions spécifiques du commercial :\n${prompt}\n\n` : ''}Objet demandé : ${object || 'Prise de contact'}\n\nRègles :\n1. Email court (3-5 paragraphes max)\n2. Personnalisé avec le nom/entreprise/secteur/ville quand c'est pertinent\n3. Pas de formules trop génériques comme "j'espère que vous allez bien"\n4. Proposition de valeur claire\n5. Appel à l'action simple\n6. Signe avec le prénom/nom du commercial si possible, sinon "Cordialement"\n\nRéponds UNIQUEMENT avec ce JSON :\n{"objet":"","corps":""}`

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        objet: object || 'Prise de contact',
        corps: `Bonjour ${nomContact},\n\nJe me permets de vous contacter au sujet de ${entreprise || 'votre entreprise'}.\n\nCordialement,`
      })
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: systemPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    })

    if (!res.ok) throw new Error('Groq API error')

    const data = await res.json()
    const generated = JSON.parse(data.choices[0].message.content)

    return NextResponse.json({
      objet: generated.objet || object || 'Prise de contact',
      corps: generated.corps || '',
      aiPrompt: systemPrompt
    })
  } catch (error: any) {
    console.error('[email generate] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
