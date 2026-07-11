import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Category, Listing } from '../lib/types'
import { CATEGORIES } from '../lib/types'
import { EMPTY_CATALOGUE, HERO_TAGLINES, pick } from '../lib/jokes'
import ListingCard from '../components/ListingCard'
import Marquee from '../components/Marquee'
import Reveal from '../components/Reveal'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { session } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [search, setSearch] = useState('')
  const tagline = useMemo(() => pick(HERO_TAGLINES), [])
  const emptyJoke = useMemo(() => pick(EMPTY_CATALOGUE), [])

  useEffect(() => {
    supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings(data ?? [])
        setLoading(false)
      })
  }, [])

  const shown = listings.filter(
    (l) =>
      (cat === 'all' || l.category === cat) &&
      (search.trim() === '' || (l.title + ' ' + (l.description ?? '')).toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <main>
      <section className="page hero">
        <span className="hero-float" style={{ top: 30, right: '8%', animationDelay: '0s' }}>💾</span>
        <span className="hero-float" style={{ top: 150, right: '22%', animationDelay: '1.2s', fontSize: '2rem' }}>🔌</span>
        <span className="hero-float" style={{ top: 260, right: '6%', animationDelay: '2.1s', fontSize: '2.2rem' }}>🖥️</span>
        <h1>
          <span className="word" style={{ animationDelay: '0.05s' }}>old&nbsp;tech,</span>{' '}
          <span className="word accent" style={{ animationDelay: '0.2s' }}>new&nbsp;homes<span style={{ color: 'var(--ink)' }}>.</span></span>
        </h1>
        <p className="sub">
          {tagline} give away the gadgets gathering dust — or grab something free from a fellow human. no money, no fuss, no landfill.
        </p>
        <div className="hero-actions">
          <a href="#catalogue" className="btn blue">browse the goods ↓</a>
          <Link to={session ? '/new' : '/auth'} className="btn ghost">give something away</Link>
        </div>
      </section>

      <Marquee />

      <section className="page" id="catalogue">
        <div className="section-head">
          <h2>the catalogue</h2>
          <span className="quip">no account needed to snoop. we respect the lurkers.</span>
        </div>

        <div className="chips">
          <button className={`chip${cat === 'all' ? ' on' : ''}`} onClick={() => setCat('all')}>
            ✨ everything
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={`chip${cat === c.id ? ' on' : ''}`} onClick={() => setCat(c.id)} title={c.joke}>
              {c.emoji} {c.label}
            </button>
          ))}
          <input
            type="search"
            placeholder="search the pile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              marginLeft: 'auto',
              padding: '9px 16px',
              borderRadius: 999,
              border: '1.5px solid var(--line)',
              background: 'var(--card)',
              fontSize: '0.92rem',
            }}
          />
        </div>

        {loading ? (
          <div className="grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="empty">
            <div className="big">🕳️</div>
            <p>{emptyJoke}</p>
            <Link to={session ? '/new' : '/auth'} className="btn blue" style={{ marginTop: 12 }}>
              be the first to give
            </Link>
          </div>
        ) : (
          <div className="grid">
            {shown.map((l, i) => (
              <Reveal key={l.id} delay={(i % 4) * 60}>
                <ListingCard listing={l} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
