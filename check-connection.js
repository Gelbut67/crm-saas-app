const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkConnection() {
  try {
    console.log('🔍 Vérification de la connexion à la base de données...\n')
    
    // Test de connexion simple
    await prisma.$connect()
    console.log('✅ Connexion à la base de données réussie!\n')
    
    // Compter les enregistrements
    const clientCount = await prisma.client.count()
    const devisCount = await prisma.devis.count()
    const interactionCount = await prisma.interaction.count()
    
    console.log('📊 Nombre d\'enregistrements:')
    console.log(`   Clients: ${clientCount}`)
    console.log(`   Devis: ${devisCount}`)
    console.log(`   Interactions: ${interactionCount}`)
    
    if (clientCount === 0 && devisCount === 0) {
      console.log('\n⚠️  ATTENTION: La base de données est vide!')
      console.log('   Les données ont peut-être été supprimées ou vous êtes connecté à une mauvaise base.')
    } else {
      console.log('\n✅ Les données sont présentes dans la base de données.')
    }
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
    console.log('\n💡 Solutions possibles:')
    console.log('   1. Vérifiez que le fichier .env contient DATABASE_URL')
    console.log('   2. Vérifiez votre connexion internet')
    console.log('   3. Vérifiez que Supabase est accessible')
  } finally {
    await prisma.$disconnect()
  }
}

checkConnection()
