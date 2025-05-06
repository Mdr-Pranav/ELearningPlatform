import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../admin/AdminComponents.css';
import CourseDetails from '../course/CourseDetails';

const PendingReviewCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState('');

  useEffect(() => {
    fetchPendingCourses();
  }, []);

  const fetchPendingCourses = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/instructor/pending-courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setCourses(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch pending review courses');
      setLoading(false);
    }
  };

  const handleViewCourse = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleCloseModal = () => {
    setSelectedCourseId(null);
  };

  const handleDeleteCourse = (course) => {
    setCourseToDelete(course);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCourse = async () => {
    try {
      await axios.delete(
        `http://localhost:8080/api/instructor/courses/${courseToDelete.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      
      // Remove course from state
      setCourses(courses.filter(course => course.id !== courseToDelete.id));
      
      // Show success message
      setDeleteSuccess(`"${courseToDelete.title}" has been deleted successfully.`);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setDeleteSuccess('');
      }, 3000);
      
      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setCourseToDelete(null);
      
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err.response?.data?.message || 'Failed to delete course');
      setShowDeleteConfirm(false);
    }
  };

  const cancelDeleteCourse = () => {
    setShowDeleteConfirm(false);
    setCourseToDelete(null);
  };

  if (loading) return <div className="loading">Loading pending review courses...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="list-container">
      <div className="list-header">
        <h3>Courses Under Review</h3>
      </div>

      {deleteSuccess && (
        <div className="delete-success-toast">
          <i className="bi bi-check-circle-fill me-2"></i>
          {deleteSuccess}
        </div>
      )}

      <div className="table-responsive">
        <table className="list-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Type</th>
              <th>Submitted On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.category}</td>
                <td>{course.courseType}</td>
                <td>{new Date(course.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn-view me-2"
                    onClick={() => handleViewCourse(course.id)}
                  >
                    View Details
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteCourse(course)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">No courses under review</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {selectedCourseId && (
        <CourseDetails 
          courseId={selectedCourseId}
          onClose={handleCloseModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop">
          <div className="delete-confirm-modal">
            <div className="delete-confirm-header">
              <h4>Delete Course</h4>
            </div>
            <div className="delete-confirm-body">
              <p>Are you sure you want to delete "{courseToDelete?.title}"?</p>
              <p className="text-danger">This action cannot be undone!</p>
            </div>
            <div className="delete-confirm-footer">
              <button 
                className="btn btn-secondary" 
                onClick={cancelDeleteCourse}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmDeleteCourse}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingReviewCourses; 