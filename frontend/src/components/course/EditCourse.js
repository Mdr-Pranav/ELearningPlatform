import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import ChapterDetailForm from './ChapterDetailForm';
import '../../pages/Dashboard.css';
import { useNavigate } from 'react-router-dom';

const EditCourse = ({ course, onSuccess, onCancel }) => {
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
  const navigate = useNavigate();

  // Load course data when component mounts or course changes
  useEffect(() => {
    const loadCourseData = async () => {
      if (course) {
        try {
          // First set the basic course data
          setCourseData({
            title: course.title || '',
            description: course.description || '',
            imageUrl: course.imageUrl || '',
            pdfUrl: course.pdfUrl || '',
            chapters: course.chapters && course.chapters.length > 0 ? [...course.chapters] : [''],
            chapterDetails: [],
            category: course.category || '',
            courseType: course.courseType || 'STUDENT'
          });
          
          if (course.imageUrl) {
            setImagePreview(course.imageUrl);
          }

          // Then fetch chapter details
          const chapterDetailsResponse = await axios.get(
            `http://localhost:8080/api/instructor/courses/${course.id}/chapters`,
            { headers: authHeader() }
          );

          // Update course data with chapter details
          setCourseData(prevData => ({
            ...prevData,
            chapterDetails: chapterDetailsResponse.data || []
          }));
        } catch (err) {
          console.error('Error loading course data:', err);
          setError('Failed to load course details. Please try again.');
        }
      }
    };

    loadCourseData();
  }, [course]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update image preview when imageUrl changes
    if (name === 'imageUrl' && value) {
      setImagePreview(value);
    }
    
    setCourseData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleChapterChange = (index, value) => {
    const updatedChapters = [...courseData.chapters];
    updatedChapters[index] = value;
    
    // Update chapter details if they exist
    const updatedChapterDetails = courseData.chapterDetails.map(detail => {
      if (detail.chapterIndex === index) {
        return { ...detail, title: value };
      }
      return detail;
    });
    
    setCourseData({
      ...courseData,
      chapters: updatedChapters,
      chapterDetails: updatedChapterDetails
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
      chapters: updatedChapters.length ? updatedChapters : [''],
      chapterDetails: adjustedChapterDetails
    });
  };

  const handleAddChapterDetail = (index) => {
    setActiveChapterIndex(index);
    setShowChapterDetailForm(true);
  };

  const handleChapterDetailSubmit = (detailData) => {
    console.log('handleChapterDetailSubmit called with data:', JSON.stringify(detailData, null, 2));
    
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
        chapterIndex: activeChapterIndex,
        videoUrl: detailData.videoUrl || '' // Ensure videoUrl is included
      };
    } else {
      // Add new chapter detail
      updatedChapterDetails = [
        ...courseData.chapterDetails,
        { 
          ...detailData, 
          chapterIndex: activeChapterIndex,
          videoUrl: detailData.videoUrl || '' // Ensure videoUrl is included
        }
      ];
    }
    
    console.log('Updated chapter details:', JSON.stringify(updatedChapterDetails, null, 2));
    
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
    console.log('Starting course update process...');

    try {
    setLoading(true);
        setError(null);

        // Get auth headers and verify token
        const headers = authHeader();
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('Current user:', user);
        console.log('Using auth headers:', headers);

        if (!headers.Authorization) {
            setError('You are not authorized. Please log in again.');
      return;
    }
    
        // Update chapter details if they exist
        if (courseData.chapterDetails && courseData.chapterDetails.length > 0) {
            console.log('Updating chapter details:', JSON.stringify(courseData.chapterDetails, null, 2));
            
            // Process each chapter detail
            for (const detail of courseData.chapterDetails) {
                try {
                    const chapterData = {
                        chapterIndex: detail.chapterIndex,
                        title: detail.title || courseData.chapters[detail.chapterIndex],
                        content: detail.content,
                        objectives: detail.objectives,
                        resources: detail.resources,
                        videoUrl: detail.videoUrl
                    };
                    
                    console.log('Sending chapter detail update for chapter', detail.chapterIndex, ':', JSON.stringify(chapterData, null, 2));

                    // Use POST for both creating and updating chapter details
                    console.log('Sending POST request for chapter detail');
      const response = await axios.post(
            `http://localhost:8080/api/instructor/courses/${course.id}/chapters`,
                        chapterData,
                        { 
                            headers: {
                                'Authorization': headers.Authorization,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    console.log('Chapter detail update successful:', JSON.stringify(response.data, null, 2));
                } catch (detailError) {
                    console.error(`Error updating chapter detail ${detail.chapterIndex}:`, detailError);
                    console.error('Error response:', detailError.response?.data);
                    throw detailError;
                }
            }
        }

        // Format the course data
        const courseDataToSend = {
            title: courseData.title.trim(),
            description: courseData.description.trim(),
            imageUrl: courseData.imageUrl || null,
            pdfUrl: courseData.pdfUrl || null,
            chapters: courseData.chapters.filter(chapter => chapter.trim() !== ''),
            category: courseData.category.trim(),
            courseType: courseData.courseType
        };

        console.log('Sending course update request with data:', courseDataToSend);

        // Update the course
        const response = await axios.put(
            `http://localhost:8080/api/instructor/courses/${course.id}`,
            courseDataToSend,
            {
                headers: {
                    'Authorization': headers.Authorization,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Course update response:', response.data);
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(response.data);
      }

        await new Promise(resolve => setTimeout(resolve, 1500));

        if (onCancel) {
            onCancel();
        }
    } catch (error) {
        console.error('Error updating course:', error);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data || 
                           'Failed to update course. Please check your authorization and try again.';
        setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-course-container">
      {success && (
        <div className="alert alert-success">
          Course updated successfully!
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
              required
            />
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
            />
            {imagePreview && (
              <div className="mt-2">
                <img 
                  src={imagePreview} 
                  alt="Course preview" 
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="pdfUrl">Course PDF URL</label>
            <input
              type="text"
              className="form-control"
              id="pdfUrl"
              name="pdfUrl"
              value={courseData.pdfUrl}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              type="text"
              className="form-control"
              id="category"
              name="category"
              value={courseData.category}
              onChange={handleChange}
              required
            />
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
              <option value="STUDENT">Student Course</option>
              <option value="PROFESSIONAL">Professional Course</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Chapters</label>
            {courseData.chapters.map((chapter, index) => (
              <div key={index} className="chapter-container">
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
              <i className="bi bi-plus-circle me-2"></i>
              Add Another Chapter
            </button>
          </div>
          
          <div className="form-group d-flex justify-content-between mt-4">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
            >
              <i className="bi bi-x-circle me-2"></i>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="bi bi-hourglass-split me-2"></i>
                  Updating Course...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  Update Course
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditCourse; 