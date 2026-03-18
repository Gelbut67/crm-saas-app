"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Phone, Mail, Building, Calendar, Plus, MessageSquare, PhoneCall, UserCheck, Trash2 } from "lucide-react"

const defaultProspects = [
  {
    id: "1",
    nom: "Marie Martin",
    email: "marie.martin@startup.fr",
    telephone: "06 23 45 67 89",
    entreprise: "Startup Innov",
    secteur: "Technologie",
    caTotal: 0,
    dateCreation: "2024-03-14"
  },
  {
    id: "2",
    nom: "Pierre Bernard",
    email: "pierre.bernard@commerce.fr",
    telephone: "06 45 67 89 01",
    entreprise: "Boutique En Ligne",
    secteur: "E-commerce",
    caTotal: 0,
    dateCreation: "2024-03-10"
  },
  {
    id: "3",
    nom: "Sophie Lefebvre",
    email: "sophie@services.fr",
    telephone: "06 78 90 12 34",
    entreprise: "Services Pro",
    secteur: "Services",
    caTotal: 0,
    dateCreation: "2024-03-08"
  }
]

const mockInteractions = [
  {
    id: "1",
    type: "appel",
    contenu: "Premier contact téléphonique - prospect intéressé par nos services",
    date: "2024-03-15T10:30:00"
  },
  {
    id: "2",
    type: "rdv",
    contenu: "Rendez-vous de découverte au showroom",
    date: "2024-03-10T14:00:00"
  },
  {
    id: "3",
    type: "email",
    contenu: "Envoi de la brochure commerciale par email",
    date: "2024-03-08T09:15:00"
  },
  {
    id: "4",
    type: "note",
    contenu: "Note : Prospect à suivre dans 2 semaines pour décision",
    date: "2024-03-05T16:45:00"
  }
]

function getInteractionIcon(type: string) {
  switch (type) {
    case 'appel':
      return <PhoneCall className="h-4 w-4" />
    case 'rdv':
      return <Calendar className="h-4 w-4" />
    case 'email':
      return <Mail className="h-4 w-4" />
    case 'note':
      return <MessageSquare className="h-4 w-4" />
    default:
      return <MessageSquare className="h-4 w-4" />
  }
}

function getInteractionLabel(type: string) {
  switch (type) {
    case 'appel':
      return 'Appel téléphonique'
    case 'rdv':
      return 'Rendez-vous'
    case 'email':
      return 'Email envoyé'
    case 'note':
      return 'Note interne'
    default:
      return 'Interaction'
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function ProspectDetailPage() {
  const params = useParams()
  const prospectId = params.id as string
  const [prospect, setProspect] = useState<any>(null)
  const [interactions, setInteractions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [editingInteraction, setEditingInteraction] = useState<string | null>(null)
  const [newInteraction, setNewInteraction] = useState({
    type: 'appel',
    contenu: '',
    date: new Date().toISOString()
  })

  useEffect(() => {
    loadProspectData()
    
    // Écouter les mises à jour
    const handleDataUpdated = () => {
      loadProspectData()
    }
    
    window.addEventListener('prospectUpdated', handleDataUpdated)
    window.addEventListener('prospectConverted', handleDataUpdated)
    
    return () => {
      window.removeEventListener('prospectUpdated', handleDataUpdated)
      window.removeEventListener('prospectConverted', handleDataUpdated)
    }
  }, [prospectId])

  const loadProspectData = () => {
    // Charger les prospects depuis localStorage
    const savedProspects = localStorage.getItem('prospects')
    let prospects = defaultProspects
    
    if (savedProspects) {
      const parsedProspects = JSON.parse(savedProspects)
      const prospectsWithDates = parsedProspects.map((p: any) => ({
        ...p,
        dateCreation: new Date(p.dateCreation)
      }))
      prospects = [...defaultProspects, ...prospectsWithDates]
    }
    
    // Charger les interactions depuis localStorage
    const savedInteractions = localStorage.getItem(`interactions_${prospectId}`)
    let prospectInteractions: any[] = []
    
    if (savedInteractions) {
      prospectInteractions = JSON.parse(savedInteractions)
    }
    
    // Trier les interactions par date (plus récentes en premier)
    prospectInteractions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // Trouver le prospect correspondant
    const foundProspect = prospects.find((p: any) => p.id === prospectId)
    setProspect(foundProspect || prospects[0])
    setInteractions(prospectInteractions)
    setLoading(false)
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  if (!prospect) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Prospect non trouvé</p>
          <Button asChild className="mt-4">
            <Link href="/prospects">Retour aux prospects</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Fonction pour ajouter une nouvelle interaction
  const handleAddInteraction = () => {
    if (!newInteraction.contenu.trim()) {
      alert('Veuillez remplir le contenu de l\'interaction')
      return
    }

    try {
      // Créer la nouvelle interaction
      const interaction = {
        id: `interaction_${Date.now()}`,
        type: newInteraction.type,
        contenu: newInteraction.contenu,
        date: newInteraction.date
      }

      // Récupérer les interactions existantes
      const existingInteractions = JSON.parse(localStorage.getItem(`interactions_${prospectId}`) || '[]')
      
      // Ajouter la nouvelle interaction
      const updatedInteractions = [interaction, ...existingInteractions]
      
      // Sauvegarder dans localStorage
      localStorage.setItem(`interactions_${prospectId}`, JSON.stringify(updatedInteractions))
      
      // Mettre à jour l'état
      setInteractions(updatedInteractions)
      
      // Réinitialiser le formulaire
      setNewInteraction({
        type: 'appel',
        contenu: '',
        date: new Date().toISOString()
      })
      setShowAddInteraction(false)
      
      alert('Interaction ajoutée avec succès !')
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error)
      alert('Une erreur est survenue lors de l\'ajout')
    }
  }

  // Fonction pour supprimer une interaction
  const handleDeleteInteraction = (interactionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette interaction ?')) {
      try {
        const existingInteractions = JSON.parse(localStorage.getItem(`interactions_${prospectId}`) || '[]')
        const updatedInteractions = existingInteractions.filter((i: any) => i.id !== interactionId)
        
        localStorage.setItem(`interactions_${prospectId}`, JSON.stringify(updatedInteractions))
        setInteractions(updatedInteractions)
        
        console.log('Interaction supprimée:', interactionId)
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        alert('Une erreur est survenue lors de la suppression')
      }
    }
  }

  // Fonction pour modifier une interaction
  const handleEditInteraction = (interactionId: string) => {
    const interaction = interactions.find(i => i.id === interactionId)
    if (interaction) {
      setEditingInteraction(interactionId)
      setNewInteraction({
        type: interaction.type,
        contenu: interaction.contenu,
        date: interaction.date
      })
      setShowAddInteraction(true)
    }
  }

  // Fonction pour mettre à jour une interaction
  const handleUpdateInteraction = () => {
    if (!newInteraction.contenu.trim()) {
      alert('Veuillez remplir le contenu de l\'interaction')
      return
    }

    try {
      const existingInteractions = JSON.parse(localStorage.getItem(`interactions_${prospectId}`) || '[]')
      const updatedInteractions = existingInteractions.map((i: any) => 
        i.id === editingInteraction 
          ? { ...i, type: newInteraction.type, contenu: newInteraction.contenu }
          : i
      )
      
      localStorage.setItem(`interactions_${prospectId}`, JSON.stringify(updatedInteractions))
      setInteractions(updatedInteractions)
      
      // Réinitialiser
      setEditingInteraction(null)
      setShowAddInteraction(false)
      setNewInteraction({
        type: 'appel',
        contenu: '',
        date: new Date().toISOString()
      })
      
      alert('Interaction mise à jour avec succès !')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      alert('Une erreur est survenue lors de la mise à jour')
    }
  }

  const handleConvertToClient = () => {
    if (confirm("Êtes-vous sûr de vouloir convertir ce prospect en client ?")) {
      try {
        // Utiliser la même logique que la conversion via devis
        console.log("Converting prospect to client:", prospectId)
        
        // 1. Créer le nouveau client à partir du prospect avec la bonne structure
        const newClient = {
          id: `client_${Date.now()}`, // Nouvel ID unique comme dans la conversion devis
          nom: prospect.contacts?.[0]?.nom || prospect.nom || '',
          email: prospect.contacts?.[0]?.email || '',
          telephone: prospect.contacts?.[0]?.telephone || '',
          entreprise: prospect.nomEntreprise || '',
          secteur: prospect.secteur || '',
          caTotal: 0, // Commence à 0
          dateCreation: new Date().toISOString().split('T')[0],
          contacts: prospect.contacts || []
        }
        
        // 2. Sauvegarder le nouveau client
        const savedClients = JSON.parse(localStorage.getItem('clients') || '[]')
        savedClients.push(newClient)
        localStorage.setItem('clients', JSON.stringify(savedClients))
        
        // 3. Supprimer le prospect de la liste des prospects
        const savedProspects = JSON.parse(localStorage.getItem('prospects') || '[]')
        const updatedProspects = savedProspects.filter((p: any) => p.id !== prospectId)
        localStorage.setItem('prospects', JSON.stringify(updatedProspects))
        
        // 4. Déclencher les mêmes événements que la conversion devis
        window.dispatchEvent(new CustomEvent('prospectConverted', { detail: { prospectId: prospectId, clientId: newClient.id } }))
        window.dispatchEvent(new CustomEvent('clientAdded'))
        window.dispatchEvent(new CustomEvent('prospectDeleted'))
        
        console.log("Prospect converti avec succès en client:", newClient)
        console.log('Final localStorage state:')
        console.log('- Clients:', JSON.parse(localStorage.getItem('clients') || '[]').length)
        console.log('- Prospects:', JSON.parse(localStorage.getItem('prospects') || '[]').length)
        
        alert("Prospect converti en client avec succès !")
        // Rediriger vers la liste des clients
        window.location.href = "/clients"
      } catch (error) {
        console.error("Erreur lors de la conversion du prospect:", error)
        alert("Une erreur est survenue lors de la conversion du prospect")
      }
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/prospects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux prospects
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{prospect.nomEntreprise || prospect.entreprise}</h1>
            <p className="text-muted-foreground">
              {prospect.contacts?.[0]?.nom || prospect.nom} • Prospect depuis le {new Date(prospect.dateCreation).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleConvertToClient} className="button-modern">
            <UserCheck className="mr-2 h-4 w-4" />
            Convertir en client
          </Button>
          <Button asChild variant="outline">
            <Link href={`/prospects/${prospect.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      {/* Informations principales */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Informations du prospect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{prospect.contacts?.[0]?.email || prospect.email}</p>
                  <p className="text-sm text-muted-foreground">Email</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{prospect.contacts?.[0]?.telephone || prospect.telephone}</p>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{prospect.nomEntreprise || prospect.entreprise}</p>
                  <p className="text-sm text-muted-foreground">Entreprise</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded" />
                <div>
                  <p className="font-medium">{prospect.secteur}</p>
                  <p className="text-sm text-muted-foreground">Secteur d'activité</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">0 €</p>
                <p className="text-sm text-muted-foreground">Chiffre d'affaires potentiel</p>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                Prospect
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs defaultValue="interactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interactions">Historique</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interactions" className="space-y-4">
          {/* Formulaire d'ajout/modification d'interaction */}
          {showAddInteraction && (
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>
                  {editingInteraction ? 'Modifier une interaction' : 'Ajouter une interaction'}
                </CardTitle>
                <CardDescription>
                  {editingInteraction ? 'Modifiez les détails de l\'interaction' : 'Enregistrez une nouvelle interaction avec ce prospect'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type d'interaction</Label>
                    <Select value={newInteraction.type} onValueChange={(value) => setNewInteraction({...newInteraction, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appel">
                          <div className="flex items-center gap-2">
                            <PhoneCall className="h-4 w-4" />
                            Appel téléphonique
                          </div>
                        </SelectItem>
                        <SelectItem value="rdv">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Rendez-vous
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email envoyé
                          </div>
                        </SelectItem>
                        <SelectItem value="note">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Note interne
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={newInteraction.date.slice(0, 16)}
                      onChange={(e) => setNewInteraction({...newInteraction, date: new Date(e.target.value).toISOString()})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contenu">Description</Label>
                  <Textarea
                    id="contenu"
                    placeholder="Décrivez l'interaction..."
                    value={newInteraction.contenu}
                    onChange={(e) => setNewInteraction({...newInteraction, contenu: e.target.value})}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={editingInteraction ? handleUpdateInteraction : handleAddInteraction}>
                    {editingInteraction ? 'Mettre à jour' : 'Enregistrer'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowAddInteraction(false)
                    setEditingInteraction(null)
                    setNewInteraction({
                      type: 'appel',
                      contenu: '',
                      date: new Date().toISOString()
                    })
                  }}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Liste des interactions */}
          <Card className="card-modern">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Historique des interactions</CardTitle>
                <Button size="sm" onClick={() => setShowAddInteraction(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une interaction
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune interaction enregistrée pour ce prospect
                  </div>
                ) : (
                  interactions.map((interaction) => (
                    <div key={interaction.id} className="flex items-start gap-4 p-4 border rounded-lg group">
                      <div className="mt-1">
                        {getInteractionIcon(interaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{getInteractionLabel(interaction.type)}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(interaction.date)}
                          </span>
                        </div>
                        <p className="text-sm">{interaction.contenu}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="ghost" onClick={() => handleEditInteraction(interaction.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteInteraction(interaction.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="actions" className="space-y-4">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Actions disponibles pour ce prospect
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button onClick={handleConvertToClient} className="button-modern">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Convertir en client
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/devis/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un devis
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/prospects/${prospect.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier les informations
                  </Link>
                </Button>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Envoyer un email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
