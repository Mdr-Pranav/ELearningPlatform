import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import './CourseDetails.css';

const CourseDetails = ({ courseId, onClose }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8080/api/courses/${courseId}`, {
          headers: authHeader()
        });
        setCourse(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load course details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }

    // Add keyboard event listener for Esc key
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [courseId, onClose]);

  if (loading) {
    return (
      <div className="course-details-modal">
        <div className="course-details-content">
          <div className="course-details-header">
            <h3>Course Details</h3>
            <button className="close-button" onClick={onClose}>&times;</button>
          </div>
          <div className="course-details-body loading">
            <p>Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-details-modal">
        <div className="course-details-content">
          <div className="course-details-header">
            <h3>Course Details</h3>
            <button className="close-button" onClick={onClose}>&times;</button>
          </div>
          <div className="course-details-body error">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <>
      <div className="course-details-backdrop" onClick={onClose}></div>
      <div className="course-details-modal">
        <div className="course-details-content">
          <div className="course-details-header">
            <h3>{course.title}</h3>
            <button className="close-button" onClick={onClose}>&times;</button>
          </div>
          <div className="course-details-body">
            <div className="course-image">
              {course.imageUrl ? (
                <img src={course.imageUrl} alt={course.title} />
              ) : (
                <div className="default-course-image">
                  <span>{course.title.charAt(0)}</span>
                </div>
              )}
            </div>
            
            <div className="detail-section">
              <h4>Course Information</h4>
              {course.category && (
                <div className="detail-item">
                  <strong>Category:</strong> {course.category}
                </div>
              )}
              {course.courseType && (
                <div className="detail-item">
                  <strong>Course Type:</strong> {
                    course.courseType === 'STUDENT' ? 'Student Course' :
                    course.courseType === 'PROFESSIONAL' ? 'Professional Course' :
                    'Placement Training Course'
                  }
                </div>
              )}
              {course.instructorName && (
                <div className="detail-item">
                  <strong>Instructor:</strong> {course.instructorName}
                </div>
              )}
              {course.status && (
                <div className="detail-item">
                  <strong>Status:</strong> <span className={`status-${course.status.toLowerCase()}`}>{course.status}</span>
                </div>
              )}
              {course.createdAt && (
                <div className="detail-item">
                  <strong>Created:</strong> {new Date(course.createdAt).toLocaleDateString()}
                </div>
              )}
              {course.updatedAt && (
                <div className="detail-item">
                  <strong>Last Updated:</strong> {new Date(course.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
            
            {course.chapters && course.chapters.length > 0 && (
              <div className="detail-section">
                <h4>Chapters</h4>
                <ol className="chapter-list">
                  {course.chapters.map((chapter, index) => (
                    <li key={index}>{chapter}</li>
                  ))}
                </ol>
              </div>
            )}

            {course.pdfUrl && (
              <div className="detail-section">
                <h4>Course Materials</h4>
                <div className="detail-item">
                  <a href={course.pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-link">
                    <i className="bi bi-file-earmark-pdf"></i> Download Course PDF
                  </a>
                </div>
              </div>
            )}
            
            {course.description && (
              <div className="detail-section">
                <h4>Description</h4>
                <p>{course.description}</p>
              </div>
            )}
            
            {course.syllabus && (
              <div className="detail-section">
                <h4>Syllabus</h4>
                <p>{course.syllabus}</p>
              </div>
            )}
            
            {course.requirements && (
              <div className="detail-section">
                <h4>Requirements</h4>
                <p>{course.requirements}</p>
              </div>
            )}
            
            {course.objectives && (
              <div className="detail-section">
                <h4>Learning Objectives</h4>
                <p>{course.objectives}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseDetails; 