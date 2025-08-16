import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { debugToken } from '../utils/tokenDebug';
import { Bug, Eye, EyeOff } from 'lucide-react';

const AuthDebugPanel = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  
  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  const handleDebugToken = () => {
    debugToken();
  };

  const testEndpoint = async (endpoint, name) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/auth-test/${endpoint}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`${name} test response status:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`${name} test success:`, data);
        alert(`${name} test successful!\n\nDetails:\n${JSON.stringify(data, null, 2)}`);
      } else {
        const errorText = await response.text();
        console.log(`${name} test failed:`, response.status, errorText);
        alert(`${name} test failed: ${response.status} ${response.statusText}\n\nError: ${errorText}`);
      }
    } catch (error) {
      console.error(`${name} test error:`, error);
      alert(`${name} test error: ${error.message}`);
    }
  };

  const testProtectedEndpoint = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/auth-test/protected', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Protected test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Protected test success:', data);
        alert(`Protected endpoint test successful!\n\nDetails:\n${JSON.stringify(data, null, 2)}`);
      } else {
        const errorText = await response.text();
        console.log('Protected test failed:', response.status, errorText);
        alert(`Protected test failed: ${response.status} ${response.statusText}\n\nError: ${errorText}`);
      }
    } catch (error) {
      console.error('Protected test error:', error);
      alert(`Protected test error: ${error.message}`);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
          title="Show Debug Panel"
        >
          <Bug className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Bug className="w-4 h-4 mr-2" />
          Auth Debug
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>User:</strong> {user ? user.name : 'Not logged in'}
        </div>
        <div>
          <strong>Role:</strong> {user ? user.role : 'None'}
        </div>
        <div>
          <strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}
        </div>
        
        <div className="flex flex-col gap-1 mt-3">
          <button
            onClick={handleDebugToken}
            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
          >
            Debug Token
          </button>
          <button
            onClick={() => testEndpoint('public', 'Public')}
            className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600 transition-colors"
          >
            Test Public
          </button>
          <button
            onClick={() => testEndpoint('protected', 'Protected')}
            className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors"
          >
            Test Protected
          </button>
          <button
            onClick={() => testEndpoint('patient-only', 'Patient Only')}
            className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 transition-colors"
          >
            Test Patient
          </button>
          <button
            onClick={() => testEndpoint('doctor-only', 'Doctor Only')}
            className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
          >
            Test Doctor
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPanel;