"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail, Building, Users, TrendingUp, DollarSign, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"

import { ExportButton } from "@/components/export-button"
import { ImportButton } from "@/components/import-button"
import { AdvancedFilters, useClientFilters } from "@/components/advanced-filters"
import { NotificationCenter, useDevisReminders } from "@/components/ui/notifications"

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

const defaultClients: Client[] = [
  {
    id: "1",
    nomEntreprise: "Tech Solutions",
    secteur: "Technologie",
    caTotal: 25000,
    dateCreation: "2024-01-15",
    contacts: [
      {
        id: "1-1",
        nom: "Jean Dupont",
        email: "jean.dupont@entreprise.com",
        telephone: "06 12 34 56 78",
        poste: "Directeur Technique",
        isPrincipal: true,
        dateCreation: "2024-01-15"
      },
      {
        id: "1-2",
        nom: "Marie Durand",
        email: "marie.durand@entreprise.com",
        telephone: "06 98 76 54 32",
        poste: "Responsable Commercial",
        isPrincipal: false,
        dateCreation: "2024-01-20"
      }
    ]
  },
  {
    id: "2",
    nomEntreprise: "Services Plus",
    secteur: "Services",
    caTotal: 15000,
    dateCreation: "2024-02-01",
    contacts: [
      {
        id: "2-1",
        nom: "Marie Martin",
        email: "marie.martin@societe.fr",
        telephone: "06 98 76 54 32",
        poste: "PDG",
        isPrincipal: true,
        dateCreation: "2024-02-01"
      }
    ]
  },
  {
    id: "3",
    nomEntreprise: "Industrie Corp",
    secteur: "Industrie",
    caTotal: 18000,
    dateCreation: "2024-02-15",
    contacts: [
      {
        id: "3-1",
        nom: "Thomas Dubois",
        email: "thomas.dubois@industrie.com",
        telephone: "06 12 98 76 54",
        poste: "Directeur Général",
        isPrincipal: true,
        dateCreation: "2024-02-15"
      }
    ]
  }
]

export default function ClientsPage() {
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [stats, setStats] = useState({
    totalClients: 0,
    caTotal: 0,
    currentMonth: 0,
    monthlyDifference: 0,
    monthlyDifferenceText: '0'
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<'nom' | 'ca'>('nom')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadClients()
    
    // Recharger périodiquement pour détecter les changements
    const interval = setInterval(loadClients, 1000)
    
    // Écouter les événements de stockage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'clients') {
        loadClients()
      }
    }
    
    // Écouter l'événement personnalisé d'ajout de client
    const handleClientAdded = () => {
      loadClients()
    }
    
    // Écouter l'événement personnalisé de suppression de client
    const handleClientDeleted = () => {
      loadClients()
    }
    
    // Écouter l'événement personnalisé de mise à jour de client
    const handleClientUpdated = () => {
      loadClients()
    }
    
    // Écouter aussi les changements de devis (qui affectent le CA)
    const handleDevisUpdated = () => {
      console.log('devisUpdated event received on clients page')
      loadClients()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('clientAdded', handleClientAdded)
    window.addEventListener('clientDeleted', handleClientDeleted)
    window.addEventListener('clientUpdated', handleClientUpdated)
    window.addEventListener('devisUpdated', handleDevisUpdated)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('clientAdded', handleClientAdded)
      window.removeEventListener('clientDeleted', handleClientDeleted)
      window.removeEventListener('clientUpdated', handleClientUpdated)
      window.removeEventListener('devisUpdated', handleDevisUpdated)
    }
  }, [])

  useEffect(() => {
    const checkForChanges = () => {
      const savedClients = localStorage.getItem('clients')
      console.log('Polling: raw localStorage data:', savedClients)
      if (savedClients) {
        try {
          const parsedClients = JSON.parse(savedClients)
          const clientsWithDates = parsedClients.map((c: any) => ({
            ...c,
            dateCreation: new Date(c.dateCreation)
          }))
          
          // Vérifier si les données ont changé
          if (JSON.stringify(clientsWithDates) !== JSON.stringify(clientsList)) {
            console.log('Changes detected, updating clients list')
            setClientsList(clientsWithDates)
            
            // Recalculer les stats
            const newStats = calculateClientStats(clientsWithDates)
            setStats(newStats)
          }
        } catch (error) {
          console.error('Error parsing clients from localStorage:', error)
        }
      }
    }
    
    const interval = setInterval(checkForChanges, 2000) // Toutes les 2 secondes
    
    return () => clearInterval(interval)
  }, [clientsList])

  const loadClients = () => {
    console.log('loadClients called')
    try {
      const savedClients = localStorage.getItem('clients')
      console.log('savedClients from localStorage:', savedClients)
      if (savedClients) {
        const parsedClients = JSON.parse(savedClients)
        console.log('parsedClients:', parsedClients)
        const clientsWithDates = parsedClients.map((c: any) => ({
          ...c,
          dateCreation: new Date(c.dateCreation)
        }))
        setClientsList(clientsWithDates)
        
        // Calculer les stats après avoir chargé les clients
        const newStats = calculateClientStats(clientsWithDates)
        console.log('newStats calculated:', newStats)
        setStats(newStats)
      } else {
        // Utiliser les clients par défaut seulement si rien n'est sauvegardé
        setClientsList(defaultClients)
        const newStats = calculateClientStats(defaultClients)
        setStats(newStats)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error)
      setClientsList(defaultClients)
      const newStats = calculateClientStats(defaultClients)
      setStats(newStats)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleSort = (field: 'nom' | 'ca') => {
    if (sortBy === field) {
      // Inverser l'ordre si même champ
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Changer de champ et réinitialiser l'ordre
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    console.log("Tentative de suppression du client:", clientId)
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.")) {
      try {
        // Supprimer du localStorage
        const existingClients = JSON.parse(localStorage.getItem('clients') || '[]')
        console.log("Clients avant suppression:", existingClients)
        const updatedClients = existingClients.filter((c: any) => c.id !== clientId)
        console.log("Clients après suppression:", updatedClients)
        localStorage.setItem('clients', JSON.stringify(updatedClients))
        
        // Mettre à jour l'état local
        setClientsList(prev => {
          console.log("État avant mise à jour:", prev)
          const newList = prev.filter(c => c.id !== clientId)
          console.log("État après mise à jour:", newList)
          return newList
        })
        
        // Déclencher l'événement pour recharger
        window.dispatchEvent(new CustomEvent('clientDeleted'))
        
        alert("Client supprimé avec succès !")
      } catch (error) {
        console.error("Erreur lors de la suppression du client:", error)
        alert("Erreur lors de la suppression du client")
      }
    }
  }

  const sortedAndFilteredClients = clientsList
    .filter(client =>
      client.nomEntreprise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.secteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.contacts && client.contacts.some(contact => 
        contact.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    )
    .sort((a, b) => {
      let comparison = 0
      
      if (sortBy === 'nom') {
        const nameA = a.nomEntreprise?.toLowerCase() || ''
        const nameB = b.nomEntreprise?.toLowerCase() || ''
        comparison = nameA.localeCompare(nameB)
      } else if (sortBy === 'ca') {
        comparison = (a.caTotal || 0) - (b.caTotal || 0)
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const filteredCount = sortedAndFilteredClients.length

  // Calculer les statistiques réelles des clients
  const calculateClientStats = (clients: Client[] = clientsList) => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Clients du mois actuel
    const currentMonthClients = clients.filter(client => {
      const clientDate = new Date(client.dateCreation)
      return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear
    })

    // Clients du mois précédent
    const previousMonthClients = clients.filter(client => {
      const clientDate = new Date(client.dateCreation)
      return clientDate.getMonth() === previousMonth && clientDate.getFullYear() === previousYear
    })

    // Calculer le CA total
    const caTotal = clients.reduce((sum, client) => sum + (client.caTotal || 0), 0)
    
    const totalCurrentMonth = currentMonthClients.length
    const totalPreviousMonth = previousMonthClients.length
    const monthlyDifference = totalCurrentMonth - totalPreviousMonth

    return {
      totalClients: clients.length,
      caTotal,
      currentMonth: totalCurrentMonth,
      monthlyDifference,
      monthlyDifferenceText: monthlyDifference >= 0 ? `+${monthlyDifference}` : `${monthlyDifference}`
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Clients
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Gérez votre base de données clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ImportButton type="clients" />
          <ExportButton type="clients" data={sortedAndFilteredClients} />
          <Button asChild className="button-modern">
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyDifferenceText} par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.caTotal.toLocaleString()} €
            </div>
            <p className="text-xs text-muted-foreground">
              CA cumulé de tous les clients
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux ce mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentMonth}</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyDifferenceText} par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Boutons de tri */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Trier par :</span>
          <Button
            variant={sortBy === 'nom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('nom')}
          >
            Nom {sortBy === 'nom' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button
            variant={sortBy === 'ca' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('ca')}
          >
            CA {sortBy === 'ca' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedAndFilteredClients.length} client{sortedAndFilteredClients.length > 1 ? 's' : ''} trouvé{sortedAndFilteredClients.length > 1 ? 's' : ''}
        </div>
      </div>

      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>
            {sortedAndFilteredClients.length} client{sortedAndFilteredClients.length > 1 ? 's' : ''} trouvé{sortedAndFilteredClients.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Entreprise</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Secteur</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Contact Principal</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Téléphone</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Contacts</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">CA Total</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredClients.map((client, index) => {
                  const principalContact = client.contacts?.find(c => c.isPrincipal)
                  return (
                    <tr 
                      key={client.id} 
                      className={cn(
                        "border-b border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                        index % 2 === 0 && "bg-gray-50/50 dark:bg-gray-800/30"
                      )}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{client.nomEntreprise}</span>
                          <Badge variant="default" className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                            Client
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {client.secteur || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {principalContact?.nom || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {principalContact?.email || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {principalContact?.telephone || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>{client.contacts?.length || 0}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-green-600">
                        {client.caTotal.toLocaleString()} €
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="text-xs hover-lift" asChild>
                            <Link href={`/clients/${client.id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs hover-lift" asChild>
                            <Link href={`/clients/${client.id}/edit`}>
                              <Edit className="h-3 w-3" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs hover-lift" onClick={() => handleDeleteClient(client.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {sortedAndFilteredClients.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Aucun client trouvé pour cette recherche." 
                  : "Aucun client pour le moment."}
              </p>
              {!searchTerm && (
                <Button asChild className="mt-4">
                  <Link href="/clients/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter votre premier client
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
