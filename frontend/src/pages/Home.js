import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isLoggedIn, isInstructor, isStudent } = useAuth();

  return (
    <div className="main-content">
      <div className="home-container">
        <section className="hero">
          <div className="hero-content">
            <h1>Welcome to E-Learning Platform</h1>
            <p>Discover a world of knowledge with our comprehensive courses.</p>
            <div className="hero-buttons">
              {isStudent ? (
                <Link to="/student-dashboard" className="btn btn-primary">
                  Browse Courses
                </Link>
              ) : isInstructor ? (
                <Link to="/instructor-dashboard" className="btn btn-primary">
                  Manage Courses
                </Link>
              ) : (
                <>
                  <Link to="/courses" className="btn btn-primary">
                    Browse Courses
                  </Link>
                  {!isLoggedIn && (
                    <Link to="/register" className="btn btn-secondary">
                      Sign Up Now
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <section className="features">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Diverse Courses</h3>
            <p>Explore a wide range of courses across multiple disciplines.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍🏫</div>
            <h3>Expert Instructors</h3>
            <p>Learn from industry professionals and academic experts.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Interactive Learning</h3>
            <p>Engage with interactive content and fellow students.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Certifications</h3>
            <p>Earn recognized certificates upon course completion.</p>
          </div>
        </section>

        {!isLoggedIn && (
          <section className="cta">
            <h2>Ready to start your learning journey?</h2>
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home; 