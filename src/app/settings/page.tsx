"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Save, Target, TrendingUp, Home, KeyRound, Eye, EyeOff, Mail, PenLine } from "lucide-react"

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
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [signatureEmail, setSignatureEmail] = useState('')
  const [savedSignature, setSavedSignature] = useState(false)

  const handleChangePassword = async () => {
    setPasswordError('')
    if (newPassword !== confirmPassword) { setPasswordError('Les mots de passe ne correspondent pas'); return }
    if (newPassword.length < 6) { setPasswordError('Minimum 6 caractères'); return }
    setSavingPassword(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setPasswordError(data.error || 'Erreur'); return }
      setPasswordSuccess(true)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } finally {
      setSavingPassword(false)
    }
  }

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
    
    // Charger la signature email
    const loadSignature = async () => {
      try {
        const response = await fetch('/api/settings?key=signatureEmail')
        if (response.ok) {
          const data = await response.json()
          if (data.value) setSignatureEmail(data.value)
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la signature:", error)
      }
    }

    loadObjectifs()
    loadAdresse()
    loadSignature()
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

  const handleSaveSignature = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'signatureEmail',
          value: signatureEmail
        })
      })

      if (response.ok) {
        setSavedSignature(true)
        setTimeout(() => setSavedSignature(false), 2000)
      } else {
        console.error("Erreur lors de la sauvegarde de la signature")
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la signature:", error)
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Signature email IA
          </CardTitle>
          <CardDescription>
            Cette signature sera ajoutée automatiquement aux emails générés par l'IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="signatureEmail">Signature</Label>
            <Textarea
              id="signatureEmail"
              placeholder="Ex: Cordialement,\nJean Dupont\nBelle Etiquette\n06 12 34 56 78"
              value={signatureEmail}
              onChange={(e) => setSignatureEmail(e.target.value)}
              rows={5}
            />
          </div>

          <div className="border-t pt-4">
            <Button
              onClick={handleSaveSignature}
              className="w-full relative"
            >
              <Save className="w-4 h-4 mr-2" />
              {savedSignature ? "Sauvegardé !" : "Sauvegarder la signature"}
              {savedSignature && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500 text-white rounded-md">
                  <PenLine className="h-4 w-4" />
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Changer mon mot de passe
          </CardTitle>
          <CardDescription>
            Modifiez votre mot de passe de connexion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <div className="relative mt-1">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative mt-1">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmer</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Répéter"
                autoComplete="new-password"
                className="mt-1"
              />
            </div>
          </div>

          {passwordError && (
            <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
          )}

          <div className="border-t pt-4">
            <Button onClick={handleChangePassword} disabled={savingPassword} className="relative">
              <KeyRound className="mr-2 h-4 w-4" />
              {passwordSuccess ? 'Mot de passe modifié !' : savingPassword ? 'Enregistrement...' : 'Changer le mot de passe'}
              {passwordSuccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500 text-white rounded-md text-sm font-medium">
                  ✓ Modifié avec succès
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
