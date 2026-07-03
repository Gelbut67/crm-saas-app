import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export const maxDuration = 45

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

    const signatureSetting = await prisma.settings.findFirst({
      where: { userId: session.user.id, key: 'signatureEmail' }
    })
    const signature = signatureSetting?.value || ''

    const systemPrompt = `Tu es un commercial B2B senior. Rédige un email professionnel en français, percutant, personnalisé et bien développé (entre 250 et 450 mots).\n\nINFOS DESTINATAIRE :\n- Nom contact : ${nomContact}\n- Entreprise : ${entreprise}\n- Secteur d'activité : ${secteur}\n- Ville : ${ville}\n\n${contexte ? `CONTEXTE / HISTORIQUE :\n${contexte}\n\n` : ''}${prompt ? `INSTRUCTIONS DU COMMERCIAL :\n${prompt}\n\n` : ''}OBJET SUGGÉRÉ : ${object || 'Prise de contact'}\n\nSTRUCTURE OBLIGATOIRE DE L'EMAIL :\n1. Accroche personnalisée : mentionne l'entreprise, le secteur ou la ville du contact pour montrer que l'email n'est pas un spam.\n2. Présentation du contexte : pourquoi tu écris aujourd'hui (problème, opportunité, actualité).\n3. Proposition de valeur détaillée : 2 à 3 bénéfices concrets, chiffrés si possible, adaptés au secteur.\n4. Preuve / crédibilité : une phrase montrant que tu connais le marché ou que tu as déjà accompagné des entreprises similaires.\n5. Appel à l'action clair : propose un rendez-vous, un appel, une démo, ou demande une réponse simple.\n6. Formule de politesse + signature.\n\nRÈGLES DE TON :\n- Ton professionnel, chaleureux et confiant, sans être familier.\n- Évite les formules creuses : "J'espère que vous allez bien", "Je me permets de vous contacter".\n- N'utilise pas de jargon inutile.\n- Un seul appel à l'action.\n- Pas d'emoji.\n- Signature : ${signature || 'Cordialement, [ton nom]'}\n\nRéponds UNIQUEMENT avec ce JSON exact :\n{"objet":"","corps":""}`

    if (!process.env.GROQ_API_KEY) {
      const fallbackLines = [
        `Bonjour ${nomContact},`,
        '',
        `Je vous écris car ${entreprise || 'votre entreprise'} opère dans le secteur ${secteur || 'de l activité'} et je pense que notre offre peut vous apporter une vraie valeur ajoutée.`,
        '',
        `Nous accompagnons des entreprises similaires sur ${ville || 'votre région'} pour optimiser leur développement commercial et gagner du temps au quotidien. Grâce à notre solution, nos clients constatent généralement un gain de productivité significatif et une meilleure visibilité sur leurs opportunités.`,
        '',
        `Je serais ravi d'échanger quelques minutes avec vous pour comprendre vos enjeux et voir comment nous pourrions collaborer ensemble.`,
        '',
        `Etes-vous disponible pour un appel la semaine prochaine ?`,
        '',
        signature || 'Cordialement,'
      ]
      return NextResponse.json({
        objet: object || 'Prise de contact',
        corps: fallbackLines.join('\n')
      })
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: systemPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.65,
        max_tokens: 4096
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
