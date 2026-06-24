import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../services/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.access_token, { username: data.username, role: data.role, profile_setup_done: data.profile_setup_done })
      if (data.role === 'admin') navigate('/admin/dashboard')
      else if (!data.profile_setup_done) navigate('/profile-setup')
      else navigate('/my-profile')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
          <h2>Welcome back</h2>
          <p>Sign in to your Coding Profile Tracker</p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter your username"
              autoComplete="off"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.85rem', fontSize: '1rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--muted)' }}>
          No account?{' '}
          <Link to="/signup" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
