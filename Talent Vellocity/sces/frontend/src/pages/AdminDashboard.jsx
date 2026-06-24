import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../services/AuthContext'

const COMPLEXITY_COLOR = { Advanced: '#f87171', Intermediate: '#fbbf24', Beginner: '#4ade80' }

function TalentBar({ score }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div className="talent-bar" style={{ width: `${score}%` }} />
      </div>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-light)', minWidth: '28px' }}>{score}</span>
    </div>
  )
}

function DonutChart({ data, colors }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r
  let offset = 0
  const slices = Object.entries(data).map(([label, val], i) => {
    const pct = val / total
    const dash = pct * circ
    const slice = { label, val, pct, dash, offset, color: colors[i % colors.length] }
    offset += dash
    return slice
  })
  return (
    <div className="donut-wrap">
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="18"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset}
          />
        ))}
      </svg>
      <div className="donut-legend">
        {slices.map((s, i) => (
          <div key={i} className="donut-legend-item">
            <div className="donut-legend-dot" style={{ background: s.color }} />
            <span>{s.label}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--text)', paddingLeft: '0.5rem' }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Students Tab ─────────────────────────────────────────────────────────────
function StudentsTab({ students, loading, navigate }) {
  const [search, setSearch] = useState('')
  const filtered = students.filter(s =>
    s.username.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )
  const setupCount = students.filter(s => s.profile_setup_done).length

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="stat-card"><div className="value">{students.length}</div><div className="label">Total Students</div></div>
        <div className="stat-card">
          <div className="value" style={{ background: 'linear-gradient(135deg,#4ade80,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{setupCount}</div>
          <div className="label">Profiles Set Up</div>
        </div>
        <div className="stat-card">
          <div className="value" style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{students.length - setupCount}</div>
          <div className="label">Pending Setup</div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-2">
          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>All Students</h3>
          <input placeholder="🔍  Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '240px' }} />
        </div>
        {loading ? <div className="loading" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Username</th><th>Email</th><th>LeetCode</th><th>Codeforces</th><th>GitHub</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>No students found</td></tr>}
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.username}</td>
                    <td style={{ color: 'var(--muted2)' }}>{s.email}</td>
                    <td style={{ color: s.leetcode_username ? '#fbbf24' : 'var(--muted)' }}>{s.leetcode_username || '—'}</td>
                    <td style={{ color: s.codeforces_handle ? '#60a5fa' : 'var(--muted)' }}>{s.codeforces_handle || '—'}</td>
                    <td style={{ color: s.github_username ? '#4ade80' : 'var(--muted)' }}>{s.github_username || '—'}</td>
                    <td><span className={`badge ${s.profile_setup_done ? 'badge-green' : 'badge-orange'}`}>{s.profile_setup_done ? '✓ Set Up' : '⏳ Pending'}</span></td>
                    <td>
                      <button className="btn-outline" onClick={() => navigate(`/admin/students/${s.id}`)}
                        style={{ padding: '0.3rem 0.8rem', fontSize: '0.82rem' }} disabled={!s.profile_setup_done}>
                        View Stats →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ── Leaderboard Tab ───────────────────────────────────────────────────────────
function LeaderboardTab() {
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/leaderboard')
      .then(({ data }) => setBoard(data))
      .catch(() => setError('Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [])

  const rankStyle = (rank) => {
    if (rank === 1) return 'lb-rank gold'
    if (rank === 2) return 'lb-rank silver'
    if (rank === 3) return 'lb-rank bronze'
    return 'lb-rank'
  }

  if (loading) return <div className="loading" />
  if (error) return <p className="error-msg">{error}</p>

  return (
    <div className="card" style={{ padding: '0' }}>
      <div className="lb-row lb-head">
        <div style={{ textAlign: 'center' }}>#</div>
        <div>Student</div>
        <div>Talent Score</div>
        <div>LC Solved</div>
        <div>LC Rating</div>
        <div>CF Rating</div>
        <div>GH Repos</div>
      </div>
      {board.length === 0 && <p style={{ padding: '2rem', color: 'var(--muted)', textAlign: 'center' }}>No data yet — students need to load their stats first.</p>}
      {board.map(s => (
        <div key={s.id} className="lb-row">
          <div className={rankStyle(s.rank)}>
            {s.rank <= 3 ? ['🥇', '🥈', '🥉'][s.rank - 1] : s.rank}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{s.username}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Top {100 - s.percentile + 1}%</div>
          </div>
          <div><TalentBar score={s.talent_score} /></div>
          <div style={{ color: '#fbbf24', fontWeight: 600 }}>{s.lc_solved || '—'}</div>
          <div style={{ color: '#ffa116' }}>{s.lc_rating || '—'}</div>
          <div style={{ color: '#60a5fa' }}>{s.cf_rating || '—'}</div>
          <div style={{ color: '#4ade80' }}>{s.gh_repos || '—'}</div>
        </div>
      ))}
    </div>
  )
}

// ── Batch Analytics Tab ───────────────────────────────────────────────────────
function BatchAnalyticsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/admin/batch-analytics')
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading" />
  if (error) return <p className="error-msg">{error}</p>

  const stackColors = ['#6366f1', '#06d6a0', '#f59e0b', '#f87171', '#60a5fa', '#a78bfa', '#4ade80', '#fb923c', '#e879f9', '#94a3b8']
  const complexityColors = ['#4ade80', '#fbbf24', '#f87171']
  const stackEntries = Object.entries(data.stack_distribution || {}).slice(0, 8)
  const stackMax = stackEntries.length ? Math.max(...stackEntries.map(([, v]) => v), 1) : 1

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

      {/* Overview */}
      <div className="card">
        <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Batch Overview</h3>
        {[
          ['Total Students', data.total_students],
          ['Profiles Set Up', data.profiles_setup],
          ['Pending Setup', data.pending_setup],
          ['Repos Analysed', data.total_repos_analysed],
        ].map(([k, v]) => (
          <div className="stat-row" key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--muted2)' }}>{k}</span>
            <span style={{ fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Complexity Distribution */}
      {data.total_repos_analysed > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Project Complexity</h3>
          <DonutChart data={data.complexity_distribution} colors={complexityColors} />
        </div>
      )}

      {/* Stack Distribution */}
      {stackEntries.length > 0 && (
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Most Used Tech Stacks</h3>
          {stackEntries.map(([cat, total], i) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
              <span style={{ width: '110px', color: 'var(--muted2)', flexShrink: 0 }}>{cat}</span>
              <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${(total / stackMax) * 100}%`, height: '100%', background: stackColors[i % stackColors.length], borderRadius: '5px', transition: 'width 0.6s ease' }} />
              </div>
              <span style={{ color: 'var(--muted)', minWidth: '32px', textAlign: 'right' }}>{Math.round(total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* At-risk students */}
      {data.at_risk_students?.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>⚠ At-Risk Students</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Profile set up but no projects analysed</p>
          {data.at_risk_students.map(s => (
            <div key={s.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem', color: 'var(--muted2)' }}>
              {s.username}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Manage Admins Tab ────────────────────────────────────────────────────────
function ManageAdminsTab() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      await api.post('/auth/create-admin', form)
      setSuccess(`Admin "${form.username}" created successfully!`)
      setForm({ username: '', email: '', password: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create admin')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,var(--primary),var(--primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🛡️</div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Create New Admin</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.1rem' }}>Only admins can create other admins</p>
          </div>
        </div>
        <form onSubmit={handleCreate}>
          {[['username','Username','e.g. prof_john'],['email','Email','admin@college.edu'],['password','Password','Min 6 characters']].map(([key, label, ph]) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <input type={key === 'password' ? 'password' : 'text'} value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={ph} required minLength={key === 'password' ? 6 : 1} />
            </div>
          ))}
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">✓ {success}</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}>
            {loading ? 'Creating...' : '+ Create Admin Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('students')
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/admin/students').then(({ data }) => setStudents(data)).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <nav className="navbar">
        <span className="brand">⚡ CodeTracker</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--muted2)', fontSize: '0.85rem' }}>Admin Panel</span>
          <button className="btn-outline" style={{ padding: '0.35rem 0.9rem' }} onClick={() => { logout(); navigate('/login') }}>Logout</button>
        </div>
      </nav>

      <div className="page">
        <h1 className="page-title">Admin Dashboard</h1>

        <div className="tab-bar">
          {[['students', '👥 Students'], ['leaderboard', '🏆 Leaderboard'], ['analytics', '📊 Batch Analytics'], ['admins', '🛡️ Manage Admins']].map(([key, label]) => (
            <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {tab === 'students' && <StudentsTab students={students} loading={loading} navigate={navigate} />}
        {tab === 'leaderboard' && <LeaderboardTab />}
        {tab === 'analytics' && <BatchAnalyticsTab />}
        {tab === 'admins' && <ManageAdminsTab />}
      </div>
    </div>
  )
}
