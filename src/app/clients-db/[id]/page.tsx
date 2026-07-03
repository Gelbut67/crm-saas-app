"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Plus, DollarSign, FileText, MessageSquare, Phone, Mail, Building, User, MapPin } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Interactions } from "@/components/interactions"
import { ClientReminders } from "@/components/client-reminders"
import { EmailComposer } from "@/components/email-composer"

export default function ClientDetailPage() {
  const params = useParams()
  const [client, setClient] = useState<any>(null)
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
          <div className="grid gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Client non trouvé</p>
            <Button asChild className="mt-4">
              <Link href="/clients-db">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux clients
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 animate-in">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/clients-db">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux clients
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{client.entreprise || client.nom}</h1>
            <div className="flex items-center gap-2 mb-2">
              {client.secteur && (
                <Badge variant="outline">{client.secteur}</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Client depuis {format(new Date(client.dateCreation), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
            {(client.adresse || client.codePostal || client.ville) && (
              <div className="text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 inline mr-1" />
                {client.adresse && <span>{client.adresse}</span>}
                {client.adresse && (client.codePostal || client.ville) && <span>, </span>}
                {client.codePostal && <span>{client.codePostal} </span>}
                {client.ville && <span>{client.ville}</span>}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild>
              <Link href={`/devis-db/new?clientId=${client.id}`}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau devis
              </Link>
            </Button>
            <EmailComposer
              clientId={client.id}
              defaultTo={client.email || client.contacts?.find((c: any) => c.isPrincipal)?.email || client.contacts?.[0]?.email}
              onSent={() => loadClient()}
            />
            <Button variant="outline" asChild>
              <Link href={`/clients-db/${client.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {client.caTotal?.toLocaleString() || 0} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.devis?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {client.devis?.filter((d: any) => d.statut === 'en_cours').length || 0} en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{client.interactions?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contacts</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/clients-db/${client.id}/edit`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {client.contacts && client.contacts.length > 0 ? (
              <div className="space-y-4">
                {client.contacts.map((contact: any) => (
                  <div key={contact.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{contact.nom}</span>
                      {contact.isPrincipal && (
                        <Badge variant="default" className="text-xs">Principal</Badge>
                      )}
                    </div>
                    {contact.poste && (
                      <p className="text-sm text-muted-foreground mb-2">{contact.poste}</p>
                    )}
                    <div className="space-y-1 text-sm">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <a href={`mailto:${contact.email}`} className="hover:text-primary">
                            {contact.email}
                          </a>
                        </div>
                      )}
                      {contact.telephoneFixe && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span className="text-xs">Fixe:</span>
                          <a href={`tel:${contact.telephoneFixe}`} className="hover:text-primary">
                            {contact.telephoneFixe}
                          </a>
                        </div>
                      )}
                      {contact.telephonePortable && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span className="text-xs">Mobile:</span>
                          <a href={`tel:${contact.telephonePortable}`} className="hover:text-primary">
                            {contact.telephonePortable}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun contact</p>
            )}
          </CardContent>
        </Card>

        {/* Devis récents */}
        <Card>
          <CardHeader>
            <CardTitle>Devis récents</CardTitle>
          </CardHeader>
          <CardContent>
            {client.devis && client.devis.length > 0 ? (
              <div className="space-y-3">
                {client.devis.slice(0, 5).map((devis: any) => (
                  <Link
                    key={devis.id}
                    href={`/devis-db/${devis.id}`}
                    className="block p-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{devis.titre}</span>
                      {getStatutBadge(devis.statut)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-green-600">{devis.montant?.toLocaleString() || 0} €</span>
                      <span className="text-muted-foreground">{format(new Date(devis.dateEcheance), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                  </Link>
                ))}
                {client.devis.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{client.devis.length - 5} autre(s) devis...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">Aucun devis</p>
                <Button asChild size="sm">
                  <Link href={`/devis-db/new?clientId=${client.id}`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un devis
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rappels */}
        <div>
          <ClientReminders clientId={client.id} />
        </div>

        {/* Interactions */}
        <div className="md:col-span-2">
          <Interactions clientId={client.id} />
        </div>
      </div>
    </div>
  )
}
