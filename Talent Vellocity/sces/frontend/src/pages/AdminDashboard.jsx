import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../services/AuthContext'

function TalentBar({ score }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
      <div style={{ flex: 1, height: '8px', background: 'rgba(11,78,162,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
        <div className="talent-bar" style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', minWidth: '28px', textAlign: 'right' }}>
        {score}
      </span>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="16"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset}
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
        ))}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--muted2)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color }} />
            <span style={{ fontWeight: 600 }}>{s.label}:</span>
            <span style={{ fontWeight: 800, color: 'var(--text)' }}>{s.val} ({Math.round(s.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Students Tab Component ──
function StudentsTab({ students, loading, navigate, totalRepos, avgScore }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = students.filter(s => {
    const matchesSearch = s.username.toLowerCase().includes(search.toLowerCase()) ||
                         s.email.toLowerCase().includes(search.toLowerCase())
    if (filter === 'setup') return matchesSearch && s.profile_setup_done
    if (filter === 'pending') return matchesSearch && !s.profile_setup_done
    return matchesSearch
  })

  return (
    <>
      {/* Admin Summary Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.75rem' }} className="profile-grid">
        <div className="stat-card">
          <div className="value">{students.length}</div>
          <div className="label">Total Students</div>
        </div>
        <div className="stat-card">
          <div className="value">{avgScore}</div>
          <div className="label">Avg Coding Score</div>
        </div>
        <div className="stat-card">
          <div className="value">{totalRepos}</div>
          <div className="label">Total Repos Analyzed</div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[['all', 'All Students'], ['setup', 'Profile Set Up'], ['pending', 'Pending Setup']].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                style={{
                  padding: '0.4rem 1.1rem',
                  fontSize: '0.82rem',
                  borderRadius: '9999px',
                  background: filter === k ? 'var(--primary)' : 'rgba(11,78,162,0.05)',
                  color: filter === k ? '#FFFFFF' : 'var(--muted2)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students by name or email..."
            style={{ maxWidth: '300px', fontSize: '0.84rem', padding: '0.5rem 1rem' }}
          />
        </div>
      </div>

      {/* Students Data Grid */}
      {loading ? <div className="loading" /> : (
        filtered.length > 0 ? (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Email</th>
                  <th>Coding Score</th>
                  <th style={{ textAlign: 'center' }}>repos</th>
                  <th>Setup Badge</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.8rem'
                        }}>
                          {s.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{s.username}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{s.email}</td>
                    <td style={{ width: '180px' }}>
                      {s.profile_setup_done ? <TalentBar score={s.talent_score} /> : <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                      {s.profile_setup_done ? s.gh_repos : 0}
                    </td>
                    <td>
                      <span className={`badge ${s.profile_setup_done ? 'badge-green' : 'badge-orange'}`}>
                        {s.profile_setup_done ? '✓ Setup Complete' : '⏳ Pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-outline"
                        onClick={() => navigate(`/admin/students/${s.id}`)}
                        disabled={!s.profile_setup_done}
                        style={{ padding: '0.35rem 1rem', fontSize: '0.8rem' }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)' }}>No matching students found.</p>
          </div>
        )
      )}
    </>
  )
}

// ── Leaderboard Tab Component ──
function LeaderboardTab() {
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('overall')
  const [domain, setDomain] = useState('Web Development - Frontend')
  
  const [weights, setWeights] = useState({
    coding_weight: 0.6,
    domain_weight: 0.4,
    recency_halflife_days: 90
  })
  
  const [expandedId, setExpandedId] = useState(null)
  const [breakdown, setBreakdown] = useState({})
  const [breakdownLoading, setBreakdownLoading] = useState({})

  const DOMAIN_TAXONOMY = [
    "Web Development - Frontend",
    "Web Development - Backend",
    "Web Development - Full Stack",
    "Mobile Development",
    "ML/AI - Computer Vision",
    "ML/AI - NLP",
    "ML/AI - Predictive/Tabular",
    "Data Engineering",
    "DevOps/Cloud",
    "Cybersecurity",
    "IoT/Embedded",
    "Blockchain",
    "Game Development",
    "AR/VR",
    "Other"
  ]

  const loadLeaderboard = (activeFilter, activeDomain) => {
    setLoading(true)
    let url = `/admin/leaderboard?filter=${activeFilter}`
    if (activeFilter === 'domain') {
      url += `&domain=${encodeURIComponent(activeDomain)}`
    }
    api.get(url)
      .then(({ data }) => {
        setBoard(data)
        setError('')
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to fetch leaderboard data')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.get('/admin/leaderboard/weights')
      .then(({ data }) => setWeights(data))
      .catch(() => {})
    loadLeaderboard(filter, domain)
  }, [])

  const handleFilterChange = (newFilter, newDomain) => {
    setFilter(newFilter)
    if (newDomain) setDomain(newDomain)
    setExpandedId(null)
    loadLeaderboard(newFilter, newDomain || domain)
  }

  const debouncedPut = useMemo(() => {
    let timer
    return (newWeights, activeFilter, activeDomain) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        api.put('/admin/leaderboard/weights', newWeights)
          .then(() => {
            loadLeaderboard(activeFilter, activeDomain)
          })
          .catch(() => {})
      }, 300)
    }
  }, [])

  const handleWeightChange = (codingWeightVal) => {
    const nextWeights = {
      ...weights,
      coding_weight: codingWeightVal / 100,
      domain_weight: 1.0 - (codingWeightVal / 100)
    }
    setWeights(nextWeights)
    debouncedPut(nextWeights, filter, domain)
  }

  const handleHalflifeChange = (daysVal) => {
    const nextWeights = {
      ...weights,
      recency_halflife_days: parseInt(daysVal) || 90
    }
    setWeights(nextWeights)
    debouncedPut(nextWeights, filter, domain)
  }

  const toggleRow = (studentId) => {
    if (expandedId === studentId) {
      setExpandedId(null)
      return
    }
    setExpandedId(studentId)
    if (breakdown[studentId]) return

    setBreakdownLoading(prev => ({ ...prev, [studentId]: true }))
    api.get(`/admin/leaderboard/${studentId}/breakdown`)
      .then(({ data }) => {
        setBreakdown(prev => ({ ...prev, [studentId]: data }))
      })
      .catch(() => {})
      .finally(() => {
        setBreakdownLoading(prev => ({ ...prev, [studentId]: false }))
      })
  }

  const rankStyle = (rank) => {
    if (rank === 1) return 'lb-rank gold'
    if (rank === 2) return 'lb-rank silver'
    if (rank === 3) return 'lb-rank bronze'
    return 'lb-rank'
  }

  return (
    <div>
      {/* Weights and Decay Sliders */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
          Leaderboard Ranking Tuner (Admin Configurable)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flexWrap: 'wrap' }}>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.86rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--primary)' }}>Coding Weight: {Math.round(weights.coding_weight * 100)}%</span>
              <span style={{ color: 'var(--accent)' }}>Projects Weight: {Math.round(weights.domain_weight * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={Math.round(weights.coding_weight * 100)}
              onChange={e => handleWeightChange(e.target.value)}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
              Drag to adjust balance between competitive coding platforms and repository complexity scores.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.86rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text)' }}>Recency Half-life:</span>
              <span style={{ color: 'var(--primary-light)' }}>{weights.recency_halflife_days} Days</span>
            </div>
            <input 
              type="range"
              min="30"
              max="365"
              step="5"
              value={weights.recency_halflife_days}
              onChange={e => handleHalflifeChange(e.target.value)}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary-light)' }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
              Determines activity decay rate. Submissions from {weights.recency_halflife_days} days ago carry half weight.
            </p>
          </div>

        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="tab-bar" style={{ marginBottom: 0 }}>
          <button className={`tab-btn ${filter === 'overall' ? 'active' : ''}`} onClick={() => handleFilterChange('overall')}>
            Overall
          </button>
          <button className={`tab-btn ${filter === 'coding' ? 'active' : ''}`} onClick={() => handleFilterChange('coding')}>
            Coding
          </button>
          <button className={`tab-btn ${filter === 'domain' ? 'active' : ''}`} onClick={() => handleFilterChange('domain')}>
            Domain Categories
          </button>
        </div>

        {filter === 'domain' && (
          <select 
            value={domain} 
            onChange={e => handleFilterChange('domain', e.target.value)}
            style={{ 
              padding: '0.45rem 1.25rem', 
              fontSize: '0.85rem', 
              border: '1.5px solid var(--border)',
              borderRadius: '9999px',
              background: '#FFFFFF',
              color: 'var(--text)',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '300px'
            }}
          >
            {DOMAIN_TAXONOMY.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="error-msg" style={{ textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

      {/* Leaderboard Table List */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ 
          padding: '1rem 1.5rem', 
          background: '#FAFBFD', 
          display: 'grid', 
          gridTemplateColumns: '50px 1fr 180px 180px', 
          gap: '1rem', 
          borderBottom: '1px solid var(--border)', 
          fontWeight: 600, 
          color: 'var(--muted)', 
          fontSize: '0.75rem', 
          textTransform: 'uppercase' 
        }}>
          <div style={{ textAlign: 'center' }}>Rank</div>
          <div>Student Name</div>
          <div>Cohort Percentile Rank</div>
          <div style={{ textAlign: 'right' }}>Score</div>
        </div>

        {loading ? <div className="loading" /> : (
          board.length === 0 ? (
            <p style={{ padding: '3rem', color: 'var(--muted)', textAlign: 'center' }}>
              No student records matched the selected filters.
            </p>
          ) : (
            board.map(s => {
              const isExpanded = expandedId === s.student_id
              const itemBreakdown = breakdown[s.student_id]
              
              return (
                <div key={s.student_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  
                  {/* Row */}
                  <div 
                    onClick={() => toggleRow(s.student_id)}
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '50px 1fr 180px 180px', 
                      gap: '1rem', 
                      alignItems: 'center', 
                      padding: '1rem 1.5rem', 
                      cursor: 'pointer',
                      background: isExpanded ? 'rgba(11,78,162,0.02)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div className={rankStyle(s.rank)} style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                      {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : s.rank}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.92rem' }}>
                        {s.name}
                      </div>
                      {s.badge_domain && (
                        <span 
                          className="badge badge-blue" 
                          style={{ 
                            textTransform: 'none', 
                            fontSize: '0.65rem', 
                            padding: '0.1rem 0.4rem', 
                            marginTop: '0.2rem',
                            display: 'inline-block'
                          }}
                        >
                          🏷️ {s.badge_domain}
                        </span>
                      )}
                    </div>
                    <div>
                      <TalentBar score={s.percentile} />
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem' }}>
                      {s.score}
                    </div>
                  </div>

                  {/* Explainability Breakdown Panel */}
                  {isExpanded && (
                    <div style={{ 
                      background: 'rgba(244, 247, 250, 0.5)', 
                      padding: '1.5rem', 
                      borderTop: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '0.84rem',
                      color: 'var(--text)'
                    }}>
                      {breakdownLoading[s.student_id] ? <div className="loading" style={{ padding: '1rem' }} /> : (
                        itemBreakdown ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            
                            {/* Component Percentiles Grid */}
                            <div>
                              <h4 style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', fontSize: '0.72rem', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                                Platform Cohort Percentiles
                              </h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                                <div style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                                  <div style={{ fontWeight: 800, color: '#ffa116', fontSize: '1.1rem' }}>{itemBreakdown.component_percentiles.leetcode_solved_pct}%</div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>LC Solved</div>
                                </div>
                                <div style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                                  <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>{itemBreakdown.component_percentiles.leetcode_hard_solved_pct}%</div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>LC Hard Solved</div>
                                </div>
                                <div style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                                  <div style={{ fontWeight: 800, color: '#8b5cf6', fontSize: '1.1rem' }}>{itemBreakdown.component_percentiles.leetcode_rating_pct}%</div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>LC Rating</div>
                                </div>
                                <div style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem', textAlign: 'center' }}>
                                  <div style={{ fontWeight: 800, color: '#3b82f6', fontSize: '1.1rem' }}>{itemBreakdown.component_percentiles.codeforces_rating_pct}%</div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>CF Rating</div>
                                </div>
                              </div>
                            </div>

                            {/* Recency Decay details */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '0.6rem 1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                              <span>🕒 Recency Multiplier:</span>
                              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>x{itemBreakdown.recency_multiplier}</span>
                            </div>

                            {/* Domain percentiles list */}
                            {Object.keys(itemBreakdown.domain_scores).length > 0 && (
                              <div>
                                <h4 style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', fontSize: '0.72rem', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                                  Domain Project Percentiles
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  {Object.entries(itemBreakdown.domain_scores).map(([dom, pct]) => (
                                    <span key={dom} className="badge badge-blue" style={{ textTransform: 'none', fontSize: '0.7rem' }}>
                                      🛠️ {dom}: {pct}%
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Combined Math Explanation */}
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', color: 'var(--muted2)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                              <p>
                                🎯 <strong>Explainability Statement:</strong> This student outperforms <strong>{s.percentile}%</strong> of the cohort under the current filter.
                              </p>
                              <p style={{ marginTop: '0.25rem' }}>
                                Coding Score ({itemBreakdown.coding_score}) combined with their best domain percentile ({itemBreakdown.overall_score > itemBreakdown.coding_score ? Object.values(itemBreakdown.domain_scores)[0] || 0.0 : 0.0}%) at {Math.round(itemBreakdown.weights_used.coding_weight * 100)}/{Math.round(itemBreakdown.weights_used.domain_weight * 100)} weighting yields an overall score of <strong>{itemBreakdown.overall_score}</strong>, placing them at rank <strong>#{s.rank}</strong>.
                              </p>
                            </div>

                          </div>
                        ) : (
                          <p style={{ color: 'var(--danger)' }}>Failed to load breakdown details.</p>
                        )
                      )}
                    </div>
                  )}

                </div>
              )
            })
          )
        )}
      </div>
    </div>
  )
}

// ── Create Admin Account Component ──
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
      setSuccess(`Admin account "${form.username}" generated successfully!`)
      setForm({ username: '', email: '', password: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create admin')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(11,78,162,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            🛡️
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>Create Admin Profile</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Authorize college administrators</p>
          </div>
        </div>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Admin Username</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="prof_johndoe" required />
          </div>
          <div className="form-group">
            <label>Admin Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@sece.ac.in" required />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Secure Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" required minLength={6} />
          </div>
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">✓ {success}</p>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Creating...' : 'Create Admin Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main Page Component ──
export default function AdminDashboard() {
  const [students, setStudents] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('students')
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get('/admin/students'),
      api.get('/admin/leaderboard?filter=overall'),
      api.get('/admin/batch-analytics')
    ]).then(([{ data: studentList }, { data: leaderboardList }, { data: analyticsList }]) => {
      const scoreMap = new Map(leaderboardList.map(item => [item.student_id, item]))
      const merged = studentList.map(s => {
        const scoreData = scoreMap.get(s.id) || {}
        return {
          ...s,
          talent_score: scoreData.score || 0,
          gh_repos: scoreData.score ? scoreData.score : 0
        }
      })
      setStudents(merged)
      setAnalytics(analyticsList)
    }).catch(() => {
      setError('An error occurred while compiling administration metrics.')
    }).finally(() => setLoading(false))
  }, [])

  const setupStudents = students.filter(s => s.profile_setup_done)
  const avgScore = setupStudents.length 
    ? Math.round(setupStudents.reduce((acc, s) => acc + s.talent_score, 0) / setupStudents.length) 
    : 0
  const totalRepos = analytics?.total_repos_analysed || 0

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Navbar with Sri Eshwar Logo */}
      <nav className="navbar">
        <div className="brand">
          <img src="/sece_logo.png" alt="Sri Eshwar College of Engineering" />
        </div>
        <nav>
          <a onClick={() => navigate('/admin/dashboard')} className="active" style={{ cursor: 'pointer' }}>Admin Panel</a>
          <button className="btn-outline" onClick={() => { logout(); navigate('/login') }} style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}>
            Logout
          </button>
        </nav>
      </nav>

      <div className="page">
        <h1 className="page-title" style={{ color: '#FFB300', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>Admin Dashboard</h1>

        {/* Tab switch bar */}
        <div className="tab-bar">
          {[['students', '👥 Students'], ['leaderboard', '🏆 Leaderboard'], ['analytics', '📊 Batch Analytics'], ['admins', '🛡️ Manage Admins']].map(([key, label]) => (
            <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {tab === 'students' && (
          <StudentsTab
            students={students}
            loading={loading}
            navigate={navigate}
            totalRepos={totalRepos}
            avgScore={avgScore}
          />
        )}
        {tab === 'leaderboard' && (
          <LeaderboardTab />
        )}
        {tab === 'analytics' && (
          <BatchAnalyticsTab
            analytics={analytics}
            loading={loading}
            error={error}
          />
        )}
        {tab === 'admins' && <ManageAdminsTab />}
      </div>
    </div>
  )
}
