import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import './AdminComponents.css';

const AllCourses = ({ onViewCourse }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'student', 'professional', 'placement'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title'); // 'title', 'instructorName', 'updatedAt'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, courseId: null, title: '' });

  useEffect(() => {
    fetchAllCourses();
  }, []);

  const fetchAllCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:8080/api/admin/courses',
        { headers: authHeader() }
      );
      setCourses(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const confirmRejectCourse = (courseId, courseTitle) => {
    setConfirmDialog({
      show: true,
      courseId,
      title: courseTitle
    });
  };

  const cancelRejectCourse = () => {
    setConfirmDialog({ show: false, courseId: null, title: '' });
  };

  const handleRejectCourse = async () => {
    const courseId = confirmDialog.courseId;
    
    try {
      setActionLoading(courseId);
      await axios.post(
        `http://localhost:8080/api/admin/courses/${courseId}/reject`,
        {},
        { headers: authHeader() }
      );
      
      // Update the course status in the local state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, status: 'REJECTED' } 
            : course
        )
      );
      
      setError('');
    } catch (err) {
      console.error('Error rejecting course:', err);
      setError('Failed to reject course. Please try again later.');
    } finally {
      setActionLoading(null);
      setConfirmDialog({ show: false, courseId: null, title: '' });
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Filter and sort courses
  const filteredAndSortedCourses = courses
    .filter(course => {
      // Filter by course type
      if (filter === 'all') return true;
      return course.courseType?.toLowerCase() === filter;
    })
    .filter(course => {
      // Filter by search term
      const searchLower = searchTerm.toLowerCase();
      return (
        course.title?.toLowerCase().includes(searchLower) ||
        course.instructorName?.toLowerCase().includes(searchLower) ||
        course.category?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Sort by selected field
      let valueA, valueB;

      switch (sortBy) {
        case 'title':
          valueA = a.title?.toLowerCase() || '';
          valueB = b.title?.toLowerCase() || '';
          break;
        case 'instructorName':
          valueA = a.instructorName?.toLowerCase() || '';
          valueB = b.instructorName?.toLowerCase() || '';
          break;
        case 'updatedAt':
          valueA = new Date(a.updatedAt || 0).getTime();
          valueB = new Date(b.updatedAt || 0).getTime();
          break;
        case 'enrollments':
          valueA = a.enrollmentCount || 0;
          valueB = b.enrollmentCount || 0;
          break;
        default:
          valueA = a.title?.toLowerCase() || '';
          valueB = b.title?.toLowerCase() || '';
      }

      // Apply sort order
      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

  if (loading) {
    return <div className="loading">Loading courses...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-section">
      <h2>All Courses</h2>
      
      <div className="admin-filters">
        <div className="filter-group">
          <label htmlFor="type-filter">Course Type:</label>
          <select 
            id="type-filter" 
            value={filter} 
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="student">Student</option>
            <option value="professional">Professional</option>
            <option value="placement">Placement</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="sort-by">Sort By:</label>
          <select 
            id="sort-by" 
            value={sortBy} 
            onChange={handleSortChange}
            className="filter-select"
          >
            <option value="title">Title</option>
            <option value="instructorName">Instructor</option>
            <option value="updatedAt">Last Updated</option>
            <option value="enrollments">Enrollments</option>
          </select>
          <button 
            className="sort-order-button" 
            onClick={toggleSortOrder}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
        
        <div className="search-group">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      {filteredAndSortedCourses.length === 0 ? (
        <div className="no-data-message">No courses found.</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Instructor</th>
                <th>Category</th>
                <th>Type</th>
                <th>Status</th>
                <th>Enrollments</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCourses.map(course => (
                <tr key={course.id}>
                  <td>{course.id}</td>
                  <td>{course.title}</td>
                  <td>{course.instructorName}</td>
                  <td>{course.category}</td>
                  <td>
                    {course.courseType === 'STUDENT' ? 'Student' :
                     course.courseType === 'PROFESSIONAL' ? 'Professional' :
                     'Placement'}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(course.status)}`}>
                      {course.status}
                    </span>
                  </td>
                  <td>{course.enrollmentCount || 0}</td>
                  <td>{formatDate(course.updatedAt)}</td>
                  <td className="action-buttons">
                    <button 
                      className="view-button action-button"
                      onClick={() => onViewCourse(course.id)}
                    >
                      View
                    </button>
                    
                    {course.status === 'APPROVED' && (
                      <button 
                        className="reject-button action-button"
                        onClick={() => confirmRejectCourse(course.id, course.title)}
                        disabled={actionLoading === course.id}
                      >
                        {actionLoading === course.id ? 'Rejecting...' : 'Reject'}
                      </button>
                    )}
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
              <h3>Confirm Rejection</h3>
            </div>
            <div className="confirmation-body">
              <p>Are you sure you want to reject the approved course "{confirmDialog.title}"?</p>
              <p className="warning-text">This action will remove the course from student access.</p>
            </div>
            <div className="confirmation-footer">
              <button 
                className="btn-secondary" 
                onClick={cancelRejectCourse}
                disabled={actionLoading === confirmDialog.courseId}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleRejectCourse}
                disabled={actionLoading === confirmDialog.courseId}
              >
                {actionLoading === confirmDialog.courseId ? 'Rejecting...' : 'Reject Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCourses; 