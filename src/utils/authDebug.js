import axios from "axios";

// Authentication debugging utility
export const debugAuth = () => {
  console.log("=== AUTH DEBUG INFO ===");
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log("Token exists:", !!token);
  console.log("User data exists:", !!user);
  
  if (token) {
    console.log("Token length:", token.length);
    console.log("Token starts with Bearer:", token.startsWith('Bearer'));
    
    // Try to decode JWT payload (without verification)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log("Token payload:", payload);
      console.log("Token expires at:", new Date(payload.exp * 1000));
      console.log("Token is expired:", Date.now() > payload.exp * 1000);
      console.log("User ID from token:", payload.userId);
      console.log("Role from token:", payload.role);
    } catch (e) {
      console.error("Failed to decode token:", e);
    }
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log("User data:", userData);
    } catch (e) {
      console.error("Failed to parse user data:", e);
    }
  }
  
  console.log("=== END AUTH DEBUG ===");
};

export const clearAuthData = () => {
  console.log("Clearing all authentication data...");
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  console.log("Authentication data cleared");
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() > payload.exp * 1000;
  } catch (e) {
    return true;
  }
};