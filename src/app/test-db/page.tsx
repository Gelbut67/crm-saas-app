"use client"

import { useState, useEffect } from 'react'

export default function TestDBPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test-db')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ 
        success: false, 
        error: 'Erreur réseau: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test de connexion Base de Données</h1>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Test en cours...' : 'Tester la connexion'}
      </button>
      
      {result && (
        <div className="mt-6 p-4 border rounded">
          <h2 className="font-bold mb-2">Résultat:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>Instructions:</p>
        <ol className="list-decimal list-inside">
          <li>Cliquez sur "Tester la connexion"</li>
          <li>Ouvrez la console du navigateur (F12)</li>
          <li>Vérifiez les logs réseau et console</li>
          <li>Si erreur 500, vérifiez les logs Vercel Functions</li>
        </ol>
      </div>
    </div>
  )
}
