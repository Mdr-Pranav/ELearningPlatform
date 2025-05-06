import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import './AdminComponents.css';

const AdminChapterView = () => {
  const { courseId, chapterIndex } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showObjectives, setShowObjectives] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  // Parse objectives string into array
  const parseObjectives = (objectivesString) => {
    if (!objectivesString) return [];
    // Split by newlines and filter out empty lines
    return objectivesString.split('\n').filter(obj => obj.trim() !== '');
  };

  // Parse resources string into array
  const parseResources = (resourcesString) => {
    if (!resourcesString) return [];
    // Split by newlines and filter out empty lines
    return resourcesString.split('\n').filter(res => res.trim() !== '');
  };

  useEffect(() => {
    const fetchChapterDetails = async () => {
      try {
        setLoading(true);
        const [courseResponse, chapterResponse] = await Promise.all([
          axios.get(`http://localhost:8080/api/courses/${courseId}`, {
            headers: authHeader()
          }),
          axios.get(`http://localhost:8080/api/admin/course/${courseId}/chapter/${chapterIndex}/details`, {
            headers: authHeader()
          })
        ]);

        setCourse(courseResponse.data);
        setChapter(chapterResponse.data);
        setError(null);
      } catch (err) {
        setError('Failed to load chapter details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && chapterIndex) {
      fetchChapterDetails();
    }
  }, [courseId, chapterIndex]);

  const handleBackToCourse = () => {
    navigate(`/admin/course/${courseId}`);
  };

  const handleNextChapter = () => {
    if (course && chapterIndex < course.chapters.length - 1) {
      navigate(`/admin/course/${courseId}/chapter/${parseInt(chapterIndex) + 1}`);
    }
  };

  const handlePreviousChapter = () => {
    if (chapterIndex > 0) {
      navigate(`/admin/course/${courseId}/chapter/${parseInt(chapterIndex) - 1}`);
    }
  };

  if (loading) {
    return (
      <div className="chapter-view-container">
        <div className="loading-spinner">
          <i className="bi bi-arrow-repeat"></i>
          <p>Loading chapter details...</p>
        </div>
      </div>
    );
  }

  if (error || !course || !chapter) {
    return (
      <div className="chapter-view-container">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          {error || 'Chapter not found'}
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
      <div className="chapter-navigation">
        <button className="nav-pill" onClick={handleBackToCourse}>
          <i className="bi bi-arrow-left"></i>
          Back to Course
        </button>
        <div className="chapter-progress">
          <span>Chapter {parseInt(chapterIndex) + 1} of {course.chapters.length}</span>
        </div>
      </div>

      <div className="chapter-content">
        <h1>{course.chapters[chapterIndex]}</h1>
        
        {chapter.objectives && (
          <div className="chapter-section">
            <div className="section-header" onClick={() => setShowObjectives(!showObjectives)}>
              <h2>Learning Objectives</h2>
              <i className={`bi bi-chevron-${showObjectives ? 'up' : 'down'}`}></i>
            </div>
            {showObjectives && (
              <ul className="objectives-list">
                {parseObjectives(chapter.objectives).map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="chapter-section">
          <h2>Content</h2>
          <div className="content-text" dangerouslySetInnerHTML={{ __html: chapter.content }} />
        </div>

        {chapter.resources && (
          <div className="chapter-section">
            <div className="section-header" onClick={() => setShowResources(!showResources)}>
              <h2>Additional Resources</h2>
              <i className={`bi bi-chevron-${showResources ? 'up' : 'down'}`}></i>
            </div>
            {showResources && (
              <ul className="resources-list">
                {parseResources(chapter.resources).map((resource, index) => (
                  <li key={index}>
                    <a href={resource} target="_blank" rel="noopener noreferrer">
                      <i className="bi bi-link-45deg"></i>
                      {resource}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {chapter.quiz && (
          <div className="chapter-section">
            <div className="section-header" onClick={() => setShowQuiz(!showQuiz)}>
              <h2>Chapter Quiz</h2>
              <i className={`bi bi-chevron-${showQuiz ? 'up' : 'down'}`}></i>
            </div>
            {showQuiz && (
              <div className="quiz-content">
                <h3>{chapter.quiz.title}</h3>
                <p>{chapter.quiz.description}</p>
                <div className="quiz-questions">
                  {chapter.quiz.questions.map((question, index) => (
                    <div key={index} className="quiz-question">
                      <h4>Question {index + 1}</h4>
                      <p>{question.text}</p>
                      <ul className="quiz-options">
                        {question.options.map((option, optIndex) => (
                          <li key={optIndex} className={option.isCorrect ? 'correct-option' : ''}>
                            {option.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="chapter-navigation-buttons">
        <button 
          className="btn btn-outline-primary" 
          onClick={handlePreviousChapter}
          disabled={chapterIndex <= 0}
        >
          <i className="bi bi-arrow-left"></i> Previous Chapter
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleNextChapter}
          disabled={chapterIndex >= course.chapters.length - 1}
        >
          Next Chapter <i className="bi bi-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default AdminChapterView; 