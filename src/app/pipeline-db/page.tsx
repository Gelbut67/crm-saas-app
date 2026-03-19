"use client"

import { useDevis } from "@/hooks/useDatabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, FileText, CheckCircle, XCircle, Clock } from "lucide-react"

export default function PipelinePage() {
  const { devis, loading } = useDevis()

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  // Calculer les statistiques
  const stats = {
    total: devis.length,
    enCours: devis.filter(d => d.statut === 'en_cours').length,
    gagnes: devis.filter(d => d.statut === 'gagne').length,
    perdus: devis.filter(d => d.statut === 'perdu').length,
    caEnCours: devis.filter(d => d.statut === 'en_cours').reduce((sum, d) => sum + d.montant, 0),
    caGagne: devis.filter(d => d.statut === 'gagne').reduce((sum, d) => sum + d.montant, 0),
    caPerdu: devis.filter(d => d.statut === 'perdu').reduce((sum, d) => sum + d.montant, 0),
  }

  const tauxConversion = stats.total > 0 ? Math.round((stats.gagnes / stats.total) * 100) : 0

  // Données pour le graphique pipeline
  const pipelineData = [
    { name: 'En cours', value: stats.caEnCours, count: stats.enCours, color: '#3b82f6' },
    { name: 'Gagné', value: stats.caGagne, count: stats.gagnes, color: '#10b981' },
    { name: 'Perdu', value: stats.caPerdu, count: stats.perdus, color: '#ef4444' },
  ]

  // Données pour le graphique mensuel
  const monthlyData = []
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
  const currentMonth = new Date().getMonth()
  
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12
    const monthDevis = devis.filter(d => {
      const devisMonth = new Date(d.dateCreation).getMonth()
      return devisMonth === monthIndex && d.statut === 'gagne'
    })
    
    monthlyData.push({
      month: months[monthIndex],
      montant: monthDevis.reduce((sum, d) => sum + d.montant, 0),
      count: monthDevis.length
    })
  }

  return (
    <div className="p-6 animate-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pipeline des ventes</h1>
        <p className="text-muted-foreground">
          Suivi de vos devis et performance commerciale
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total devis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.enCours} en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA en cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.caEnCours.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground">
              {stats.enCours} devis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA gagné</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.caGagne.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground">
              {stats.gagnes} devis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tauxConversion}%</div>
            <Progress value={tauxConversion} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pipeline par statut */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline par statut</CardTitle>
            <CardDescription>
              Répartition du chiffre d'affaires par statut
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
                  label={({ name, value, count }) => `${name}: ${value.toLocaleString()} € (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} €`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Évolution mensuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution mensuelle</CardTitle>
            <CardDescription>
              Chiffre d'affaires gagné sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} €`} />
                <Bar dataKey="montant" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Derniers devis */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Derniers devis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {devis.slice(0, 5).map((devi) => (
              <div key={devi.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{devi.titre}</p>
                  <p className="text-sm text-muted-foreground">
                    {devi.client.nom} {devi.client.entreprise && `- ${devi.client.entreprise}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{devi.montant.toLocaleString()} €</p>
                  <div className="flex items-center gap-1 justify-end">
                    {devi.statut === 'gagne' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {devi.statut === 'perdu' && <XCircle className="w-4 h-4 text-red-600" />}
                    {devi.statut === 'en_cours' && <Clock className="w-4 h-4 text-blue-600" />}
                    <span className="text-sm capitalize">{devi.statut.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
