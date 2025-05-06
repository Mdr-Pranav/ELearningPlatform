import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import mentoringService from '../../services/mentoring.service';
import './StudentCourseView.css';

const StudentCourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMentoringModal, setShowMentoringModal] = useState(false);
  const [mentoringTopic, setMentoringTopic] = useState('');
  const [mentoringDescription, setMentoringDescription] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');

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
    navigate('/student-dashboard');
  };

  const handleViewChapter = (index) => {
    navigate(`/student/course/${courseId}/chapter/${index}`);
  };

  const handleViewNotes = () => {
    navigate(`/student/notes/${courseId}`);
  };

  const handleMentoringRequest = async (e) => {
    e.preventDefault();
    
    if (!mentoringTopic.trim() || !mentoringDescription.trim()) {
      setRequestError('Please fill out all required fields.');
      return;
    }
    
    try {
      setSubmittingRequest(true);
      setRequestError('');
      
      await mentoringService.requestMentoringSession(
        courseId,
        mentoringTopic,
        mentoringDescription
      );
      
      setRequestSuccess(true);
      
      // Clear form after 2 seconds and close modal
      setTimeout(() => {
        setShowMentoringModal(false);
        setMentoringTopic('');
        setMentoringDescription('');
        setRequestSuccess(false);
      }, 2000);
      
    } catch (err) {
      console.error('Failed to request mentoring session:', err);
      setRequestError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmittingRequest(false);
    }
  };
  
  const openMentoringModal = () => {
    setShowMentoringModal(true);
    setRequestError('');
    setRequestSuccess(false);
  };
  
  const closeMentoringModal = () => {
    setShowMentoringModal(false);
    setMentoringTopic('');
    setMentoringDescription('');
    setRequestError('');
    setRequestSuccess(false);
  };

  if (loading) {
    return (
      <div className="course-view-container loading">
        <div className="loading-spinner">
          <i className="bi bi-arrow-repeat"></i>
          <p>Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-view-container error">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          {error}
        </div>
        <button className="btn btn-primary" onClick={handleBackToDashboard}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-view-container">
        <div className="alert alert-warning">
          <i className="bi bi-info-circle-fill me-2"></i>
          Course not found
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
          <div className="action-buttons d-flex">
            <button className="btn btn-back" onClick={handleBackToDashboard}>
              <i className="bi bi-arrow-left me-2"></i>
              Back to Dashboard
            </button>
            <button className="btn btn-view-notes" onClick={handleViewNotes}>
              <i className="bi bi-journal-text me-2"></i>
              View Notes
            </button>
            <button className="btn btn-request-mentoring" onClick={openMentoringModal}>
              <i className="bi bi-person-video3 me-2"></i>
              Request Mentoring
            </button>
          </div>
          
          <div className="course-navigation">
            <button 
              className={`nav-pill ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-info-circle me-1"></i>
              Overview
            </button>
            {course.pdfUrl && (
              <button 
                className={`nav-pill ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                <i className="bi bi-book me-1"></i>
                Content
              </button>
            )}
            <button 
              className={`nav-pill ${activeTab === 'chapters' ? 'active' : ''}`}
              onClick={() => setActiveTab('chapters')}
            >
              <i className="bi bi-list-check me-1"></i>
              Chapters
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
            
            {course.requirements && (
              <div className="course-section">
                <h3>Requirements</h3>
                <p>{course.requirements}</p>
              </div>
            )}
            
            {course.objectives && (
              <div className="course-section">
                <h3>Learning Objectives</h3>
                <p>{course.objectives}</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'content' && course.pdfUrl && (
          <div className="content-tab">
            <div className="pdf-container">
              <iframe
                src={`${course.pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                title={course.title}
                frameBorder="0"
                width="100%"
                height="800px"
              ></iframe>
            </div>
            <div className="pdf-download">
              <a href={course.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success">
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Download PDF
              </a>
            </div>
          </div>
        )}
        
        {activeTab === 'chapters' && (
          <div className="chapters-tab">
            <h3>Course Chapters</h3>
            {course.chapters && course.chapters.length > 0 ? (
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
            ) : (
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No chapters available for this course.
              </div>
            )}
          </div>
        )}
      </div>

      {showMentoringModal && (
        <div className="modal-backdrop">
          <div className="mentoring-modal">
            <div className="mentoring-modal-header">
              <h3>Request One-on-One Mentoring Session</h3>
              <button className="close-button" onClick={closeMentoringModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="mentoring-modal-body">
              {requestSuccess ? (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle me-2"></i>
                  Your mentoring session request has been submitted successfully!
                </div>
              ) : (
                <form onSubmit={handleMentoringRequest}>
                  {requestError && (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {requestError}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label htmlFor="mentoringTopic" className="form-label">Topic <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="mentoringTopic"
                      value={mentoringTopic}
                      onChange={(e) => setMentoringTopic(e.target.value)}
                      placeholder="e.g., Understanding Data Structures, Help with Assignment"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="mentoringDescription" className="form-label">Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      id="mentoringDescription"
                      value={mentoringDescription}
                      onChange={(e) => setMentoringDescription(e.target.value)}
                      placeholder="Please describe what you'd like to discuss during the mentoring session..."
                      rows={5}
                      required
                    />
                  </div>
                  
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeMentoringModal}
                      disabled={submittingRequest}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submittingRequest}
                    >
                      {submittingRequest ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Submitting...
                        </>
                      ) : 'Submit Request'}
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

export default StudentCourseView; 