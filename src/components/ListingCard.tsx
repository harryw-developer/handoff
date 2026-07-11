import { Link } from 'react-router-dom'
import type { Listing } from '../lib/types'
import { CATEGORIES, CONDITIONS } from '../lib/types'

export default function ListingCard({ listing }: { listing: Listing }) {
  const cat = CATEGORIES.find((c) => c.id === listing.category)
  const cond = CONDITIONS.find((c) => c.id === listing.condition)

  return (
    <Link to={`/listing/${listing.id}`} className="card">
      <div className="card-img">
        {listing.image_url ? <img src={listing.image_url} alt={listing.title} loading="lazy" /> : <span>{cat?.emoji ?? '📦'}</span>}
      </div>
      <div className="card-body">
        <div className="card-title">{listing.title}</div>
        <div className="card-meta">
          <span>📍 {listing.location_area}</span>
          <span>·</span>
          <span>{cond?.label}</span>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', gap: 6 }}>
          {listing.status === 'handed_off' ? (
            <span className="tag done">🤝 handed off</span>
          ) : (
            <span className="tag">free · {cat?.label}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
