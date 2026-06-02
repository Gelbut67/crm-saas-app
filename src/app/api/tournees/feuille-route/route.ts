import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { visites, stats, typeTournee, date, pointDepart } = await request.json()

    // Générer le HTML pour la feuille de route
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Feuille de Route</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 15px 20px;
      color: #333;
      font-size: 12px;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
      font-size: 18px;
    }
    .header p {
      color: #666;
      margin: 2px 0;
      font-size: 11px;
    }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 8px 0;
      padding: 8px;
      background: #f8fafc;
      border-radius: 6px;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 16px;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-label {
      color: #666;
      font-size: 10px;
      margin-top: 2px;
    }
    .visite {
      margin: 5px 0;
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      page-break-inside: avoid;
    }
    .visite-header {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    .visite-numero {
      width: 24px;
      height: 24px;
      background: #2563eb;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      margin-right: 8px;
      flex-shrink: 0;
    }
    .visite-nom {
      font-size: 13px;
      font-weight: bold;
      color: #1e293b;
    }
    .visite-badge {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 10px;
      font-size: 10px;
      margin-left: 6px;
      background: #e0e7ff;
      color: #3730a3;
    }
    .visite-badge.prospect {
      background: #f3f4f6;
      color: #374151;
    }
    .visite-info {
      margin-left: 32px;
    }
    .visite-entreprise {
      color: #64748b;
      margin-bottom: 2px;
      font-size: 11px;
    }
    .visite-adresse {
      color: #475569;
      margin-bottom: 2px;
      font-size: 11px;
    }
    .visite-horaire {
      display: flex;
      gap: 12px;
      margin-top: 4px;
      padding-top: 4px;
      border-top: 1px solid #e2e8f0;
    }
    .horaire-item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #2563eb;
      font-weight: 600;
      font-size: 11px;
    }
    .visite-trajet {
      color: #64748b;
      font-size: 11px;
    }
    .visite-derniere-visite {
      font-size: 10px;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .jamais-visite {
      color: #d97706;
      font-weight: 600;
    }
    .date-visite {
      color: #64748b;
    }
    .footer {
      margin-top: 15px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 10px;
    }
    #map {
      width: 100%;
      height: 420px;
      margin: 10px 0;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .map-container {
      page-break-before: always;
      margin-top: 10px;
    }
    .map-title {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 6px;
    }
    @media print {
      @page { margin: 8mm; }
      @page :first { margin: 8mm; }
      body {
        margin: 0;
        font-size: 11px;
      }
      .visite {
        page-break-inside: avoid;
        margin: 3px 0;
      }
      .map-container {
        page-break-before: always;
        margin: 0;
        padding: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .map-title {
        flex-shrink: 0;
        margin: 4mm 0 2mm 0;
      }
      #map {
        flex: 1;
        height: auto !important;
        min-height: 0;
        border-radius: 0;
        border: none;
        margin: 0;
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

  ${visites.map((visite: any) => {
    if (visite.type === 'pause') {
      return `
    <div style="margin:5px 0;padding:7px 10px;border:1px dashed #f59e0b;border-radius:5px;background:#fffbeb;display:flex;align-items:center;gap:8px;">
      <span style="font-size:18px">☕</span>
      <div>
        <span style="font-weight:bold;font-size:12px;color:#92400e;">Pause déjeuner</span>
        <span style="margin-left:8px;font-size:11px;color:#b45309;">${visite.heureArrivee} – ${visite.heureDepart} (${visite.duree} min)</span>
      </div>
    </div>`
    }
    return `
    <div class="visite">
      <div class="visite-header">
        <div class="visite-numero">${visite.ordre}</div>
        <div style="flex:1">
          <span class="visite-nom">${visite.client.nom}</span>
          <span class="visite-badge ${visite.client.statut === 'prospect' ? 'prospect' : ''}">
            ${visite.client.statut === 'client' ? 'Client' : 'Prospect'}
          </span>
          ${visite.nombreVisites > 0 ? `<span style="display:inline-block;margin-left:6px;padding:1px 7px;border-radius:10px;font-size:10px;background:#dbeafe;color:#1d4ed8;font-weight:600;">📍 ${visite.nombreVisites} visite${visite.nombreVisites > 1 ? 's' : ''}</span>` : ''}
        </div>
      </div>
      <div class="visite-info">
        ${visite.client.entreprise ? `<div class="visite-entreprise">${visite.client.entreprise}</div>` : ''}
        <div class="visite-adresse">
          📍 ${visite.client.adresse}, ${visite.client.codePostal} ${visite.client.ville}
        </div>
        <div class="visite-derniere-visite">
          🕓 ${visite.derniereVisite
            ? `<span class="date-visite">Dernière visite : ${new Date(visite.derniereVisite).toLocaleDateString('fr-FR')}</span>`
            : `<span class="jamais-visite">⚠️ Jamais visité</span>`
          }
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
    </div>`
  }).join('')}

  <div class="map-container">
    <div class="map-title">🗺️ Carte de la tournée</div>
    <div id="map"></div>
  </div>

  <div class="footer">
    <p>Feuille de route générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    <p>CRM SaaS - Optimisation de tournées</p>
  </div>

  <script>
    // Initialiser la carte
    const visites = ${JSON.stringify(visites)};
    const pointDepart = ${JSON.stringify(pointDepart)};
    
    // Calculer le centre de la carte
    let centerLat = 48.8566;
    let centerLon = 2.3522;
    
    if (pointDepart && pointDepart.lat && pointDepart.lon) {
      centerLat = pointDepart.lat;
      centerLon = pointDepart.lon;
    } else if (visites.length > 0 && visites[0].coordonnees) {
      centerLat = visites[0].coordonnees.lat;
      centerLon = visites[0].coordonnees.lon;
    }
    
    const map = L.map('map').setView([centerLat, centerLon], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Créer les icônes personnalisées
    const homeIcon = L.divIcon({
      className: 'custom-div-icon',
      html: '<div style="background-color: #22c55e; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">🏠</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    
    const defaultIcon = L.divIcon({
      className: 'custom-div-icon',
      html: '<div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px; color: white; font-weight: bold;"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    
    // Ajouter le marqueur du domicile
    if (pointDepart && pointDepart.lat && pointDepart.lon) {
      L.marker([pointDepart.lat, pointDepart.lon], { icon: homeIcon })
        .addTo(map)
        .bindPopup('<b>🏠 Domicile</b><br>' + pointDepart.adresse);
    }
    
    // Ajouter les marqueurs des visites
    const bounds = [];
    if (pointDepart && pointDepart.lat && pointDepart.lon) {
      bounds.push([pointDepart.lat, pointDepart.lon]);
    }
    
    visites.forEach((visite, index) => {
      if (visite.coordonnees && visite.coordonnees.lat && visite.coordonnees.lon) {
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; font-weight: bold;">' + visite.ordre + '</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        
        L.marker([visite.coordonnees.lat, visite.coordonnees.lon], { icon: customIcon })
          .addTo(map)
          .bindPopup('<b>' + visite.ordre + '. ' + visite.client.nom + '</b><br>' + 
                     visite.client.adresse + '<br>' +
                     '🕐 ' + visite.heureArrivee + ' - ' + visite.heureDepart);
        
        bounds.push([visite.coordonnees.lat, visite.coordonnees.lon]);
        
        // Ajouter les routes si disponibles
        if (visite.routeGeometry && visite.routeGeometry.coordinates) {
          const routeCoords = visite.routeGeometry.coordinates.map(coord => [coord[1], coord[0]]);
          L.polyline(routeCoords, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8
          }).addTo(map);
        }
      }
    });
    
    // Ajuster la vue pour montrer tous les points
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    // Forcer Leaflet à recalculer la taille avant impression
    window.addEventListener('beforeprint', function() {
      setTimeout(function() {
        map.invalidateSize();
        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [10, 10] });
        }
      }, 200);
    });
  </script>
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
