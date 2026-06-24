import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const CF_RATING_COLORS = {
  '800': '#94a3b8', '1000': '#4ade80', '1200': '#4ade80', '1400': '#60a5fa',
  '1600': '#60a5fa', '1800': '#a78bfa', '2000': '#f59e0b', '2200': '#f87171',
  '2400': '#ef4444', '2600': '#ef4444',
}

const CF_RANK_COLOR = {
  'newbie': '#94a3b8', 'pupil': '#4ade80', 'specialist': '#06d6a0',
  'expert': '#60a5fa', 'candidate master': '#a78bfa', 'master': '#f59e0b',
  'international master': '#f59e0b', 'grandmaster': '#f87171',
  'international grandmaster': '#ef4444', 'legendary grandmaster': '#ef4444',
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background: `${color}12`, border: `1px solid ${color}30`,
      borderRadius: '10px', padding: '0.75rem 1rem', textAlign: 'center', flex: 1, minWidth: '90px'
    }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  )
}

function RatingDistribution({ dist }) {
  if (!dist || Object.keys(dist).length === 0) return (
    <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>No solved problems data available</p>
  )
  const max = Math.max(...Object.values(dist), 1)
  return (
    <div>
      {Object.entries(dist).map(([rating, count]) => (
        <div key={rating} className="rating-bar-row">
          <span className="rating-bar-label" style={{ color: CF_RATING_COLORS[rating] || '#94a3b8' }}>{rating}</span>
          <div className="rating-bar-track">
            <div className="rating-bar-fill"
              style={{ width: `${(count / max) * 100}%`, background: CF_RATING_COLORS[rating] || '#6366f1' }} />
          </div>
          <span className="rating-bar-count">{count}</span>
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
    <div className="page">
      <button className="btn-outline" onClick={() => navigate('/admin/dashboard')} style={{ marginBottom: '1rem' }}>← Back</button>
      <p className="error-msg">{error}</p>
    </div>
  )

  const { student, handles, stats, errors } = data
  const lc = stats.leetcode
  const cf = stats.codeforces
  const gh = stats.github
  const cfRankColor = CF_RANK_COLOR[cf?.rank?.toLowerCase()] || '#94a3b8'

  return (
    <div>
      <nav className="navbar">
        <span className="brand">⚡ CodeTracker</span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-outline" onClick={loadStats} disabled={loadingStats} style={{ padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}>
            {loadingStats ? 'Refreshing...' : '↻ Refresh'}
          </button>
          <button className="btn-outline" onClick={() => navigate('/admin/dashboard')} style={{ padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}>
            ← Back
          </button>
        </div>
      </nav>

      <div className="page" style={{ maxWidth: '960px' }}>

        {/* Student header */}
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)'
          }}>
            {student.username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{student.username}</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>{student.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'LeetCode', handle: handles.leetcode, color: '#ffa116', icon: '🟡' },
              { label: 'Codeforces', handle: handles.codeforces, color: '#3b82f6', icon: '🔵' },
              { label: 'GitHub', handle: handles.github, color: '#4ade80', icon: '⚫' },
            ].map(({ label, handle, color, icon }) => (
              <div key={label} style={{
                background: handle ? `${color}12` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${handle ? color + '40' : 'var(--border)'}`,
                borderRadius: '10px', padding: '0.5rem 0.9rem', minWidth: '120px',
              }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.72rem', marginBottom: '0.2rem' }}>{icon} {label}</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: handle ? color : 'var(--muted)' }}>{handle || 'Not linked'}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

          {/* LeetCode */}
          {lc && (
            <div className="card" style={{ borderTop: '2px solid #ffa116' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🟡</span>
                <span style={{ fontWeight: 700, color: '#ffa116' }}>LeetCode</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--muted)' }}>@{lc.username}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <StatPill label="Total" value={lc.total_solved} color="#ffa116" />
                <StatPill label="Easy" value={lc.easy_solved} color="#4ade80" />
                <StatPill label="Medium" value={lc.medium_solved} color="#fbbf24" />
                <StatPill label="Hard" value={lc.hard_solved} color="#f87171" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <StatPill label="Contest Rating" value={lc.contest_rating || '—'} color="#a78bfa" />
                <StatPill label="Contests" value={lc.contests_attended} color="#60a5fa" />
                <StatPill label="Global Rank" value={lc.ranking ? `#${lc.ranking}` : '—'} color="#94a3b8" />
              </div>
            </div>
          )}

          {/* Codeforces */}
          {cf && (
            <div className="card" style={{ borderTop: `2px solid ${cfRankColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔵</span>
                <span style={{ fontWeight: 700, color: '#60a5fa' }}>Codeforces</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--muted)' }}>@{cf.handle}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <StatPill label="Rating" value={cf.rating} color={cfRankColor} />
                <StatPill label="Max Rating" value={cf.max_rating} color="#60a5fa" />
                <StatPill label="Solved" value={cf.total_solved || '—'} color="#06d6a0" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, background: `${cfRankColor}12`, border: `1px solid ${cfRankColor}30`, borderRadius: '10px', padding: '0.6rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: cfRankColor, textTransform: 'capitalize' }}>{cf.rank}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.15rem' }}>Current Rank</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.6rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--muted2)', textTransform: 'capitalize' }}>{cf.max_rank}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.15rem' }}>Peak Rank</div>
                </div>
              </div>
              {cf.rating_distribution && Object.keys(cf.rating_distribution).length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Problems by Rating</div>
                  <RatingDistribution dist={cf.rating_distribution} />
                </div>
              )}
              {cf.topic_breakdown && Object.keys(cf.topic_breakdown).length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>Topic Breakdown</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {Object.entries(cf.topic_breakdown).map(([topic, count]) => (
                      <span key={topic} style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.72rem' }}>
                        {topic} · {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GitHub */}
          {gh && (
            <div className="card" style={{ borderTop: '2px solid #4ade80' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⚫</span>
                <span style={{ fontWeight: 700, color: '#4ade80' }}>GitHub</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--muted)' }}>@{gh.username}</span>
              </div>
              {gh.avatar && (
                <img src={gh.avatar} alt="avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', marginBottom: '1rem', border: '2px solid rgba(74,222,128,0.3)' }} />
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <StatPill label="Repos" value={gh.public_repos} color="#4ade80" />
                <StatPill label="Followers" value={gh.followers} color="#06d6a0" />
                <StatPill label="Following" value={gh.following} color="#94a3b8" />
              </div>
              {gh.active_days_last30 > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.6rem 1rem', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', fontSize: '0.85rem', color: '#4ade80' }}>
                  🟢 Active {gh.active_days_last30} days in last 30 days
                </div>
              )}
              <a href={gh.profile_url} target="_blank" rel="noreferrer"
                style={{ display: 'block', marginTop: '0.75rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted2)', textDecoration: 'none', padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                View GitHub Profile ↗
              </a>
            </div>
          )}

        </div>

        {errors?.length > 0 && (
          <p className="error-msg" style={{ marginTop: '1rem' }}>
            Failed to fetch: {errors.map(e => e.platform).join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
