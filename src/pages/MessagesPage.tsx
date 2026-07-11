import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Conversation } from '../lib/types'
import { EMPTY_MESSAGES, pick } from '../lib/jokes'
import ChatThread from '../components/ChatThread'

export default function MessagesPage() {
  const { id } = useParams()
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [fetched, setFetched] = useState(false)
  const emptyJoke = useMemo(() => pick(EMPTY_MESSAGES), [])

  useEffect(() => {
    if (!loading && !session) navigate('/auth', { state: { from: '/messages' } })
  }, [loading, session, navigate])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    const load = async () => {
      const { data } = await supabase
        .from('conversations')
        .select(
          '*, listing:listings(*), giver:profiles!conversations_giver_id_fkey(*), receiver:profiles!conversations_receiver_id_fkey(*)',
        )
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setConvs((data as Conversation[]) ?? [])
        setFetched(true)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session?.user.id])

  if (loading || !session) return null

  const active = convs.find((c) => c.id === id) ?? null

  return (
    <main className="page">
      <div className="section-head">
        <h2>messages<span style={{ color: 'var(--blue)' }}>.</span></h2>
        <span className="quip">where gadgets change hands and jokes fall flat.</span>
      </div>

      {fetched && convs.length === 0 ? (
        <div className="empty">
          <div className="big">📭</div>
          <p>{emptyJoke}</p>
          <Link to="/" className="btn blue" style={{ marginTop: 12 }}>browse the catalogue</Link>
        </div>
      ) : (
        <div className={`chat-layout${active ? ' thread-open' : ''}`}>
          <div className="conv-list">
            {convs.map((c) => {
              const other = c.giver_id === session.user.id ? c.receiver : c.giver
              const role = c.giver_id === session.user.id ? 'giving' : 'receiving'
              return (
                <button key={c.id} className={`conv-item${c.id === id ? ' on' : ''}`} onClick={() => navigate(`/messages/${c.id}`)}>
                  <div className="conv-thumb">
                    {c.listing?.image_url ? <img src={c.listing.image_url} alt="" /> : <span>📦</span>}
                  </div>
                  <div className="conv-info">
                    <div className="t">{c.listing?.title ?? 'mystery item'}</div>
                    <div className="s">
                      {role} · with {other?.username ?? 'someone'}
                      {c.handoff_confirmed_at ? ' · 🤝 done' : ''}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="chat-main">
            {active ? (
              <ChatThread
                key={active.id}
                conversation={active}
                me={session.user.id}
                onConversationUpdate={(updated) =>
                  setConvs((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
                }
                onBack={() => navigate('/messages')}
              />
            ) : (
              <div className="empty" style={{ margin: 'auto' }}>
                <div className="big">👈</div>
                <p>pick a conversation. they don’t bite. (the gadgets might.)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
