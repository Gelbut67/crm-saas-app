"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Mail, RefreshCw, Loader2, Send, Sparkles, MessageSquare, AlertCircle, User } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function InboxPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [replyBody, setReplyBody] = useState("")
  const [replySubject, setReplySubject] = useState("")
  const [replyPrompt, setReplyPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/email/inbox")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setMessages(data.messages || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const generateReply = async () => {
    if (!selected) return
    setGenerating(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/email/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inboundId: selected.logId,
          clientId: selected.clientId,
          to: selected.fromEmail,
          subject: selected.subject,
          originalBody: selected.text,
          prompt: replyPrompt
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setReplySubject(data.subject)
      setReplyBody(data.body)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const sendReply = async () => {
    if (!selected || !replyBody) return
    setSending(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/email/reply", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inboundId: selected.logId,
          clientId: selected.clientId,
          to: selected.fromEmail,
          subject: replySubject,
          body: replyBody
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setSuccess("Réponse envoyée")
      setTimeout(() => { setDialogOpen(false); setSelected(null); setReplyBody(""); setReplySubject(""); setReplyPrompt(""); setSuccess("") }, 1200)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  const openReply = (msg: any) => {
    setSelected(msg)
    setReplySubject(`RE: ${msg.subject.replace(/^RE:\s*/i, '')}`)
    setReplyBody("")
    setReplyPrompt("")
    setError("")
    setSuccess("")
    setDialogOpen(true)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/email/accounts">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Comptes
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Boîte de réception
          </h1>
          <p className="text-muted-foreground text-sm">
            Emails reçus sur le compte IMAP par défaut — appuie sur Rafraîchir pour récupérer
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={load} disabled={loading} variant="outline" className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Rafraîchir
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Messages récents</CardTitle>
          <CardDescription>{messages.length} message(s) non lu(s) sur les 7 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun message récupéré.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={m.messageId || i} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{m.from}</span>
                        {m.clientId && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Client connu</span>}
                      </div>
                      <div className="text-sm font-semibold mb-1">{m.subject}</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {m.date ? format(new Date(m.date), 'dd MMM yyyy HH:mm', { locale: fr }) : ''}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{m.text?.slice(0, 300)}...</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openReply(m)} className="gap-2 shrink-0">
                      <MessageSquare className="h-4 w-4" /> Répondre
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Répondre à {selected?.fromEmail}
            </DialogTitle>
            <DialogDescription>Sujet original : {selected?.subject}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-md bg-muted p-3 text-sm max-h-40 overflow-y-auto">
              <strong>Email reçu :</strong>
              <p className="mt-1 whitespace-pre-wrap">{selected?.text?.slice(0, 1000)}</p>
            </div>

            <div className="space-y-2">
              <Label>Consigne pour la réponse IA</Label>
              <Textarea
                value={replyPrompt}
                onChange={e => setReplyPrompt(e.target.value)}
                placeholder="Ex: répondre positivement, demander un RDV, refuser poliment..."
                rows={2}
              />
            </div>

            <Button variant="secondary" onClick={generateReply} disabled={generating} className="w-full gap-2">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Génération...</> : <><Sparkles className="h-4 w-4" /> Générer la réponse IA</>}
            </Button>

            <div className="space-y-2">
              <Label>Objet</Label>
              <Input value={replySubject} onChange={e => setReplySubject(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Corps de la réponse</Label>
              <Textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} rows={10} />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={sendReply} disabled={sending || !replyBody} className="gap-2">
              {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</> : <><Send className="h-4 w-4" /> Envoyer</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
