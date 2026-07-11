import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signup') {
        if (username.trim().length < 2) throw new Error('Pick a username (2+ characters). "x" is not a personality.')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() } },
        })
        if (error) throw error
        if (data.session) {
          navigate(from)
        } else {
          setNotice('Check your inbox to confirm your email — then come straight back. We’ll keep your seat warm.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate(from)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went sideways. Try again?')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page">
      <div className="form-card">
        <h1>
          {mode === 'signup' ? 'join the club' : 'welcome back'}
          <span style={{ color: 'var(--blue)' }}>.</span>
        </h1>
        <p className="quip">
          {mode === 'signup'
            ? 'free to join. cheaper than the tech you’re about to get.'
            : 'the gadgets missed you. the cables… did not notice.'}
        </p>

        {error && <div className="error-note">{error}</div>}
        {notice && <div className="ok-note">{notice}</div>}

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="username">username</label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. cable_hoarder_42"
                maxLength={32}
                required
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label htmlFor="password">password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
            {mode === 'signup' && <div className="hint">6+ characters. "password" is technically allowed but spiritually forbidden.</div>}
          </div>
          <button className="btn blue" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'connecting the wires…' : mode === 'signup' ? 'create account' : 'sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, color: 'var(--ink-soft)', fontSize: '0.92rem' }}>
          {mode === 'signup' ? 'already one of us?' : 'new around here?'}{' '}
          <button
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup')
              setError(null)
              setNotice(null)
            }}
            style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 600, fontSize: '0.92rem', padding: 0 }}
          >
            {mode === 'signup' ? 'sign in' : 'create an account'}
          </button>
        </p>
      </div>
    </main>
  )
}
