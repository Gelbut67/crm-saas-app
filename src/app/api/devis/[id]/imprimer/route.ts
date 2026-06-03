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

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Devis ${numero}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 15px 22px; max-width: 800px; margin: 0 auto; }

    /* Header principal */
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
    .logo-block img { max-height: 90px; max-width: 130px; object-fit: contain; }
    .logo-block .logo-text { font-size: 22px; font-weight: 900; color: #333; line-height: 1.1; }
    .logo-block .logo-sub { font-size: 10px; color: #777; font-style: italic; }
    .title-block { text-align: right; }
    .devis-title { font-size: 36px; font-weight: 900; color: #1a1a1a; letter-spacing: 2px; }

    /* Blocs info */
    .info-row { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    .soc-box { flex: 1; background: #f5f5f5; border: 1px solid #ddd; padding: 9px 11px; font-size: 10.5px; line-height: 1.7; }
    .soc-box strong { font-size: 12px; font-weight: 700; display: block; margin-bottom: 3px; }
    .soc-box a { color: #1a56db; text-decoration: none; }
    .meta-client { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .meta-nums { font-size: 11px; line-height: 1.8; }
    .meta-nums span { color: #E85A00; font-weight: 700; }
    .client-box { background: #f5f5f5; border: 1px solid #ddd; padding: 9px 11px; font-size: 10.5px; line-height: 1.7; }
    .client-box .lbl { font-size: 10.5px; color: #555; }
    .client-box .cnom { font-size: 12px; font-weight: 700; }

    /* Objet */
    .objet-line { margin: 12px 0 4px; font-size: 11.5px; }
    .objet-line u { text-decoration: underline; }
    .validite-line { font-size: 11px; margin-bottom: 12px; }

    /* Tableau */
    table.devis-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    table.devis-table thead tr { background: #E85A00; color: white; }
    table.devis-table thead th { padding: 6px 7px; font-size: 11px; font-weight: 600; }
    table.devis-table thead th:first-child { text-align: left; }
    table.devis-table thead th:not(:first-child) { text-align: center; }
    table.devis-table tbody tr { border-bottom: 1px solid #e0e0e0; }
    table.devis-table tbody tr.empty { height: 22px; }
    table.devis-table tbody td { padding: 4px 7px; font-size: 10.5px; }
    table.devis-table tbody td:not(:first-child) { text-align: center; }
    table.devis-table tbody td.val { text-align: right; }

    /* Conditions + totaux */
    .bottom-section { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 6px; }
    .conditions-block { font-size: 11px; line-height: 1.8; }
    .conditions-block p { font-weight: 600; }
    .totaux-table { border-collapse: collapse; min-width: 220px; }
    .totaux-table tr td { padding: 5px 12px; font-size: 11px; border: 1px solid #ddd; }
    .totaux-table tr td:first-child { background: #f0f0f0; font-weight: 600; }
    .totaux-table tr td:last-child { text-align: right; min-width: 90px; }
    .totaux-table tr.net { background: #E85A00; }
    .totaux-table tr.net td { color: white; font-weight: 700; background: #E85A00; border-color: #E85A00; }

    /* Signature */
    .signature-section { margin-top: 18px; }
    .signature-box { border: 1px dashed #aaa; background: #fafafa; padding: 8px 12px; min-height: 70px; }
    .signature-label { font-size: 10px; color: #666; font-style: italic; }

    /* Footer */
    .page-footer { margin-top: 22px; padding-top: 8px; border-top: 2px solid #e0e0e0; text-align: center; font-size: 10px; color: #555; }
    .page-footer strong { font-weight: 700; color: #333; }

    @media print {
      body { padding: 8mm 12mm; font-size: 10px; }
      @page { margin: 8mm; size: A4; }
    }
  </style>
</head>
<body>

<!-- TOP HEADER -->
<div class="header-top">
  <div class="logo-block">
    ${soc.logoUrl
      ? `<img src="${soc.logoUrl}" alt="Logo" />`
      : soc.nom ? `<div class="logo-text">${soc.nom}</div>` : ""}
    ${soc.tagline ? `<div class="logo-sub">${soc.tagline}</div>` : ""}
  </div>
  <div class="title-block">
    <div class="devis-title">DEVIS</div>
  </div>
</div>

<!-- INFO ROW -->
<div class="info-row">
  <div class="soc-box">
    ${soc.nom ? `<strong>${soc.nom}</strong>` : ""}
    ${soc.adresse ? `${soc.adresse}<br>` : ""}
    ${soc.bp ? `${soc.bp}<br>` : ""}
    ${(soc.cp || soc.ville) ? `${soc.cp} ${soc.ville}<br>` : ""}
    ${soc.tel ? `Téléphone : ${soc.tel}<br>` : ""}
    ${soc.mobile ? `Mobile : ${soc.mobile}<br>` : ""}
    ${soc.email ? `Mail : <a href="mailto:${soc.email}">${soc.email}</a>` : ""}
  </div>
  <div class="meta-client">
    <div class="meta-nums">
      Numéro : <span>${numero}</span><br>
      Date d'émission : ${dateFormatted}
    </div>
    <div class="client-box">
      <div class="lbl">Client :</div>
      <div class="cnom">${clientNom}</div>
      <br>
      ${client.adresse ? `${client.adresse}<br>` : ""}
      ${(client.codePostal || client.ville) ? `${client.codePostal || ""} ${client.ville || ""}<br>` : ""}
      France
    </div>
  </div>
</div>

<!-- OBJET -->
<p class="objet-line"><u>Objet : ${objet}</u></p>
${devis.validite ? `<p class="validite-line">Durée de validité – ${devis.validite}</p>` : ""}

<!-- TABLEAU -->
<table class="devis-table">
  <thead>
    <tr>
      <th style="width:38%">Désignation</th>
      <th style="width:12%">Quantité</th>
      <th style="width:14%">Prix au mille</th>
      <th style="width:8%">% TVA</th>
      <th style="width:14%">Total TVA</th>
      <th style="width:14%">Total HT</th>
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
        <td>${hasValues && l.tva ? l.tva + " %" : ""}</td>
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
    <p>Conditions de règlement :</p>
    <br>
    ${devis.conditionsPaiement ? `<span>${devis.conditionsPaiement}</span>` : ""}
  </div>
  ${devis.afficherTotaux !== false ? `
  <table class="totaux-table">
    <tr>
      <td>Total HT</td>
      <td>${fmt(totaux.totalHT)}</td>
    </tr>
    <tr>
      <td>Total TVA</td>
      <td>${fmt(totaux.totalTVA)}</td>
    </tr>
    <tr class="net">
      <td>Net à payer</td>
      <td>${fmt(netAPayer)}</td>
    </tr>
  </table>` : ""}
</div>

<!-- SIGNATURE -->
<div class="signature-section">
  <div class="signature-box">
    <span class="signature-label">Signature du client (précédée de la mention « Bon pour accord »)</span>
  </div>
</div>

<!-- FOOTER -->
${soc.iban || soc.siret ? `
<div class="page-footer">
  ${soc.iban ? `<strong>Banque :</strong> ${soc.iban}` : ""}
  ${soc.iban && soc.siret ? " – " : ""}
  ${soc.siret ? `Siret : ${soc.siret}` : ""}
</div>` : ""}

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