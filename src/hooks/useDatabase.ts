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
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
    return false
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
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
    return false
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
  }, [loadDevis])

  return { devis, loading, reload: loadDevis }
}
