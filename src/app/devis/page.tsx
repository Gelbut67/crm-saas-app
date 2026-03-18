"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Edit, Trash2, Eye, FileText, Calendar, TrendingUp, TrendingDown, Minus, UserPlus, MoreHorizontal, Download } from "lucide-react"
import { NotificationCenter, useDevisReminders } from "@/components/ui/notifications"
import { ImportButton } from "@/components/import-button"

const devis = [
  {
    id: "1",
    titre: "Développement Site E-commerce",
    montant: 15000,
    statut: "gagne",
    dateEcheance: "2024-04-15",
    dateCreation: "2024-03-01",
    client: {
      id: "1",
      nom: "Jean Dupont",
      entreprise: "Tech Solutions"
    }
  },
  {
    id: "2",
    titre: "Application Mobile iOS",
    montant: 8000,
    statut: "en_cours",
    dateEcheance: "2024-04-20",
    dateCreation: "2024-03-10",
    client: {
      id: "2",
      nom: "Marie Martin",
      entreprise: "Services Plus"
    }
  },
  {
    id: "3",
    titre: "Maintenance Annuelle",
    montant: 3000,
    statut: "perdu",
    dateEcheance: "2024-03-25",
    dateCreation: "2024-02-28",
    client: {
      id: "3",
      nom: "Pierre Bernard",
      entreprise: "Commerce International"
    }
  },
  {
    id: "4",
    titre: "Refonte Design UI/UX",
    montant: 12000,
    statut: "en_cours",
    dateEcheance: "2024-05-01",
    dateCreation: "2024-03-12",
    client: {
      id: "1",
      nom: "Jean Dupont",
      entreprise: "Tech Solutions"
    }
  },
  {
    id: "5",
    titre: "Intégration API",
    montant: 5500,
    statut: "gagne",
    dateEcheance: "2024-04-10",
    dateCreation: "2024-03-05",
    client: {
      id: "4",
      nom: "Sophie Petit",
      entreprise: "Digital Agency"
    }
  },
  {
    id: "6",
    titre: "Développement Web Portal",
    montant: 20000,
    statut: "en_cours",
    dateEcheance: "2024-04-25",
    dateCreation: "2024-03-15",
    client: {
      id: "5",
      nom: "Thomas Dubois",
      entreprise: "Industrie Corp"
    }
  }
]

function getBadgeVariant(statut: string) {
  switch (statut) {
    case 'gagne':
      return <Badge className="bg-green-100 text-green-800">Gagné</Badge>
    case 'facture':
      return <Badge className="bg-purple-100 text-purple-800">Facturé</Badge>
    case 'perdu':
      return <Badge className="bg-red-100 text-red-800">Perdu</Badge>
    case 'en_cours':
      return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
    default:
      return <Badge variant="outline">{statut}</Badge>
  }
}

function getStatutIcon(statut: string) {
  switch (statut) {
    case 'gagne':
      return <TrendingUp className="h-4 w-4 text-green-600" />
    case 'facture':
      return <FileText className="h-4 w-4 text-purple-600" />
    case 'perdu':
      return <TrendingDown className="h-4 w-4 text-red-600" />
    case 'en_cours':
      return <Minus className="h-4 w-4 text-blue-600" />
    default:
      return <Minus className="h-4 w-4" />
  }
}

export default function DevisPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statutFilter, setStatutFilter] = useState("all")
  const [devisList, setDevisList] = useState(devis)
  const { reminders, generateReminders } = useDevisReminders()

  useEffect(() => {
    // Charger les devis depuis localStorage
    loadDevis()
    
    // Écouter les mises à jour de devis
    const handleDevisUpdated = () => {
      loadDevis()
    }
    
    window.addEventListener('devisUpdated', handleDevisUpdated)
    window.addEventListener('devisAdded', handleDevisUpdated)
    
    // Ajouter un polling pour détecter les changements
    const interval = setInterval(() => {
      loadDevis()
    }, 2000) // Toutes les 2 secondes
    
    return () => {
      window.removeEventListener('devisUpdated', handleDevisUpdated)
      window.removeEventListener('devisAdded', handleDevisUpdated)
      clearInterval(interval)
    }
  }, [])

  const loadDevis = () => {
    try {
      const savedDevis = localStorage.getItem('devis')
      if (savedDevis) {
        const parsedDevis = JSON.parse(savedDevis)
        setDevisList(parsedDevis)
      } else {
        // Utiliser les devis par défaut seulement si rien n'est sauvegardé
        setDevisList(devis)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des devis:", error)
      setDevisList(devis)
    }
  }

  const getStatuts = () => [
    { value: 'all', label: 'Tous les devis', count: devisList.length },
    { value: 'en_cours', label: 'En cours', count: devisList.filter(d => d.statut === 'en_cours').length },
    { value: 'gagne', label: 'Gagnés', count: devisList.filter(d => d.statut === 'gagne').length },
    { value: 'facture', label: 'Facturés', count: devisList.filter(d => d.statut === 'facture').length },
    { value: 'perdu', label: 'Perdus', count: devisList.filter(d => d.statut === 'perdu').length }
  ]

  useEffect(() => {
    // Générer des rappels automatiquement
    generateReminders(devisList)
  }, [devisList])

  const filteredDevis = devisList.filter(devis => {
    const matchesSearch = 
      devis.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (devis.client.entreprise && devis.client.entreprise.toLowerCase().includes(searchTerm.toLowerCase())) ||
      devis.client.nom.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatut = statutFilter === 'all' || devis.statut === statutFilter
    
    return matchesSearch && matchesStatut
  })

  const totalEnCours = devisList
    .filter(d => d.statut === 'en_cours')
    .reduce((sum, d) => sum + d.montant, 0)

  const totalGagnes = devisList
    .filter(d => d.statut === 'gagne')
    .reduce((sum, d) => sum + d.montant, 0)

  const tauxConversion = devisList.length > 0 
    ? Math.round((devisList.filter(d => d.statut === 'gagne').length / devisList.length) * 100)
    : 0

  const stats = getStatuts()

  const handleCreateQuote = () => {
    // Logique pour créer un devis
    // Si le client est un prospect, le convertir automatiquement
    alert("Fonctionnalité de création de devis avec conversion automatique des prospects")
  }

  const handleStatusChange = async (devisId: string, newStatus: string) => {
    try {
      // Logique pour mettre à jour le statut du devis
      console.log(`Mise à jour du devis ${devisId} vers le statut: ${newStatus}`)
      
      // Mettre à jour dans localStorage
      const savedDevis = JSON.parse(localStorage.getItem('devis') || '[]')
      const updatedDevis = savedDevis.map((d: any) => 
        d.id === devisId ? { ...d, statut: newStatus } : d
      )
      localStorage.setItem('devis', JSON.stringify(updatedDevis))
      
      // Récupérer le devis modifié pour trouver son client
      const modifiedDevis = updatedDevis.find((d: any) => d.id === devisId)
      
      if (modifiedDevis && modifiedDevis.client) {
        // Mettre à jour le CA de tous les clients concernés
        const savedClients = JSON.parse(localStorage.getItem('clients') || '[]')
        const updatedClients = savedClients.map((client: any) => {
          // Calculer le nouveau CA pour chaque client
          const clientDevis = updatedDevis.filter((d: any) => {
            // Vérifier si le devis appartient à ce client
            return d.client?.id === client.id || 
                   (d.client?.nom === client.nom || 
                    d.client?.entreprise === client.entreprise)
          })
          
          const newCaTotal = clientDevis
            .filter((d: any) => d.statut === 'gagne')
            .reduce((sum: number, d: any) => sum + (d.montant || 0), 0)
          
          // Si c'est le client du devis modifié, loguer le changement
          if (client.id === modifiedDevis.client?.id || 
              (client.nom === modifiedDevis.client?.nom || 
               client.entreprise === modifiedDevis.client?.entreprise)) {
            console.log(`CA mis à jour pour ${client.nom}: ${client.caTotal} → ${newCaTotal}`)
          }
          
          return { ...client, caTotal: newCaTotal }
        })
        
        localStorage.setItem('clients', JSON.stringify(updatedClients))
        console.log('Tous les CA des clients ont été mis à jour')
      }
      
      // Mettre à jour l'état local pour un retour immédiat
      setDevisList(updatedDevis)
      
      // Déclencher un événement pour notifier les autres pages
      window.dispatchEvent(new CustomEvent('devisUpdated', { 
        detail: { devisId, newStatus } 
      }))
      
      // Déclencher aussi un événement pour les clients
      window.dispatchEvent(new CustomEvent('clientUpdated', { 
        detail: { clientId: modifiedDevis?.client?.id } 
      }))
      
      // Pour la démo, on va juste afficher une confirmation
      const statusLabels = {
        "en_cours": "En cours",
        "gagne": "Gagné", 
        "perdu": "Perdu"
      }
      
      console.log(`Statut du devis mis à jour : ${statusLabels[newStatus as keyof typeof statusLabels]}`)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error)
      alert("Une erreur est survenue lors de la mise à jour du statut")
    }
  }

  const handleDeleteDevis = async (devisId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.")) {
      try {
        // Supprimer du localStorage s'il existe
        const savedDevis = JSON.parse(localStorage.getItem('devis') || '[]')
        const updatedDevis = savedDevis.filter((d: any) => d.id !== devisId)
        localStorage.setItem('devis', JSON.stringify(updatedDevis))
        
        // Mettre à jour l'état local
        setDevisList(prev => prev.filter(d => d.id !== devisId))
        
        // Déclencher l'événement pour recharger
        window.dispatchEvent(new CustomEvent('devisDeleted'))
        
        alert("Devis supprimé avec succès !")
      } catch (error) {
        console.error("Erreur lors de la suppression du devis:", error)
        alert("Erreur lors de la suppression du devis")
      }
    }
  }

  const handleEditDevis = (devisId: string) => {
    // Rediriger vers la page d'édition
    window.location.href = `/devis/${devisId}/edit`
  }

  const exportDevisToCSV = (devisToExport: any[], filename: string) => {
    const headers = ['ID', 'Titre', 'Montant', 'Statut', 'Client', 'Entreprise', 'Date Création', 'Date Échéance']
    const csvContent = [
      headers.join(','),
      ...devisToExport.map(devis => [
        devis.id,
        `"${devis.titre}"`,
        devis.montant,
        devis.statut,
        `"${devis.client.nom}"`,
        `"${devis.client.entreprise}"`,
        new Date(devis.dateCreation).toLocaleDateString('fr-FR'),
        new Date(devis.dateEcheance).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportDevisToExcel = (devisToExport: any[], filename: string) => {
    const headers = ['ID', 'Titre', 'Montant', 'Statut', 'Client', 'Entreprise', 'Date Création', 'Date Échéance']
    
    let htmlContent = `
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .number { text-align: right; }
          .status-gagne { background-color: #d4edda; }
          .status-perdu { background-color: #f8d7da; }
          .status-en_cours { background-color: #d1ecf1; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${devisToExport.map(devis => `
              <tr>
                <td>${devis.id}</td>
                <td>${devis.titre}</td>
                <td class="number">${devis.montant.toLocaleString()} €</td>
                <td class="status-${devis.statut}">${devis.statut}</td>
                <td>${devis.client.nom}</td>
                <td>${devis.client.entreprise}</td>
                <td>${new Date(devis.dateCreation).toLocaleDateString('fr-FR')}</td>
                <td>${new Date(devis.dateEcheance).toLocaleDateString('fr-FR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportDevisByStatus = (status: string, format: 'csv' | 'excel') => {
    const filteredDevis = devisList.filter(devis => status === 'all' ? true : devis.statut === status)
    const statusName = status === 'all' ? 'tous_les_devis' : 
                      status === 'en_cours' ? 'devis_en_cours' :
                      status === 'gagne' ? 'devis_gagnes' : 'devis_perdus'
    
    if (format === 'csv') {
      exportDevisToCSV(filteredDevis, statusName)
    } else {
      exportDevisToExcel(filteredDevis, statusName)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devis</h1>
          <p className="text-muted-foreground">
            Gérez votre pipeline commercial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportButton type="devis" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exporter
                <MoreHorizontal className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportDevisByStatus('all', 'csv')}>
                <Download className="mr-2 h-4 w-4" />
                Exporter tous les devis (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportDevisByStatus('all', 'excel')}>
                <Download className="mr-2 h-4 w-4" />
                Exporter tous les devis (Excel)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportDevisByStatus('en_cours', 'csv')}>
                <FileText className="mr-2 h-4 w-4" />
                Devis en cours (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportDevisByStatus('en_cours', 'excel')}>
                <FileText className="mr-2 h-4 w-4" />
                Devis en cours (Excel)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportDevisByStatus('gagne', 'csv')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Devis gagnés (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportDevisByStatus('gagne', 'excel')}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Devis gagnés (Excel)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportDevisByStatus('perdu', 'csv')}>
                <TrendingDown className="mr-2 h-4 w-4" />
                Devis perdus (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportDevisByStatus('perdu', 'excel')}>
                <TrendingDown className="mr-2 h-4 w-4" />
                Devis perdus (Excel)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <NotificationCenter />
          <Button onClick={handleCreateQuote}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau devis
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnCours.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground">
              {stats.find(s => s.value === 'en_cours')?.count} devis en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis gagnés</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGagnes.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground">
              {stats.find(s => s.value === 'gagne')?.count} devis gagnés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tauxConversion}%</div>
            <p className="text-xs text-muted-foreground">
              {tauxConversion >= 50 ? 'Bon taux' : 'À améliorer'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total devis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devisList.length}</div>
            <p className="text-xs text-muted-foreground">
              Tous statuts confondus
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des devis</CardTitle>
          <CardDescription>
            {filteredDevis.length} devis trouvé{filteredDevis.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un devis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {stats.map((stat) => (
                <Button
                  key={stat.value}
                  variant={statutFilter === stat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatutFilter(stat.value)}
                  className="text-xs"
                >
                  {stat.label} ({stat.count})
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredDevis.map((devis) => (
              <div
                key={devis.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatutIcon(devis.statut)}
                    <h3 className="font-semibold">{devis.titre}</h3>
                    <Select value={devis.statut} onValueChange={(value) => handleStatusChange(devis.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_cours">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            En cours
                          </div>
                        </SelectItem>
                        <SelectItem value="gagne">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            Gagné
                          </div>
                        </SelectItem>
                        <SelectItem value="facture">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-500" />
                            Facturé
                          </div>
                        </SelectItem>
                        <SelectItem value="perdu">
                          <div className="flex items-center gap-2">
                            <Minus className="h-4 w-4 text-red-500" />
                            Perdu
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {devis.client.entreprise && (
                      <span>{devis.client.entreprise}</span>
                    )}
                    <span>• {devis.client.nom}</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Échéance {new Date(devis.dateEcheance).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-4">
                    <p className="font-semibold">{devis.montant.toLocaleString()} €</p>
                    <p className="text-xs text-muted-foreground">
                      Créé le {new Date(devis.dateCreation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/devis/${devis.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditDevis(devis.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteDevis(devis.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDevis.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || statutFilter !== 'all' 
                  ? "Aucun devis trouvé pour cette recherche." 
                  : "Aucun devis pour le moment."}
              </p>
              {!searchTerm && statutFilter === 'all' && (
                <Button className="mt-4" asChild>
                  <Link href="/devis/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer votre premier devis
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
