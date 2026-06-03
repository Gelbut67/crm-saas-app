"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Printer, Loader2, Settings2, Building2, MapPin } from "lucide-react"
import Link from "next/link"
import { DevisLignesEditor, Ligne, calcTotaux } from "@/components/devis-lignes-editor"

interface Client {
  id: string
  nom: string
  entreprise?: string
  adresse?: string
  codePostal?: string
  ville?: string
  pays?: string
  statut: string
}

interface DevisFormData {
  id?: string
  clientId: string
  numero: string
  objet: string
  validite: string
  conditionsPaiement: string
  lignes: Ligne[]
  montant: string
  statut: string
  dateEcheance: string
  description: string
  civilite: string
  delai: string
  livraison: string
  afficherTotaux: boolean
}

interface Props {
  mode: "new" | "edit"
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
    clientId: initialClientId || initialData?.clientId || "",
    numero: initialData?.numero || "",
    objet: initialData?.objet || "Offre de prix étiquettes",
    validite: initialData?.validite || "1 mois",
    conditionsPaiement: initialData?.conditionsPaiement || "30 jours",
    lignes: initialData?.lignes || [],
    montant: initialData?.montant || "0",
    statut: initialData?.statut || "en_cours",
    dateEcheance: initialData?.dateEcheance
      ? new Date(initialData.dateEcheance).toISOString().slice(0, 10)
      : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    description: initialData?.description || "",
    civilite: initialData?.civilite || "Madame",
    delai: initialData?.delai || "",
    livraison: initialData?.livraison || "",
    afficherTotaux: (initialData as any)?.afficherTotaux !== false,
  })

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const [resC, resP] = await Promise.all([fetch("/api/clients"), fetch("/api/prospects")])
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

  // Auto-calcul du montant depuis les lignes
  const totaux = calcTotaux(form.lignes)
  const netAPayer = totaux.totalHT + totaux.totalTVA

  const setField = (key: keyof DevisFormData, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientId) return alert("Veuillez sélectionner un client ou prospect.")
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        montant: totaux.totalHT || parseFloat(form.montant) || 0,
        lignes: JSON.stringify(form.lignes),
        titre: form.objet || "Devis",
      }
      let res: Response
      if (mode === "new") {
        res = await fetch("/api/devis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/devis/${initialData!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      if (res.ok) {
        const saved = await res.json()
        router.push(`/devis-db/${saved.id}`)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Erreur lors de la sauvegarde")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = async () => {
    if (!initialData?.id) {
      alert("Sauvegardez d'abord le devis pour pouvoir l'imprimer.")
      return
    }
    setPrinting(true)
    try {
      const res = await fetch(`/api/devis/${initialData.id}/imprimer`)
      if (res.ok) {
        const html = await res.text()
        const w = window.open("", "_blank")
        if (w) { w.document.write(html); w.document.close(); w.print() }
      }
    } finally {
      setPrinting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 animate-in max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Button variant="ghost" type="button" asChild className="mb-3">
            <Link href="/devis-db">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux devis
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">
            {mode === "new" ? "Nouveau devis" : `Modifier devis${initialData?.numero ? ` n° ${initialData.numero}` : ""}`}
          </h1>
        </div>
        <div className="flex gap-2 mt-8">
          <Button type="button" variant="outline" asChild>
            <Link href="/devis-db/parametres">
              <Settings2 className="w-4 h-4 mr-2" />
              Paramètres société
            </Link>
          </Button>
          {mode === "edit" && (
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

      <div className="space-y-5">
        {/* Destinataire */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Destinataire</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client / Prospect *</Label>
                <Select value={form.clientId} onValueChange={v => setField("clientId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Chargement…" : "Sélectionner…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.entreprise || c.nom}
                        <span className="text-muted-foreground text-xs ml-2">
                          {c.statut === "client" ? "(Client)" : "(Prospect)"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Civilité</Label>
                <Select value={form.civilite} onValueChange={v => setField("civilite", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Madame", "Monsieur", "Madame, Monsieur"].map(c => (
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
                  <p className="font-semibold uppercase">{selectedClient.entreprise || selectedClient.nom}</p>
                  {selectedClient.adresse && <p className="text-muted-foreground">{selectedClient.adresse}</p>}
                  {(selectedClient.codePostal || selectedClient.ville) && (
                    <p className="text-muted-foreground">{selectedClient.codePostal} {selectedClient.ville}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document */}
        <Card>
          <CardHeader><CardTitle className="text-base">Référence du document</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div>
              <Label>Numéro de devis</Label>
              <Input value={form.numero} onChange={e => setField("numero", e.target.value)} placeholder="Auto (ex: AL-001)" />
            </div>
            <div>
              <Label>Date d'émission</Label>
              <Input type="date" value={form.dateEcheance} onChange={e => setField("dateEcheance", e.target.value)} />
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={form.statut} onValueChange={v => setField("statut", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="gagne">Gagné</SelectItem>
                  <SelectItem value="perdu">Perdu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Objet</Label>
              <Input value={form.objet} onChange={e => setField("objet", e.target.value)} placeholder="Offre de prix étiquettes" />
            </div>
            <div>
              <Label>Durée de validité</Label>
              <Input value={form.validite} onChange={e => setField("validite", e.target.value)} placeholder="1 mois" />
            </div>
            <div>
              <Label>Conditions de règlement</Label>
              <Input value={form.conditionsPaiement} onChange={e => setField("conditionsPaiement", e.target.value)} placeholder="30 jours" />
            </div>
          </CardContent>
        </Card>

        {/* Lignes du devis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lignes du devis</CardTitle>
            <p className="text-xs text-muted-foreground">
              Les <strong>lignes chiffrées</strong> ont une quantité + prix au mille + TVA. Les <strong>lignes description</strong> n'ont que du texte (format, impression, matière…).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <DevisLignesEditor
              lignes={form.lignes}
              onChange={v => setField("lignes", v)}
              showTotaux={form.afficherTotaux}
            />
            <div className="flex items-center gap-2 pt-2 border-t">
              <input
                type="checkbox"
                id="afficherTotaux"
                checked={form.afficherTotaux}
                onChange={e => setField("afficherTotaux", e.target.checked)}
                className="w-4 h-4 accent-orange-600 cursor-pointer"
              />
              <label htmlFor="afficherTotaux" className="text-sm cursor-pointer select-none">
                Afficher les totaux (Total HT, Total TVA, Net à payer) sur le document imprimé
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button type="button" variant="outline" asChild>
          <Link href="/devis-db">Annuler</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {mode === "new" ? "Créer le devis" : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  )
}
