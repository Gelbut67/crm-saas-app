import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const devis = await prisma.devis.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true, nom: true, entreprise: true,
            adresse: true, codePostal: true, ville: true,
            email: true, telephone: true,
          },
        },
      },
    })
    if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

    // Récupérer les paramètres société
    const settingsRaw = await prisma.settings.findMany({
      where: { userId: session.user.id },
    })
    const s: Record<string, string> = {}
    for (const item of settingsRaw) s[item.key] = item.value

    const soc = {
      nom: s['devis_societe_nom'] || '',
      tagline: s['devis_societe_tagline'] || '',
      adresse: s['devis_societe_adresse'] || '',
      cp: s['devis_societe_code_postal'] || '',
      ville: s['devis_societe_ville'] || '',
      siret: s['devis_societe_siret'] || '',
      tel: s['devis_societe_telephone'] || '',
      mobile: s['devis_societe_mobile'] || '',
      email: s['devis_societe_email'] || '',
      nomCommercial: s['devis_societe_nom_commercial'] || '',
      iban: s['devis_societe_iban'] || '',
      logoUrl: s['devis_societe_logo_url'] || '',
      villeEmission: s['devis_ville_emission'] || '',
      texteFooter: s['devis_texte_footer'] || 'Pour toute commande, merci de bien vouloir nous renvoyer votre devis signé avec la mention « Bon pour accord », accompagné de votre bon de commande.',
      texteIntro: s['devis_texte_introduction'] || 'Nous vous remercions de votre demande de prix et vous prions de bien vouloir trouver ci-dessous nos meilleures conditions pour la fabrication suivante :',
    }

    // Lignes
    let lignes: { texte: string; style: 'normal' | 'bold' | 'colored' }[] = []
    try { lignes = JSON.parse(devis.lignes || '[]') } catch {}

    const dateDoc = new Date(devis.dateCreation)
    const dateFormatted = dateDoc.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    const client = devis.client
    const clientNom = client.entreprise || client.nom
    const civilite = devis.civilite || 'Madame'
    const numero = devis.numero || devis.id.slice(-6).toUpperCase()
    const objet = devis.objet || 'Offre de service'

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Devis ${numero}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 20px 28px; max-width: 820px; margin: 0 auto; }
    
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px; }
    .header-left { max-width: 220px; }
    .logo { max-height: 80px; max-width: 140px; object-fit: contain; margin-bottom: 6px; }
    .logo-placeholder { font-size: 20px; font-weight: 900; color: #e05a00; margin-bottom: 4px; line-height: 1.1; }
    .tagline { font-size: 10px; color: #555; font-style: italic; margin-bottom: 10px; }
    .soc-info { font-size: 10.5px; color: #333; line-height: 1.6; }
    .soc-info strong { font-weight: 700; }
    
    .header-right { text-align: right; }
    .date-doc { font-size: 13px; font-weight: 700; color: #e05a00; margin-bottom: 14px; }
    .client-block { text-align: left; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 4px; min-width: 240px; }
    .client-nom { font-size: 12.5px; font-weight: 700; text-transform: uppercase; line-height: 1.4; }
    .client-adresse { font-size: 11.5px; margin-top: 4px; line-height: 1.6; font-weight: 600; }

    /* Objet / Numéro */
    .doc-meta { margin-bottom: 18px; }
    .doc-meta p { font-size: 12px; margin-bottom: 2px; }
    .doc-numero { font-size: 13px; font-weight: 700; }

    /* Corps */
    .intro { font-size: 12px; margin-bottom: 12px; line-height: 1.6; }
    .civility { margin-bottom: 10px; font-size: 12px; }

    /* Bullet list */
    ul.lignes { list-style: disc; padding-left: 22px; margin-bottom: 16px; }
    ul.lignes li { font-size: 12px; line-height: 1.7; }
    ul.lignes li.style-bold { font-weight: 700; text-transform: uppercase; }
    ul.lignes li.style-colored { font-weight: 700; color: #e05a00; }
    ul.lignes li.style-normal { font-weight: normal; }

    /* Footer box */
    .footer-box { border: 1px solid #333; padding: 8px 12px; font-size: 11px; margin: 18px 0; line-height: 1.6; }
    .footer-box strong { font-weight: 700; }
    .footer-contacts { margin-top: 4px; }
    .footer-contacts p { margin-left: 12px; }

    /* Closing */
    .closing { font-size: 12px; margin: 16px 0; line-height: 1.7; }
    .signature { margin-top: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
    .sig-left .sig-name { font-weight: 700; font-size: 12px; margin-top: 4px; }
    .bon-pour-accord { font-size: 13px; font-weight: 900; color: #e05a00; letter-spacing: 0.5px; }

    /* Banque */
    .banque { margin-top: 28px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #555; }

    @media print {
      body { padding: 10mm 14mm; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      ${soc.logoUrl ? `<img src="${soc.logoUrl}" class="logo" alt="Logo" />` : soc.nom ? `<div class="logo-placeholder">${soc.nom}</div>` : ''}
      ${soc.tagline ? `<div class="tagline">${soc.tagline}</div>` : ''}
      <div class="soc-info">
        ${soc.adresse ? `<div>${soc.adresse}</div>` : ''}
        ${soc.cp || soc.ville ? `<div>${soc.cp} ${soc.ville}</div>` : ''}
        ${soc.siret ? `<div>Siret : ${soc.siret}</div>` : ''}
        ${soc.tel ? `<div>☎ ${soc.tel}</div>` : ''}
        ${soc.nomCommercial ? `<div><strong>${soc.nomCommercial}</strong></div>` : ''}
        ${soc.mobile ? `<div>📱 ${soc.mobile}</div>` : ''}
      </div>
    </div>

    <div class="header-right">
      <div class="date-doc">${soc.villeEmission ? soc.villeEmission + ' le ' : ''}${dateFormatted}</div>
      <div class="client-block">
        <div class="client-nom">${clientNom}</div>
        ${client.adresse ? `<div class="client-adresse">${client.adresse}</div>` : ''}
        ${(client.codePostal || client.ville) ? `<div class="client-adresse">${client.codePostal || ''} ${client.ville || ''}</div>` : ''}
      </div>
    </div>
  </div>

  <!-- OBJET / NUMERO -->
  <div class="doc-meta">
    <p>Objet : ${objet}</p>
    <p class="doc-numero">DEVIS ${numero}</p>
  </div>

  <!-- INTRO -->
  <p class="civility">${civilite} ,</p>
  <p class="intro">${soc.texteIntro}</p>

  <!-- LIGNES -->
  <ul class="lignes">
    ${lignes.map(l => `<li class="style-${l.style}">${l.texte}</li>`).join('\n    ')}
  </ul>

  <!-- FOOTER BOX -->
  <div class="footer-box">
    ${soc.texteFooter}
    <div class="footer-contacts">
      ${soc.email ? `<p>➤ Par Mail : ${soc.email}</p>` : ''}
      ${(soc.adresse || soc.ville) ? `<p>➤ Par courrier, à l'adresse indiquée</p>` : ''}
    </div>
  </div>

  <!-- CLOSING -->
  <div class="closing">
    Veuillez agréer, ${civilite}, l'expression de nos sentiments dévoués.
  </div>

  <div class="signature">
    <div class="sig-left">
      <div class="sig-name">${soc.nomCommercial}</div>
    </div>
    <div class="bon-pour-accord">BON POUR ACCORD</div>
  </div>

  <!-- BANQUE -->
  ${soc.iban ? `<div class="banque">Banque : ${soc.iban}</div>` : ''}

</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error) {
    console.error('Erreur imprimer devis:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
