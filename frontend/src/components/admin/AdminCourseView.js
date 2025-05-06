import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import './AdminComponents.css';

const AdminCourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [chapterDetail, setChapterDetail] = useState(null);
  const [loadingChapterDetail, setLoadingChapterDetail] = useState(false);
  const [chapterDetailError, setChapterDetailError] = useState(null);
  const [showObjectives, setShowObjectives] = useState(false);

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
  }, [courseId]);

  const handleBackToDashboard = () => {
    navigate('/admin-dashboard');
  };

  const handleViewChapter = (index) => {
    navigate(`/admin/course/${courseId}/chapter/${index}`);
  };

  const fetchChapterDetail = async (chapterIndex) => {
    try {
      setLoadingChapterDetail(true);
      setChapterDetailError(null);
      
      const response = await axios.get(
        `http://localhost:8080/api/admin/course/${courseId}/chapter/${chapterIndex}/details`,
        { headers: authHeader() }
      );
      
      setChapterDetail(response.data);
    } catch (err) {
      console.error('Failed to load chapter details:', err);
      setChapterDetailError('Chapter details not available.');
      setChapterDetail(null);
    } finally {
      setLoadingChapterDetail(false);
    }
  };

  const toggleObjectives = () => {
    setShowObjectives(!showObjectives);
  };

  if (loading) {
    return (
      <div className="course-view-container">
        <div className="loading-spinner">
          <i className="bi bi-arrow-repeat"></i>
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-view-container">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          {error || 'Course not found'}
        </div>
        <button className="btn btn-primary" onClick={handleBackToDashboard}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="course-view-container">
      <div className="course-view-header">
        <div className="course-header-top">
          <div className="course-navigation">
            <button className="nav-pill" onClick={handleBackToDashboard}>
              <i className="bi bi-arrow-left"></i>
              Back to Dashboard
            </button>
          </div>
          <div className="course-quick-details">
            <div className="quick-detail-item">
              <i className="bi bi-info-circle me-2"></i>
              <span>{course.category} · {course.courseType === 'STUDENT' ? 'Student Course' : 
                            course.courseType === 'PROFESSIONAL' ? 'Professional Course' : 
                            'Placement Training Course'}</span>
            </div>
            <div className="quick-detail-item">
              <i className="bi bi-list-check me-2"></i>
              <span>Chapters: {course.chapters ? course.chapters.length : 0}</span>
            </div>
          </div>
        </div>
        
        <h1>{course.title}</h1>
        <p className="instructor-info">
          <i className="bi bi-person-circle me-2"></i>
          Instructor: {course.instructorName}
        </p>
      </div>

      <div className="course-view-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="course-image">
              {course.imageUrl ? (
                <img src={course.imageUrl} alt={course.title} />
              ) : (
                <div className="default-course-image">
                  <span>{course.title.charAt(0)}</span>
                </div>
              )}
            </div>
            
            <div className="course-info-section">
              <h3>Course Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Category:</span>
                  <span className="info-value">{course.category}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Course Type:</span>
                  <span className="info-value">
                    {course.courseType === 'STUDENT' ? 'Student Course' :
                     course.courseType === 'PROFESSIONAL' ? 'Professional Course' :
                     'Placement Training Course'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated:</span>
                  <span className="info-value">{new Date(course.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {course.description && (
              <div className="course-section">
                <h3>Description</h3>
                <p>{course.description}</p>
              </div>
            )}
            
            {course.syllabus && (
              <div className="course-section">
                <h3>Syllabus</h3>
                <p>{course.syllabus}</p>
              </div>
            )}
            
            {course.chapters && course.chapters.length > 0 && (
              <div className="course-section">
                <h3>Chapters</h3>
                <div className="chapter-list">
                  {course.chapters.map((chapter, index) => (
                    <div 
                      key={index} 
                      className="chapter-item"
                      onClick={() => handleViewChapter(index)}
                    >
                      <div className="chapter-number">{index + 1}</div>
                      <div className="chapter-content">
                        <h4>{chapter}</h4>
                      </div>
                      <div className="chapter-action">
                        <i className="bi bi-arrow-right-circle"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {course.pdfUrl && (
              <div className="course-section">
                <h3>Course Materials</h3>
                <div className="detail-item">
                  <a href={course.pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-link">
                    <i className="bi bi-file-earmark-pdf"></i> Download Course PDF
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourseView; 