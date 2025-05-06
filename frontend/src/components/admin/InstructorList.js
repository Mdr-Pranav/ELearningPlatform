import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import UserProfileModal from './UserProfileModal';
import './AdminComponents.css';

const InstructorList = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState(null);
  const [instructorCourses, setInstructorCourses] = useState({});

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/admin/instructors', {
        headers: authHeader()
      });
      setInstructors(response.data);
      
      // Fetch courses for each instructor
      for (const instructor of response.data) {
        const coursesResponse = await axios.get(
          `http://localhost:8080/api/admin/instructor/${instructor.id}/courses`,
          { headers: authHeader() }
        );
        setInstructorCourses(prev => ({
          ...prev,
          [instructor.id]: coursesResponse.data.length
        }));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setError('Failed to load instructors');
      setLoading(false);
    }
  };

  const handleViewInstructor = (instructorId) => {
    setSelectedInstructorId(instructorId);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedInstructorId(null);
  };

  if (loading) return <div className="loading">Loading instructors...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="list-container">
      <div className="list-header">
        <h3>All Instructors</h3>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search instructors..."
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
              <th>Phone</th>
              <th>Courses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {instructors.map((instructor) => (
              <tr key={instructor.id}>
                <td>{instructor.fullName}</td>
                <td>{instructor.email}</td>
                <td>{instructor.username}</td>
                <td>{instructor.phoneNumber || 'N/A'}</td>
                <td>{instructorCourses[instructor.id] || 0}</td>
                <td>
                  <button
                    className="btn-view"
                    onClick={() => handleViewInstructor(instructor.id)}
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

      {showProfileModal && selectedInstructorId && (
        <UserProfileModal 
          userId={selectedInstructorId}
          userType="instructor"
          onClose={closeProfileModal}
        />
      )}
    </div>
  );
};

export default InstructorList; 