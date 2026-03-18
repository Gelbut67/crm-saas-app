"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Plus, Trash2, User, Mail, Phone, Building, Briefcase } from "lucide-react"

// Types pour la nouvelle structure
interface Contact {
  id: string
  nom: string
  email?: string
  telephone?: string
  poste?: string
  isPrincipal?: boolean
  dateCreation: Date | string
}

interface Client {
  id: string
  nomEntreprise: string
  secteur?: string
  caTotal: number
  dateCreation: Date | string
  contacts: Contact[]
}

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Formulaire
  const [nomEntreprise, setNomEntreprise] = useState("")
  const [secteur, setSecteur] = useState("")
  const [caTotal, setCaTotal] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    loadClient()
  }, [clientId])

  const loadClient = () => {
    try {
      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]')
      const foundClient = savedClients.find((c: any) => c.id === clientId)
      
      if (foundClient) {
        setClient(foundClient)
        setNomEntreprise(foundClient.nomEntreprise || "")
        setSecteur(foundClient.secteur || "")
        setCaTotal(foundClient.caTotal?.toString() || "")
        setContacts(foundClient.contacts || [])
      } else {
        // Client par défaut pour démonstration
        const defaultClient: Client = {
          id: clientId,
          nomEntreprise: "Entreprise Exemple",
          secteur: "Technologie",
          caTotal: 25000,
          dateCreation: new Date(),
          contacts: [
            {
              id: "1",
              nom: "Jean Dupont",
              email: "jean.dupont@entreprise.com",
              telephone: "06 12 34 56 78",
              poste: "Directeur Technique",
              isPrincipal: true,
              dateCreation: new Date()
            }
          ]
        }
        setClient(defaultClient)
        setNomEntreprise(defaultClient.nomEntreprise)
        setSecteur(defaultClient.secteur || "")
        setCaTotal(defaultClient.caTotal.toString())
        setContacts(defaultClient.contacts)
      }
    } catch (error) {
      console.error("Erreur lors du chargement du client:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!nomEntreprise.trim()) {
      alert("Le nom de l'entreprise est obligatoire")
      return
    }

    setSaving(true)
    try {
      const updatedClient: Client = {
        id: clientId,
        nomEntreprise: nomEntreprise.trim(),
        secteur: secteur.trim() || undefined,
        caTotal: parseFloat(caTotal) || 0,
        dateCreation: client?.dateCreation || new Date(),
        contacts: contacts.map(c => ({
          ...c,
          nom: c.nom.trim(),
          email: c.email?.trim() || undefined,
          telephone: c.telephone?.trim() || undefined,
          poste: c.poste?.trim() || undefined
        }))
      }

      // Sauvegarder dans localStorage
      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]')
      const updatedClients = savedClients.map((c: any) => 
        c.id === clientId ? updatedClient : c
      )
      
      // Si le client n'existe pas, l'ajouter
      if (!savedClients.some((c: any) => c.id === clientId)) {
        updatedClients.push(updatedClient)
      }
      
      localStorage.setItem('clients', JSON.stringify(updatedClients))
      
      // Déclencher l'événement pour recharger
      window.dispatchEvent(new CustomEvent('clientUpdated'))
      
      alert("Client mis à jour avec succès !")
      router.push(`/clients/${clientId}`)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du client:", error)
      alert("Erreur lors de la sauvegarde du client")
    } finally {
      setSaving(false)
    }
  }

  const addContact = () => {
    const newContact: Contact = {
      id: Date.now().toString(),
      nom: "",
      email: "",
      telephone: "",
      poste: "",
      isPrincipal: contacts.length === 0, // Premier contact est principal
      dateCreation: new Date()
    }
    setContacts([...contacts, newContact])
  }

  const updateContact = (index: number, field: keyof Contact, value: any) => {
    const updatedContacts = [...contacts]
    updatedContacts[index] = { ...updatedContacts[index], [field]: value }
    
    // Si on définit un contact comme principal, décocher les autres
    if (field === 'isPrincipal' && value === true) {
      updatedContacts.forEach((c, i) => {
        if (i !== index) c.isPrincipal = false
      })
    }
    
    setContacts(updatedContacts)
  }

  const removeContact = (index: number) => {
    if (contacts.length <= 1) {
      alert("Il doit y avoir au moins un contact")
      return
    }
    
    const updatedContacts = contacts.filter((_, i) => i !== index)
    
    // Si on supprime le contact principal, définir le premier comme principal
    if (contacts[index].isPrincipal && updatedContacts.length > 0) {
      updatedContacts[0].isPrincipal = true
    }
    
    setContacts(updatedContacts)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Client non trouvé</h1>
          <Button asChild>
            <Link href="/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/clients/${clientId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Modifier le client</h1>
          <p className="text-muted-foreground">
            Mettez à jour les informations de {nomEntreprise}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Informations de l'entreprise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informations de l'entreprise
            </CardTitle>
            <CardDescription>
              Détails sur l'entreprise cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomEntreprise">Nom de l'entreprise *</Label>
                <Input
                  id="nomEntreprise"
                  value={nomEntreprise}
                  onChange={(e) => setNomEntreprise(e.target.value)}
                  placeholder="Ex: Tech Solutions"
                />
              </div>
              <div>
                <Label htmlFor="secteur">Secteur d'activité</Label>
                <Input
                  id="secteur"
                  value={secteur}
                  onChange={(e) => setSecteur(e.target.value)}
                  placeholder="Ex: Technologie"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="caTotal">Chiffre d'affaires total (€)</Label>
              <Input
                id="caTotal"
                type="number"
                value={caTotal}
                onChange={(e) => setCaTotal(e.target.value)}
                placeholder="25000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contacts
                </CardTitle>
                <CardDescription>
                  Gérez les contacts de cette entreprise
                </CardDescription>
              </div>
              <Button onClick={addContact} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un contact
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contacts.map((contact, index) => (
              <div key={contact.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Contact {index + 1}</span>
                    {contact.isPrincipal && (
                      <Badge variant="default" className="text-xs">
                        Principal
                      </Badge>
                    )}
                  </div>
                  {contacts.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeContact(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nom *</Label>
                    <Input
                      value={contact.nom}
                      onChange={(e) => updateContact(index, 'nom', e.target.value)}
                      placeholder="Nom du contact"
                    />
                  </div>
                  <div>
                    <Label>Poste</Label>
                    <Input
                      value={contact.poste || ""}
                      onChange={(e) => updateContact(index, 'poste', e.target.value)}
                      placeholder="Poste du contact"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={contact.email || ""}
                      onChange={(e) => updateContact(index, 'email', e.target.value)}
                      placeholder="email@entreprise.com"
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={contact.telephone || ""}
                      onChange={(e) => updateContact(index, 'telephone', e.target.value)}
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`principal-${contact.id}`}
                    checked={contact.isPrincipal || false}
                    onChange={(e) => updateContact(index, 'isPrincipal', e.target.checked)}
                  />
                  <Label htmlFor={`principal-${contact.id}`}>
                    Contact principal
                  </Label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}`}>
              Annuler
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>
    </div>
  )
}
