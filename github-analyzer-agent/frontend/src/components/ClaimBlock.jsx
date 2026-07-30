import { useState } from 'react'

function Chip({ label, onClick, variant }) {
  return (
    <span className={`chip ${variant || ''}`} onClick={onClick}>
      {label}
    </span>
  )
}

export default function ClaimBlock({ claim, evidence }) {
  const [openPath, setOpenPath] = useState(null)

  const findExcerpt = (path) => evidence.find((e) => e.path === path)?.excerpt

  return (
    <div className="claim-block">
      {claim.categories && claim.categories.length > 0 && (
        <div className="badges" style={{ marginBottom: 8 }}>
          {claim.categories.map((c) => (
            <span className="badge" key={c}>{c}</span>
          ))}
        </div>
      )}

      {claim.text}

      {(!claim.cited_paths || claim.cited_paths.length === 0) && (
        <Chip label="no citation" variant="none" />
      )}

      {claim.cited_paths && claim.cited_paths.map((path) => (
        <Chip
          key={path}
          label={path.split('/').pop()}
          variant={claim.supported === false ? 'unsupported' : ''}
          onClick={() => setOpenPath(openPath === path ? null : path)}
        />
      ))}

      {openPath && (
        <div className="chip-detail">
          <div className="path">{openPath}</div>
          <pre>{findExcerpt(openPath) || '(excerpt unavailable)'}</pre>
        </div>
      )}
    </div>
  )
}