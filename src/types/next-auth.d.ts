import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      mustChangePassword: boolean
      impersonatedBy?: string
    }
  }

  interface User {
    id: string
    role: string
    mustChangePassword: boolean
    impersonatedBy?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    mustChangePassword: boolean
    impersonatedBy?: string
  }
}
