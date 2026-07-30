import { useState } from 'react'
import ClaimBlock from './ClaimBlock.jsx'

const LANG_COLORS = ['#5EEAD4', '#F5A524', '#F5789A', '#8FA8F5', '#8FD6A0', '#C9A0F5', '#F5D65E']

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'stack', label: 'Tech stack' },
  { id: 'complexity', label: 'Complexity' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'evidence', label: 'Evidence log' },
]

export default function ReportView({ report }) {
  const [activeExcerpt, setActiveExcerpt] = useState(null)
  const langs = Object.entries(report.tech_stack.languages).sort((a, b) => b[1] - a[1])

  return (
    <div className="report">
      <div className="rail">
        {SECTIONS.map((s, i) => (
          <div className="rail-item" key={s.id}>
            <span className="num">{String(i + 1).padStart(2, '0')}</span>
            {s.label}
          </div>
        ))}
      </div>

      <div className="sections">
        {report.low_confidence && (
          <div className="confidence-banner confidence-low">
            LOW CONFIDENCE — limited evidence was retrievable for this repo. Treat the analysis
            below as directional, not definitive.
          </div>
        )}

        <div className="section" id="overview">
          <div className="section-label">01 · Overview</div>
          <h2 className="repo-title">{report.meta.full_name}</h2>
          {report.meta.description && <p className="repo-desc">{report.meta.description}</p>}
          <div className="meta-row">
            <span>★ {report.meta.stars}</span>
            <span>forks {report.meta.forks}</span>
            <span>branch {report.meta.default_branch}</span>
            <span>{(report.meta.size_kb / 1024).toFixed(1)} MB</span>
          </div>
        </div>

        <div className="section" id="stack">
          <div className="section-label">02 · Tech stack</div>
          <div className="lang-bar">
            {langs.map(([lang, pct], i) => (
              <div
                key={lang}
                className="lang-seg"
                style={{ width: `${pct}%`, background: LANG_COLORS[i % LANG_COLORS.length] }}
                title={`${lang} ${pct}%`}
              />
            ))}
          </div>
          <div className="lang-legend">
            {langs.map(([lang, pct], i) => (
              <span key={lang}>
                <span style={{ color: LANG_COLORS[i % LANG_COLORS.length] }}>●</span> {lang} {pct}%
              </span>
            ))}
          </div>
          <div className="badges" style={{ marginTop: 16 }}>
            {report.tech_stack.frameworks_detected.length > 0 ? (
              report.tech_stack.frameworks_detected.map((f) => (
                <span className="badge" key={f}>{f}</span>
              ))
            ) : (
              <span className="badge">no framework signatures detected in manifests</span>
            )}
          </div>
        </div>

        <div className="section" id="complexity">
          <div className="section-label">03 · Complexity</div>
          <div className="complexity-row">
            <span className={`complexity-tier tier-${report.complexity.tier}`}>
              {report.complexity.tier}
            </span>
            <span className="complexity-score">{report.complexity.score}/100</span>
          </div>
          <p className="rationale">{report.complexity.rationale}</p>
          <div className="signal-grid">
            {Object.entries(report.complexity.signals).map(([k, v]) => (
              <div className="signal-cell" key={k}>
                <div className="k">{k.replaceAll('_', ' ')}</div>
                <div className="v">{typeof v === 'number' ? v : String(v)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="section" id="analysis">
          <div className="section-label">04 · Analysis</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16 }}>
            Every claim below is grounded in a specific file. Click a chip to see the exact excerpt it came from.
          </p>
          <div style={{ marginBottom: 20 }}>
            <div className="section-label" style={{ marginBottom: 6 }}>Domain</div>
            <ClaimBlock claim={report.domain_claim} evidence={report.evidence_used} />
          </div>
          <div>
            <div className="section-label" style={{ marginBottom: 6 }}>Summary</div>
            <ClaimBlock claim={report.summary_claim} evidence={report.evidence_used} />
          </div>
        </div>

        <div className="section" id="evidence">
          <div className="section-label">05 · Evidence log</div>
          <div className="evidence-log">
            {report.evidence_used.map((e) => (
              <div
                className="evidence-row"
                key={e.path}
                onClick={() => setActiveExcerpt(activeExcerpt === e.path ? null : e.path)}
              >
                <span className="kind">{e.kind}</span>
                <span className="path">{e.path}</span>
              </div>
            ))}
          </div>
          {activeExcerpt && (
            <div className="chip-detail" style={{ marginTop: 12 }}>
              <div className="path">{activeExcerpt}</div>
              <pre>{report.evidence_used.find((e) => e.path === activeExcerpt)?.excerpt}</pre>
            </div>
          )}
          {report.validation_notes.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {report.validation_notes.map((n, i) => (
                <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
