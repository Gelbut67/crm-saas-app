"use client"

import { useState } from "react"
import { useProspects } from "@/hooks/useDatabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Building2, Phone, Mail, UserCheck, Search, Edit, Trash2, Eye, Download, Upload, TrendingUp } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function ProspectsPage() {
  const { prospects, loading, createProspect, reload } = useProspects()
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [prospectToDelete, setProspectToDelete] = useState<string | null>(null)

  // Filtrer les prospects
  const filteredProspects = prospects.filter(prospect => {
    const searchLower = searchTerm.toLowerCase()
    return (
      prospect.nom.toLowerCase().includes(searchLower) ||
      (prospect.entreprise && prospect.entreprise.toLowerCase().includes(searchLower)) ||
      (prospect.email && prospect.email.toLowerCase().includes(searchLower)) ||
      (prospect.secteur && prospect.secteur.toLowerCase().includes(searchLower))
    )
  })

  // Calculer les statistiques
  const stats = {
    total: prospects.length,
    ceMois: prospects.filter(p => {
      const creationDate = new Date(p.dateCreation)
      const now = new Date()
      return creationDate.getMonth() === now.getMonth() && creationDate.getFullYear() === now.getFullYear()
    }).length,
    tauxConversion: 0, // TODO: calculer depuis les clients convertis
    secteurPrincipal: prospects.length > 0 
      ? prospects.reduce((acc, p) => {
          const secteur = p.secteur || 'Non défini'
          acc[secteur] = (acc[secteur] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      : {} as Record<string, number>
  }

  // Export CSV
  const exportCSV = () => {
    const headers = ['Nom', 'Email', 'Téléphone', 'Entreprise', 'Secteur', 'Date création']
    const csvContent = [
      headers.join(','),
      ...prospects.map(p => [
        p.nom,
        p.email || '',
        p.telephone || '',
        p.entreprise || '',
        p.secteur || '',
        new Date(p.dateCreation).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `prospects_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Excel
  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(prospects.map(p => ({
      Nom: p.nom,
      Email: p.email || '',
      Téléphone: p.telephone || '',
      Entreprise: p.entreprise || '',
      Secteur: p.secteur || '',
      'Date création': new Date(p.dateCreation).toLocaleDateString('fr-FR')
    })))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospects')
    XLSX.writeFile(workbook, `prospects_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Supprimer un prospect
  const deleteProspect = async (prospectId: string) => {
    try {
      const response = await fetch(`/api/prospects/${prospectId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await reload()
        setProspectToDelete(null)
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
            <h1 className="text-3xl font-bold">Prospects</h1>
            <p className="text-muted-foreground">
              {prospects.length} prospect{prospects.length > 1 ? 's' : ''} en suivi
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau prospect
          </Button>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total prospects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.ceMois} ce mois
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux ce mois</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ceMois}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.ceMois / stats.total) * 100) : 0}% du total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tauxConversion}%</div>
              <p className="text-xs text-muted-foreground">
                En clients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Secteur principal</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.secteurPrincipal).length > 0 
                  ? (Object.entries(stats.secteurPrincipal) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0]
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {Object.keys(stats.secteurPrincipal).length > 0 
                  ? (Object.entries(stats.secteurPrincipal) as [string, number][]).sort((a, b) => b[1] - a[1])[0][1]
                  : 0} prospects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un prospect..."
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

      {/* Liste des prospects */}
      {filteredProspects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Aucun prospect trouvé' : 'Aucun prospect'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'Essayez une autre recherche' : 'Commencez par ajouter votre premier prospect'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un prospect
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProspects.map((prospect) => (
            <Card key={prospect.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{prospect.nom}</h3>
                      {prospect.entreprise && (
                        <Badge variant="secondary">{prospect.entreprise}</Badge>
                      )}
                      {prospect.secteur && (
                        <Badge variant="outline">{prospect.secteur}</Badge>
                      )}
                      <Badge variant="outline">Prospect</Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {prospect.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {prospect.email}
                        </div>
                      )}
                      {prospect.telephone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {prospect.telephone}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Prospect depuis {format(new Date(prospect.dateCreation), 'dd MMM yyyy', { locale: fr })}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/prospects/${prospect.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/prospects/${prospect.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setProspectToDelete(prospect.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nouveau prospect</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const prospectData = {
                  nom: formData.get('nom') as string,
                  email: formData.get('email') as string,
                  telephone: formData.get('telephone') as string,
                  entreprise: formData.get('entreprise') as string,
                  secteur: formData.get('secteur') as string,
                }
                
                if (await createProspect(prospectData)) {
                  setShowForm(false)
                }
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom *</label>
                  <input name="nom" required className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input name="email" type="email" className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium">Téléphone</label>
                  <input name="telephone" className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium">Entreprise</label>
                  <input name="entreprise" className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="text-sm font-medium">Secteur</label>
                  <input name="secteur" className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Créer</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation de suppression */}
      {prospectToDelete && (
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
                  onClick={() => deleteProspect(prospectToDelete)}
                  className="flex-1"
                >
                  Supprimer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setProspectToDelete(null)}
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
