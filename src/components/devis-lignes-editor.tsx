"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react"

export interface Ligne {
  id: string
  texte: string
  style: 'normal' | 'bold' | 'colored'
}

interface Props {
  lignes: Ligne[]
  onChange: (lignes: Ligne[]) => void
}

const newId = () => Math.random().toString(36).slice(2, 9)

const STYLE_LABELS: Record<Ligne['style'], string> = {
  normal: 'Normal',
  bold: 'Gras',
  colored: 'Coloré (orange)',
}

export function DevisLignesEditor({ lignes, onChange }: Props) {
  const update = (id: string, field: keyof Ligne, value: string) => {
    onChange(lignes.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  const remove = (id: string) => onChange(lignes.filter(l => l.id !== id))

  const add = () => onChange([...lignes, { id: newId(), texte: '', style: 'normal' }])

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...lignes]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    onChange(arr)
  }

  const styleColor = (style: Ligne['style']) => {
    if (style === 'bold') return 'font-bold uppercase'
    if (style === 'colored') return 'font-bold text-orange-600'
    return ''
  }

  return (
    <div className="space-y-2">
      {lignes.map((ligne, idx) => (
        <div key={ligne.id} className="flex items-center gap-2 group">
          {/* Numéro */}
          <span className="text-xs text-muted-foreground w-5 text-center flex-shrink-0">{idx + 1}</span>

          {/* Texte */}
          <Input
            value={ligne.texte}
            onChange={e => update(ligne.id, 'texte', e.target.value)}
            placeholder="Texte de la ligne..."
            className={`flex-1 text-sm ${styleColor(ligne.style)}`}
          />

          {/* Style */}
          <Select
            value={ligne.style}
            onValueChange={v => update(ligne.id, 'style', v)}
          >
            <SelectTrigger className="w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STYLE_LABELS) as Ligne['style'][]).map(s => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STYLE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Déplacer */}
          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => move(idx, -1)}>
              <ArrowUp className="w-3 h-3" />
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => move(idx, 1)}>
              <ArrowDown className="w-3 h-3" />
            </Button>
          </div>

          {/* Supprimer */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 flex-shrink-0"
            onClick={() => remove(ligne.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add} className="w-full mt-2">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter une ligne
      </Button>

      {/* Aperçu rapide */}
      {lignes.length > 0 && (
        <div className="mt-3 p-3 border rounded-md bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Aperçu :</p>
          <ul className="list-disc list-inside space-y-0.5">
            {lignes.map(l => (
              <li key={l.id} className={`text-xs ${styleColor(l.style)}`}>
                {l.texte || <span className="text-muted-foreground italic">— vide —</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
