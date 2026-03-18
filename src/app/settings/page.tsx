"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save, Target, TrendingUp } from "lucide-react"

interface ObjectifsCA {
  mensuel: number
  annuel: number
}

export default function SettingsPage() {
  const [objectifs, setObjectifs] = useState<ObjectifsCA>({
    mensuel: 50000,
    annuel: 600000
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Charger les objectifs depuis localStorage
    const savedObjectifs = localStorage.getItem('objectifsCA')
    if (savedObjectifs) {
      try {
        const parsed = JSON.parse(savedObjectifs)
        setObjectifs(parsed)
      } catch (error) {
        console.error("Erreur lors du chargement des objectifs:", error)
      }
    }
  }, [])

  const handleSave = () => {
    try {
      localStorage.setItem('objectifsCA', JSON.stringify(objectifs))
      setSaved(true)
      
      // Déclencher un événement pour notifier les autres pages
      window.dispatchEvent(new CustomEvent('objectifsUpdated', { detail: objectifs }))
      
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Settings className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold">Réglages</h1>
          <p className="text-muted-foreground">
            Configurez vos objectifs et préférences
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objectifs de Chiffre d'Affaires
          </CardTitle>
          <CardDescription>
            Définissez vos objectifs de CA pour suivre vos performances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mensuel">Objectif CA Mensuel (€)</Label>
              <Input
                id="mensuel"
                type="number"
                value={objectifs.mensuel}
                onChange={(e) => setObjectifs({ ...objectifs, mensuel: parseFloat(e.target.value) || 0 })}
                placeholder="50000"
              />
              <p className="text-sm text-muted-foreground">
                Objectif à atteindre chaque mois
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annuel">Objectif CA Annuel (€)</Label>
              <Input
                id="annuel"
                type="number"
                value={objectifs.annuel}
                onChange={(e) => setObjectifs({ ...objectifs, annuel: parseFloat(e.target.value) || 0 })}
                placeholder="600000"
              />
              <p className="text-sm text-muted-foreground">
                Objectif à atteindre sur l'année
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Résumé des objectifs</p>
                <p className="text-sm text-muted-foreground">
                  Mensuel: {objectifs.mensuel.toLocaleString()} € | 
                  Annuel: {objectifs.annuel.toLocaleString()} €
                </p>
              </div>
              <Button onClick={handleSave} className="relative">
                <Save className="mr-2 h-4 w-4" />
                {saved ? "Sauvegardé !" : "Sauvegarder"}
                {saved && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500 text-white rounded-md">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">💡 Conseil</h4>
            <p className="text-sm text-muted-foreground">
              Vos objectifs sont utilisés dans le tableau de bord et les graphiques 
              pour visualiser votre progression. Assurez-vous qu'ils soient réalistes 
              et atteignables pour motiver votre équipe.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
