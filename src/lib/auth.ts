/**
 * lib/auth.ts
 * Configurazione NextAuth per autenticazione admin.
 * Usa CredentialsProvider con username/password.
 */
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from './mongodb'
import User from '@/models/User'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenziali Admin',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        try {
          await connectDB()
          const user = await User.findOne({
            username: credentials.username.toLowerCase(),
          })

          if (!user) return null

          const passwordValida = await user.comparePassword(credentials.password)
          if (!passwordValida) return null

          return {
            id: user._id.toString(),
            username: user.username,
            role: user.role,
          }
        } catch (err) {
          console.error('[Auth] Errore login:', err)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).username = token.username
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
