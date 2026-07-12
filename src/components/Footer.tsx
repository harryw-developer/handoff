import { useMemo } from 'react'
import { FOOTER_JOKES, pick } from '../lib/jokes'

export default function Footer() {
  const joke = useMemo(() => pick(FOOTER_JOKES), [])
  return (
    <footer className="footer">
      <div className="flogo">
        handoff<span style={{ color: 'var(--blue)' }}>.</span>
      </div>
      <div className="fjoke">{joke}</div>
      <div className="fjoke">
        made by <strong>harry</strong> — fuelled by tea and one very chatty robot 🤖
      </div>
      <div className="fjoke">© {new Date().getFullYear()} — free tech, freely given.</div>
    </footer>
  )
}
