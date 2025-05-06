import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authHeader from '../services/auth-header';
import CreateCourse from '../components/course/CreateCourse';
import EditCourse from '../components/course/EditCourse';
import CourseList from '../components/course/CourseList';
import EnrolledStudents from '../components/course/EnrolledStudents';
import CourseDetails from '../components/course/CourseDetails';
import PendingReviewCourses from '../components/instructor/PendingReviewCourses';
import MentoringSessions from '../components/instructor/MentoringSessions';
import './Dashboard.css';
import { Link } from 'react-router-dom';

const InstructorDashboard = () => {
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('courses');
  const [activeTab, setActiveTab] = useState('myCourses'); // Tab within courses section
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseToEdit, setCourseToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [rejectedCourses, setRejectedCourses] = useState([]);
  const [courseToView, setCourseToView] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState('');

  const fetchMyCourses = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/instructor/courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setMyCourses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching my courses:', error);
      setError('Failed to fetch your courses');
      setLoading(false);
    }
  };

  const fetchAllCourses = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/instructor/all-courses',
        { headers: authHeader() }
      );
      setAllCourses(response.data);
      
      // Extract unique categories from all courses
      const uniqueCategories = [...new Set(response.data.map(course => course.category))];
      setCategories(uniqueCategories);
      
      setError('');
    } catch (err) {
      setError('Failed to load all courses. Please try again later.');
      console.error(err);
      
      // Fallback: If we can't get all courses, at least use the instructor's courses
      // for the categories and display
      if (myCourses.length > 0) {
        setAllCourses(myCourses);
        const uniqueCategories = [...new Set(myCourses.map(course => course.category))];
        setCategories(uniqueCategories);
      }
    }
  };

  const fetchRejectedCourses = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/instructor/rejected-courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setRejectedCourses(response.data);
    } catch (error) {
      console.error('Error fetching rejected courses:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchMyCourses();
      
      try {
        await fetchAllCourses();
        await fetchRejectedCourses();
      } catch (error) {
        console.error("Could not fetch all courses:", error);
      }
      
      setLoading(false);
    };
    loadData();
  }, []);

  const handleCourseCreated = (newCourse) => {
    setMyCourses([...myCourses, newCourse]);
    // Also update all courses
    setAllCourses([...allCourses, newCourse]);
    setActiveTab('myCourses');
  };
  
  const handleViewStudents = (courseId) => {
    setSelectedCourse(courseId);
    setActiveTab('students');
  };

  const handleEditCourse = (course) => {
    console.log('Course being set for editing:', course);
    setCourseToEdit(course);
    setActiveTab('editCourse');
  };

  const handleCourseUpdated = (updatedCourse) => {
    console.log('Updated course received:', updatedCourse);
    const updatedMyCourses = myCourses.map(course => 
      course.id === updatedCourse.id ? updatedCourse : course
    );
    setMyCourses(updatedMyCourses);
    
    // Also update in all courses
    const updatedAllCourses = allCourses.map(course => 
      course.id === updatedCourse.id ? updatedCourse : course
    );
    setAllCourses(updatedAllCourses);
    
    setActiveTab('myCourses');
  };

  const handleCancelEdit = () => {
    setCourseToEdit(null);
    setActiveTab('myCourses');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  // Filter courses based on search term and category
  const filterCourses = (courseList) => {
    return courseList.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === '' || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  // Check if a course belongs to the instructor
  const isInstructorCourse = (courseId) => {
    return myCourses.some(course => course.id === courseId);
  };

  const filteredMyCourses = filterCourses(myCourses);
  const filteredAllCourses = filterCourses(allCourses);

  const handleResubmitCourse = async (courseId) => {
    try {
      const response = await axios.post(
        `http://localhost:8080/api/instructor/courses/${courseId}/resubmit`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      
      // Update the course in rejectedCourses state
      setRejectedCourses(rejectedCourses.filter(course => course.id !== courseId));
      
      // Show success message
      setError('');
    } catch (err) {
      // Extract error message from the error object
      const errorMessage = err.response?.data?.message || err.message || 'Failed to resubmit course';
      setError(errorMessage);
    }
  };

  const handleViewCourseDetails = (courseId) => {
    setCourseToView(courseId);
  };

  const handleCloseModal = () => {
    setCourseToView(null);
  };

  const handleDeleteCourse = (course) => {
    setCourseToDelete(course);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCourse = async () => {
    try {
      await axios.delete(
        `http://localhost:8080/api/instructor/courses/${courseToDelete.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      
      // Remove course from state
      setMyCourses(myCourses.filter(course => course.id !== courseToDelete.id));
      setAllCourses(allCourses.filter(course => course.id !== courseToDelete.id));
      
      // Show success message
      setDeleteSuccess(`"${courseToDelete.title}" has been deleted successfully.`);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setDeleteSuccess('');
      }, 3000);
      
      // Close confirmation dialog
      setShowDeleteConfirm(false);
      setCourseToDelete(null);
      
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err.response?.data?.message || 'Failed to delete course');
      setShowDeleteConfirm(false);
    }
  };

  const cancelDeleteCourse = () => {
    setShowDeleteConfirm(false);
    setCourseToDelete(null);
  };

  // Get display title for the current section/tab
  const getSectionTitle = () => {
    if (activeSection === 'courses') {
      switch (activeTab) {
        case 'myCourses':
          return 'My Courses';
        case 'discover':
          return 'All Courses';
        case 'createCourse':
          return 'Create Course';
        case 'editCourse':
          return 'Edit Course';
        case 'students':
          return `Students - ${myCourses.find(c => c.id === selectedCourse)?.title || ''}`;
        case 'underReview':
          return 'Courses Under Review';
        case 'rejected':
          return 'Rejected Courses';
        default:
          return 'My Courses';
      }
    } else if (activeSection === 'mentoring') {
      return 'Mentoring Sessions';
    } else if (activeSection === 'analytics') {
      return 'Analytics';
    }
    return 'Dashboard';
  };

  return (
    <div className="main-content">
      <div className="dashboard-container">
        <h1>Instructor Dashboard</h1>
        
        {/* New Dashboard Layout */}
        <div className="dashboard-layout">
          {/* Left Sidebar Navigation */}
          <div className="dashboard-sidebar">
            <div className="sidebar-header">
              <h3>Navigation</h3>
            </div>
            <ul className="nav-menu">
              <li className="nav-item">
                <div 
                  className={`nav-link ${activeSection === 'courses' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection('courses');
                    if (!['myCourses', 'discover', 'createCourse', 'underReview', 'rejected'].includes(activeTab)) {
                      setActiveTab('myCourses');
                    }
                  }}
                >
                  <i className="bi bi-book"></i>
                  Courses
                </div>
              </li>
              <li className="nav-item">
                <div 
                  className={`nav-link ${activeSection === 'mentoring' ? 'active' : ''}`}
                  onClick={() => setActiveSection('mentoring')}
                >
                  <i className="bi bi-person-video3"></i>
                  Mentoring Sessions
                </div>
              </li>
              <li className="nav-item">
                <div 
                  className={`nav-link ${activeSection === 'analytics' ? 'active' : ''}`}
                  onClick={() => setActiveSection('analytics')}
                >
                  <i className="bi bi-graph-up"></i>
                  Analytics
                </div>
              </li>
            </ul>

            {activeSection === 'courses' && (
              <div className="sidebar-section">
                <div className="sidebar-section-title">Course Options</div>
                <ul className="nav-menu">
                  <li className="nav-item">
                    <div 
                      className={`nav-link ${activeTab === 'myCourses' ? 'active' : ''}`}
            onClick={() => setActiveTab('myCourses')}
          >
                      <i className="bi bi-collection"></i>
            My Courses
                    </div>
                  </li>
                  <li className="nav-item">
                    <div 
                      className={`nav-link ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
                      <i className="bi bi-compass"></i>
            All Courses
                    </div>
                  </li>
                  <li className="nav-item">
                    <div 
                      className={`nav-link ${activeTab === 'createCourse' ? 'active' : ''}`}
            onClick={() => setActiveTab('createCourse')}
          >
                      <i className="bi bi-plus-circle"></i>
            Create Course
                    </div>
                  </li>
                  <li className="nav-item">
                    <div 
                      className={`nav-link ${activeTab === 'underReview' ? 'active' : ''}`}
            onClick={() => setActiveTab('underReview')}
          >
                      <i className="bi bi-clock-history"></i>
            Under Review
                    </div>
                  </li>
                  <li className="nav-item">
                    <div 
                      className={`nav-link ${activeTab === 'rejected' ? 'active' : ''}`}
                      onClick={() => setActiveTab('rejected')}
                    >
                      <i className="bi bi-x-circle"></i>
                      Rejected Courses
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          {/* Right Content Area */}
          <div className="dashboard-content">
            <div className="content-header">
              <h2>{getSectionTitle()}</h2>
              
              {/* Section-specific actions
              {activeSection === 'courses' && activeTab === 'myCourses' && (
            <button
                  className="btn btn-primary" 
                  onClick={() => setActiveTab('createCourse')}
            >
                  <i className="bi bi-plus-circle me-1"></i>
                  Create New Course
            </button>
          )} */}
              
              {activeSection === 'courses' && activeTab === 'editCourse' && (
            <button
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
            >
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to Courses
            </button>
          )}
              
              {activeSection === 'courses' && activeTab === 'students' && (
          <button
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('myCourses')}
          >
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to Courses
          </button>
              )}
        </div>
        
            <div className="content-body">
              {/* Courses Section */}
              {activeSection === 'courses' && (
                <>
                  {/* My Courses Tab */}
          {activeTab === 'myCourses' && (
            <div className="my-courses-section">
                      <div className="search-filter-controls mb-4">
                  <input
                    type="text"
                    placeholder="Search courses"
                    value={searchTerm}
                    onChange={handleSearchChange}
                          className="form-control"
                  />
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                          className="form-select"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <button 
                    className="btn btn-secondary"
                    onClick={resetFilters}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Reset
                  </button>
              </div>

              {loading ? (
                        <div className="loading-spinner">
                          <i className="bi bi-arrow-repeat spinner-icon"></i>
                          <p>Loading courses...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {error}
                </div>
              ) : myCourses.length === 0 ? (
                <div className="courses-empty">
                  <i className="bi bi-book me-2"></i>
                  <h3>No Courses Created</h3>
                  <p>Create your first course to get started!</p>
                          <button 
                            className="btn btn-primary mt-3" 
                            onClick={() => setActiveTab('createCourse')}
                          >
                            <i className="bi bi-plus-circle me-2"></i>
                            Create Course
                          </button>
                </div>
              ) : filteredMyCourses.length === 0 ? (
                <div className="courses-empty">
                  <i className="bi bi-search me-2"></i>
                  <h3>No Matching Courses</h3>
                  <p>Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="courses-grid">
                  {filteredMyCourses.map(course => (
                    <div className="course-card" key={course.id}>
                      <div className="course-image">
                        {course.imageUrl ? (
                          <img src={course.imageUrl} alt={course.title} />
                        ) : (
                          <div className="default-course-image">
                            <span>{course.title.charAt(0)}</span>
                          </div>
                        )}
                        <div className={`course-status ${course.status?.toLowerCase() || 'pending'}`}>
                          {course.status === 'PENDING' ? 'Under Review' : 
                           course.status === 'APPROVED' ? 'Approved' : 
                           course.status === 'REJECTED' ? 'Rejected' :
                           'Under Review'}
                        </div>
                      </div>
                      <div className="course-details">
                        <h3>{course.title}</h3>
                        <div className="course-category">{course.category}</div>
                        <p className="course-description">
                          {course.description.length > 100
                            ? `${course.description.substring(0, 100)}...`
                            : course.description}
                        </p>
                        <div className="course-actions">
                          <button 
                            className="btn btn-primary me-1"
                            onClick={() => handleViewCourseDetails(course.id)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </button>
                          {course.status === 'APPROVED' && (
                            <button 
                              className="btn btn-primary me-1"
                              onClick={() => handleViewStudents(course.id)}
                            >
                              <i className="bi bi-people me-1"></i>
                              Students
                            </button>
                          )}
                          <button
                            className="btn btn-secondary me-1"
                            onClick={() => handleEditCourse(course)}
                          >
                            <i className="bi bi-pencil me-1"></i>
                            Edit
                          </button>
                        </div>
                        <div className="delete-button-container">
                          <button
                            className="btn btn-danger w-100 mt-2"
                            onClick={() => handleDeleteCourse(course)}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Delete Course
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
                  {/* All Courses Tab */}
          {activeTab === 'discover' && (
            <div className="discover-section">
                      <div className="search-filter-controls mb-4">
                  <input
                    type="text"
                    placeholder="Search courses"
                    value={searchTerm}
                    onChange={handleSearchChange}
                          className="form-control"
                  />
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                          className="form-select"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <button 
                    className="btn btn-secondary"
                    onClick={resetFilters}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Reset
                  </button>
              </div>
              
              {loading ? (
                        <div className="loading-spinner">
                          <i className="bi bi-arrow-repeat spinner-icon"></i>
                          <p>Loading courses...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {error}
                </div>
              ) : allCourses.length === 0 ? (
                <div className="courses-empty">
                  <i className="bi bi-book me-2"></i>
                  <h3>No Courses Available</h3>
                  <p>Check back later for new courses!</p>
                </div>
              ) : filteredAllCourses.length === 0 ? (
                <div className="courses-empty">
                  <i className="bi bi-search me-2"></i>
                  <h3>No Matching Courses</h3>
                  <p>Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="courses-grid">
                  {filteredAllCourses.map(course => (
                    <div className="course-card" key={course.id}>
                      {isInstructorCourse(course.id) && (
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
                        <div className="course-category">{course.category}</div>
                        <div className="course-instructor">By {course.instructorName}</div>
                        <p className="course-description">
                          {course.description.length > 100
                            ? `${course.description.substring(0, 100)}...`
                            : course.description}
                        </p>
                        <div className="course-actions">
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleViewCourseDetails(course.id)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </button>
                          {isInstructorCourse(course.id) && (
                            <>
                              <button
                                className="btn btn-secondary ms-1"
                                onClick={() => handleEditCourse(course)}
                              >
                                <i className="bi bi-pencil me-1"></i>
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                        {isInstructorCourse(course.id) && (
                          <div className="delete-button-container">
                            <button
                              className="btn btn-danger w-100 mt-2"
                              onClick={() => handleDeleteCourse(course)}
                            >
                              <i className="bi bi-trash me-1"></i>
                              Delete Course
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
                  {/* Create Course Tab */}
          {activeTab === 'createCourse' && (
            <div className="create-course-section">
              <div className="feature-card">
                <CreateCourse onSuccess={handleCourseCreated} />
              </div>
            </div>
          )}

                  {/* Edit Course Tab */}
          {activeTab === 'editCourse' && courseToEdit && (
            <div className="edit-course-section">
              <div className="feature-card">
                <EditCourse 
                  course={courseToEdit} 
                  onSuccess={handleCourseUpdated} 
                  onCancel={handleCancelEdit} 
                />
              </div>
            </div>
          )}
          
                  {/* Enrolled Students Tab */}
          {activeTab === 'students' && selectedCourse && (
            <div className="students-section">
              <div className="feature-card">
                <EnrolledStudents courseId={selectedCourse} />
              </div>
            </div>
          )}
          
                  {/* Under Review Tab */}
                  {activeTab === 'underReview' && (
                    <div className="pending-review-section">
                      <div className="feature-card">
                        <PendingReviewCourses />
                      </div>
                    </div>
                  )}
                  
                  {/* Rejected Courses Tab */}
          {activeTab === 'rejected' && (
            <div className="rejected-courses-section">
              {error && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {typeof error === 'string' ? error : 'An error occurred while resubmitting the course'}
                </div>
              )}
              {rejectedCourses.length === 0 ? (
                <div className="courses-empty">
                  <i className="bi bi-check-circle me-2"></i>
                  <h3>No Rejected Courses</h3>
                  <p>All your courses are either approved or pending review!</p>
                </div>
              ) : (
                <div className="courses-grid">
                  {rejectedCourses.map(course => (
                    <div className="course-card rejected" key={course.id}>
                      <div className="course-image">
                        {course.imageUrl ? (
                          <img src={course.imageUrl} alt={course.title} />
                        ) : (
                          <div className="default-course-image">
                            <span>{course.title.charAt(0)}</span>
                          </div>
                        )}
                        <div className="course-status rejected">
                          Rejected
                        </div>
                      </div>
                      <div className="course-details">
                        <h3>{course.title}</h3>
                        <div className="course-category">{course.category}</div>
                        <div className="rejection-reason">
                          <strong>Reason:</strong> {course.rejectionReason || 'No reason provided'}
                        </div>
                        <p className="course-description">
                          {course.description.length > 100
                            ? `${course.description.substring(0, 100)}...`
                            : course.description}
                        </p>
                        <div className="course-actions">
                          <button 
                            className="btn btn-primary me-1"
                            onClick={() => handleViewCourseDetails(course.id)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </button>
                          <button
                            className="btn btn-secondary me-1"
                            onClick={() => handleEditCourse(course)}
                          >
                            <i className="bi bi-pencil me-1"></i>
                            Edit
                          </button>
                          <button
                            className="btn btn-success me-1"
                            onClick={() => handleResubmitCourse(course.id)}
                          >
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Resubmit
                          </button>
                        </div>
                        <div className="delete-button-container">
                          <button
                            className="btn btn-danger w-100 mt-2"
                            onClick={() => handleDeleteCourse(course)}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Delete Course
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
                  )}
                </>
              )}
              
              {/* Mentoring Sessions Section */}
              {activeSection === 'mentoring' && (
                <div className="mentoring-sessions-section">
                  <MentoringSessions />
            </div>
          )}
          
              {/* Analytics Section */}
              {activeSection === 'analytics' && (
            <div className="analytics-section">
              <div className="courses-empty">
                <i className="bi bi-graph-up me-2"></i>
                <h3>Analytics Coming Soon</h3>
                <p>Course analytics will be available here soon!</p>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {courseToView && (
        <CourseDetails 
          courseId={courseToView}
          onClose={handleCloseModal}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop">
          <div className="delete-confirm-modal">
            <div className="delete-confirm-header">
              <h4>Delete Course</h4>
            </div>
            <div className="delete-confirm-body">
              <p>Are you sure you want to delete "{courseToDelete?.title}"?</p>
              <p className="text-danger">This action cannot be undone!</p>
            </div>
            <div className="delete-confirm-footer">
              <button 
                className="btn btn-secondary" 
                onClick={cancelDeleteCourse}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmDeleteCourse}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Message Toast */}
      {deleteSuccess && (
        <div className="delete-success-toast">
          <i className="bi bi-check-circle-fill me-2"></i>
          {deleteSuccess}
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard; 