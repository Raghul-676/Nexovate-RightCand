import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../services/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [selectedRole, setSelectedRole] = useState('student')
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
      
      // Basic check to ensure student vs admin role selector alignment
      if (selectedRole === 'admin' && data.role !== 'admin') {
        throw new Error('Access denied. Logged in user does not have Admin privileges.')
      }
      if (selectedRole === 'student' && data.role === 'admin') {
        throw new Error('Access denied. Please use the Admin tab to log in as an administrator.')
      }

      login(data.access_token, { username: data.username, role: data.role, profile_setup_done: data.profile_setup_done })
      if (data.role === 'admin') navigate('/admin/dashboard')
      else if (!data.profile_setup_done) navigate('/profile-setup')
      else navigate('/my-profile')
    } catch (err) {
      setError(err.message || err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <img src="/sece_logo.png" alt="Sri Eshwar College of Engineering" className="auth-logo" />
      
      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>RightCand</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Student Centralized Evaluation System</p>
        </div>

        {/* Tab-style Role Selector */}
        <div className="role-tabs" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {['student', 'admin'].map((role) => (
            <div
              key={role}
              className={`role-tab ${selectedRole === role ? 'active' : ''}`}
              onClick={() => {
                setSelectedRole(role)
                setError('')
              }}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Username / Email</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder={`Enter your ${selectedRole} username`}
              autoComplete="off"
              required
              autoFocus
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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

          {error && <p className="error-msg" style={{ textAlign: 'center' }}>{error}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn-outline" type="button" onClick={() => setForm({ username: '', password: '' })} style={{ width: '100%' }}>
              Cancel
            </button>
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </div>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--muted)' }}>
          No account?{' '}
          <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
