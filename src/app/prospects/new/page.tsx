"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Building, Phone, Mail, User, UserPlus } from "lucide-react"

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

export default function NewProspectPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    entreprise: "",
    secteur: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.entreprise.trim()) {
      alert("Veuillez renseigner le nom de l'entreprise")
      return
    }

    setIsSubmitting(true)

    try {
      // Logique pour créer le prospect
      const prospectData = {
        id: Date.now().toString(), // ID unique pour la démo
        nomEntreprise: formData.entreprise || formData.nom,
        secteur: formData.secteur,
        dateCreation: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
        contacts: [
          {
            id: Date.now().toString() + "-1",
            nom: formData.nom,
            email: formData.email,
            telephone: formData.telephone,
            poste: "Contact principal", // Valeur par défaut
            isPrincipal: true,
            dateCreation: new Date().toISOString().split('T')[0]
          }
        ]
      }

      console.log("Création du prospect:", prospectData)

      // Sauvegarder dans localStorage
      const existingProspects = JSON.parse(localStorage.getItem('prospects') || '[]')
      const updatedProspects = [...existingProspects, prospectData]
      localStorage.setItem('prospects', JSON.stringify(updatedProspects))

      alert("Prospect créé avec succès !")
      
      // Rediriger vers la liste des prospects
      router.push("/prospects")
    } catch (error) {
      console.error("Erreur lors de la création du prospect:", error)
      alert("Une erreur est survenue lors de la création du prospect")
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
          <h1 className="text-3xl font-bold">Nouveau Prospect</h1>
          <p className="text-muted-foreground">
            Créez une nouvelle fiche prospect
          </p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Informations du prospect</CardTitle>
          <CardDescription>
            Remplissez les informations pour créer un nouveau prospect
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de l'entreprise - PRIORITAIRE */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informations de l'entreprise
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="entreprise">Nom de l'entreprise *</Label>
                  <Input
                    id="entreprise"
                    placeholder="Startup Innov"
                    value={formData.entreprise}
                    onChange={(e) => handleInputChange("entreprise", e.target.value)}
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
              </div>
            </div>

            {/* Informations du contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact principal
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom complet</Label>
                  <Input
                    id="nom"
                    placeholder="Marie Martin"
                    value={formData.nom}
                    onChange={(e) => handleInputChange("nom", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="marie.martin@startup.fr"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    placeholder="06 23 45 67 89"
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
                    <UserPlus className="mr-2 h-4 w-4 animate-pulse" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Créer le prospect
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
