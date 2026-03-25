import { useState, useEffect, useCallback } from 'react'

// Hook pour les clients
export function useClients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadClients = useCallback(async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClients()
    
    // Écouter les événements de mise à jour
    const handleClientAdded = () => loadClients()
    const handleProspectConverted = () => loadClients()
    
    window.addEventListener('clientAdded', handleClientAdded)
    window.addEventListener('prospectConverted', handleProspectConverted)
    
    return () => {
      window.removeEventListener('clientAdded', handleClientAdded)
      window.removeEventListener('prospectConverted', handleProspectConverted)
    }
  }, [loadClients])

  const createClient = async (clientData: any) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })
      
      if (response.ok) {
        await loadClients()
        return true
      } else {
        const errorData = await response.json()
        console.error('Erreur API:', errorData)
        return false
      }
    } catch (error) {
      console.error('Erreur:', error)
      return false
    }
  }

  return { clients, loading, createClient, reload: loadClients }
}

// Hook pour les prospects
export function useProspects() {
  const [prospects, setProspects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadProspects = useCallback(async () => {
    try {
      const response = await fetch('/api/prospects')
      if (response.ok) {
        const data = await response.json()
        setProspects(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProspects()
    
    // Écouter les événements de mise à jour
    const handleProspectAdded = () => loadProspects()
    const handleProspectConverted = () => loadProspects()
    
    window.addEventListener('prospectAdded', handleProspectAdded)
    window.addEventListener('prospectConverted', handleProspectConverted)
    
    return () => {
      window.removeEventListener('prospectAdded', handleProspectAdded)
      window.removeEventListener('prospectConverted', handleProspectConverted)
    }
  }, [loadProspects])

  const createProspect = async (prospectData: any) => {
    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prospectData),
      })
      
      if (response.ok) {
        await loadProspects()
        return true
      } else {
        const errorData = await response.json()
        console.error('Erreur API:', errorData)
        return false
      }
    } catch (error) {
      console.error('Erreur:', error)
      return false
    }
  }

  return { prospects, loading, createProspect, reload: loadProspects }
}

// Hook pour les devis
export function useDevis() {
  const [devis, setDevis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadDevis = useCallback(async () => {
    try {
      const response = await fetch('/api/devis')
      if (response.ok) {
        const data = await response.json()
        setDevis(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDevis()
    
    // Écouter les événements de mise à jour
    const handleDevisAdded = () => loadDevis()
    const handleDevisUpdated = () => loadDevis()
    
    window.addEventListener('devisAdded', handleDevisAdded)
    window.addEventListener('devisUpdated', handleDevisUpdated)
    
    return () => {
      window.removeEventListener('devisAdded', handleDevisAdded)
      window.removeEventListener('devisUpdated', handleDevisUpdated)
    }
  }, [loadDevis])

  const createDevis = async (devisData: any) => {
    try {
      const response = await fetch('/api/devis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(devisData),
      })
      
      if (response.ok) {
        await loadDevis()
        // Déclencher l'événement pour mettre à jour le dashboard
        window.dispatchEvent(new CustomEvent('devisUpdated'))
        return true
      } else {
        const errorData = await response.json()
        console.error('Erreur API:', errorData)
        return false
      }
    } catch (error) {
      console.error('Erreur:', error)
      return false
    }
  }

  return { devis, loading, createDevis, reload: loadDevis }
}
