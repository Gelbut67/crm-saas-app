"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, FileText, Calendar, DollarSign, User, Building2, Eye, Edit, MoreHorizontal, TrendingUp, CheckCircle, XCircle, Users } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useDevis, useClients } from "@/hooks/useDatabase"
import { useDevisFiltersDB } from "@/hooks/useDevisFiltersDB"
import { ExportButton } from "@/components/export-button"
import { ImportButton } from "@/components/import-button"

export default function DevisDBPage() {
  const { devis, loading, reload } = useDevis()
  const { clients, reload: reloadClients } = useClients()
  const { filters, setFilters, filteredDevis, resetFilters } = useDevisFiltersDB(devis)

  // Fonction pour changer le statut d'un devis
  const changerStatut = async (devisId: string, nouveauStatut: string) => {
    try {
      const response = await fetch(`/api/devis/${devisId}/statut`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statut: nouveauStatut }),
      })
      
      if (response.ok) {
        await reload()
        await reloadClients()
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'gagne':
        return <Badge className="bg-green-100 text-green-800">Gagné</Badge>
      case 'perdu':
        return <Badge variant="destructive">Perdu</Badge>
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
      case 'facture':
        return <Badge className="bg-purple-100 text-purple-800">Facturé</Badge>
      default:
        return <Badge variant="secondary">{statut}</Badge>
    }
  }

  // Calculer les statistiques
  const stats = {
    total: devis.length,
    enCours: devis.filter(d => d.statut === 'en_cours').length,
    gagnes: devis.filter(d => d.statut === 'gagne' || d.statut === 'facture').length,
    perdus: devis.filter(d => d.statut === 'perdu').length,
    montantTotal: devis.filter(d => d.statut === 'gagne' || d.statut === 'facture').reduce((sum, d) => sum + d.montant, 0),
    montantEnCours: devis.filter(d => d.statut === 'en_cours').reduce((sum, d) => sum + d.montant, 0),
  }

  // Préparer les données pour l'export
  const exportData: any = filteredDevis.map(devi => ({
    id: devi.id,
    titre: devi.titre,
    client: devi.client?.nom || devi.client?.entreprise || '',
    montant: devi.montant,
    statut: devi.statut,
    dateCreation: new Date(devi.dateCreation).toLocaleDateString('fr-FR'),
    dateEcheance: new Date(devi.dateEcheance).toLocaleDateString('fr-FR'),
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
            <h1 className="text-3xl font-bold">Devis</h1>
            <p className="text-muted-foreground">
              Gérez vos devis et suivez leur statut
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton type="devis" data={exportData} />
            <ImportButton type="devis" />
            <Button asChild>
              <Link href="/devis-db/new">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau devis
              </Link>
            </Button>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total devis</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Tous les devis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enCours}</div>
              <p className="text-xs text-muted-foreground">
                {stats.montantEnCours.toLocaleString()} € potentiel
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gagnés</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.gagnes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.montantTotal.toLocaleString()} € réalisé
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perdus</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.perdus}</div>
              <p className="text-xs text-muted-foreground">
                Devis non convertis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Filtres</CardTitle>
                <CardDescription>
                  {filteredDevis.length} devis trouvé{filteredDevis.length > 1 ? 's' : ''} sur {devis.length}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Réinitialiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Recherche</label>
                <input
                  type="text"
                  placeholder="Titre, client..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Statut</label>
                <Select
                  value={filters.statut || "tous"}
                  onValueChange={(value) => setFilters({ ...filters, statut: value === "tous" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="gagne">Gagné</SelectItem>
                    <SelectItem value="perdu">Perdu</SelectItem>
                    <SelectItem value="facture">Facturé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Trier par</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client (A-Z)</SelectItem>
                    <SelectItem value="titre">Titre (A-Z)</SelectItem>
                    <SelectItem value="dateCreation">Date création</SelectItem>
                    <SelectItem value="dateEcheance">Date échéance</SelectItem>
                    <SelectItem value="montant">Montant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ordre</label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value: any) => setFilters({ ...filters, sortOrder: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Croissant</SelectItem>
                    <SelectItem value="desc">Décroissant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des devis */}
      {filteredDevis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {filters.search || filters.statut ? 'Aucun devis trouvé' : 'Aucun devis'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {filters.search || filters.statut ? 'Essayez de modifier vos filtres' : 'Commencez par créer votre premier devis'}
            </p>
            {!filters.search && !filters.statut && (
              <Button asChild>
                <Link href="/devis-db/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un devis
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-sm">Titre</th>
                    <th className="text-left p-3 font-medium text-sm">Client</th>
                    <th className="text-left p-3 font-medium text-sm">Échéance</th>
                    <th className="text-right p-3 font-medium text-sm">Montant</th>
                    <th className="text-center p-3 font-medium text-sm">Statut</th>
                    <th className="text-center p-3 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevis.map((devi) => (
                    <tr key={devi.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="font-medium">{devi.titre}</div>
                        {devi.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {devi.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Link 
                          href={`/clients-db/${devi.clientId}`}
                          className="hover:text-primary underline text-sm"
                        >
                          {devi.client.entreprise || devi.client.nom}
                        </Link>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {format(new Date(devi.dateEcheance), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="font-semibold text-green-600">
                          {devi.montant.toLocaleString()} €
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {getStatutBadge(devi.statut)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {devi.statut === 'en_cours' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => changerStatut(devi.id, 'gagne')}
                                className="text-green-600 hover:text-green-700"
                                title="Gagné"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => changerStatut(devi.id, 'facture')}
                                className="text-purple-600 hover:text-purple-700"
                                title="Facturé"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => changerStatut(devi.id, 'perdu')}
                                className="text-red-600 hover:text-red-700"
                                title="Perdu"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/devis-db/${devi.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/devis-db/${devi.id}/edit`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => changerStatut(devi.id, 'en_cours')}>
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Mettre en cours
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changerStatut(devi.id, 'gagne')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marquer comme gagné
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changerStatut(devi.id, 'facture')}>
                                <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                                Marquer comme facturé
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => changerStatut(devi.id, 'perdu')}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Marquer comme perdu
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
