import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CourseStyles.css';
import QuizForm from './QuizForm';
import { useAuth } from '../../context/AuthContext';

const QuizList = ({ chapterId, isInstructor }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('QuizList - chapterId:', chapterId);
    console.log('QuizList - isInstructor:', isInstructor);
    console.log('QuizList - isLoggedIn:', isLoggedIn);

    if (!isLoggedIn) {
      setError('Please log in to view quizzes');
      setLoading(false);
      return;
    }

    if (chapterId && chapterId !== 0) {
      fetchQuizzes();
    } else {
      setLoading(false);
    }
  }, [chapterId, isLoggedIn, isInstructor]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found in localStorage');
        setError('Please log in to view quizzes');
        return;
      }

      console.log('Fetching quizzes for chapter:', chapterId);
      const response = await fetch(`http://localhost:8080/api/quizzes/chapter/${chapterId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch quizzes');
      }

      const data = await response.json();
      console.log('Fetched quizzes:', data);
      setQuizzes(data);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError(err.message || 'Failed to fetch quizzes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setShowQuizForm(true);
  };

  const handleQuizSuccess = () => {
    setShowQuizForm(false);
    setEditingQuiz(null);
    fetchQuizzes();
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to delete the quiz');
        return;
      }

      console.log('Deleting quiz with ID:', quizId);
      
      // Create a new XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.open('DELETE', `http://localhost:8080/api/quizzes/${quizId}`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function() {
        console.log('Delete response status:', xhr.status);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success
          console.log('Quiz deleted successfully');
          fetchQuizzes(); // Refresh the quiz list
        } else {
          // Error
          let errorMessage = 'Failed to delete quiz';
          
          if (xhr.status === 401) {
            errorMessage = 'Your session has expired. Please log in again.';
          } else if (xhr.status === 403) {
            errorMessage = 'You do not have permission to delete this quiz.';
          } else if (xhr.status === 404) {
            errorMessage = 'Quiz not found.';
          } else if (xhr.status === 405) {
            errorMessage = 'Delete operation not supported. Please try again later.';
          } else {
            try {
              const response = JSON.parse(xhr.responseText);
              errorMessage = response.message || errorMessage;
            } catch (e) {
              console.error('Error parsing error response:', e);
            }
          }
          
          console.error('Error deleting quiz:', errorMessage);
          setError(errorMessage);
        }
      };
      
      xhr.onerror = function() {
        console.error('Network error occurred');
        setError('Network error occurred. Please check your connection and try again.');
      };
      
      xhr.send();
    } catch (err) {
      console.error('Error deleting quiz:', err);
      setError(err.message || 'Failed to delete quiz. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-spinner">
          <i className="bi bi-arrow-repeat"></i>
          <span>Loading quizzes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-list-container">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={fetchQuizzes}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-list-container">
      <div className="quiz-header">
        <h2>Quizzes</h2>
        {isInstructor && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowQuizForm(true)}
          >
            Add Quiz
          </button>
        )}
      </div>

      {showQuizForm && (
        <QuizForm
          chapterId={chapterId}
          initialData={editingQuiz}
          onSuccess={handleQuizSuccess}
          onCancel={() => {
            setShowQuizForm(false);
            setEditingQuiz(null);
          }}
        />
      )}

      {quizzes.length === 0 ? (
        <div className="no-quizzes">
          <p>No quizzes available for this chapter.</p>
        </div>
      ) : (
        <div className="quizzes-list">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-header">
                <h3>{quiz.title}</h3>
                {isInstructor && (
                  <div className="quiz-actions">
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleEditQuiz(quiz)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              
              <div className="quiz-content">
                {quiz.questions.map((question, index) => (
                  <div key={index} className="question-item">
                    <div className="question-header">
                      <div className="question-title">
                        <h4>Question {index + 1}</h4>
                        <div className="question-points">
                          <div className="points-badge">
                            <span className="points-label">Points: </span>
                            <span className="points-value">{question.points || 1}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="question-text">{question.questionText}</p>
                    <div className="options-list">
                      {question.options.map((option, optionIndex) => (
                        <div 
                          key={optionIndex} 
                          className={`option-item ${optionIndex === question.correctOptionIndex ? 'correct-option' : ''}`}
                        >
                          <span className="option-number">{optionIndex + 1}.</span>
                          <span className="option-text">{option}</span>
                          {optionIndex === question.correctOptionIndex && (
                            <span className="correct-badge">Correct Answer</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizList; 