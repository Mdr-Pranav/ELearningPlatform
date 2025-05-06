import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminComponents.css';
import UserProfileModal from './UserProfileModal';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/admin/students', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        setStudents(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch students');
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleViewStudent = (studentId) => {
    setSelectedStudentId(studentId);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedStudentId(null);
  };

  if (loading) return <div className="loading">Loading students...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="list-container">
      <div className="list-header">
        <h3>All Students</h3>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search students..."
            onChange={(e) => {
              // Implement search functionality
            }}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="list-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>User Type</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.fullName}</td>
                <td>{student.email}</td>
                <td>{student.username}</td>
                <td>{student.userType}</td>
                <td>{student.phoneNumber || 'N/A'}</td>
                <td>
                  <button
                    className="btn-view"
                    onClick={() => handleViewStudent(student.id)}
                  >
                    View
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => {
                      // Implement edit functionality
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showProfileModal && selectedStudentId && (
        <UserProfileModal 
          userId={selectedStudentId}
          userType="student"
          onClose={closeProfileModal}
        />
      )}
    </div>
  );
};

export default StudentList; 