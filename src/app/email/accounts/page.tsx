"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Mail, Plus, Trash2, Check, X, Loader2, Server, AlertCircle } from "lucide-react"
import Link from "next/link"

const DEFAULTS = {
  label: "",
  fromEmail: "",
  fromName: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPass: "",
  smtpSecure: true,
  imapHost: "",
  imapPort: "993",
  imapUser: "",
  imapPass: "",
  imapSecure: true,
  isDefault: false,
}

export default function EmailAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(DEFAULTS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/email/accounts")
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/email/accounts", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setSuccess(editingId ? "Compte mis à jour" : "Compte créé")
      setForm(DEFAULTS)
      setEditingId(null)
      setShowForm(false)
      loadAccounts()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce compte ?")) return
    try {
      const res = await fetch("/api/email/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      if (res.ok) loadAccounts()
    } catch (e) {
      console.error(e)
    }
  }

  const edit = (a: any) => {
    setEditingId(a.id)
    setForm({
      label: a.label,
      fromEmail: a.fromEmail,
      fromName: a.fromName || "",
      smtpHost: a.smtpHost,
      smtpPort: a.smtpPort.toString(),
      smtpUser: a.smtpUser,
      smtpPass: "",
      smtpSecure: a.smtpSecure,
      imapHost: a.imapHost || "",
      imapPort: a.imapPort?.toString() || "993",
      imapUser: a.imapUser || "",
      imapPass: "",
      imapSecure: a.imapSecure !== false,
      isDefault: a.isDefault,
    })
    setShowForm(true)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Comptes email
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure les comptes SMTP/IMAP utilisés pour envoyer et recevoir depuis le CRM
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Comptes configurés</CardTitle>
              <CardDescription>Active un compte par défaut pour l'envoi rapide</CardDescription>
            </div>
            <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(DEFAULTS) }} className="gap-2">
              <Plus className="h-4 w-4" /> {showForm ? "Annuler" : "Ajouter"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun compte email configuré.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map(a => (
                <div key={a.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {a.label}
                      {a.isDefault && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Défaut</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {a.fromEmail} · SMTP {a.smtpHost}:{a.smtpPort} · IMAP {a.imapHost || "non config"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => edit(a)}>
                      Modifier
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(a.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Modifier" : "Nouveau"} compte</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du compte</Label>
                  <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Bureau / Perso" required />
                </div>
                <div className="space-y-2">
                  <Label>Expéditeur affiché</Label>
                  <Input value={form.fromName} onChange={e => setForm({ ...form, fromName: e.target.value })} placeholder="Prénom Nom" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Adresse email d'envoi</Label>
                  <Input type="email" value={form.fromEmail} onChange={e => setForm({ ...form, fromEmail: e.target.value })} placeholder="moi@entreprise.fr" required />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Serveur SMTP (envoi)</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hôte SMTP</Label>
                    <Input value={form.smtpHost} onChange={e => setForm({ ...form, smtpHost: e.target.value })} placeholder="smtp.entreprise.fr" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Port SMTP</Label>
                    <Input value={form.smtpPort} onChange={e => setForm({ ...form, smtpPort: e.target.value })} placeholder="587" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Utilisateur SMTP</Label>
                    <Input value={form.smtpUser} onChange={e => setForm({ ...form, smtpUser: e.target.value })} placeholder="moi@entreprise.fr" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Mot de passe SMTP</Label>
                    <Input type="password" value={form.smtpPass} onChange={e => setForm({ ...form, smtpPass: e.target.value })} placeholder="••••••••" required={!editingId} />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Switch id="smtp-secure" checked={form.smtpSecure} onCheckedChange={v => setForm({ ...form, smtpSecure: v })} />
                  <Label htmlFor="smtp-secure">TLS/SSL (sécurisé)</Label>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Serveur IMAP (lecture réponses) — optionnel</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hôte IMAP</Label>
                    <Input value={form.imapHost} onChange={e => setForm({ ...form, imapHost: e.target.value })} placeholder="imap.entreprise.fr" />
                  </div>
                  <div className="space-y-2">
                    <Label>Port IMAP</Label>
                    <Input value={form.imapPort} onChange={e => setForm({ ...form, imapPort: e.target.value })} placeholder="993" />
                  </div>
                  <div className="space-y-2">
                    <Label>Utilisateur IMAP</Label>
                    <Input value={form.imapUser} onChange={e => setForm({ ...form, imapUser: e.target.value })} placeholder="moi@entreprise.fr" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mot de passe IMAP</Label>
                    <Input type="password" value={form.imapPass} onChange={e => setForm({ ...form, imapPass: e.target.value })} placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Switch id="imap-secure" checked={form.imapSecure} onCheckedChange={v => setForm({ ...form, imapSecure: v })} />
                  <Label htmlFor="imap-secure">SSL (IMAP sécurisé)</Label>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t pt-4">
                <Switch id="default" checked={form.isDefault} onCheckedChange={v => setForm({ ...form, isDefault: v })} />
                <Label htmlFor="default">Compte par défaut</Label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</> : <><Check className="h-4 w-4" /> Enregistrer</>}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  <X className="h-4 w-4 mr-2" /> Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
