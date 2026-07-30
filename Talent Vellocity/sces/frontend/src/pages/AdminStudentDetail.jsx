import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const CF_RATING_COLORS = {
  '800': '#94a3b8', '1000': '#10b981', '1200': '#10b981', '1400': '#3b82f6',
  '1600': '#3b82f6', '1800': '#8b5cf6', '2000': '#f59e0b', '2200': '#ef4444',
  '2400': '#ef4444', '2600': '#ef4444',
}

const CF_RANK_COLOR = {
  'newbie': '#94a3b8', 'pupil': '#10b981', 'specialist': '#06d6a0',
  'expert': '#3b82f6', 'candidate master': '#8b5cf6', 'master': '#f59e0b',
  'international master': '#f59e0b', 'grandmaster': '#ef4444',
  'international grandmaster': '#ef4444', 'legendary grandmaster': '#ef4444',
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background: `${color}08`, border: `1.5px solid ${color}22`,
      borderRadius: '12px', padding: '0.75rem 1.25rem', textAlign: 'center', flex: 1, minWidth: '95px'
    }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function RatingDistribution({ dist }) {
  if (!dist || Object.keys(dist).length === 0) return (
    <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>No solved problems data available</p>
  )
  const max = Math.max(...Object.values(dist), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.50rem' }}>
      {Object.entries(dist).map(([rating, count]) => (
        <div key={rating} className="rating-bar-row" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem' }}>
          <span className="rating-bar-label" style={{ width: '48px', color: CF_RATING_COLORS[rating] || '#94a3b8', fontWeight: 700, textAlign: 'right' }}>{rating}</span>
          <div className="rating-bar-track" style={{ flex: 1, height: '8px', background: 'rgba(11,78,162,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div className="rating-bar-fill"
              style={{ width: `${(count / max) * 100}%`, height: '100%', background: CF_RATING_COLORS[rating] || 'var(--primary)', borderRadius: '4px' }} />
          </div>
          <span className="rating-bar-count" style={{ width: '24px', color: 'var(--muted)', textAlign: 'right', fontWeight: 700 }}>{count}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminStudentDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => { loadStats() }, [id])

  const loadStats = () => {
    setLoadingStats(true); setError('')
    api.get(`/admin/students/${id}/stats`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load stats'))
      .finally(() => { setLoading(false); setLoadingStats(false) })
  }

  if (loading) return <div className="loading" style={{ minHeight: '100vh', justifyContent: 'center' }} />
  if (error && !data) return (
    <div className="page" style={{ textAlign: 'center', padding: '3rem' }}>
      <button className="btn-outline" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: '2rem' }}>← Back to Dashboard</button>
      <p className="error-msg">{error}</p>
    </div>
  )

  const { student, handles, stats, errors } = data
  const lc = stats.leetcode
  const cf = stats.codeforces
  const gh = stats.github
  const cfRankColor = CF_RANK_COLOR[cf?.rank?.toLowerCase()] || '#94a3b8'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Navbar with Sri Eshwar Logo */}
      <nav className="navbar">
        <div className="brand">
          <img src="/sece_logo.png" alt="Sri Eshwar College of Engineering" />
        </div>
        <nav>
          <button className="btn-outline" onClick={loadStats} disabled={loadingStats} style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}>
            {loadingStats ? 'Refreshing...' : '↻ Refresh'}
          </button>
          <button className="btn-outline" onClick={() => navigate('/admin/dashboard')} style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}>
            ← Back
          </button>
        </nav>
      </nav>

      <div className="page" style={{ maxWidth: '980px' }}>
        
        {/* Student header card */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 8px 24px rgba(11,78,162,0.2)'
          }}>
            {student.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text)' }}>{student.username}</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.86rem', marginTop: '0.15rem' }}>{student.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {handles.leetcode && <span className="badge badge-orange">🟡 Leetcode: {handles.leetcode}</span>}
            {handles.codeforces && <span className="badge badge-blue">🔵 Codeforces: {handles.codeforces}</span>}
            {handles.github && <span className="badge badge-green">🟢 GitHub: {handles.github}</span>}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem' }}>

          {/* LeetCode stats */}
          {lc && (
            <div className="platform-card lc" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🟡</span>
                  <span style={{ fontWeight: 800, color: '#ffa116', fontSize: '1.05rem' }}>LeetCode</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--muted)' }}>@{lc.username}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <StatPill label="Total" value={lc.total_solved} color="#ffa116" />
                  <StatPill label="Easy" value={lc.easy_solved} color="#10b981" />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <StatPill label="Medium" value={lc.medium_solved} color="#f59e0b" />
                  <StatPill label="Hard" value={lc.hard_solved} color="#ef4444" />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <StatPill label="Contest Rating" value={lc.contest_rating || '—'} color="#8b5cf6" />
                  <StatPill label="Global Rank" value={lc.ranking ? `#${lc.ranking}` : '—'} color="#94a3b8" />
                </div>
              </div>
            </div>
          )}

          {/* Codeforces stats */}
          {cf && (
            <div className="platform-card cf">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🔵</span>
                <span style={{ fontWeight: 800, color: '#3b82f6', fontSize: '1.05rem' }}>Codeforces</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--muted)' }}>@{cf.handle}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <StatPill label="Rating" value={cf.rating} color={cfRankColor} />
                <StatPill label="Max Rating" value={cf.max_rating} color="#3b82f6" />
                <StatPill label="Solved" value={cf.total_solved || '—'} color="#10b981" />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, background: `${cfRankColor}08`, border: `1.5px solid ${cfRankColor}22`, borderRadius: '10px', padding: '0.6rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: cfRankColor, textTransform: 'capitalize' }}>{cf.rank}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.2rem', fontWeight: 600 }}>Current Rank</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(11,78,162,0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.6rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--muted2)', textTransform: 'capitalize' }}>{cf.max_rank}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.2rem', fontWeight: 600 }}>Peak Rank</div>
                </div>
              </div>

              {cf.rating_distribution && Object.keys(cf.rating_distribution).length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Rating Distribution</div>
                  <RatingDistribution dist={cf.rating_distribution} />
                </div>
              )}
            </div>
          )}

          {/* GitHub stats */}
          {gh && (
            <div className="platform-card gh" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🟢</span>
                  <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.05rem' }}>GitHub</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--muted)' }}>@{gh.username}</span>
                </div>
                {gh.avatar && (
                  <img src={gh.avatar} alt="avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', marginBottom: '1.25rem', border: '2.5px solid rgba(16,185,129,0.3)', display: 'block' }} />
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <StatPill label="Public Repos" value={gh.public_repos} color="#10b981" />
                  <StatPill label="Followers" value={gh.followers} color="#3b82f6" />
                </div>
                {gh.active_days_last30 > 0 && (
                  <div style={{ padding: '0.6rem 1rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', fontSize: '0.84rem', color: '#10b981', fontWeight: 600 }}>
                    🟢 Active {gh.active_days_last30} days in last 30 days
                  </div>
                )}
              </div>
              
              <a href={gh.profile_url} target="_blank" rel="noreferrer" className="btn-outline"
                style={{ textDecoration: 'none', display: 'flex', width: '100%', padding: '0.5rem', fontSize: '0.82rem', marginTop: '1.25rem', justifyContent: 'center' }}>
                Open GitHub Profile ↗
              </a>
            </div>
          )}

        </div>

        {errors?.length > 0 && (
          <p className="error-msg" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            Metric sync issues encountered: {errors.map(e => e.platform).join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
