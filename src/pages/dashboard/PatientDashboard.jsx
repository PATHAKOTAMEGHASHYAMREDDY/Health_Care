import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { debugToken } from "../../utils/tokenDebug";
import {
  debugAuth,
  clearAuthData,
  isTokenExpired,
} from "../../utils/authDebug";
import axios from "axios";
import {
  Calendar,
  Plus,
  Clock,
  User,
  Heart,
  LogOut,
  Edit,
  Save,
  Stethoscope,
  Camera,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingData, setBookingData] = useState({
    appointmentDateTime: "",
    reason: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  useEffect(() => {
    fetchAppointments();
    fetchProfile();
    fetchDoctors();
  }, []);

  useEffect(() => {
    // Filter doctors based on search term
    if (searchTerm.trim() === "") {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  }, [searchTerm, doctors]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get("/appointments/my-appointments");
      setAppointments(response.data);
      console.log("Fetched appointments:", response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get("/patients/profile");
      setProfileData(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("/doctors/all");
      setDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setImageError("Please select a valid image file (JPEG, PNG, or GIF)");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageError("Image size should be less than 5MB");
      return;
    }

    setImageError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      setProfileData({
        ...profileData,
        profileImage: base64String,
      });
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileData({
      ...profileData,
      profileImage: "",
    });
    setImagePreview(null);
    setImageError("");
    const fileInput = document.getElementById("profileImageEdit");
    if (fileInput) fileInput.value = "";
  };

  const updateProfile = async () => {
    try {
      await axios.put("/patients/profile", profileData);
      setEditingProfile(false);
      setImagePreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const testAuthEndpoint = async () => {
    try {
      console.log("=== TESTING AUTH ENDPOINT ===");
      debugAuth();

      // Check if token is expired before making request
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please log in again.");
        logout();
        return;
      }

      if (isTokenExpired(token)) {
        alert("Token has expired. Please log in again.");
        logout();
        return;
      }

      // Test the auth-test endpoint first
      console.log("Testing auth-test endpoint...");
      const authTestResponse = await axios.get("/auth-test/protected");
      console.log("Auth test successful:", authTestResponse.data);

      alert("Authentication test successful! Token is working.");
      return authTestResponse.data;
    } catch (error) {
      console.error("Auth test failed:", error);
      debugAuth();

      let errorMessage = "Authentication test failed: ";
      if (error.response?.status === 403) {
        errorMessage +=
          "Access forbidden (403) - Token might be invalid or expired. Please log out and log back in.";
        // Auto logout on 403
        setTimeout(() => logout(), 2000);
      } else if (error.response?.status === 401) {
        errorMessage += "Unauthorized (401) - Authentication required";
        logout();
        return;
      } else if (error.response?.status === 500) {
        errorMessage += "Server error (500) - Backend issue";
      } else if (error.code === "ERR_NETWORK") {
        errorMessage += "Network error - Backend server might not be running";
      } else {
        errorMessage += error.message;
      }

      alert(errorMessage);
      throw error;
    }
  };

  const bookAppointment = async () => {
    try {
      debugToken();

      if (!bookingData.appointmentDateTime) {
        alert("Please select a date and time for the appointment");
        return;
      }

      if (!selectedDoctor?.id) {
        alert("Please select a doctor");
        return;
      }

      if (!bookingData.reason || bookingData.reason.trim() === "") {
        alert("Please provide a reason for the appointment");
        return;
      }

      let formattedDateTime = bookingData.appointmentDateTime;
      if (formattedDateTime && !formattedDateTime.includes(":")) {
        formattedDateTime += ":00";
      }

      const appointmentRequest = {
        doctorId: selectedDoctor.id,
        appointmentDateTime: formattedDateTime,
        reason: bookingData.reason.trim(),
      };

      console.log("=== FRONTEND APPOINTMENT BOOKING ===");
      console.log("Booking appointment with data:", appointmentRequest);
      console.log("Current user:", user);
      console.log("Selected Doctor:", selectedDoctor);

      const response = await axios.post("/appointments", appointmentRequest);
      console.log("=== APPOINTMENT BOOKING SUCCESS ===");
      console.log("Response:", response.data);

      setShowBookingModal(false);
      setBookingData({ appointmentDateTime: "", reason: "" });
      setSelectedDoctor(null);
      fetchAppointments();

      alert(
        "Appointment request sent successfully! The doctor will respond to your request."
      );
    } catch (error) {
      console.error("=== APPOINTMENT BOOKING ERROR ===");
      console.error("Error booking appointment:", error);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      console.error("Error message:", error.response?.data?.message);

      debugToken();

      let errorMessage = "Failed to book appointment";

      if (error.response?.status === 403) {
        errorMessage =
          "Access denied. Your session may have expired. Please log out and log back in.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
        logout();
        return;
      } else if (error.response?.status === 400) {
        const backendMessage = error.response?.data;
        if (typeof backendMessage === "string") {
          errorMessage = backendMessage;
        } else {
          errorMessage =
            backendMessage?.message ||
            "Invalid appointment data. Please check your input.";
        }
      } else if (error.code === "ERR_NETWORK") {
        errorMessage =
          "Cannot connect to server. Please check your connection.";
      } else if (error.response?.data) {
        const backendMessage = error.response.data;
        if (typeof backendMessage === "string") {
          errorMessage = backendMessage;
        } else {
          errorMessage = backendMessage?.message || errorMessage;
        }
      }

      alert(errorMessage);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      await axios.put(`/appointments/${appointmentId}/cancel`);
      alert("Appointment cancelled successfully");
      fetchAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert(
        "Failed to cancel appointment: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "RESCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "ACCEPTED":
        return <CheckCircle className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      case "RESCHEDULED":
        return <Calendar className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const stats = [
    {
      title: "Total Appointments",
      value: appointments.length,
      icon: <Calendar className="w-6 h-6" />,
      color: "bg-blue-500",
    },
    {
      title: "Pending",
      value: appointments.filter((apt) => apt.status === "PENDING").length,
      icon: <Clock className="w-6 h-6" />,
      color: "bg-yellow-500",
    },
    {
      title: "Accepted",
      value: appointments.filter((apt) => apt.status === "ACCEPTED").length,
      icon: <CheckCircle className="w-6 h-6" />,
      color: "bg-green-500",
    },
    {
      title: "Available Doctors",
      value: doctors.length,
      icon: <User className="w-6 h-6" />,
      color: "bg-purple-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Patient Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name}
                </p>
                <p className="text-sm text-gray-500">Patient</p>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {["overview", "appointments", "doctors", "chat", "profile"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow p-6"
                >
                  <div className="flex items-center">
                    <div className={`${stat.color} text-white p-3 rounded-lg`}>
                      {stat.icon}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Appointments */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Appointments
                </h3>
              </div>
              <div className="p-6">
                {appointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 rounded-full p-2">
                        <Stethoscope className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Dr. {appointment.doctorName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.doctorSpecialization}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            appointment.appointmentDateTime
                          ).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1">{appointment.status}</span>
                      </span>
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No appointments yet. Book your first appointment!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
        {/* Appointments Tab */}
        {activeTab === "appointments" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                My Appointments
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {appointment.doctorImage ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={appointment.doctorImage}
                                alt={`Dr. ${appointment.doctorName}`}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Stethoscope className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Dr. {appointment.doctorName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.doctorSpecialization}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(
                            appointment.appointmentDateTime
                          ).toLocaleString()}
                        </div>
                        {appointment.rescheduledDateTime && (
                          <div className="text-sm text-blue-600">
                            Rescheduled to:{" "}
                            {new Date(
                              appointment.rescheduledDateTime
                            ).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {appointment.reason}
                        </div>
                        {appointment.doctorNotes && (
                          <div className="text-sm text-gray-500 mt-1">
                            <strong>Doctor's Note:</strong>{" "}
                            {appointment.doctorNotes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1">{appointment.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {appointment.status === "PENDING" && (
                          <button
                            onClick={() => cancelAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {appointments.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No appointments found.</p>
                  <button
                    onClick={() => setActiveTab("doctors")}
                    className="mt-2 text-green-600 hover:text-green-800"
                  >
                    Book your first appointment
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {/* Doctors Tab */}
        {activeTab === "doctors" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">
                  Available Doctors
                </h3>
                <div className="w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search by doctor name or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              {filteredDoctors.length === 0 && searchTerm.trim() !== "" ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 text-lg">
                    No doctors found matching "{searchTerm}"
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Try searching by doctor name or specialization
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0">
                          {doctor.profileImage ? (
                            <img
                              src={doctor.profileImage}
                              alt={`Dr. ${doctor.name}`}
                              className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                              <Stethoscope className="w-8 h-8 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            Dr. {doctor.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {doctor.specialization}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {doctor.experience && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Experience:</span>{" "}
                            {doctor.experience} years
                          </p>
                        )}
                        {doctor.qualification && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Qualification:</span>{" "}
                            {doctor.qualification}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setShowBookingModal(true);
                        }}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Book Appointment
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        You can book multiple appointments with this doctor
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Profile Information
              </h3>
              <button
                onClick={() =>
                  editingProfile ? updateProfile() : setEditingProfile(true)
                }
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingProfile ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Edit className="w-4 h-4" />
                )}
                <span>{editingProfile ? "Save" : "Edit"}</span>
              </button>
            </div>
            <div className="p-6">
              {/* Profile Image Section */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Profile Image
                </label>
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    {imagePreview || profileData.profileImage ? (
                      <div className="relative">
                        <img
                          src={imagePreview || profileData.profileImage}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover border-4 border-green-200 shadow-lg"
                        />
                        {editingProfile && (
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-green-100 border-4 border-dashed border-green-300 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-green-400" />
                      </div>
                    )}
                  </div>

                  {editingProfile && (
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <label
                          htmlFor="profileImageEdit"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {imagePreview || profileData.profileImage
                            ? "Change Image"
                            : "Upload Image"}
                        </label>
                        <input
                          id="profileImageEdit"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Upload your photo (JPEG, PNG, GIF - Max 5MB)
                      </p>
                      {imageError && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {imageError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  {editingProfile ? (
                    <input
                      type="text"
                      value={profileData.name || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900">{profileData.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {editingProfile ? (
                    <input
                      type="tel"
                      value={profileData.phoneNumber || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {profileData.phoneNumber || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  {editingProfile ? (
                    <input
                      type="date"
                      value={profileData.dateOfBirth || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {profileData.dateOfBirth || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  {editingProfile ? (
                    <select
                      value={profileData.gender || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          gender: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {profileData.gender || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group
                  </label>
                  {editingProfile ? (
                    <select
                      value={profileData.bloodGroup || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          bloodGroup: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Blood Group</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        )
                      )}
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {profileData.bloodGroup || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  {editingProfile ? (
                    <textarea
                      value={profileData.address || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          address: e.target.value,
                        })
                      }
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {profileData.address || "Not provided"}
                    </p>
                  )}
                </div>
              </div>

              {editingProfile && (
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setImagePreview(null);
                      setImageError("");
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Book Appointment with Dr. {selectedDoctor.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  You can book multiple appointments with the same doctor
                </p>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedDoctor(null);
                    setBookingData({ appointmentDateTime: "", reason: "" });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-3 mb-4">
                  {selectedDoctor.profileImage ? (
                    <img
                      src={selectedDoctor.profileImage}
                      alt={`Dr. ${selectedDoctor.name}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedDoctor.specialization}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedDoctor.experience} years experience
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={bookingData.appointmentDateTime}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        appointmentDateTime: e.target.value,
                      })
                    }
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Visit
                  </label>
                  <textarea
                    value={bookingData.reason}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, reason: e.target.value })
                    }
                    rows="3"
                    placeholder="Please describe your symptoms or reason for the appointment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedDoctor(null);
                    setBookingData({ appointmentDateTime: "", reason: "" });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={bookAppointment}
                  disabled={
                    !bookingData.appointmentDateTime ||
                    !bookingData.reason.trim()
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
