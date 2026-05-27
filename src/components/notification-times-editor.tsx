"use client"

import { Input } from "@/components/ui/input"
import { Bell, Plus, X } from "lucide-react"

const PRESETS = [
  { key: 'moment',  label: 'À l\'échéance',  offset: 0 },
  { key: '15min',   label: '15 min avant',   offset: -15 * 60 * 1000 },
  { key: '1h',      label: '1h avant',       offset: -60 * 60 * 1000 },
  { key: '3h',      label: '3h avant',       offset: -3 * 60 * 60 * 1000 },
  { key: 'matin',   label: 'Matin 9h (J)',   offset: null, special: 'matin' },
  { key: 'veille',  label: 'Veille 18h',     offset: null, special: 'veille' },
  { key: 'j1',      label: '1 jour avant',   offset: -24 * 60 * 60 * 1000 },
  { key: 'j3',      label: '3 jours avant',  offset: -3 * 24 * 60 * 60 * 1000 },
  { key: 'j7',      label: '1 semaine avant',offset: -7 * 24 * 60 * 60 * 1000 },
]

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function computePreset(echeance: string, preset: typeof PRESETS[0]): string {
  const base = new Date(echeance)
  if (preset.offset !== null) {
    return toDatetimeLocal(new Date(base.getTime() + preset.offset))
  }
  if (preset.special === 'matin') {
    return toDatetimeLocal(new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0))
  }
  if (preset.special === 'veille') {
    return toDatetimeLocal(new Date(base.getFullYear(), base.getMonth(), base.getDate() - 1, 18, 0))
  }
  return toDatetimeLocal(base)
}

interface Props {
  times: string[]
  onChange: (times: string[]) => void
  echeance: string
}

export function NotificationTimesEditor({ times, onChange, echeance }: Props) {
  const addPreset = (preset: typeof PRESETS[0]) => {
    if (!echeance) return
    const val = computePreset(echeance, preset)
    if (times.includes(val)) return
    onChange([...times, val])
  }

  const add = () => {
    const val = echeance ? toDatetimeLocal(new Date(echeance)) : ''
    onChange([...times, val])
  }

  const update = (idx: number, val: string) =>
    onChange(times.map((t, i) => (i === idx ? val : t)))

  const remove = (idx: number) =>
    onChange(times.filter((_, i) => i !== idx))

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Bell className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Notifications</span>
      </div>

      {/* Raccourcis */}
      <div className="flex flex-wrap gap-1">
        {PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            disabled={!echeance}
            onClick={() => addPreset(p)}
            className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/40 hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Liste des notifications personnalisées */}
      {times.length > 0 && (
        <div className="space-y-1.5 mt-1">
          {times.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
              <Input
                type="datetime-local"
                value={t}
                onChange={e => update(i, e.target.value)}
                className="flex-1 h-7 text-xs"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-muted-foreground hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
      >
        <Plus className="w-3 h-3" />
        Ajouter une notification personnalisée
      </button>

      {times.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic">
          Aucune notification programmée — utilisez un raccourci ou ajoutez une date
        </p>
      )}
    </div>
  )
}
