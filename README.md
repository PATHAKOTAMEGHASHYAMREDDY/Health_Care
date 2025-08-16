# Healthcare Portal Frontend

A modern, responsive healthcare management system built with React, Tailwind CSS, and Framer Motion.

## Features

### 🏥 Landing Page
- Beautiful hero section with animated elements
- Feature highlights and statistics
- Responsive design with smooth animations
- Call-to-action buttons for both doctors and patients

### 🔐 Authentication System
- Separate login/signup pages for doctors and patients
- Form validation and error handling
- JWT token management
- Role-based routing

### 👨‍⚕️ Doctor Dashboard
- **Overview**: Statistics and recent appointments
- **Appointments Management**: View, confirm, complete, or cancel appointments
- **Profile Management**: Edit professional information
- Real-time appointment status updates

### 👤 Patient Dashboard
- **Overview**: Personal health statistics and quick actions
- **Appointment Booking**: Browse doctors and book appointments
- **Appointment History**: View all past and upcoming appointments
- **Profile Management**: Update personal information

## Tech Stack

- **React 19** - Frontend framework
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **Vite** - Build tool

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend/Health
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── LoadingSpinner.jsx
│   └── ProtectedRoute.jsx
├── contexts/           # React contexts
│   └── AuthContext.jsx
├── pages/             # Page components
│   ├── auth/          # Authentication pages
│   │   ├── DoctorLogin.jsx
│   │   ├── DoctorSignup.jsx
│   │   ├── PatientLogin.jsx
│   │   └── PatientSignup.jsx
│   ├── dashboard/     # Dashboard pages
│   │   ├── DoctorDashboard.jsx
│   │   └── PatientDashboard.jsx
│   └── LandingPage.jsx
├── App.jsx            # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## API Integration

The frontend integrates with the Spring Boot backend API:

### Authentication Endpoints
- `POST /api/doctors/login` - Doctor login
- `POST /api/doctors/register` - Doctor registration
- `POST /api/patients/login` - Patient login
- `POST /api/patients/register` - Patient registration

### Doctor Endpoints
- `GET /api/doctors/profile` - Get doctor profile
- `PUT /api/doctors/profile` - Update doctor profile
- `GET /api/doctors/appointments` - Get doctor's appointments
- `GET /api/doctors/all` - Get all doctors (for patients)

### Patient Endpoints
- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update patient profile
- `GET /api/patients/appointments` - Get patient's appointments

### Appointment Endpoints
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/{id}/status` - Update appointment status
- `GET /api/appointments/{id}` - Get appointment details

## Features in Detail

### 🎨 Design & UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion animations for enhanced user experience
- **Modern UI**: Clean, professional interface with Tailwind CSS
- **Accessibility**: Proper ARIA labels and keyboard navigation

### 🔒 Security
- JWT token authentication
- Protected routes based on user roles
- Secure API communication
- Input validation and sanitization

### 📱 Responsive Features
- Mobile-first design approach
- Adaptive layouts for different screen sizes
- Touch-friendly interface elements
- Optimized performance on all devices

### 🚀 Performance
- Lazy loading of components
- Optimized bundle size with Vite
- Efficient state management
- Minimal re-renders with React best practices

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.