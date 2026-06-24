import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function Signup() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚀</div>
          <h2>Create account</h2>
          <p>Join CodeTracker to track your coding journey</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Choose a username" required autoFocus />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 6 characters" required minLength={6} />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.85rem', fontSize: '1rem' }}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
