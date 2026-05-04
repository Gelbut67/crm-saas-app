import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { visites, stats, typeTournee, date } = await request.json()

    // Générer le HTML pour la feuille de route
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Feuille de Route</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
    }
    .header p {
      color: #666;
      margin: 5px 0;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-label {
      color: #666;
      font-size: 14px;
      margin-top: 5px;
    }
    .visite {
      margin: 20px 0;
      padding: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .visite-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .visite-numero {
      width: 40px;
      height: 40px;
      background: #2563eb;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
      margin-right: 15px;
    }
    .visite-nom {
      font-size: 18px;
      font-weight: bold;
      color: #1e293b;
    }
    .visite-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      margin-left: 10px;
      background: #e0e7ff;
      color: #3730a3;
    }
    .visite-badge.prospect {
      background: #f3f4f6;
      color: #374151;
    }
    .visite-info {
      margin-left: 55px;
    }
    .visite-entreprise {
      color: #64748b;
      margin-bottom: 10px;
    }
    .visite-adresse {
      color: #475569;
      margin-bottom: 10px;
    }
    .visite-horaire {
      display: flex;
      gap: 20px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
    .horaire-item {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #2563eb;
      font-weight: 500;
    }
    .visite-trajet {
      color: #64748b;
      font-size: 14px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
    @media print {
      body {
        margin: 20px;
      }
      .visite {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📍 Feuille de Route</h1>
    <p>Date: ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p>Type de tournée: ${typeTournee === 'client' ? 'Clients' : typeTournee === 'prospect' ? 'Prospection' : 'Mixte'}</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${stats.nombreVisites}</div>
      <div class="stat-label">Visites</div>
    </div>
    <div class="stat">
      <div class="stat-value">${stats.distanceTotale} km</div>
      <div class="stat-label">Distance totale</div>
    </div>
    <div class="stat">
      <div class="stat-value">${Math.floor(stats.dureeTrajet / 60)}h${stats.dureeTrajet % 60}m</div>
      <div class="stat-label">Temps de trajet</div>
    </div>
  </div>

  ${visites.map((visite: any) => `
    <div class="visite">
      <div class="visite-header">
        <div class="visite-numero">${visite.ordre}</div>
        <div>
          <span class="visite-nom">${visite.client.nom}</span>
          <span class="visite-badge ${visite.client.statut === 'prospect' ? 'prospect' : ''}">
            ${visite.client.statut === 'client' ? 'Client' : 'Prospect'}
          </span>
        </div>
      </div>
      <div class="visite-info">
        ${visite.client.entreprise ? `<div class="visite-entreprise">${visite.client.entreprise}</div>` : ''}
        <div class="visite-adresse">
          📍 ${visite.client.adresse}, ${visite.client.codePostal} ${visite.client.ville}
        </div>
        <div class="visite-horaire">
          <div class="horaire-item">
            🕐 ${visite.heureArrivee} - ${visite.heureDepart}
          </div>
          ${visite.ordre > 1 ? `
            <div class="visite-trajet">
              🚗 ${visite.distance} km • ${visite.duree} min depuis la visite précédente
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('')}

  <div class="footer">
    <p>Feuille de route générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    <p>CRM SaaS - Optimisation de tournées</p>
  </div>
</body>
</html>
    `

    // Retourner le HTML (dans une vraie app, utiliser une lib comme puppeteer pour générer un vrai PDF)
    // Pour l'instant, on retourne le HTML qui peut être imprimé en PDF par le navigateur
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="feuille-route-${new Date().toISOString().split('T')[0]}.html"`
      }
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération de la feuille de route' },
      { status: 500 }
    )
  }
}
