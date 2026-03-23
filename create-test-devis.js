const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestDevis() {
  try {
    // Récupérer le premier client
    const client = await prisma.client.findFirst()
    
    if (!client) {
      console.log('❌ Aucun client trouvé. Créez d\'abord un client.')
      return
    }
    
    console.log(`Création d'un devis de test pour le client: ${client.entreprise || client.nom}`)
    
    // Créer un devis en cours
    const devisEnCours = await prisma.devis.create({
      data: {
        titre: 'Devis Test - En Cours',
        montant: 1500,
        statut: 'en_cours',
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans 30 jours
        description: 'Devis de test pour vérifier les statistiques du dashboard',
        clientId: client.id
      }
    })
    
    console.log('✅ Devis en cours créé:', devisEnCours.titre, '-', devisEnCours.montant, '€')
    
    // Créer un devis perdu
    const devisPerdu = await prisma.devis.create({
      data: {
        titre: 'Devis Test - Perdu',
        montant: 800,
        statut: 'perdu',
        dateEcheance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Il y a 10 jours
        description: 'Devis de test perdu',
        clientId: client.id
      }
    })
    
    console.log('✅ Devis perdu créé:', devisPerdu.titre, '-', devisPerdu.montant, '€')
    
    // Créer un devis facturé
    const devisFacture = await prisma.devis.create({
      data: {
        titre: 'Devis Test - Facturé',
        montant: 2500,
        statut: 'facture',
        dateEcheance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
        description: 'Devis de test facturé',
        clientId: client.id
      }
    })
    
    console.log('✅ Devis facturé créé:', devisFacture.titre, '-', devisFacture.montant, '€')
    
    console.log('\n=== RÉSUMÉ ===')
    console.log('3 devis de test créés avec différents statuts')
    console.log('Actualisez le dashboard pour voir les nouvelles statistiques!')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestDevis()
