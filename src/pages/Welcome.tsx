import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { WELCOME_JOKES, pick } from '../lib/jokes'

const CONFETTI = ['💾', '🔌', '💻', '🎧', '🖱️', '📱', '🎮', '🤖', '⌨️', '🔵', '✦', '🖥️']

export default function Welcome() {
  const navigate = useNavigate()
  const location = useLocation()
  const target = (location.state as { from?: string } | null)?.from ?? '/'
  const joke = useMemo(() => pick(WELCOME_JOKES), [])
  const [secs, setSecs] = useState(5)

  const pieces = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        emoji: CONFETTI[i % CONFETTI.length],
        left: `${(i * 61) % 97}%`,
        duration: `${3 + ((i * 7) % 5)}s`,
        delay: `${((i * 13) % 20) / 10}s`,
      })),
    [],
  )

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (secs <= 0) navigate(target, { replace: true })
  }, [secs, navigate, target])

  return (
    <main className="welcome">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti"
          style={{ left: p.left, animationDuration: p.duration, animationDelay: p.delay }}
        >
          {p.emoji}
        </span>
      ))}
      <h1>
        you’re in<span style={{ color: 'var(--blue)' }}>.</span>
      </h1>
      <p className="wjoke">account created. {joke}</p>
      <button className="btn blue" onClick={() => navigate(target, { replace: true })}>
        continue →
      </button>
      <div className="wcount">whisking you onwards in {Math.max(secs, 0)}…</div>
    </main>
  )
}
