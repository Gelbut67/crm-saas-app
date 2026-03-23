"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Client {
  id: string
  nom: string
  entreprise?: string
}

interface Devis {
  id: string
  titre: string
  montant: number
  statut: string
  dateEcheance: string
  description?: string
  clientId: string
}

export default function EditDevisPage() {
  const params = useParams()
  const router = useRouter()
  const [devis, setDevis] = useState<Devis | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    titre: "",
    montant: "",
    statut: "",
    dateEcheance: "",
    description: "",
    clientId: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le devis
        const devisResponse = await fetch(`/api/devis/${params.id}`)
        if (devisResponse.ok) {
          const devisData = await devisResponse.json()
          setDevis(devisData)
          setFormData({
            titre: devisData.titre,
            montant: (devisData.montant || 0).toString(),
            statut: devisData.statut,
            dateEcheance: format(new Date(devisData.dateEcheance), 'yyyy-MM-dd'),
            description: devisData.description || "",
            clientId: devisData.clientId
          })
        }

        // Récupérer les clients
        const clientsResponse = await fetch('/api/clients')
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json()
          setClients(clientsData)
        }
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/devis/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titre: formData.titre,
          montant: parseFloat(formData.montant),
          statut: formData.statut,
          dateEcheance: new Date(formData.dateEcheance).toISOString(),
          description: formData.description,
          clientId: formData.clientId
        }),
      })

      if (response.ok) {
        router.push(`/devis-db/${params.id}`)
      } else {
        alert("Erreur lors de la modification du devis")
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Une erreur est survenue")
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

  if (!devis) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Devis non trouvé</h1>
          <Button asChild>
            <Link href="/devis-db">
              Retour aux devis
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-in">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/devis-db/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au devis
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">Modifier le devis</h1>
        <p className="text-muted-foreground">
          Modifiez les informations du devis
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informations du devis</CardTitle>
          <CardDescription>
            Modifiez les détails du devis ci-dessous
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nom} {client.entreprise && `- ${client.entreprise}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value) => setFormData({ ...formData, statut: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="gagne">Gagné</SelectItem>
                    <SelectItem value="perdu">Perdu</SelectItem>
                    <SelectItem value="facture">Facturé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
              
              <Button type="button" variant="outline" asChild>
                <Link href={`/devis-db/${params.id}`}>
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
