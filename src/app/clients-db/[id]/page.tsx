"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, Building2, Calendar, Plus, FileText, MessageSquare } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

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
  interactions: Array<{
    id: string
    type: string
    contenu: string
    date: string
  }>
  devis: Array<{
    id: string
    titre: string
    montant: number
    statut: string
    dateEcheance: string
    dateCreation: string
  }>
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClient()
  }, [params.id])

  const loadClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
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

  if (!client) {
    return (
      <div className="p-6">
        <p>Client non trouvé</p>
      </div>
    )
  }

  return (
    <div className="p-6 animate-in">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{client.nom}</h1>
            {client.entreprise && (
              <p className="text-muted-foreground text-lg">{client.entreprise}</p>
            )}
          </div>
          <Badge variant={client.statut === 'client' ? 'default' : 'secondary'}>
            {client.statut === 'client' ? 'Client' : 'Prospect'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.telephone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span>{client.telephone}</span>
                </div>
              )}
              {client.secteur && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <span>{client.secteur}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span>Client depuis {format(new Date(client.dateCreation), 'dd MMMM yyyy', { locale: fr })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Devis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Devis</CardTitle>
                <CardDescription>{client.devis.length} devis</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/devis/new?clientId=${client.id}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau devis
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {client.devis.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucun devis</p>
              ) : (
                <div className="space-y-3">
                  {client.devis.map((devi) => (
                    <div key={devi.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{devi.titre}</p>
                        <p className="text-sm text-muted-foreground">
                          Échéance : {format(new Date(devi.dateEcheance), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{devi.montant.toLocaleString()} €</p>
                        <Badge variant={
                          devi.statut === 'gagne' ? 'default' :
                          devi.statut === 'perdu' ? 'destructive' : 'secondary'
                        }>
                          {devi.statut}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne de droite */}
        <div className="space-y-6">
          {/* CA */}
          <Card>
            <CardHeader>
              <CardTitle>Chiffre d'affaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {client.caTotal.toLocaleString()} €
              </div>
            </CardContent>
          </Card>

          {/* Interactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Interactions</CardTitle>
                <CardDescription>{client.interactions.length} interactions</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {client.interactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucune interaction</p>
              ) : (
                <div className="space-y-3">
                  {client.interactions.map((interaction) => (
                    <div key={interaction.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {interaction.type === 'email' && <Mail className="w-4 h-4" />}
                        {interaction.type === 'appel' && <Phone className="w-4 h-4" />}
                        {interaction.type === 'rdv' && <Calendar className="w-4 h-4" />}
                        {interaction.type === 'note' && <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{interaction.contenu}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(interaction.date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
