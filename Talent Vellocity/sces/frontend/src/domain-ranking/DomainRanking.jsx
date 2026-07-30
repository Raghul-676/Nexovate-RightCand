import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './DomainRanking.css';

export default function DomainRanking() {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/domains/list')
      .then(({ data }) => {
        setDomains(data);
        if (data.length > 0) {
          setSelectedDomain(data[0].domain);
        }
      })
      .catch((err) => console.error("Error loading domains:", err))
      .finally(() => setLoadingDomains(false));
  }, []);

  useEffect(() => {
    if (!selectedDomain) return;
    
    setLoadingRanking(true);
    api.get(`/admin/domains/${encodeURIComponent(selectedDomain)}/ranking`)
      .then(({ data }) => {
        setRanking(data);
      })
      .catch((err) => console.error("Error loading ranking:", err))
      .finally(() => setLoadingRanking(false));
  }, [selectedDomain]);

  const goToStudentProfile = (studentId) => {
    navigate(`/admin/students/${studentId}`);
  };

  const getScoreClass = (score) => {
    if (score >= 75) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  return (
    <div className="domain-ranking-container">
      <div className="domain-sidebar">
        <h3 className="domain-sidebar-title">Topic Tags</h3>
        {loadingDomains ? (
          <div className="domain-loading">Loading topics...</div>
        ) : domains.length === 0 ? (
          <div className="domain-loading">No topics found</div>
        ) : (
          domains.map((d) => (
            <div 
              key={d.domain}
              className={`domain-tag ${selectedDomain === d.domain ? 'active' : ''}`}
              onClick={() => setSelectedDomain(d.domain)}
            >
              <span>{d.domain}</span>
              <span className="domain-badge">{d.student_count}</span>
            </div>
          ))
        )}
      </div>

      <div className="domain-main">
        <div className="domain-main-header">
          <h2 className="domain-main-title">{selectedDomain || 'Select a Topic'} Rankings</h2>
          <p className="domain-main-subtitle">Top students mapped to this domain based on their project repositories.</p>
        </div>
        
        <div className="domain-table-container">
          {loadingRanking ? (
            <div className="domain-loading">Loading rankings...</div>
          ) : ranking.length === 0 ? (
            <div className="domain-loading">No students found for this domain.</div>
          ) : (
            <table className="domain-table">
              <thead>
                <tr>
                  <th className="rank-cell">#</th>
                  <th>Student</th>
                  <th>Talent Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((s, i) => (
                  <tr key={s.student_id}>
                    <td className="rank-cell">{i + 1}</td>
                    <td>
                      <span 
                        className="student-name"
                        onClick={() => goToStudentProfile(s.student_id)}
                      >
                        {s.username}
                      </span>
                    </td>
                    <td>
                      <span className={`score-badge ${getScoreClass(s.talent_score)}`}>
                        {s.talent_score}
                      </span>
                    </td>
                    <td>
                      {s.profile_setup_done ? (
                        <span style={{ color: '#4ade80', fontSize: '0.85rem' }}>✓ Set Up</span>
                      ) : (
                        <span style={{ color: '#fbbf24', fontSize: '0.85rem' }}>⏳ Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
