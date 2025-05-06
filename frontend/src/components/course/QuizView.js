import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CourseStyles.css';

const QuizView = ({ chapterId, onComplete }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (chapterId) {
      fetchQuiz();
    } else {
      setError('No chapter ID provided');
      setLoading(false);
    }
  }, [chapterId]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`http://localhost:8080/api/quizzes/chapter/${chapterId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.length > 0) {
        const quizData = response.data[0];
        setQuiz(quizData);
        // Initialize answers with empty values
        const initialAnswers = {};
        quizData.questions.forEach((_, index) => {
          initialAnswers[index] = '';
        });
        setAnswers(initialAnswers);
      }
    } catch (err) {
      setError('Failed to load quiz. Please try again later.');
      console.error('Error fetching quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleSubmit = () => {
    let totalScore = 0;
    let totalPoints = 0;

    // Calculate total points and earned points
    quiz.questions.forEach((question, index) => {
      const questionPoints = question.points || 1;
      totalPoints += questionPoints;
      if (answers[index] === question.correctOptionIndex) {
        totalScore += questionPoints;
      }
    });

    // Calculate percentage
    const percentage = Math.round((totalScore / totalPoints) * 100);
    
    // Update local state
    setScore(totalScore);
    setSubmitted(true);
    
    // Call onComplete with detailed score information
    if (onComplete) {
      onComplete({
        earned: totalScore,
        total: totalPoints,
        percentage: percentage,
        answers: answers,
        questions: quiz.questions
      });
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <i className="fas fa-spinner"></i>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i>
        <p>{error}</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="error-message">
        <i className="fas fa-exclamation-circle"></i>
        <p>No quiz found for this chapter.</p>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h3>{quiz.title}</h3>
        {submitted && (
          <div className="score-badge">
            Score: {score}/{quiz.questions.reduce((total, q) => total + (q.points || 1), 0)}
          </div>
        )}
      </div>

      {quiz.questions.map((question, questionIndex) => (
        <div key={questionIndex} className="question-card">
          <div className="question-header">
            <h3>Question {questionIndex + 1}</h3>
            <span className="points-badge">{question.points || 1} point{question.points !== 1 ? 's' : ''}</span>
          </div>
          
          <p className="question-text">{question.questionText}</p>
          
          <div className="options-container">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="option-item">
                <input
                  type="radio"
                  id={`question-${questionIndex}-option-${optionIndex}`}
                  name={`question-${questionIndex}`}
                  value={optionIndex}
                  checked={answers[questionIndex] === optionIndex}
                  onChange={(e) => handleAnswerChange(questionIndex, parseInt(e.target.value))}
                  disabled={submitted}
                  className="option-radio"
                />
                <label
                  htmlFor={`question-${questionIndex}-option-${optionIndex}`}
                  className={`option-label ${
                    submitted
                      ? optionIndex === question.correctOptionIndex
                        ? 'correct'
                        : answers[questionIndex] === optionIndex
                        ? 'incorrect'
                        : ''
                      : ''
                  }`}
                >
                  {option}
                </label>
              </div>
            ))}
          </div>

          {submitted && (
            <div className={`feedback ${
              answers[questionIndex] === question.correctOptionIndex
                ? 'correct-feedback'
                : 'incorrect-feedback'
            }`}>
              {answers[questionIndex] === question.correctOptionIndex ? (
                <p>Correct! Well done!</p>
              ) : (
                <p>
                  Incorrect. The correct answer is: {question.options[question.correctOptionIndex]}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="quiz-actions">
        {!submitted ? (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== quiz.questions.length}
          >
            Submit Quiz
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizView; 