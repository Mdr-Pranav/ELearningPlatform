import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import './AdminComponents.css';

const UserProfileModal = ({ userId, userType, onClose }) => {
  const [userData, setUserData] = useState(null);
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      try {
        const endpoint = userType === 'student' 
          ? `http://localhost:8080/api/admin/student/${userId}` 
          : `http://localhost:8080/api/admin/instructor/${userId}`;
          
        const response = await axios.get(endpoint, { headers: authHeader() });
        console.log('User data:', response.data);
        setUserData(response.data);
        
        if (userType === 'instructor') {
          // If this is an instructor, fetch all courses and filter by instructor ID
          try {
            // Get all courses and filter by instructor ID client-side
            const coursesResponse = await axios.get(
              `http://localhost:8080/api/courses`,
              { headers: authHeader() }
            );
            
            if (Array.isArray(coursesResponse.data)) {
              const instructorCoursesFiltered = coursesResponse.data.filter(
                course => course.instructor && course.instructor.id === userId
              );
              console.log('Instructor courses:', instructorCoursesFiltered);
              setInstructorCourses(instructorCoursesFiltered);
            } else {
              setInstructorCourses([]);
            }
          } catch (courseError) {
            console.error('Error fetching instructor courses:', courseError);
            setInstructorCourses([]);
          }
        } else if (userType === 'student') {
          // For students, fetch their enrollments
          try {
            const enrollmentsResponse = await axios.get(
              `http://localhost:8080/api/admin/student/${userId}/enrollments`,
              { headers: authHeader() }
            );
            
            if (Array.isArray(enrollmentsResponse.data)) {
              console.log('Student enrollments:', enrollmentsResponse.data);
              setStudentEnrollments(enrollmentsResponse.data);
            } else {
              setStudentEnrollments([]);
            }
          } catch (enrollmentError) {
            console.error('Error fetching student enrollments:', enrollmentError);
            setStudentEnrollments([]);
          }
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, userType]);

  // Get initials for avatar
  const getInitials = () => {
    if (!userData || !userData.fullName) return "?";
    
    const names = userData.fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return userData.fullName.charAt(0).toUpperCase();
  };

  // Get count of enrolled courses for students
  const getEnrolledCoursesCount = () => {
    return studentEnrollments.length;
  };
  
  // Get count of courses for instructors
  const getInstructorCoursesCount = () => {
    return instructorCourses.length;
  };

  // Get count of approved courses for instructors
  const getApprovedCoursesCount = () => {
    return instructorCourses.filter(course => course.status === 'APPROVED').length;
  };

  // Get count of pending courses for instructors
  const getPendingCoursesCount = () => {
    return instructorCourses.filter(course => course.status === 'PENDING').length;
  };

  // Close modal when clicking on backdrop
  const handleBackdropClick = (e) => {
    if (e.target.className === 'modal-backdrop') {
      onClose();
    }
  };

  // Prevent event bubbling when clicking on modal content
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className="modal-backdrop" onClick={handleBackdropClick}></div>
      <div className="user-profile-modal side-by-side" onClick={handleModalClick}>
        <div className="modal-header">
          <h3>{userType === 'student' ? 'Student' : 'Instructor'} Profile</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading profile...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : userData ? (
            <div className="user-profile-content">
              <div className="profile-sidebar">
                <div className="profile-avatar">
                  <div className="avatar-circle">
                    {getInitials()}
                  </div>
                </div>
                <h2 className="profile-name">{userData.fullName}</h2>
                <div className="profile-role">{userType === 'student' ? userData.userType || 'STUDENT' : 'INSTRUCTOR'}</div>
              </div>
              
              <div className="profile-details">
                <div className="details-section">
                  <h3>Contact Information</h3>
                  <div className="info-group">
                    <label>Username</label>
                    <div className="info-value">{userData.username}</div>
                  </div>
                  
                  <div className="info-group">
                    <label>Email</label>
                    <div className="info-value">{userData.email}</div>
                  </div>
                  
                  <div className="info-group">
                    <label>Phone Number</label>
                    <div className="info-value">{userData.phoneNumber || 'Not provided'}</div>
                  </div>
                </div>
                
                <div className="details-section">
                  <h3>Account Details</h3>
                  {userType === 'student' && (
                    <div className="info-group">
                      <label>Student Type</label>
                      <div className="info-value">{userData.userType || 'STUDENT'}</div>
                    </div>
                  )}
                  
                  {userType === 'instructor' && (
                    <div className="info-group">
                      <label>Courses</label>
                      <div className="info-value">{getInstructorCoursesCount()} courses</div>
                    </div>
                  )}
                  
                  <div className="info-group">
                    <label>Account Created</label>
                    <div className="info-value">
                      {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="profile-extra-details">
                <div className="extra-section">
                  <h3>User Statistics</h3>
                  <div className="info-group">
                    <label>Status</label>
                    <div className="info-value">Active</div>
                  </div>
                  {userType === 'student' && (
                    <>
                      <div className="info-group">
                        <label>Enrolled Courses</label>
                        <div className="info-value">{getEnrolledCoursesCount()}</div>
                      </div>
                      <div className="info-group">
                        <label>Certificates</label>
                        <div className="info-value">{Array.isArray(userData.certificates) ? userData.certificates.length : 0}</div>
                      </div>
                    </>
                  )}
                  {userType === 'instructor' && (
                    <>
                      <div className="info-group">
                        <label>Active Courses</label>
                        <div className="info-value">{getApprovedCoursesCount()}</div>
                      </div>
                      <div className="info-group">
                        <label>Pending Courses</label>
                        <div className="info-value">{getPendingCoursesCount()}</div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="extra-section">
                  <h3>Recent Activity</h3>
                  <div className="info-group">
                    <label>Account created</label>
                    <div className="info-value">{userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}</div>
                  </div>
                </div>
                
                <div className="extra-section">
                  <h3>Interests</h3>
                  <div className="tag-list">
                    {userType === 'student' ? (
                      <>
                        <span className="profile-tag">Programming</span>
                        <span className="profile-tag">Web Development</span>
                        <span className="profile-tag">Data Science</span>
                      </>
                    ) : (
                      <>
                        <span className="profile-tag">Teaching</span>
                        <span className="profile-tag">Course Creation</span>
                        <span className="profile-tag">Mentoring</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="error">No user data available</div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
};

export default UserProfileModal; 