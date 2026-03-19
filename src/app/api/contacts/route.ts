import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Créer un nouveau contact
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (!data.nom || !data.clientId) {
      return NextResponse.json(
        { error: 'Le nom et le clientId sont obligatoires' },
        { status: 400 }
      )
    }
    
    // Si c'est le contact principal, retirer le flag des autres contacts
    if (data.isPrincipal) {
      await prisma.contact.updateMany({
        where: { clientId: data.clientId },
        data: { isPrincipal: false }
      })
    }
    
    const contact = await prisma.contact.create({
      data: {
        clientId: data.clientId,
        nom: data.nom.trim(),
        email: data.email?.trim() || null,
        telephone: data.telephone?.trim() || null,
        poste: data.poste?.trim() || null,
        isPrincipal: data.isPrincipal || false,
        dateCreation: new Date(),
      }
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du contact' },
      { status: 500 }
    )
  }
}
