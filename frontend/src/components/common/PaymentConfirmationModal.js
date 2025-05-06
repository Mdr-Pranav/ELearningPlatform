import React from 'react';
import './PaymentConfirmationModal.css';

const PaymentConfirmationModal = ({ isOpen, onClose, onConfirm, courseTitle, coursePrice }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="payment-confirm-modal">
        <div className="payment-confirm-header">
          <h3>Confirm Payment</h3>
          <button className="close-button" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="payment-confirm-body">
          <div className="course-details">
            <h4>{courseTitle}</h4>
            <div className="course-price">
              <i className="bi bi-currency-rupee"></i>
              {coursePrice}
            </div>
          </div>
          <div className="payment-methods">
            <h5>Select Payment Method</h5>
            <div className="payment-options">
              <div className="payment-option">
                <i className="bi bi-phone"></i>
                <span>UPI</span>
              </div>
              <div className="payment-option">
                <i className="bi bi-credit-card"></i>
                <span>Credit/Debit Card</span>
              </div>
              <div className="payment-option">
                <i className="bi bi-bank"></i>
                <span>Net Banking</span>
              </div>
            </div>
          </div>
        </div>
        <div className="payment-confirm-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-button" onClick={onConfirm}>
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmationModal; 