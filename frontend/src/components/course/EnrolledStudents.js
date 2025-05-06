import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authHeader from '../../services/auth-header';

const EnrolledStudents = ({ courseId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const tableBorderStyle = {
    border: '3px solid #dee2e6',
    borderCollapse: 'separate',
    borderSpacing: 0,
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const cellBorderStyle = {
    borderBottom: '3px solid #dee2e6',
    borderRight: '3px solid #dee2e6'
  };

  const lastCellStyle = {
    borderBottom: '3px solid #dee2e6',
    borderRight: 'none'
  };

  const headerCellStyle = {
    ...cellBorderStyle,
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    borderBottom: '3px solid #adb5bd'  // Darker border for header bottom
  };

  const lastHeaderCellStyle = {
    ...lastCellStyle,
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
    borderBottom: '3px solid #adb5bd'  // Darker border for header bottom
  };

  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/instructor/courses/${courseId}/students`,
          { headers: authHeader() }
        );
        setStudents(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load enrolled students. Please try again later.');
        console.error(err);
        setLoading(false);
      }
    };

    if (courseId) {
      fetchEnrolledStudents();
    }
  }, [courseId]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    return (
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.phoneNumber && student.phoneNumber.includes(searchTerm))
    );
  });

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

  return (
    <div className="enrolled-students card">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="card-title mb-0">Enrolled Students</h3>
          <div className="input-group" style={{ width: '300px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search students..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {students.length === 0 ? (
          <div className="alert alert-info text-center">
            <i className="bi bi-info-circle me-2"></i>
            No students have enrolled in this course yet.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="alert alert-warning text-center">
            <i className="bi bi-exclamation-triangle me-2"></i>
            No students match your search criteria.
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-center">
              <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 300px)', width: '100%' }}>
                <div>
                <strong>Total Students:</strong> {filteredStudents.length}
                {searchTerm && students.length !== filteredStudents.length && (
                  <span className="ms-2 text-muted">
                    (filtered from {students.length})
                  </span>
                )}
              </div>
                <table className="table table-hover table-striped align-middle text-center mx-auto" style={tableBorderStyle}>
                  <thead className="table-light">
                    <tr>
                      <th style={{...headerCellStyle, width: '8%'}}>#</th>
                      <th style={{...headerCellStyle, width: '5%'}}>Picture</th>
                      <th style={{...headerCellStyle, width: '20%'}}>Student</th>
                      <th style={{...headerCellStyle, width: '25%'}}>Email</th>
                      <th style={{...headerCellStyle, width: '15%'}}>Phone</th>
                      <th style={{...lastHeaderCellStyle, width: '20%'}}>Enrolled On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id}>
                        <td className="align-middle text-center" style={cellBorderStyle}>
                          <span className="fw-bold">{index + 1}</span>
                        </td>
                        <td className="align-middle text-center" style={cellBorderStyle}>
                          <div className="avatar-circle me-3" style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%', 
                              backgroundColor: '#007bff',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '18px',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                            }}>
                              {student.fullName.charAt(0).toUpperCase()}
                            </div>
                        </td>
                        <td className="align-middle" style={cellBorderStyle}>
                          <div className="d-flex align-items-center justify-content-center">
                            <div className="fw-bold">{student.fullName}</div>
                          </div>
                        </td>
                        <td className="align-middle text-center" style={cellBorderStyle}>
                          <a href={`mailto:${student.email}`} className="text-decoration-none">
                            {student.email}
                          </a>
                        </td>
                        <td className="align-middle text-center" style={cellBorderStyle}>
                          {student.phoneNumber ? (
                            <a href={`tel:${student.phoneNumber}`} className="text-decoration-none">
                              {student.phoneNumber}
                            </a>
                          ) : (
                            <span className="text-muted">Not provided</span>
                          )}
                        </td>
                        <td className="align-middle text-center" style={lastCellStyle}>
                          {new Date(student.enrolledAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              
              {students.length > 10 && (
                <div className="text-muted small">
                  Scroll to see more students
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnrolledStudents; 