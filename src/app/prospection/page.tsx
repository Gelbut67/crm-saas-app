'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MapPin, Navigation, Search, Loader2, Plus, Phone, Globe, Building2,
  Users, Star, Sparkles, SlidersHorizontal, ChevronRight, CheckCircle2, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Resultat = {
  id: string
  nom: string
  entreprise?: string
  type?: string
  statut?: string
  secteur?: string
  distance: number
  lat: number
  lon: number
  adresse?: string
  ville?: string
  codePostal?: string
  phone?: string
  website?: string
  email?: string
  source: 'base' | 'osm'
}

const RAYONS = [1, 2, 5, 10, 20]

function formatDist(d: number) {
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`
}

function couleurStatut(r: Resultat) {
  if (r.source === 'osm') return '#8b5cf6'
  return r.statut === 'client' ? '#22c55e' : '#f59e0b'
}

function BadgeStatut({ r }: { r: Resultat }) {
  if (r.source === 'osm') return <Badge className="bg-purple-100 text-purple-700 text-[10px]">Nouveau</Badge>
  if (r.statut === 'client') return <Badge className="bg-green-100 text-green-700 text-[10px]">Client</Badge>
  return <Badge className="bg-amber-100 text-amber-700 text-[10px]">Prospect</Badge>
}

export default function ProspectionPage() {
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [rayon, setRayon] = useState(5)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [osmLoading, setOsmLoading] = useState(false)
  const [existants, setExistants] = useState<Resultat[]>([])
  const [nouveaux, setNouveaux] = useState<Resultat[]>([])
  const [onglet, setOnglet] = useState<'existants' | 'nouveaux'>('existants')
  const [selected, setSelected] = useState<Resultat | null>(null)
  const [ajoutEnCours, setAjoutEnCours] = useState<string | null>(null)
  const [ajoutsOk, setAjoutsOk] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3500)
  }

  const normaliserLocal = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const haversineLocal = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  const rechercherOSM = useCallback(async (
    pos: {lat:number,lon:number},
    r: number,
    osmTags: {key:string,value:string}[],
    osmKeywords: string[],
    nomsConnus: string[]
  ) => {
    setOsmLoading(true)
    setNouveaux([])
    try {
      const rayonM = Math.round(r * 1000)
      const parts: string[] = []
      // Tags specifiques generes par l'IA
      osmTags.forEach(t => {
        parts.push(`node["${t.key}"="${t.value}"](around:${rayonM},${pos.lat},${pos.lon});`)
        parts.push(`way["${t.key}"="${t.value}"](around:${rayonM},${pos.lat},${pos.lon});`)
      })
      // Mots-cles dans le nom
      if (osmKeywords.length > 0) {
        const kw = osmKeywords.map(k => k.replace(/[^a-zA-Z0-9]/g, '')).filter(Boolean).join('|')
        if (kw) {
          parts.push(`node["name"~"${kw}",i](around:${rayonM},${pos.lat},${pos.lon});`)
          parts.push(`way["name"~"${kw}",i](around:${rayonM},${pos.lat},${pos.lon});`)
        }
      }
      // Si pas de prompt, recherche generale
      if (parts.length === 0) {
        ;['shop','amenity','craft','office'].forEach(tag => {
          parts.push(`node["${tag}"]["name"](around:${rayonM},${pos.lat},${pos.lon});`)
          parts.push(`way["${tag}"]["name"](around:${rayonM},${pos.lat},${pos.lon});`)
        })
      }
      const query = `[out:json][timeout:30];\n(\n${parts.join('\n')}\n);\nout center;`
      const mirrors = ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']
      let elements: any[] = []
      for (const url of mirrors) {
        try {
          const res = await fetch(url, { method: 'POST', body: query })
          if (res.ok) { const d = await res.json(); elements = d.elements || []; break }
        } catch { continue }
      }
      const nomsSet = new Set(nomsConnus)
      const results: Resultat[] = elements
        .filter((e: any) => e.tags?.name)
        .map((e: any) => {
          const elat = e.lat ?? e.center?.lat
          const elon = e.lon ?? e.center?.lon
          if (!elat || !elon) return null
          if (nomsSet.has(normaliserLocal(e.tags.name))) return null
          const cat = e.tags.craft || e.tags.shop || e.tags.amenity || e.tags.office || 'entreprise'
          return {
            id: `osm_${e.type}_${e.id}`, nom: e.tags.name, type: cat,
            lat: elat, lon: elon,
            adresse: [e.tags['addr:housenumber'], e.tags['addr:street']].filter(Boolean).join(' ') || undefined,
            ville: e.tags['addr:city'] || e.tags['addr:town'] || e.tags['addr:village'] || undefined,
            codePostal: e.tags['addr:postcode'] || undefined,
            phone: e.tags.phone || e.tags['contact:phone'] || undefined,
            website: e.tags.website || e.tags['contact:website'] || undefined,
            distance: haversineLocal(pos.lat, pos.lon, elat, elon),
            source: 'osm' as const
          }
        })
        .filter(Boolean) as Resultat[]
      results.sort((a, b) => a.distance - b.distance)
      setNouveaux(results)
      if (results.length === 0) showMsg('Aucun nouveau prospect trouv\u00e9 dans ce rayon. Essayez un rayon plus grand.', 'error')
      else setOnglet('nouveaux')
    } catch (e: any) {
      showMsg('Erreur Overpass : ' + e.message, 'error')
    } finally {
      setOsmLoading(false)
    }
  }, [])

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      showMsg('GPS non disponible sur ce navigateur', 'error')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGpsLoading(false)
      },
      () => {
        showMsg('Impossible d\'obtenir la position GPS', 'error')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const rechercher = useCallback(async () => {
    if (!position) return
    setLoading(true)
    setNouveaux([])
    try {
      const params = new URLSearchParams({
        lat: position.lat.toString(),
        lon: position.lon.toString(),
        rayon: rayon.toString(),
        prompt
      })
      const res = await fetch(`/api/prospection/recherche?${params}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setExistants(data.existants || [])
      setOnglet('nouveaux')
      // Appel Overpass depuis le navigateur (pas de blocage serveur)
      rechercherOSM(position, rayon, data.osmTags || [], data.osmKeywords || [], data.nomsConnus || [])
    } catch (e: any) {
      showMsg('Erreur de recherche : ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [position, rayon, prompt, rechercherOSM])

  const ajouterProspect = useCallback(async (r: Resultat) => {
    setAjoutEnCours(r.id)
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: r.nom,
          entreprise: r.nom,
          secteur: r.type || '',
          adresse: r.adresse || '',
          ville: r.ville || '',
          codePostal: r.codePostal || '',
          telephone: r.phone || '',
        })
      })
      if (!res.ok) throw new Error(await res.text())
      setAjoutsOk(prev => { const next = new Set(prev); next.add(r.id); return next })
      showMsg(`${r.nom} ajouté comme prospect ✓`)
    } catch (e: any) {
      showMsg('Erreur : ' + (e as any).message, 'error')
    } finally {
      setAjoutEnCours(null)
    }
  }, [])

  // Init / update map
  useEffect(() => {
    if (!mapRef.current) return

    let destroyed = false

    const initMap = async () => {
      const L = (await import('leaflet')).default
      if (destroyed) return

      // Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Destroy previous instance
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }

      const center: [number, number] = position
        ? [position.lat, position.lon]
        : [46.603354, 1.888334] // France center

      const map = L.map(mapRef.current!).setView(center, position ? 13 : 6)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map)

      if (position) {
        // Position marker
        L.circleMarker([position.lat, position.lon], {
          radius: 10, color: '#3b82f6', fillColor: '#60a5fa', fillOpacity: 0.9, weight: 2
        }).addTo(map).bindPopup('<b>📍 Vous êtes ici</b>')

        // Radius circle
        L.circle([position.lat, position.lon], {
          radius: rayon * 1000,
          color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.04, weight: 1, dashArray: '6 4'
        }).addTo(map)
      }

      markersRef.current = []
      const allResults = [...existants, ...nouveaux]

      allResults.forEach(r => {
        const color = couleurStatut(r)
        const isSelected = selected?.id === r.id
        const icon = L.divIcon({
          html: `<div style="
            background:${color};
            width:${isSelected ? 18 : 13}px;
            height:${isSelected ? 18 : 13}px;
            border-radius:50%;
            border:2.5px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,.35);
            cursor:pointer;
            transition:transform .15s;
          "></div>`,
          className: '',
          iconSize: [isSelected ? 18 : 13, isSelected ? 18 : 13],
          iconAnchor: [isSelected ? 9 : 6, isSelected ? 9 : 6]
        })
        const marker = L.marker([r.lat, r.lon], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:160px">
              <b>${r.nom}</b><br>
              <span style="font-size:11px;color:#666">${r.type || r.secteur || r.statut || ''}</span><br>
              <span style="font-size:11px;color:#3b82f6">📍 ${formatDist(r.distance)}</span>
              ${r.ville ? `<br><span style="font-size:11px">${r.ville}</span>` : ''}
            </div>
          `)
          .on('click', () => setSelected(r))
        markersRef.current.push(marker)
      })

      mapInstance.current = map
    }

    initMap()

    return () => {
      destroyed = true
    }
  }, [position, existants, nouveaux, rayon, selected])

  const listeActive = onglet === 'existants' ? existants : nouveaux
  const total = existants.length + nouveaux.length

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Message flottant */}
      {message && (
        <div className={cn(
          'fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 transition-all',
          message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        )}>
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {message.text}
        </div>
      )}
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-lg">Radar Prospection</h1>
        </div>

        <Button
          size="sm"
          variant={position ? 'outline' : 'default'}
          onClick={getPosition}
          disabled={gpsLoading}
          className="gap-2"
        >
          {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          {position ? `${position.lat.toFixed(4)}, ${position.lon.toFixed(4)}` : 'Ma position GPS'}
        </Button>

        {position && (
          <>
            {/* Rayon */}
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              {RAYONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRayon(r)}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-md transition-colors',
                    rayon === r ? 'bg-primary text-primary-foreground' : 'hover:bg-background'
                  )}
                >{r} km</button>
              ))}
            </div>

            {/* Prompt IA */}
            <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
              <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
              <Input
                placeholder="Ex : brasseries, restaurants, caves à vin..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && rechercher()}
                className="h-8 text-sm"
              />
            </div>

            <Button size="sm" onClick={rechercher} disabled={loading || osmLoading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? 'Recherche...' : 'Rechercher'}
            </Button>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Liste gauche ─── */}
        <div className="w-80 shrink-0 flex flex-col border-r overflow-hidden">
          {/* Onglets */}
          {total > 0 && (
            <div className="flex border-b">
              <button
                onClick={() => setOnglet('existants')}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                  onglet === 'existants' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Users className="h-3.5 w-3.5" />
                Base ({existants.length})
              </button>
              <button
                onClick={() => setOnglet('nouveaux')}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                  onglet === 'nouveaux' ? 'border-b-2 border-violet-500 text-violet-600' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {osmLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Nouveaux ({osmLoading ? '...' : nouveaux.length})
              </button>
            </div>
          )}

          {/* Contenu liste */}
          <div className="flex-1 overflow-y-auto">
            {!position && (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <Navigation className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Activez votre position GPS<br />puis lancez une recherche</p>
                <Button onClick={getPosition} disabled={gpsLoading} className="gap-2">
                  {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  Localiser
                </Button>
              </div>
            )}

            {position && total === 0 && !loading && !osmLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <Search className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Aucun résultat.<br />Ajustez le rayon ou le prompt.</p>
              </div>
            )}

            {(loading || (osmLoading && onglet === 'nouveaux')) && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Analyse de votre base...' : 'Recherche de nouveaux prospects sur la carte...'}
                </p>
              </div>
            )}

            {!loading && !(osmLoading && onglet === 'nouveaux') && listeActive.map(r => (
              <div
                key={r.id}
                onClick={() => setSelected(selected?.id === r.id ? null : r)}
                className={cn(
                  'px-4 py-3 border-b cursor-pointer transition-colors hover:bg-muted/50',
                  selected?.id === r.id && 'bg-primary/5 border-l-2 border-l-primary'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: couleurStatut(r) }} />
                      <p className="font-medium text-sm truncate">{r.nom}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.type || r.secteur || r.statut || 'Entreprise'}
                      {r.ville && ` · ${r.ville}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <BadgeStatut r={r} />
                    <span className="text-xs text-muted-foreground">{formatDist(r.distance)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Légende */}
          {total > 0 && (
            <div className="border-t p-3 flex gap-4 text-[11px] text-muted-foreground bg-muted/30">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Client</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />Prospect</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />Nouveau</span>
            </div>
          )}
        </div>

        {/* ── Map droite ─── */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />

          {/* Panneau détail */}
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 max-w-sm bg-card border rounded-xl shadow-lg p-4 z-[1000]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: couleurStatut(selected) }} />
                    <h3 className="font-semibold">{selected.nom}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {selected.type || selected.secteur || ''} · {formatDist(selected.distance)}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-sm mb-3">
                {selected.adresse && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {[selected.adresse, selected.codePostal, selected.ville].filter(Boolean).join(' ')}
                  </p>
                )}
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Phone className="h-3.5 w-3.5 shrink-0" />{selected.phone}
                  </a>
                )}
                {selected.website && (
                  <a href={selected.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline truncate">
                    <Globe className="h-3.5 w-3.5 shrink-0" />{selected.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>

              {selected.source === 'osm' && (
                <Button
                  size="sm"
                  className="w-full gap-2"
                  disabled={ajoutEnCours === selected.id || ajoutsOk.has(selected.id)}
                  onClick={() => ajouterProspect(selected)}
                >
                  {ajoutsOk.has(selected.id) ? (
                    <><CheckCircle2 className="h-4 w-4" />Ajouté comme prospect</>
                  ) : ajoutEnCours === selected.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Ajout...</>
                  ) : (
                    <><Plus className="h-4 w-4" />Ajouter comme prospect</>
                  )}
                </Button>
              )}

              {selected.source === 'base' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" asChild>
                    <a href={`/${selected.statut === 'client' ? 'clients-db' : 'prospects-db'}`}>
                      <Building2 className="h-3.5 w-3.5" />Voir fiche
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
