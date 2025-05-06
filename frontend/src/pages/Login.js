import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [successful, setSuccessful] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const onChangeUsername = (e) => {
    setUsername(e.target.value);
    setMessage('');
  };

  const onChangePassword = (e) => {
    setPassword(e.target.value);
    setMessage('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    setMessage('');
    setLoading(true);

    // Form validation
    if (!username || !password) {
      setMessage('Please enter both username and password');
      setLoading(false);
      setSuccessful(false);
      return;
    }

    try {
      const response = await login(username, password);
      setMessage('Login successful!');
      setSuccessful(true);

      // Show welcome toast for students and instructors
      if (response.roles.includes('ROLE_STUDENT') || response.roles.includes('ROLE_INSTRUCTOR')) {
        addToast(`Welcome back, ${response.fullName || response.username}! 👋`, 'success');
      }

      // Redirect based on user role with a slight delay for animation
      setTimeout(() => {
        if (response.roles.includes('ROLE_ADMIN')) {
          navigate('/admin-dashboard');
        } else if (response.roles.includes('ROLE_INSTRUCTOR')) {
          navigate('/instructor-dashboard');
        } else {
          navigate('/student-dashboard');
        }
      }, 500);
    } catch (error) {
      const resMessage =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();

      setMessage(resMessage);
      setSuccessful(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                className="form-control"
                name="username"
                value={username}
                onChange={onChangeUsername}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  name="password"
                  value={password}
                  onChange={onChangePassword}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <button className="btn btn-block" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border"></span>
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </div>

            {message && (
              <div className={`alert ${successful ? 'alert-success' : 'alert-danger'}`} role="alert">
                {message}
              </div>
            )}

            <div className="auth-links">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 