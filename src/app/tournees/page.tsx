"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Clock, Users, Navigation, FileText, Loader2, Calendar, Home, HistoryIcon, Search, ListChecks, Sliders, Coffee, Save, History } from "lucide-react"
import { TourneeHistory } from "@/components/tournee-history"
import { useClients, useProspects } from "@/hooks/useDatabase"
import { RdvFixesManager } from "@/components/rdv-fixes-manager"
import dynamic from 'next/dynamic'

// Charger la carte côté client uniquement
const TourneeMap = dynamic(
  () => import('@/components/tournee-map').then(mod => ({ default: mod.TourneeMap })),
  { ssr: false, loading: () => <div className="w-full h-[500px] bg-muted animate-pulse rounded-lg" /> }
)

interface VisiteOptimisee {
  type: 'visite' | 'pause' | 'depart_domicile' | 'retour_domicile'
  client: {
    id: string
    nom: string
    entreprise?: string
    adresse?: string
    ville?: string
    codePostal?: string
    statut: string
  } | null
  ordre: number | null
  heureArrivee: string
  heureDepart: string
  distance: number
  duree: number
  heureRdv?: string
  derniereVisite?: string | null
  adresse?: string
}

export default function TourneesPage() {
  const { clients, loading: loadingClients } = useClients()
  const { prospects, loading: loadingProspects } = useProspects()
  
  // Combiner clients et prospects
  const allClientsAndProspects = [...clients, ...prospects]
  const loading = loadingClients || loadingProspects
  
  const [typeTournee, setTypeTournee] = useState<'client' | 'prospect' | 'mixte'>('client')
  const [heureDepart, setHeureDepart] = useState('09:00')
  const [heureRetour, setHeureRetour] = useState('18:00')
  const [dureeRdv, setDureeRdv] = useState('60')
  const [tempsPause, setTempsPause] = useState('0')
  const [heurePause, setHeurePause] = useState('12:00')
  const [filtrerVisites, setFiltrerVisites] = useState(false)
  const [joursDepuisVisite, setJoursDepuisVisite] = useState('30')
  const [departement, setDepartement] = useState('tous')
  const [ville, setVille] = useState('toutes')
  const [adresseDomicile, setAdresseDomicile] = useState('')
  const [villeDomicile, setVilleDomicile] = useState('')
  const [codePostalDomicile, setCodePostalDomicile] = useState('')
  const [rdvFixes, setRdvFixes] = useState<any[]>([])
  const [modeSelection, setModeSelection] = useState<'auto' | 'manuel'>('auto')
  const [clientsSelectionnes, setClientsSelectionnes] = useState<Set<string>>(new Set())
  const [rechercheSelection, setRechercheSelection] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  const [tourneeOptimisee, setTourneeOptimisee] = useState<VisiteOptimisee[]>([])
  const [pointDepartOptimise, setPointDepartOptimise] = useState<{ lat: number; lon: number; adresse: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [stats, setStats] = useState<{
    distanceTotale: number
    dureeTrajet: number
    nombreVisites: number
    heureRetourEstimee?: string | null
  } | null>(null)

  const departements = Array.from(new Set(
    allClientsAndProspects
      .filter(c => c.departement)
      .map(c => c.departement)
  )).sort()

  const villes = Array.from(new Set(
    allClientsAndProspects
      .filter(c => c.ville && (departement === 'tous' || c.departement === departement))
      .map(c => c.ville)
  )).sort()

  // Filtrer les clients disponibles pour la sélection prioritaire
  const clientsDisponibles = allClientsAndProspects.filter(c => {
    if (typeTournee === 'client' && c.statut !== 'client') return false
    if (typeTournee === 'prospect' && c.statut !== 'prospect') return false
    if (departement !== 'tous' && c.departement !== departement) return false
    if (ville !== 'toutes' && c.ville !== ville) return false
    return true // Afficher tous les clients correspondants
  })
  
  // Clients avec adresse complète pour l'optimisation
  const clientsAvecAdresse = clientsDisponibles.filter(c => 
    c.adresse && c.ville && c.codePostal
  )

  // Charger l'adresse du domicile depuis les paramètres
  useEffect(() => {
    const chargerAdresseDomicile = async () => {
      try {
        const response = await fetch('/api/settings?key=adresse_domicile')
        if (response.ok) {
          const data = await response.json()
          if (data.value) {
            setAdresseDomicile(data.value.adresse || '')
            setVilleDomicile(data.value.ville || '')
            setCodePostalDomicile(data.value.codePostal || '')
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'adresse du domicile:', error)
      }
    }
    chargerAdresseDomicile()
  }, [])

  const clientsFiltresPourSelection = allClientsAndProspects.filter(c => {
    if (typeTournee === 'client' && c.statut !== 'client') return false
    if (typeTournee === 'prospect' && c.statut !== 'prospect') return false
    const search = rechercheSelection.toLowerCase()
    if (search && !c.nom.toLowerCase().includes(search) &&
        !(c.entreprise || '').toLowerCase().includes(search) &&
        !(c.ville || '').toLowerCase().includes(search)) return false
    return true
  })

  const toggleClientSelection = (id: string) => {
    setClientsSelectionnes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectionnerTous = () => {
    setClientsSelectionnes(new Set(clientsFiltresPourSelection.map(c => c.id)))
  }

  const deselectionnerTous = () => {
    setClientsSelectionnes(new Set())
  }

  const optimiserTournee = async () => {
    if (modeSelection === 'manuel' && clientsSelectionnes.size === 0) {
      alert('Veuillez sélectionner au moins un client ou prospect.')
      return
    }
    setOptimizing(true)
    try {
      const response = await fetch('/api/tournees/optimiser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          typeTournee,
          heureDepart,
          heureRetour,
          dureeRdv: parseInt(dureeRdv),
          tempsPause: parseInt(tempsPause) || 0,
          heurePause,
          departement,
          ville,
          clientIds: modeSelection === 'manuel' ? Array.from(clientsSelectionnes) : undefined,
          pointDepart: adresseDomicile && villeDomicile && codePostalDomicile ? {
            adresse: adresseDomicile,
            ville: villeDomicile,
            codePostal: codePostalDomicile
          } : null,
          filtrerVisites,
          joursDepuisVisite: parseInt(joursDepuisVisite) || 30,
          rdvFixes: rdvFixes.map(rdv => ({
            clientId: rdv.clientId,
            heureRdv: rdv.heureRdv
          }))
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Enrichir avec le nombre de visites effectuées (depuis les interactions locales)
        const enriched = data.visites.map((v: any) => {
          if (v.type === 'pause') return v
          const local = allClientsAndProspects.find((c: any) => c.id === v.client?.id)
          return {
            ...v,
            nombreVisites: local?.interactions?.filter((i: any) => i.type === 'visite').length ?? 0,
          }
        })
        setTourneeOptimisee(enriched)
        setStats(data.stats)
        setPointDepartOptimise(data.pointDepart)
        setSavedOk(false)
      } else {
        const data = await response.json().catch(() => ({}))
        alert(data.error || 'Erreur lors de l\'optimisation de la tournée')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'optimisation de la tournée')
    } finally {
      setOptimizing(false)
    }
  }

  const sauvegarderTournee = async () => {
    setSaving(true)
    try {
      const nom = prompt('Nom de la tournée (optionnel) :', new Date().toLocaleDateString('fr-FR'))
      if (nom === null) return // annulé
      const visitesToSave = tourneeOptimisee
        .filter(v => v.type === 'visite' && v.client)
        .map((v, idx) => ({
          clientId: v.client!.id,
          ordre: v.ordre ?? idx + 1,
          heureArrivee: v.heureArrivee,
          heureDepart: v.heureDepart,
        }))
      const res = await fetch('/api/tournees/historique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nom || null, date: new Date().toISOString(), visites: visitesToSave }),
      })
      if (res.ok) {
        setSavedOk(true)
        setShowHistory(true)
      }
    } finally {
      setSaving(false)
    }
  }

  const genererFeuilleRoute = async () => {
    try {
      const response = await fetch('/api/tournees/feuille-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visites: tourneeOptimisee,
          stats,
          typeTournee,
          date: new Date().toISOString(),
          pointDepart: pointDepartOptimise
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        // Ouvrir dans un nouvel onglet pour impression
        window.open(url, '_blank')
        
        // Télécharger aussi le fichier
        const a = document.createElement('a')
        a.href = url
        a.download = `feuille-route-${new Date().toISOString().split('T')[0]}.html`
        document.body.appendChild(a)
        a.click()
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }, 100)
        
        alert('✅ Feuille de route générée ! Utilisez Ctrl+P pour imprimer en PDF depuis le nouvel onglet.')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la génération de la feuille de route')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Optimisation de tournées</h1>
          <p className="text-muted-foreground">Planifiez vos visites de manière optimale avec l'IA</p>
        </div>
        <Navigation className="w-8 h-8 text-primary" />
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Formulaire de configuration */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Paramétrez votre tournée</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Toggle mode */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setModeSelection('auto')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                  modeSelection === 'auto' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Automatique
              </button>
              <button
                onClick={() => setModeSelection('manuel')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                  modeSelection === 'manuel' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                Manuel
                {modeSelection === 'manuel' && clientsSelectionnes.size > 0 && (
                  <span className="ml-1 bg-primary-foreground text-primary text-xs rounded-full px-1.5 py-0.5 font-bold">{clientsSelectionnes.size}</span>
                )}
              </button>
            </div>

            <div>
              <Label>Type de tournée</Label>
              <Select value={typeTournee} onValueChange={(v: any) => setTypeTournee(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Clients uniquement</SelectItem>
                  <SelectItem value="prospect">Prospection uniquement</SelectItem>
                  <SelectItem value="mixte">Mixte (clients + prospects)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Heure de départ</Label>
                <Input
                  type="time"
                  value={heureDepart}
                  onChange={(e) => setHeureDepart(e.target.value)}
                />
              </div>
              <div>
                <Label>Heure de retour</Label>
                <Input
                  type="time"
                  value={heureRetour}
                  onChange={(e) => setHeureRetour(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Durée moyenne du RDV (minutes)</Label>
              <Input
                type="number"
                value={dureeRdv}
                onChange={(e) => setDureeRdv(e.target.value)}
                min="15"
                step="15"
              />
            </div>

            <div className="pt-2 border-t space-y-3">
              <div>
                <Label>Temps de pause (minutes)</Label>
                <Input
                  type="number"
                  value={tempsPause}
                  onChange={(e) => setTempsPause(e.target.value)}
                  min="0"
                  step="15"
                  placeholder="0 = pas de pause"
                />
              </div>
              {parseInt(tempsPause) > 0 && (
                <div>
                  <Label>Heure de la pause</Label>
                  <Input
                    type="time"
                    value={heurePause}
                    onChange={(e) => setHeurePause(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">La pause sera insérée dès cette heure atteinte</p>
                </div>
              )}
            </div>

            {/* Sélection manuelle */}
            {modeSelection === 'manuel' && (
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Sélectionner les visites</Label>
                  <div className="flex gap-1">
                    <button onClick={selectionnerTous} className="text-xs text-primary underline">Tout</button>
                    <span className="text-xs text-muted-foreground">·</span>
                    <button onClick={deselectionnerTous} className="text-xs text-muted-foreground underline">Aucun</button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Nom, entreprise, ville..."
                    value={rechercheSelection}
                    onChange={e => setRechercheSelection(e.target.value)}
                    className="pl-7 h-8 text-sm"
                  />
                </div>
                <div className="border rounded-md overflow-y-auto max-h-56 divide-y">
                  {clientsFiltresPourSelection.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucun résultat</p>
                  )}
                  {clientsFiltresPourSelection.map(c => (
                    <label key={c.id} className="flex items-start gap-2 px-3 py-2 hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={clientsSelectionnes.has(c.id)}
                        onChange={() => toggleClientSelection(c.id)}
                        className="mt-0.5 accent-primary"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{c.nom}</span>
                          <span className={`text-xs px-1 rounded ${
                            c.statut === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>{c.statut === 'client' ? 'C' : 'P'}</span>
                        </div>
                        {c.entreprise && <p className="text-xs text-muted-foreground truncate">{c.entreprise}</p>}
                        {c.ville && <p className="text-xs text-muted-foreground">{c.ville}{c.codePostal ? ` (${c.codePostal})` : ''}</p>}
                      </div>
                    </label>
                  ))}
                </div>
                {clientsSelectionnes.size > 0 && (
                  <p className="text-xs text-primary font-medium">{clientsSelectionnes.size} sélectionné{clientsSelectionnes.size > 1 ? 's' : ''}</p>
                )}
              </div>
            )}

            {modeSelection === 'auto' && (
            <div>
              <Label>Département</Label>
              <Select value={departement} onValueChange={setDepartement}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les départements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les départements</SelectItem>
                  {departements.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>)}

            {modeSelection === 'auto' && (
            <div>
              <Label>Ville</Label>
              <Select value={ville} onValueChange={setVille}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les villes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes les villes</SelectItem>
                  {villes.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Home className="w-4 h-4" />
                Point de départ (optionnel)
              </div>
              <div>
                <Label className="text-xs">Adresse</Label>
                <Input
                  placeholder="Ex: 123 rue de la Paix"
                  value={adresseDomicile}
                  onChange={(e) => setAdresseDomicile(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Ville</Label>
                  <Input
                    placeholder="Paris"
                    value={villeDomicile}
                    onChange={(e) => setVilleDomicile(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Code postal</Label>
                  <Input
                    placeholder="75001"
                    value={codePostalDomicile}
                    onChange={(e) => setCodePostalDomicile(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                🏠 Si renseigné, la tournée commencera et finira à cette adresse
              </p>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="filtrerVisites"
                  checked={filtrerVisites}
                  onChange={e => setFiltrerVisites(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="filtrerVisites" className="text-sm font-medium cursor-pointer">
                  Filtrer par dernière visite
                </label>
              </div>
              {filtrerVisites && (
                <div>
                  <Label className="text-xs">Exclure les visités depuis moins de (jours)</Label>
                  <Input
                    type="number"
                    value={joursDepuisVisite}
                    onChange={e => setJoursDepuisVisite(e.target.value)}
                    min="1"
                    step="1"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    🎯 Les non-visités seront placés en priorité
                  </p>
                </div>
              )}
            </div>

            <Button 
              onClick={optimiserTournee} 
              disabled={optimizing}
              className="w-full"
            >
              {optimizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Optimisation en cours...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Optimiser la tournée
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* RDV Fixes */}
        <RdvFixesManager
          clients={clientsDisponibles}
          rdvFixes={rdvFixes}
          onChange={setRdvFixes}
        />

        {/* Résultats */}
        <div className="md:col-span-2 space-y-6">
          {/* Statistiques */}
          {stats && (
            <div className={`grid gap-4 ${stats.heureRetourEstimee ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{stats.nombreVisites}</div>
                    <div className="text-sm text-muted-foreground">Visites</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{stats.distanceTotale} km</div>
                    <div className="text-sm text-muted-foreground">Distance</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{Math.round(stats.dureeTrajet / 60)}h{stats.dureeTrajet % 60}m</div>
                    <div className="text-sm text-muted-foreground">Trajet</div>
                  </div>
                </CardContent>
              </Card>
              {stats.heureRetourEstimee && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Home className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-700">{stats.heureRetourEstimee}</div>
                      <div className="text-sm text-muted-foreground">Retour domicile</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Carte interactive */}
          {tourneeOptimisee.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Visualisation du trajet
                </CardTitle>
                <CardDescription>
                  Carte interactive avec votre itinéraire optimisé
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TourneeMap 
                  visites={tourneeOptimisee.filter(v => v.type === 'visite') as any}
                  pointDepart={pointDepartOptimise || undefined}
                />
              </CardContent>
            </Card>
          )}

          {/* Feuille de route */}
          {tourneeOptimisee.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Feuille de route optimisée</CardTitle>
                    <CardDescription>
                      {tourneeOptimisee.filter(v => v.type === 'visite').length} visite{tourneeOptimisee.filter(v => v.type === 'visite').length > 1 ? 's' : ''} planifiée{tourneeOptimisee.filter(v => v.type === 'visite').length > 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {savedOk ? (
                      <span className="text-sm text-green-600 font-medium flex items-center gap-1 mr-2">✓ Sauvegardée</span>
                    ) : (
                      <Button onClick={sauvegarderTournee} disabled={saving} variant="outline" size="sm">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Sauvegarder
                      </Button>
                    )}
                    <Button onClick={genererFeuilleRoute} variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Imprimer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tourneeOptimisee.map((visite, index) => {
                    if (visite.type === 'depart_domicile' || visite.type === 'retour_domicile') {
                      const isDepart = visite.type === 'depart_domicile'
                      return (
                        <div key={`${visite.type}-${index}`} className={`flex items-center gap-3 px-4 py-3 border border-dashed rounded-lg ${
                          isDepart ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        }`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isDepart ? 'bg-green-200 dark:bg-green-800' : 'bg-blue-200 dark:bg-blue-800'
                          }`}>
                            <Home className={`w-5 h-5 ${isDepart ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`} />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${isDepart ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                              {isDepart ? 'Départ domicile' : 'Retour domicile'}
                            </p>
                            <p className={`text-sm ${isDepart ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {visite.heureArrivee}
                              {!isDepart && visite.distance > 0 && (
                                <span className="ml-2 text-xs">({visite.distance} km • {visite.duree} min de trajet)</span>
                              )}
                            </p>
                            {visite.adresse && (
                              <p className="text-xs text-muted-foreground mt-0.5">{visite.adresse}</p>
                            )}
                          </div>
                        </div>
                      )
                    }

                    if (visite.type === 'pause') {
                      return (
                        <div key={`pause-${index}`} className="flex items-center gap-3 px-4 py-3 border border-dashed border-yellow-400 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                          <div className="w-10 h-10 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center flex-shrink-0">
                            <Coffee className="w-5 h-5 text-yellow-700 dark:text-yellow-300" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Pause déjeuner</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {visite.heureArrivee} – {visite.heureDepart}
                              <span className="ml-2 text-xs">({visite.duree} min)</span>
                            </p>
                          </div>
                        </div>
                      )
                    }

                    const client = visite.client!
                    return (
                      <div
                        key={client.id}
                        className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                          visite.heureRdv ? 'border-l-4 border-l-blue-500' :
                          !visite.derniereVisite ? 'border-l-4 border-l-amber-400' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                              {visite.ordre}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{client.nom}</h3>
                              <Badge variant={client.statut === 'client' ? 'default' : 'secondary'}>
                                {client.statut === 'client' ? 'Client' : 'Prospect'}
                              </Badge>
                              {visite.heureRdv && (
                                <Badge variant="outline" className="text-blue-600 border-blue-400 text-xs">
                                  RDV fixé {visite.heureRdv}
                                </Badge>
                              )}
                              {(visite as any).nombreVisites > 0 && (
                                <span className="inline-flex items-center bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full px-2 py-0.5 font-medium">
                                  {(visite as any).nombreVisites} visite{(visite as any).nombreVisites > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {client.entreprise && (
                              <p className="text-sm text-muted-foreground mb-1">{client.entreprise}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {client.adresse}, {client.codePostal} {client.ville}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs mt-1">
                              <HistoryIcon className="w-3 h-3 text-muted-foreground" />
                              {visite.derniereVisite
                                ? <span className="text-muted-foreground">Dernière visite : {new Date(visite.derniereVisite).toLocaleDateString('fr-FR')}</span>
                                : <span className="text-amber-600 font-medium">Jamais visité</span>
                              }
                            </div>
                            <div className="flex items-center gap-4 text-sm mt-2">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">{visite.heureArrivee} - {visite.heureDepart}</span>
                              </div>
                              {visite.distance > 0 && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-muted-foreground">
                                    {visite.distance} km • {visite.duree} min de trajet
                                    {index === 0 && pointDepartOptimise && ' (depuis domicile)'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* État vide */}
          {tourneeOptimisee.length === 0 && !optimizing && (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground">
                  <Navigation className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Aucune tournée optimisée</p>
                  <p className="text-sm">
                    Configurez les paramètres et cliquez sur "Optimiser la tournée"
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historique des tournées */}
          <div>
            <button
              onClick={() => setShowHistory(h => !h)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <History className="w-4 h-4" />
              {showHistory ? 'Masquer' : 'Afficher'} l'historique des tournées
            </button>
            {showHistory && (
              <TourneeHistory onVisiteMarked={() => {}} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
