// Quick fix for authentication issues
export const fixAuth = () => {
  console.log("=== FIXING AUTHENTICATION ===");
  
  // Clear all stored authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Clear axios headers
  delete axios.defaults.headers.common['Authorization'];
  
  console.log("Authentication data cleared. Please log in again.");
  
  // Reload the page to reset the app state
  window.location.reload();
};

// Check if we need to fix auth on page load
export const checkAndFixAuth = () => {
  const token = localStorage.getItem('token');
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = Date.now() > payload.exp * 1000;
      
      if (isExpired) {
        console.log("Token is expired, clearing auth data");
        fixAuth();
        return false;
      }
      return true;
    } catch (e) {
      console.log("Invalid token, clearing auth data");
      fixAuth();
      return false;
    }
  }
  
  return false;
};