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
    // Charger les objectifs depuis localStorage
    const savedObjectifs = localStorage.getItem('objectifsCA')
    if (savedObjectifs) {
      try {
        const parsed = JSON.parse(savedObjectifs)
        setObjectifs(parsed)
      } catch (error) {
        console.error("Erreur lors du chargement des objectifs:", error)
      }
    }

    // Écouter les mises à jour
    const handleObjectifsUpdated = (event: CustomEvent) => {
      setObjectifs(event.detail)
    }

    window.addEventListener('objectifsUpdated', handleObjectifsUpdated as EventListener)

    return () => {
      window.removeEventListener('objectifsUpdated', handleObjectifsUpdated as EventListener)
    }
  }, [])

  return objectifs
}
