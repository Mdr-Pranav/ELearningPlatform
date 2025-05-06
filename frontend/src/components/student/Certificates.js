import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authHeader from '../../services/auth-header';
import './StudentComponents.css';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      console.log('Starting to fetch certificates...');
      console.log('Auth headers:', authHeader());
      
      const response = await axios.get(
        'http://localhost:8080/api/student/certificates',
        { headers: authHeader() }
      );
      
      console.log('Raw API Response:', response);
      console.log('Certificates data:', response.data);
      
      if (Array.isArray(response.data)) {
        console.log('Number of certificates:', response.data.length);
        setCertificates(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Received invalid data format from server');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      setError(error.response?.data || 'Failed to load certificates');
      setLoading(false);
    }
  };

  const handleViewCertificate = async (certificateId) => {
    try {
      console.log('Fetching certificate details for ID:', certificateId);
      const response = await axios.get(
        `http://localhost:8080/api/student/certificates/${certificateId}`,
        { headers: authHeader() }
      );
      console.log('Certificate details response:', response.data);
      setSelectedCertificate(response.data);
    } catch (error) {
      console.error('Error fetching certificate details:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const handleCloseCertificate = () => {
    setSelectedCertificate(null);
  };

  const handleDownloadCertificate = async (certificateId, certificate) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/student/certificates/${certificateId}`,
        { headers: authHeader() }
      );
      
      const certificateData = response.data;
      
      // Create a new window for the certificate
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Certificate</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Roboto:wght@300;400;700&display=swap');
              
              @media print {
                body {
                  margin: 0;
                  padding: 20px;
                }
                .certificate-template {
                  page-break-inside: avoid;
                  width: 100%;
                  height: 100%;
                }
                @page {
                  size: landscape;
                  margin: 0;
                }
              }
              
              body {
                margin: 0;
                padding: 20px;
                background: white;
                font-family: 'Roboto', sans-serif;
              }
              
              .certificate-template {
                position: relative;
                width: 800px;
                height: 600px;
                margin: 0 auto;
                padding: 40px;
                background: #fff;
                border: 2px solid #e0e0e0;
                text-align: center;
                font-family: 'Playfair Display', serif;
              }
              
              .certificate-template::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0wIDBoODAwdjYwMEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=');
                opacity: 0.1;
                pointer-events: none;
              }
              
              .certificate-template h1 {
                font-size: 36px;
                color: #2c3e50;
                margin-bottom: 30px;
                font-weight: 700;
              }
              
              .certificate-text {
                font-size: 18px;
                color: #34495e;
                margin: 20px 0;
                line-height: 1.6;
              }
              
              .student-name {
                font-size: 32px;
                color: #2c3e50;
                margin: 30px 0;
                font-weight: 700;
              }
              
              .certificate-footer {
                position: absolute;
                bottom: 40px;
                left: 0;
                right: 0;
                display: flex;
                justify-content: space-between;
                padding: 0 40px;
              }
              
              .instructor-signature {
                text-align: left;
              }
              
              .instructor-signature p {
                font-size: 20px;
                color: #2c3e50;
                margin: 0;
                font-weight: 700;
              }
              
              .instructor-signature span {
                font-size: 16px;
                color: #7f8c8d;
              }
              
              .certificate-info {
                text-align: right;
              }
              
              .certificate-info p {
                font-size: 14px;
                color: #7f8c8d;
                margin: 5px 0;
              }
              
              .certificate-seal {
                position: absolute;
                top: 40px;
                right: 40px;
                width: 100px;
                height: 100px;
                border: 3px solid #3498db;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fff;
              }
              
              .certificate-seal span {
                font-size: 14px;
                color: #3498db;
                font-weight: 700;
                text-align: center;
                line-height: 1.4;
              }
            </style>
          </head>
          <body>
            <div class="certificate-template">
              <h1>Certificate of Completion</h1>
              <p class="certificate-text">This is to certify that</p>
              <h2 class="student-name">${certificateData.studentName}</h2>
              <p class="certificate-text">
                Graduated with honors from the ${certificateData.courseName} course.<br/>
                Performed well with reporting, delved into planning and budgeting.
              </p>
              <div class="certificate-footer">
                <div class="instructor-signature">
                  <p>${certificateData.instructorName}</p>
                  <span>Course Instructor</span>
                </div>
                <div class="certificate-info">
                  <p>Certificate ID: ${certificateData.certificateNumber}</p>
                  <p>Awarded on: ${certificateData.issuedAt ? new Date(certificateData.issuedAt).toLocaleDateString() : 'Not available'}</p>
                </div>
              </div>
              <div class="certificate-seal">
                <span>Verified<br/>✓</span>
              </div>
            </div>
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again.');
    }
  };

  if (loading) return (
    <div className="loading">
      <i className="fas fa-spinner fa-spin"></i>
      Loading certificates...
    </div>
  );
  
  if (error) return (
    <div className="error">
      <i className="fas fa-exclamation-circle"></i>
      {error}
    </div>
  );

  console.log('Rendering certificates:', certificates);

  return (
    <div className="certificates-container">
      <h2>My Certificates</h2>
      
      {(!certificates || certificates.length === 0) ? (
        <div className="no-certificates">
          <i className="fas fa-certificate"></i>
          <p>You haven't completed any courses yet. Complete a course to earn a certificate!</p>
        </div>
      ) : (
        <div className="certificates-grid">
          {certificates.map((certificate) => {
            console.log('Rendering certificate:', certificate);
            return (
              <div key={certificate.id} className="certificate-card">
                <div className="certificate-header">
                  <h3>{certificate.courseName || 'Untitled Course'}</h3>
                  <span className="certificate-number">{certificate.certificateNumber}</span>
                </div>
                <div className="certificate-details">
                  <p><strong>Instructor:</strong> {certificate.instructorName || 'Unknown Instructor'}</p>
                  <p><strong>Issued:</strong> {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'Not available'}</p>
                </div>
                <button
                  className="btn-view-certificate"
                  onClick={() => handleViewCertificate(certificate.id)}
                >
                  <i className="fas fa-eye"></i>
                  View Certificate
                </button>
                <button
                  className="btn-download-certificate"
                  onClick={() => handleDownloadCertificate(certificate.id, certificate)}
                >
                  <i className="fas fa-download"></i>
                  Download Certificate
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedCertificate && (
        <div className="certificate-modal">
          <div className="certificate-modal-content">
            <div className="certificate-template">
              <h1>Certificate of Completion</h1>
              <p className="certificate-text">This is to certify that</p>
              <h2 className="student-name">{selectedCertificate.studentName}</h2>
              <p className="certificate-text">
                Graduated with honors from the {selectedCertificate.courseName} course.<br/>
                Performed well with reporting, delved into planning and budgeting.
              </p>
              <div className="certificate-footer">
                <div className="instructor-signature">
                  <p>{selectedCertificate.instructorName}</p>
                  <span>Course Instructor</span>
                </div>
                <div className="certificate-info">
                  <p>Certificate ID: {selectedCertificate.certificateNumber}</p>
                  <p>Awarded on: {selectedCertificate.issuedAt ? new Date(selectedCertificate.issuedAt).toLocaleDateString() : 'Not available'}</p>
                </div>
              </div>
              <div className="certificate-seal">
                <span>Verified<br/>✓</span>
              </div>
            </div>
            <button className="btn-close" onClick={handleCloseCertificate}>
              <i className="fas fa-times"></i>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates; 