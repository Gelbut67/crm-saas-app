import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les pièces jointes d'un devis
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const piecesJointes = await prisma.pieceJointe.findMany({
      where: {
        devisId: params.id
      },
      orderBy: {
        dateAjout: 'desc'
      }
    })

    const formattedPieces = piecesJointes.map(piece => ({
      ...piece,
      dateAjout: piece.dateAjout.toISOString()
    }))

    return NextResponse.json(formattedPieces)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des pièces jointes' },
      { status: 500 }
    )
  }
}

// POST - Ajouter une pièce jointe
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    // Vérifier que le devis existe
    const devis = await prisma.devis.findUnique({
      where: { id: params.id }
    })
    
    if (!devis) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Créer la pièce jointe
    const pieceJointe = await prisma.pieceJointe.create({
      data: {
        devisId: params.id,
        nomFichier: data.nomFichier,
        urlFichier: data.urlFichier, // Base64 data URL
        typeFichier: data.typeFichier,
        tailleFichier: data.tailleFichier,
        dateAjout: new Date()
      }
    })

    return NextResponse.json({
      ...pieceJointe,
      dateAjout: pieceJointe.dateAjout.toISOString()
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout de la pièce jointe' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une pièce jointe
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pieceId = searchParams.get('pieceId')
    
    if (!pieceId) {
      return NextResponse.json(
        { error: 'ID de pièce jointe manquant' },
        { status: 400 }
      )
    }

    await prisma.pieceJointe.delete({
      where: { id: pieceId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la pièce jointe' },
      { status: 500 }
    )
  }
}
