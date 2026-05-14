import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

// PUT - Mettre à jour un contact
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const data = await request.json()
    
    // Si c'est le contact principal, retirer le flag des autres contacts du même client
    if (data.isPrincipal) {
      const contact = await prisma.contact.findUnique({
        where: { id: params.id }
      })
      
      if (contact) {
        await prisma.contact.updateMany({
          where: { 
            clientId: contact.clientId,
            id: { not: params.id }
          },
          data: { isPrincipal: false }
        })
      }
    }
    
    const updatedContact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        nom: data.nom?.trim(),
        email: data.email?.trim() || null,
        telephone: data.telephone?.trim() || null,
        poste: data.poste?.trim() || null,
        isPrincipal: data.isPrincipal || false,
      }
    })

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du contact' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un contact
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    await prisma.contact.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du contact' },
      { status: 500 }
    )
  }
}
