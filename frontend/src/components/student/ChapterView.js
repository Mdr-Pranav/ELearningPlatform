import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import noteService from '../../services/note.service';
import QuizView from '../course/QuizView';
import './ChapterView.css';

const API_URL = 'http://localhost:8080';

const ChapterView = () => {
  const { courseId, chapterIndex } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(parseInt(chapterIndex, 10) || 0);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [chapterDetail, setChapterDetail] = useState(null);
  const [loadingChapterDetail, setLoadingChapterDetail] = useState(false);
  const [chapterDetailError, setChapterDetailError] = useState(null);
  const [showObjectives, setShowObjectives] = useState(false);
  const [completionMessage, setCompletionMessage] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');

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

  useEffect(() => {
    // Update active chapter when the URL parameter changes
    if (chapterIndex) {
      setActiveChapterIndex(parseInt(chapterIndex, 10));
    }
  }, [chapterIndex]);

  useEffect(() => {
    // Fetch notes and chapter details when chapter changes
    if (courseId && activeChapterIndex !== null && activeChapterIndex !== undefined) {
      fetchChapterNotes();
      fetchChapterDetail();
    }
  }, [courseId, activeChapterIndex]);

  const fetchChapterNotes = async () => {
    try {
      setNotesError('');
      // Instead of requesting chapter-specific notes, we get the general course notes
      const response = await noteService.getCourseNotes(courseId);
      
      if (response.data && response.data.length > 0) {
        // Get the general course note (without a chapter)
        const generalNote = response.data.find(note => note.chapterIndex === null) || response.data[0];
        setNotes(generalNote.content || '');
      } else {
        setNotes('');
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
      setNotesError('Failed to load notes. Please try again.');
    }
  };

  const fetchChapterDetail = async () => {
    try {
      setLoadingChapterDetail(true);
      setChapterDetailError(null);
      
      // Get the authentication token using the correct key
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log('Fetching chapter details with token:', token.substring(0, 10) + '...');
      
      // Use the correct API endpoint path
      const response = await axios.get(
        `${API_URL}/api/student/course/${courseId}/chapter/${activeChapterIndex}/details`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Chapter details response:', response.data);
      setChapterDetail(response.data);
      setNotes(response.data.notes || '');
      
      // Check if videoUrl exists in the response
      if (response.data.videoUrl) {
        const formattedUrl = formatVideoUrl(response.data.videoUrl);
        console.log('Formatted video URL:', formattedUrl);
        setVideoUrl(formattedUrl);
      } else {
        console.log('No video URL found in the response');
        setVideoUrl('');
      }
    } catch (err) {
      console.error('Error fetching chapter details:', err);
      if (err.response && err.response.status === 403) {
        setChapterDetailError('Access denied. Please log in again.');
        // Redirect to login page
        navigate('/login');
      } else {
        setChapterDetailError('Error fetching chapter details. Please try again.');
      }
    } finally {
      setLoadingChapterDetail(false);
    }
  };

  const formatVideoUrl = (url) => {
    if (!url) return '';
    console.log('Formatting video URL:', url);
    
    // Extract Google Drive file ID
    const fileIdMatch = url.match(/[-\w]{25,}/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[0];
      const formattedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      console.log('Formatted Google Drive URL:', formattedUrl);
      return formattedUrl;
    }
    
    // If it's already a valid URL, return it as is
    if (url.startsWith('http')) {
      return url;
    }
    
    return '';
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      setNotesError('');
      
      // Save to general course notes instead of chapter-specific notes
      await noteService.saveNote(courseId, notes, null);
      
      setNotesSaved(true);
      
      // Clear the success message after 3 seconds
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save notes:', err);
      setNotesError('Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    setNotesSaved(false);
  };

  const toggleNotesPanel = () => {
    setShowNotesPanel(!showNotesPanel);
  };

  const handleChapterClick = (index) => {
    setActiveChapterIndex(index);
    // Update URL without full page reload
    navigate(`/student/course/${courseId}/chapter/${index}`, { replace: true });
  };

  const handleBackToCourse = () => {
    navigate(`/student/course/${courseId}`);
  };

  const toggleObjectives = () => {
    setShowObjectives(!showObjectives);
  };

  const handleQuizComplete = (score) => {
    setQuizCompleted(true);
    setQuizScore(score);
  };

  const handleCompleteCourse = async () => {
    try {
      // Only allow course completion if the quiz is completed
      if (!quizCompleted) {
        setCompletionMessage('Please complete the quiz before completing the course.');
        return;
      }

      // Check if the score is at least 75%
      if (!quizScore || quizScore.percentage < 75) {
        setCompletionMessage('You need to score at least 75% on the quiz to complete the course and receive a certificate.');
        return;
      }

      const response = await axios.post(
        `http://localhost:8080/api/student/courses/${courseId}/complete`,
        {
          quizScore: quizScore.percentage,
          earnedPoints: quizScore.earned,
          totalPoints: quizScore.total
        },
        { headers: authHeader() }
      );
      
      setCompletionMessage('Course completed successfully! Your certificate has been generated.');
      
      // Use a more reliable confirmation dialog
      const viewCertificates = window.confirm('Would you like to view your certificates now?');
      
      // Navigate based on user's choice after a short delay to ensure state updates
      setTimeout(() => {
        if (viewCertificates) {
          navigate('/student-dashboard', { state: { section: 'certificates' } });
        } else {
          navigate(`/student/course/${courseId}`);
        }
      }, 100);

    } catch (error) {
      console.error('Error completing course:', error);
      setCompletionMessage(error.response?.data?.message || 'Failed to complete course. Please try again.');
    }
  };

  const renderChapterContent = () => {
    if (loadingChapterDetail) {
      return (
        <div className="chapter-loading">
          <i className="bi bi-hourglass-split"></i>
          <p>Loading chapter content...</p>
        </div>
      );
    }

    if (chapterDetailError) {
      return (
        <div className="chapter-info-section">
          <h3>Chapter Information</h3>
          <p>This is chapter {activeChapterIndex + 1} of the course "{course?.title}".</p>
          <p>{chapterDetailError}</p>
        </div>
      );
    }

    if (!chapterDetail) {
      return (
        <div className="chapter-info-section">
          <h3>Chapter Information</h3>
          <p>No chapter details available.</p>
        </div>
      );
    }

    return (
      <div className="chapter-detail-content">
        {/* Video Section */}
        {videoUrl && (
          <div className="chapter-video-container">
            <h3>Chapter Video</h3>
            <div className="video-wrapper">
              <iframe
                src={videoUrl}
                className="video-frame"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Chapter Video"
              ></iframe>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="chapter-section">
          <div className="prose max-w-none">
            <h3>Content</h3>
            <div className="chapter-content" dangerouslySetInnerHTML={{ __html: chapterDetail.content }} />
          </div>
        </div>

        {/* Objectives Section */}
        {chapterDetail.objectives && (
          <button
            className="objectives-toggle-btn mt-4"
            onClick={toggleObjectives}
          >
            <i className={`bi ${showObjectives ? 'bi-x-circle' : 'bi-check-square'} me-2`}></i>
            {showObjectives ? 'Hide Learning Objectives' : 'View Learning Objectives'}
          </button>
        )}
        
        {showObjectives && chapterDetail.objectives && (
          <div className="objectives-popup" onClick={toggleObjectives}>
            <div className="objectives-popup-content" onClick={(e) => e.stopPropagation()}>
              <div className="objectives-popup-header">
                <h4><i className="bi bi-check-square me-2"></i>Learning Objectives</h4>
                <button
                  className="objectives-close-btn"
                  onClick={toggleObjectives}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="chapter-objectives">
                <div dangerouslySetInnerHTML={{ __html: chapterDetail.objectives }} />
              </div>
            </div>
          </div>
        )}
        
        {/* Resources Section */}
        {chapterDetail.resources && (
          <div className="chapter-section mt-4">
            <h3 className="text-lg font-semibold mb-2">
              <i className="bi bi-link-45deg me-2"></i>Additional Resources
            </h3>
            <div className="chapter-resources">
              <div 
                className="resources-content"
                dangerouslySetInnerHTML={{ __html: chapterDetail.resources }}
              />
            </div>
          </div>
        )}

        {/* Quiz Section */}
        <div className="chapter-section quiz-section mt-4">
          <h4><i className="bi bi-question-circle me-2"></i>Chapter Quiz</h4>
          {chapterDetail.id ? (
            <>
              <QuizView 
                chapterId={chapterDetail.id}
                onComplete={handleQuizComplete}
              />
              {quizCompleted && (
                <div className="mt-4 text-center">
                  <div className="quiz-completion-status">
                    <p>Quiz Score: {quizScore.percentage}% ({quizScore.earned}/{quizScore.total} points)</p>
                    {quizScore.percentage >= 75 ? (
                      <p className="text-success">
                        <i className="bi bi-check-circle me-2"></i>
                        You have passed the quiz! You can now complete the course.
                      </p>
                    ) : (
                      <p className="text-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        You need to score at least 75% to complete the course.
                      </p>
                    )}
                  </div>
                  <button 
                    className="btn btn-primary mt-3"
                    onClick={handleCompleteCourse}
                    disabled={!quizCompleted || quizScore.percentage < 75}
                  >
                    <i className="bi bi-trophy me-2"></i>
                    Complete Course
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              No quiz available for this chapter.
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="chapter-view-container">
        <div className="loading-spinner">
          <i className="bi bi-arrow-repeat"></i>
          <p>Loading chapter content...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="chapter-view-container">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          {error || 'Course not found'}
        </div>
        <button className="btn btn-primary" onClick={handleBackToCourse}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Course
        </button>
      </div>
    );
  }

  const chapters = course.chapters || [];
  const currentChapter = chapters[activeChapterIndex];

  if (!currentChapter) {
    return (
      <div className="chapter-view-container">
        <div className="alert alert-warning">
          <i className="bi bi-info-circle-fill me-2"></i>
          Chapter not found
        </div>
        <button className="btn btn-primary" onClick={handleBackToCourse}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Course
        </button>
      </div>
    );
  }

  return (
    <div className="chapter-view-container">
      <div className="chapter-view-header">
        <button className="btn btn-outline-primary" onClick={handleBackToCourse}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Course
        </button>
        <h1>{course.title}</h1>
        <p className="course-info">
          <i className="bi bi-book me-2"></i>
          Chapter {activeChapterIndex + 1} of {chapters.length}
        </p>
      </div>

      <div className="chapter-view-content">
        <div className="chapter-sidebar">
          <h3>Chapters</h3>
          <div className="chapter-list-nav">
            {chapters.map((chapter, index) => (
              <button
                key={index}
                className={`chapter-nav-item ${index === activeChapterIndex ? 'active' : ''}`}
                onClick={() => handleChapterClick(index)}
              >
                <div className="chapter-nav-number">{index + 1}</div>
                <div className="chapter-nav-title">{chapter}</div>
                {index === activeChapterIndex && <i className="bi bi-chevron-right chapter-nav-indicator"></i>}
              </button>
            ))}
          </div>
        </div>

        <div className="chapter-content-panel">
          <div className="chapter-content-header">
            <h2>{currentChapter}</h2>
            <button 
              className={`notes-toggle-btn ${showNotesPanel ? 'active' : ''}`} 
              onClick={toggleNotesPanel}
            >
              <i className={`bi ${showNotesPanel ? 'bi-x-lg' : 'bi-pencil-square'}`}></i>
              {showNotesPanel ? 'Hide Notes' : 'Course Notes'}
            </button>
          </div>
          
          <div className="chapter-content-wrapper">
            <div className={`chapter-content-body ${showNotesPanel ? 'with-notes' : ''}`}>
              {renderChapterContent()}
            </div>
            
            {showNotesPanel && (
              <div className="chapter-notes-panel">
                <h3>Course Notes</h3>
                  <textarea
                    value={notes}
                    onChange={handleNotesChange}
                  placeholder="Enter your notes here..."
                  ></textarea>
                    <button 
                      className="btn btn-primary"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                    >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterView; 