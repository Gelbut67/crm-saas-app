import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Test DB - Début')
    
    // Test simple de connexion
    await prisma.$connect()
    console.log('Test DB - Connecté')
    
    // Test de requête simple
    const count = await prisma.client.count()
    console.log(`Test DB - ${count} clients trouvés`)
    
    // Test de création simple
    const testClient = await prisma.client.create({
      data: {
        nom: 'Test Connection',
        statut: 'prospect',
      }
    })
    console.log('Test DB - Client test créé:', testClient.id)
    
    // Suppression du test
    await prisma.client.delete({
      where: { id: testClient.id }
    })
    console.log('Test DB - Client test supprimé')
    
    await prisma.$disconnect()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Connexion DB réussie',
      clientCount: count 
    })
  } catch (error) {
    console.error('Test DB - Erreur:', error)
    
    let errorMessage = 'Erreur inconnue'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('Test DB - Stack:', error.stack)
    }
    
    // Vérifier si c'est une erreur de connexion
    if (errorMessage.includes('ECONNREFUSED') || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('database') ||
        errorMessage.includes('connection')) {
      console.error('Test DB - Erreur de connexion détectée')
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
