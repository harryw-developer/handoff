import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Category, Condition } from '../lib/types'
import { CATEGORIES, CONDITIONS } from '../lib/types'

export default function NewListing() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('computers')
  const [condition, setCondition] = useState<Condition>('good')
  const [locationArea, setLocationArea] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !session) navigate('/auth', { state: { from: '/new' } })
  }, [loading, session, navigate])

  const onFile = (f: File | null) => {
    setFile(f)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    setBusy(true)
    setError(null)
    try {
      let imageUrl: string | null = null
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from('listings').upload(path, file)
        if (upErr) throw upErr
        imageUrl = supabase.storage.from('listings').getPublicUrl(path).data.publicUrl
      }
      const { data, error: insErr } = await supabase
        .from('listings')
        .insert({
          owner_id: session.user.id,
          title: title.trim(),
          description: description.trim() || null,
          category,
          condition,
          location_area: locationArea.trim(),
          image_url: imageUrl,
        })
        .select('id')
        .single()
      if (insErr) throw insErr
      navigate(`/listing/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The upload gremlins struck. Try again?')
      setBusy(false)
    }
  }

  if (loading || !session) return null

  return (
    <main className="page">
      <div className="form-card" style={{ maxWidth: 640 }}>
        <h1>
          give something away<span style={{ color: 'var(--blue)' }}>.</span>
        </h1>
        <p className="quip">one person’s "I’ll fix it someday" is another’s "works perfectly, actually".</p>

        {error && <div className="error-note">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>photo</label>
            <label className="dropzone" style={{ display: 'block' }}>
              {preview ? <img src={preview} alt="preview" /> : <div style={{ fontSize: '2rem', marginBottom: 6 }}>📸</div>}
              {preview ? 'looking good — tap to swap' : 'add a photo — natural light, no filters, let it live its truth'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="field">
            <label htmlFor="title">what is it?</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2014 MacBook — fan sings, keys mostly present"
              minLength={3}
              maxLength={80}
              required
            />
          </div>

          <div className="field">
            <label>category</label>
            <div className="pill-row">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`pill-opt${category === c.id ? ' on' : ''}`}
                  onClick={() => setCategory(c.id)}
                  title={c.joke}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>condition</label>
            <div className="pill-row">
              {CONDITIONS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`pill-opt${condition === c.id ? ' on' : ''}`}
                  onClick={() => setCondition(c.id)}
                  title={c.joke}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="hint">{CONDITIONS.find((c) => c.id === condition)?.joke}</div>
          </div>

          <div className="field">
            <label htmlFor="area">general area</label>
            <input
              id="area"
              value={locationArea}
              onChange={(e) => setLocationArea(e.target.value)}
              placeholder="e.g. Camden, London"
              minLength={2}
              maxLength={80}
              required
            />
            <div className="hint">just the neighbourhood — exact pickup spot gets agreed privately in chat. safety first, gadgets second.</div>
          </div>

          <div className="field">
            <label htmlFor="desc">the honest story</label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="how old is it? does it work? does it make a noise it shouldn’t? we love honesty here."
            />
          </div>

          <button className="btn blue" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'wrapping it in bubble wrap…' : 'put it up for handoff'}
          </button>
        </form>
      </div>
    </main>
  )
}
