import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import axios from "axios";
import authHeader from "../services/auth-header";
import "./Profile.css"; // Import the Profile-specific CSS

const LoadingSkeleton = () => (
  <div className="profile-container">
    <div className="profile-sidebar">
      <div className="profile-avatar">
        <div className="skeleton skeleton-avatar"></div>
      </div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text small"></div>
      
      <div className="profile-stats">
        <div className="skeleton skeleton-stat"></div>
        <div className="skeleton skeleton-stat"></div>
      </div>
    </div>

    <div className="profile-main">
      <div className="profile-section">
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text"></div>
      </div>

      <div className="profile-section">
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text"></div>
      </div>
    </div>
  </div>
);

const Profile = () => {
  const { currentUser, isLoggedIn, isInstructor, isStudent, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [userData, setUserData] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    userType: ""
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isLoggedIn || !currentUser) {
        setError("No authentication data found. Please login again.");
        setLoading(false);
        return;
      }

      try {
        let endpoint;
        if (isAdmin) {
          endpoint = "http://localhost:8080/api/admin/profile";
        } else if (isInstructor) {
          endpoint = "http://localhost:8080/api/instructor/profile";
        } else {
          endpoint = "http://localhost:8080/api/student/profile";
        }

        const response = await axios.get(endpoint, { headers: authHeader() });
        setUserData(response.data);
        setEditData({
          fullName: response.data.fullName || "",
          email: response.data.email || "",
          phoneNumber: response.data.phoneNumber || "",
          userType: response.data.userType || "STUDENT"
        });

        // Fetch instructor courses if user is an instructor
        if (isInstructor) {
          try {
            const coursesResponse = await axios.get(
              'http://localhost:8080/api/instructor/courses',
              { headers: authHeader() }
            );
            setInstructorCourses(coursesResponse.data);
          } catch (courseError) {
            console.error('Error fetching instructor courses:', courseError);
            setInstructorCourses([]);
          }
        }

        // Fetch student data if user is a student
        if (isStudent) {
          try {
            const enrollmentsResponse = await axios.get(
              `http://localhost:8080/api/student/enrolled-courses`,
              { headers: authHeader() }
            );
            setEnrolledCourses(enrollmentsResponse.data);

            const certificatesResponse = await axios.get(
              `http://localhost:8080/api/student/certificates`,
              { headers: authHeader() }
            );
            setCertificates(certificatesResponse.data);
          } catch (enrollmentError) {
            console.error('Error fetching enrollments:', enrollmentError);
            setEnrolledCourses([]);
            setCertificates([]);
          }
        }

        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || error.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [isLoggedIn, currentUser, isInstructor, isAdmin, isStudent]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      fullName: userData.fullName || "",
      email: userData.email || "",
      phoneNumber: userData.phoneNumber || "",
      userType: userData.userType || "STUDENT"
    });
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let endpoint;
      if (isAdmin) {
        endpoint = "http://localhost:8080/api/admin/profile";
      } else if (isInstructor) {
        endpoint = "http://localhost:8080/api/instructor/profile";
      } else {
        endpoint = "http://localhost:8080/api/student/profile";
      }

      // If user type is being updated, send it separately
      if (isStudent && editData.userType !== userData.userType) {
        await axios.put(
          "http://localhost:8080/api/student/update-user-type",
          editData.userType,
          { 
            headers: {
              ...authHeader(),
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Send other profile updates
      const response = await axios.put(
        endpoint,
        {
          fullName: editData.fullName,
          email: editData.email,
          phoneNumber: editData.phoneNumber
        },
        { headers: authHeader() }
      );

      setUserData(response.data);
      setIsEditing(false);
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Get initials for avatar
  const getInitials = () => {
    if (userData.fullName) {
      const names = userData.fullName.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
      }
      return userData.fullName.charAt(0).toUpperCase();
    }
    return userData.username.charAt(0).toUpperCase();
  };

  // Get count of approved courses for instructors
  const getApprovedCoursesCount = () => {
    return instructorCourses.filter(course => course.status === 'APPROVED').length;
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="alert alert-danger" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
          <h4>Error</h4>
          <p>{error}</p>
          {error === "No authentication data found. Please login again." && (
            <p>
              <Link to="/login" className="btn btn-primary">
                Go to Login
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Use either fetched userData or currentUser from context
  const user = userData || currentUser;

  if (!user) {
    return <div className="text-center p-5">No profile data available.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-sidebar">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {getInitials()}
          </div>
        </div>
        <h2 className="profile-name">{userData?.fullName || 'Loading...'}</h2>
        <div className="profile-role">
          {isAdmin ? "Administrator" : isInstructor ? "Instructor" : "Student"}
        </div>
        
        <div className="profile-stats">
          {isStudent && (
            <>
              <div className="stat-item" style={{ animationDelay: '0.1s' }}>
                <div className="stat-value">{enrolledCourses.length}</div>
                <div className="stat-label">Enrolled Courses</div>
              </div>
              <div className="stat-item" style={{ animationDelay: '0.2s' }}>
                <div className="stat-value">{certificates.length}</div>
                <div className="stat-label">Certificates</div>
              </div>
            </>
          )}
          {isInstructor && (
            <>
              <div className="stat-item" style={{ animationDelay: '0.1s' }}>
                <div className="stat-value">{instructorCourses.length}</div>
                <div className="stat-label">Total Courses</div>
              </div>
              <div className="stat-item" style={{ animationDelay: '0.2s' }}>
                <div className="stat-value">{getApprovedCoursesCount()}</div>
                <div className="stat-label">Active Courses</div>
              </div>
            </>
          )}
        </div>

        <div className="profile-actions">
          {!isEditing ? (
            <button className="btn btn-primary" onClick={handleEditClick}>
              Edit Profile
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="profile-main">
        <div className="profile-section" style={{ animationDelay: '0.1s' }}>
          <h3 className="section-title">Personal Information</h3>
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="info-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="fullName"
                  value={editData.fullName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="info-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={editData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="info-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  name="phoneNumber"
                  value={editData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
              {isStudent && (
                <div className="info-group">
                  <label>User Type</label>
                  <select
                    className="form-control"
                    name="userType"
                    value={editData.userType}
                    onChange={handleInputChange}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="PLACEMENT_TRAINING">Placement Training</option>
                  </select>
                </div>
              )}
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </form>
          ) : (
            <>
              <div className="info-group">
                <label>Username</label>
                <p>{userData?.username}</p>
              </div>
              <div className="info-group">
                <label>Full Name</label>
                <p>{userData?.fullName}</p>
              </div>
              <div className="info-group">
                <label>Email</label>
                <p>{userData?.email}</p>
              </div>
              <div className="info-group">
                <label>Phone Number</label>
                <p>{userData?.phoneNumber || "Not provided"}</p>
              </div>
              {isStudent && (
                <div className="info-group">
                  <label>User Type</label>
                  <p>
                    {userData?.userType === "STUDENT"
                      ? "Student"
                      : userData?.userType === "PROFESSIONAL"
                      ? "Professional"
                      : userData?.userType === "PLACEMENT_TRAINING"
                      ? "Placement Training"
                      : "Unknown"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="profile-section" style={{ animationDelay: '0.2s' }}>
          <h3 className="section-title">Account Details</h3>
          <div className="info-group">
            <label>Account Created</label>
            <p>
              {userData?.createdAt
                ? new Date(userData.createdAt).toLocaleDateString()
                : "Unknown"}
            </p>
          </div>
          <div className="info-group">
            <label>Account Status</label>
            <p>Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
