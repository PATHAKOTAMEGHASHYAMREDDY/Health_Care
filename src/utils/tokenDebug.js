// Token debugging utility
export const debugToken = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('=== TOKEN DEBUG ===');
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length);
  console.log('Token preview:', token?.substring(0, 50) + '...');
  console.log('User data:', user);
  
  if (token) {
    try {
      // Decode JWT payload (without verification)
      const parts = token.split('.');
      console.log('Token parts count:', parts.length);
      
      if (parts.length === 3) {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        
        console.log('Token header:', header);
        console.log('Token payload:', payload);
        console.log('Token expires:', new Date(payload.exp * 1000));
        console.log('Token issued:', new Date(payload.iat * 1000));
        console.log('Current time:', new Date());
        console.log('Is expired:', Date.now() >= payload.exp * 1000);
        console.log('Time until expiry:', Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60), 'minutes');
        
        // Check token structure
        console.log('Token subject (email):', payload.sub);
        console.log('Token role:', payload.role);
        console.log('Token userId:', payload.userId);
      } else {
        console.error('Invalid token format - should have 3 parts separated by dots');
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      console.log('Raw token:', token);
    }
  }
  console.log('=== END DEBUG ===');
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};