import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import authHeader from '../services/auth-header';
import noteService from '../services/note.service';
import './Dashboard.css';

const StudentNotePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [lastEdited, setLastEdited] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8080/api/courses/${courseId}`, {
          headers: authHeader()
        });
        setCourse(response.data);
        
        // Fetch notes from the server
        await fetchCourseNotes();
        
        setError('');
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

  const fetchCourseNotes = async () => {
    try {
      // Fetch general course notes (not chapter-specific)
      const response = await noteService.getCourseNotes(courseId);
      
      if (response.data && response.data.length > 0) {
        // Get the general course note (without a chapter)
        const generalNote = response.data.find(note => note.chapterIndex === null) || response.data[0];
        setNotes(generalNote.content || '');
        
        if (generalNote.updatedAt) {
          setLastEdited(new Date(generalNote.updatedAt));
        }
      } else {
        setNotes('');
        setLastEdited(null);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/student-dashboard');
  };

  const handleOpenCourse = () => {
    navigate(`/student/course/${courseId}`);
  };

  const handleUpdateNotes = (e) => {
    const updatedNotes = e.target.value;
    setNotes(updatedNotes);
    setSaveStatus('');
  };

  const saveNotes = async () => {
    try {
      setSavingNotes(true);
      setSaveStatus('');
      
      // Save notes to the server - explicitly pass null for the chapterIndex
      const response = await noteService.saveNote(courseId, notes, null);
      
      if (response.data.updatedAt) {
        setLastEdited(new Date(response.data.updatedAt));
      }
      
      setSaveStatus('Notes saved successfully!');
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    } catch (err) {
      console.error('Failed to save notes:', err);
      setSaveStatus('Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  const clearNotes = async () => {
    if (window.confirm('Are you sure you want to clear all notes for this course?')) {
      try {
        setSavingNotes(true);
        
        // Clear notes by saving empty content
        await noteService.saveNote(courseId, '', null);
        
        setNotes('');
        setLastEdited(new Date());
        setSaveStatus('Notes cleared!');
        
        // Clear the save status message after 3 seconds
        setTimeout(() => {
          setSaveStatus('');
        }, 3000);
      } catch (err) {
        console.error('Failed to clear notes:', err);
        setSaveStatus('Failed to clear notes. Please try again.');
      } finally {
        setSavingNotes(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="course-view-container loading">
        <div className="loading-spinner">
          <i className="bi bi-arrow-repeat"></i>
          <p>Loading course details...</p>
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
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary" onClick={handleBackToDashboard}>
              <i className="bi bi-arrow-left me-2"></i>
              Back to Dashboard
            </button>
            <button className="btn btn-outline-secondary" onClick={handleOpenCourse}>
              <i className="bi bi-book me-2"></i>
              Open Course
            </button>
          </div>
          
          <div className="course-quick-details">
            <div className="quick-detail-item">
              <i className="bi bi-tag me-2"></i>
              <span>{course.category}</span>
            </div>
            <div className="quick-detail-item">
              <i className="bi bi-mortarboard me-2"></i>
              <span>{course.courseType === 'STUDENT' ? 'Student Course' : 
                    course.courseType === 'PROFESSIONAL' ? 'Professional Course' : 
                    'Placement Training Course'}</span>
            </div>
          </div>
        </div>
        
        <h1>
          <i className="bi bi-journal-text me-3"></i>
          Notes for: {course.title}
        </h1>
        <p className="instructor-info">
          <i className="bi bi-person-circle me-2"></i>
          Instructor: {course.instructorName}
        </p>
        
        {lastEdited && (
          <div className="note-last-edited mb-2">
            <i className="bi bi-clock-history me-2"></i>
            Last edited: {lastEdited.toLocaleDateString()} at {lastEdited.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="notes-full-editor-container">
        <div className="notes-editor-header">
          <h3><i className="bi bi-pencil me-2"></i>Your Notes</h3>
          {saveStatus && (
            <div className="alert alert-success" role="alert">
              <i className="bi bi-check-circle me-2"></i>
              {saveStatus}
            </div>
          )}
        </div>
        
        <textarea
          className="notes-full-editor"
          value={notes}
          onChange={handleUpdateNotes}
          placeholder="Start typing your notes for this course here..."
        ></textarea>
        
        <div className="notes-actions mt-3">
          <div className="notes-info">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Notes are saved on the server and accessible from any device
            </small>
          </div>
          <div className="d-flex gap-3">
            <button 
              className="btn btn-outline-danger" 
              onClick={clearNotes}
              disabled={savingNotes}
            >
              <i className="bi bi-trash me-2"></i>
              Clear Notes
            </button>
            <button 
              className="btn btn-primary" 
              onClick={saveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2"></i>
                  Save Notes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentNotePage; 