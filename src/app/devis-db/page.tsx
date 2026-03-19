"use client"

import { useState } from "react"
import { useDevis, useClients, useProspects } from "@/hooks/useDatabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, FileText, Calendar, DollarSign, User, Building2, Search, Edit, Trash2, Eye, Download, Upload, Filter, MoreHorizontal, TrendingUp, TrendingDown, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function DevisPage() {
  const { devis, loading, reload } = useDevis()
  const { clients, reload: reloadClients } = useClients()
  const { prospects } = useProspects()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatut, setFilterStatut] = useState<string>("tous")

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

  // Filtrer les devis
  const filteredDevis = devis.filter(devi => {
    const searchLower = searchTerm.toLowerCase()
    const matchSearch = (
      devi.titre.toLowerCase().includes(searchLower) ||
      devi.client.nom.toLowerCase().includes(searchLower) ||
      (devi.client.entreprise && devi.client.entreprise.toLowerCase().includes(searchLower))
    )
    const matchStatut = filterStatut === "tous" || devi.statut === filterStatut
    return matchSearch && matchStatut
  })

  // Calculer les statistiques
  const stats = {
    total: devis.length,
    enCours: devis.filter(d => d.statut === 'en_cours').length,
    gagnes: devis.filter(d => d.statut === 'gagne').length,
    perdus: devis.filter(d => d.statut === 'perdu').length,
    caEnCours: devis.filter(d => d.statut === 'en_cours').reduce((sum, d) => sum + d.montant, 0),
    caGagne: devis.filter(d => d.statut === 'gagne').reduce((sum, d) => sum + d.montant, 0),
    caPerdu: devis.filter(d => d.statut === 'perdu').reduce((sum, d) => sum + d.montant, 0),
  }

  const tauxConversion = devis.length > 0 ? Math.round((stats.gagnes / devis.length) * 100) : 0

  // Export CSV
  const exportCSV = () => {
    const headers = ['Titre', 'Client', 'Montant', 'Statut', 'Date création', 'Date échéance']
    const csvContent = [
      headers.join(','),
      ...filteredDevis.map(d => [
        d.titre,
        `${d.client.nom} ${d.client.entreprise || ''}`.trim(),
        d.montant.toString(),
        d.statut,
        new Date(d.dateCreation).toLocaleDateString('fr-FR'),
        new Date(d.dateEcheance).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `devis_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Excel
  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(filteredDevis.map(d => ({
      Titre: d.titre,
      Client: `${d.client.nom} ${d.client.entreprise || ''}`.trim(),
      Montant: d.montant,
      Statut: d.statut,
      'Date création': new Date(d.dateCreation).toLocaleDateString('fr-FR'),
      'Date échéance': new Date(d.dateEcheance).toLocaleDateString('fr-FR')
    })))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Devis')
    XLSX.writeFile(workbook, `devis_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'gagne':
        return <Badge className="bg-green-100 text-green-800">Gagné</Badge>
      case 'perdu':
        return <Badge variant="destructive">Perdu</Badge>
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
      default:
        return <Badge variant="secondary">{statut}</Badge>
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
            <h1 className="text-3xl font-bold">Devis</h1>
            <p className="text-muted-foreground">
              {devis.length} devis au total
            </p>
          </div>
          <Button asChild>
            <Link href="/devis-db/new">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau devis
            </Link>
          </Button>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total devis</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.enCours} en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA en cours</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.caEnCours.toLocaleString()} €</div>
              <p className="text-xs text-muted-foreground">
                {stats.enCours} devis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CA gagné</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.caGagne.toLocaleString()} €</div>
              <p className="text-xs text-muted-foreground">
                {stats.gagnes} devis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tauxConversion}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.gagnes}/{stats.total}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un devis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={filterStatut} 
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="tous">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="gagne">Gagnés</option>
              <option value="perdu">Perdus</option>
            </select>
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

      {/* Liste des devis */}
      {filteredDevis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || filterStatut !== "tous" ? 'Aucun devis trouvé' : 'Aucun devis'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || filterStatut !== "tous" 
                ? 'Essayez de modifier votre recherche' 
                : 'Commencez par créer votre premier devis'
              }
            </p>
            {!searchTerm && filterStatut === "tous" && (
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
        <div className="grid gap-4">
          {filteredDevis.map((devi) => (
            <Card key={devi.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{devi.titre}</h3>
                      {getStatutBadge(devi.statut)}
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <Link 
                          href={`/clients-db/${devi.clientId}`}
                          className="hover:text-primary underline"
                        >
                          {devi.client.nom}
                        </Link>
                        {devi.client.entreprise && (
                          <>
                            <Building2 className="w-4 h-4 ml-2" />
                            {devi.client.entreprise}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Échéance : {format(new Date(devi.dateEcheance), 'dd MMM yyyy', { locale: fr })}
                      </div>
                      {devi.description && (
                        <p className="text-muted-foreground mt-2">{devi.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-green-600">
                          {devi.montant.toLocaleString()} €
                        </span>
                        {devi.client.caTotal && (
                          <span className="text-sm text-muted-foreground">
                            CA client: {devi.client.caTotal.toLocaleString()} €
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {devi.statut === 'en_cours' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => changerStatut(devi.id, 'gagne')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => changerStatut(devi.id, 'perdu')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/devis-db/${devi.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/devis-db/${devi.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => changerStatut(devi.id, 'en_cours')}>
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Mettre en cours
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changerStatut(devi.id, 'gagne')}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marquer comme gagné
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changerStatut(devi.id, 'perdu')}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Marquer comme perdu
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
