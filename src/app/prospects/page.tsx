"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail, Building, UserCheck, Users, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImportButton } from "@/components/import-button"

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

interface Prospect {
  id: string
  nomEntreprise: string
  secteur?: string
  dateCreation: Date | string
  contacts: Contact[]
}

interface Client {
  id: string
  nomEntreprise: string
  entreprise?: string
  secteur?: string
  caTotal: number
  dateCreation: Date | string
  contacts: Contact[]
}

const defaultProspects: Prospect[] = [
  {
    id: "1",
    nomEntreprise: "Startup Innov",
    secteur: "Technologie",
    dateCreation: "2024-03-14",
    contacts: [
      {
        id: "1-1",
        nom: "Marie Martin",
        email: "marie.martin@startup.fr",
        telephone: "06 23 45 67 89",
        poste: "PDG",
        isPrincipal: true,
        dateCreation: "2024-03-14"
      }
    ]
  },
  {
    id: "2",
    nomEntreprise: "Boutique En Ligne",
    secteur: "E-commerce",
    dateCreation: "2024-03-10",
    contacts: [
      {
        id: "2-1",
        nom: "Pierre Bernard",
        email: "pierre.bernard@commerce.fr",
        telephone: "06 45 67 89 01",
        poste: "Fondateur",
        isPrincipal: true,
        dateCreation: "2024-03-10"
      }
    ]
  },
  {
    id: "3",
    nomEntreprise: "Services Pro",
    secteur: "Services",
    dateCreation: "2024-03-08",
    contacts: [
      {
        id: "3-1",
        nom: "Sophie Lefebvre",
        email: "sophie@services.fr",
        telephone: "06 78 90 12 34",
        poste: "Directrice",
        isPrincipal: true,
        dateCreation: "2024-03-08"
      }
    ]
  }
]

export default function ProspectsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [prospectsList, setProspectsList] = useState<Prospect[]>([])
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([])
  const [clientsList, setClientsList] = useState<Client[]>([])
  const [stats, setStats] = useState({
    totalProspects: 0,
    conversionRate: 0,
    currentMonth: 0,
    monthlyDifference: 0,
    monthlyDifferenceText: '0',
    convertedCount: 0
  })

  const [lastResetDate, setLastResetDate] = useState<string | null>(null)

  // Calculer les statistiques quand les données changent
  useEffect(() => {
    const newStats = calculateProspectStats()
    setStats(newStats)
  }, [prospectsList, clientsList])

  useEffect(() => {
    loadProspects()
    loadClients()
    
    // Charger la date de dernière réinitialisation
    const savedResetDate = localStorage.getItem('conversionRateLastReset')
    console.log('Loading reset date from localStorage:', savedResetDate)
    if (savedResetDate) {
      setLastResetDate(savedResetDate)
      console.log('Reset date set to state:', savedResetDate)
    } else {
      console.log('No reset date found in localStorage')
    }
    
    // Recharger périodiquement pour détecter les changements
    const interval = setInterval(() => {
      console.log('Polling: reloading prospects and clients')
      loadProspects()
      loadClients()
    }, 500) // Plus fréquent : toutes les 500ms
    
    // Écouter les changements localStorage
    const handleStorageChange = () => {
      loadProspects()
      loadClients()
    }
    
    // Écouter l'événement personnalisé d'import de prospect
    const handleProspectAdded = () => {
      loadProspects()
      loadClients()
    }
    
    // Écouter l'événement personnalisé de suppression de prospect
    const handleProspectDeleted = () => {
      loadProspects()
      loadClients()
    }
    
    // Écouter l'événement personnalisé de mise à jour de prospect
    const handleProspectUpdated = () => {
      loadProspects()
      loadClients()
    }
    
    // Écouter aussi les changements de clients (qui affectent le taux de conversion)
    const handleClientUpdated = () => {
      loadProspects()
      loadClients()
    }
    
    // Écouter la conversion de prospects en clients
    const handleProspectConverted = () => {
      console.log('Prospect converted event received')
      loadProspects()
      loadClients()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('prospectAdded', handleProspectAdded)
    window.addEventListener('prospectDeleted', handleProspectDeleted)
    window.addEventListener('prospectUpdated', handleProspectUpdated)
    window.addEventListener('clientUpdated', handleClientUpdated)
    window.addEventListener('prospectConverted', handleProspectConverted)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('prospectAdded', handleProspectAdded)
      window.removeEventListener('prospectDeleted', handleProspectDeleted)
      window.removeEventListener('prospectUpdated', handleProspectUpdated)
      window.removeEventListener('clientUpdated', handleClientUpdated)
      window.removeEventListener('prospectConverted', handleProspectConverted)
    }
  }, [])

  // Calculer les statistiques réelles des prospects
  const calculateProspectStats = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Prospects du mois actuel
    const currentMonthProspects = prospectsList.filter(prospect => {
      const prospectDate = new Date(prospect.dateCreation)
      return prospectDate.getMonth() === currentMonth && prospectDate.getFullYear() === currentYear
    })

    // Prospects du mois précédent
    const previousMonthProspects = prospectsList.filter(prospect => {
      const prospectDate = new Date(prospect.dateCreation)
      return prospectDate.getMonth() === previousMonth && prospectDate.getFullYear() === previousYear
    })

    // Calculer le taux de conversion (prospects devenus clients)
    // On considère qu'un prospect est converti si un client a le même nom d'entreprise
    console.log('=== CONVERSION RATE DEBUG ===')
    console.log('Total prospects:', prospectsList.length)
    console.log('Total clients:', clientsList.length)
    
    // Afficher la structure exacte des données
    console.log('Prospects structure:')
    prospectsList.forEach((p, i) => {
      console.log(`  ${i}: id=${p.id}, nomEntreprise="${p.nomEntreprise}"`)
    })
    
    console.log('Clients structure:')
    clientsList.forEach((c, i) => {
      console.log(`  ${i}: id=${c.id}, nomEntreprise="${c.nomEntreprise}", entreprise="${c.entreprise}"`)
    })
    
    // NOUVELLE LOGIQUE: Compter les clients qui viennent de prospects
    // Un client est considéré comme "converti" si son nom d'entreprise correspond à un prospect
    const convertedClients = clientsList.filter((client: Client) => {
      const clientEntreprise = client.nomEntreprise || client.entreprise || ''
      if (!clientEntreprise) return false
      
      // Vérifier si ce client correspond à un prospect (même nom d'entreprise)
      const wasProspect = prospectsList.some(prospect => {
        const prospectEntreprise = prospect.nomEntreprise || ''
        return prospectEntreprise.toLowerCase() === clientEntreprise.toLowerCase()
      })
      
      // Si pas dans les prospects actuels, vérifier si c'est un client récemment converti
      // en regardant si l'ID du client commence par "client_" (notre logique de conversion)
      const isRecentlyConverted = client.id.startsWith('client_')
      
      console.log(`    Client "${clientEntreprise}": wasProspect=${wasProspect}, isRecentlyConverted=${isRecentlyConverted}`)
      
      return wasProspect || isRecentlyConverted
    })
    
    console.log('Converted clients count:', convertedClients.length)
    console.log('Converted clients details:', convertedClients.map(c => ({id: c.id, nom: c.nomEntreprise || c.entreprise})))

    const totalCurrentMonth = currentMonthProspects.length
    const totalPreviousMonth = previousMonthProspects.length
    const monthlyDifference = totalCurrentMonth - totalPreviousMonth
    
    // NOUVEAU CALCUL: Basé sur le nombre total de clients convertis par rapport au total des prospects
    const totalProspectsEver = prospectsList.length + convertedClients.length // Prospects actuels + ceux convertis
    const conversionRate = totalProspectsEver > 0 ? Math.round((convertedClients.length / totalProspectsEver) * 100) : 0

    console.log('New conversion rate calculation:')
    console.log('  convertedClients.length:', convertedClients.length)
    console.log('  totalProspectsEver (current + converted):', totalProspectsEver)
    console.log('  conversionRate:', conversionRate, '%')
    console.log('=== END DEBUG ===')

    return {
      totalProspects: prospectsList.length,
      currentMonth: totalCurrentMonth,
      monthlyDifference,
      conversionRate,
      monthlyDifferenceText: monthlyDifference >= 0 ? `+${monthlyDifference}` : `${monthlyDifference}`,
      convertedCount: convertedClients.length
    }
  }

  const loadProspects = () => {
    console.log('loadProspects called')
    try {
      const savedProspects = localStorage.getItem('prospects')
      console.log('Raw prospects from localStorage:', savedProspects)
      if (savedProspects) {
        const parsedProspects = JSON.parse(savedProspects)
        console.log('Parsed prospects:', parsedProspects)
        setProspectsList(parsedProspects)
      } else {
        // Utiliser les prospects par défaut seulement si rien n'est sauvegardé
        setProspectsList(defaultProspects)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des prospects:", error)
      setProspectsList(defaultProspects)
    }
  }

  const loadClients = () => {
    console.log('loadClients called')
    try {
      const savedClients = localStorage.getItem('clients')
      console.log('Raw clients from localStorage:', savedClients)
      if (savedClients) {
        const parsedClients = JSON.parse(savedClients)
        console.log('Parsed clients:', parsedClients)
        setClientsList(parsedClients)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error)
    }
  }

  // Fonction pour réinitialiser le taux de conversion
  const handleResetConversionRate = () => {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser le taux de conversion ?\n\nCette action va supprimer tous les clients convertis (ceux avec un ID commençant par 'client_') et ne peut être annulée.")) {
      try {
        // Supprimer uniquement les clients convertis (ID commençant par 'client_')
        const savedClients = JSON.parse(localStorage.getItem('clients') || '[]')
        const originalClients = savedClients.filter((client: any) => !client.id.startsWith('client_'))
        localStorage.setItem('clients', JSON.stringify(originalClients))
        
        // Enregistrer la date de réinitialisation
        const resetDate = new Date().toISOString()
        localStorage.setItem('conversionRateLastReset', resetDate)
        setLastResetDate(resetDate) // Mettre à jour l'état immédiatement
        
        console.log('Conversion rate reset: removed', savedClients.length - originalClients.length, 'converted clients')
        console.log('Reset date saved:', resetDate)
        console.log('Reset date state updated:', resetDate)
        alert("Taux de conversion réinitialisé avec succès !")
      } catch (error) {
        console.error("Erreur lors de la réinitialisation:", error)
        alert("Une erreur est survenue lors de la réinitialisation")
      }
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  useEffect(() => {
    const filteredProspects = prospectsList.filter(prospect =>
      prospect.nomEntreprise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.secteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prospect.contacts && prospect.contacts.some(contact => 
        contact.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    )
    setFilteredProspects(filteredProspects)
  }, [prospectsList, searchTerm])

  const handleDeleteProspect = async (prospectId: string) => {
    console.log("Tentative de suppression du prospect:", prospectId)
    if (confirm("Êtes-vous sûr de vouloir supprimer ce prospect ? Cette action est irréversible.")) {
      try {
        // Supprimer du localStorage
        const existingProspects = JSON.parse(localStorage.getItem('prospects') || '[]')
        console.log("Prospects avant suppression:", existingProspects)
        const updatedProspects = existingProspects.filter((p: any) => p.id !== prospectId)
        console.log("Prospects après suppression:", updatedProspects)
        localStorage.setItem('prospects', JSON.stringify(updatedProspects))
        
        // Mettre à jour l'état local
        setProspectsList(prev => {
          console.log("État avant mise à jour:", prev)
          const newList = prev.filter(p => p.id !== prospectId)
          console.log("État après mise à jour:", newList)
          return newList
        })
        
        // Déclencher l'événement pour recharger
        window.dispatchEvent(new CustomEvent('prospectDeleted'))
        
        alert("Prospect supprimé avec succès !")
      } catch (error) {
        console.error("Erreur lors de la suppression du prospect:", error)
        alert("Erreur lors de la suppression du prospect")
      }
    }
  }

  const handleConvertToClient = async (prospectId: string) => {
    if (confirm("Êtes-vous sûr de vouloir convertir ce prospect en client ?")) {
      // Logique pour convertir le prospect en client
      console.log("Conversion du prospect:", prospectId)
      
      // Trouver le prospect à convertir
      const prospectToConvert = prospectsList.find((p: any) => p.id === prospectId)
      if (prospectToConvert) {
        // Créer un nouveau client à partir du prospect
        const newClient = {
          ...prospectToConvert,
          caTotal: 0
        }
        
        // Ajouter le client à localStorage
        const existingClients = JSON.parse(localStorage.getItem('clients') || '[]')
        const updatedClients = [...existingClients, newClient]
        localStorage.setItem('clients', JSON.stringify(updatedClients))
        
        // Retirer le prospect de la liste locale et du localStorage
        const existingProspects = JSON.parse(localStorage.getItem('prospects') || '[]')
        const updatedProspects = existingProspects.filter((p: any) => p.id !== prospectId)
        localStorage.setItem('prospects', JSON.stringify(updatedProspects))
        
        // Mettre à jour l'état local
        setProspectsList(updatedProspects)
      }
      
      alert("Prospect converti en client avec succès !")
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Prospects</h1>
          <p className="text-muted-foreground">
            Gérez vos prospects et convertissez-les en clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ImportButton />
          <Button asChild className="button-modern">
            <Link href="/prospects/new">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un prospect
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProspects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyDifferenceText} par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetConversionRate}
                className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                title="Réinitialiser le taux de conversion"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.convertedCount} prospects devenus clients
            </p>
            {lastResetDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Dernière remise à zéro: {new Date(lastResetDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux ce mois</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
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
            placeholder="Rechercher un prospect..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="card-modern">
        <CardHeader>
          <CardTitle>Liste des prospects</CardTitle>
          <CardDescription>
            {filteredProspects.length} prospect{filteredProspects.length > 1 ? 's' : ''} trouvé{filteredProspects.length > 1 ? 's' : ''}
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
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProspects.map((prospect, index) => {
                  const principalContact = prospect.contacts?.find(c => c.isPrincipal)
                  return (
                    <tr 
                      key={prospect.id} 
                      className={cn(
                        "border-b border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                        index % 2 === 0 && "bg-gray-50/50 dark:bg-gray-800/30"
                      )}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prospect.nomEntreprise}</span>
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                            Prospect
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {prospect.secteur || '-'}
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
                          <span>{prospect.contacts?.length || 0}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {typeof prospect.dateCreation === 'string' 
                          ? new Date(prospect.dateCreation).toLocaleDateString('fr-FR')
                          : prospect.dateCreation.toLocaleDateString('fr-FR')
                        }
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="text-xs hover-lift" asChild>
                            <Link href={`/prospects/${prospect.id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs hover-lift" asChild>
                            <Link href={`/prospects/${prospect.id}/edit`}>
                              <Edit className="h-3 w-3" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs hover-lift"
                            onClick={() => handleConvertToClient(prospect.id)}
                          >
                            <UserCheck className="mr-1 h-3 w-3" />
                            Convertir
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs hover-lift" onClick={() => handleDeleteProspect(prospect.id)}>
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
        </CardContent>
      </Card>

      {filteredProspects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucun prospect trouvé pour "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  )
}
