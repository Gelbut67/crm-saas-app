"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

export interface Ligne {
  id: string
  designation: string
  quantite: string
  prix: string      // prix au mille (ou a l'unite selon settings)
  tva: string       // pourcentage TVA
}

export function calcLigne(l: Ligne) {
  const qt = parseFloat(l.quantite) || 0
  const prix = parseFloat(l.prix) || 0
  const tva = parseFloat(l.tva) || 0
  const totalHT = (qt / 1000) * prix
  const totalTVA = totalHT * (tva / 100)
  return { totalHT, totalTVA }
}

export function calcTotaux(lignes: Ligne[]) {
  return lignes.reduce(
    (acc, l) => {
      const { totalHT, totalTVA } = calcLigne(l)
      return { totalHT: acc.totalHT + totalHT, totalTVA: acc.totalTVA + totalTVA }
    },
    { totalHT: 0, totalTVA: 0 }
  )
}

const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20ac"

const newId = () => Math.random().toString(36).slice(2, 9)

interface Props {
  lignes: Ligne[]
  onChange: (lignes: Ligne[]) => void
  tvaTaux?: string  // taux TVA par defaut
}

export function DevisLignesEditor({ lignes, onChange, tvaTaux = "20" }: Props) {
  const update = (id: string, field: keyof Ligne, value: string) =>
    onChange(lignes.map(l => (l.id === id ? { ...l, [field]: value } : l)))

  const remove = (id: string) => onChange(lignes.filter(l => l.id !== id))

  const addPricing = () =>
    onChange([...lignes, { id: newId(), designation: "", quantite: "", prix: "", tva: tvaTaux }])

  const addDesc = () =>
    onChange([...lignes, { id: newId(), designation: "", quantite: "", prix: "", tva: "" }])

  const totaux = calcTotaux(lignes)
  const netAPayer = totaux.totalHT + totaux.totalTVA

  const isEmpty = (l: Ligne) => !l.quantite && !l.prix

  return (
    <div className="space-y-1">
      {/* En-tete du tableau */}
      <div className="grid grid-cols-[1fr_90px_90px_70px_90px_90px_32px] gap-1 px-2 py-1 bg-orange-600 text-white text-xs font-semibold rounded-t">
        <span>Désignation</span>
        <span className="text-center">Quantité</span>
        <span className="text-center">Prix/mille</span>
        <span className="text-center">%TVA</span>
        <span className="text-right">Total TVA</span>
        <span className="text-right">Total HT</span>
        <span></span>
      </div>

      {/* Lignes */}
      {lignes.map(l => {
        const { totalHT, totalTVA } = calcLigne(l)
        const hasValues = !!l.quantite || !!l.prix
        return (
          <div
            key={l.id}
            className="grid grid-cols-[1fr_90px_90px_70px_90px_90px_32px] gap-1 items-center border-b last:border-b-0 px-1 py-0.5"
          >
            <Input
              value={l.designation}
              onChange={e => update(l.id, "designation", e.target.value)}
              placeholder="Désignation..."
              className="h-7 text-sm border-0 bg-transparent focus-visible:ring-0 px-1"
            />
            <Input
              value={l.quantite}
              onChange={e => update(l.id, "quantite", e.target.value)}
              type="number"
              placeholder="—"
              className="h-7 text-sm text-center border-dashed"
            />
            <Input
              value={l.prix}
              onChange={e => update(l.id, "prix", e.target.value)}
              type="number"
              step="0.01"
              placeholder="—"
              className="h-7 text-sm text-center border-dashed"
            />
            <Input
              value={l.tva}
              onChange={e => update(l.id, "tva", e.target.value)}
              type="number"
              placeholder="—"
              className="h-7 text-sm text-center border-dashed"
            />
            <div className="text-right text-xs pr-1 text-muted-foreground">
              {hasValues && totalTVA > 0 ? fmt(totalTVA) : ""}
            </div>
            <div className="text-right text-xs pr-1 font-medium">
              {hasValues && totalHT > 0 ? fmt(totalHT) : ""}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
              onClick={() => remove(l.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )
      })}

      {/* Boutons ajout */}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={addPricing} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Ligne chiffrée
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addDesc} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Ligne description
        </Button>
      </div>

      {/* Totaux */}
      {(totaux.totalHT > 0 || totaux.totalTVA > 0) && (
        <div className="flex justify-end mt-3">
          <table className="text-sm border-collapse">
            <tbody>
              <tr className="border">
                <td className="px-4 py-1 bg-muted font-medium">Total HT</td>
                <td className="px-4 py-1 text-right min-w-[100px]">{fmt(totaux.totalHT)}</td>
              </tr>
              <tr className="border">
                <td className="px-4 py-1 bg-muted font-medium">Total TVA</td>
                <td className="px-4 py-1 text-right">{fmt(totaux.totalTVA)}</td>
              </tr>
              <tr className="border bg-orange-600 text-white">
                <td className="px-4 py-1 font-bold">Net à payer</td>
                <td className="px-4 py-1 text-right font-bold">{fmt(netAPayer)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
