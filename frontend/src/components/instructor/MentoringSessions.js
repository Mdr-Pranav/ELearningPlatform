import React, { useState, useEffect } from 'react';
import mentoringService from '../../services/mentoring.service';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import './InstructorComponents.css';

const MentoringSessions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [sessionsByCourse, setSessionsByCourse] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeStatus, setActiveStatus] = useState('all');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [updatingSession, setUpdatingSession] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    const fetchInstructorCourses = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/instructor/courses', {
          headers: authHeader()
        });
        
        setInstructorCourses(response.data);

        // Initialize sessions object
        const sessionsObj = {};
        for (const course of response.data) {
          sessionsObj[course.id] = { sessions: [], loading: false, error: null };
        }
        setSessionsByCourse(sessionsObj);

        // If there are courses, select the first one
        if (response.data.length > 0) {
          setSelectedCourse(response.data[0].id);
          await fetchCourseSessions(response.data[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch instructor courses:', err);
        setError('Failed to load your courses. Please try again later.');
        setLoading(false);
      }
    };

    fetchInstructorCourses();
  }, []);

  const fetchCourseSessions = async (courseId) => {
    if (!courseId) return;
    
    setSessionsByCourse(prev => ({
      ...prev,
      [courseId]: { ...prev[courseId], loading: true, error: null }
    }));
    
    try {
      const response = await mentoringService.getCourseMentoringSessions(courseId);
      
      setSessionsByCourse(prev => ({
        ...prev,
        [courseId]: {
          sessions: response.data,
          loading: false,
          error: null
        }
      }));
    } catch (err) {
      console.error(`Failed to fetch mentoring sessions for course ${courseId}:`, err);
      setSessionsByCourse(prev => ({
        ...prev,
        [courseId]: {
          ...prev[courseId],
          loading: false,
          error: 'Failed to load mentoring sessions for this course.'
        }
      }));
    }
  };

  const handleCourseSelect = async (courseId) => {
    setSelectedCourse(courseId);
    
    // If we haven't loaded sessions for this course yet, fetch them
    if (!sessionsByCourse[courseId].sessions.length && !sessionsByCourse[courseId].loading) {
      await fetchCourseSessions(courseId);
    }
  };

  const openUpdateModal = (session) => {
    setSelectedSession(session);
    setSessionStatus(session.status);
    setSessionDate(session.sessionDate ? new Date(session.sessionDate).toISOString().slice(0, 16) : '');
    setSessionNotes(session.notes || '');
    setUpdateError('');
    setUpdateSuccess(false);
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedSession(null);
    setSessionStatus('');
    setSessionDate('');
    setSessionNotes('');
    setUpdateError('');
    setUpdateSuccess(false);
  };

  const handleUpdateSession = async (e) => {
    e.preventDefault();
    
    if (!selectedSession) return;
    
    try {
      setUpdatingSession(true);
      setUpdateError('');
      
      const dateObj = sessionDate ? new Date(sessionDate).toISOString() : null;
      
      await mentoringService.updateMentoringSession(
        selectedSession.id,
        sessionStatus,
        dateObj,
        sessionNotes
      );
      
      setUpdateSuccess(true);
      
      // Update the session in our state
      const updatedSession = {
        ...selectedSession,
        status: sessionStatus,
        sessionDate: dateObj,
        notes: sessionNotes
      };
      
      setSessionsByCourse(prev => {
        const updatedSessions = prev[selectedSession.courseId].sessions.map(s => 
          s.id === selectedSession.id ? updatedSession : s
        );
        
        return {
          ...prev,
          [selectedSession.courseId]: {
            ...prev[selectedSession.courseId],
            sessions: updatedSessions
          }
        };
      });
      
      // Close the modal after 1.5 seconds
      setTimeout(() => {
        closeUpdateModal();
      }, 1500);
      
    } catch (err) {
      console.error('Failed to update mentoring session:', err);
      setUpdateError(err.response?.data?.message || 'Failed to update session. Please try again.');
    } finally {
      setUpdatingSession(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'PENDING':
        return 'badge bg-warning text-dark';
      case 'APPROVED':
        return 'badge bg-success';
      case 'REJECTED':
        return 'badge bg-danger';
      case 'COMPLETED':
        return 'badge bg-info';
      case 'CANCELLED':
        return 'badge bg-secondary';
      default:
        return 'badge bg-light text-dark';
    }
  };

  const filterSessionsByStatus = (sessions, status) => {
    if (status === 'all') return sessions;
    return sessions.filter(session => session.status === status);
  };

  const handleQuickAction = async (session, newStatus) => {
    try {
      // Update UI to show processing
      setSessionsByCourse(prev => {
        const updatedSessions = prev[session.courseId].sessions.map(s => 
          s.id === session.id ? {...s, processing: true} : s
        );
        
        return {
          ...prev,
          [session.courseId]: {
            ...prev[session.courseId],
            sessions: updatedSessions
          }
        };
      });
      
      // Call API to update status
      await mentoringService.updateMentoringSession(
        session.id,
        newStatus,
        null,
        newStatus === 'APPROVED' ? 'Request approved by instructor' : 'Request denied by instructor'
      );
      
      // Update session in state
      const updatedSession = {
        ...session,
        status: newStatus,
        notes: newStatus === 'APPROVED' ? 'Request approved by instructor' : 'Request denied by instructor',
        processing: false
      };
      
      setSessionsByCourse(prev => {
        const updatedSessions = prev[session.courseId].sessions.map(s => 
          s.id === session.id ? updatedSession : s
        );
        
        return {
          ...prev,
          [session.courseId]: {
            ...prev[session.courseId],
            sessions: updatedSessions
          }
        };
      });
      
    } catch (err) {
      console.error(`Failed to ${newStatus === 'APPROVED' ? 'accept' : 'deny'} mentoring session:`, err);
      
      // Remove processing state
      setSessionsByCourse(prev => {
        const updatedSessions = prev[session.courseId].sessions.map(s => 
          s.id === session.id ? {...s, processing: false} : s
        );
        
        return {
          ...prev,
          [session.courseId]: {
            ...prev[session.courseId],
            sessions: updatedSessions
          }
        };
      });
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (instructorCourses.length === 0) {
    return (
      <div className="alert alert-info text-center">
        <i className="bi bi-info-circle me-2"></i>
        You don't have any courses yet. Create courses to start receiving mentoring session requests.
      </div>
    );
  }

  const currentCourseData = selectedCourse ? sessionsByCourse[selectedCourse] : null;

  return (
    <div className="mentoring-sessions-container">
      <div className="course-filter-bar">
        <div className="course-tabs">
          {instructorCourses.map(course => (
            <button
              key={course.id}
              className={`course-tab-button ${selectedCourse === course.id ? 'active' : ''}`}
              onClick={() => handleCourseSelect(course.id)}
            >
              {course.title}
            </button>
          ))}
        </div>
      </div>
      
      {selectedCourse && currentCourseData && (
        <div className="mentoring-sessions-content">
          <div className="status-filter-bar">
            <button
              className={`status-filter-button ${activeStatus === 'all' ? 'active' : ''}`}
              onClick={() => setActiveStatus('all')}
            >
              All
            </button>
            <button
              className={`status-filter-button ${activeStatus === 'PENDING' ? 'active' : ''}`}
              onClick={() => setActiveStatus('PENDING')}
            >
              Pending
            </button>
            <button
              className={`status-filter-button ${activeStatus === 'APPROVED' ? 'active' : ''}`}
              onClick={() => setActiveStatus('APPROVED')}
            >
              Approved
            </button>
            <button
              className={`status-filter-button ${activeStatus === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setActiveStatus('COMPLETED')}
            >
              Completed
            </button>
            <button
              className={`status-filter-button ${activeStatus === 'REJECTED' ? 'active' : ''}`}
              onClick={() => setActiveStatus('REJECTED')}
            >
              Rejected
            </button>
            <button
              className={`status-filter-button ${activeStatus === 'CANCELLED' ? 'active' : ''}`}
              onClick={() => setActiveStatus('CANCELLED')}
            >
              Cancelled
            </button>
          </div>
          
          {currentCourseData.loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading sessions...</span>
              </div>
            </div>
          ) : currentCourseData.error ? (
            <div className="alert alert-danger">{currentCourseData.error}</div>
          ) : currentCourseData.sessions.length === 0 ? (
            <div className="alert alert-info text-center">
              <i className="bi bi-info-circle me-2"></i>
              No mentoring session requests for this course yet.
            </div>
          ) : (
            <div className="sessions-list">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{width: '20%'}}>Student</th>
                      <th style={{width: '30%'}}>Request Details</th>
                      <th style={{width: '10%'}}>Status</th>
                      <th style={{width: '15%'}}>Requested On</th>
                      <th style={{width: '15%'}}>Session Date</th>
                      <th style={{width: '10%'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterSessionsByStatus(currentCourseData.sessions, activeStatus).map(session => (
                      <tr key={session.id} className={session.processing ? 'row-processing' : ''}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar-circle me-3">
                              {session.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold">{session.studentName}</div>
                              <div className="text-muted small">
                                <i className="bi bi-envelope me-1"></i>
                                {session.studentEmail}
                              </div>
                              <div className="student-id text-muted small">
                                <i className="bi bi-person-badge me-1"></i>
                                ID: {session.studentId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="session-topic fw-semibold text-primary mb-1">{session.topic}</div>
                          <div className="session-desc small">
                            {session.description.length > 100 
                              ? `${session.description.substring(0, 100)}...` 
                              : session.description}
                            {session.description.length > 100 && (
                              <button 
                                className="btn btn-link btn-sm p-0 ms-1" 
                                onClick={() => openUpdateModal(session)}
                              >
                                Read more
                              </button>
                            )}
                          </div>
                          {session.notes && (
                            <div className="session-notes small mt-1">
                              <span className="text-muted fst-italic">
                                <i className="bi bi-journal-text me-1"></i>
                                Note: {session.notes}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(session.status)}>
                            {session.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span>
                              {new Date(session.requestDate).toLocaleDateString(undefined, {
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric'
                              })}
                            </span>
                            <small className="text-muted">
                              {new Date(session.requestDate).toLocaleTimeString(undefined, {
                                hour: '2-digit', 
                                minute: '2-digit'
                              })}
                            </small>
                          </div>
                        </td>
                        <td>
                          {session.sessionDate ? (
                            <div className="d-flex flex-column">
                              <span>
                                {new Date(session.sessionDate).toLocaleDateString(undefined, {
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric'
                                })}
                              </span>
                              <small className="text-muted">
                                {new Date(session.sessionDate).toLocaleTimeString(undefined, {
                                  hour: '2-digit', 
                                  minute: '2-digit'
                                })}
                              </small>
                            </div>
                          ) : (
                            <span className="text-muted">Not scheduled</span>
                          )}
                        </td>
                        <td>
                          {session.status === 'PENDING' ? (
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleQuickAction(session, 'APPROVED')}
                                title="Accept request"
                                disabled={session.processing}
                              >
                                {session.processing ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <><i className="bi bi-check-lg"></i> Accept</>
                                )}
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => handleQuickAction(session, 'REJECTED')}
                                title="Deny request"
                                disabled={session.processing}
                              >
                                {session.processing ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <><i className="bi bi-x-lg"></i> Deny</>
                                )}
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-primary btn-sm" 
                              onClick={() => openUpdateModal(session)}
                            >
                              <i className="bi bi-pencil-square me-1"></i>
                              Update
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {showUpdateModal && selectedSession && (
        <div className="modal-backdrop">
          <div className="mentoring-modal">
            <div className="mentoring-modal-header">
              <h3>Update Mentoring Session</h3>
              <button className="close-button" onClick={closeUpdateModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="mentoring-modal-body">
              {updateSuccess ? (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle me-2"></i>
                  Mentoring session has been updated successfully!
                </div>
              ) : (
                <form onSubmit={handleUpdateSession}>
                  {updateError && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {updateError}
                    </div>
                  )}
                  
                  <div className="session-info mb-4">
                    <div><strong>Student:</strong> {selectedSession.studentName}</div>
                    <div><strong>Email:</strong> {selectedSession.studentEmail}</div>
                    <div><strong>Topic:</strong> {selectedSession.topic}</div>
                    <div><strong>Description:</strong> {selectedSession.description}</div>
                    <div><strong>Requested:</strong> {new Date(selectedSession.requestDate).toLocaleString()}</div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="sessionStatus" className="form-label">Status</label>
                    <select
                      className="form-select"
                      id="sessionStatus"
                      value={sessionStatus}
                      onChange={(e) => setSessionStatus(e.target.value)}
                      required
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="sessionDate" className="form-label">Session Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="sessionDate"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                    />
                    <div className="form-text">
                      Leave empty if not scheduled yet or if rejected/cancelled.
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="sessionNotes" className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      id="sessionNotes"
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="Add notes about this mentoring session..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeUpdateModal}
                      disabled={updatingSession}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={updatingSession}
                    >
                      {updatingSession ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : 'Update Session'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentoringSessions; 