import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthSession } from "@/lib/auth"

interface Ligne {
  id: string
  designation: string
  quantite: string
  prix: string
  tva: string
}

function calcLigne(l: Ligne) {
  const qt = parseFloat(l.quantite) || 0
  const prix = parseFloat(l.prix) || 0
  const tva = parseFloat(l.tva) || 0
  const totalHT = (qt / 1000) * prix
  const totalTVA = totalHT * (tva / 100)
  return { totalHT, totalTVA }
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

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
    if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })

    const settingsRaw = await prisma.settings.findMany({ where: { userId: session.user.id } })
    const s: Record<string, string> = {}
    for (const item of settingsRaw) s[item.key] = item.value

    const soc = {
      nom: s["devis_societe_nom"] || "",
      tagline: s["devis_societe_tagline"] || "",
      adresse: s["devis_societe_adresse"] || "",
      bp: s["devis_societe_bp"] || "",
      cp: s["devis_societe_code_postal"] || "",
      ville: s["devis_societe_ville"] || "",
      siret: s["devis_societe_siret"] || "",
      tel: s["devis_societe_telephone"] || "",
      mobile: s["devis_societe_mobile"] || "",
      email: s["devis_societe_email"] || "",
      nomCommercial: s["devis_societe_nom_commercial"] || "",
      iban: s["devis_societe_iban"] || "",
      logoUrl: s["devis_societe_logo_url"] || "",
    }

    let lignes: Ligne[] = []
    try { lignes = JSON.parse(devis.lignes || "[]") } catch {}

    const totaux = lignes.reduce(
      (acc, l) => {
        const { totalHT, totalTVA } = calcLigne(l)
        return { totalHT: acc.totalHT + totalHT, totalTVA: acc.totalTVA + totalTVA }
      },
      { totalHT: 0, totalTVA: 0 }
    )
    const netAPayer = totaux.totalHT + totaux.totalTVA

    const dateDoc = new Date(devis.dateCreation)
    const dateFormatted = dateDoc.toLocaleDateString("fr-FR")
    const numero = devis.numero || devis.id.slice(-6).toUpperCase()
    const objet = devis.objet || "Offre de prix"
    const client = devis.client
    const clientNom = (client.entreprise || client.nom).toUpperCase()

    // Padding jusqu'a 8 lignes minimum dans le tableau
    const MIN_ROWS = 8
    const padRows = Math.max(0, MIN_ROWS - lignes.length)

    const footerHtml = (soc.iban || soc.siret) ? `
<div class="page-footer">
  ${soc.iban ? `<strong>Banque :</strong> ${soc.iban}` : ""}
  ${soc.iban && soc.siret ? "&nbsp;&nbsp;–&nbsp;&nbsp;" : ""}
  ${soc.siret ? `<strong>Siret :</strong> ${soc.siret}` : ""}
</div>` : ""

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Devis ${numero}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body { height: 100%; }

    body {
      font-family: Arial, sans-serif;
      font-size: 11.5px;
      color: #1a1a1a;
      background: #fff;
      padding: 28px 32px 80px 32px;
      max-width: 820px;
      margin: 0 auto;
    }

    /* ── BANDE ACCENT HAUT ── */
    .accent-strip {
      height: 5px;
      background: linear-gradient(90deg, #E85A00 0%, #ff8c42 100%);
      margin: -28px -32px 0;
    }

    /* ── HEADER : logo+société (gauche) | badge DEVIS (droite) ── */
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 22px 0 18px;
      border-bottom: 1px solid #ececec;
      margin-bottom: 22px;
      gap: 20px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 18px;
      flex: 1;
    }
    .header-logo img { max-height: 72px; max-width: 120px; object-fit: contain; display: block; }
    .header-logo-text { font-size: 26px; font-weight: 900; color: #1a1a1a; letter-spacing: 1px; }
    .header-company-name {
      font-size: 15px;
      font-weight: 800;
      color: #1a1a1a;
      letter-spacing: 0.4px;
      margin-bottom: 3px;
    }
    .header-tagline { font-size: 10px; color: #aaa; letter-spacing: 0.3px; }

    .header-right { text-align: right; flex-shrink: 0; }
    .devis-badge {
      display: inline-block;
      background: #E85A00;
      color: #fff;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 7px;
      padding: 10px 24px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .devis-ref { font-size: 11.5px; color: #555; line-height: 1.9; }
    .devis-ref .ref-val { font-weight: 700; color: #E85A00; }

    /* ── INFO ROW : expéditeur (gauche) | destinataire (droite) ── */
    .info-row {
      display: flex;
      gap: 28px;
      margin-bottom: 22px;
    }
    .sender-block {
      flex: 1;
      font-size: 11px;
      color: #444;
      line-height: 1.95;
    }
    .sender-contact {
      font-size: 12px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 3px;
    }
    .sender-block a { color: #555; text-decoration: none; }

    .recipient-block {
      flex: 1;
      border-left: 4px solid #E85A00;
      padding: 12px 18px;
      background: #fffaf7;
      font-size: 11px;
      line-height: 1.95;
    }
    .recipient-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #E85A00;
      margin-bottom: 7px;
    }
    .recipient-name { font-size: 13px; font-weight: 800; color: #1a1a1a; margin-bottom: 4px; }
    .recipient-block .addr { color: #555; font-size: 11px; }

    /* ── OBJET / VALIDITÉ ── */
    .objet-line {
      font-size: 12px;
      margin: 18px 0 8px;
      text-decoration: underline;
    }
    .validite-line { font-size: 11.5px; margin-bottom: 18px; color: #333; }

    /* ── TABLEAU ── */
    table.devis-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    table.devis-table thead tr { background: #E85A00; color: #fff; }
    table.devis-table thead th {
      padding: 8px 9px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    table.devis-table thead th:first-child { text-align: left; }
    table.devis-table thead th:not(:first-child) { text-align: center; }
    table.devis-table tbody tr { border-bottom: 1px solid #e4e4e4; }
    table.devis-table tbody tr:nth-child(even) { background: #fafafa; }
    table.devis-table tbody tr.empty { height: 26px; }
    table.devis-table tbody td { padding: 6px 9px; font-size: 11px; }
    table.devis-table tbody td:not(:first-child) { text-align: center; }
    table.devis-table tbody td.val { text-align: right; }

    /* ── CONDITIONS + TOTAUX ── */
    .bottom-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 30px;
      margin-top: 10px;
      margin-bottom: 28px;
    }
    .conditions-block { font-size: 11.5px; line-height: 2; flex: 1; }
    .conditions-block .conditions-titre { font-weight: 700; margin-bottom: 4px; }
    .totaux-table { border-collapse: collapse; min-width: 240px; }
    .totaux-table tr td {
      padding: 7px 14px;
      font-size: 11.5px;
      border: 1px solid #ddd;
    }
    .totaux-table tr td:first-child { background: #f0f0f0; font-weight: 600; width: 130px; }
    .totaux-table tr td:last-child { text-align: right; min-width: 100px; }
    .totaux-table tr.net td {
      background: #E85A00;
      color: #fff;
      font-weight: 700;
      border-color: #E85A00;
    }

    /* ── SIGNATURE ── */
    .signature-section { margin-bottom: 30px; }
    .signature-label {
      font-size: 10.5px;
      color: #666;
      font-style: italic;
      display: block;
      margin-bottom: 6px;
    }
    .signature-box {
      border: 1px dashed #bbb;
      background: #fafafa;
      min-height: 80px;
      border-radius: 2px;
    }

    /* ── FOOTER FIXE ── */
    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #fff;
      border-top: 2px solid #E85A00;
      text-align: center;
      font-size: 10.5px;
      color: #444;
      padding: 7px 32px;
      letter-spacing: 0.2px;
    }
    .page-footer strong { font-weight: 700; color: #111; }

    /* ── IMPRESSION ── */
    @media print {
      body {
        padding: 10mm 14mm 28mm 14mm;
        font-size: 10.5px;
        max-width: none;
      }
      @page { margin: 8mm; size: A4 portrait; }
      table.devis-table tbody tr.empty { height: 24px; }
      .page-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 5px 14mm;
      }
    }
  </style>
</head>
<body>

<!-- BANDE ACCENT -->
<div class="accent-strip"></div>

<!-- HEADER : logo+société | badge DEVIS -->
<div class="header-top">
  <div class="header-left">
    <div class="header-logo">
      ${soc.logoUrl ? `<img src="${soc.logoUrl}" alt="Logo" />` : soc.nom ? `<div class="header-logo-text">${soc.nom}</div>` : ""}
    </div>
    ${soc.nom && soc.logoUrl ? `<div><div class="header-company-name">${soc.nom}</div>${soc.tagline ? `<div class="header-tagline">${soc.tagline}</div>` : ""}</div>` : !soc.logoUrl && soc.tagline ? `<div class="header-tagline">${soc.tagline}</div>` : ""}
  </div>
  <div class="header-right">
    <div class="devis-badge">DEVIS</div>
    <div class="devis-ref">
      N°&nbsp;<span class="ref-val">${numero}</span><br>
      Date&nbsp;: ${dateFormatted}
    </div>
  </div>
</div>

<!-- INFO ROW : expéditeur | destinataire -->
<div class="info-row">
  <div class="sender-block">
    ${soc.nomCommercial ? `<div class="sender-contact">${soc.nomCommercial}</div>` : soc.nom ? `<div class="sender-contact">${soc.nom}</div>` : ""}
    ${soc.adresse ? `${soc.adresse}<br>` : ""}
    ${soc.bp ? `${soc.bp}<br>` : ""}
    ${(soc.cp || soc.ville) ? `${soc.cp} ${soc.ville}<br>` : ""}
    ${soc.tel ? `Tél&nbsp;: ${soc.tel}<br>` : ""}
    ${soc.mobile ? `Mobile&nbsp;: ${soc.mobile}<br>` : ""}
    ${soc.email ? `<a href="mailto:${soc.email}">${soc.email}</a>` : ""}
  </div>
  <div class="recipient-block">
    <div class="recipient-label">Destinataire</div>
    <div class="recipient-name">${clientNom}</div>
    <div class="addr">
      ${client.adresse ? `${client.adresse}<br>` : ""}
      ${(client.codePostal || client.ville) ? `${client.codePostal || ""} ${client.ville || ""}<br>` : ""}
      France
    </div>
  </div>
</div>

<!-- OBJET -->
<p class="objet-line">Objet : ${objet}</p>
${devis.validite ? `<p class="validite-line">Durée de validité – ${devis.validite}</p>` : ""}

<!-- TABLEAU DES LIGNES -->
<table class="devis-table">
  <thead>
    <tr>
      <th style="width:38%;text-align:left">Désignation</th>
      <th style="width:11%">Quantité</th>
      <th style="width:14%">Prix au mille</th>
      <th style="width:8%">% TVA</th>
      <th style="width:14%">Total TVA</th>
      <th style="width:15%">Total HT</th>
    </tr>
  </thead>
  <tbody>
    ${lignes.map(l => {
      const { totalHT, totalTVA } = calcLigne(l)
      const hasValues = (parseFloat(l.quantite) > 0) && (parseFloat(l.prix) > 0)
      return `<tr>
        <td>${l.designation || ""}</td>
        <td>${hasValues ? l.quantite : ""}</td>
        <td>${hasValues ? fmt(parseFloat(l.prix)) : ""}</td>
        <td>${hasValues && l.tva ? l.tva + "&nbsp;%" : ""}</td>
        <td class="val">${hasValues && totalTVA > 0 ? fmt(totalTVA) : ""}</td>
        <td class="val">${hasValues && totalHT > 0 ? fmt(totalHT) : ""}</td>
      </tr>`
    }).join("")}
    ${Array(padRows).fill('<tr class="empty"><td></td><td></td><td></td><td></td><td></td><td></td></tr>').join("")}
  </tbody>
</table>

<!-- CONDITIONS + TOTAUX -->
<div class="bottom-section">
  <div class="conditions-block">
    <div class="conditions-titre">Conditions de règlement :</div>
    ${devis.conditionsPaiement ? `<div>${devis.conditionsPaiement}</div>` : ""}
  </div>
  ${devis.afficherTotaux !== false ? `
  <table class="totaux-table">
    <tr><td>Total HT</td><td>${fmt(totaux.totalHT)}</td></tr>
    <tr><td>Total TVA</td><td>${fmt(totaux.totalTVA)}</td></tr>
    <tr class="net"><td>Net à payer</td><td>${fmt(netAPayer)}</td></tr>
  </table>` : ""}
</div>

<!-- SIGNATURE -->
<div class="signature-section">
  <span class="signature-label">Signature du client (précédée de la mention « Bon pour accord »)</span>
  <div class="signature-box"></div>
</div>

<!-- FOOTER FIXE -->
${footerHtml}

</body>
</html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (error) {
    console.error("Erreur imprimer devis:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}