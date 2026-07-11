import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Conversation, Message } from '../lib/types'

function ChatImage({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    supabase.storage
      .from('chat')
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelled && data) setUrl(data.signedUrl)
      })
    return () => {
      cancelled = true
    }
  }, [path])
  if (!url) return <div className="bubble">🖼️ developing the photo…</div>
  return <img className="chat-img" src={url} alt="shared in chat" onClick={() => window.open(url, '_blank', 'noopener')} />
}

type Props = {
  conversation: Conversation
  me: string
  onConversationUpdate: (c: Conversation) => void
  onBack: () => void
}

export default function ChatThread({ conversation, me, onConversationUpdate, onBack }: Props) {
  const [conv, setConv] = useState(conversation)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pickupDraft, setPickupDraft] = useState(conversation.pickup_location ?? '')
  const [addressDraft, setAddressDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isGiver = conv.giver_id === me
  const other = isGiver ? conv.receiver : conv.giver
  const confirmed = !!conv.handoff_confirmed_at

  const refreshConversation = async () => {
    const { data } = await supabase.from('conversations').select('*').eq('id', conv.id).single()
    if (data) {
      setConv((prev) => ({ ...prev, ...data }))
      onConversationUpdate({ ...conv, ...data })
    }
  }

  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      // realtime needs the user's token before subscribing to RLS-protected tables
      await supabase.realtime.setAuth()

      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })
      if (cancelled) return
      setMessages(data ?? [])

      channel = supabase
        .channel(`conv-${conversation.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
          (payload) => {
            const msg = payload.new as Message
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${conversation.id}` },
          (payload) => {
            const updated = payload.new as Conversation
            setConv((prev) => ({ ...prev, ...updated }))
          },
        )
        .subscribe()
    }
    init()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [conversation.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, conv.handoff_confirmed_at, conv.address_requested, conv.delivery_method])

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setDraft('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conv.id, sender_id: me, kind: 'text', body })
      .select('*')
      .single()
    if (error) {
      setDraft(body)
    } else if (data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]))
    }
    setSending(false)
  }

  const sendImage = async (file: File) => {
    setUploading(true)
    setActionError(null)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${conv.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('chat').upload(path, file)
      if (upErr) throw upErr
      const { data, error: insErr } = await supabase
        .from('messages')
        .insert({ conversation_id: conv.id, sender_id: me, kind: 'image', image_path: path })
        .select('*')
        .single()
      if (insErr) throw insErr
      if (data) setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Image refused to board the internet. Try again?')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const rpc = async (fn: string, args: Record<string, unknown>) => {
    setActionBusy(true)
    setActionError(null)
    const { error } = await supabase.rpc(fn, args)
    if (error) setActionError(error.message)
    await refreshConversation()
    setActionBusy(false)
  }

  const canConfirm =
    (conv.delivery_method === 'pickup' && !!conv.pickup_location) ||
    (conv.delivery_method === 'post' && !!conv.delivery_address)

  return (
    <>
      <div className="chat-head">
        <div>
          <button className="btn ghost small" onClick={onBack} style={{ marginRight: 10 }}>←</button>
          <span className="who">{other?.username ?? 'mystery human'}</span>
          <div className="about">
            about: {conv.listing?.title ?? 'an item'} · you’re the {isGiver ? 'giver 🎁' : 'receiver 🙌'}
          </div>
        </div>
        {confirmed && <span className="tag done">🤝 handed off</span>}
      </div>

      <div className="msgs">
        {messages.length === 0 && (
          <div className="msg system">
            <div className="bubble">say hi! 👋 negotiate the handoff. compliment the gadget. it’s listening.</div>
          </div>
        )}
        {messages.map((m) => {
          const cls = m.kind === 'system' ? 'system' : m.sender_id === me ? 'mine' : 'theirs'
          return (
            <div key={m.id} className={`msg ${cls}`}>
              {m.kind === 'image' && m.image_path ? (
                <ChatImage path={m.image_path} />
              ) : (
                <div className="bubble">{m.body}</div>
              )}
              {m.kind !== 'system' && (
                <div className="time">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {actionError && (
        <div className="error-note" style={{ margin: '10px 14px 0' }}>{actionError}</div>
      )}

      {confirmed ? (
        <div className="confirmed-banner">
          🤝 handoff confirmed — {conv.delivery_method === 'post' ? 'watch the letterbox!' : `pickup: ${conv.pickup_location}`}
        </div>
      ) : (
        <>
          {isGiver && (
            <div className="handoff-panel">
              <div className="hp-title">🎁 arrange the handoff</div>
              <div className="hp-row" style={{ marginBottom: 8 }}>
                <button
                  className={`pill-opt${conv.delivery_method === 'pickup' ? ' on' : ''}`}
                  disabled={actionBusy}
                  onClick={() => {
                    if (conv.delivery_method !== 'pickup') setConv((p) => ({ ...p, delivery_method: 'pickup' }))
                  }}
                >
                  📍 pickup
                </button>
                <button
                  className={`pill-opt${conv.delivery_method === 'post' ? ' on' : ''}`}
                  disabled={actionBusy}
                  onClick={() => rpc('set_delivery_method', { p_conversation_id: conv.id, p_method: 'post' })}
                >
                  📮 i’ll post it
                </button>
              </div>

              {conv.delivery_method === 'pickup' && (
                <div className="hp-row">
                  <input
                    type="text"
                    value={pickupDraft}
                    onChange={(e) => setPickupDraft(e.target.value)}
                    placeholder="location tag — e.g. Camden Library entrance"
                    maxLength={160}
                  />
                  <button
                    className="btn small"
                    disabled={actionBusy || pickupDraft.trim().length < 3}
                    onClick={() =>
                      rpc('set_delivery_method', {
                        p_conversation_id: conv.id,
                        p_method: 'pickup',
                        p_pickup_location: pickupDraft.trim(),
                      })
                    }
                  >
                    set spot
                  </button>
                </div>
              )}

              {conv.delivery_method === 'post' && (
                <div className="hp-note">
                  {conv.delivery_address
                    ? `📬 their address: ${conv.delivery_address}`
                    : 'address requested — waiting on the receiver. the pigeons are standing by.'}
                </div>
              )}

              <div className="hp-row" style={{ marginTop: 10 }}>
                <button
                  className="btn blue small"
                  disabled={actionBusy || !canConfirm}
                  onClick={() => rpc('confirm_handoff', { p_conversation_id: conv.id })}
                >
                  🤝 handoff confirmed
                </button>
              </div>
              <div className="hp-note">
                {canConfirm
                  ? 'all set — hit the button once the deed is done.'
                  : conv.delivery_method === 'pickup' && !conv.pickup_location
                    ? 'pickup needs a location tag first — "somewhere in town" doesn’t count.'
                    : conv.delivery_method === 'post'
                      ? 'you can confirm once their address arrives.'
                      : 'pick pickup (with a location tag) or post before confirming.'}
              </div>
            </div>
          )}

          {!isGiver && (
            <>
              {conv.delivery_method === 'post' && conv.address_requested && !conv.delivery_address && (
                <div className="handoff-panel">
                  <div className="hp-title">📮 address requested</div>
                  <div className="hp-note" style={{ marginTop: 0, marginBottom: 8 }}>
                    the giver wants to post it to you. your address is shared privately — only you two can see it, encrypted in transit, never shown in the chat.
                  </div>
                  <div className="hp-row">
                    <textarea
                      rows={2}
                      value={addressDraft}
                      onChange={(e) => setAddressDraft(e.target.value)}
                      placeholder="full name, street, city, postcode"
                      maxLength={400}
                    />
                    <button
                      className="btn blue small"
                      disabled={actionBusy || addressDraft.trim().length < 10}
                      onClick={() => rpc('submit_delivery_address', { p_conversation_id: conv.id, p_address: addressDraft.trim() })}
                    >
                      send address
                    </button>
                  </div>
                </div>
              )}
              {conv.delivery_method === 'post' && conv.delivery_address && (
                <div className="handoff-panel">
                  <div className="hp-note" style={{ marginTop: 0 }}>📬 address sent — now we wait for the postie.</div>
                </div>
              )}
              {conv.delivery_method === 'pickup' && conv.pickup_location && (
                <div className="handoff-panel">
                  <div className="hp-note" style={{ marginTop: 0 }}>📍 pickup spot: <strong>{conv.pickup_location}</strong></div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <form className="composer" onSubmit={send}>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) sendImage(f)
          }}
        />
        <button
          type="button"
          className="icon-btn"
          title="send a photo"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? '⏳' : '📎'}
        </button>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={confirmed ? 'say thanks, arrange a reunion tour…' : 'type a message…'}
          maxLength={2000}
        />
        <button type="submit" className="send-btn" title="send" disabled={sending || draft.trim() === ''}>
          ➤
        </button>
      </form>
    </>
  )
}
