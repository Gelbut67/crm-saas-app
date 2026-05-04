"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Clock, Users, Navigation, FileText, Loader2, Download, Calendar } from "lucide-react"
import { useClients } from "@/hooks/useDatabase"

interface VisiteOptimisee {
  client: {
    id: string
    nom: string
    entreprise?: string
    adresse?: string
    ville?: string
    codePostal?: string
    statut: string
  }
  ordre: number
  heureArrivee: string
  heureDepart: string
  distance: number
  duree: number
}

export default function TourneesPage() {
  const { clients, loading: loadingClients } = useClients()
  const [typeTournee, setTypeTournee] = useState<'client' | 'prospect' | 'mixte'>('client')
  const [heureDepart, setHeureDepart] = useState('09:00')
  const [heureRetour, setHeureRetour] = useState('18:00')
  const [dureeRdv, setDureeRdv] = useState('60')
  const [departement, setDepartement] = useState('tous')
  const [ville, setVille] = useState('toutes')
  const [clientPrioritaire, setClientPrioritaire] = useState('aucun')
  const [optimizing, setOptimizing] = useState(false)
  const [tourneeOptimisee, setTourneeOptimisee] = useState<VisiteOptimisee[]>([])
  const [stats, setStats] = useState<{
    distanceTotale: number
    dureeTrajet: number
    nombreVisites: number
  } | null>(null)

  const departements = Array.from(new Set(
    clients
      .filter(c => c.departement)
      .map(c => c.departement)
  )).sort()

  const villes = Array.from(new Set(
    clients
      .filter(c => c.ville && (departement === 'tous' || c.departement === departement))
      .map(c => c.ville)
  )).sort()

  // Filtrer les clients disponibles pour la sélection prioritaire
  const clientsDisponibles = clients.filter(c => {
    if (typeTournee === 'client' && c.statut !== 'client') return false
    if (typeTournee === 'prospect' && c.statut !== 'prospect') return false
    if (departement !== 'tous' && c.departement !== departement) return false
    if (ville !== 'toutes' && c.ville !== ville) return false
    return c.adresse && c.ville && c.codePostal
  })

  const optimiserTournee = async () => {
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
          departement,
          ville,
          clientPrioritaireId: clientPrioritaire !== 'aucun' ? clientPrioritaire : null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTourneeOptimisee(data.visites)
        setStats(data.stats)
      } else {
        alert('Erreur lors de l\'optimisation de la tournée')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'optimisation de la tournée')
    } finally {
      setOptimizing(false)
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
          date: new Date().toISOString()
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `feuille-route-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
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

      <div className="grid md:grid-cols-3 gap-6">
        {/* Formulaire de configuration */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Paramétrez votre tournée</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            </div>

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

            <div>
              <Label>RDV prioritaire (optionnel)</Label>
              <Select value={clientPrioritaire} onValueChange={setClientPrioritaire}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun RDV prioritaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucun">Aucun RDV prioritaire</SelectItem>
                  {clientsDisponibles.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom} - {client.ville}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                La tournée commencera par ce client
              </p>
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

        {/* Résultats */}
        <div className="md:col-span-2 space-y-6">
          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
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
            </div>
          )}

          {/* Feuille de route */}
          {tourneeOptimisee.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Feuille de route optimisée</CardTitle>
                    <CardDescription>
                      {tourneeOptimisee.length} visite{tourneeOptimisee.length > 1 ? 's' : ''} planifiée{tourneeOptimisee.length > 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Button onClick={genererFeuilleRoute} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tourneeOptimisee.map((visite, index) => (
                    <div
                      key={visite.client.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            {visite.ordre}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{visite.client.nom}</h3>
                            <Badge variant={visite.client.statut === 'client' ? 'default' : 'secondary'}>
                              {visite.client.statut === 'client' ? 'Client' : 'Prospect'}
                            </Badge>
                          </div>
                          {visite.client.entreprise && (
                            <p className="text-sm text-muted-foreground mb-1">{visite.client.entreprise}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {visite.client.adresse}, {visite.client.codePostal} {visite.client.ville}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="font-medium">{visite.heureArrivee} - {visite.heureDepart}</span>
                            </div>
                            {index > 0 && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">
                                  {visite.distance} km • {visite.duree} min de trajet
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
        </div>
      </div>
    </div>
  )
}
