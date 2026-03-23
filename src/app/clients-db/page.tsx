"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail, Building, Users, TrendingUp, DollarSign, FileText, User } from "lucide-react"
import { useClients, useDevis } from "@/hooks/useDatabase"
import { useClientFilters } from "@/components/advanced-filters"
import { AdvancedFilters } from "@/components/advanced-filters"
import { ExportButton } from "@/components/export-button"
import { ImportButton } from "@/components/import-button"

export default function ClientsDBPage() {
  const { clients, loading, reload } = useClients()
  const { devis } = useDevis()
  const { filters, setFilters, filteredAndSortedClients, filteredCount, totalCount, resetFilters } = useClientFilters(clients)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)

  // Calculer les statistiques
  const stats = {
    totalClients: clients.length,
    caTotal: clients.reduce((sum, client) => sum + (client.caTotal || 0), 0),
    caMoyen: clients.length > 0 ? clients.reduce((sum, client) => sum + (client.caTotal || 0), 0) / clients.length : 0,
  }

  // Supprimer un client
  const deleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await reload()
        setShowDeleteDialog(null)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Préparer les données pour l'export
  const exportData = filteredAndSortedClients.map(client => ({
    id: client.id,
    nomEntreprise: client.entreprise || client.nom,
    secteur: client.secteur || '',
    caTotal: client.caTotal || 0,
    dateCreation: new Date(client.dateCreation).toLocaleDateString('fr-FR'),
    contacts: client.contacts?.map((c: any) => c.nom).join(', ') || '',
    nbDevis: client.devis?.length || 0
  }))

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
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground">
              Gérez vos clients et leurs informations
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton type="clients" data={exportData} />
            <ImportButton type="clients" />
            <Button asChild>
              <Link href="/clients-db/new">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau client
              </Link>
            </Button>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                Clients actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.caTotal.toLocaleString()} €</div>
              <p className="text-xs text-muted-foreground">
                Chiffre d'affaires cumulé
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA Moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.caMoyen.toLocaleString()} €</div>
              <p className="text-xs text-muted-foreground">
                Par client
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres avancés */}
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
          totalCount={clients.length}
          filteredCount={filteredCount}
        />
      </div>

      {/* Liste des clients */}
      {filteredAndSortedClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {filters.search || filters.secteur || filters.entreprise || filters.departement || filters.caMin || filters.caMax ? 'Aucun client trouvé' : 'Aucun client'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {filters.search || filters.secteur || filters.entreprise || filters.departement || filters.caMin || filters.caMax ? 'Essayez de modifier vos filtres' : 'Commencez par ajouter votre premier client'}
            </p>
            {!filters.search && !filters.secteur && !filters.entreprise && !filters.departement && !filters.caMin && !filters.caMax && (
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
          {filteredAndSortedClients.map((client) => {
            const principalContact = client.contacts?.find((c: any) => c.isPrincipal) || client.contacts?.[0]
            const otherContactsCount = (client.contacts?.length || 0) - 1
            
            return (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{client.entreprise || client.nom}</h3>
                        {client.secteur && (
                          <Badge variant="outline">{client.secteur}</Badge>
                        )}
                      </div>
                      
                      {/* Contact principal */}
                      {principalContact && (
                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{principalContact.nom}</span>
                            {principalContact.poste && (
                              <span className="text-xs">• {principalContact.poste}</span>
                            )}
                          </div>
                          {principalContact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {principalContact.email}
                            </div>
                          )}
                          {principalContact.telephone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {principalContact.telephone}
                            </div>
                          )}
                          {otherContactsCount > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              + {otherContactsCount} autre{otherContactsCount > 1 ? 's' : ''} contact{otherContactsCount > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
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
                        
                        {/* Devis récents */}
                        {client.devis && client.devis.length > 0 && (
                          <div className="pt-3 border-t">
                            <div className="text-xs font-medium text-muted-foreground mb-2">
                              Devis récents ({client.devis.length})
                            </div>
                            <div className="space-y-1">
                              {client.devis.slice(0, 3).map((devis: any) => (
                                <Link
                                  key={devis.id}
                                  href={`/devis-db/${devis.id}`}
                                  className="flex items-center justify-between text-xs p-2 rounded hover:bg-muted transition-colors"
                                >
                                  <span className="truncate">{devis.titre}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">
                                      {devis.montant.toLocaleString()} €
                                    </span>
                                    {devis.statut === 'gagne' && (
                                      <Badge className="text-xs bg-green-100 text-green-800">G</Badge>
                                    )}
                                    {devis.statut === 'en_cours' && (
                                      <Badge className="text-xs bg-blue-100 text-blue-800">E</Badge>
                                    )}
                                    {devis.statut === 'perdu' && (
                                      <Badge className="text-xs bg-red-100 text-red-800">P</Badge>
                                    )}
                                  </div>
                                </Link>
                              ))}
                              {client.devis.length > 3 && (
                                <div className="text-xs text-muted-foreground text-center">
                                  +{client.devis.length - 3} autre(s) devis...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/clients-db/${client.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/clients-db/${client.id}/edit`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/devis-db/new?clientId=${client.id}`}>
                          <FileText className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowDeleteDialog(client.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Confirmation de suppression */}
      {showDeleteDialog && (
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
                  onClick={() => deleteClient(showDeleteDialog)}
                  className="flex-1"
                >
                  Supprimer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(null)}
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
