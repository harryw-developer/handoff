import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Listing } from '../lib/types'
import { CATEGORIES, CONDITIONS } from '../lib/types'

export default function ListingDetail() {
  const { id } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('listings')
      .select('*, owner:profiles!listings_owner_id_fkey(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setListing(data)
        setLoading(false)
      })
  }, [id])

  const startChat = async () => {
    if (!session) {
      navigate('/auth', { state: { from: `/listing/${id}` } })
      return
    }
    if (!listing) return
    setBusy(true)
    setError(null)
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('receiver_id', session.user.id)
        .maybeSingle()
      if (existing) {
        navigate(`/messages/${existing.id}`)
        return
      }
      const { data, error: insErr } = await supabase
        .from('conversations')
        .insert({ listing_id: listing.id, giver_id: listing.owner_id, receiver_id: session.user.id })
        .select('id')
        .single()
      if (insErr) throw insErr
      navigate(`/messages/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat refused to open. Rude. Try again?')
      setBusy(false)
    }
  }

  if (loading)
    return (
      <main className="page">
        <div className="detail">
          <div className="skeleton" style={{ aspectRatio: '4/3' }} />
          <div className="skeleton" style={{ aspectRatio: '4/3' }} />
        </div>
      </main>
    )

  if (!listing)
    return (
      <main className="page empty">
        <div className="big">🔍</div>
        <p>this listing has vanished — possibly rehomed, possibly abducted.</p>
        <Link to="/" className="btn" style={{ marginTop: 12 }}>back to browsing</Link>
      </main>
    )

  const cat = CATEGORIES.find((c) => c.id === listing.category)
  const cond = CONDITIONS.find((c) => c.id === listing.condition)
  const isOwner = session?.user.id === listing.owner_id

  return (
    <main className="page">
      <div className="detail">
        <div className="detail-img">
          {listing.image_url ? <img src={listing.image_url} alt={listing.title} /> : <span>{cat?.emoji ?? '📦'}</span>}
        </div>
        <div>
          <span className="tag">{cat?.emoji} {cat?.label} · 100% free</span>
          <h1>{listing.title}</h1>
          <div className="detail-meta">
            <span className="tag">📍 {listing.location_area}</span>
            <span className="tag" title={cond?.joke}>condition: {cond?.label}</span>
            {listing.status === 'handed_off' && <span className="tag done">🤝 already handed off</span>}
          </div>
          <p className="desc">{listing.description || 'no description. a gadget of few words.'}</p>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
            offered by <strong>{listing.owner?.username ?? 'a generous stranger'}</strong>
          </p>

          {error && <div className="error-note">{error}</div>}

          {listing.status === 'handed_off' ? (
            <p style={{ color: 'var(--ink-soft)' }}>this one found its person. the drawer of shame grows lighter.</p>
          ) : isOwner ? (
            <p style={{ color: 'var(--ink-soft)' }}>this is your listing — interested humans will appear in your messages.</p>
          ) : (
            <button className="btn blue" onClick={startChat} disabled={busy}>
              {busy ? 'opening the chat…' : session ? '💬 message the giver' : 'sign in to claim it'}
            </button>
          )}
          {!session && (
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem', marginTop: 10 }}>
              browsing is free-range. claiming needs an account — takes about 20 seconds, less time than untangling one (1) cable.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
