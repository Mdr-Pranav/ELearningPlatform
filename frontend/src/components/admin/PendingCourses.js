import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminComponents.css';

const PendingCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingCourses();
  }, []);

  const fetchPendingCourses = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/admin/pending-courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setCourses(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch pending courses');
      setLoading(false);
    }
  };

  const handleCourseAction = async (courseId, action) => {
    try {
      const response = await axios.post(
        `http://localhost:8080/api/admin/courses/${courseId}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        }
      );

      if (response.status === 200) {
        // Remove the course from the list
        setCourses(courses.filter(course => course.id !== courseId));
        // Show success message
        setMessage({ type: 'success', text: `Course ${action === 'approve' ? 'approved' : 'rejected'} successfully` });
      }
    } catch (error) {
      console.error(`Error ${action}ing course:`, error);
      setMessage({ type: 'error', text: `Failed to ${action} course. Please try again.` });
    }
  };

  const handleViewCourse = (courseId) => {
    navigate(`/admin/course/${courseId}`);
  };

  if (loading) return <div className="loading">Loading pending courses...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="list-container">
      <div className="list-header">
        <h3>Pending Course Approvals</h3>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
          {message.text}
        </div>
      )}

      <div className="table-responsive">
        <table className="list-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Instructor</th>
              <th>Category</th>
              <th>Type</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.instructorName}</td>
                <td>{course.category}</td>
                <td>{course.courseType}</td>
                <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn-view"
                    onClick={() => handleViewCourse(course.id)}
                  >
                    View Details
                  </button>
                  <button
                    className="btn-approve"
                    onClick={() => handleCourseAction(course.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleCourseAction(course.id, 'reject')}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center">No pending courses to review</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingCourses; 