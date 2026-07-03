"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Loader2, Save, Search, Users } from "lucide-react"
import Link from "next/link"

export default function NewCampaignPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [prompt, setPrompt] = useState("")

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    const s = search.toLowerCase()
    setFiltered(
      clients.filter(c =>
        (c.nom || "").toLowerCase().includes(s) ||
        (c.entreprise || "").toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s) ||
        (c.secteur || "").toLowerCase().includes(s) ||
        (c.ville || "").toLowerCase().includes(s)
      )
    )
  }, [search, clients])

  const loadClients = async () => {
    try {
      const res = await fetch("/api/clients")
      if (res.ok) {
        const data = await res.json()
        const list = data.clients || []
        setClients(list)
        setFiltered(list)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(c => c.id)))
  }

  const getEmail = (c: any) => c.email || c.contacts?.find((ct: any) => ct.isPrincipal)?.email || c.contacts?.[0]?.email

  const save = async () => {
    if (!name || !subject || !prompt) {
      alert("Nom, sujet et prompt sont requis")
      return
    }
    const recipients = Array.from(selected)
      .map(id => {
        const c = clients.find(x => x.id === id)
        if (!c) return null
        const email = getEmail(c)
        if (!email) return null
        return { clientId: c.id, email }
      })
      .filter(Boolean)

    if (recipients.length === 0) {
      alert("Sélectionne au moins un destinataire avec une adresse email")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, prompt, recipients, status: "draft" })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      router.push("/email/campaigns")
    } catch (e: any) {
      alert(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/email/campaigns">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Campagnes
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Nouvelle campagne
          </h1>
          <p className="text-muted-foreground text-sm">Sélectionne les destinataires et définis le prompt IA</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>Le prompt sera utilisé par l'IA pour personnaliser chaque email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la campagne</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Relance été 2026" />
            </div>
            <div className="space-y-2">
              <Label>Objet des emails</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Proposition de collaboration" />
            </div>
            <div className="space-y-2">
              <Label>Prompt / consigne IA</Label>
              <Textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Rédige un email de prospection pour présenter nos produits artisanaux. Mentionne le secteur et la ville du prospect. Ton chaleureux."
                rows={6}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {selected.size} destinataire(s) sélectionné(s)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sélection des destinataires</CardTitle>
            <CardDescription>Clients et prospects avec une adresse email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onCheckedChange={toggleAll}
                />
                <Label htmlFor="select-all" className="cursor-pointer">Tout sélectionner ({filtered.length})</Label>
              </div>

              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : filtered.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Aucun contact trouvé.</p>
                ) : (
                  <div className="divide-y">
                    {filtered.map(c => {
                      const email = getEmail(c)
                      return (
                        <div
                          key={c.id}
                          className={`flex items-start gap-3 p-3 hover:bg-accent/50 cursor-pointer ${selected.has(c.id) ? 'bg-accent/30' : ''}`}
                          onClick={() => toggle(c.id)}
                        >
                          <Checkbox
                            checked={selected.has(c.id)}
                            onCheckedChange={() => toggle(c.id)}
                            onClick={e => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{c.entreprise || c.nom}</div>
                            <div className="text-xs text-muted-foreground truncate">{email || "Pas d'email"}</div>
                            <div className="text-xs text-muted-foreground">{c.secteur}{c.ville ? ` · ${c.ville}` : ''}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/email/campaigns">Annuler</Link>
        </Button>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Création...</> : <><Save className="h-4 w-4" /> Créer la campagne</>}
        </Button>
      </div>
    </div>
  )
}
