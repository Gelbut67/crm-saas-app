"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X, Clock, MapPin } from "lucide-react"

interface RdvFixe {
  id: string
  clientId: string
  clientNom: string
  clientVille: string
  heureRdv: string
}

interface RdvFixesManagerProps {
  clients: any[]
  rdvFixes: RdvFixe[]
  onChange: (rdvFixes: RdvFixe[]) => void
}

export function RdvFixesManager({ clients, rdvFixes, onChange }: RdvFixesManagerProps) {
  const [selectedClient, setSelectedClient] = useState('')
  const [heureRdv, setHeureRdv] = useState('10:00')

  const ajouterRdv = () => {
    if (!selectedClient) return

    const client = clients.find(c => c.id === selectedClient)
    if (!client) return

    const nouveauRdv: RdvFixe = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: client.id,
      clientNom: client.nom,
      clientVille: client.ville || '',
      heureRdv
    }

    onChange([...rdvFixes, nouveauRdv])
    setSelectedClient('')
    setHeureRdv('10:00')
  }

  const supprimerRdv = (id: string) => {
    onChange(rdvFixes.filter(rdv => rdv.id !== id))
  }

  const clientsDisponibles = clients.filter(
    c => !rdvFixes.find(rdv => rdv.clientId === c.id)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          RDV Fixes (optionnel)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Définissez des rendez-vous à des horaires précis. L'IA optimisera le reste de la tournée autour de ces contraintes.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liste des RDV fixes */}
        {rdvFixes.length > 0 && (
          <div className="space-y-2">
            {rdvFixes.map((rdv) => (
              <div
                key={rdv.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-950"
              >
                <div className="flex-1">
                  <div className="font-medium">{rdv.clientNom}</div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {rdv.clientVille}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rdv.heureRdv}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => supprimerRdv(rdv.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire d'ajout */}
        <div className="space-y-3 pt-3 border-t">
          <div>
            <Label>Client / Prospect</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clientsDisponibles.map(client => {
                  const hasCompleteAddress = client.adresse && client.ville && client.codePostal
                  return (
                    <SelectItem 
                      key={client.id} 
                      value={client.id}
                      disabled={!hasCompleteAddress}
                    >
                      {client.nom} - {client.ville || 'Ville non renseignée'}
                      {!hasCompleteAddress && ' ⚠️ (Adresse incomplète)'}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              ⚠️ Les clients sans adresse complète (adresse, ville, code postal) ne peuvent pas être ajoutés
            </p>
          </div>

          <div>
            <Label>Heure du RDV</Label>
            <Input
              type="time"
              value={heureRdv}
              onChange={(e) => setHeureRdv(e.target.value)}
            />
          </div>

          <Button
            onClick={ajouterRdv}
            disabled={!selectedClient}
            className="w-full"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter ce RDV fixe
          </Button>
        </div>

        {rdvFixes.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Aucun RDV fixe défini. L'IA optimisera librement toute la tournée.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
