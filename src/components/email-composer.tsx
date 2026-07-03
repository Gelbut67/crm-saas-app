"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Send, Loader2, Mail, AlertCircle } from "lucide-react"

interface EmailComposerProps {
  clientId: string
  defaultTo?: string
  defaultSubject?: string
  defaultBody?: string
  trigger?: React.ReactNode
  onSent?: () => void
}

export function EmailComposer({ clientId, defaultTo, defaultSubject, defaultBody, trigger, onSent }: EmailComposerProps) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState(defaultTo || "")
  const [subject, setSubject] = useState(defaultSubject || "")
  const [body, setBody] = useState(defaultBody || "")
  const [prompt, setPrompt] = useState("")
  const [contexte, setContexte] = useState("")
  const [accounts, setAccounts] = useState<{ id: string; label: string; fromEmail: string; isDefault: boolean }[]>([])
  const [accountId, setAccountId] = useState("")
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!open) return
    loadAccounts()
  }, [open])

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/email/accounts")
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
        const def = data.accounts?.find((a: any) => a.isDefault)
        if (def) setAccountId(def.id)
        else if (data.accounts?.length) setAccountId(data.accounts[0].id)
      }
    } catch (e) {
      console.error("[email composer] load accounts error:", e)
    }
  }

  const generate = async () => {
    if (!subject && !prompt) {
      setError("Indique un objet ou une consigne pour l'IA")
      return
    }
    setGenerating(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          prompt,
          object: subject,
          contexte
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur génération")
      setSubject(data.objet || subject)
      setBody(data.corps || "")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const send = async () => {
    if (!to || !subject || !body) {
      setError("Destinataire, objet et corps requis")
      return
    }
    setSending(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          accountId,
          to,
          subject,
          body,
          aiGenerated: prompt.length > 0,
          aiPrompt: prompt
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur envoi")
      setSuccess("Email envoyé avec succès")
      setTimeout(() => {
        setOpen(false)
        setSuccess("")
        setBody("")
        setSubject("")
        setPrompt("")
        setContexte("")
        onSent?.()
      }, 1200)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            Envoyer un email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Composer un email
          </DialogTitle>
          <DialogDescription>
            Rédige manuellement ou laisse l'IA générer un email personnalisé
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label>Compte d'envoi</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label} ({a.fromEmail}) {a.isDefault ? "- défaut" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {accounts.length === 0 && (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              Aucun compte email configuré. Va dans Paramètres → Comptes email pour en ajouter un.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email-to">Destinataire</Label>
            <Input
              id="email-to"
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="contact@entreprise.fr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Objet</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Objet de l'email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-prompt">Consigne pour l'IA (optionnel)</Label>
              <span className="text-xs text-muted-foreground">Ex: "relance douce après un devis non répondu"</span>
            </div>
            <Textarea
              id="email-prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Décris ce que tu veux dire dans l'email..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-contexte">Contexte / historique (optionnel)</Label>
              <span className="text-xs text-muted-foreground">Ex: devis N°123 envoyé le 12/06, client intéressé par le pack premium</span>
            </div>
            <Textarea
              id="email-contexte"
              value={contexte}
              onChange={e => setContexte(e.target.value)}
              placeholder="Donne du contexte pour que l'IA personnalise l'email..."
              rows={2}
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={generate}
            disabled={generating || (!subject && !prompt)}
            className="w-full gap-2"
          >
            {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération...</> : <><Sparkles className="h-4 w-4" /> Générer avec l'IA</>}
          </Button>

          <div className="space-y-2">
            <Label htmlFor="email-body">Corps de l'email</Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Ton email ici..."
              rows={10}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} type="button">
            Annuler
          </Button>
          <Button
            onClick={send}
            disabled={sending || accounts.length === 0 || !to || !subject || !body}
            className="gap-2"
          >
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</> : <><Send className="h-4 w-4" /> Envoyer</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
