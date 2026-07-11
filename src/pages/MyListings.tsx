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

  useEffect(() => {
    if (!loading && !session) navigate('/auth', { state: { from: '/mine' } })
  }, [loading, session, navigate])

  useEffect(() => {
    if (!session) return
    supabase
      .from('listings')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings(data ?? [])
        setFetched(true)
      })
  }, [session?.user.id])

  if (loading || !session) return null

  return (
    <main className="page">
      <div className="section-head">
        <h2>my stuff<span style={{ color: 'var(--blue)' }}>.</span></h2>
        <span className="quip">everything you’ve bravely released into the wild.</span>
      </div>
      {fetched && listings.length === 0 ? (
        <div className="empty">
          <div className="big">🗄️</div>
          <p>you haven’t given anything away yet. that drawer isn’t going to empty itself.</p>
          <Link to="/new" className="btn blue" style={{ marginTop: 12 }}>give something away</Link>
        </div>
      ) : (
        <div className="grid">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </main>
  )
}
