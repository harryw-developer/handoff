import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="page" style={{ textAlign: 'center', paddingBottom: 90 }}>
      <div className="big404">
        404<span className="dot">.</span>
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: '1.15rem', marginBottom: 28 }}>
        this page got handed off to someone else. we didn’t get their address.
      </p>
      <Link to="/" className="btn blue">back to the catalogue</Link>
    </main>
  )
}
