import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StudentList from '../components/admin/StudentList';
import InstructorList from '../components/admin/InstructorList';
import PendingCourses from '../components/admin/PendingCourses';
import MentoringSessions from '../components/admin/MentoringSessions';
import AllCourses from '../components/admin/AllCourses';
import CourseDetails from '../components/course/CourseDetails';
import Profile from './Profile';
import '../components/admin/AdminComponents.css';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    pendingCourses: 0,
    mentoringSessions: 0,
    approvedCourses: 0,
    studentTypeUsers: 0,
    professionalTypeUsers: 0,
    placementTypeUsers: 0
  });
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Failed to fetch stats:', response.status);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Add console log to see the stats data
  useEffect(() => {
    console.log("Current stats data:", stats);
  }, [stats]);

  const handleViewCourseDetails = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleCloseModal = () => {
    setSelectedCourseId(null);
  };

  // Make CourseDetails component available to child components
  const courseDetailsProps = {
    onViewCourse: handleViewCourseDetails
  };

  if (!isAdmin) {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="main-content">
      <div className="admin-dashboard">
        <div className="dashboard-layout">
          <div className="sidebars">
            <div className="left-panel student-panel">
              <h2 className="section-title">Student Types</h2>
              <div className="student-types-panel">
                <div className="stat-card student-type">
                  <div className="stat-content">
                    <h3>Student</h3>
                    <p>{stats.studentTypeUsers || 0}</p>
                  </div>
                  <div className="stat-icon"><i className="fas fa-user-graduate"></i></div>
                </div>
                <div className="stat-card professional-type">
                  <div className="stat-content">
                    <h3>Professional</h3>
                    <p>{stats.professionalTypeUsers || 0}</p>
                  </div>
                  <div className="stat-icon"><i className="fas fa-briefcase"></i></div>
                </div>
                <div className="stat-card placement-type">
                  <div className="stat-content">
                    <h3>Placement</h3>
                    <p>{stats.placementTypeUsers || 0}</p>
                  </div>
                  <div className="stat-icon"><i className="fas fa-building"></i></div>
                </div>
              </div>
            </div>
            
            <div className="left-panel actions-panel">
              <h2 className="section-title">Quick Actions</h2>
              <div className="quick-actions">
                <button 
                  className={`quick-action-button ${activeTab === 'students' ? 'active' : ''}`}
                  onClick={() => setActiveTab('students')}
                >
                  <i className="fas fa-user-graduate"></i>
                  Students
                </button>
                <button 
                  className={`quick-action-button ${activeTab === 'instructors' ? 'active' : ''}`}
                  onClick={() => setActiveTab('instructors')}
                >
                  <i className="fas fa-chalkboard-teacher"></i>
                  Instructors
                </button>
                <button 
                  className={`quick-action-button ${activeTab === 'pending-courses' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pending-courses')}
                >
                  <i className="fas fa-hourglass-half"></i>
                  Pending Courses
                </button>
                <button 
                  className={`quick-action-button ${activeTab === 'all-courses' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all-courses')}
                >
                  <i className="fas fa-book"></i>
                  All Courses
                </button>
                <button 
                  className={`quick-action-button ${activeTab === 'mentoring-sessions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mentoring-sessions')}
                >
                  <i className="fas fa-comments"></i>
                  Mentoring Sessions
                </button>
              </div>
            </div>
          </div>
          
          <div className="right-content-panel">
            <div className="stats-section">
              <h2 className="section-title">Overall Statistics</h2>
              <div className="admin-stats overall-stats">
                <div className="stat-card students-card">
                  <h3>Total Students</h3>
                  <p>{stats.totalStudents}</p>
                  <div className="stat-icon"><i className="fas fa-users"></i></div>
                </div>
                <div className="stat-card instructors-card">
                  <h3>Total Instructors</h3>
                  <p>{stats.totalInstructors}</p>
                  <div className="stat-icon"><i className="fas fa-chalkboard-teacher"></i></div>
                </div>
                <div className="stat-card courses-card">
                  <h3>Total Courses</h3>
                  <p>{stats.totalCourses}</p>
                  <div className="stat-icon"><i className="fas fa-book"></i></div>
                </div>
                <div className="stat-card pending-card">
                  <h3>Pending Courses</h3>
                  <p>{stats.pendingCourses}</p>
                  <div className="stat-icon"><i className="fas fa-hourglass-half"></i></div>
                </div>
                <div className="stat-card approved-card">
                  <h3>Approved Courses</h3>
                  <p>{stats.approvedCourses || 0}</p>
                  <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
                </div>
                <div className="stat-card mentoring-card">
                  <h3>Mentoring Sessions</h3>
                  <p>{stats.mentoringSessions || 0}</p>
                  <div className="stat-icon"><i className="fas fa-comments"></i></div>
                </div>
              </div>
            </div>

            <div className="admin-content">
              {activeTab === 'dashboard' && (
                <div>
                  <h2>Welcome, {user?.fullName}</h2>
                  <p>Select an option from the sidebar to manage your e-learning platform.</p>
                </div>
              )}
              {activeTab === 'students' && <StudentList />}
              {activeTab === 'instructors' && <InstructorList />}
              {activeTab === 'pending-courses' && <PendingCourses onViewCourse={handleViewCourseDetails} />}
              {activeTab === 'all-courses' && <AllCourses onViewCourse={handleViewCourseDetails} />}
              {activeTab === 'mentoring-sessions' && <MentoringSessions />}
              {activeTab === 'profile' && <Profile />}
            </div>
          </div>
        </div>
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

export default AdminDashboard; 