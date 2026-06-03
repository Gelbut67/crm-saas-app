"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Printer, Loader2, Settings2, Building2, MapPin } from "lucide-react"
import Link from "next/link"
import { DevisLignesEditor, Ligne } from "@/components/devis-lignes-editor"

interface Client {
  id: string
  nom: string
  entreprise?: string
  adresse?: string
  codePostal?: string
  ville?: string
  statut: string
}

interface DevisFormData {
  id?: string
  clientId: string
  numero: string
  objet: string
  civilite: string
  lignes: Ligne[]
  delai: string
  livraison: string
  conditionsPaiement: string
  validite: string
  montant: string
  statut: string
  dateEcheance: string
  description: string
}

const DEFAULT_LIGNES: Ligne[] = []

interface Props {
  mode: 'new' | 'edit'
  initialData?: Partial<DevisFormData>
  initialClientId?: string
}

export function DevisForm({ mode, initialData, initialClientId }: Props) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [form, setForm] = useState<DevisFormData>({
    clientId: initialClientId || initialData?.clientId || '',
    numero: initialData?.numero || '',
    objet: initialData?.objet || 'Offre de service',
    civilite: initialData?.civilite || 'Madame',
    lignes: initialData?.lignes || DEFAULT_LIGNES,
    delai: initialData?.delai || '',
    livraison: initialData?.livraison || '',
    conditionsPaiement: initialData?.conditionsPaiement || '30 jours',
    validite: initialData?.validite || '1 mois',
    montant: initialData?.montant || '0',
    statut: initialData?.statut || 'en_cours',
    dateEcheance: initialData?.dateEcheance
      ? new Date(initialData.dateEcheance).toISOString().slice(0, 10)
      : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    description: initialData?.description || '',
  })

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const [resC, resP] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/prospects'),
        ])
        const c = resC.ok ? await resC.json() : []
        const p = resP.ok ? await resP.json() : []
        setClients([...c, ...p])
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [])

  useEffect(() => {
    if (form.clientId && clients.length) {
      setSelectedClient(clients.find(c => c.id === form.clientId) || null)
    }
  }, [form.clientId, clients])

  const setField = (key: keyof DevisFormData, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientId) return alert('Veuillez sélectionner un client ou prospect.')
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        montant: parseFloat(form.montant) || 0,
        lignes: JSON.stringify(form.lignes),
      }

      let res: Response
      if (mode === 'new') {
        res = await fetch('/api/devis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/devis/${initialData!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        const saved = await res.json()
        router.push(`/devis-db/${saved.id}`)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Erreur lors de la sauvegarde')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = async () => {
    if (!initialData?.id) {
      alert('Sauvegardez d\'abord le devis pour pouvoir l\'imprimer.')
      return
    }
    setPrinting(true)
    try {
      const res = await fetch(`/api/devis/${initialData.id}/imprimer`)
      if (res.ok) {
        const html = await res.text()
        const w = window.open('', '_blank')
        if (w) { w.document.write(html); w.document.close(); w.print() }
      }
    } finally {
      setPrinting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 animate-in max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Button variant="ghost" type="button" asChild className="mb-3">
            <Link href="/devis-db">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux devis
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">
            {mode === 'new' ? 'Nouveau devis' : `Modifier devis${initialData?.numero ? ` n° ${initialData.numero}` : ''}`}
          </h1>
        </div>
        <div className="flex gap-2 mt-8">
          <Button type="button" variant="outline" asChild>
            <Link href="/devis-db/parametres">
              <Settings2 className="w-4 h-4 mr-2" />
              Paramètres société
            </Link>
          </Button>
          {mode === 'edit' && (
            <Button type="button" variant="outline" onClick={handlePrint} disabled={printing}>
              {printing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
              Imprimer
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="space-y-6">

        {/* 1. Destinataire */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Destinataire</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client / Prospect *</Label>
                <Select value={form.clientId} onValueChange={v => setField('clientId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? 'Chargement…' : 'Sélectionner…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.entreprise || c.nom}
                        <span className="text-muted-foreground text-xs ml-2">
                          {c.statut === 'client' ? '(Client)' : '(Prospect)'}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Civilité</Label>
                <Select value={form.civilite} onValueChange={v => setField('civilite', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Madame', 'Monsieur', 'Madame, Monsieur'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedClient && (
              <div className="p-3 bg-muted/40 rounded-lg text-sm flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">{selectedClient.entreprise || selectedClient.nom}</p>
                  {selectedClient.adresse && <p className="text-muted-foreground">{selectedClient.adresse}</p>}
                  {(selectedClient.codePostal || selectedClient.ville) && (
                    <p className="text-muted-foreground">{selectedClient.codePostal} {selectedClient.ville}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Document */}
        <Card>
          <CardHeader><CardTitle className="text-base">Document</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Numéro de devis</Label>
              <Input
                value={form.numero}
                onChange={e => setField('numero', e.target.value)}
                placeholder="Auto-généré si vide"
              />
            </div>
            <div>
              <Label>Date d'échéance</Label>
              <Input type="date" value={form.dateEcheance} onChange={e => setField('dateEcheance', e.target.value)} />
            </div>
            <div>
              <Label>Objet</Label>
              <Input
                value={form.objet}
                onChange={e => setField('objet', e.target.value)}
                placeholder="Offre de service"
              />
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={v => setField('statut', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="gagne">Gagné</SelectItem>
                  <SelectItem value="perdu">Perdu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Montant HT (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.montant}
                onChange={e => setField('montant', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Titre interne (optionnel)</Label>
              <Input
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="Référence interne…"
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Contenu (bullet list) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contenu du devis</CardTitle>
            <p className="text-xs text-muted-foreground">
              Ajoutez les lignes qui apparaîtront en liste à puces dans le document. Choisissez le style : <strong>Gras</strong> pour les titres produit, <span className="text-orange-600 font-bold">Coloré</span> pour les matières, Normal pour les détails.
            </p>
          </CardHeader>
          <CardContent>
            <DevisLignesEditor lignes={form.lignes} onChange={v => setField('lignes', v)} />
          </CardContent>
        </Card>

        {/* 4. Conditions commerciales */}
        <Card>
          <CardHeader><CardTitle className="text-base">Conditions commerciales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Délai</Label>
              <Input value={form.delai} onChange={e => setField('delai', e.target.value)} placeholder="ex: 1 mois" />
            </div>
            <div>
              <Label>Livraison</Label>
              <Input value={form.livraison} onChange={e => setField('livraison', e.target.value)} placeholder="ex: franco SAINT AVOLD" />
            </div>
            <div>
              <Label>Conditions de paiement</Label>
              <Input value={form.conditionsPaiement} onChange={e => setField('conditionsPaiement', e.target.value)} placeholder="ex: 30 jours" />
            </div>
            <div>
              <Label>Prix valable pour</Label>
              <Input value={form.validite} onChange={e => setField('validite', e.target.value)} placeholder="ex: 1 mois" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Footer actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button type="button" variant="outline" asChild>
          <Link href="/devis-db">Annuler</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {mode === 'new' ? 'Créer le devis' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </form>
  )
}
