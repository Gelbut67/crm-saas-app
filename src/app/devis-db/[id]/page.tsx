"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, User, Building2, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

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
    email?: string
    telephone?: string
    entreprise?: string
    caTotal?: number
  }
}

export default function DevisDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [devis, setDevis] = useState<Devis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDevis = async () => {
      try {
        const response = await fetch(`/api/devis/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setDevis(data)
        }
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchDevis()
    }
  }, [params.id])

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!devis) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Devis non trouvé</h1>
          <Button asChild>
            <Link href="/devis-db">
              Retour aux devis
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-in">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/devis-db">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux devis
          </Link>
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{devis.titre}</h1>
            <div className="flex items-center gap-2">
              {getStatutBadge(devis.statut)}
              <span className="text-muted-foreground">
                Créé le {format(new Date(devis.dateCreation), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
          
          <Button asChild>
            <Link href={`/devis-db/${devis.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Détails du devis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Montant</label>
                <div className="text-2xl font-bold text-green-600">
                  {devis.montant.toLocaleString()} €
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date d'échéance</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(devis.dateEcheance), 'dd MMMM yyyy', { locale: fr })}
                </div>
              </div>
              
              {devis.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1">{devis.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <Link 
                href={`/clients-db/${devis.client.id}`}
                className="hover:text-primary"
              >
                <h3 className="font-semibold text-lg mb-2">{devis.client.nom}</h3>
              </Link>
              
              {devis.client.entreprise && (
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Building2 className="w-4 h-4" />
                  {devis.client.entreprise}
                </div>
              )}
              
              <div className="space-y-2 text-sm">
                {devis.client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${devis.client.email}`} className="hover:underline">
                      {devis.client.email}
                    </a>
                  </div>
                )}
                
                {devis.client.telephone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${devis.client.telephone}`} className="hover:underline">
                      {devis.client.telephone}
                    </a>
                  </div>
                )}
                
                {devis.client.caTotal !== undefined && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CA total</span>
                      <span className="font-semibold">
                        {devis.client.caTotal.toLocaleString()} €
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
