import React, { useState } from 'react';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import ChapterDetailForm from './ChapterDetailForm';
import './CourseStyles.css';

const CreateCourse = ({ onSuccess }) => {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    pdfUrl: '',
    chapters: [''],
    chapterDetails: [],
    category: '',
    courseType: 'STUDENT' // Default course type
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [activeChapterIndex, setActiveChapterIndex] = useState(null);
  const [showChapterDetailForm, setShowChapterDetailForm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update image preview when imageUrl changes
    if (name === 'imageUrl' && value) {
      setImagePreview(value);
    }
    
    setCourseData({
      ...courseData,
      [name]: value
    });
  };

  const handleChapterChange = (index, value) => {
    const updatedChapters = [...courseData.chapters];
    updatedChapters[index] = value;
    setCourseData({
      ...courseData,
      chapters: updatedChapters
    });
  };

  const addChapter = () => {
    setCourseData({
      ...courseData,
      chapters: [...courseData.chapters, '']
    });
  };

  const removeChapter = (index) => {
    const updatedChapters = [...courseData.chapters];
    updatedChapters.splice(index, 1);
    
    // Also remove chapter details if they exist
    const updatedChapterDetails = courseData.chapterDetails.filter(
      detail => detail.chapterIndex !== index
    );
    
    // Adjust chapterIndex for details of chapters that come after the removed chapter
    const adjustedChapterDetails = updatedChapterDetails.map(detail => {
      if (detail.chapterIndex > index) {
        return { ...detail, chapterIndex: detail.chapterIndex - 1 };
      }
      return detail;
    });
    
    setCourseData({
      ...courseData,
      chapters: updatedChapters.length ? updatedChapters : [''],  // Always keep at least one chapter field
      chapterDetails: adjustedChapterDetails
    });
  };
  
  const handleAddChapterDetail = (index) => {
    setActiveChapterIndex(index);
    setShowChapterDetailForm(true);
  };
  
  const handleChapterDetailSubmit = (detailData) => {
    // Check if there's already a detail for this chapter
    const existingDetailIndex = courseData.chapterDetails.findIndex(
      detail => detail.chapterIndex === activeChapterIndex
    );
    
    let updatedChapterDetails;
    
    if (existingDetailIndex !== -1) {
      // Update existing chapter detail
      updatedChapterDetails = [...courseData.chapterDetails];
      updatedChapterDetails[existingDetailIndex] = {
        ...detailData,
        chapterIndex: activeChapterIndex
      };
    } else {
      // Add new chapter detail
      updatedChapterDetails = [
        ...courseData.chapterDetails,
        { ...detailData, chapterIndex: activeChapterIndex }
      ];
    }
    
    setCourseData({
      ...courseData,
      chapterDetails: updatedChapterDetails
    });
    
    setShowChapterDetailForm(false);
    setActiveChapterIndex(null);
  };
  
  const handleCancelChapterDetail = () => {
    setShowChapterDetailForm(false);
    setActiveChapterIndex(null);
  };
  
  const hasChapterDetail = (index) => {
    return courseData.chapterDetails.some(detail => detail.chapterIndex === index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Filter out empty chapters
    const filteredChapters = courseData.chapters.filter(chapter => chapter.trim() !== '');
    
    // Adjust chapter detail indices to match the filtered chapters
    const chapterMap = {};
    filteredChapters.forEach((chapter, newIndex) => {
      const oldIndex = courseData.chapters.findIndex(ch => ch === chapter);
      chapterMap[oldIndex] = newIndex;
    });
    
    const adjustedChapterDetails = courseData.chapterDetails
      .filter(detail => courseData.chapters[detail.chapterIndex].trim() !== '')
      .map(detail => ({
        ...detail,
        chapterIndex: chapterMap[detail.chapterIndex],
        title: courseData.chapters[detail.chapterIndex] // Use chapter name as title
      }));
    
    try {
      const response = await axios.post(
        'http://localhost:8080/api/instructor/courses',
        {
          ...courseData,
          chapters: filteredChapters,
          chapterDetails: adjustedChapterDetails
        },
        { headers: authHeader() }
      );
      
      setSuccess(true);
      setCourseData({
        title: '',
        description: '',
        imageUrl: '',
        pdfUrl: '',
        chapters: [''],
        chapterDetails: [],
        category: '',
        courseType: 'STUDENT'
      });
      setImagePreview('');
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-course-container">
      {/* <h2>Create New Course</h2> */}
      
      {success && (
        <div className="alert alert-success">
          Course created successfully!
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          {error}
        </div>
      )}
      
      {showChapterDetailForm ? (
        <ChapterDetailForm 
          chapterName={courseData.chapters[activeChapterIndex]} 
          initialData={courseData.chapterDetails.find(detail => detail.chapterIndex === activeChapterIndex)} 
          onSubmit={handleChapterDetailSubmit}
          onCancel={handleCancelChapterDetail}
        />
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Course Title</label>
            <input
              type="text"
              className="form-control"
              id="title"
              name="title"
              value={courseData.title}
              onChange={handleChange}
              placeholder="Enter a descriptive title"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              rows="4"
              value={courseData.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of your course"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              className="form-control"
              id="category"
              name="category"
              value={courseData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="Programming">Programming</option>
              <option value="Data Science">Data Science</option>
              <option value="Web Development">Web Development</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="courseType">Course Type</label>
            <select
              className="form-control"
              id="courseType"
              name="courseType"
              value={courseData.courseType}
              onChange={handleChange}
              required
            >
              <option value="STUDENT">Student</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="PLACEMENT_TRAINING">Placement Training</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="imageUrl">Course Image URL</label>
            <input
              type="text"
              className="form-control"
              id="imageUrl"
              name="imageUrl"
              value={courseData.imageUrl}
              onChange={handleChange}
              placeholder="Enter URL for course thumbnail image"
            />
            
            {/* Image preview */}
            {imagePreview && (
              <div className="image-preview mt-3">
                <label>Image Preview:</label>
                <img 
                  src={imagePreview} 
                  alt="Course preview" 
                  style={{ maxWidth: '100%', maxHeight: '200px', display: 'block', marginTop: '10px', border: '1px solid #ddd', borderRadius: '6px', padding: '5px' }} 
                />
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="pdfUrl">Course PDF URL (Optional)</label>
            <input
              type="text"
              className="form-control"
              id="pdfUrl"
              name="pdfUrl"
              value={courseData.pdfUrl}
              onChange={handleChange}
              placeholder="Link to supplementary PDF materials"
            />
          </div>
          
          <div className="form-group">
            <label>Chapters</label>
            {courseData.chapters.map((chapter, index) => (
              <div key={index} className="chapter-input-container">
                <div className="chapter-input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Chapter ${index + 1}`}
                    value={chapter}
                    onChange={(e) => handleChapterChange(index, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeChapter(index)}
                    disabled={courseData.chapters.length === 1}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete
                  </button>
                </div>
                
                <div className="chapter-detail-button-container">
                  <button
                    type="button"
                    className={`btn ${hasChapterDetail(index) ? 'btn-success' : 'btn-outline-primary'}`}
                    onClick={() => handleAddChapterDetail(index)}
                  >
                    <i className={`bi ${hasChapterDetail(index) ? 'bi-pencil-square' : 'bi-plus-circle'} me-1`}></i>
                    {hasChapterDetail(index) ? 'Edit Chapter Details' : 'Add Chapter Details'}
                  </button>
                  {hasChapterDetail(index) && (
                    <span className="chapter-detail-badge">
                      <i className="bi bi-check-circle-fill me-1"></i>
                      Details Added
                    </span>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn-add-chapter"
              onClick={addChapter}
            >
              <i className="bi bi-plus-circle"></i>
              Add Another Chapter
            </button>
          </div>
          
          <div className="form-group d-flex justify-content-end mt-4">
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="bi bi-hourglass-split me-2"></i>
                  Creating Course...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Course
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateCourse; 