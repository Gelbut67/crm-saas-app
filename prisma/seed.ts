import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Vérifier si la base est vide
    const clientsCount = await prisma.client.count()
    
    if (clientsCount === 0) {
      console.log('Base de données vide, ajout des données de test...')
      
      // Créer des clients de test
      const client1 = await prisma.client.create({
      data: {
        nom: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        telephone: '0612345678',
        entreprise: 'Tech Solutions',
        secteur: 'Informatique',
        statut: 'client',
        caTotal: 50000,
      },
    })
    
    const client2 = await prisma.client.create({
      data: {
        nom: 'Marie Martin',
        email: 'marie.martin@email.com',
        telephone: '0623456789',
        entreprise: 'Marketing Pro',
        secteur: 'Marketing',
        statut: 'client',
        caTotal: 75000,
      },
    })
    
    const prospect1 = await prisma.client.create({
      data: {
        nom: 'Pierre Durand',
        email: 'pierre.durand@email.com',
        telephone: '0634567890',
        entreprise: 'Startup Innov',
        secteur: 'Tech',
        statut: 'prospect',
        caTotal: 0,
      },
    })
    
    // Créer des interactions
    await prisma.interaction.createMany({
      data: [
        {
          clientId: client1.id,
          type: 'appel',
          contenu: 'Premier appel de prospection',
        },
        {
          clientId: client1.id,
          type: 'rdv',
          contenu: 'Rendez-vous de présentation',
        },
        {
          clientId: client2.id,
          type: 'email',
          contenu: 'Envoi de la brochure commerciale',
        },
        {
          clientId: prospect1.id,
          type: 'appel',
          contenu: 'Prise de contact initiale',
        },
      ],
    })
    
    // Créer des devis
    await prisma.devis.createMany({
      data: [
        {
          clientId: client1.id,
          titre: 'Développement site web',
          montant: 25000,
          statut: 'en_cours',
          dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          description: 'Site vitrine avec CMS',
        },
        {
          clientId: client2.id,
          titre: 'Campagne marketing',
          montant: 15000,
          statut: 'gagne',
          dateEcheance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 jours
          description: 'Campagne sur 3 mois',
        },
        {
          clientId: client1.id,
          titre: 'Maintenance annuelle',
          montant: 5000,
          statut: 'perdu',
          dateEcheance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired
          description: 'Contrat de maintenance',
        },
      ],
    })
    
    console.log('Données de test ajoutées avec succès!')
    console.log(`- 2 clients créés`)
    console.log(`- 1 prospect créé`)
    console.log(`- 4 interactions créées`)
    console.log(`- 3 devis créés`)
  } else {
    console.log(`La base contient déjà ${clientsCount} client(s)`)
  }
  } catch (error) {
    console.error('Erreur lors du seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
