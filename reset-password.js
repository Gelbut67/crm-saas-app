/**
 * Script pour réinitialiser le mot de passe d'un utilisateur
 * Usage: node reset-password.js <email> <nouveau_mot_de_passe>
 * Exemple: node reset-password.js admin@example.com MonNouveauMotDePasse
 */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const newPassword = process.argv[3]

  if (!email || !newPassword) {
    console.error('Usage: node reset-password.js <email> <nouveau_mot_de_passe>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`)
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword, mustChangePassword: false },
  })

  console.log(`✅ Mot de passe réinitialisé pour: ${user.nom} (${email})`)
  console.log(`   Nouveau mot de passe: ${newPassword}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
