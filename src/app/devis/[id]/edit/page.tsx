"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Calendar, DollarSign, FileText, Building } from "lucide-react"

interface Devis {
  id: string
  titre: string
  montant: number
  statut: string
  dateEcheance: string
  dateCreation: string
  description?: string
  client: {
    id: string
    nom: string
    entreprise: string
  }
}

const defaultDevis: Devis = {
  id: "1",
  titre: "Développement Site E-commerce",
  montant: 15000,
  statut: "en_cours",
  dateEcheance: "2024-04-15",
  dateCreation: "2024-03-01",
  description: "Développement complet d'un site e-commerce avec panier, paiement et gestion des stocks.",
  client: {
    id: "1",
    nom: "Jean Dupont",
    entreprise: "Tech Solutions"
  }
}

const clients = [
  { id: "1", nom: "Jean Dupont", entreprise: "Tech Solutions" },
  { id: "2", nom: "Marie Martin", entreprise: "Services Plus" },
  { id: "3", nom: "Pierre Bernard", entreprise: "Commerce International" }
]

export default function EditDevisPage() {
  const params = useParams()
  const router = useRouter()
  const devisId = params.id as string
  
  const [devis, setDevis] = useState<Devis | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Formulaire
  const [titre, setTitre] = useState("")
  const [montant, setMontant] = useState("")
  const [statut, setStatut] = useState("")
  const [dateEcheance, setDateEcheance] = useState("")
  const [description, setDescription] = useState("")
  const [clientId, setClientId] = useState("")

  useEffect(() => {
    loadDevis()
  }, [devisId])

  const loadDevis = () => {
    try {
      const savedDevis = JSON.parse(localStorage.getItem('devis') || '[]')
      const foundDevis = savedDevis.find((d: any) => d.id === devisId)
      
      if (foundDevis) {
        setDevis(foundDevis)
        setTitre(foundDevis.titre || "")
        setMontant(foundDevis.montant?.toString() || "")
        setStatut(foundDevis.statut || "")
        setDateEcheance(foundDevis.dateEcheance || "")
        setDescription(foundDevis.description || "")
        setClientId(foundDevis.client?.id || "")
      } else {
        // Devis par défaut pour démonstration
        setDevis(defaultDevis)
        setTitre(defaultDevis.titre)
        setMontant(defaultDevis.montant.toString())
        setStatut(defaultDevis.statut)
        setDateEcheance(defaultDevis.dateEcheance)
        setDescription(defaultDevis.description || "")
        setClientId(defaultDevis.client.id)
      }
    } catch (error) {
      console.error("Erreur lors du chargement du devis:", error)
      setDevis(defaultDevis)
      setTitre(defaultDevis.titre)
      setMontant(defaultDevis.montant.toString())
      setStatut(defaultDevis.statut)
      setDateEcheance(defaultDevis.dateEcheance)
      setDescription(defaultDevis.description || "")
      setClientId(defaultDevis.client.id)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!titre.trim()) {
      alert("Le titre du devis est obligatoire")
      return
    }

    if (!montant || parseFloat(montant) <= 0) {
      alert("Le montant doit être supérieur à 0")
      return
    }

    if (!dateEcheance) {
      alert("La date d'échéance est obligatoire")
      return
    }

    setSaving(true)
    try {
      const selectedClient = clients.find(c => c.id === clientId)
      if (!selectedClient) {
        alert("Veuillez sélectionner un client")
        return
      }

      const updatedDevis: Devis = {
        id: devisId,
        titre: titre.trim(),
        montant: parseFloat(montant),
        statut: statut,
        dateEcheance: dateEcheance,
        dateCreation: devis?.dateCreation || new Date().toISOString().split('T')[0],
        description: description.trim() || undefined,
        client: {
          id: selectedClient.id,
          nom: selectedClient.nom,
          entreprise: selectedClient.entreprise
        }
      }

      // Sauvegarder dans localStorage
      const savedDevis = JSON.parse(localStorage.getItem('devis') || '[]')
      const updatedDevisList = savedDevis.map((d: any) => 
        d.id === devisId ? updatedDevis : d
      )
      
      // Si le devis n'existe pas, l'ajouter
      if (!savedDevis.some((d: any) => d.id === devisId)) {
        updatedDevisList.push(updatedDevis)
      }
      
      localStorage.setItem('devis', JSON.stringify(updatedDevisList))
      
      // Mettre à jour le CA des clients si le statut a changé
      if (devis && devis.statut !== statut) {
        console.log('Le statut a changé, mise à jour des CA...')
        
        // Mettre à jour le CA de tous les clients concernés
        const savedClients = JSON.parse(localStorage.getItem('clients') || '[]')
        const updatedClients = savedClients.map((client: any) => {
          // Calculer le nouveau CA pour chaque client
          const clientDevis = updatedDevisList.filter((d: any) => {
            // Vérifier si le devis appartient à ce client
            return d.client?.id === client.id || 
                   (d.client?.nom === client.nom || 
                    d.client?.entreprise === client.entreprise)
          })
          
          const newCaTotal = clientDevis
            .filter((d: any) => d.statut === 'gagne')
            .reduce((sum: number, d: any) => sum + (d.montant || 0), 0)
          
          return { ...client, caTotal: newCaTotal }
        })
        
        localStorage.setItem('clients', JSON.stringify(updatedClients))
        console.log('CA des clients mis à jour après édition du devis')
      }
      
      // Déclencher l'événement pour recharger
      window.dispatchEvent(new CustomEvent('devisUpdated', { 
        detail: { devisId, newStatus: statut } 
      }))
      
      // Déclencher aussi un événement pour les clients
      window.dispatchEvent(new CustomEvent('clientUpdated'))
      
      alert("Devis mis à jour avec succès !")
      router.push(`/devis/${devisId}`)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du devis:", error)
      alert("Erreur lors de la sauvegarde du devis")
    } finally {
      setSaving(false)
    }
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

  if (!devis) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Devis non trouvé</h1>
          <Button asChild>
            <Link href="/devis">
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
          <Link href={`/devis/${devisId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Modifier le devis</h1>
          <p className="text-muted-foreground">
            Mettez à jour les informations du devis "{titre}"
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations du devis
            </CardTitle>
            <CardDescription>
              Détails principaux du devis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="titre">Titre du devis *</Label>
              <Input
                id="titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: Développement Site E-commerce"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="montant">Montant (€) *</Label>
                <Input
                  id="montant"
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="15000"
                />
              </div>
              <div>
                <Label htmlFor="statut">Statut</Label>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="gagne">Gagné</SelectItem>
                    <SelectItem value="facture">Facturé</SelectItem>
                    <SelectItem value="perdu">Perdu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="dateEcheance">Date d'échéance *</Label>
              <Input
                id="dateEcheance"
                type="date"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description détaillée du devis..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Client
            </CardTitle>
            <CardDescription>
              Client associé à ce devis (non modifiable)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Client</Label>
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  {clientId && clients.find(c => c.id === clientId) ? (
                    <div>
                      <span className="font-medium">
                        {clients.find(c => c.id === clientId)?.entreprise}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        - {clients.find(c => c.id === clientId)?.nom}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Client non spécifié
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Pour modifier le client associé, supprimez ce devis et créez-en un nouveau.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href={`/devis/${devisId}`}>
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
