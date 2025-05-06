import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import noteService from '../../services/note.service';
import '../../pages/Dashboard.css';

const CourseNotes = ({ course }) => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [lastEdited, setLastEdited] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (course && course.id) {
      // Load notes from the server
      const fetchNotes = async () => {
        try {
          setLoading(true);
          // Use the general course notes endpoint instead of chapter-specific with null
          const response = await noteService.getCourseNotes(course.id);
          
          if (response.data && response.data.length > 0) {
            // Get the first note (general course note)
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
          console.error('Failed to fetch notes:', err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchNotes();
    }
  }, [course]);

  const handleOpenCourse = () => {
    navigate(`/student/course/${course.id}`);
  };

  const handleViewNotes = () => {
    navigate(`/student/notes/${course.id}`);
  };

  return (
    <div className="note-course-item">
      <div className="note-course-header">
        <h3>{course.title}</h3>
        <div className="note-course-meta">
          <span className="note-course-category">{course.category}</span>
          <span className="note-course-type">{course.courseType}</span>
        </div>
        {loading ? (
          <div className="note-last-edited">
            <i className="bi bi-hourglass-split me-2"></i>
            Loading notes...
          </div>
        ) : lastEdited && (
          <div className="note-last-edited">
            <i className="bi bi-clock-history me-2"></i>
            Last edited: {lastEdited.toLocaleDateString()} at {lastEdited.toLocaleTimeString()}
          </div>
        )}
        <div className="note-course-actions">
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={handleOpenCourse}
          >
            <i className="bi bi-book"></i> Open Course
          </button>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={handleViewNotes}
          >
            <i className="bi bi-pencil-square"></i> View/Edit Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseNotes; 