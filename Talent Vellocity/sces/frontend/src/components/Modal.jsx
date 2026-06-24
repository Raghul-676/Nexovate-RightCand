export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex-between mb-2">
          <h3>{title}</h3>
          <button className="btn-outline" onClick={onClose} style={{ padding: '0.2rem 0.7rem' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
