"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2, CheckCircle2 } from "lucide-react"

const FIELDS: { key: string; label: string; placeholder?: string; type?: string; multi?: boolean }[] = [
  { key: 'devis_societe_nom', label: 'Nom de la société', placeholder: 'Belle Etiquette s.a.' },
  { key: 'devis_societe_tagline', label: 'Slogan / Activité', placeholder: 'Fabrication et impression d\'étiquettes autocollantes' },
  { key: 'devis_societe_adresse', label: 'Adresse', placeholder: '6 Rue des Artisans, ZI Sainte AGATHE' },
  { key: 'devis_societe_code_postal', label: 'Code postal', placeholder: '57190' },
  { key: 'devis_societe_ville', label: 'Ville', placeholder: 'FLORANGE' },
  { key: 'devis_societe_siret', label: 'SIRET', placeholder: '341 921 104 00012' },
  { key: 'devis_societe_telephone', label: 'Téléphone fixe', placeholder: '03 82 58 64 43' },
  { key: 'devis_societe_mobile', label: 'Mobile (commercial)', placeholder: '07.76.32.11.94' },
  { key: 'devis_societe_email', label: 'Email (devis)', placeholder: 'contact@masociete.com' },
  { key: 'devis_societe_nom_commercial', label: 'Nom du signataire', placeholder: 'Garip YASAR' },
  { key: 'devis_societe_iban', label: 'Coordonnées bancaires (IBAN)', placeholder: 'BNP FR76 3000 4004 5700 0203 5383 872 BNPAFRPPXXX' },
  { key: 'devis_societe_logo_url', label: 'URL du logo (image web)', placeholder: 'https://…/logo.png' },
  { key: 'devis_ville_emission', label: 'Ville d\'émission (ex: Florange)', placeholder: 'Florange' },
  { key: 'devis_numero_suivant', label: 'Prochain numéro de devis', placeholder: '100001', type: 'number' },
  { key: 'devis_texte_introduction', label: 'Texte d\'introduction', multi: true, placeholder: 'Nous vous remercions de votre demande de prix…' },
  { key: 'devis_texte_footer', label: 'Texte de la zone commande (bas du devis)', multi: true, placeholder: 'Pour toute commande, merci de bien vouloir nous renvoyer votre devis signé…' },
]

export default function DevisParametresPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/devis/parametres')
      .then(r => r.json())
      .then(d => setValues(d))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/devis/parametres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Chargement…</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-3">
          <Link href="/devis-db">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux devis
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Paramètres de la société</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ces informations apparaissent dans l'en-tête et le pied de page de vos devis imprimés.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations société &amp; devis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FIELDS.map(f => (
            <div key={f.key}>
              <Label className="text-sm font-medium">{f.label}</Label>
              {f.multi ? (
                <Textarea
                  value={values[f.key] || ''}
                  onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={3}
                  className="mt-1 text-sm"
                />
              ) : (
                <Input
                  type={f.type || 'text'}
                  value={values[f.key] || ''}
                  onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="mt-1"
                />
              )}
            </div>
          ))}

          <div className="pt-4 flex gap-3 items-center">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Sauvegarder
            </Button>
            {saved && (
              <span className="text-green-600 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Enregistré !
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
