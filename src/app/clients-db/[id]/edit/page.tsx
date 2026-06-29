"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, Trash2, User } from "lucide-react"
import Link from "next/link"

interface Contact {
  id?: string
  nom: string
  email: string
  telephone: string
  telephoneFixe: string
  telephonePortable: string
  poste: string
  isPrincipal: boolean
}

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    entreprise: "",
    secteur: "",
    adresse: "",
    codePostal: "",
    ville: "",
    departement: "",
  })
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsToDelete, setContactsToDelete] = useState<string[]>([])

  useEffect(() => {
    loadClient()
  }, [params.id])

  const loadClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`)
      if (response.ok) {
        const client = await response.json()
        setFormData({
          entreprise: client.entreprise || "",
          secteur: client.secteur || "",
          adresse: client.adresse || "",
          codePostal: client.codePostal || "",
          ville: client.ville || "",
          departement: client.departement || "",
        })
        
        if (client.contacts && client.contacts.length > 0) {
          setContacts(client.contacts.map((c: any) => ({
            id: c.id,
            nom: c.nom || "",
            email: c.email || "",
            telephone: c.telephone || "",
            telephoneFixe: c.telephoneFixe || "",
            telephonePortable: c.telephonePortable || "",
            poste: c.poste || "",
            isPrincipal: c.isPrincipal || false,
          })))
        } else {
          setContacts([{ nom: "", email: "", telephone: "", telephoneFixe: "", telephonePortable: "", poste: "", isPrincipal: true }])
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = () => {
    setContacts([...contacts, { nom: "", email: "", telephone: "", telephoneFixe: "", telephonePortable: "", poste: "", isPrincipal: false }])
  }

  const handleRemoveContact = (index: number) => {
    const contact = contacts[index]
    if (contact.id) {
      setContactsToDelete([...contactsToDelete, contact.id])
    }
    setContacts(contacts.filter((_, i) => i !== index))
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
      // Mettre à jour le client
      const clientResponse = await fetch(`/api/clients/${params.id}`, {
        method: 'PUT',
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
        }),
      })

      if (!clientResponse.ok) {
        throw new Error('Erreur lors de la mise à jour du client')
      }

      // Supprimer les contacts marqués pour suppression
      for (const contactId of contactsToDelete) {
        await fetch(`/api/contacts/${contactId}`, {
          method: 'DELETE',
        })
      }

      // Mettre à jour ou créer les contacts
      for (const contact of contacts) {
        if (contact.nom) {
          if (contact.id) {
            // Mettre à jour le contact existant
            await fetch(`/api/contacts/${contact.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                nom: contact.nom,
                email: contact.email || null,
                telephone: contact.telephone || null,
                telephoneFixe: contact.telephoneFixe || null,
                telephonePortable: contact.telephonePortable || null,
                poste: contact.poste || null,
                isPrincipal: contact.isPrincipal,
              }),
            })
          } else {
            // Créer un nouveau contact
            await fetch('/api/contacts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clientId: params.id,
                nom: contact.nom,
                email: contact.email || null,
                telephone: contact.telephone || null,
                telephoneFixe: contact.telephoneFixe || null,
                telephonePortable: contact.telephonePortable || null,
                poste: contact.poste || null,
                isPrincipal: contact.isPrincipal,
              }),
            })
          }
        }
      }
      
      router.push(`/clients-db/${params.id}`)
    } catch (error) {
      console.error("Erreur:", error)
      alert("Une erreur est survenue lors de la mise à jour")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-in">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/clients-db/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au client
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">Modifier le client</h1>
        <p className="text-muted-foreground">
          Modifiez les informations du client et ses contacts
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Informations entreprise */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'entreprise</CardTitle>
            <CardDescription>
              Modifiez les informations de l'entreprise
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
                    <SelectItem value="Agriculture">Agriculture</SelectItem>
                    <SelectItem value="Maraîchage">Maraîchage</SelectItem>
                    <SelectItem value="Viticulture / Vigneron">Viticulture / Vigneron</SelectItem>
                    <SelectItem value="Brasserie / Brasseur">Brasserie / Brasseur</SelectItem>
                    <SelectItem value="Restauration">Restauration</SelectItem>
                    <SelectItem value="Hôtellerie">Hôtellerie</SelectItem>
                    <SelectItem value="Traiteur">Traiteur</SelectItem>
                    <SelectItem value="Épicerie / Épicerie fine">Épicerie / Épicerie fine</SelectItem>
                    <SelectItem value="Cave à vins">Cave à vins</SelectItem>
                    <SelectItem value="Boulangerie / Pâtisserie">Boulangerie / Pâtisserie</SelectItem>
                    <SelectItem value="Charcuterie / Fromagerie">Charcuterie / Fromagerie</SelectItem>
                    <SelectItem value="CHR (Café, Hôtel, Restaurant)">CHR (Café, Hôtel, Restaurant)</SelectItem>
                    <SelectItem value="Grande distribution">Grande distribution</SelectItem>
                    <SelectItem value="Grossiste alimentaire">Grossiste alimentaire</SelectItem>
                    <SelectItem value="Producteur local">Producteur local</SelectItem>
                    <SelectItem value="Coopérative agricole">Coopérative agricole</SelectItem>
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

        {/* Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contacts</CardTitle>
                <CardDescription>
                  Gérez les contacts de l'entreprise
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
                    {contact.id && (
                      <span className="text-xs text-muted-foreground">(Existant)</span>
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
                    <Label htmlFor={`nom-${index}`}>Nom</Label>
                    <Input
                      id={`nom-${index}`}
                      value={contact.nom}
                      onChange={(e) => handleContactChange(index, 'nom', e.target.value)}
                      placeholder="Jean Dupont"
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
                    <Label htmlFor={`telephoneFixe-${index}`}>Téléphone Fixe</Label>
                    <Input
                      id={`telephoneFixe-${index}`}
                      value={contact.telephoneFixe}
                      onChange={(e) => handleContactChange(index, 'telephoneFixe', e.target.value)}
                      placeholder="01 23 45 67 89"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`telephonePortable-${index}`}>Téléphone Portable</Label>
                    <Input
                      id={`telephonePortable-${index}`}
                      value={contact.telephonePortable}
                      onChange={(e) => handleContactChange(index, 'telephonePortable', e.target.value)}
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

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
          
          <Button type="button" variant="outline" asChild>
            <Link href={`/clients-db/${params.id}`}>
              Annuler
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
