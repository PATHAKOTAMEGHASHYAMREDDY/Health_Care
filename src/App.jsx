import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import LandingPage from './pages/LandingPage';
import DoctorLogin from './pages/auth/DoctorLogin';
import DoctorSignup from './pages/auth/DoctorSignup';
import PatientLogin from './pages/auth/PatientLogin';
import PatientSignup from './pages/auth/PatientSignup';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import PatientDashboard from './pages/dashboard/PatientDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import BackendStatus from './components/BackendStatus';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <WebSocketProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
              <BackendStatus />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/doctor/login" element={<DoctorLogin />} />
                <Route path="/doctor/signup" element={<DoctorSignup />} />
                <Route path="/patient/login" element={<PatientLogin />} />
                <Route path="/patient/signup" element={<PatientSignup />} />
                <Route 
                  path="/doctor/dashboard" 
                  element={
                    <ProtectedRoute role="DOCTOR">
                      <DoctorDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/patient/dashboard" 
                  element={
                    <ProtectedRoute role="PATIENT">
                      <PatientDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </WebSocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;