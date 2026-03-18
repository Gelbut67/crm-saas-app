"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, FileText } from "lucide-react"

interface Devis {
  id: string
  titre: string
  montant: number
  statut: 'en_cours' | 'gagne' | 'facture' | 'perdu'
  dateEcheance: string
  dateCreation: string
  client: {
    nom: string
    entreprise?: string
  }
}

const pipelineData = [
  {
    month: 'Jan',
    en_cours: 25000,
    gagne: 15000,
    perdu: 8000,
    total: 48000
  },
  {
    month: 'Fév',
    en_cours: 30000,
    gagne: 18000,
    perdu: 5000,
    total: 53000
  },
  {
    month: 'Mar',
    en_cours: 45000,
    gagne: 28000,
    perdu: 12000,
    total: 85000
  },
  {
    month: 'Avr',
    en_cours: 38000,
    gagne: 22000,
    perdu: 7000,
    total: 67000
  },
  {
    month: 'Mai',
    en_cours: 52000,
    gagne: 31000,
    perdu: 9000,
    total: 92000
  },
  {
    month: 'Juin',
    en_cours: 48000,
    gagne: 35000,
    perdu: 11000,
    total: 94000
  }
]

const statutRepartition = [
  { name: 'En cours', value: 48000, color: '#3b82f6', count: 12 },
  { name: 'Gagné', value: 35000, color: '#10b981', count: 8 },
  { name: 'Perdu', value: 11000, color: '#ef4444', count: 3 }
]

const conversionTaux = [
  { month: 'Jan', taux: 31 },
  { month: 'Fév', taux: 34 },
  { month: 'Mar', taux: 33 },
  { month: 'Avr', taux: 33 },
  { month: 'Mai', taux: 34 },
  { month: 'Juin', taux: 37 }
]

const recentDeals = [
  {
    titre: "Développement Site E-commerce",
    client: "Jean Dupont - Tech Solutions",
    montant: 15000,
    statut: "gagne",
    date: "2024-06-15"
  },
  {
    titre: "Application Mobile iOS",
    client: "Marie Martin - Services Plus",
    montant: 8000,
    statut: "en_cours",
    date: "2024-06-20"
  },
  {
    titre: "Maintenance Annuelle",
    client: "Pierre Bernard - Commerce International",
    montant: 3000,
    statut: "perdu",
    date: "2024-06-10"
  },
  {
    titre: "Refonte Design UI/UX",
    client: "Sophie Petit - Digital Agency",
    montant: 12000,
    statut: "en_cours",
    date: "2024-06-25"
  }
]

function getStatutBadge(statut: string) {
  switch (statut) {
    case 'gagne':
      return <Badge className="bg-green-100 text-green-800">Gagné</Badge>
    case 'facture':
      return <Badge className="bg-purple-100 text-purple-800">Facturé</Badge>
    case 'perdu':
      return <Badge className="bg-red-100 text-red-800">Perdu</Badge>
    case 'en_cours':
      return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
    default:
      return <Badge variant="outline">{statut}</Badge>
  }
}

function getStatutIcon(statut: string) {
  switch (statut) {
    case 'gagne':
      return <TrendingUp className="h-4 w-4 text-green-600" />
    case 'facture':
      return <FileText className="h-4 w-4 text-purple-600" />
    case 'perdu':
      return <TrendingDown className="h-4 w-4 text-red-600" />
    case 'en_cours':
      return <Target className="h-4 w-4 text-blue-600" />
    default:
      return <Target className="h-4 w-4" />
  }
}

export default function PipelinePage() {
  const [devis, setDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDevis()
  }, [])

  const loadDevis = () => {
    try {
      const savedDevis = localStorage.getItem('devis')
      if (savedDevis) {
        const parsedDevis = JSON.parse(savedDevis)
        setDevis(parsedDevis)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des devis:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculer les données réelles
  const enCoursDevis = devis.filter(d => d.statut === 'en_cours')
  const gagneDevis = devis.filter(d => d.statut === 'gagne')
  const factureDevis = devis.filter(d => d.statut === 'facture')
  const perduDevis = devis.filter(d => d.statut === 'perdu')
  
  const totalEnCours = enCoursDevis.reduce((sum, d) => sum + d.montant, 0)
  const totalGagne = gagneDevis.reduce((sum, d) => sum + d.montant, 0)
  const totalFacture = factureDevis.reduce((sum, d) => sum + d.montant, 0)
  const totalPerdu = perduDevis.reduce((sum, d) => sum + d.montant, 0)
  
  const tauxConversion = devis.length > 0 ? Math.round((gagneDevis.length / devis.length) * 100) : 0

  // Calculer les données mensuelles du pipeline
  const calculateMonthlyPipelineData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    const result = []
    
    // Calculer pour les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const targetMonth = (currentMonth - i + 12) % 12
      const targetYear = currentMonth - i >= 0 ? currentYear : currentYear - 1
      
      const monthName = months[targetMonth]
      
      // Filtrer les devis pour ce mois
      const monthDevis = devis.filter((d: any) => {
        if (!d.dateCreation) return false
        const devisDate = new Date(d.dateCreation)
        return devisDate.getMonth() === targetMonth && devisDate.getFullYear() === targetYear
      })
      
      // Calculer les totaux par statut
      const enCoursTotal = monthDevis
        .filter((d: any) => d.statut === 'en_cours')
        .reduce((sum: number, d: any) => sum + (d.montant || 0), 0)
      
      const gagneTotal = monthDevis
        .filter((d: any) => d.statut === 'gagne')
        .reduce((sum: number, d: any) => sum + (d.montant || 0), 0)
      
      const factureTotal = monthDevis
        .filter((d: any) => d.statut === 'facture')
        .reduce((sum: number, d: any) => sum + (d.montant || 0), 0)
      
      const perduTotal = monthDevis
        .filter((d: any) => d.statut === 'perdu')
        .reduce((sum: number, d: any) => sum + (d.montant || 0), 0)
      
      const total = enCoursTotal + gagneTotal + factureTotal + perduTotal
      
      console.log(`${monthName} ${targetYear}: En cours=${enCoursTotal}, Gagné=${gagneTotal}, Facturé=${factureTotal}, Perdu=${perduTotal}, Total=${total}`)
      
      result.push({
        month: monthName,
        en_cours: enCoursTotal,
        gagne: gagneTotal,
        facture: factureTotal,
        perdu: perduTotal,
        total: total
      })
    }
    
    return result
  }

  // Données pour les graphiques (basées sur les données réelles)
  const pipelineData = calculateMonthlyPipelineData()

  const statutRepartition = [
    { name: 'En cours', value: totalEnCours, color: '#3b82f6', count: enCoursDevis.length },
    { name: 'Gagné', value: totalGagne, color: '#10b981', count: gagneDevis.length },
    { name: 'Perdu', value: totalPerdu, color: '#ef4444', count: perduDevis.length }
  ]

  const [conversionTaux, setConversionTaux] = useState<any[]>([])

  // Calculer les taux de conversion des devis (devis gagnés vs total devis)
  const calculateMonthlyConversionRates = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    // Charger les devis depuis localStorage
    const allDevis = JSON.parse(localStorage.getItem('devis') || '[]')
    
    console.log('=== PIPELINE DEAL CONVERSION CALCULATION ===')
    console.log('Current date:', currentDate.toLocaleDateString('fr-FR'))
    console.log('Current month:', currentMonth, '(', months[currentMonth], ')')
    console.log('Total devis:', allDevis.length)
    
    // Afficher les détails des devis
    console.log('Devis details:')
    allDevis.forEach((d: any) => {
      console.log(`  - ${d.titre} (${d.dateCreation}) - ${d.statut} - ${d.montant}€`)
    })
    
    // Calculer pour les 6 derniers mois
    const result = []
    for (let i = 5; i >= 0; i--) {
      const targetMonth = (currentMonth - i + 12) % 12
      const targetYear = currentMonth - i >= 0 ? currentYear : currentYear - 1
      
      const monthName = months[targetMonth]
      
      // Devis créés ce mois
      const monthDevis = allDevis.filter((d: any) => {
        if (!d.dateCreation) return false
        const devisDate = new Date(d.dateCreation)
        return devisDate.getMonth() === targetMonth && devisDate.getFullYear() === targetYear
      })
      
      // Devis gagnés ce mois
      const monthWonDevis = monthDevis.filter((d: any) => d.statut === 'gagne')
      
      const totalDevis = monthDevis.length
      const wonDevis = monthWonDevis.length
      
      const rate = totalDevis > 0 ? Math.round((wonDevis / totalDevis) * 100) : 0
      
      console.log(`${monthName} ${targetYear}: ${totalDevis} devis, ${wonDevis} gagnés → ${rate}%`)
      
      result.push({
        month: monthName,
        taux: rate
      })
    }
    
    console.log('Final deal conversion rates:', result)
    console.log('=== END CALCULATION ===')
    
    return result
  }

  useEffect(() => {
    // Recharger les données et mettre à jour le graphique
    const reloadData = () => {
      const savedDevis = localStorage.getItem('devis')
      if (savedDevis) {
        const parsedDevis = JSON.parse(savedDevis)
        setDevis(parsedDevis)
      }
      
      // Recalculer les taux de conversion
      const newRates = calculateMonthlyConversionRates()
      setConversionTaux(newRates)
      console.log('Updated conversion rates:', newRates)
    }

    // Charger au démarrage
    reloadData()

    // Recharger périodiquement pour détecter les changements
    const interval = setInterval(reloadData, 2000) // Toutes les 2 secondes

    // Écouter les événements de devis
    const handleDevisChange = () => {
      console.log('Devis event received, reloading data')
      reloadData()
    }

    window.addEventListener('devisAdded', handleDevisChange)
    window.addEventListener('devisUpdated', handleDevisChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('devisAdded', handleDevisChange)
      window.removeEventListener('devisUpdated', handleDevisChange)
    }
  }, [])

  const recentDeals = devis.slice(-5).reverse().map(d => ({
    titre: d.titre,
    client: `${d.client.nom} - ${d.client.entreprise || 'N/A'}`,
    montant: d.montant,
    statut: d.statut,
    date: d.dateCreation
  }))

  // Définir les objectifs annuels
  const objectifAnnuel = 500000
  const realiseAnnuel = totalGagne

  // Calculer la durée moyenne du cycle (en jours)
  const calculateAverageCycleDuration = () => {
    if (devis.length === 0) return 0
    
    const completedDeals = devis.filter(d => d.statut === 'gagne' || d.statut === 'perdu')
    if (completedDeals.length === 0) return 0
    
    const totalDuration = completedDeals.reduce((sum, deal) => {
      const creationDate = new Date(deal.dateCreation)
      const today = new Date()
      const duration = Math.floor((today.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
      return sum + duration
    }, 0)
    
    return Math.round(totalDuration / completedDeals.length)
  }

  // Calculer le taux de croissance
  const calculateGrowthRate = () => {
    if (devis.length === 0) return 0
    
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const currentMonthDeals = devis.filter(d => {
      const dealDate = new Date(d.dateCreation)
      return dealDate.getMonth() === currentMonth && dealDate.getFullYear() === currentYear
    })
    
    const previousMonthDeals = devis.filter(d => {
      const dealDate = new Date(d.dateCreation)
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
      return dealDate.getMonth() === previousMonth && dealDate.getFullYear() === previousYear
    })
    
    const currentMonthValue = currentMonthDeals.reduce((sum, d) => sum + d.montant, 0)
    const previousMonthValue = previousMonthDeals.reduce((sum, d) => sum + d.montant, 0)
    
    if (previousMonthValue === 0) return currentMonthValue > 0 ? 100 : 0
    
    return Math.round(((currentMonthValue - previousMonthValue) / previousMonthValue) * 100)
  }

  const averageCycleDuration = calculateAverageCycleDuration()
  const growthRate = calculateGrowthRate()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des données du pipeline...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pipeline Commercial</h1>
        <p className="text-muted-foreground">
          Analyse de votre cycle de vente et performances
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline actuel</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnCours.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground">
              {statutRepartition.find(s => s.name === 'En cours')?.count} devis en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis gagnés</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGagne.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground">
              {statutRepartition.find(s => s.name === 'Gagné')?.count} devis gagnés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tauxConversion}%</div>
            <p className="text-xs text-muted-foreground">
              {tauxConversion >= 35 ? 'Excellent' : 'À améliorer'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectif annuel</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((realiseAnnuel / objectifAnnuel) * 100)}%</div>
            <Progress value={(realiseAnnuel / objectifAnnuel) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {realiseAnnuel.toLocaleString()} € / {objectifAnnuel.toLocaleString()} €
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Évolution du Pipeline</CardTitle>
            <CardDescription>
              Montants par statut sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} €`} />
                <Bar dataKey="en_cours" stackId="a" fill="#3b82f6" name="En cours" />
                <Bar dataKey="gagne" stackId="a" fill="#10b981" name="Gagné" />
                <Bar dataKey="perdu" stackId="a" fill="#ef4444" name="Perdu" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par Statut</CardTitle>
            <CardDescription>
              Distribution actuelle du pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statutRepartition}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, count }) => `${name}: ${value.toLocaleString()} € (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statutRepartition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()} €`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Taux de Conversion des Devis</CardTitle>
            <CardDescription>
              Évolution du taux de conversion des devis (gagnés/réalisés) sur 6 mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={conversionTaux}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="taux" fill="#8b5cf6" name="Taux de conversion" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Devis Récents</CardTitle>
            <CardDescription>
              Les dernières opportunités du pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDeals.map((deal, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatutIcon(deal.statut)}
                      <h4 className="font-medium text-sm">{deal.titre}</h4>
                      {getStatutBadge(deal.statut)}
                    </div>
                    <p className="text-xs text-muted-foreground">{deal.client}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{deal.montant.toLocaleString()} €</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(deal.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Globale</CardTitle>
          <CardDescription>
            Indicateurs clés de votre pipeline commercial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Valeur moyenne par devis</h4>
              <p className="text-2xl font-bold">
                {Math.round((totalEnCours + totalGagne + totalPerdu) / statutRepartition.reduce((sum, s) => sum + s.count, 0)).toLocaleString()} €
              </p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Durée moyenne du cycle</h4>
              <p className="text-2xl font-bold">{averageCycleDuration} jours</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Taux de croissance</h4>
              <p className={`text-2xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthRate >= 0 ? '+' : ''}{growthRate}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
