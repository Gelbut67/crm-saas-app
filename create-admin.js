/**
 * Script pour créer le premier compte administrateur
 * Usage: node create-admin.js
 */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'admin@example.com'
  const password = process.argv[3] || 'admin123'
  const nom = process.argv[4] || 'Administrateur'

  console.log(`Création du compte admin: ${email}`)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Un utilisateur avec cet email existe déjà.')
    return
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      nom,
      email,
      password: hashedPassword,
      role: 'admin',
    },
  })

  console.log(`✅ Compte admin créé: ${user.email} (id: ${user.id})`)
  console.log(`   Email: ${email}`)
  console.log(`   Mot de passe: ${password}`)
  console.log('\n⚠️  Changez le mot de passe après la première connexion!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
