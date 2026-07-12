import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Listing } from '../lib/types'
import ListingCard from '../components/ListingCard'

export default function MyListings() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [fetched, setFetched] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !session) navigate('/auth', { state: { from: '/mine' } })
  }, [loading, session, navigate])

  useEffect(() => {
    if (!session) return
    supabase
      .from('listings')
      .select('*, owner:profiles!listings_owner_id_fkey(*)')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings((data as Listing[]) ?? [])
        setFetched(true)
      })
  }, [session?.user.id])

  const deleteListing = async (l: Listing) => {
    if (!window.confirm(`Delete "${l.title}" for good? Its chats go with it. No takebacks.`)) return
    setBusyId(l.id)
    setError(null)
    const { error: delErr } = await supabase.from('listings').delete().eq('id', l.id)
    if (delErr) {
      setError(delErr.message)
    } else {
      // best-effort: tidy the photo out of storage too
      if (l.image_url) {
        const path = l.image_url.split('/listings/')[1]
        if (path) await supabase.storage.from('listings').remove([decodeURIComponent(path)])
      }
      setListings((prev) => prev.filter((x) => x.id !== l.id))
    }
    setBusyId(null)
  }

  const cancelHandoff = async (l: Listing) => {
    if (!window.confirm(`Put "${l.title}" back in the catalogue? The receiver will see the handoff was cancelled.`)) return
    setBusyId(l.id)
    setError(null)
    const { error: rpcErr } = await supabase.rpc('cancel_handoff', { p_listing_id: l.id })
    if (rpcErr) setError(rpcErr.message)
    else setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, status: 'available' } : x)))
    setBusyId(null)
  }

  if (loading || !session) return null

  return (
    <main className="page">
      <div className="section-head">
        <h2>my stuff<span style={{ color: 'var(--blue)' }}>.</span></h2>
        <span className="quip">everything you’ve bravely released into the wild.</span>
      </div>

      {error && <div className="error-note">{error}</div>}

      {fetched && listings.length === 0 ? (
        <div className="empty">
          <div className="big">🗄️</div>
          <p>you haven’t given anything away yet. that drawer isn’t going to empty itself.</p>
          <Link to="/new" className="btn blue" style={{ marginTop: 12 }}>give something away</Link>
        </div>
      ) : (
        <div className="grid">
          {listings.map((l) => (
            <div key={l.id} className="mine-card">
              <ListingCard listing={l} />
              <div className="mine-actions">
                {l.status === 'handed_off' && (
                  <button className="btn ghost small" disabled={busyId === l.id} onClick={() => cancelHandoff(l)}>
                    ↩️ put it back
                  </button>
                )}
                <button className="btn small danger" disabled={busyId === l.id} onClick={() => deleteListing(l)}>
                  🗑 delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
