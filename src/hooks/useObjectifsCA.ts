import { useState, useEffect } from 'react'

interface ObjectifsCA {
  mensuel: number
  annuel: number
}

export function useObjectifsCA() {
  const [objectifs, setObjectifs] = useState<ObjectifsCA>({
    mensuel: 50000,
    annuel: 600000
  })

  useEffect(() => {
    // Charger les objectifs depuis l'API
    const loadObjectifs = async () => {
      try {
        const response = await fetch('/api/settings?key=objectifsCA')
        if (response.ok) {
          const data = await response.json()
          setObjectifs(data.value)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des objectifs:", error)
      }
    }

    loadObjectifs()

    // Écouter les mises à jour
    if (typeof window !== 'undefined') {
      const handleObjectifsUpdated = (event: CustomEvent) => {
        setObjectifs(event.detail)
      }

      window.addEventListener('objectifsUpdated', handleObjectifsUpdated as EventListener)

      return () => {
        window.removeEventListener('objectifsUpdated', handleObjectifsUpdated as EventListener)
      }
    }
  }, [])

  return objectifs
}
