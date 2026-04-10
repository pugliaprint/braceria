'use client'
/**
 * app/admin/layout.tsx
 * Layout con sidebar per tutte le pagine admin.
 * Reindirizza al login se non autenticato.
 */
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const VOCI_MENU = [
  { href: '/admin',              label: 'Dashboard',      emoji: '📊' },
  { href: '/admin/menu',         label: 'Menu',           emoji: '🍽️' },
  { href: '/admin/ingredienti',  label: 'Ingredienti',    emoji: '🧅' },
  { href: '/admin/prenotazioni', label: 'Prenotazioni',   emoji: '📅' },
  { href: '/admin/ordini',       label: 'Ordini',         emoji: '📦' },
  { href: '/admin/posti',        label: 'Gestione Posti', emoji: '💺' },
  { href: '/admin/qrcode',       label: 'QR Code',        emoji: '📱' },
  { href: '/admin/impostazioni', label: 'Impostazioni',   emoji: '⚙️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarAperta, setSidebarAperta] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [status, pathname, router])

  if (pathname === '/admin/login') return <>{children}</>
  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-brace-nero flex items-center justify-center">
        <span className="text-5xl animate-pulse">🔐</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brace-nero flex">

      {/* Overlay mobile */}
      {sidebarAperta && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarAperta(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-40 w-64 bg-brace-carbone border-r border-brace-fumo
                         flex flex-col transition-transform duration-300
                         ${sidebarAperta ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-5 border-b border-brace-fumo">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-fuoco flex items-center justify-center shadow-fuoco flex-shrink-0">
              <span className="text-lg">🔥</span>
            </div>
            <div>
              <p className="font-display font-bold text-brace-crema text-sm leading-none">Braceria</p>
              <p className="text-brace-testo-soft text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigazione */}
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {VOCI_MENU.map(voce => {
            const attiva = pathname === voce.href || (voce.href !== '/admin' && pathname.startsWith(voce.href))
            return (
              <Link
                key={voce.href}
                href={voce.href}
                onClick={() => setSidebarAperta(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                           transition-all duration-150
                           ${attiva
                             ? 'bg-gradient-fuoco text-white shadow-fuoco'
                             : 'text-brace-testo-soft hover:text-brace-testo hover:bg-brace-fumo'
                           }`}
              >
                <span className="text-base">{voce.emoji}</span>
                <span>{voce.label}</span>
              </Link>
            )
          })}

          {/* Link cucina */}
          <div className="border-t border-brace-fumo/50 mt-2 pt-2">
            <Link
              href="/cucina"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                         text-brace-testo-soft hover:text-brace-testo hover:bg-brace-fumo transition-all"
            >
              <span className="text-base">🍳</span>
              <span>Apri Cucina</span>
              <span className="ml-auto text-xs opacity-50">↗</span>
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-brace-fumo">
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                       text-brace-testo-soft hover:text-red-400 hover:bg-red-900/20 transition-all"
          >
            <span>🚪</span>
            <span>Esci</span>
          </button>
        </div>
      </aside>

      {/* Contenuto principale */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-brace-carbone border-b border-brace-fumo sticky top-0 z-20">
          <button onClick={() => setSidebarAperta(true)} className="btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="font-display font-bold text-brace-crema text-base">
            {VOCI_MENU.find(v => pathname === v.href || (v.href !== '/admin' && pathname.startsWith(v.href)))?.label ?? 'Admin'}
          </p>
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
