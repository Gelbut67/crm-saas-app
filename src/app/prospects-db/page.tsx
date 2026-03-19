"use client"

import { useState } from "react"
import { useProspects } from "@/hooks/useDatabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Building2, Phone, Mail, UserCheck } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function ProspectsPage() {
  const { prospects, loading, createProspect } = useProspects()
  const [showForm, setShowForm] = useState(false)

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
          <h1 className="text-3xl font-bold">Prospects</h1>
          <p className="text-muted-foreground">
            {prospects.length} prospect{prospects.length > 1 ? 's' : ''} en suivi
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau prospect
        </Button>
      </div>

      {prospects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun prospect</h3>
            <p className="text-muted-foreground text-center mb-4">
              Commencez par ajouter votre premier prospect
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un prospect
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {prospects.map((prospect) => (
            <Card key={prospect.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{prospect.nom}</h3>
                      {prospect.entreprise && (
                        <Badge variant="secondary">{prospect.entreprise}</Badge>
                      )}
                      <Badge variant="outline">Prospect</Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {prospect.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {prospect.email}
                        </div>
                      )}
                      {prospect.telephone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {prospect.telephone}
                        </div>
                      )}
                      {prospect.secteur && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {prospect.secteur}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Prospect depuis {format(new Date(prospect.dateCreation), 'MMM yyyy', { locale: fr })}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/prospects/${prospect.id}`}>
                          Voir détails
                        </Link>
                      </Button>
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
              <CardTitle>Nouveau prospect</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const prospectData = {
                  nom: formData.get('nom') as string,
                  email: formData.get('email') as string,
                  telephone: formData.get('telephone') as string,
                  entreprise: formData.get('entreprise') as string,
                  secteur: formData.get('secteur') as string,
                }
                
                if (await createProspect(prospectData)) {
                  setShowForm(false)
                }
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom *</label>
                  <input name="nom" required className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input name="email" type="email" className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium">Téléphone</label>
                  <input name="telephone" className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium">Entreprise</label>
                  <input name="entreprise" className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium">Secteur</label>
                  <input name="secteur" className="w-full mt-1 px-3 py-2 border rounded-md" />
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
