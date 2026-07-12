import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Listing } from '../lib/types'
import { HERO_TAGLINES, pick } from '../lib/jokes'
import ListingCard from '../components/ListingCard'
import Marquee from '../components/Marquee'
import Reveal from '../components/Reveal'
import { useAuth } from '../context/AuthContext'

const STEPS = [
  { emoji: '📸', title: 'list it', joke: 'photograph the gadget. yes, even the dust. especially the dust.' },
  { emoji: '💬', title: 'chat', joke: 'someone claims it. you exchange messages and possibly memes.' },
  { emoji: '🤝', title: 'hand it off', joke: 'pickup or post — then bask in the glow of an empty drawer.' },
]

export default function Home() {
  const { session } = useAuth()
  const [fresh, setFresh] = useState<Listing[]>([])
  const tagline = useMemo(() => pick(HERO_TAGLINES), [])

  useEffect(() => {
    supabase
      .from('listings')
      .select('*, owner:profiles!listings_owner_id_fkey(*)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setFresh((data as Listing[]) ?? []))
  }, [])

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
          <Link to="/browse" className="btn blue">browse the catalogue →</Link>
          <Link to={session ? '/new' : '/auth'} className="btn ghost">give something away</Link>
        </div>
      </section>

      <Marquee />

      <section className="page">
        <div className="section-head">
          <h2>fresh arrivals<span style={{ color: 'var(--blue)' }}>.</span></h2>
          <Link to="/browse" className="see-all">see the whole catalogue →</Link>
        </div>
        {fresh.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', padding: '10px 0 30px' }}>
            the shelves are momentarily bare — your old laptop could be famous here.
          </p>
        ) : (
          <div className="grid" style={{ paddingBottom: 24 }}>
            {fresh.map((l, i) => (
              <Reveal key={l.id} delay={i * 70}>
                <ListingCard listing={l} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="page" style={{ paddingBottom: 70 }}>
        <div className="section-head">
          <h2>how it works<span style={{ color: 'var(--blue)' }}>.</span></h2>
          <span className="quip">three steps. zero pounds. one happier planet.</span>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="step-card">
                <div className="step-num">{i + 1}</div>
                <div className="step-emoji">{s.emoji}</div>
                <div className="step-title">{s.title}</div>
                <p>{s.joke}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  )
}
