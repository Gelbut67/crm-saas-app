"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, FileText, DollarSign, Plus } from 'lucide-react'
import Link from "next/link"
import { useObjectifsCA } from "@/hooks/useObjectifsCA"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function pour formater les dates
const formatDate = (date: Date | string) => {
  const d = new Date(date)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - d.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`
  return `Il y a ${Math.floor(diffDays / 365)} an(s)`
}

interface Client {
  id: string
  nomEntreprise: string
  secteur?: string
  caTotal: number
  dateCreation: Date | string
  contacts: Array<{
    nom: string
    email?: string
    telephone?: string
  }>
}

interface Devis {
  id: string
  titre: string
  montant: number
  statut: 'en_cours' | 'gagne' | 'perdu'
  dateEcheance: string
  dateCreation: string
  client: {
    nom: string
    entreprise?: string
  }
}

interface Prospect {
  id: string
  nomEntreprise: string
  secteur?: string
  dateCreation: Date | string
  contacts: Array<{
    nom: string
    email?: string
    telephone?: string
  }>
}

export function Dashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [devis, setDevis] = useState<Devis[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const objectifs = useObjectifsCA()

  useEffect(() => {
    loadData()
    
    // Écouter les mises à jour pour actualiser en temps réel
    const handleDataUpdate = () => {
      loadData()
    }
    
    window.addEventListener('clientUpdated', handleDataUpdate)
    window.addEventListener('devisUpdated', handleDataUpdate)
    
    return () => {
      window.removeEventListener('clientUpdated', handleDataUpdate)
      window.removeEventListener('devisUpdated', handleDataUpdate)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Charger les données depuis la base de données
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
        setDevis(data.devis || [])
        setProspects(data.prospects || [])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculer les statistiques réelles
  const caTotal = devis.filter(d => d.statut === 'gagne').reduce((sum, d) => sum + d.montant, 0)
  const clientsActifs = clients.length
  const devisEnCours = devis.filter(d => d.statut === 'en_cours').reduce((sum, d) => sum + d.montant, 0)
  const tauxConversion = devis.length > 0 ? Math.round((devis.filter(d => d.statut === 'gagne').length / devis.length) * 100) : 0

  // Données pour le graphique pipeline
  const pipelineData = [
    { name: 'En cours', value: devis.filter(d => d.statut === 'en_cours').reduce((sum, d) => sum + d.montant, 0), color: '#3b82f6' },
    { name: 'Gagné', value: devis.filter(d => d.statut === 'gagne').reduce((sum, d) => sum + d.montant, 0), color: '#10b981' },
    { name: 'Perdu', value: devis.filter(d => d.statut === 'perdu').reduce((sum, d) => sum + d.montant, 0), color: '#ef4444' },
  ]

  // Calculer les données mensuelles réelles du CA
  const calculateMonthlyCA = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    
    const result = []
    
    // Calculer pour les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentDate.getMonth() - i, 1)
      const monthName = months[targetDate.getMonth()]
      const targetYear = targetDate.getFullYear()
      
      // Filtrer les devis gagnés pour ce mois
      const monthDevis = devis.filter(d => {
        if (!d.dateCreation) return false
        const devisDate = new Date(d.dateCreation)
        return devisDate.getMonth() === targetDate.getMonth() && 
               devisDate.getFullYear() === targetYear &&
               d.statut === 'gagne'
      })
      
      // Calculer le CA total pour ce mois
      const caMensuel = monthDevis.reduce((sum, d) => sum + d.montant, 0)
      
      result.push({
        month: monthName,
        montant: caMensuel,
        objectif: objectifs.mensuel
      })
    }
    
    return result
  }
  
  // Données pour le graphique CA (basées sur les vraies données)
  const caData = calculateMonthlyCA()

  const stats = [
    {
      title: "CA Total",
      value: `${caTotal.toLocaleString()} €`,
      description: `${devis.filter(d => d.statut === 'gagne').length} devis gagnés / Objectif: ${objectifs.annuel.toLocaleString()} €`,
      icon: DollarSign,
      trend: caTotal > 0 ? "up" : "stable",
      progress: Math.min((caTotal / objectifs.annuel) * 100, 100)
    },
    {
      title: "Clients Actifs",
      value: clientsActifs.toString(),
      description: `${prospects.length} prospects en suivi`,
      icon: Users,
      trend: clientsActifs > 0 ? "up" : "stable"
    },
    {
      title: "Devis en cours",
      value: `${devisEnCours.toLocaleString()} €`,
      description: `${devis.filter(d => d.statut === 'en_cours').length} devis en attente`,
      icon: FileText,
      trend: devisEnCours > 0 ? "stable" : "down"
    },
    {
      title: "Taux de conversion",
      value: `${tauxConversion}%`,
      description: `${devis.filter(d => d.statut === 'gagne').length}/${devis.length} devis`,
      icon: TrendingUp,
      trend: tauxConversion > 50 ? "up" : "stable"
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des données...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Vue d'ensemble de votre activité commerciale
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="button-modern">
            <Link href="/devis/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau devis
            </Link>
          </Button>
          <Button asChild variant="outline" className="hover-lift">
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau client
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="card-modern animate-in hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              {stat.progress && (
                <div className="mt-3">
                  <Progress value={stat.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.progress.toFixed(1)}% de l'objectif atteint
                  </p>
                </div>
              )}
              {stat.trend === "up" && (
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">En hausse</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-modern animate-in hover-lift">
          <CardHeader>
            <CardTitle>Chiffre d'affaires vs Objectif</CardTitle>
            <CardDescription>
              Évolution mensuelle du CA par rapport à l'objectif annuel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={caData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="montant" fill="#3b82f6" name="CA Réalisé" />
                <Bar dataKey="objectif" fill="#e5e7eb" name="Objectif" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Commercial</CardTitle>
            <CardDescription>
              Répartition des devis par statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toLocaleString()} €`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Derniers clients</CardTitle>
            <CardDescription>
              Les 5 clients les plus récents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucun client</p>
              ) : (
                clients
                  .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
                  .slice(0, 5)
                  .map((client) => (
                    <div key={client.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{client.nomEntreprise || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{client.secteur || 'Non spécifié'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatDate(client.dateCreation)}</p>
                        <p className="text-xs text-muted-foreground">
                          {(client.caTotal || 0).toLocaleString()} €
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Devis récents</CardTitle>
            <CardDescription>
              Les 5 derniers devis créés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devis.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucun devis</p>
              ) : (
                devis
                  .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
                  .slice(0, 5)
                  .map((devisItem) => (
                    <div key={devisItem.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{devisItem.titre}</p>
                        <p className="text-sm text-muted-foreground">{devisItem.client?.nom || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{devisItem.montant.toLocaleString()} €</p>
                        <p className={`text-sm ${
                          devisItem.statut === 'gagne' ? 'text-green-600' :
                          devisItem.statut === 'perdu' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {devisItem.statut === 'en_cours' ? 'En cours' :
                           devisItem.statut === 'gagne' ? 'Gagné' : 'Perdu'}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
