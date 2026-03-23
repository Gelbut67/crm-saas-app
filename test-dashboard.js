const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDashboard() {
  try {
    console.log('=== TEST DASHBOARD ===\n')
    
    // Récupérer tous les devis
    const devis = await prisma.devis.findMany({
      include: {
        client: {
          select: {
            nom: true,
            entreprise: true,
          }
        }
      }
    })
    
    console.log(`Total devis dans la base: ${devis.length}\n`)
    
    if (devis.length > 0) {
      console.log('Détails des devis:')
      devis.forEach((d, index) => {
        console.log(`\n${index + 1}. ${d.titre}`)
        console.log(`   - Statut: ${d.statut}`)
        console.log(`   - Montant: ${d.montant}€`)
        console.log(`   - Client: ${d.client.entreprise || d.client.nom}`)
        console.log(`   - Date création: ${d.dateCreation}`)
      })
      
      console.log('\n=== STATISTIQUES ===')
      const enCours = devis.filter(d => d.statut === 'en_cours')
      const gagnes = devis.filter(d => d.statut === 'gagne')
      const factures = devis.filter(d => d.statut === 'facture')
      const perdus = devis.filter(d => d.statut === 'perdu')
      
      console.log(`\nDevis en cours: ${enCours.length}`)
      console.log(`Montant total en cours: ${enCours.reduce((sum, d) => sum + d.montant, 0)}€`)
      
      console.log(`\nDevis gagnés: ${gagnes.length}`)
      console.log(`Montant total gagné: ${gagnes.reduce((sum, d) => sum + d.montant, 0)}€`)
      
      console.log(`\nDevis facturés: ${factures.length}`)
      console.log(`Montant total facturé: ${factures.reduce((sum, d) => sum + d.montant, 0)}€`)
      
      console.log(`\nDevis perdus: ${perdus.length}`)
      console.log(`Montant total perdu: ${perdus.reduce((sum, d) => sum + d.montant, 0)}€`)
      
      const caTotal = [...gagnes, ...factures].reduce((sum, d) => sum + d.montant, 0)
      const tauxConversion = devis.length > 0 ? Math.round(((gagnes.length + factures.length) / devis.length) * 100) : 0
      
      console.log(`\n=== RÉSUMÉ ===`)
      console.log(`CA Total: ${caTotal}€`)
      console.log(`Taux de conversion: ${tauxConversion}%`)
    } else {
      console.log('⚠️ Aucun devis trouvé dans la base de données!')
    }
    
    // Vérifier les clients
    const clients = await prisma.client.findMany()
    console.log(`\n\nTotal clients: ${clients.length}`)
    const clientsActifs = clients.filter(c => c.statut === 'client')
    const prospects = clients.filter(c => c.statut === 'prospect')
    console.log(`Clients actifs: ${clientsActifs.length}`)
    console.log(`Prospects: ${prospects.length}`)
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDashboard()
