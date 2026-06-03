"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DevisForm } from "@/components/devis-form"

function NewDevisInner() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('clientId') || undefined
  return <DevisForm mode="new" initialClientId={clientId} />
}

export default function NewDevisPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement...</div>}>
      <NewDevisInner />
    </Suspense>
  )
}
