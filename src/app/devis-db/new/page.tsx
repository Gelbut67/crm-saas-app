"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, FileText, Calendar, DollarSign, User, Building } from "lucide-react"
import { useClients, useProspects, useDevis } from "@/hooks/useDatabase"

function NewDevisForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clients } = useClients()
  const { prospects } = useProspects()
  const { reload: reloadDevis } = useDevis()
  const [formData, setFormData] = useState({
    titre: "",
    montant: "",
    clientId: "",
    dateEcheance: "",
    description: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pré-remplir avec le clientId si fourni dans l'URL
  useEffect(() => {
    const clientId = searchParams.get('clientId')
    if (clientId) {
      setFormData(prev => ({ ...prev, clientId }))
    }
  }, [searchParams])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.titre.trim()) {
      alert("Veuillez renseigner le titre du devis")
      return
    }
    if (!formData.clientId) {
      alert("Veuillez sélectionner un client")
      return
    }
    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      alert("Veuillez renseigner un montant valide")
      return
    }

    setIsSubmitting(true)

    try {
      const devisData = {
        titre: formData.titre,
        montant: parseFloat(formData.montant),
        clientId: formData.clientId,
        statut: 'en_cours',
        dateEcheance: formData.dateEcheance,
        description: formData.description,
      }

      const response = await fetch('/api/devis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(devisData),
      })
      
      if (response.ok) {
        await reloadDevis()
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

  // Définir la date d'échéance par défaut à 30 jours
  useEffect(() => {
    if (!formData.dateEcheance) {
      const defaultDate = new Date()
      defaultDate.setDate(defaultDate.getDate() + 30)
      setFormData(prev => ({ 
        ...prev, 
        dateEcheance: defaultDate.toISOString().split('T')[0] 
      }))
    }
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nouveau Devis</h1>
          <p className="text-muted-foreground">
            Créez un nouveau devis pour votre client
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informations du devis
          </CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer un nouveau devis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="titre">Titre du devis *</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="titre"
                    placeholder="Ex: Développement site web"
                    value={formData.titre}
                    onChange={(e) => handleInputChange("titre", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="montant">Montant (€) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="montant"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.montant}
                    onChange={(e) => handleInputChange("montant", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateEcheance">Date d'échéance *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="dateEcheance"
                    type="date"
                    value={formData.dateEcheance}
                    onChange={(e) => handleInputChange("dateEcheance", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client/Prospect *</Label>
              <Select value={formData.clientId} onValueChange={(value) => handleInputChange("clientId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un client ou prospect" />
                </SelectTrigger>
                <SelectContent>
                  <optgroup label="Clients">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {client.nom}
                          {client.entreprise && (
                            <>
                              <span>-</span>
                              <Building className="h-4 w-4" />
                              {client.entreprise}
                            </>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </optgroup>
                  <optgroup label="Prospects">
                    {prospects.map((prospect) => (
                      <SelectItem key={prospect.id} value={prospect.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {prospect.nom}
                          {prospect.entreprise && (
                            <>
                              <span>-</span>
                              <Building className="h-4 w-4" />
                              {prospect.entreprise}
                            </>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </optgroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description détaillée du devis..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  "Création en cours..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Créer le devis
                  </>
                )}
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
