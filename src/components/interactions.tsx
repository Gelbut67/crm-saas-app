"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Phone, Mail, Calendar, Trash2, Loader2, Plus, X } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Interaction {
  id: string
  type: string
  contenu: string
  date: string
}

interface InteractionsProps {
  clientId: string
}

export function Interactions({ clientId }: InteractionsProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    type: 'note',
    contenu: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadInteractions()
  }, [clientId])

  const loadInteractions = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/interactions`)
      if (response.ok) {
        const data = await response.json()
        setInteractions(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.contenu.trim()) {
      alert('Le contenu est obligatoire')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadInteractions()
        setFormData({
          type: 'note',
          contenu: '',
          date: new Date().toISOString().split('T')[0]
        })
        setShowForm(false)
      } else {
        alert('Erreur lors de l\'ajout de l\'interaction')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'ajout de l\'interaction')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (interactionId: string) => {
    if (!confirm('Supprimer cette interaction ?')) return

    setDeleting(interactionId)
    try {
      const response = await fetch(`/api/clients/${clientId}/interactions?interactionId=${interactionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadInteractions()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setDeleting(null)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appel':
        return <Phone className="w-4 h-4" />
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'rdv':
        return <Calendar className="w-4 h-4" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'appel':
        return <Badge variant="outline" className="bg-blue-50">Appel</Badge>
      case 'email':
        return <Badge variant="outline" className="bg-purple-50">Email</Badge>
      case 'rdv':
        return <Badge variant="outline" className="bg-green-50">RDV</Badge>
      default:
        return <Badge variant="outline">Note</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Interactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Interactions
            </CardTitle>
            <CardDescription>
              {interactions.length} interaction{interactions.length > 1 ? 's' : ''} enregistrée{interactions.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="appel">Appel</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="rdv">Rendez-vous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Contenu</label>
                <Textarea
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  placeholder="Décrivez l'interaction..."
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer l\'interaction'
                )}
              </Button>
            </div>
          </form>
        )}

        {interactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucune interaction</p>
            <p className="text-sm">Cliquez sur "Ajouter" pour enregistrer une interaction</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(interaction.type)}
                    {getTypeBadge(interaction.type)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(interaction.date), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(interaction.id)}
                      disabled={deleting === interaction.id}
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    >
                      {deleting === interaction.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{interaction.contenu}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
