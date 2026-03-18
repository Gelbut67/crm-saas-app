"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Building, Phone, Mail, User, DollarSign } from "lucide-react"

const secteurOptions = [
  "Technologie",
  "Services",
  "Commerce",
  "Industrie",
  "Santé",
  "Éducation",
  "Finance",
  "Autre"
]

export default function NewClientPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nomEntreprise: "",
    nom: "",
    email: "",
    telephone: "",
    secteur: "",
    caTotal: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nomEntreprise.trim()) {
      alert("Veuillez renseigner le nom de l'entreprise")
      return
    }

    setIsSubmitting(true)

    try {
      // Logique pour créer le client
      const clientData = {
        id: Date.now().toString(), // ID unique pour la démo
        nomEntreprise: formData.nomEntreprise,
        secteur: formData.secteur,
        caTotal: formData.caTotal ? parseFloat(formData.caTotal) : 0,
        dateCreation: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
        contacts: formData.nom ? [
          {
            id: Date.now().toString() + "-1",
            nom: formData.nom,
            email: formData.email,
            telephone: formData.telephone,
            poste: "Contact principal", // Valeur par défaut
            isPrincipal: true,
            dateCreation: new Date().toISOString().split('T')[0]
          }
        ] : []
      }

      console.log("Création du client:", clientData)

      // Sauvegarder dans localStorage
      const existingClients = JSON.parse(localStorage.getItem('clients') || '[]')
      const updatedClients = [...existingClients, clientData]
      localStorage.setItem('clients', JSON.stringify(updatedClients))

      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000))

      alert("Client créé avec succès !")
      
      // Rediriger vers la liste des clients
      router.push("/clients")
    } catch (error) {
      console.error("Erreur lors de la création du client:", error)
      alert("Une erreur est survenue lors de la création du client")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nouveau Client</h1>
          <p className="text-muted-foreground">
            Créez une nouvelle fiche client
          </p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>
            Remplissez les informations pour créer un nouveau client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de l'entreprise */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informations de l'entreprise
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nomEntreprise">Nom de l'entreprise *</Label>
                  <Input
                    id="nomEntreprise"
                    placeholder="Tech Solutions"
                    value={formData.nomEntreprise}
                    onChange={(e) => handleInputChange("nomEntreprise", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secteur">Secteur d'activité</Label>
                  <Select value={formData.secteur} onValueChange={(value) => handleInputChange("secteur", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {secteurOptions.map((secteur) => (
                        <SelectItem key={secteur} value={secteur}>
                          {secteur}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caTotal">CA total (€)</Label>
                  <Input
                    id="caTotal"
                    type="number"
                    placeholder="25000"
                    value={formData.caTotal}
                    onChange={(e) => handleInputChange("caTotal", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Contact principal (optionnel) */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact principal <span className="text-sm text-muted-foreground">(optionnel)</span>
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom du contact</Label>
                  <Input
                    id="nom"
                    placeholder="Jean Dupont"
                    value={formData.nom}
                    onChange={(e) => handleInputChange("nom", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jean.dupont@entreprise.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    placeholder="06 12 34 56 78"
                    value={formData.telephone}
                    onChange={(e) => handleInputChange("telephone", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-pulse" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Créer le client
                  </>
                )}
              </Button>
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
