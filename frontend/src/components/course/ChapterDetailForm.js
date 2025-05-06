import React, { useState, useEffect } from 'react';
import './CourseStyles.css';
import QuizList from './QuizList';
import QuizView from './QuizView';
import { useAuth } from '../../context/AuthContext';

const ChapterDetailForm = ({ chapterName, initialData, onSubmit, onCancel }) => {
  const { isInstructor } = useAuth();
  const [formData, setFormData] = useState({
    chapterIndex: initialData?.chapterIndex || '',
    title: initialData?.title || chapterName || '',
    content: initialData?.content || '',
    objectives: initialData?.objectives || '',
    resources: initialData?.resources || '',
    videoUrl: initialData?.videoUrl || ''
  });
  
  useEffect(() => {
    console.log('ChapterDetailForm - initialData:', initialData);
    if (initialData) {
      setFormData({
        chapterIndex: initialData.chapterIndex || '',
        title: initialData.title || chapterName || '',
        content: initialData.content || '',
        objectives: initialData.objectives || '',
        resources: initialData.resources || '',
        videoUrl: initialData.videoUrl || ''
      });
    }
    console.log('ChapterDetailForm - formData after update:', formData);
  }, [initialData, chapterName]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting chapter detail form with data:', JSON.stringify(formData, null, 2));
    
    // Make sure videoUrl is included in the submission
    const dataToSubmit = {
      ...formData,
      videoUrl: formData.videoUrl || ''
    };
    
    console.log('Data being submitted:', JSON.stringify(dataToSubmit, null, 2));
    onSubmit(dataToSubmit);
  };

  const handleQuizComplete = (score) => {
    console.log('Quiz completed with score:', score);
    // You can add additional logic here, like updating the user's progress
  };
  
  return (
    <div className="chapter-detail-form-container">
      <div className="form-header">
        <h3>
          <i className="bi bi-book me-2"></i>
          Chapter Details: {chapterName}
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
          <label htmlFor="content">Chapter Content</label>
          <textarea
            className="form-control"
            id="content"
            name="content"
            rows="8"
            value={formData.content}
            onChange={handleChange}
            placeholder="Enter the main content for this chapter. You can use HTML tags for formatting."
          />
          <small className="form-text text-muted">
            You can use basic HTML tags for formatting: &lt;h1&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, etc.
          </small>
        </div>
        
        <div className="form-group">
          <label htmlFor="objectives">Learning Objectives</label>
          <textarea
            className="form-control"
            id="objectives"
            name="objectives"
            rows="4"
            value={formData.objectives}
            onChange={handleChange}
            placeholder="List the learning objectives for this chapter. What should students learn?"
          />
          <small className="form-text text-muted">
            Consider using bullet points with &lt;ul&gt; and &lt;li&gt; tags to list objectives.
          </small>
        </div>
        
        <div className="form-group">
          <label htmlFor="videoUrl">Video URL (Google Drive)</label>
          <input
            type="url"
            className="form-control"
            id="videoUrl"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            placeholder="https://drive.google.com/file/d/..."
          />
          <small className="form-text text-muted">
            Enter a Google Drive video link. Make sure the video is set to "Anyone with the link can view".
          </small>
        </div>
        
        <div className="form-group">
          <label htmlFor="resources">Additional Resources</label>
          <textarea
            className="form-control"
            id="resources"
            name="resources"
            rows="4"
            value={formData.resources}
            onChange={handleChange}
            placeholder="List additional resources like links, books, or references for this chapter."
          />
          <small className="form-text text-muted">
            Include links using &lt;a href="url"&gt;link text&lt;/a&gt; tags.
          </small>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary me-2">
            <i className="bi bi-save me-1"></i>
            Save Chapter Details
          </button>
        </div>
      </form>

      {initialData?.id && (
        <div className="quiz-section mt-4">
          <h4>
            <i className="bi bi-question-circle me-2"></i>
            Chapter Quiz
          </h4>
          {isInstructor ? (
            <QuizList 
              chapterId={initialData.id} 
              isInstructor={true}
            />
          ) : (
            <QuizView 
              chapterId={initialData.id}
              onComplete={handleQuizComplete}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChapterDetailForm;