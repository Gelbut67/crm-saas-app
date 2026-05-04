"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Home, Save, Loader2 } from "lucide-react"

export default function ParametresPage() {
  const [adresseDomicile, setAdresseDomicile] = useState('')
  const [villeDomicile, setVilleDomicile] = useState('')
  const [codePostalDomicile, setCodePostalDomicile] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    chargerParametres()
  }, [])

  const chargerParametres = async () => {
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
      console.error('Erreur lors du chargement des paramètres:', error)
    } finally {
      setLoading(false)
    }
  }

  const sauvegarderParametres = async () => {
    setSaving(true)
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
        alert('✅ Paramètres sauvegardés avec succès !')
      } else {
        alert('❌ Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">Configurez vos préférences</p>
        </div>
        <Settings className="w-8 h-8 text-primary" />
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Adresse du domicile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
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

            <div className="pt-4">
              <Button 
                onClick={sauvegarderParametres} 
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>

            {adresseDomicile && villeDomicile && codePostalDomicile && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Adresse enregistrée :</p>
                <p className="text-sm text-muted-foreground">
                  {adresseDomicile}, {codePostalDomicile} {villeDomicile}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
