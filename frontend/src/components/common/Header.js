import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { isLoggedIn, isInstructor, isStudent, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          E-Learning Platform
        </Link>

        <nav className="header-nav-menu">
          <Link to="/" className="header-nav-link">
            Home
          </Link>
          
          {!isLoggedIn ? (
            <>
              <Link to="/login" className="header-nav-link">
                Login
              </Link>
              <Link to="/register" className="header-nav-link">
                Register
              </Link>
            </>
          ) : (
            <>
              {isAdmin && (
                <Link to="/admin-dashboard" className="header-nav-link">
                  Dashboard
                </Link>
              )}
              {isInstructor && (
                <Link to="/instructor-dashboard" className="header-nav-link">
                  Dashboard
                </Link>
              )}
              {isStudent && (
                <Link to="/student-dashboard" className="header-nav-link">
                  Dashboard
                </Link>
              )}
              <Link to="/profile" className="header-nav-link">
                Profile
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header; 