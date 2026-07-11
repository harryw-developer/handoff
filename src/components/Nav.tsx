import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="handoff home">
      handoff<span className="dot">.</span>
    </Link>
  )
}

export default function Nav() {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="nav">
      <div className="nav-inner">
        <Logo />
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            browse
          </NavLink>
          {session && (
            <>
              <NavLink to="/new" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                give tech
              </NavLink>
              <NavLink to="/messages" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                messages
              </NavLink>
              <NavLink to="/mine" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                my stuff
              </NavLink>
              <button
                className="nav-link"
                title={profile ? `signed in as ${profile.username}` : undefined}
                onClick={async () => {
                  await signOut()
                  navigate('/')
                }}
              >
                sign out
              </button>
            </>
          )}
          {!session && (
            <NavLink to="/auth" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              sign in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
