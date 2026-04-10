'use client'
/**
 * components/providers/SessionProvider.tsx
 * Wrapper client per NextAuth SessionProvider.
 * Necessario perché SessionProvider usa hooks React.
 */
import { SessionProvider as NextAuthProvider } from 'next-auth/react'

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthProvider>{children}</NextAuthProvider>
}
