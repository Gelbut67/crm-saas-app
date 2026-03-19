"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail, Building, Users, TrendingUp, DollarSign, UserCheck, Download, Upload } from "lucide-react"

import { useClients } from "@/hooks/useDatabase"

// Types
interface Client {
  id: string
  nom: string
  email?: string
  telephone?: string
  entreprise?: string
  secteur?: string
  statut: string
  caTotal: number
  dateCreation: string
  interactions: any[]
  devis: any[]
}

export default function ClientsPage() {
  const { clients, loading, reload } = useClients()
  const [searchTerm, setSearchTerm] = useState("")
  const [clientToDelete, setClientToDelete] = useState<string | null>(null)

  // Filtrer les clients
  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase()
    return (
      client.nom.toLowerCase().includes(searchLower) ||
      (client.entreprise && client.entreprise.toLowerCase().includes(searchLower)) ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.secteur && client.secteur.toLowerCase().includes(searchLower))
    )
  })

  // Calculer les statistiques
  const stats = {
    total: clients.length,
    caTotal: clients.reduce((sum, c) => sum + c.caTotal, 0),
    caMoyen: clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + c.caTotal, 0) / clients.length) : 0,
    croissance: 0 // TODO: calculer depuis le mois dernier
  }

  // Export CSV
  const exportCSV = () => {
    const headers = ['Nom', 'Email', 'Téléphone', 'Entreprise', 'Secteur', 'CA Total', 'Date création']
    const csvContent = [
      headers.join(','),
      ...clients.map(c => [
        c.nom,
        c.email || '',
        c.telephone || '',
        c.entreprise || '',
        c.secteur || '',
        c.caTotal.toString(),
        new Date(c.dateCreation).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Excel
  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(clients.map(c => ({
      Nom: c.nom,
      Email: c.email || '',
      Téléphone: c.telephone || '',
      Entreprise: c.entreprise || '',
      Secteur: c.secteur || '',
      'CA Total': c.caTotal,
      'Date création': new Date(c.dateCreation).toLocaleDateString('fr-FR')
    })))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients')
    XLSX.writeFile(workbook, `clients_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Supprimer un client
  const deleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await reload()
        setClientToDelete(null)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-in">
      {/* En-tête avec statistiques */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground">
              {clients.length} client{clients.length > 1 ? 's' : ''} actif{clients.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button asChild>
            <Link href="/clients-db/new">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau client
            </Link>
          </Button>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +0% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.caTotal.toLocaleString()} €</div>
              <p className="text-xs text-muted-foreground">
                +0% ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.caMoyen.toLocaleString()} €</div>
              <p className="text-xs text-muted-foreground">
                Par client
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Croissance</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{stats.croissance}%</div>
              <p className="text-xs text-muted-foreground">
                Ce mois
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={exportExcel}>
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Importer
            </Button>
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Aucun client trouvé' : 'Aucun client'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'Essayez une autre recherche' : 'Commencez par ajouter votre premier client'}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link href="/clients-db/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un client
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{client.nom}</h3>
                      {client.entreprise && (
                        <Badge variant="secondary">{client.entreprise}</Badge>
                      )}
                      {client.secteur && (
                        <Badge variant="outline">{client.secteur}</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </div>
                      )}
                      {client.telephone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {client.telephone}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">CA total : </span>
                        <span className="text-green-600 font-semibold">
                          {client.caTotal.toLocaleString()} €
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Client depuis {new Date(client.dateCreation).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/clients-db/${client.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/clients/${client.id}/edit`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setClientToDelete(client.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation de suppression */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Supprimer le client ?</CardTitle>
              <CardDescription>
                Cette action est irréversible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => deleteClient(clientToDelete)}
                  className="flex-1"
                >
                  Supprimer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setClientToDelete(null)}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
