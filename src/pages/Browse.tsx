import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Category, Condition, Listing } from '../lib/types'
import { CATEGORIES, CONDITIONS } from '../lib/types'
import { EMPTY_CATALOGUE, pick } from '../lib/jokes'
import ListingCard from '../components/ListingCard'
import Reveal from '../components/Reveal'
import { useAuth } from '../context/AuthContext'

type Sort = 'new' | 'old' | 'az'

export default function Browse() {
  const { session } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [conds, setConds] = useState<Set<Condition>>(new Set())
  const [q, setQ] = useState('')
  const [area, setArea] = useState('')
  const [sort, setSort] = useState<Sort>('new')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const emptyJoke = useMemo(() => pick(EMPTY_CATALOGUE), [])

  useEffect(() => {
    supabase
      .from('listings')
      .select('*, owner:profiles!listings_owner_id_fkey(*)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings((data as Listing[]) ?? [])
        setLoading(false)
      })
  }, [])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const l of listings) map.set(l.category, (map.get(l.category) ?? 0) + 1)
    return map
  }, [listings])

  const shown = useMemo(() => {
    let out = listings.filter(
      (l) =>
        (cat === 'all' || l.category === cat) &&
        (conds.size === 0 || conds.has(l.condition)) &&
        (area.trim() === '' || l.location_area.toLowerCase().includes(area.trim().toLowerCase())) &&
        (q.trim() === '' || (l.title + ' ' + (l.description ?? '')).toLowerCase().includes(q.trim().toLowerCase())),
    )
    if (sort === 'old') out = [...out].reverse()
    if (sort === 'az') out = [...out].sort((a, b) => a.title.localeCompare(b.title))
    return out
  }, [listings, cat, conds, q, area, sort])

  const toggleCond = (c: Condition) => {
    setConds((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  const hasFilters = cat !== 'all' || conds.size > 0 || area.trim() !== '' || q.trim() !== ''

  return (
    <main className="page">
      <div className="shop-head">
        <h1>
          the catalogue<span style={{ color: 'var(--blue)' }}>.</span>
        </h1>
        <span className="quip">everything is £0.00. our pricing team is very consistent.</span>
      </div>

      <div className="shop-toolbar">
        <input
          type="search"
          className="shop-search"
          placeholder="search free tech… (try 'laptop', 'mysterious', 'roomba')"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="shop-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="sort by">
          <option value="new">newest first</option>
          <option value="old">oldest first</option>
          <option value="az">a → z</option>
        </select>
        <button className="btn ghost small filters-toggle" onClick={() => setFiltersOpen((v) => !v)}>
          {filtersOpen ? '✕ filters' : '☰ filters'}
        </button>
      </div>

      <div className="shop-layout">
        <aside className={`shop-side${filtersOpen ? ' open' : ''}`}>
          <div className="filter-group">
            <div className="filter-title">category</div>
            <button className={`filter-opt${cat === 'all' ? ' on' : ''}`} onClick={() => setCat('all')}>
              ✨ everything <span className="fcount">{listings.length}</span>
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`filter-opt${cat === c.id ? ' on' : ''}`} onClick={() => setCat(c.id)} title={c.joke}>
                {c.emoji} {c.label} <span className="fcount">{counts.get(c.id) ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-title">condition</div>
            {CONDITIONS.map((c) => (
              <label key={c.id} className="filter-check" title={c.joke}>
                <input type="checkbox" checked={conds.has(c.id)} onChange={() => toggleCond(c.id)} />
                {c.label}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-title">location</div>
            <input
              type="text"
              className="filter-input"
              placeholder="e.g. london"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>

          {hasFilters && (
            <button
              className="btn ghost small"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                setCat('all')
                setConds(new Set())
                setQ('')
                setArea('')
              }}
            >
              clear everything
            </button>
          )}
        </aside>

        <section>
          <div className="shop-count">
            {loading ? 'rummaging…' : `${shown.length} free find${shown.length === 1 ? '' : 's'}`}
            {hasFilters && !loading ? ' (filtered)' : ''}
          </div>

          {loading ? (
            <div className="grid shop-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="empty">
              <div className="big">🕳️</div>
              <p>{hasFilters ? 'nothing matches those filters. the algorithm apologises.' : emptyJoke}</p>
              {hasFilters ? (
                <button className="btn" style={{ marginTop: 12 }} onClick={() => { setCat('all'); setConds(new Set()); setQ(''); setArea('') }}>
                  clear filters
                </button>
              ) : (
                <Link to={session ? '/new' : '/auth'} className="btn blue" style={{ marginTop: 12 }}>
                  be the first to give
                </Link>
              )}
            </div>
          ) : (
            <div className="grid shop-grid">
              {shown.map((l, i) => (
                <Reveal key={l.id} delay={(i % 3) * 60}>
                  <ListingCard listing={l} />
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
