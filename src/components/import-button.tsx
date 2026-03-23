"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Upload, 
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from "lucide-react"
import * as XLSX from 'xlsx'

interface ImportButtonProps {
  onImport?: (data: any[]) => void
  disabled?: boolean
  type?: 'prospects' | 'clients' | 'devis'
}

interface ImportError {
  row: number
  field: string
  message: string
}

export function ImportButton({ onImport, disabled = false, type = 'prospects' }: ImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<{
    success: number
    errors: ImportError[]
    total: number
  } | null>(null)
  const [showResults, setShowResults] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateProspectRow = (row: any, index: number): { valid: boolean; errors: ImportError[]; prospect?: any } => {
    const errors: ImportError[] = []
    
    // Seul le nom d'entreprise est obligatoire
    if (!row.entreprise || typeof row.entreprise !== 'string' || row.entreprise.trim().length === 0) {
      errors.push({ row: index + 1, field: 'entreprise', message: 'Le nom de l\'entreprise est requis' })
    }
    
    if (errors.length > 0) {
      return { valid: false, errors }
    }
    
    const prospect = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nomEntreprise: row.entreprise.trim(),
      secteur: row.secteur ? row.secteur.trim() : '',
      adresse: row.adresse ? row.adresse.trim() : '',
      codePostal: row.codepostal ? row.codepostal.trim() : '',
      ville: row.ville ? row.ville.trim() : '',
      departement: row.departement ? row.departement.trim() : '',
      dateCreation: new Date(),
      contacts: row.nom ? [
        {
          id: Date.now().toString() + "-1",
          nom: row.nom.trim(),
          email: row.email ? row.email.trim() : '',
          telephone: row.telephone ? row.telephone.trim() : '',
          poste: "Contact principal",
          isPrincipal: true,
          dateCreation: new Date()
        }
      ] : []
    }
    
    return { valid: true, errors: [], prospect }
  }

  const validateClientRow = (row: any, index: number): { valid: boolean; errors: ImportError[]; client?: any } => {
    const errors: ImportError[] = []
    
    if (!row.nomentreprise || typeof row.nomentreprise !== 'string' || row.nomentreprise.trim().length === 0) {
      errors.push({ row: index + 1, field: 'nomentreprise', message: 'Le nom de l\'entreprise est requis' })
    }
    
    if (errors.length > 0) {
      return { valid: false, errors }
    }
    
    const client = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nomEntreprise: row.nomentreprise.trim(),
      secteur: row.secteur ? row.secteur.trim() : '',
      adresse: row.adresse ? row.adresse.trim() : '',
      codePostal: row.codepostal ? row.codepostal.trim() : '',
      ville: row.ville ? row.ville.trim() : '',
      departement: row.departement ? row.departement.trim() : '',
      caTotal: row.catotal ? parseFloat(row.catotal) : 0,
      dateCreation: new Date(),
      contacts: row.contactnom ? [
        {
          id: Date.now().toString() + "-1",
          nom: row.contactnom.trim(),
          email: row.contactemail ? row.contactemail.trim() : '',
          telephone: row.contacttelephone ? row.contacttelephone.trim() : '',
          poste: "Contact principal",
          isPrincipal: true,
          dateCreation: new Date()
        }
      ] : []
    }
    
    return { valid: true, errors: [], client }
  }

  const validateDevisRow = (row: any, index: number): { valid: boolean; errors: ImportError[]; devis?: any } => {
    const errors: ImportError[] = []
    
    if (!row.titre || typeof row.titre !== 'string' || row.titre.trim().length === 0) {
      errors.push({ row: index + 1, field: 'titre', message: 'Le titre est requis' })
    }
    
    if (!row.montant || isNaN(parseFloat(row.montant)) || parseFloat(row.montant) <= 0) {
      errors.push({ row: index + 1, field: 'montant', message: 'Le montant doit être un nombre positif' })
    }
    
    if (!row.client || typeof row.client !== 'string' || row.client.trim().length === 0) {
      errors.push({ row: index + 1, field: 'client', message: 'Le nom du client est requis' })
    }
    
    if (!row.statut || !['en_cours', 'gagne', 'facture', 'perdu'].includes(row.statut)) {
      errors.push({ row: index + 1, field: 'statut', message: 'Le statut doit être: en_cours, gagne, facture ou perdu' })
    }
    
    if (errors.length > 0) {
      return { valid: false, errors }
    }
    
    const devis = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      titre: row.titre.trim(),
      montant: parseFloat(row.montant),
      statut: row.statut,
      dateEcheance: row.dateEcheance || new Date().toISOString().split('T')[0],
      dateCreation: new Date().toISOString().split('T')[0],
      description: row.description ? row.description.trim() : '',
      client: {
        nom: row.client.trim(),
        entreprise: row.clientEntreprise ? row.clientEntreprise.trim() : ''
      }
    }
    
    return { valid: true, errors: [], devis }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérification du type de fichier
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)')
      return
    }

    setIsImporting(true)
    setImportResults(null)
    setShowResults(false)

    try {
      // Lecture du fichier
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // Récupération de la première feuille
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Conversion en JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (jsonData.length < 2) {
        throw new Error('Le fichier doit contenir au moins une ligne de données')
      }

      // Extraction des en-têtes et des données
      const headers = jsonData[0] as string[]
      const rows = jsonData.slice(1) as any[]

      // Normalisation des en-têtes (minuscules, sans espaces)
      const normalizedHeaders = headers.map(h => 
        h?.toString().toLowerCase().replace(/\s+/g, '').trim() || ''
      )

      // Validation des en-têtes requis selon le type
      let requiredHeaders: string[]
      let validationFunction: (row: any, index: number) => { valid: boolean; errors: ImportError[]; data?: any }
      
      switch (type) {
        case 'clients':
          requiredHeaders = ['nomentreprise']
          validationFunction = validateClientRow
          break
        case 'devis':
          requiredHeaders = ['titre', 'montant', 'client', 'statut']
          validationFunction = validateDevisRow
          break
        default: // prospects
          requiredHeaders = ['entreprise']
          validationFunction = validateProspectRow
      }
      
      const missingHeaders = requiredHeaders.filter(h => !normalizedHeaders.includes(h))
      
      if (missingHeaders.length > 0) {
        throw new Error(`Colonnes requises manquantes: ${missingHeaders.join(', ')}`)
      }

      // Traitement des lignes
      const validData: any[] = []
      const allErrors: ImportError[] = []

      rows.forEach((row, index) => {
        // Création d'un objet avec les en-têtes normalisés
        const rowObj: any = {}
        normalizedHeaders.forEach((header, headerIndex) => {
          if (header) {
            rowObj[header] = row[headerIndex]
          }
        })
        
        console.log(`Processing row ${index + 1}:`, rowObj)
        
        const validation = validationFunction(rowObj, index) as any
        console.log(`Validation result for row ${index + 1}:`, validation)
        
        if (validation.valid && (validation.data || validation.prospect || validation.client || validation.devis)) {
          validData.push(validation.data || validation.prospect || validation.client || validation.devis)
        } else {
          allErrors.push(...validation.errors)
        }
      })

      // Sauvegarde dans localStorage selon le type
      if (validData.length > 0) {
        let storageKey: string
        let eventKey: string
        
        switch (type) {
          case 'clients':
            storageKey = 'clients'
            eventKey = 'clientAdded'
            break
          case 'devis':
            storageKey = 'devis'
            eventKey = 'devisAdded'
            break
          default: // prospects
            storageKey = 'prospects'
            eventKey = 'prospectAdded'
        }
        
        console.log(`Saving ${validData.length} items to ${storageKey}:`, validData)
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]')
        const updatedData = [...existingData, ...validData]
        localStorage.setItem(storageKey, JSON.stringify(updatedData))
        console.log(`Updated ${storageKey}:`, updatedData)
        
        // Déclencher l'événement pour recharger la liste
        window.dispatchEvent(new CustomEvent(eventKey))
      }

      // Résultats de l'import
      setImportResults({
        success: validData.length,
        errors: allErrors,
        total: rows.length
      })
      
      setShowResults(true)
      
      // Callback pour le composant parent
      if (onImport) {
        onImport(validData)
      }

    } catch (error) {
      console.error('Erreur lors de l\'import:', error)
      alert(`Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsImporting(false)
      // Reset du file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'clients': return 'clients'
      case 'devis': return 'devis'
      default: return 'prospects'
    }
  }

  const downloadTemplate = () => {
    let template: string[][]
    let filename: string
    
    switch (type) {
      case 'clients':
        template = [
          ['nomEntreprise', 'secteur', 'adresse', 'codePostal', 'ville', 'departement', 'caTotal', 'contactNom', 'contactEmail', 'contactTelephone'],
          ['Entreprise ABC', 'Technologie', '123 Rue de la Paix', '75001', 'Paris', '75', '25000', 'Jean Dupont', 'jean.dupont@email.com', '06 12 34 56 78'],
          ['Société XYZ', 'Services', '456 Avenue des Champs', '69001', 'Lyon', '69', '15000', 'Marie Martin', 'marie.martin@email.com', '06 98 76 54 32']
        ]
        filename = 'template_clients.xlsx'
        break
        
      case 'devis':
        template = [
          ['titre', 'montant', 'client', 'clientEntreprise', 'statut', 'dateEcheance', 'description'],
          ['Développement Site Web', '15000', 'Jean Dupont', 'Entreprise ABC', 'en_cours', '2024-04-15', 'Création d\'un site e-commerce complet'],
          ['Application Mobile', '8000', 'Marie Martin', 'Société XYZ', 'facture', '2024-03-30', 'Application iOS native']
        ]
        filename = 'template_devis.xlsx'
        break
        
      default: // prospects
        template = [
          ['nom', 'email', 'telephone', 'entreprise', 'secteur', 'adresse', 'codePostal', 'ville', 'departement'],
          ['Jean Dupont', 'jean.dupont@email.com', '06 12 34 56 78', 'Entreprise ABC', 'Technologie', '123 Rue de la Paix', '75001', 'Paris', '75'],
          ['Marie Martin', 'marie.martin@email.com', '06 98 76 54 32', 'Société XYZ', 'Services', '456 Avenue des Champs', '69001', 'Lyon', '69']
        ]
        filename = 'template_prospects.xlsx'
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, type.charAt(0).toUpperCase() + type.slice(1))
    
    XLSX.writeFile(workbook, filename)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          disabled={disabled}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Template
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isImporting}
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importation...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Importer Excel
            </>
          )}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Modal des résultats */}
      {showResults && importResults && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {importResults.errors.length === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  Résultats de l'import
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResults(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                {importResults.total} lignes traitées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-green-600">{getTypeLabel()} importés</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResults.errors.length}</div>
                  <div className="text-sm text-red-600">Erreurs</div>
                </div>
              </div>
              
              {importResults.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Erreurs détectées:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        Ligne {error.row} - {error.field}: {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={() => setShowResults(false)} className="flex-1">
                  Fermer
                </Button>
                {importResults.success > 0 && (
                  <Button asChild className="flex-1">
                    <a href={`/${type === 'prospects' ? 'prospects-db' : type === 'clients' ? 'clients-db' : 'devis-db'}`}>
                      Voir les {getTypeLabel()}
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
