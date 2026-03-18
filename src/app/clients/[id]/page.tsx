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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Calendar, DollarSign, FileText, Building, Phone, Mail, Plus, UserCheck, PhoneCall, Mail as MailIcon, MessageSquare, Edit, Trash2, Users } from "lucide-react"

const defaultClients = [
  {
    id: "1",
    nom: "Jean Dupont",
    email: "jean.dupont@entreprise.com",
    telephone: "06 12 34 56 78",
    entreprise: "Tech Solutions",
    secteur: "Technologie",
    caTotal: 25000,
    dateCreation: "2024-01-15"
  },
  {
    id: "2",
    nom: "Marie Martin",
    email: "marie.martin@societe.fr",
    telephone: "06 98 76 54 32",
    entreprise: "Services Plus",
    secteur: "Services",
    caTotal: 15000,
    dateCreation: "2024-02-01"
  },
  {
    id: "3",
    nom: "Thomas Dubois",
    email: "thomas.dubois@industrie.com",
    telephone: "06 12 98 76 54",
    entreprise: "Industrie Corp",
    secteur: "Industrie",
    caTotal: 18000,
    dateCreation: "2024-02-15"
  }
]

const mockInteractions = [
  {
    id: "1",
    type: "appel",
    contenu: "Appel de suivi suite à l'envoi du devis",
    date: "2024-03-15T10:30:00"
  },
  {
    id: "2",
    type: "rdv",
    contenu: "Rendez-vous physique au bureau pour présentation commerciale",
    date: "2024-03-10T14:00:00"
  },
  {
    id: "3",
    type: "email",
    contenu: "Envoi de la proposition commerciale par email",
    date: "2024-03-08T09:15:00"
  },
  {
    id: "4",
    type: "note",
    contenu: "Note : Client très intéressé par notre solution SaaS",
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

function getStatutBadge(statut: string) {
  switch (statut) {
    case 'gagne':
      return <Badge className="bg-green-100 text-green-800">Gagné</Badge>
    case 'perdu':
      return <Badge className="bg-red-100 text-red-800">Perdu</Badge>
    case 'en_cours':
      return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
    default:
      return <Badge variant="outline">{statut}</Badge>
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

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string
  const [client, setClient] = useState<any>(null)
  const [interactions, setInteractions] = useState<any[]>([])
  const [devis, setDevis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [editingInteraction, setEditingInteraction] = useState<string | null>(null)
  const [newInteraction, setNewInteraction] = useState({
    type: 'appel',
    contenu: '',
    date: new Date().toISOString()
  })

  useEffect(() => {
    loadClientData()
    
    // Écouter les mises à jour de clients et devis
    const handleDataUpdated = () => {
      loadClientData()
    }
    
    window.addEventListener('clientUpdated', handleDataUpdated)
    window.addEventListener('devisUpdated', handleDataUpdated)
    
    return () => {
      window.removeEventListener('clientUpdated', handleDataUpdated)
      window.removeEventListener('devisUpdated', handleDataUpdated)
    }
  }, [clientId])

  const loadClientData = () => {
    console.log('=== LOAD CLIENT DATA ===')
    // Charger les clients depuis localStorage
    const savedClients = localStorage.getItem('clients')
    let clients = defaultClients
    
    if (savedClients) {
      const parsedClients = JSON.parse(savedClients)
      const clientsWithDates = parsedClients.map((c: any) => ({
        ...c,
        dateCreation: new Date(c.dateCreation)
      }))
      clients = clientsWithDates
    }
    
    // Charger les devis depuis localStorage
    const savedDevis = localStorage.getItem('devis')
    let allDevis: any[] = []
    
    if (savedDevis) {
      const parsedDevis = JSON.parse(savedDevis)
      allDevis = parsedDevis
    }
    
    // Charger les interactions depuis localStorage
    const savedInteractions = localStorage.getItem(`interactions_${clientId}`)
    let clientInteractions: any[] = []
    
    if (savedInteractions) {
      clientInteractions = JSON.parse(savedInteractions)
    }
    
    console.log('Loading interactions for client', clientId, ':', clientInteractions)
    
    // Trier les interactions par date (plus récentes en premier)
    clientInteractions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // Trouver le client correspondant
    const foundClient = clients.find((c: any) => c.id === clientId)
    console.log('Client trouvé:', foundClient)
    
    // Filtrer les devis pour ce client
    const clientDevis = allDevis.filter((devis: any) => {
      // Vérifier si le devis appartient à ce client
      return devis.client?.id === clientId || 
             (foundClient && (devis.client?.nom === foundClient.nom || 
                            devis.client?.entreprise === foundClient.entreprise))
    })
    
    console.log('Devis du client:', clientDevis)
    
    setClient(foundClient || null)
    setInteractions(clientInteractions)
    setDevis(clientDevis)
    setLoading(false)
    console.log('=== END LOAD CLIENT DATA ===')
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
      const existingInteractions = JSON.parse(localStorage.getItem(`interactions_${clientId}`) || '[]')
      
      // Ajouter la nouvelle interaction
      const updatedInteractions = [interaction, ...existingInteractions]
      
      // Sauvegarder dans localStorage
      localStorage.setItem(`interactions_${clientId}`, JSON.stringify(updatedInteractions))
      
      // Mettre à jour l'état
      setInteractions(updatedInteractions)
      
      // Réinitialiser le formulaire
      setNewInteraction({
        type: 'appel',
        contenu: '',
        date: new Date().toISOString()
      })
      
      // Fermer la dialog
      setShowAddInteraction(false)
      
      console.log('Nouvelle interaction ajoutée:', interaction)
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'interaction:', error)
      alert('Une erreur est survenue lors de l\'ajout de l\'interaction')
    }
  }

  // Fonction pour supprimer une interaction
  const handleDeleteInteraction = (interactionId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette interaction ?')) {
      try {
        const existingInteractions = JSON.parse(localStorage.getItem(`interactions_${clientId}`) || '[]')
        const updatedInteractions = existingInteractions.filter((i: any) => i.id !== interactionId)
        
        localStorage.setItem(`interactions_${clientId}`, JSON.stringify(updatedInteractions))
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
      setNewInteraction({
        type: interaction.type,
        contenu: interaction.contenu,
        date: interaction.date
      })
      setEditingInteraction(interactionId)
      setShowAddInteraction(true)
    }
  }

  // Fonction pour sauvegarder la modification
  const handleUpdateInteraction = () => {
    if (!editingInteraction || !newInteraction.contenu.trim()) {
      alert('Veuillez remplir le contenu de l\'interaction')
      return
    }

    try {
      const existingInteractions = JSON.parse(localStorage.getItem(`interactions_${clientId}`) || '[]')
      const updatedInteractions = existingInteractions.map((i: any) => 
        i.id === editingInteraction 
          ? { ...i, type: newInteraction.type, contenu: newInteraction.contenu }
          : i
      )
      
      localStorage.setItem(`interactions_${clientId}`, JSON.stringify(updatedInteractions))
      setInteractions(updatedInteractions)
      
      // Réinitialiser
      setEditingInteraction(null)
      setShowAddInteraction(false)
      setNewInteraction({
        type: 'appel',
        contenu: '',
        date: new Date().toISOString()
      })
      
      console.log('Interaction modifiée:', editingInteraction)
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      alert('Une erreur est survenue lors de la modification')
    }
  }

  // Fonction pour changer le statut d'un devis directement
  const handleStatutChange = (devisId: string, newStatut: 'en_cours' | 'gagne' | 'perdu') => {
    try {
      // Mettre à jour le localStorage des devis
      const savedDevis = JSON.parse(localStorage.getItem('devis') || '[]')
      const updatedDevis = savedDevis.map((d: any) => 
        d.id === devisId ? { ...d, statut: newStatut } : d
      )
      localStorage.setItem('devis', JSON.stringify(updatedDevis))
      
      // Mettre à jour l'état local des devis
      setDevis(prev => prev.map(d => 
        d.id === devisId ? { ...d, statut: newStatut } : d
      ))
      
      // Déclencher un événement pour notifier les autres pages
      window.dispatchEvent(new CustomEvent('devisUpdated', { 
        detail: { devisId, newStatus: newStatut } 
      }))
      
      // Recalculer le CA du client (somme des devis gagnés)
      console.log('=== RECALCUL CA CLIENT ===')
      console.log('Client ID:', clientId)
      console.log('Updated devis:', updatedDevis)
      
      const clientDevis = updatedDevis.filter((d: any) => {
        // Vérifier que le devis appartient à ce client
        const isClientDevis = d.client?.id === clientId || 
          (client && (d.client?.nom === client.nom || 
                     d.client?.entreprise === client.entreprise))
        return isClientDevis
      })
      
      console.log('Devis du client:', clientDevis)
      
      const clientCaTotal = clientDevis
        .filter((d: any) => d.statut === 'gagne')
        .reduce((sum: number, d: any) => sum + (d.montant || 0), 0)
      
      console.log('Nouveau CA calculé:', clientCaTotal)
      
      // Mettre à jour le CA du client dans localStorage
      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]')
      const updatedClients = savedClients.map((c: any) =>
        c.id === clientId ? { ...c, caTotal: clientCaTotal } : c
      )
      localStorage.setItem('clients', JSON.stringify(updatedClients))
      
      console.log('Clients mis à jour dans localStorage')
      
      // Mettre à jour l'état local du client
      setClient((prev: any) => prev ? { ...prev, caTotal: clientCaTotal } : null)
      
      console.log('État local du client mis à jour')
      console.log('=== FIN RECALCUL CA ===')
      
      // Déclencher l'événement pour notifier les autres composants
      console.log('Dispatching devisUpdated and clientUpdated events')
      window.dispatchEvent(new CustomEvent('devisUpdated'))
      window.dispatchEvent(new CustomEvent('clientUpdated'))
      
      // Afficher une confirmation
      const statutLabels: { [key: string]: string } = {
        'en_cours': 'En cours',
        'gagne': 'Gagné',
        'perdu': 'Perdu'
      }
      alert(`Statut mis à jour : ${statutLabels[newStatut]}${newStatut === 'gagne' ? ` (CA mis à jour: ${clientCaTotal.toLocaleString()} €)` : ''}`)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error)
      alert("Erreur lors de la mise à jour du statut")
    }
  }

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  if (!client) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Client non trouvé</p>
          <Button asChild className="mt-4">
            <Link href="/clients">Retour aux clients</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux clients
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.nomEntreprise || client.entreprise || 'Entreprise'}</h1>
            <p className="text-muted-foreground">
              {client.contacts?.[0]?.nom || client.nom || 'Contact'} • Client depuis le {new Date(client.dateCreation).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/clients/${client.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      {/* Informations principales */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{client.contacts?.[0]?.email || client.email || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">Email</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{client.contacts?.[0]?.telephone || client.telephone || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{client.contacts?.length || 0} contact(s)</p>
                  <p className="text-sm text-muted-foreground">Contacts</p>
                </div>
              </div>
              {client.contacts && client.contacts.length > 0 && (
                <div className="space-y-2 ml-8">
                  {client.contacts.map((contact: any, index: number) => (
                    <div key={contact.id || index} className="text-sm p-2 bg-gray-50 rounded">
                      <p className="font-medium">{contact.nom}</p>
                      {contact.email && <p className="text-muted-foreground">{contact.email}</p>}
                      {contact.telephone && <p className="text-muted-foreground">{contact.telephone}</p>}
                      {contact.poste && <p className="text-muted-foreground">{contact.poste}</p>}
                      {contact.isPrincipal && (
                        <Badge variant="secondary" className="mt-1">Contact principal</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{(client.caTotal || 0).toLocaleString()} €</p>
                <p className="text-sm text-muted-foreground">Chiffre d'affaires total</p>
              </div>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                Client
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs defaultValue="interactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interactions">Historique</TabsTrigger>
          <TabsTrigger value="devis">Devis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interactions" className="space-y-4">
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
              {showAddInteraction && (
                <Card className="mb-4 border-2 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingInteraction ? 'Modifier une interaction' : 'Ajouter une interaction'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="type">Type d'interaction</Label>
                        <Select value={newInteraction.type} onValueChange={(value) => setNewInteraction({...newInteraction, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="appel">Appel téléphonique</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="rdv">Rendez-vous</SelectItem>
                            <SelectItem value="note">Note</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="contenu">Contenu</Label>
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
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="space-y-4">
                {interactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune interaction enregistrée pour ce client
                  </p>
                ) : (
                  interactions.map((interaction) => (
                    <div key={interaction.id} className="flex items-start gap-4 p-4 border rounded-lg group hover:bg-gray-50">
                      <div className="mt-1">
                        {getInteractionIcon(interaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getInteractionLabel(interaction.type)}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(interaction.date)}
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditInteraction(interaction.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteInteraction(interaction.id)}
                              className="h-8 w-8 p-0 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm">{interaction.contenu}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="devis" className="space-y-4">
          <Card className="card-modern">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Devis associés</CardTitle>
                <Button size="sm" asChild>
                  <Link href="/devis/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau devis
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {devis.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun devis associé à ce client
                  </div>
                ) : (
                  devis.map((devisItem) => (
                    <div key={devisItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{devisItem.titre}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            Créé le {new Date(devisItem.dateCreation).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Échéance {new Date(devisItem.dateEcheance).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{devisItem.montant.toLocaleString()} €</span>
                        
                        {/* Sélecteur de statut direct */}
                        <Select 
                          value={devisItem.statut} 
                          onValueChange={(value) => handleStatutChange(devisItem.id, value as 'en_cours' | 'gagne' | 'facture' | 'perdu')}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en_cours">En cours</SelectItem>
                            <SelectItem value="gagne">Gagné</SelectItem>
                            <SelectItem value="facture">Facturé</SelectItem>
                            <SelectItem value="perdu">Perdu</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex gap-2 ml-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/devis/${devisItem.id}`}>
                              Voir
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/devis/${devisItem.id}/edit`}>
                              Modifier
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
