"use client"

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// Fix pour les icônes Leaflet avec Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Icône personnalisée pour le domicile
const homeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Icône pour les RDV fixes
const fixedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface TourneeMapProps {
  visites: Array<{
    client: {
      nom: string
      entreprise?: string
      ville?: string
      adresse?: string
    }
    ordre: number
    heureArrivee: string
    heureDepart: string
    distance: number
    coordonnees?: { lat: number; lon: number }
    heureRdv?: string
  }>
  pointDepart?: { lat: number; lon: number; adresse: string }
}

function MapBounds({ visites, pointDepart }: TourneeMapProps) {
  const map = useMap()
  
  useEffect(() => {
    if (visites.length === 0 && !pointDepart) return
    
    const bounds = L.latLngBounds([])
    
    if (pointDepart && pointDepart.lat && pointDepart.lon) {
      bounds.extend([pointDepart.lat, pointDepart.lon])
    }
    
    visites.forEach(visite => {
      if (visite.coordonnees && visite.coordonnees.lat && visite.coordonnees.lon) {
        bounds.extend([visite.coordonnees.lat, visite.coordonnees.lon])
      }
    })
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [visites, pointDepart, map])
  
  return null
}

export function TourneeMap({ visites, pointDepart }: TourneeMapProps) {
  // Vérifier qu'il y a au moins une visite avec des coordonnées
  const hasValidCoordinates = visites.some(v => v.coordonnees && v.coordonnees.lat && v.coordonnees.lon)
  
  if (!hasValidCoordinates && !pointDepart) {
    return (
      <div className="w-full h-[500px] rounded-lg overflow-hidden border flex items-center justify-center bg-muted">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Aucune coordonnée disponible pour afficher la carte</p>
          <p className="text-sm mt-1">Vérifiez que vos clients ont des adresses complètes</p>
        </div>
      </div>
    )
  }
  
  // Centre par défaut (Paris)
  const defaultCenter: [number, number] = [48.8566, 2.3522]
  
  // Calculer le centre de la carte
  const center: [number, number] = pointDepart && pointDepart.lat && pointDepart.lon
    ? [pointDepart.lat, pointDepart.lon]
    : visites.length > 0 && visites[0].coordonnees && visites[0].coordonnees.lat && visites[0].coordonnees.lon
    ? [visites[0].coordonnees.lat, visites[0].coordonnees.lon]
    : defaultCenter

  // Créer le trajet (polyline)
  const routeCoordinates: [number, number][] = []
  
  if (pointDepart && pointDepart.lat && pointDepart.lon) {
    routeCoordinates.push([pointDepart.lat, pointDepart.lon])
  }
  
  visites.forEach(visite => {
    if (visite.coordonnees && visite.coordonnees.lat && visite.coordonnees.lon) {
      routeCoordinates.push([visite.coordonnees.lat, visite.coordonnees.lon])
    }
  })
  
  // Retour au domicile
  if (pointDepart && pointDepart.lat && pointDepart.lon && routeCoordinates.length > 1) {
    routeCoordinates.push([pointDepart.lat, pointDepart.lon])
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds visites={visites} pointDepart={pointDepart} />
        
        {/* Marqueur du domicile */}
        {pointDepart && pointDepart.lat && pointDepart.lon && (
          <Marker position={[pointDepart.lat, pointDepart.lon]} icon={homeIcon}>
            <Popup>
              <div className="font-semibold">🏠 Point de départ</div>
              <div className="text-sm">{pointDepart.adresse}</div>
            </Popup>
          </Marker>
        )}
        
        {/* Marqueurs des visites */}
        {visites.map((visite, index) => {
          if (!visite.coordonnees || !visite.coordonnees.lat || !visite.coordonnees.lon) return null
          
          return (
            <Marker 
              key={index} 
              position={[visite.coordonnees.lat, visite.coordonnees.lon]}
              icon={visite.heureRdv ? fixedIcon : undefined}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">
                    {visite.ordre}. {visite.client.entreprise || visite.client.nom}
                  </div>
                  {visite.heureRdv && (
                    <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      🔴 RDV fixe à {visite.heureRdv}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    📍 {visite.client.adresse}, {visite.client.ville}
                  </div>
                  <div className="text-sm">
                    🕐 Arrivée: {visite.heureArrivee}
                  </div>
                  <div className="text-sm">
                    🕐 Départ: {visite.heureDepart}
                  </div>
                  {visite.distance > 0 && (
                    <div className="text-sm">
                      🚗 Distance: {visite.distance} km
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
        
        {/* Trajet */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="#3b82f6"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  )
}
