import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../services/AuthContext'

export default function ProfileSetup() {
  const [form, setForm] = useState({ leetcode_username: '', codeforces_handle: '', github_username: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const { markSetupDone, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/profile/setup', form)
      markSetupDone()
      navigate('/my-profile')
    } catch (err) {
      setError(err.response?.data?.detail || 'Setup failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const f = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  })

  const platforms = [
    { key: 'leetcode_username', label: 'LeetCode Username', icon: '🟡', placeholder: 'e.g. john_doe', color: '#ffa116' },
    { key: 'codeforces_handle', label: 'Codeforces Handle', icon: '🔵', placeholder: 'e.g. tourist', color: '#3b82f6' },
    { key: 'github_username', label: 'GitHub Username', icon: '⚫', placeholder: 'e.g. torvalds', color: '#4ade80' },
  ]

  return (
    <div className="auth-wrapper">
      <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💻</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff, var(--primary-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Set Up Your Profile
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
            Hi <strong style={{ color: 'var(--primary-light)' }}>{user?.username}</strong>! Link your coding accounts below.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {platforms.map(({ key, label, icon, placeholder, color }) => (
            <div className="form-group" key={key}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{icon}</span> {label}
              </label>
              <input
                {...f(key)}
                placeholder={placeholder}
                style={{ borderLeft: `3px solid ${color}` }}
              />
            </div>
          ))}

          {error && <p className="error-msg">{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{ width: '100%', padding: '0.85rem', marginTop: '1.25rem', fontSize: '1rem' }}
          >
            {saving ? 'Saving...' : 'Save & Continue →'}
          </button>
        </form>

        <button
          className="btn-outline"
          style={{ width: '100%', marginTop: '0.75rem' }}
          onClick={() => { logout(); navigate('/login') }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
