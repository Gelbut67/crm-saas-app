import { NextResponse } from 'next/server'

export async function POST() {
  // Cet endpoint ne fait rien côté serveur
  // Il sert juste à indiquer au client de nettoyer son localStorage
  return NextResponse.json({ message: 'Clear localStorage on client side' })
}
