'use client'
/**
 * app/admin/login/page.tsx
 * Pagina di login per il pannello admin.
 */
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [errore, setErrore]     = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrore('')
    const res = await signIn('credentials', {
      username, password, redirect: false,
    })
    setLoading(false)
    if (res?.ok) {
      router.push('/admin')
    } else {
      setErrore('Credenziali non valide')
    }
  }

  return (
    <div className="min-h-screen bg-brace-nero bg-texture-carbone flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-fuoco shadow-fuoco items-center justify-center mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="font-display text-2xl font-black text-brace-crema">Pannello Admin</h1>
          <p className="text-brace-testo-soft text-sm mt-1">Braceria Sannicandro</p>
        </div>

        <form onSubmit={handleLogin} className="card p-6 flex flex-col gap-4">
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input"
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {errore && (
            <p className="text-red-400 text-sm text-center animate-bounce-in">{errore}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary py-4 text-lg mt-1">
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}
