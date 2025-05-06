import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-icon">
        {type === 'success' ? (
          <i className="bi bi-check-circle-fill"></i>
        ) : type === 'error' ? (
          <i className="bi bi-exclamation-circle-fill"></i>
        ) : (
          <i className="bi bi-info-circle-fill"></i>
        )}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>
        <i className="bi bi-x"></i>
      </button>
    </div>
  );
};

export default Toast; 