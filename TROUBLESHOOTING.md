# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Network Error" or "ERR_CONNECTION_REFUSED"

This error occurs when the frontend can't connect to the backend server.

**Solution:**

1. **Start the Backend Server:**

   ```bash
   # Navigate to the backend directory
   cd demo/demo

   # Option 1: Using Maven wrapper (recommended)
   ./mvnw spring-boot:run

   # Option 2: Using the batch file (Windows)
   start-app.bat

   # Option 3: If you have Maven installed globally
   mvn spring-boot:run
   ```

2. **Verify Backend is Running:**

   - Open your browser and go to `http://localhost:8080`
   - You should see a response (even if it's an error page, it means the server is running)
   - Check the console for "Started DemoApplication" message

3. **Check Database Connection:**
   - Make sure PostgreSQL is running
   - Verify database credentials in `application.properties`
   - The backend uses Neon PostgreSQL, so internet connection is required

### 2. CORS Issues

If you see CORS-related errors:

**Solution:**

- The backend is already configured with `@CrossOrigin(origins = "*")`
- Make sure the backend is running on port 8080
- Clear browser cache and try again

### 3. Authentication Issues

If login/signup doesn't work after backend is running:

**Solution:**

1. Check browser console for detailed error messages
2. Verify the request is reaching the backend (check backend console logs)
3. Make sure the database tables are created (Spring Boot auto-creates them)

### 4. Port Already in Use

If you get "Port 8080 is already in use":

**Solution:**

```bash
# Find what's using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change the port in application.properties
server.port=8081
```

### 5. Database Connection Issues

If you see database connection errors:

**Solution:**

1. Check your internet connection (using Neon cloud database)
2. Verify the database URL in `application.properties`
3. Make sure the database credentials are correct

## Development Setup Checklist

- [ ] Backend server is running on `http://localhost:8080`
- [ ] Frontend server is running on `http://localhost:5173`
- [ ] Database connection is working
- [ ] No CORS errors in browser console
- [ ] JWT tokens are being generated and stored

## Quick Test

1. Start backend: `cd demo/demo && ./mvnw spring-boot:run`
2. Start frontend: `cd frontend/Health && npm run dev`
3. Open `http://localhost:5173`
4. Try to register a new patient account
5. If successful, you should be redirected to the patient dashboard

## Getting Help

If you're still having issues:

1. Check the browser console (F12) for error messages
2. Check the backend console for error logs
3. Verify all dependencies are installed:
   - Frontend: `npm install`
   - Backend: Maven dependencies should auto-download

## Environment Variables

Make sure you have the correct environment variables:

**Frontend (.env file):**

```
VITE_API_BASE_URL=http://localhost:8080/api
```

**Backend (application.properties):**

```
server.port=8080
spring.datasource.url=jdbc:postgresql://ep-rough-pine-abcb7w4j-pooler.eu-west-2.aws.neon.tech:5432/neondb?sslmode=require
```
