import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import './AdminComponents.css';

const MentoringSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'completed', 'rejected'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, sessionId: null, studentName: '', topic: '' });

  useEffect(() => {
    fetchMentoringSessions();
  }, []);

  const fetchMentoringSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:8080/api/admin/mentoring-sessions',
        { headers: authHeader() }
      );
      setSessions(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching mentoring sessions:', err);
      setError('Failed to load mentoring sessions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const confirmCancelSession = (sessionId, studentName, topic) => {
    setConfirmDialog({
      show: true,
      sessionId,
      studentName,
      topic
    });
  };

  const cancelConfirmDialog = () => {
    setConfirmDialog({ show: false, sessionId: null, studentName: '', topic: '' });
  };

  const handleCancelSession = async () => {
    const sessionId = confirmDialog.sessionId;
    
    try {
      setActionLoading(sessionId);
      await axios.delete(
        `http://localhost:8080/api/admin/mentoring-sessions/${sessionId}`,
        { headers: authHeader() }
      );
      
      // Remove the session from the local state
      setSessions(prevSessions => 
        prevSessions.filter(session => session.id !== sessionId)
      );
      
      setError('');
    } catch (err) {
      console.error('Error cancelling session:', err);
      setError('Failed to cancel session. Please try again later.');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ show: false, sessionId: null, studentName: '', topic: '' });
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'APPROVED':
        return 'status-approved';
      case 'COMPLETED':
        return 'status-completed';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredSessions = sessions
    .filter(session => {
      if (filter === 'all') return true;
      return session.status === filter.toUpperCase();
    })
    .filter(session => {
      const searchLower = searchTerm.toLowerCase();
      return (
        session.studentName?.toLowerCase().includes(searchLower) ||
        session.instructorName?.toLowerCase().includes(searchLower) ||
        session.courseName?.toLowerCase().includes(searchLower) ||
        session.topic?.toLowerCase().includes(searchLower)
      );
    });

  if (loading) {
    return <div className="loading">Loading mentoring sessions...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-section">
      <h2>Mentoring Sessions</h2>
      
      <div className="admin-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select 
            id="status-filter" 
            value={filter} 
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="all">All Sessions</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div className="search-group">
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="no-data-message">No mentoring sessions found.</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Instructor</th>
                <th>Course</th>
                <th>Topic</th>
                <th>Status</th>
                <th>Date</th>
                <th>Requested On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map(session => (
                <tr key={session.id}>
                  <td>{session.id}</td>
                  <td>{session.studentName}</td>
                  <td>{session.instructorName}</td>
                  <td>{session.courseName}</td>
                  <td>{session.topic}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(session.status)}`}>
                      {session.status}
                    </span>
                  </td>
                  <td>{formatDate(session.sessionDate)}</td>
                  <td>{formatDate(session.createdAt)}</td>
                  <td className="action-buttons">
                    <button 
                      className="delete-button action-button"
                      onClick={() => confirmCancelSession(session.id, session.studentName, session.topic)}
                      disabled={actionLoading === session.id}
                    >
                      {actionLoading === session.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="modal-backdrop">
          <div className="confirmation-dialog">
            <div className="confirmation-header">
              <h3>Confirm Cancellation</h3>
            </div>
            <div className="confirmation-body">
              <p>Are you sure you want to cancel this mentoring session?</p>
              <p><strong>Student:</strong> {confirmDialog.studentName}</p>
              <p><strong>Topic:</strong> {confirmDialog.topic}</p>
              <p className="warning-text">This action cannot be undone. The session will be deleted from the system.</p>
            </div>
            <div className="confirmation-footer">
              <button 
                className="btn-secondary" 
                onClick={cancelConfirmDialog}
                disabled={actionLoading === confirmDialog.sessionId}
              >
                Go Back
              </button>
              <button 
                className="btn-danger" 
                onClick={handleCancelSession}
                disabled={actionLoading === confirmDialog.sessionId}
              >
                {actionLoading === confirmDialog.sessionId ? 'Cancelling...' : 'Cancel Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentoringSessions;