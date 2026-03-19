"use client"

import { useState } from "react"
import { useDevis, useClients, useProspects } from "@/hooks/useDatabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Calendar, DollarSign, User, Building2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function DevisPage() {
  const { devis, loading, reload: reloadDevis } = useDevis()
  const { clients } = useClients()
  const { prospects } = useProspects()
  const [showForm, setShowForm] = useState(false)

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'gagne':
        return <Badge className="bg-green-100 text-green-800">Gagné</Badge>
      case 'perdu':
        return <Badge variant="destructive">Perdu</Badge>
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
      default:
        return <Badge variant="secondary">{statut}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Devis</h1>
          <p className="text-muted-foreground">
            {devis.length} devis{devis.length > 1 ? '' : ''}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau devis
        </Button>
      </div>

      {devis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun devis</h3>
            <p className="text-muted-foreground text-center mb-4">
              Commencez par créer votre premier devis
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un devis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {devis.map((devi) => (
            <Card key={devi.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{devi.titre}</h3>
                      {getStatutBadge(devi.statut)}
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {devi.client.nom}
                        {devi.client.entreprise && (
                          <>
                            <Building2 className="w-4 h-4 ml-2" />
                            {devi.client.entreprise}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Échéance : {format(new Date(devi.dateEcheance), 'dd MMM yyyy', { locale: fr })}
                      </div>
                      {devi.description && (
                        <p className="text-muted-foreground mt-2">{devi.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-green-600">
                          {devi.montant.toLocaleString()} €
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/devis/${devi.id}`}>
                            Voir détails
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulaire simplifié */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nouveau devis</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const devisData = {
                  titre: formData.get('titre') as string,
                  montant: parseFloat(formData.get('montant') as string),
                  clientId: formData.get('clientId') as string,
                  statut: 'en_cours',
                  dateEcheance: formData.get('dateEcheance') as string,
                  description: formData.get('description') as string,
                }
                
                try {
                  const response = await fetch('/api/devis', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(devisData),
                  })
                  
                  if (response.ok) {
                    await reloadDevis()
                    setShowForm(false)
                  }
                } catch (error) {
                  console.error('Erreur:', error)
                }
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Titre *</label>
                  <input name="titre" required className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium">Montant (€) *</label>
                  <input name="montant" type="number" required min="0" step="0.01" className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium">Client *</label>
                  <select name="clientId" required className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option value="">Sélectionner un client/prospect</option>
                    <optgroup label="Clients">
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.nom} {client.entreprise && `- ${client.entreprise}`}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Prospects">
                      {prospects.map((prospect) => (
                        <option key={prospect.id} value={prospect.id}>
                          {prospect.nom} {prospect.entreprise && `- ${prospect.entreprise}`}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date d'échéance *</label>
                  <input name="dateEcheance" type="date" required className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea name="description" rows={3} className="w-full mt-1 px-3 py-2 border rounded-md"></textarea>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Créer</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
