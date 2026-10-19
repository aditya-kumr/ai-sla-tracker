import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangle, Clock, RefreshCw, LogOut, Sun, Moon, MessageSquare } from 'lucide-react';
import ChatDrawer from './ChatDrawer';
import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAtRiskOnly, setShowAtRiskOnly] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, showAtRiskOnly]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let endpoint = '/tickets?page=0&size=50';
      
      if (showAtRiskOnly) {
        endpoint = '/tickets/at-risk?thresholdHours=4';
      } else if (statusFilter !== 'ALL') {
        endpoint = `/tickets?status=${statusFilter}&page=0&size=50`;
      }

      const response = await api.get(endpoint);
      const data = response.data.content ? response.data.content : response.data;
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.put(`/tickets/${ticketId}/status`, { status: newStatus });
      fetchTickets();
    } catch (error) {
      alert('Failed to update status: ' + (error.response?.data?.message || 'Unauthorized'));
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'priority-badge priority-critical';
      case 'HIGH': return 'priority-badge priority-high';
      case 'MEDIUM': return 'priority-badge priority-medium';
      default: return 'priority-badge priority-low';
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">AI SLA Assistant Dashboard</h1>
          <span className="user-info">Logged in as: <strong>{user?.fullName}</strong> ({user?.role})</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={() => setIsChatOpen(true)} 
            className="refresh-btn" 
            title="Open AI Assistant"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, padding: '0.5rem 0.875rem' }}
          >
            <MessageSquare size={16} color="#2563eb" /> AI Assistant
          </button>
          <button onClick={toggleTheme} className="refresh-btn" title="Toggle Theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={logout} className="logout-btn">
            <LogOut size={16} style={{ marginRight: '6px' }} /> Logout
          </button>
        </div>
      </header>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Filter Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => { setShowAtRiskOnly(false); setStatusFilter(e.target.value); }}
            className="select-dropdown"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <button 
            onClick={() => setShowAtRiskOnly(!showAtRiskOnly)}
            className={`at-risk-btn ${showAtRiskOnly ? 'active' : 'inactive'}`}
          >
            <AlertTriangle size={16} style={{ marginRight: '6px' }} />
            {showAtRiskOnly ? 'Showing At-Risk Tickets' : 'Filter At-Risk (< 4h)'}
          </button>
        </div>

        <button onClick={fetchTickets} className="refresh-btn" title="Refresh Tickets">
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading tickets...</div>
      ) : (
        <div className="table-card">
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA Due At</th>
                <th>Assignee</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(tickets || []).map((t) => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td>
                    <strong>{t.title}</strong>
                    {t.atRisk && (
                      <span className="badge-at-risk">
                        <Clock size={12} style={{ marginRight: '4px' }} /> AT RISK
                      </span>
                    )}
                    {t.breached && (
                      <span className="badge-breached">
                        <AlertTriangle size={12} style={{ marginRight: '4px' }} /> BREACHED
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={getPriorityClass(t.priority)}>{t.priority}</span>
                  </td>
                  <td>{t.status}</td>
                  <td>{new Date(t.slaDueAt).toLocaleString()}</td>
                  <td>{t.assignee}</td>
                  <td>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className="select-dropdown"
                      style={{ padding: '0.25rem 0.5rem' }}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-out AI Assistant Chat Drawer */}
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}