import { LogOut, Stethoscope } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

interface TopBarProps {
  title: string
  subtitle: string
  children?: ReactNode
}

function initialsOf(name: string): string {
  const parts = name.replace(/^BS\.?\s*/i, '').trim().split(/\s+/)
  return (parts[parts.length - 1]?.[0] ?? 'U').toUpperCase()
}

export default function TopBar({ title, subtitle, children }: TopBarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Stethoscope size={18} color="var(--accent)" />
        <div>
          <div style={{ lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{subtitle}</div>
        </div>
      </div>
      <div className="navbar-spacer" />
      {children}
      {user && (
        <div className="navbar-user">
          <span className="doctor-avatar">{initialsOf(user.full_name)}</span>
          <span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user.full_name}</span>
            {user.specialty && <span className="badge badge-default text-sm" style={{ marginLeft: 8 }}>{user.specialty}</span>}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={14} />
          </button>
        </div>
      )}
    </nav>
  )
}
