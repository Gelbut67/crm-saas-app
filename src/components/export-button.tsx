"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  FileSpreadsheet,
  FileText,
  Loader2
} from "lucide-react"
import { 
  exportClientsToCSV, 
  exportClientsToExcel,
  exportDevisToCSV,
  exportDevisToExcel,
  downloadFile,
  ClientExport,
  DevisExport
} from "@/lib/export"

interface ExportButtonProps {
  type: "clients" | "devis"
  data: ClientExport[] | DevisExport[]
  disabled?: boolean
}

export function ExportButton({ type, data, disabled = false }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const handleExport = async (format: "csv" | "excel") => {
    if (disabled || data.length === 0) return
    
    setIsExporting(format)
    
    try {
      let filename = ""
      let content = ""

      if (type === "clients") {
        const clients = data as ClientExport[]
        
        if (format === "csv") {
          await exportClientsToCSV(clients)
          filename = "clients_export.csv"
          // Pour le CSV, nous devons lire le fichier généré
          const response = await fetch('/clients_export.csv')
          content = await response.text()
        } else {
          await exportClientsToExcel(clients)
          filename = "clients_export.xlsx"
          // Pour Excel, nous devons lire le fichier généré
          const response = await fetch('/clients_export.xlsx')
          const arrayBuffer = await response.arrayBuffer()
          const blob = new Blob([arrayBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          })
          downloadFile(blob, filename)
          return
        }
      } else {
        const devis = data as DevisExport[]
        
        if (format === "csv") {
          await exportDevisToCSV(devis)
          filename = "devis_export.csv"
          const response = await fetch('/devis_export.csv')
          content = await response.text()
        } else {
          await exportDevisToExcel(devis)
          filename = "devis_export.xlsx"
          const response = await fetch('/devis_export.xlsx')
          const arrayBuffer = await response.arrayBuffer()
          const blob = new Blob([arrayBuffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          })
          downloadFile(blob, filename)
          return
        }
      }

      // Pour CSV, créer un blob et télécharger
      if (content) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
        downloadFile(blob, filename)
      }
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
    } finally {
      setIsExporting(null)
    }
  }

  const getExportLabel = () => {
    return type === "clients" ? "clients" : "devis"
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs">
        {data.length} {getExportLabel()}
      </Badge>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("csv")}
        disabled={disabled || data.length === 0 || isExporting !== null}
      >
        {isExporting === "csv" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Export CSV
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport("excel")}
        disabled={disabled || data.length === 0 || isExporting !== null}
      >
        {isExporting === "excel" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        Export Excel
      </Button>
    </div>
  )
}
