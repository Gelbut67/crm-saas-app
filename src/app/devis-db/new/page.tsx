"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { useDevis, useClients, useProspects } from "@/hooks/useDatabase"

function NewDevisForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clients } = useClients()
  const { prospects } = useProspects()
  const { createDevis } = useDevis()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Combiner clients et prospects
  const allClientsAndProspects = [...clients, ...prospects]
  
  const [formData, setFormData] = useState({
    titre: "",
    montant: "",
    clientId: searchParams.get('clientId') || "",
    dateEcheance: "",
    description: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const devisData = {
        titre: formData.titre,
        montantTotal: parseFloat(formData.montant),
        clientId: formData.clientId,
        dateEcheance: new Date(formData.dateEcheance),
        description: formData.description,
        statut: 'en_cours'
      }

      const success = await createDevis(devisData)
      
      if (success) {
        alert("Devis créé avec succès !")
        router.push("/devis-db")
      } else {
        alert("Une erreur est survenue lors de la création du devis")
      }
    } catch (error) {
      console.error("Erreur lors de la création du devis:", error)
      alert("Une erreur est survenue lors de la création du devis")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 animate-in">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/devis-db">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux devis
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">Nouveau devis</h1>
        <p className="text-muted-foreground">
          Créez un nouveau devis pour un client
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informations du devis</CardTitle>
          <CardDescription>
            Remplissez les informations pour créer un nouveau devis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre du devis</Label>
                <Input
                  id="titre"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Ex: Développement site web"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="montant">Montant (€)</Label>
                <Input
                  id="montant"
                  type="number"
                  step="0.01"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  placeholder="10000"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client / Prospect</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client ou prospect" />
                </SelectTrigger>
                <SelectContent>
                  {allClientsAndProspects.length > 0 ? (
                    allClientsAndProspects.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.entreprise || item.nom} {item.statut === 'prospect' && '(Prospect)'}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-clients" disabled>
                      Aucun client ou prospect disponible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateEcheance">Date d'échéance</Label>
              <Input
                id="dateEcheance"
                type="date"
                value={formData.dateEcheance}
                onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée du devis..."
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Création..." : "Créer le devis"}
              </Button>
              
              <Button type="button" variant="outline" asChild>
                <Link href="/devis-db">
                  Annuler
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewDevisPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <NewDevisForm />
    </Suspense>
  )
}
