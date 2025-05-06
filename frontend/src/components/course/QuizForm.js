import React, { useState, useEffect } from 'react';
import './CourseStyles.css';

const QuizForm = ({ chapterId, initialData, onSuccess, onCancel }) => {
  const [quizData, setQuizData] = useState({
    title: '',
    questions: [{
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      points: 1
    }]
  });

  useEffect(() => {
    if (initialData) {
      setQuizData({
        title: initialData.title,
        questions: initialData.questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          points: q.points || 1
        }))
      });
    }
  }, [initialData]);

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...quizData.questions];
    const question = { ...updatedQuestions[index] };

    switch (field) {
      case 'questionText':
        question.questionText = value;
        break;
      case 'points':
        const pointValue = parseInt(value);
        if (!isNaN(pointValue) && pointValue > 0) {
          question.points = pointValue;
        }
        break;
      case 'correctOptionIndex':
        question.correctOptionIndex = parseInt(value);
        break;
      default:
        if (field.startsWith('option')) {
          const optionIndex = parseInt(field.replace('option', '')) - 1;
          const newOptions = [...question.options];
          newOptions[optionIndex] = value;
          question.options = newOptions;
        }
        break;
    }

    updatedQuestions[index] = question;
    setQuizData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const addQuestion = () => {
    setQuizData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: null, // New questions will have null ID
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          points: 1
        }
      ]
    }));
  };

  const removeQuestion = (index) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!chapterId || chapterId === 0) {
        alert('Invalid chapter ID. Please save the chapter first.');
        return;
      }

      if (!quizData.title.trim()) {
        alert('Please enter a quiz title');
        return;
      }

      if (quizData.questions.length === 0) {
        alert('Please add at least one question');
        return;
      }

      // Validate each question
      for (const question of quizData.questions) {
        if (!question.questionText.trim()) {
          alert('Please enter text for all questions');
          return;
        }
        if (question.options.some(option => !option.trim())) {
          alert('Please fill in all options for each question');
          return;
        }
        if (!question.points || question.points < 1) {
          alert('Please ensure all questions have valid points (minimum 1)');
          return;
        }
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to save the quiz');
        return;
      }

      const quizPayload = {
        title: quizData.title,
        questions: quizData.questions.map(q => ({
          id: q.id, // Include the question ID if it exists
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          points: q.points
        }))
      };

      console.log('Sending quiz data:', JSON.stringify(quizPayload, null, 2));

      const url = initialData 
        ? `http://localhost:8080/api/quizzes/${initialData.id}`
        : `http://localhost:8080/api/quizzes/chapter/${chapterId}`;

      console.log('Making request to:', url);

      const response = await fetch(url, {
        method: initialData ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(quizPayload)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.message || `Failed to save quiz: ${response.status} ${response.statusText}`);
      }

      const savedQuiz = await response.json();
      console.log('Quiz saved successfully:', savedQuiz);
      
      // Update the quiz data with the saved quiz to include new question IDs
      if (initialData) {
        setQuizData({
          title: savedQuiz.title,
          questions: savedQuiz.questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            points: q.points || 1
          }))
        });
      }
      
      alert(initialData ? 'Quiz updated successfully!' : 'Quiz saved successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert(error.message || 'Failed to save quiz. Please try again.');
    }
  };

  return (
    <div className="quiz-form-container">
      <div className="form-header">
        <h3>
          <i className="bi bi-question-circle me-2"></i>
          {initialData ? 'Edit Quiz' : 'Create Quiz'}
        </h3>
        <button 
          type="button" 
          className="btn btn-outline-secondary"
          onClick={onCancel}
        >
          <i className="bi bi-x-circle me-1"></i>
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="quizTitle">Quiz Title</label>
          <input
            type="text"
            className="form-control"
            id="quizTitle"
            value={quizData.title}
            onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter quiz title"
            required
          />
        </div>

        {quizData.questions.map((question, questionIndex) => (
          <div key={questionIndex} className="question-container">
            <div className="form-group">
              <label htmlFor={`question-${questionIndex}`}>Question {questionIndex + 1}</label>
              <input
                type="text"
                className="form-control"
                id={`question-${questionIndex}`}
                value={question.questionText}
                onChange={(e) => handleQuestionChange(questionIndex, 'questionText', e.target.value)}
                placeholder="Enter question text"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor={`points-${questionIndex}`}>Points</label>
              <input
                type="number"
                className="form-control"
                id={`points-${questionIndex}`}
                value={question.points}
                onChange={(e) => handleQuestionChange(questionIndex, 'points', e.target.value)}
                min="1"
                step="1"
                required
              />
            </div>

            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="form-group">
                <div className="input-group">
                  <div className="input-group-prepend">
                    <div className="input-group-text">
                      <input
                        type="radio"
                        name={`correct-${questionIndex}`}
                        checked={question.correctOptionIndex === optionIndex}
                        onChange={() => handleQuestionChange(questionIndex, 'correctOptionIndex', optionIndex)}
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    value={option}
                    onChange={(e) => handleQuestionChange(questionIndex, `option${optionIndex + 1}`, e.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                    required
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-danger btn-sm mb-3"
              onClick={() => removeQuestion(questionIndex)}
            >
              <i className="bi bi-trash me-1"></i>
              Remove Question
            </button>
          </div>
        ))}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary me-2"
            onClick={addQuestion}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Add Question
          </button>
          <button type="submit" className="btn btn-primary">
            <i className="bi bi-save me-1"></i>
            {initialData ? 'Update Quiz' : 'Save Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizForm; 