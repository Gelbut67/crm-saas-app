"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save, Target, TrendingUp, Home, Loader2 } from "lucide-react"

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
  const [adresseDomicile, setAdresseDomicile] = useState('')
  const [villeDomicile, setVilleDomicile] = useState('')
  const [codePostalDomicile, setCodePostalDomicile] = useState('')
  const [savedAdresse, setSavedAdresse] = useState(false)

  useEffect(() => {
    // Charger les objectifs depuis l'API
    const loadObjectifs = async () => {
      try {
        const response = await fetch('/api/settings?key=objectifsCA')
        if (response.ok) {
          const data = await response.json()
          setObjectifs(data.value)
        } else if (response.status === 404) {
          // Paramètre non trouvé, utiliser les valeurs par défaut
          console.log('Utilisation des objectifs par défaut')
        }
      } catch (error) {
        console.error("Erreur lors du chargement des objectifs:", error)
      }
    }
    
    // Charger l'adresse du domicile
    const loadAdresse = async () => {
      try {
        const response = await fetch('/api/settings?key=adresse_domicile')
        if (response.ok) {
          const data = await response.json()
          if (data.value) {
            setAdresseDomicile(data.value.adresse || '')
            setVilleDomicile(data.value.ville || '')
            setCodePostalDomicile(data.value.codePostal || '')
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'adresse:", error)
      }
    }
    
    loadObjectifs()
    loadAdresse()
  }, [])

  const handleSave = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'objectifsCA',
          value: objectifs
        })
      })

      if (response.ok) {
        // Déclencher un événement pour notifier les autres pages
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('objectifsUpdated', { detail: objectifs }))
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        console.error("Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
    }
  }

  const handleSaveAdresse = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'adresse_domicile',
          value: {
            adresse: adresseDomicile,
            ville: villeDomicile,
            codePostal: codePostalDomicile
          }
        })
      })

      if (response.ok) {
        setSavedAdresse(true)
        setTimeout(() => setSavedAdresse(false), 2000)
      } else {
        console.error("Erreur lors de la sauvegarde de l'adresse")
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'adresse:", error)
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Adresse du domicile
          </CardTitle>
          <CardDescription>
            Cette adresse sera utilisée comme point de départ pour vos tournées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              placeholder="Ex: 123 rue de la Paix"
              value={adresseDomicile}
              onChange={(e) => setAdresseDomicile(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ville">Ville</Label>
              <Input
                id="ville"
                placeholder="Paris"
                value={villeDomicile}
                onChange={(e) => setVilleDomicile(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="codePostal">Code postal</Label>
              <Input
                id="codePostal"
                placeholder="75001"
                value={codePostalDomicile}
                onChange={(e) => setCodePostalDomicile(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <Button 
              onClick={handleSaveAdresse} 
              className="w-full relative"
            >
              <Save className="w-4 h-4 mr-2" />
              {savedAdresse ? "Sauvegardé !" : "Sauvegarder l'adresse"}
              {savedAdresse && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500 text-white rounded-md">
                  <Home className="h-4 w-4" />
                </div>
              )}
            </Button>
          </div>

          {adresseDomicile && villeDomicile && codePostalDomicile && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">Adresse enregistrée :</p>
              <p className="text-sm text-muted-foreground">
                {adresseDomicile}, {codePostalDomicile} {villeDomicile}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
