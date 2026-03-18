"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, UserPlus } from "lucide-react"

interface Client {
  id: string
  nom?: string
  nomEntreprise?: string
  entreprise?: string
  email?: string
}

interface Prospect {
  id: string
  nom?: string
  nomEntreprise?: string
  entreprise?: string
  email?: string
}

export default function NewDevisPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    titre: "",
    montant: "",
    description: "",
    dateEcheance: "",
    clientId: "",
    clientType: "prospect" // prospect ou client
  })
  const [isConverting, setIsConverting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      // Charger les clients depuis localStorage
      const savedClients = localStorage.getItem('clients')
      if (savedClients) {
        const parsedClients = JSON.parse(savedClients)
        setClients(parsedClients.map((c: any) => ({
          id: c.id,
          nom: c.nom || c.contacts?.[0]?.nom || 'N/A',
          nomEntreprise: c.nomEntreprise || c.entreprise || 'N/A',
          email: c.email || c.contacts?.[0]?.email || ''
        })))
      }

      // Charger les prospects depuis localStorage
      const savedProspects = localStorage.getItem('prospects')
      if (savedProspects) {
        const parsedProspects = JSON.parse(savedProspects)
        setProspects(parsedProspects.map((p: any) => ({
          id: p.id,
          nom: p.contacts?.[0]?.nom || 'N/A',
          nomEntreprise: p.nomEntreprise || 'N/A',
          email: p.contacts?.[0]?.email || ''
        })))
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClientTypeChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      clientType: value,
      clientId: "" // Réinitialiser le client sélectionné
    }))
  }

  const handleSave = async () => {
    if (!formData.titre || !formData.montant || !formData.dateEcheance || !formData.clientId) {
      alert("Veuillez remplir tous les champs obligatoires")
      return
    }

    try {
      // Préparer les données du client
      const selectedClient = availableClients.find(c => c.id === formData.clientId)
      
      if (!selectedClient) {
        alert("Client non trouvé")
        return
      }

      // Créer le nouveau devis
      const newDevis = {
        id: Date.now().toString(),
        titre: formData.titre,
        montant: parseFloat(formData.montant),
        description: formData.description,
        dateEcheance: formData.dateEcheance,
        dateCreation: new Date().toISOString(),
        statut: "en_cours",
        client: {
          id: selectedClient.id,
          nom: selectedClient.nom || '',
          entreprise: selectedClient.nomEntreprise || selectedClient.entreprise || ''
        }
      }

      // Sauvegarder dans localStorage
      const existingDevis = JSON.parse(localStorage.getItem('devis') || '[]')
      const updatedDevis = [newDevis, ...existingDevis]
      localStorage.setItem('devis', JSON.stringify(updatedDevis))

      // Si c'est un prospect, le convertir automatiquement en client
      if (formData.clientType === "prospect") {
        setIsConverting(true)
        
        // Logique de conversion réelle du prospect en client
        console.log("Conversion du prospect en client:", formData.clientId)
        
        // 1. Trouver le prospect à convertir
        const savedProspects = JSON.parse(localStorage.getItem('prospects') || '[]')
        const prospectToConvert = savedProspects.find((p: any) => p.id === formData.clientId)
        
        if (!prospectToConvert) {
          alert("Prospect non trouvé")
          return
        }
        
        // 2. Créer le nouveau client à partir du prospect
        const newClient = {
          id: `client_${Date.now()}`, // Nouvel ID unique
          nom: prospectToConvert.contacts?.[0]?.nom || prospectToConvert.nom || '',
          email: prospectToConvert.contacts?.[0]?.email || '',
          telephone: prospectToConvert.contacts?.[0]?.telephone || '',
          entreprise: prospectToConvert.nomEntreprise || '',
          secteur: prospectToConvert.secteur || '',
          caTotal: 0, // Commence à 0, sera mis à jour quand le devis sera gagné
          dateCreation: new Date().toISOString().split('T')[0],
          contacts: prospectToConvert.contacts || []
        }
        
        // 3. Sauvegarder le nouveau client
        const savedClients = JSON.parse(localStorage.getItem('clients') || '[]')
        console.log('Clients before adding new one:', savedClients.length)
        savedClients.push(newClient)
        localStorage.setItem('clients', JSON.stringify(savedClients))
        console.log('Clients after adding new one:', savedClients.length)
        
        // 4. Supprimer le prospect de la liste des prospects
        const updatedProspects = savedProspects.filter((p: any) => p.id !== formData.clientId)
        console.log('Prospects before deletion:', savedProspects.length)
        console.log('Prospects after deletion:', updatedProspects.length)
        localStorage.setItem('prospects', JSON.stringify(updatedProspects))
        
        // 5. Mettre à jour le devis avec le nouveau client
        newDevis.client = {
          id: newClient.id,
          nom: newClient.nom || '',
          entreprise: newClient.entreprise || ''
        }
        
        // 6. Déclencher les événements
        console.log('Dispatching conversion events...')
        window.dispatchEvent(new CustomEvent('prospectConverted', { detail: { prospectId: formData.clientId, clientId: newClient.id } }))
        window.dispatchEvent(new CustomEvent('clientAdded'))
        window.dispatchEvent(new CustomEvent('prospectDeleted'))
        
        console.log("Prospect converti avec succès en client:", newClient)
        console.log('Final localStorage state:')
        console.log('- Clients:', JSON.parse(localStorage.getItem('clients') || '[]').length)
        console.log('- Prospects:', JSON.parse(localStorage.getItem('prospects') || '[]').length)
        alert("Prospect converti en client avec succès !")
      } else {
        // Pour un client existant, s'assurer que le devis a les bonnes infos client
        const selectedClient = clients.find((c: any) => c.id === formData.clientId)
        if (selectedClient) {
          newDevis.client = {
            id: selectedClient.id,
            nom: selectedClient.nom || '',
            entreprise: selectedClient.entreprise || ''
          }
        }
        alert("Devis créé avec succès !")
      }

      // Déclencher un événement pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('devisAdded'))

      // Rediriger vers la liste des devis
      router.push("/devis")
    } catch (error) {
      console.error("Erreur lors de la création du devis:", error)
      alert("Une erreur est survenue lors de la création du devis")
    } finally {
      setIsConverting(false)
    }
  }

  const availableClients = formData.clientType === "prospect" ? prospects : clients

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

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Informations du devis</CardTitle>
          <CardDescription>
            Remplissez les informations pour créer un nouveau devis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type de client */}
          <div className="space-y-2">
            <Label>Type de client</Label>
            <Select value={formData.clientType} onValueChange={handleClientTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type de client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Prospect (sera converti en client)
                  </div>
                </SelectItem>
                <SelectItem value="client">Client existant</SelectItem>
              </SelectContent>
            </Select>
            {formData.clientType === "prospect" && (
              <p className="text-sm text-muted-foreground">
                Le prospect sera automatiquement converti en client lors de la création du devis
              </p>
            )}
          </div>

          {/* Sélection du client/prospect */}
          <div className="space-y-2">
            <Label>
              {formData.clientType === "prospect" ? "Prospect" : "Client"} *
            </Label>
            <Select value={formData.clientId} onValueChange={(value) => handleInputChange("clientId", value)}>
              <SelectTrigger>
                <SelectValue placeholder={`Sélectionnez un ${formData.clientType}`} />
              </SelectTrigger>
              <SelectContent>
                {availableClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div>
                      <div className="font-medium">{client.nomEntreprise}</div>
                      <div className="text-sm text-muted-foreground">
                        {client.nom} - {client.email}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Titre du devis */}
          <div className="space-y-2">
            <Label htmlFor="titre">Titre du devis *</Label>
            <Input
              id="titre"
              placeholder="Ex: Développement site web"
              value={formData.titre}
              onChange={(e) => handleInputChange("titre", e.target.value)}
            />
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (€) *</Label>
            <Input
              id="montant"
              type="number"
              placeholder="15000"
              value={formData.montant}
              onChange={(e) => handleInputChange("montant", e.target.value)}
            />
          </div>

          {/* Date d'échéance */}
          <div className="space-y-2">
            <Label htmlFor="dateEcheance">Date d'échéance *</Label>
            <Input
              id="dateEcheance"
              type="date"
              value={formData.dateEcheance}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("dateEcheance", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description détaillée des prestations..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("description", e.target.value)}
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isConverting}
              className="flex-1"
            >
              {isConverting ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4 animate-pulse" />
                  Conversion en cours...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {formData.clientType === "prospect" ? "Convertir et créer" : "Créer le devis"}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
