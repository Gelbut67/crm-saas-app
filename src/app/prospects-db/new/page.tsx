"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, Trash2, User } from "lucide-react"
import Link from "next/link"

interface Contact {
  nom: string
  email: string
  telephone: string
  poste: string
  isPrincipal: boolean
}

export default function NewProspectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    entreprise: "",
    secteur: "",
    adresse: "",
    codePostal: "",
    ville: "",
    departement: "",
  })
  const [contacts, setContacts] = useState<Contact[]>([
    { nom: "", email: "", telephone: "", poste: "", isPrincipal: true }
  ])

  const handleAddContact = () => {
    setContacts([...contacts, { nom: "", email: "", telephone: "", poste: "", isPrincipal: false }])
  }

  const handleRemoveContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index))
    }
  }

  const handleContactChange = (index: number, field: keyof Contact, value: string | boolean) => {
    const newContacts = [...contacts]
    newContacts[index] = { ...newContacts[index], [field]: value }
    
    if (field === 'isPrincipal' && value === true) {
      newContacts.forEach((contact, i) => {
        if (i !== index) contact.isPrincipal = false
      })
    }
    
    setContacts(newContacts)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entreprise: formData.entreprise,
          secteur: formData.secteur,
          adresse: formData.adresse,
          codePostal: formData.codePostal,
          ville: formData.ville,
          departement: formData.departement,
          statut: 'prospect',
        }),
      })

      if (response.ok) {
        const prospect = await response.json()
        
        for (const contact of contacts) {
          if (contact.nom) {
            await fetch('/api/contacts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clientId: prospect.id,
                nom: contact.nom,
                email: contact.email || null,
                telephone: contact.telephone || null,
                poste: contact.poste || null,
                isPrincipal: contact.isPrincipal,
              }),
            })
          }
        }
        
        router.push('/prospects-db')
      } else {
        alert("Erreur lors de la création du prospect")
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 animate-in">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/prospects-db">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux prospects
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">Nouveau prospect</h1>
        <p className="text-muted-foreground">
          Créez un nouveau prospect avec ses contacts
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'entreprise</CardTitle>
            <CardDescription>
              Renseignez les informations du prospect
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entreprise">Nom de l'entreprise *</Label>
                <Input
                  id="entreprise"
                  value={formData.entreprise}
                  onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                  placeholder="Ex: Tech Solutions"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secteur">Secteur d'activité</Label>
                <Select
                  value={formData.secteur}
                  onValueChange={(value) => setFormData({ ...formData, secteur: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technologie">Technologie</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Commerce">Commerce</SelectItem>
                    <SelectItem value="Industrie">Industrie</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Santé">Santé</SelectItem>
                    <SelectItem value="Éducation">Éducation</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="123 rue de la République"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codePostal">Code postal</Label>
                <Input
                  id="codePostal"
                  value={formData.codePostal}
                  onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                  placeholder="75001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  placeholder="Paris"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departement">Département</Label>
                <Input
                  id="departement"
                  value={formData.departement}
                  onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                  placeholder="75"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contacts</CardTitle>
                <CardDescription>
                  Ajoutez les contacts du prospect
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddContact}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un contact
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {contacts.map((contact, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">Contact {index + 1}</span>
                    {contact.isPrincipal && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Principal
                      </span>
                    )}
                  </div>
                  {contacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveContact(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`nom-${index}`}>Nom *</Label>
                    <Input
                      id={`nom-${index}`}
                      value={contact.nom}
                      onChange={(e) => handleContactChange(index, 'nom', e.target.value)}
                      placeholder="Jean Dupont"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`poste-${index}`}>Poste</Label>
                    <Input
                      id={`poste-${index}`}
                      value={contact.poste}
                      onChange={(e) => handleContactChange(index, 'poste', e.target.value)}
                      placeholder="Directeur Commercial"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`email-${index}`}>Email</Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      value={contact.email}
                      onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                      placeholder="jean.dupont@entreprise.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`telephone-${index}`}>Téléphone</Label>
                    <Input
                      id={`telephone-${index}`}
                      value={contact.telephone}
                      onChange={(e) => handleContactChange(index, 'telephone', e.target.value)}
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`principal-${index}`}
                    checked={contact.isPrincipal}
                    onChange={(e) => handleContactChange(index, 'isPrincipal', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor={`principal-${index}`} className="cursor-pointer">
                    Contact principal
                  </Label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Création..." : "Créer le prospect"}
          </Button>
          
          <Button type="button" variant="outline" asChild>
            <Link href="/prospects-db">
              Annuler
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
