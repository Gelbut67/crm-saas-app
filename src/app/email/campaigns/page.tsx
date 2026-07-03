"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Mail, Plus, Send, Trash2, Loader2, AlertCircle, Users, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<string | null>(null)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const res = await fetch("/api/email/campaigns")
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const sendCampaign = async (id: string) => {
    if (!confirm("Lancer la campagne ? Les emails partiront un par un.")) return
    setSendingId(id)
    try {
      const res = await fetch(`/api/email/campaigns/${id}/send`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) alert(data.error || "Erreur")
      else alert(`${data.sent} envoyé(s), ${data.failed} échec(s)`)
    } catch (e) {
      alert("Erreur réseau")
    } finally {
      setSendingId(null)
      loadCampaigns()
    }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm("Supprimer cette campagne ?")) return
    try {
      await fetch("/api/email/campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      loadCampaigns()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/email/accounts">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Comptes
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Campagnes email
          </h1>
          <p className="text-muted-foreground text-sm">
            Crée et envoie des emails personnalisés à plusieurs prospects/clients
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => router.push("/email/campaigns/new")} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvelle campagne
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campagnes</CardTitle>
          <CardDescription>Historique et statut d'envoi</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune campagne pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {campaigns.map(c => {
                const progress = c.total > 0 ? Math.round(((c.sent + c.failed) / c.total) * 100) : 0
                return (
                  <div key={c.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-lg">{c.name}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Sujet : {c.subject} · {c._count?.recipients || c.total} destinataire(s)
                        </div>
                        <div className="flex items-center gap-3 text-sm mb-3">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" /> {c.sent} envoyé(s)
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-red-600" /> {c.failed} échec(s)
                          </span>
                          <span className="text-muted-foreground">
                            Statut : <strong>{c.status}</strong>
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        {c.sentAt && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Envoyée le {format(new Date(c.sentAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {c.status !== 'sent' && (
                          <Button
                            size="sm"
                            onClick={() => sendCampaign(c.id)}
                            disabled={sendingId === c.id}
                            className="gap-2"
                          >
                            {sendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Lancer
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deleteCampaign(c.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
