require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('URL de connexion:', process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':***@'));
    console.log('Test de connexion...');
    await prisma.$connect();
    console.log('✅ Connexion réussie !');
    
    const count = await prisma.client.count();
    console.log(`Nombre de clients: ${count}`);
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
