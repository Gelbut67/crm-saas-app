"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DevisForm } from "@/components/devis-form"

export default function EditDevisPage() {
  const params = useParams()
  const [initialData, setInitialData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/devis/${params.id}`)
      .then(r => r.json())
      .then(data => {
        // Parser les lignes JSON
        let lignes = []
        try { lignes = JSON.parse(data.lignes || "[]") } catch {}
        setInitialData({ ...data, lignes })
      })
      .catch(() => setError("Impossible de charger le devis"))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error || !initialData) {
    return <div className="p-6 text-red-500">{error || "Devis introuvable"}</div>
  }

  return <DevisForm mode="edit" initialData={initialData} />
}