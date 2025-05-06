import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [userType, setUserType] = useState('STUDENT'); // Default user type
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: ''
  });

  const navigate = useNavigate();
  const { register, login } = useAuth();

  const onChangeUsername = (e) => {
    const value = e.target.value;
    setUsername(value);
    
    if (value && (value.length < 3 || value.length > 20)) {
      setErrors({...errors, username: 'Username must be between 3 and 20 characters'});
    } else {
      setErrors({...errors, username: ''});
    }
  };

  const onChangeEmail = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      setErrors({...errors, email: 'Please enter a valid email address'});
    } else {
      setErrors({...errors, email: ''});
    }
  };

  const onChangePassword = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    if (value && value.length < 6) {
      setErrors({...errors, password: 'Password must be at least 6 characters'});
    } else {
      setErrors({...errors, password: ''});
    }
  };

  const onChangeFullName = (e) => {
    setFullName(e.target.value);
  };
  
  const onChangePhoneNumber = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    const phoneRegex = /^\+?[0-9\s-()]{8,15}$/;
    if (value && !phoneRegex.test(value)) {
      setErrors({...errors, phoneNumber: 'Please enter a valid phone number'});
    } else {
      setErrors({...errors, phoneNumber: ''});
    }
  };

  const onChangeRole = (e) => {
    setRole(e.target.value);
    // Set userType to null for admin and instructor roles
    if (e.target.value === 'admin' || e.target.value === 'instructor') {
      setUserType(null);
    }
  };

  const onChangeUserType = (e) => {
    setUserType(e.target.value);
  };

  const validateForm = () => {
    const newErrors = {
      username: '',
      email: '',
      password: '',
      phoneNumber: ''
    };
    
    let isValid = true;
    
    if (!username || !email || !password || !fullName) {
      setMessage('All fields are required');
      return false;
    }
    
    if (username.length < 3 || username.length > 20) {
      newErrors.username = 'Username must be between 3 and 20 characters';
      isValid = false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    if (phoneNumber) {
      const phoneRegex = /^\+?[0-9\s-()]{8,15}$/;
      if (!phoneRegex.test(phoneNumber)) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage('');
    setSuccessful(false);
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await register(username, email, password, fullName, phoneNumber, role, userType);
      setMessage(response.data.message || 'Registration successful! You can now login.');
      setSuccessful(true);
      
      // Auto-login after successful registration
      setTimeout(async () => {
        try {
          await login(username, password);
          if (role === 'admin') {
            navigate('/admin-dashboard');
          } else if (role === 'instructor') {
            navigate('/instructor-dashboard');
          } else {
            navigate('/student-dashboard');
          }
        } catch (loginError) {
          // If auto-login fails, redirect to login page
          navigate('/login');
        }
      }, 2000); // Wait 2 seconds to show success message before auto-login
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
          <h2>Sign Up</h2>

          <form onSubmit={handleRegister}>
            {!successful && (
              <div>
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="fullName"
                    value={fullName}
                    onChange={onChangeFullName}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={username}
                    onChange={onChangeUsername}
                  />
                  {errors.username && <div className="validation-error">{errors.username}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={email}
                    onChange={onChangeEmail}
                  />
                  {errors.email && <div className="validation-error">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={password}
                    onChange={onChangePassword}
                  />
                  {errors.password && <div className="validation-error">{errors.password}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phoneNumber"
                    value={phoneNumber}
                    onChange={onChangePhoneNumber}
                    placeholder="e.g. +1234567890"
                  />
                  {errors.phoneNumber && <div className="validation-error">{errors.phoneNumber}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    className="form-control"
                    name="role"
                    value={role}
                    onChange={onChangeRole}
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {role === 'student' && (
                  <div className="form-group">
                    <label htmlFor="userType">User Type</label>
                    <select
                      className="form-control"
                      name="userType"
                      value={userType}
                      onChange={onChangeUserType}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="PROFESSIONAL">Professional</option>
                      <option value="PLACEMENT_TRAINING">Placement Training</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <button className="btn btn-primary btn-block" disabled={loading}>
                    {loading && (
                      <span className="spinner-border spinner-border-sm"></span>
                    )}
                    Sign Up
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div className="form-group">
                <div
                  className={
                    successful ? "alert alert-success" : "alert alert-danger"
                  }
                  role="alert"
                >
                  {message}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 