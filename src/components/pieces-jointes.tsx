"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, File, Download, Trash2, Loader2, Paperclip } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface PieceJointe {
  id: string
  nomFichier: string
  urlFichier: string
  typeFichier: string | null
  tailleFichier: number | null
  dateAjout: string
}

interface PiecesJointesProps {
  devisId: string
}

export function PiecesJointes({ devisId }: PiecesJointesProps) {
  const [pieces, setPieces] = useState<PieceJointe[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadPieces()
  }, [devisId])

  const loadPieces = async () => {
    try {
      const response = await fetch(`/api/devis/${devisId}/pieces-jointes`)
      if (response.ok) {
        const data = await response.json()
        setPieces(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Limite de 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 5MB)')
      return
    }

    setUploading(true)

    try {
      // Convertir le fichier en base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string

        const response = await fetch(`/api/devis/${devisId}/pieces-jointes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nomFichier: file.name,
            urlFichier: base64,
            typeFichier: file.type,
            tailleFichier: file.size
          })
        })

        if (response.ok) {
          await loadPieces()
          // Réinitialiser l'input
          event.target.value = ''
        } else {
          alert('Erreur lors de l\'upload du fichier')
        }
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'upload du fichier')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (pieceId: string) => {
    if (!confirm('Supprimer cette pièce jointe ?')) return

    setDeleting(pieceId)
    try {
      const response = await fetch(`/api/devis/${devisId}/pieces-jointes?pieceId=${pieceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadPieces()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (piece: PieceJointe) => {
    // Créer un lien de téléchargement
    const link = document.createElement('a')
    link.href = piece.urlFichier
    link.download = piece.nomFichier
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Pièces jointes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="w-5 h-5" />
              Pièces jointes
            </CardTitle>
            <CardDescription>
              {pieces.length} fichier{pieces.length > 1 ? 's' : ''} attaché{pieces.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter un fichier
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pieces.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucune pièce jointe</p>
            <p className="text-sm">Cliquez sur "Ajouter un fichier" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pieces.map((piece) => (
              <div
                key={piece.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{piece.nomFichier}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(piece.tailleFichier)}</span>
                      <span>•</span>
                      <span>{format(new Date(piece.dateAjout), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(piece)}
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(piece.id)}
                    disabled={deleting === piece.id}
                    className="text-red-600 hover:text-red-700"
                    title="Supprimer"
                  >
                    {deleting === piece.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Taille maximale : 5MB par fichier
        </p>
      </CardContent>
    </Card>
  )
}
