import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../services/AuthContext'

const platforms = [
  { key: 'leetcode_username', label: 'LeetCode Username', icon: '🟡', placeholder: 'e.g. john_doe', color: '#ffa116' },
  { key: 'codeforces_handle', label: 'Codeforces Handle', icon: '🔵', placeholder: 'e.g. tourist', color: '#3b82f6' },
  { key: 'github_username', label: 'GitHub Username', icon: '⚫', placeholder: 'e.g. torvalds', color: '#4ade80' },
]

const COMPLEXITY_COLOR = { Advanced: '#f87171', Intermediate: '#fbbf24', Beginner: '#4ade80' }

const CF_RATING_COLORS = {
  '800': '#94a3b8', '1000': '#4ade80', '1200': '#4ade80', '1400': '#60a5fa',
  '1600': '#60a5fa', '1800': '#a78bfa', '2000': '#f59e0b', '2200': '#f87171',
  '2400': '#ef4444', '2600': '#ef4444',
}

// ── Radar Chart (pure SVG, no library) ──────────────────────────────────────
function RadarChart({ data }) {
  if (!data || Object.keys(data).length === 0) return (
    <p style={{ color: 'var(--muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem' }}>No topic data</p>
  )
  const labels = Object.keys(data)
  const values = Object.values(data)
  const max = Math.max(...values, 1)
  const n = labels.length
  const cx = 130, cy = 130, r = 100
  const levels = 4

  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2
  const point = (i, ratio) => ({
    x: cx + r * ratio * Math.cos(angle(i)),
    y: cy + r * ratio * Math.sin(angle(i)),
  })

  const gridPolygons = Array.from({ length: levels }, (_, l) => {
    const ratio = (l + 1) / levels
    return Array.from({ length: n }, (_, i) => point(i, ratio))
      .map(p => `${p.x},${p.y}`).join(' ')
  })

  const dataPoints = labels.map((_, i) => point(i, values[i] / max))
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  const labelPoints = labels.map((label, i) => {
    const p = point(i, 1.22)
    return { label, x: p.x, y: p.y }
  })

  return (
    <div className="radar-wrap">
      <svg viewBox="0 0 260 260">
        {gridPolygons.map((pts, i) => (
          <polygon key={i} className="radar-grid" points={pts} />
        ))}
        {Array.from({ length: n }, (_, i) => {
          const p = point(i, 1)
          return <line key={i} className="radar-axis" x1={cx} y1={cy} x2={p.x} y2={p.y} />
        })}
        <polygon className="radar-polygon" points={dataPolygon} />
        {dataPoints.map((p, i) => (
          <circle key={i} className="radar-dot" cx={p.x} cy={p.y} r={3} />
        ))}
        {labelPoints.map(({ label, x, y }, i) => (
          <text key={i} className="radar-label" x={x} y={y} textAnchor="middle" dominantBaseline="middle">
            {label.length > 10 ? label.slice(0, 9) + '…' : label}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ── Consistency Ring ─────────────────────────────────────────────────────────
function ConsistencyRing({ value, max, label, color }) {
  const r = 36, circ = 2 * Math.PI * r
  const ratio = Math.min(value / (max || 1), 1)
  const offset = circ * (1 - ratio)
  return (
    <div className="consistency-ring">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle className="ring-bg" cx="45" cy="45" r={r} />
        <circle className="ring-fill" cx="45" cy="45" r={r}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-label">
        <span className="ring-value" style={{ color }}>{value}</span>
        <span className="ring-sub">{label}</span>
      </div>
    </div>
  )
}

// ── CF Rating Distribution ───────────────────────────────────────────────────
function RatingDistribution({ dist }) {
  if (!dist || Object.keys(dist).length === 0) return (
    <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>No solved problems data</p>
  )
  const max = Math.max(...Object.values(dist), 1)
  return (
    <div>
      {Object.entries(dist).map(([rating, count]) => (
        <div key={rating} className="rating-bar-row">
          <span className="rating-bar-label">{rating}</span>
          <div className="rating-bar-track">
            <div className="rating-bar-fill"
              style={{ width: `${(count / max) * 100}%`, background: CF_RATING_COLORS[rating] || '#6366f1' }}
            />
          </div>
          <span className="rating-bar-count">{count}</span>
        </div>
      ))}
    </div>
  )
}

// ── Stack Bar ────────────────────────────────────────────────────────────────
function StackBar({ label, pct }) {
  const filled = Math.round((pct / 100) * 20)
  const empty = 20 - filled
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
      <span style={{ width: '120px', color: 'var(--muted2)', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#60a5fa', letterSpacing: '-1px' }}>{'█'.repeat(filled)}{'░'.repeat(empty)}</span>
      <span style={{ color: 'var(--muted)', minWidth: '36px' }}>{pct}%</span>
    </div>
  )
}

// ── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ repo }) {
  const stack = (() => { try { return JSON.parse(repo.stack_breakdown || '{}') } catch { return {} } })()
  const color = COMPLEXITY_COLOR[repo.complexity] || '#94a3b8'
  return (
    <div className="card" style={{ borderTop: `2px solid ${color}`, marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{repo.project_name || 'Unknown'}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.2rem', wordBreak: 'break-all' }}>{repo.repo_url}</div>
        </div>
        <span style={{ background: color + '22', color, border: `1px solid ${color}`, borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0, marginLeft: '0.75rem' }}>
          {repo.complexity || '—'}
        </span>
      </div>
      {repo.summary && <p style={{ fontSize: '0.82rem', color: 'var(--muted2)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{repo.summary}</p>}
      {Object.keys(stack).length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Tech Stack</div>
          {Object.entries(stack).map(([k, v]) => <StackBar key={k} label={k} pct={v} />)}
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MyProfile() {
  const [form, setForm] = useState({ leetcode_username: '', codeforces_handle: '', github_username: '' })
  const [stats, setStats] = useState(null)
  const [statsErrors, setStatsErrors] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [repoInput, setRepoInput] = useState('')
  const [repoList, setRepoList] = useState([])
  const [analysing, setAnalysing] = useState(false)
  const [repoError, setRepoError] = useState('')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/profile/me')
      .then(({ data }) => setForm({
        leetcode_username: data.leetcode_username || '',
        codeforces_handle: data.codeforces_handle || '',
        github_username: data.github_username || '',
      }))
      .catch(() => {})
      .finally(() => setLoading(false))
    api.get('/projects/my-repos').then(({ data }) => setRepoList(data)).catch(() => {})
  }, [])

  const fetchStats = () => {
    setLoadingStats(true); setStatsErrors([])
    api.get('/profile/my-stats')
      .then(({ data }) => { setStats(data.stats); setStatsErrors(data.errors || []) })
      .catch(() => setStatsErrors([{ platform: 'all', error: 'Failed to load stats' }]))
      .finally(() => setLoadingStats(false))
  }

  const handleSave = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setSaving(true)
    try {
      await api.put('/profile/update', form)
      setSuccess('Profile updated!'); setTimeout(() => setSuccess(''), 3000); setStats(null)
    } catch (err) { setError(err.response?.data?.detail || 'Update failed') }
    finally { setSaving(false) }
  }

  const handleAnalyseRepos = async () => {
    const urls = repoInput.split('\n').map(u => u.trim()).filter(Boolean)
    if (!urls.length) return
    setRepoError(''); setAnalysing(true)
    try {
      const { data } = await api.post('/projects/analyse', { repo_urls: urls })
      setRepoList(prev => {
        const seen = new Set(data.map(r => r.repo_url))
        return [...prev.filter(r => !seen.has(r.repo_url)), ...data]
      })
      setRepoInput('')
    } catch (err) { setRepoError(err.response?.data?.detail || 'Analysis failed') }
    finally { setAnalysing(false) }
  }

  const f = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) })

  const lc = stats?.leetcode
  const cf = stats?.codeforces
  const gh = stats?.github

  // Consistency score: average of active days across platforms (0-100)
  const lcDays = lc?.active_days_last20 || 0
  const cfDays = cf?.active_days_last100 || 0
  const ghDays = gh?.active_days_last30 || 0

  return (
    <div>
      <nav className="navbar">
        <span className="brand">⚡ CodeTracker</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--muted2)', fontSize: '0.88rem' }}>👤 {user?.username}</span>
          <button className="btn-outline" style={{ padding: '0.35rem 0.9rem' }} onClick={() => { logout(); navigate('/login') }}>Logout</button>
        </div>
      </nav>

      <div className="page" style={{ maxWidth: '960px' }}>
        <h1 className="page-title">My Coding Profile</h1>

        {/* ── Top grid: form + stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }} className="profile-grid">

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Linked Accounts</h3>
            {loading ? <div className="loading" style={{ padding: '2rem' }} /> : (
              <form onSubmit={handleSave}>
                {platforms.map(({ key, label, icon, placeholder, color }) => (
                  <div className="form-group" key={key}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{icon} {label}</label>
                    <input {...f(key)} placeholder={placeholder} style={{ borderLeft: `3px solid ${color}` }} />
                  </div>
                ))}
                {error && <p className="error-msg">{error}</p>}
                {success && <p className="success-msg">✓ {success}</p>}
                <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }}>
                  {saving ? 'Saving...' : 'Update Profile'}
                </button>
              </form>
            )}
          </div>

          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Stats</h3>
                <button className="btn-accent" onClick={fetchStats} disabled={loadingStats} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  {loadingStats ? 'Loading...' : stats ? '↻ Refresh' : '▶ Load Stats'}
                </button>
              </div>
              {!stats && !loadingStats && <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '1rem' }}>Click "Load Stats" to fetch your live coding stats.</p>}
              {loadingStats && <div className="loading" style={{ padding: '2rem' }} />}
              {statsErrors.length > 0 && <p className="error-msg" style={{ marginTop: '0.75rem' }}>Failed: {statsErrors.map(e => e.platform).join(', ')}</p>}
            </div>

            {/* Basic stat rows */}
            {stats && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {lc && (
                  <div className="platform-card lc">
                    <div className="platform-name" style={{ color: '#ffa116' }}>🟡 LeetCode — {lc.username}</div>
                    {[['Total Solved', lc.total_solved], ['Easy / Med / Hard', `${lc.easy_solved} / ${lc.medium_solved} / ${lc.hard_solved}`],
                      ['Contest Rating', lc.contest_rating], ['Global Rank', lc.ranking || '—']].map(([k, v]) => (
                      <div className="stat-row" key={k}><span>{k}</span><span>{v}</span></div>
                    ))}
                  </div>
                )}
                {cf && (
                  <div className="platform-card cf">
                    <div className="platform-name" style={{ color: '#60a5fa' }}>🔵 Codeforces — {cf.handle}</div>
                    {[['Rating', cf.rating], ['Max Rating', cf.max_rating], ['Rank', cf.rank], ['Total Solved', cf.total_solved || '—']].map(([k, v]) => (
                      <div className="stat-row" key={k}><span>{k}</span><span>{v}</span></div>
                    ))}
                  </div>
                )}
                {gh && (
                  <div className="platform-card gh">
                    <div className="platform-name" style={{ color: '#4ade80' }}>⚫ GitHub — {gh.username}</div>
                    {[['Public Repos', gh.public_repos], ['Followers', gh.followers]].map(([k, v]) => (
                      <div className="stat-row" key={k}><span>{k}</span><span>{v}</span></div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Deep Analytics (shown after stats loaded) ── */}
        {stats && (
          <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

            {/* LeetCode Topic Radar */}
            {lc?.topic_breakdown && Object.keys(lc.topic_breakdown).length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  🟡 LC Topic Breakdown
                </h3>
                <RadarChart data={lc.topic_breakdown} />
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {Object.entries(lc.topic_breakdown).map(([topic, count]) => (
                    <span key={topic} style={{ background: 'rgba(255,166,22,0.1)', border: '1px solid rgba(255,166,22,0.25)', color: '#ffa116', borderRadius: '999px', padding: '0.15rem 0.6rem', fontSize: '0.72rem' }}>
                      {topic} · {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Codeforces Topic Radar */}
            {cf?.topic_breakdown && Object.keys(cf.topic_breakdown).length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  🔵 CF Topic Breakdown
                </h3>
                <RadarChart data={cf.topic_breakdown} />
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {Object.entries(cf.topic_breakdown).map(([topic, count]) => (
                    <span key={topic} style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', borderRadius: '999px', padding: '0.15rem 0.6rem', fontSize: '0.72rem' }}>
                      {topic} · {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Codeforces Rating Distribution */}
            {cf?.rating_distribution && Object.keys(cf.rating_distribution).length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  🔵 CF Problems by Rating
                </h3>
                <RatingDistribution dist={cf.rating_distribution} />
              </div>
            )}

            {/* Consistency Score */}
            {(lc || cf || gh) && (lcDays > 0 || cfDays > 0 || ghDays > 0) && (
              <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
                  ⚡ Consistency
                </h3>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  {lc && <ConsistencyRing value={lcDays} max={20} label="LC days" color="#ffa116" />}
                  {cf && cfDays > 0 && <ConsistencyRing value={cfDays} max={30} label="CF days" color="#60a5fa" />}
                  {gh && ghDays > 0 && <ConsistencyRing value={ghDays} max={30} label="GH days" color="#4ade80" />}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '1rem', textAlign: 'center' }}>
                  Active coding days in recent submissions
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Project Repo Analysis ── */}
        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem' }}>🔍 Project Repository Analysis</h2>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Add GitHub Repo URLs</h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>One URL per line. Each repo is cloned, analysed, and its tech stack + complexity shown below.</p>
            <textarea value={repoInput} onChange={e => setRepoInput(e.target.value)}
              placeholder={`https://github.com/user/repo1\nhttps://github.com/user/repo2`}
              rows={4} style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem', padding: '0.6rem', boxSizing: 'border-box' }} />
            {repoError && <p className="error-msg" style={{ marginTop: '0.5rem' }}>{repoError}</p>}
            <button className="btn-primary" onClick={handleAnalyseRepos} disabled={analysing || !repoInput.trim()} style={{ marginTop: '0.75rem', padding: '0.7rem 1.5rem' }}>
              {analysing ? '⏳ Analysing... (may take a minute per repo)' : '▶ Load Repo Stats'}
            </button>
          </div>
          {repoList.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                Analysed Projects ({repoList.length})
              </h3>
              {repoList.map(repo => <ProjectCard key={repo.id} repo={repo} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
