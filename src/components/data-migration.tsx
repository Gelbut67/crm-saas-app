"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function DataMigration() {
  const router = useRouter()

  useEffect(() => {
    // Vérifier si la migration a déjà été faite
    const migrationDone = localStorage.getItem('migration-to-db-done')
    
    if (!migrationDone) {
      console.log('Début de la migration des données...')
      
      // Nettoyer toutes les données localStorage
      const keysToClear = [
        'clients',
        'prospects', 
        'devis',
        'interactions_',
        'notifications',
        'objectifsCA',
        'conversionRateLastReset'
      ]
      
      keysToClear.forEach(key => {
        if (key === 'interactions_') {
          // Nettoyer toutes les interactions individuelles
          for (let i = 0; i < localStorage.length; i++) {
            const storageKey = localStorage.key(i)
            if (storageKey && storageKey.startsWith('interactions_')) {
              localStorage.removeItem(storageKey)
            }
          }
        } else {
          localStorage.removeItem(key)
        }
      })
      
      // Marquer la migration comme terminée
      localStorage.setItem('migration-to-db-done', 'true')
      
      console.log('Migration terminée, localStorage nettoyé')
      
      // Recharger la page pour prendre en compte les changements
      window.location.reload()
    }
  }, [router])

  // Ce composant ne rend rien
  return null
}
