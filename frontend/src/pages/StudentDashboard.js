import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import authHeader from '../services/auth-header';
import CourseList, { CourseListWithEnrollment } from '../components/course/CourseList';
import './Dashboard.css';
import { Link } from 'react-router-dom';
import CourseNotes from '../components/student/CourseNotes';
import mentoringService from '../services/mentoring.service';
import Certificates from '../components/student/Certificates';

const StudentDashboard = () => {
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('myLearning');
  const [activeTab, setActiveTab] = useState('enrolled'); // Tab within the section
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [userType, setUserType] = useState(null);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState(null);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [mentoringSessions, setMentoringSessions] = useState([]);
  const [loadingMentoring, setLoadingMentoring] = useState(false);
  const [mentoringError, setMentoringError] = useState('');

  useEffect(() => {
    // Set active section from navigation state if available
    if (location.state?.section) {
      setActiveSection(location.state.section);
    }
  }, [location]);

  const fetchUserType = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/student/profile',
        { headers: authHeader() }
      );
      setUserType(response.data.userType);
    } catch (err) {
      console.error('Failed to fetch user type:', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/student/courses',
        { headers: authHeader() }
      );
      // The backend already filters courses based on user type, so we don't need to filter again
      setCourses(response.data);
      
      // Extract unique categories from courses
      const uniqueCategories = [...new Set(response.data.map(course => course.category))];
      setCategories(uniqueCategories);
      
      setError('');
    } catch (err) {
      setError('Failed to load courses. Please try again later.');
      console.error(err);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await axios.get(
        'http://localhost:8080/api/student/enrolled-courses',
        { headers: authHeader() }
      );
      // The backend already filters courses based on user type, so we don't need to filter again
      setEnrolledCourses(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load enrolled courses. Please try again later.');
      console.error(err);
    }
  };

  const handleUserTypeUpdate = async () => {
    try {
      setIsUpdating(true);
      await axios.put(
        'http://localhost:8080/api/student/update-user-type',
        JSON.stringify(selectedUserType),
        { 
          headers: {
            ...authHeader(),
            'Content-Type': 'application/json'
          }
        }
      );
      setUpdateSuccess('User type updated successfully!');
      setUpdateError('');
      await fetchUserType(); // Refresh user type
      await fetchCourses(); // Refresh courses to show updated list
      setTimeout(() => {
        setShowUserTypeModal(false);
        setUpdateSuccess('');
      }, 2000);
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update user type');
      setUpdateSuccess('');
    } finally {
      setIsUpdating(false);
    }
  };

  // Add keyboard event listener for Esc key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showUserTypeModal) {
        setShowUserTypeModal(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [showUserTypeModal]);

  const fetchMentoringSessions = async () => {
    if (activeSection === 'mentoring' && !mentoringSessions.length) {
      try {
        setLoadingMentoring(true);
        setMentoringError('');
        const response = await mentoringService.getStudentMentoringSessions();
        setMentoringSessions(response.data);
      } catch (err) {
        console.error('Failed to load mentoring sessions:', err);
        setMentoringError('Failed to load your mentoring sessions. Please try again later.');
      } finally {
        setLoadingMentoring(false);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUserType();
      await Promise.all([fetchCourses(), fetchEnrolledCourses()]);
      setLoading(false);
    };
    
    loadData();
    
    // Set up periodic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      Promise.all([fetchCourses(), fetchEnrolledCourses()]);
    }, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    // Fetch data based on the active section
    if (activeSection === 'mentoring') {
      fetchMentoringSessions();
    }
  }, [activeSection]);

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

  // Check if a course is already enrolled to display different UI
  const isEnrolled = (courseId) => {
    return enrolledCourses.some(course => course.id === courseId);
  };

  // Apply filters to both enrolled and available courses
  const filteredEnrolledCourses = filterCourses(enrolledCourses);
  const filteredAllCourses = filterCourses(courses);

  // Get display title for the current section
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'myLearning':
        return 'My Learning';
      case 'notes':
        return 'My Notes';
      case 'mentoring':
        return 'Mentoring Sessions';
      case 'certificates':
        return 'My Certificates';
      default:
        return 'My Learning';
    }
  };

  return (
    <div className="main-content">
      <div className="dashboard-container">
        <h1>Student Dashboard</h1>
        
        {/* Display user type and account type */}
        {userType && (
          <div className="user-type-banner mb-4">
            <div className="user-type-card">
              <div className="user-type-info">
                <i className="bi bi-person-circle me-2"></i>
                <div>
                  <h6 className="mb-1">Current User Type</h6>
                  <span className="user-type-badge">
                    {userType === 'STUDENT' ? 'Student' :
                     userType === 'PROFESSIONAL' ? 'Professional' :
                     'Placement Training'}
                  </span>
                </div>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setSelectedUserType(userType);
                  setShowUserTypeModal(true);
                }}
              >
                <i className="bi bi-pencil-square me-2"></i>
                Change User Type
              </button>
            </div>
          </div>
        )}
        
        {/* User Type Update Modal */}
        {showUserTypeModal && (
          <>
            <div 
              className="modal-backdrop"
              onClick={() => setShowUserTypeModal(false)}
            />
            <div className="modal">
              <div className="modal-content" style={{
                border: 'none',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                animation: 'slideIn 0.3s ease-out',
                backgroundColor: 'white'
              }}>
                <div className="modal-header" style={{
                  borderBottom: '1px solid #eee',
                  padding: '1.5rem'
                }}>
                  <h5 className="modal-title" style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>Update User Type</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowUserTypeModal(false)}
                    disabled={isUpdating}
                    style={{
                      opacity: isUpdating ? '0.5' : '1',
                      transition: 'opacity 0.2s'
                    }}
                  ></button>
                </div>
                <div className="modal-body" style={{ padding: '1.5rem' }}>
                  {updateSuccess && (
                    <div className="alert alert-success" style={{
                      animation: 'slideIn 0.3s ease-out',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 2px 10px rgba(40, 167, 69, 0.1)'
                    }}>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      {updateSuccess}
                    </div>
                  )}
                  {updateError && (
                    <div className="alert alert-danger" style={{
                      animation: 'slideIn 0.3s ease-out',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 2px 10px rgba(220, 53, 69, 0.1)'
                    }}>
                      <i className="bi bi-exclamation-circle-fill me-2"></i>
                      {updateError}
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label" style={{
                      fontSize: '1.1rem',
                      fontWeight: '500',
                      color: '#2c3e50',
                      marginBottom: '0.8rem'
                    }}>Select User Type</label>
                    <select 
                      className="form-select"
                      value={selectedUserType}
                      onChange={(e) => setSelectedUserType(e.target.value)}
                      disabled={isUpdating}
                      style={{
                        padding: '0.8rem',
                        borderRadius: '8px',
                        border: '2px solid #e9ecef',
                        fontSize: '1rem',
                        transition: 'all 0.2s',
                        cursor: isUpdating ? 'not-allowed' : 'pointer',
                        backgroundColor: isUpdating ? '#f8f9fa' : 'white',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                      }}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="PLACEMENT_TRAINING">Placement Training</option>
                    </select>
                  </div>
                  <div className="alert alert-warning mt-3" style={{
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    boxShadow: '0 2px 10px rgba(255, 193, 7, 0.1)'
                  }}>
                    <small>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      Note: Changing your user type will affect the courses available to you.
                      You may need to re-enroll in courses that match your new user type.
                    </small>
                  </div>
                </div>
                <div className="modal-footer" style={{
                  borderTop: '1px solid #eee',
                  padding: '1.5rem'
                }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowUserTypeModal(false)}
                    disabled={isUpdating}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      opacity: isUpdating ? '0.7' : '1'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleUserTypeUpdate}
                    disabled={isUpdating}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      backgroundColor: '#0d6efd',
                      border: 'none',
                      boxShadow: '0 2px 5px rgba(13, 110, 253, 0.2)'
                    }}
                  >
                    {isUpdating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      'Update'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        
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
                  className={`nav-link ${activeSection === 'myLearning' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection('myLearning');
                    setActiveTab('enrolled');
                  }}
                >
                  <i className="bi bi-book"></i>
                  My Learning
                </div>
              </li>
              <li className="nav-item">
                <div 
                  className={`nav-link ${activeSection === 'notes' ? 'active' : ''}`}
                  onClick={() => setActiveSection('notes')}
                >
                  <i className="bi bi-journal-text"></i>
                  Notes
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
                  className={`nav-link ${activeSection === 'certificates' ? 'active' : ''}`}
                  onClick={() => setActiveSection('certificates')}
                >
                  <i className="bi bi-award"></i>
                  Certificates
                </div>
              </li>
            </ul>
          </div>
          
          {/* Right Content Area */}
          <div className="dashboard-content">
            <div className="content-header">
              <h2>{getSectionTitle()}</h2>
              
              {/* Section-specific actions */}
              {activeSection === 'myLearning' && (
                <div className="section-actions">
          <button
                    className={`btn ${activeTab === 'enrolled' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                    onClick={() => setActiveTab('enrolled')}
          >
                    <i className="bi bi-collection-play me-1"></i>
                    Enrolled Courses
          </button>
          <button
                    className={`btn ${activeTab === 'discover' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('discover')}
          >
            <i className="bi bi-compass me-1"></i>
            Discover Courses
          </button>
                </div>
              )}
        </div>
        
            <div className="content-body">
              {/* My Learning Section */}
              {activeSection === 'myLearning' && (
            <div className="my-learning-section">
                  {/* Search and filter controls - keep if in My Learning section */}
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
              
                  {/* Enrolled Courses Tab */}
                  {activeTab === 'enrolled' && (
                    <div className="enrolled-courses">
              {loading ? (
                <div className="loading-state">
                  <i className="bi bi-arrow-repeat"></i>
                  <p>Loading your courses...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {error}
                </div>
              ) : enrolledCourses.length === 0 ? (
                <div className="courses-empty">
                  <i className="bi bi-book me-2"></i>
                  <h3>No Enrolled Courses</h3>
                  <p>Start your learning journey by enrolling in courses!</p>
                </div>
              ) : filteredEnrolledCourses.length === 0 ? (
                <div className="courses-empty">
                  <i className="bi bi-search me-2"></i>
                  <h3>No Matching Courses</h3>
                  <p>Try adjusting your search criteria</p>
                </div>
              ) : (
                <CourseList courses={filteredEnrolledCourses} isEnrolledView={true} />
              )}
            </div>
          )}
          
                  {/* Discover Courses Tab */}
          {activeTab === 'discover' && (
                    <div className="discover-courses">
              {loading ? (
                <div className="loading-state">
                  <i className="bi bi-arrow-repeat"></i>
                          <p>Loading courses...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {error}
                </div>
              ) : filteredAllCourses.length === 0 ? (
                <div className="courses-empty">
                  <i className="bi bi-search me-2"></i>
                  <h3>No Matching Courses</h3>
                  <p>Try adjusting your search criteria</p>
                </div>
              ) : (
                        <CourseListWithEnrollment 
                          courses={filteredAllCourses} 
                          enrolledCourseIds={enrolledCourses.map(course => course.id)}
                          onSuccess={() => {
                            fetchEnrolledCourses();
                            setActiveTab('enrolled');
                          }}
                        />
                      )}
                    </div>
              )}
            </div>
          )}
          
              {/* Notes Section */}
              {activeSection === 'notes' && (
            <div className="notes-section">
              <div className="notes-overview">
                <p>Access your notes for each course. Click on a course to view or edit notes.</p>
              </div>
              
              {loading ? (
                <div className="loading-message">Loading your courses...</div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : enrolledCourses.length === 0 ? (
                <div className="no-courses-message">
                  <i className="bi bi-journal-x"></i>
                  <p>You don't have any courses with notes yet. Enroll in courses to start taking notes!</p>
                  <button 
                    className="btn btn-primary mt-3" 
                        onClick={() => {
                          setActiveSection('myLearning');
                          setActiveTab('discover');
                        }}
                  >
                    Browse Courses
                  </button>
                </div>
              ) : (
                <div className="notes-list">
                  {enrolledCourses.map(course => (
                    <CourseNotes key={course.id} course={course} />
                  ))}
                </div>
              )}
            </div>
          )}
          
              {/* Mentoring Sessions Section */}
              {activeSection === 'mentoring' && (
                <div className="mentoring-section">
                  {loadingMentoring ? (
                    <div className="loading-state">
                      <i className="bi bi-arrow-repeat"></i>
                      <p>Loading mentoring sessions...</p>
                    </div>
                  ) : mentoringError ? (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-circle-fill me-2"></i>
                      {mentoringError}
                    </div>
                  ) : mentoringSessions.length === 0 ? (
                    <div className="no-sessions">
                      <i className="bi bi-calendar-x"></i>
                      <p>You don't have any mentoring sessions yet.</p>
                    </div>
                  ) : (
                    <div className="sessions-list">
                      <div className="table-responsive">
                        <table className="table table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th style={{width: '25%'}}>Course</th>
                              <th style={{width: '20%'}}>Instructor</th>
                              <th style={{width: '15%'}}>Topic</th>
                              <th style={{width: '15%'}}>Status</th>
                              <th style={{width: '15%'}}>Requested On</th>
                              <th style={{width: '10%'}}>Session Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mentoringSessions.map(session => (
                              <tr key={session.id}>
                                <td>{session.courseTitle}</td>
                                <td>{session.instructorName}</td>
                                <td>{session.topic}</td>
                                <td>
                                  <span className={`badge ${
                                    session.status === 'PENDING' ? 'bg-warning text-dark' :
                                    session.status === 'APPROVED' ? 'bg-success' :
                                    session.status === 'REJECTED' ? 'bg-danger' :
                                    session.status === 'COMPLETED' ? 'bg-info' :
                                    'bg-secondary'
                                  }`}>
                                    {session.status}
                                  </span>
                                </td>
                                <td>
                                  {new Date(session.requestDate).toLocaleDateString()}
                                </td>
                                <td>
                                  {session.sessionDate ? 
                                    new Date(session.sessionDate).toLocaleDateString() : 
                                    <span className="text-muted">Not set</span>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Certificates Section */}
              {activeSection === 'certificates' && (
                <div className="certificates-section">
                  <Certificates />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 