import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './CourseList.css';
import CourseDetails from './CourseDetails';
import { useToast } from '../../context/ToastContext';
import PaymentConfirmationModal from '../common/PaymentConfirmationModal';

const CourseList = ({ courses, onEnroll, showEnrollButton = false, isEnrolledView = false, enrolledCourseIds: externalEnrolledCourseIds, isInstructorCourse = null }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(externalEnrolledCourseIds || []);
  const { addToast } = useToast();

  useEffect(() => {
    // If courses prop is provided, use it and set loading to false
    if (courses && courses.length > 0) {
      setAvailableCourses(courses);
      // Extract unique categories
      const uniqueCategories = [...new Set(courses.map(course => course.category))];
      setCategories(uniqueCategories);
      setLoading(false);
    } else {
      // Only fetch courses if none were provided via props
      fetchCourses();
    }

    // If external enrolled course IDs are provided, use them
    if (externalEnrolledCourseIds) {
      setEnrolledCourseIds(externalEnrolledCourseIds);
    } 
    // Otherwise, if not in enrolled view and showing enroll button, fetch enrolled courses
    else if (!isEnrolledView && showEnrollButton) {
      fetchEnrolledCourseIds();
    }
  }, [courses, isEnrolledView, showEnrollButton, externalEnrolledCourseIds]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      // Filter only approved courses
      const approvedCourses = response.data.filter(course => course.status === 'APPROVED');
      setAvailableCourses(approvedCourses);
      
      // Extract unique categories from approved courses
      const uniqueCategories = [...new Set(approvedCourses.map(course => course.category))];
      setCategories(uniqueCategories);
      
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch courses');
      setLoading(false);
    }
  };

  const fetchEnrolledCourseIds = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/student/enrolled-courses',
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      // Extract course IDs from enrolled courses
      const courseIds = response.data.map(course => course.id);
      setEnrolledCourseIds(courseIds);
    } catch (err) {
      console.error('Failed to fetch enrolled courses:', err);
    }
  };

  const handleViewCourse = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleCloseModal = () => {
    setSelectedCourseId(null);
  };

  const handleUnenroll = async (courseId) => {
    try {
      await axios.delete(
        `http://localhost:8080/api/student/unenroll/${courseId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      
      // If in enrolled view, remove the course from display
      if (isEnrolledView) {
        setAvailableCourses(prev => prev.filter(course => course.id !== courseId));
      } else {
        // Otherwise, just update the enrolled course IDs
        setEnrolledCourseIds(prev => prev.filter(id => id !== courseId));
      }
      
      // Show success toast notification
      addToast("Successfully unenrolled from the course", "success");
    } catch (err) {
      console.error('Failed to unenroll:', err);
      addToast("Failed to unenroll: " + (err.response?.data?.message || "Unknown error"), "error");
    }
  };

  // Filter only approved courses
  const coursesToDisplay = courses || availableCourses;
  const filteredCourses = coursesToDisplay.filter(course => course.status === 'APPROVED');

  // Check if a course is enrolled
  const isEnrolled = (courseId) => {
    // First check if course has its own isEnrolled property
    const course = filteredCourses.find(c => c.id === courseId);
    if (course && course.isEnrolled !== undefined) {
      return course.isEnrolled;
    }
    // Otherwise use the enrolledCourseIds array
    return enrolledCourseIds.includes(courseId);
  };

  if (loading) {
    return <div className="loading-spinner">Loading courses...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!filteredCourses || filteredCourses.length === 0) {
    return (
      <div className="courses-empty">
        <h3>No courses available</h3>
        <p>There are currently no courses available to display.</p>
      </div>
    );
  }

  return (
    <div className="course-list-container">
      <div className="courses-grid">
        {filteredCourses.map(course => (
          <div className={`course-card ${course.status === 'PENDING' ? 'pending' : ''}`} key={course.id}>
            {isInstructorCourse && typeof isInstructorCourse === 'function' && isInstructorCourse(course.id) && (
              <div className="course-badge">
                <i className="bi bi-check-circle-fill me-1"></i>
                Your Course
              </div>
            )}
            <div className="course-image">
              {course.imageUrl ? (
                <img src={course.imageUrl} alt={course.title} />
              ) : (
                <div className="default-course-image">
                  <span>{course.title.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="course-details">
              <h3>{course.title}</h3>
              <div className="course-meta">
                <div className="course-category">{course.category}</div>
                {course.instructorName && (
                  <div className="course-instructor">
                    <i className="bi bi-person-circle me-1"></i>
                    {course.instructorName}
                  </div>
                )}
              </div>
              {!isEnrolledView && (
                <div className="course-price">
                  <i className="bi bi-currency-rupee"></i>
                  {course.price || 0}
                </div>
              )}
              <p className="course-description">
                {course.description.length > 100
                  ? `${course.description.substring(0, 100)}...`
                  : course.description}
              </p>
              <div className="course-actions">
                {isEnrolledView ? (
                  <>
                    <button 
                      onClick={() => handleViewCourse(course.id)} 
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-eye me-1"></i>
                      Details
                    </button>
                    <Link to={`/student/course/${course.id}`} className="btn btn-success btn-sm">
                      <i className="bi bi-book me-1"></i>
                      Continue
                    </Link>
                    <button
                      onClick={() => handleUnenroll(course.id)}
                      className="btn btn-outline-danger btn-sm"
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Unenroll
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleViewCourse(course.id)} 
                      className="btn btn-primary btn-sm"
                    >
                      <i className="bi bi-eye me-1"></i>
                      View Course
                    </button>
                    {showEnrollButton && !isEnrolled(course.id) && (
                      <button
                        onClick={() => onEnroll(course)}
                        className="btn btn-success btn-sm"
                      >
                        <i className="bi bi-check-circle me-1"></i>
                        Enroll Now
                      </button>
                    )}
                    {showEnrollButton && isEnrolled(course.id) && (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled
                      >
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Enrolled
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedCourseId && (
        <CourseDetails 
          courseId={selectedCourseId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

// Create a wrapped version of CourseList that handles the onEnroll function
// and shows Toast notifications
export const CourseListWithEnrollment = ({ courses, showEnrollButton = true, isInstructorCourse = null }) => {
  const { addToast } = useToast();
  const [localEnrolledCourseIds, setLocalEnrolledCourseIds] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Helper function to generate price based on course ID
  const generatePriceFromId = (courseId) => {
    // Use the last digit of the course ID as the multiplier
    // If courseId is a string, convert it to a number first
    const idNumber = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
    const multiplier = (idNumber % 10) || 1; // Use 1 if the last digit is 0
    return multiplier * 1000;
  };

  // Add prices to courses based on their IDs
  const coursesWithPrices = courses.map(course => ({
    ...course,
    price: course.price || generatePriceFromId(course.id)
  }));
  
  // Fetch enrolled course IDs on component mount
  useEffect(() => {
    const fetchEnrolledCourseIds = async () => {
      try {
        const response = await axios.get(
          'http://localhost:8080/api/student/enrolled-courses',
          { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
        );
        // Extract course IDs from enrolled courses
        const courseIds = response.data.map(course => course.id);
        setLocalEnrolledCourseIds(courseIds);
      } catch (err) {
        console.error('Failed to fetch enrolled courses:', err);
      }
    };
    
    fetchEnrolledCourseIds();
  }, []);
  
  const handleEnroll = (course) => {
    setSelectedCourse(course);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    try {
      await axios.post(
        'http://localhost:8080/api/student/enroll',
        { courseId: selectedCourse.id },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      
      // Update local state instead of reloading the page
      setLocalEnrolledCourseIds(prev => [...prev, selectedCourse.id]);
      
      // Show success toast notification
      addToast("Payment successful! You are now enrolled in the course", "success");
      
      // Close the payment modal
      setShowPaymentModal(false);
      setSelectedCourse(null);
    } catch (err) {
      console.error('Failed to enroll:', err);
      addToast("Failed to enroll: " + (err.response?.data?.message || "Unknown error"), "error");
    }
  };
  
  // Create a modified course list with updated enrollment status
  const modifiedCourses = coursesWithPrices.map(course => ({
    ...course,
    isEnrolled: localEnrolledCourseIds.includes(course.id)
  }));
  
  return (
    <>
      <CourseList 
        courses={modifiedCourses} 
        onEnroll={handleEnroll} 
        showEnrollButton={showEnrollButton} 
        enrolledCourseIds={localEnrolledCourseIds}
        isInstructorCourse={isInstructorCourse}
      />
      
      {selectedCourse && (
        <PaymentConfirmationModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCourse(null);
          }}
          onConfirm={handlePaymentConfirm}
          courseTitle={selectedCourse.title}
          coursePrice={selectedCourse.price}
        />
      )}
    </>
  );
};

export default CourseList; 