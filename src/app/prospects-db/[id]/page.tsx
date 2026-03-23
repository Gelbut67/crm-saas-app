"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Plus, MessageSquare, Phone, Mail, Building, User, UserPlus, MapPin, FileText } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function ProspectDetailPage() {
  const params = useParams()
  const [prospect, setProspect] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    loadProspect()
  }, [params.id])

  const loadProspect = async () => {
    try {
      const response = await fetch(`/api/prospects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProspect(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const convertToClient = async () => {
    setConverting(true)
    try {
      const response = await fetch(`/api/prospects/${params.id}/convert`, {
        method: 'POST'
      })
      
      if (response.ok) {
        window.location.href = '/clients-db'
      } else {
        alert('Erreur lors de la conversion')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la conversion')
    } finally {
      setConverting(false)
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

  if (!prospect) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Prospect non trouvé</p>
            <Button asChild className="mt-4">
              <Link href="/prospects-db">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux prospects
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
          <Link href="/prospects-db">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux prospects
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{prospect.entreprise || prospect.nom}</h1>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Prospect</Badge>
              {prospect.secteur && (
                <Badge variant="outline">{prospect.secteur}</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                Depuis {format(new Date(prospect.dateCreation), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
            {(prospect.adresse || prospect.codePostal || prospect.ville) && (
              <div className="text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 inline mr-1" />
                {prospect.adresse && <span>{prospect.adresse}</span>}
                {prospect.adresse && (prospect.codePostal || prospect.ville) && <span>, </span>}
                {prospect.codePostal && <span>{prospect.codePostal} </span>}
                {prospect.ville && <span>{prospect.ville}</span>}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={convertToClient} disabled={converting}>
              <UserPlus className="w-4 h-4 mr-2" />
              {converting ? 'Conversion...' : 'Convertir en client'}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/prospects-db/${prospect.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Devis */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Devis</CardTitle>
              <CardDescription>
                Liste des devis pour ce prospect
              </CardDescription>
            </div>
            <Button asChild>
              <Link href={`/devis-db/new?clientId=${prospect.id}`}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau devis
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {prospect.devis && prospect.devis.length > 0 ? (
            <div className="space-y-3">
              {prospect.devis.map((devis: any) => (
                <Link 
                  key={devis.id} 
                  href={`/devis-db/${devis.id}`}
                  className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">{devis.titre}</span>
                    </div>
                    <Badge variant={
                      devis.statut === 'accepte' ? 'default' :
                      devis.statut === 'refuse' ? 'destructive' :
                      devis.statut === 'en_cours' ? 'secondary' : 'outline'
                    }>
                      {devis.statut === 'accepte' ? 'Accepté' :
                       devis.statut === 'refuse' ? 'Refusé' :
                       devis.statut === 'en_cours' ? 'En cours' : 'Brouillon'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-green-600">
                      {devis.montant?.toLocaleString() || 0} €
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(devis.dateEcheance), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">Aucun devis</p>
              <Button asChild variant="outline">
                <Link href={`/devis-db/new?clientId=${prospect.id}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un devis
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contacts</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/prospects-db/${prospect.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Gérer
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {prospect.contacts && prospect.contacts.length > 0 ? (
              <div className="space-y-4">
                {prospect.contacts.map((contact: any) => (
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
                      {contact.telephone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${contact.telephone}`} className="hover:text-primary">
                            {contact.telephone}
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

        {/* Interactions récentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Interactions</CardTitle>
              <Badge variant="outline">{prospect.interactions?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {prospect.interactions && prospect.interactions.length > 0 ? (
              <div className="space-y-3">
                {prospect.interactions.slice(0, 10).map((interaction: any) => (
                  <div key={interaction.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{interaction.type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(interaction.date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm">{interaction.contenu}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Aucune interaction</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
