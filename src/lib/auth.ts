import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        const creds = credentials as any

        // Impersonation flow: admin accesses a user account
        if (creds?.impersonateToken && creds?.impersonateUserId && creds?.adminId) {
          const { createHmac } = require('crypto')
          const slot = Math.floor(Date.now() / 300000)
          const validTokens = [slot, slot - 1].map((s: number) =>
            createHmac('sha256', process.env.NEXTAUTH_SECRET!)
              .update(`${creds.adminId}:${creds.impersonateUserId}:${s}`)
              .digest('hex')
          )
          if (!validTokens.includes(creds.impersonateToken)) return null

          const admin = await prisma.user.findUnique({ where: { id: creds.adminId } })
          if (!admin || admin.role !== 'admin') return null

          const target = await prisma.user.findUnique({ where: { id: creds.impersonateUserId } })
          if (!target) return null

          return {
            id: target.id, email: target.email, name: target.nom,
            role: target.role, mustChangePassword: target.mustChangePassword,
            impersonatedBy: creds.adminId,
          }
        }

        // Restore flow: return to admin account
        if (creds?.restoreToken && creds?.adminId) {
          const { createHmac } = require('crypto')
          const slot = Math.floor(Date.now() / 300000)
          const validTokens = [slot, slot - 1].map((s: number) =>
            createHmac('sha256', process.env.NEXTAUTH_SECRET!)
              .update(`restore:${creds.adminId}:${s}`)
              .digest('hex')
          )
          if (!validTokens.includes(creds.restoreToken)) return null

          const admin = await prisma.user.findUnique({ where: { id: creds.adminId } })
          if (!admin || admin.role !== 'admin') return null

          return {
            id: admin.id, email: admin.email, name: admin.nom,
            role: admin.role, mustChangePassword: admin.mustChangePassword,
          }
        }

        // Normal login
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.nom,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.mustChangePassword = user.mustChangePassword
        token.impersonatedBy = (user as any).impersonatedBy
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.mustChangePassword = token.mustChangePassword
        session.user.impersonatedBy = token.impersonatedBy
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function getAuthSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getAuthSession()
  return session
}
