import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on component mount
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await AuthService.login(username, password);
      setCurrentUser(response);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
    navigate('/');
  };

  const register = async (username, email, password, fullName, phoneNumber, role, userType) => {
    try {
      const response = await AuthService.register(username, email, password, fullName, phoneNumber, role, userType);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    register,
    isLoggedIn: !!currentUser,
    isInstructor: currentUser?.roles?.includes('ROLE_INSTRUCTOR'),
    isStudent: currentUser?.roles?.includes('ROLE_STUDENT'),
    isAdmin: currentUser?.roles?.includes('ROLE_ADMIN')
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 