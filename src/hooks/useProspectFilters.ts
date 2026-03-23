import { useState } from "react"

export interface FilterOptions {
  search: string
  sortBy: "nom" | "entreprise" | "caTotal" | "dateCreation" | "derniereInteraction" | "departement"
  sortOrder: "asc" | "desc"
  secteur: string
  entreprise: string
  departement: string
  caMin: string
  caMax: string
}

export function useProspectFilters(prospects: any[]) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    sortBy: "entreprise",
    sortOrder: "asc",
    secteur: "",
    entreprise: "",
    departement: "",
    caMin: "",
    caMax: ""
  })

  const filteredAndSortedProspects = prospects
    .filter(prospect => {
      // Filtre de recherche
      const searchMatch = !filters.search || 
        prospect.nomEntreprise?.toLowerCase().includes(filters.search.toLowerCase()) ||
        prospect.entreprise?.toLowerCase().includes(filters.search.toLowerCase())

      // Filtre secteur
      const secteurMatch = !filters.secteur || prospect.secteur === filters.secteur

      // Filtre entreprise
      const entrepriseMatch = !filters.entreprise || 
        prospect.entreprise?.toLowerCase().includes(filters.entreprise.toLowerCase())

      // Filtre département
      const departementMatch = !filters.departement || prospect.departement === filters.departement

      return searchMatch && secteurMatch && entrepriseMatch && departementMatch
    })
    .sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case "entreprise":
          const aEntreprise = (a.entreprise || a.nomEntreprise || "").toLowerCase()
          const bEntreprise = (b.entreprise || b.nomEntreprise || "").toLowerCase()
          comparison = aEntreprise.localeCompare(bEntreprise, 'fr')
          break
        case "caTotal":
          comparison = (a.caTotal || 0) - (b.caTotal || 0)
          break
        case "dateCreation":
          comparison = new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()
          break
        case "derniereInteraction":
          // Simuler une date de dernière interaction (dans une vraie app, ça viendrait de la BDD)
          const aLastInteraction = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          const bLastInteraction = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          comparison = aLastInteraction.getTime() - bLastInteraction.getTime()
          break
        case "departement":
          const aDept = (a.departement || "").toLowerCase()
          const bDept = (b.departement || "").toLowerCase()
          comparison = aDept.localeCompare(bDept, 'fr')
          break
        default:
          const aDefault = (a.entreprise || a.nomEntreprise || "").toLowerCase()
          const bDefault = (b.entreprise || b.nomEntreprise || "").toLowerCase()
          comparison = aDefault.localeCompare(bDefault, 'fr')
      }

      return filters.sortOrder === "desc" ? -comparison : comparison
    })

  const resetFilters = () => {
    setFilters({
      search: "",
      sortBy: "entreprise",
      sortOrder: "asc",
      secteur: "",
      entreprise: "",
      departement: "",
      caMin: "",
      caMax: ""
    })
  }

  return {
    filters,
    setFilters,
    filteredAndSortedProspects,
    filteredCount: filteredAndSortedProspects.length,
    totalCount: prospects.length,
    resetFilters
  }
}
