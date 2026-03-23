"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail, Building, Users, TrendingUp, UserPlus, User } from "lucide-react"
import { useProspects, useClients } from "@/hooks/useDatabase"
import { useProspectFilters } from "@/hooks/useProspectFilters"
import { AdvancedFilters } from "@/components/advanced-filters"
import { ExportButton } from "@/components/export-button"
import { ImportButton } from "@/components/import-button"
import { useEffect, useState as useReactState } from "react"

export default function ProspectsDBPage() {
  const { prospects, loading, reload } = useProspects()
  const { clients } = useClients()
  const { filters, setFilters, filteredAndSortedProspects, filteredCount, totalCount, resetFilters } = useProspectFilters(prospects)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [convertingProspect, setConvertingProspect] = useState<string | null>(null)
  const [totalConverted, setTotalConverted] = useReactState(0)

  // Récupérer le nombre total de prospects convertis (tous les clients)
  useEffect(() => {
    const fetchConvertedCount = async () => {
      try {
        const response = await fetch('/api/clients')
        if (response.ok) {
          const data = await response.json()
          setTotalConverted(data.length)
        }
      } catch (error) {
        console.error('Erreur:', error)
      }
    }
    fetchConvertedCount()
  }, [prospects, clients])

  // Calculer les statistiques
  const totalProspectsAndConverted = prospects.length + totalConverted
  const conversionRate = totalProspectsAndConverted > 0 
    ? ((totalConverted / totalProspectsAndConverted) * 100).toFixed(1)
    : "0"

  const stats = {
    totalProspects: prospects.length,
    thisMonth: prospects.filter(p => {
      const createdDate = new Date(p.dateCreation)
      const now = new Date()
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
    }).length,
    conversionRate: conversionRate,
  }

  // Supprimer un prospect
  const deleteProspect = async (prospectId: string) => {
    try {
      const response = await fetch(`/api/prospects/${prospectId}`, {
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

  // Convertir un prospect en client
  const convertToClient = async (prospectId: string) => {
    setConvertingProspect(prospectId)
    try {
      const response = await fetch(`/api/prospects/${prospectId}/convert`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await reload()
        alert('Prospect converti en client avec succès !')
      } else {
        alert('Erreur lors de la conversion')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la conversion')
    } finally {
      setConvertingProspect(null)
    }
  }

  // Préparer les données pour l'export
  const exportData = filteredAndSortedProspects.map(prospect => ({
    id: prospect.id,
    nomEntreprise: prospect.entreprise || prospect.nom,
    secteur: prospect.secteur || '',
    caTotal: 0,
    dateCreation: new Date(prospect.dateCreation).toLocaleDateString('fr-FR'),
    contacts: prospect.contacts?.map((c: any) => c.nom).join(', ') || '',
    nbDevis: 0
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
            <h1 className="text-3xl font-bold">Prospects</h1>
            <p className="text-muted-foreground">
              Gérez vos prospects et convertissez-les en clients
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton type="clients" data={exportData} />
            <ImportButton type="clients" />
            <Button asChild>
              <Link href="/prospects-db/new">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau prospect
              </Link>
            </Button>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total prospects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProspects}</div>
              <p className="text-xs text-muted-foreground">
                Prospects actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Nouveaux prospects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totalConverted} convertis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres avancés */}
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
          totalCount={prospects.length}
          filteredCount={filteredCount}
        />
      </div>

      {/* Liste des prospects */}
      {filteredAndSortedProspects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {filters.search || filters.secteur || filters.entreprise || filters.departement || filters.caMin || filters.caMax ? 'Aucun prospect trouvé' : 'Aucun prospect'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {filters.search || filters.secteur || filters.entreprise || filters.departement || filters.caMin || filters.caMax ? 'Essayez de modifier vos filtres' : 'Commencez par ajouter votre premier prospect'}
            </p>
            {!filters.search && !filters.secteur && !filters.entreprise && !filters.departement && !filters.caMin && !filters.caMax && (
              <Button asChild>
                <Link href="/prospects-db/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un prospect
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAndSortedProspects.map((prospect) => {
            const principalContact = prospect.contacts?.find((c: any) => c.isPrincipal) || prospect.contacts?.[0]
            const otherContactsCount = (prospect.contacts?.length || 0) - 1
            
            return (
              <Card key={prospect.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{prospect.entreprise || prospect.nom}</h3>
                        <Badge variant="secondary">Prospect</Badge>
                        {prospect.secteur && (
                          <Badge variant="outline">{prospect.secteur}</Badge>
                        )}
                      </div>
                      
                      {/* Adresse */}
                      {(prospect.ville || prospect.departement) && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {prospect.ville && <span>{prospect.ville}</span>}
                          {prospect.ville && prospect.departement && <span> • </span>}
                          {prospect.departement && <span>Dép. {prospect.departement}</span>}
                        </div>
                      )}
                      
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

                      <div className="mt-4">
                        <div className="text-xs text-muted-foreground">
                          Prospect depuis {new Date(prospect.dateCreation).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => convertToClient(prospect.id)}
                        disabled={convertingProspect === prospect.id}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {convertingProspect === prospect.id ? 'Conversion...' : 'Convertir'}
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/prospects-db/${prospect.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/prospects-db/${prospect.id}/edit`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowDeleteDialog(prospect.id)}
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
              <CardTitle>Supprimer le prospect ?</CardTitle>
              <CardDescription>
                Cette action est irréversible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => deleteProspect(showDeleteDialog)}
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
