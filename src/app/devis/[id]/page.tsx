"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, FileText, Calendar, DollarSign, Building, User, Mail, Phone, Copy } from "lucide-react"

interface Devis {
  id: string
  titre: string
  montant: number
  statut: string
  dateEcheance: string
  dateCreation: string
  description?: string
  client: {
    id: string
    nom: string
    entreprise: string
  }
}

const defaultDevis: Devis = {
  id: "1",
  titre: "Développement Site E-commerce",
  montant: 15000,
  statut: "en_cours",
  dateEcheance: "2024-04-15",
  dateCreation: "2024-03-01",
  description: "Développement complet d'un site e-commerce avec panier, paiement et gestion des stocks. Inclut l'intégration avec les passerelles de paiement, la gestion des comptes utilisateurs, et un tableau de bord administratif.",
  client: {
    id: "1",
    nom: "Jean Dupont",
    entreprise: "Tech Solutions"
  }
}

export default function DevisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const devisId = params.id as string
  
  const [devis, setDevis] = useState<Devis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDevis()
  }, [devisId])

  const loadDevis = () => {
    try {
      const savedDevis = JSON.parse(localStorage.getItem('devis') || '[]')
      const foundDevis = savedDevis.find((d: any) => d.id === devisId)
      
      if (foundDevis) {
        setDevis(foundDevis)
      } else {
        // Devis par défaut pour démonstration
        setDevis(defaultDevis)
      }
    } catch (error) {
      console.error("Erreur lors du chargement du devis:", error)
      setDevis(defaultDevis)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/devis/${devisId}/edit`)
  }

  const handleDelete = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.")) {
      try {
        const savedDevis = JSON.parse(localStorage.getItem('devis') || '[]')
        const updatedDevis = savedDevis.filter((d: any) => d.id !== devisId)
        localStorage.setItem('devis', JSON.stringify(updatedDevis))
        
        window.dispatchEvent(new CustomEvent('devisDeleted'))
        
        alert("Devis supprimé avec succès !")
        router.push('/devis')
      } catch (error) {
        console.error("Erreur lors de la suppression du devis:", error)
        alert("Erreur lors de la suppression du devis")
      }
    }
  }

  const getStatutBadge = (statut: string) => {
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

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'gagne':
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      case 'perdu':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      case 'en_cours':
        return <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
      default:
        return <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Vous pourriez ajouter un toast ici
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!devis) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Devis non trouvé</h1>
          <Button asChild>
            <Link href="/devis">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/devis">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{devis.titre}</h1>
            <p className="text-muted-foreground">
              Détails du devis #{devis.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Informations principales */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations du devis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{devis.titre}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatutIcon(devis.statut)}
                    {getStatutBadge(devis.statut)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {devis.montant.toLocaleString()} €
                  </p>
                  <p className="text-sm text-muted-foreground">Montant total</p>
                </div>
              </div>

              {devis.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {devis.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date de création</p>
                    <p className="font-medium">{new Date(devis.dateCreation).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'échéance</p>
                    <p className="font-medium">{new Date(devis.dateEcheance).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => copyToClipboard(devis.titre)}>
                <Copy className="mr-2 h-4 w-4" />
                Copier le titre
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => copyToClipboard(`${devis.montant.toLocaleString()} €`)}>
                <Copy className="mr-2 h-4 w-4" />
                Copier le montant
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => copyToClipboard(devis.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Copier le numéro de devis
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Informations client */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">{devis.client.entreprise}</h4>
                <p className="text-muted-foreground">{devis.client.nom}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{devis.client.entreprise}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{devis.client.nom}</span>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/clients/${devis.client.id}`}>
                  Voir la fiche client
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Statut */}
          <Card>
            <CardHeader>
              <CardTitle>Statut du devis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {getStatutIcon(devis.statut)}
                  <div>
                    <p className="font-medium capitalize">
                      {devis.statut.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {devis.statut === 'en_cours' && 'En cours de négociation'}
                      {devis.statut === 'gagne' && 'Devis accepté'}
                      {devis.statut === 'perdu' && 'Devis refusé'}
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Jours restants: {Math.ceil((new Date(devis.dateEcheance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
