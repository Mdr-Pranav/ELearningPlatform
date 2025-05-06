import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import './StudentComponents.css';

const EnrolledCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionMessage, setCompletionMessage] = useState(null);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/student/enrolled-courses',
        { headers: authHeader() }
      );
      setCourses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      setError('Failed to load enrolled courses');
      setLoading(false);
    }
  };

  const handleCompleteCourse = async (courseId) => {
    try {
      const response = await axios.post(
        `http://localhost:8080/api/student/courses/${courseId}/complete`,
        {},
        { headers: authHeader() }
      );
      
      setCompletionMessage({
        type: 'success',
        text: 'Course completed successfully! Your certificate has been generated.'
      });
      
      // Refresh the courses list
      fetchEnrolledCourses();
      
      // Clear the message after 5 seconds
      setTimeout(() => {
        setCompletionMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error completing course:', error);
      setCompletionMessage({
        type: 'error',
        text: 'Failed to complete course. Please try again.'
      });
    }
  };

  if (loading) return <div className="loading">Loading enrolled courses...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="enrolled-courses-container">
      <h2>My Enrolled Courses</h2>
      
      {completionMessage && (
        <div className={`alert alert-${completionMessage.type}`}>
          {completionMessage.text}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="no-courses">
          <p>You haven't enrolled in any courses yet.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-image">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.title} />
                ) : (
                  <div className="default-course-image">
                    <span>{course.title.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="course-content">
                <h3>{course.title}</h3>
                <p className="instructor">Instructor: {course.instructorName}</p>
                <p className="description">{course.description}</p>
                <div className="course-footer">
                  <button
                    className="btn-view-course"
                    onClick={() => {/* Implement view course */}}
                  >
                    View Course
                  </button>
                  {!course.completed && (
                    <button
                      className="btn-complete-course"
                      onClick={() => handleCompleteCourse(course.id)}
                    >
                      Complete Course
                    </button>
                  )}
                  {course.completed && (
                    <span className="completion-badge">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses; 