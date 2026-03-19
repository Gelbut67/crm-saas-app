"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Building, Phone, Mail, User, UserPlus } from "lucide-react"
import { useProspects } from "@/hooks/useDatabase"

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
  const { createProspect } = useProspects()
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
    
    if (!formData.nom.trim()) {
      alert("Veuillez renseigner le nom du prospect")
      return
    }

    setIsSubmitting(true)

    try {
      const prospectData = {
        nom: formData.nom,
        email: formData.email,
        telephone: formData.telephone,
        entreprise: formData.entreprise,
        secteur: formData.secteur,
      }

      const success = await createProspect(prospectData)
      
      if (success) {
        alert("Prospect créé avec succès !")
        router.push("/prospects-db")
      } else {
        alert("Une erreur est survenue lors de la création du prospect")
      }
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

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Informations du prospect
          </CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer un nouveau prospect
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom complet *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="nom"
                    placeholder="Jean Dupont"
                    value={formData.nom}
                    onChange={(e) => handleInputChange("nom", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entreprise">Entreprise</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="entreprise"
                    placeholder="Nom de l'entreprise"
                    value={formData.entreprise}
                    onChange={(e) => handleInputChange("entreprise", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jean.dupont@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="telephone"
                    placeholder="06 12 34 56 78"
                    value={formData.telephone}
                    onChange={(e) => handleInputChange("telephone", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
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
                    Créer le prospect
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
