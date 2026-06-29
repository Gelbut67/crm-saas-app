"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Globe, Loader2, Sparkles, Save, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

const SECTEURS = [
  "Agriculture","Maraîchage","Viticulture / Vigneron","Brasserie / Brasseur",
  "Restauration","Hôtellerie","Traiteur","Épicerie / Épicerie fine","Cave à vins",
  "Boulangerie / Pâtisserie","Charcuterie / Fromagerie","CHR (Café, Hôtel, Restaurant)",
  "Grande distribution","Grossiste alimentaire","Producteur local","Coopérative agricole",
  "Apiculture","Distillerie","Cidrerie","Fromagerie","Élevage","Pépinière",
  "Technologie","Services","Commerce","Industrie","Consulting","Santé","Éducation","Finance","Autre",
]

type Extracted = {
  nom: string
  entreprise: string
  website: string
  telephone: string
  email: string
  adresse: string
  ville: string
  codePostal: string
  secteur: string
  description: string
}

export default function ImportFromUrlPage() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState<Extracted | null>(null)

  const analyser = async () => {
    if (!url.trim()) return
    setAnalyzing(true)
    setError("")
    setData(null)
    try {
      const res = await fetch("/api/prospects/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erreur inconnue")
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const creer = async () => {
    if (!data) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: data.nom || data.entreprise,
          entreprise: data.entreprise,
          secteur: data.secteur,
          adresse: data.adresse,
          codePostal: data.codePostal,
          ville: data.ville,
          statut: "prospect",
        }),
      })
      if (!res.ok) throw new Error("Erreur lors de la création")
      const prospect = await res.json()

      // Créer un contact si on a un nom/téléphone/email
      if (data.nom || data.telephone || data.email) {
        await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: prospect.id,
            nom: data.nom || data.entreprise || "Contact",
            telephone: data.telephone || null,
            email: data.email || null,
            isPrincipal: true,
          }),
        })
      }

      router.push(`/prospects-db/${prospect.id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const update = (field: keyof Extracted, value: string) => {
    if (!data) return
    setData({ ...data, [field]: value })
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/prospects-db">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Importer depuis un site web
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Colle l'URL d'un site et l'IA extrait automatiquement les informations
          </p>
        </div>
      </div>

      {/* Input URL */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="https://www.entreprise.fr ou entreprise.fr"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && analyser()}
                className="h-11 text-base"
              />
            </div>
            <Button onClick={analyser} disabled={analyzing || !url.trim()} className="h-11 gap-2 px-6">
              {analyzing
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyse...</>
                : <><Sparkles className="h-4 w-4" /> Analyser</>}
            </Button>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultat */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Informations extraites — vérifiez et complétez si besoin
            </CardTitle>
            <CardDescription>
              Source : <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">{data.website}</a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nom de l'entreprise *</Label>
                <Input value={data.entreprise} onChange={e => update("entreprise", e.target.value)} placeholder="Nom de l'entreprise" />
              </div>

              <div className="space-y-2">
                <Label>Secteur d'activité</Label>
                <Select value={data.secteur} onValueChange={v => update("secteur", v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {SECTEURS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {data.secteur && !SECTEURS.includes(data.secteur) && (
                  <p className="text-xs text-muted-foreground">Détecté : <strong>{data.secteur}</strong></p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Site web</Label>
                <Input value={data.website} onChange={e => update("website", e.target.value)} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={data.telephone} onChange={e => update("telephone", e.target.value)} placeholder="0X XX XX XX XX" />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={data.email} onChange={e => update("email", e.target.value)} placeholder="contact@..." type="email" />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Adresse</Label>
                <Input value={data.adresse} onChange={e => update("adresse", e.target.value)} placeholder="123 rue..." />
              </div>

              <div className="space-y-2">
                <Label>Ville</Label>
                <Input value={data.ville} onChange={e => update("ville", e.target.value)} placeholder="Paris" />
              </div>

              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input value={data.codePostal} onChange={e => update("codePostal", e.target.value)} placeholder="75000" />
              </div>

              {data.description && (
                <div className="col-span-2 space-y-2">
                  <Label>Description détectée</Label>
                  <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3 leading-relaxed">{data.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={creer} disabled={saving || !data.entreprise} className="gap-2 flex-1">
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Création...</>
                  : <><Save className="h-4 w-4" /> Créer le prospect</>}
              </Button>
              <Button variant="outline" onClick={() => { setData(null); setUrl("") }}>
                Recommencer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {analyzing && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Analyse du site en cours...</p>
              <p className="text-sm text-muted-foreground mt-1">Extraction des métadonnées et analyse IA</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
