import { useState } from 'react'
import { analyzeRepo } from './api.js'
import ReportView from './components/ReportView.jsx'

export default function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [report, setReport] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const data = await analyzeRepo(url.trim())
      setReport(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <span className="mark">[agent]</span>
        <h1>repo-analyzer</h1>
      </div>

      <div className="main">
        <form className="intake" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'analyzing…' : 'analyze'}
          </button>
        </form>
        <p className="hint">Paste a public GitHub repo URL. Every generated claim will cite the file it came from.</p>

        {loading && <p className="loading">fetching repo → extracting stack → retrieving evidence → grounded synthesis → validating…</p>}
        {error && <div className="error-banner">{error}</div>}
        {report && <ReportView report={report} />}
      </div>
    </div>
  )
}
