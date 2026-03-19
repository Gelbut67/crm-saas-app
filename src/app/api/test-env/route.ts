import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL
    
    if (!dbUrl) {
      return NextResponse.json({ 
        error: 'DATABASE_URL non trouvé',
        envVars: Object.keys(process.env).filter(k => k.includes('DATABASE'))
      }, { status: 500 })
    }
    
    // Masquer le mot de passe dans les logs
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@')
    
    return NextResponse.json({ 
      message: 'DATABASE_URL trouvé',
      url: maskedUrl,
      length: dbUrl.length,
      startsWith: dbUrl.startsWith('postgresql://') ? 'Correct format' : 'Wrong format'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erreur: ' + (error instanceof Error ? error.message : 'Unknown')
    }, { status: 500 })
  }
}
