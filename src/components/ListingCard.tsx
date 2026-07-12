import { Link } from 'react-router-dom'
import type { Listing } from '../lib/types'
import { CATEGORIES, CONDITIONS } from '../lib/types'
import { timeAgo } from '../lib/format'

export default function ListingCard({ listing }: { listing: Listing }) {
  const cat = CATEGORIES.find((c) => c.id === listing.category)
  const cond = CONDITIONS.find((c) => c.id === listing.condition)

  return (
    <Link to={`/listing/${listing.id}`} className="card">
      <div className="card-img">
        {listing.image_url ? <img src={listing.image_url} alt={listing.title} loading="lazy" /> : <span>{cat?.emoji ?? '📦'}</span>}
        <span className="cond-badge" title={cond?.joke}>{cond?.label}</span>
        {listing.status === 'handed_off' && <span className="sold-badge">🤝 handed off</span>}
      </div>
      <div className="card-body">
        <div className="card-title">{listing.title}</div>
        <div className="price-row">
          <span className="price">£0.00</span>
          <span className="price-was">rrp: one drawer of guilt</span>
        </div>
        <div className="card-meta">
          <span>📍 {listing.location_area}</span>
        </div>
        <div className="card-sub">
          {listing.owner?.username ? `by ${listing.owner.username} · ` : ''}
          {timeAgo(listing.created_at)}
        </div>
        <span className="grab-cta">grab it →</span>
      </div>
    </Link>
  )
}
