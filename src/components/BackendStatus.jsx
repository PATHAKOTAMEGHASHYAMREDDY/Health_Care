import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const BackendStatus = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');

  const checkBackendStatus = async () => {
    setStatus('checking');
    setError('');
    
    try {
      // Try to hit a simple endpoint to check if backend is running
      const response = await axios.get('/doctors/all');
      setStatus('connected');
    } catch (error) {
      setStatus('disconnected');
      if (error.code === 'ERR_NETWORK') {
        setError('Backend server is not running on http://localhost:8080');
      } else {
        setError(`Connection error: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  if (status === 'connected') {
    return null; // Don't show anything if connected
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {status === 'checking' ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <div>
            <p className="font-medium">
              {status === 'checking' ? 'Checking backend connection...' : 'Backend Connection Error'}
            </p>
            {error && <p className="text-sm text-red-100">{error}</p>}
          </div>
        </div>
        
        <button
          onClick={checkBackendStatus}
          className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 px-3 py-1 rounded transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
      
      {status === 'disconnected' && (
        <div className="mt-3 text-sm text-red-100">
          <p><strong>To fix this:</strong></p>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Make sure the backend server is running</li>
            <li>Navigate to the <code>demo/demo</code> folder</li>
            <li>Run: <code>./mvnw spring-boot:run</code> or double-click <code>start-app.bat</code></li>
            <li>Wait for the server to start on port 8080</li>
          </ol>
        </div>
      )}
    </motion.div>
  );
};

export default BackendStatus;