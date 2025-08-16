import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import axios from "axios";
import {
  Calendar,
  Clock,
  User,
  Heart,
  LogOut,
  Edit,
  Save,
  Camera,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const { success, error, info } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: "",
    doctorNotes: "",
    rescheduledDateTime: "",
  });
  const [bloodSearchResults, setBloodSearchResults] = useState([]);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState("");
  const [bloodSearchLoading, setBloodSearchLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchPendingAppointments();
    fetchProfile();
  }, []);

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

  const fetchPendingAppointments = async () => {
    try {
      const response = await axios.get("/appointments/pending");
      setPendingAppointments(response.data);
      console.log("Fetched pending appointments:", response.data);
    } catch (error) {
      console.error("Error fetching pending appointments:", error);
    }
  }; 
 const fetchProfile = async () => {
    try {
      const response = await axios.get("/doctors/profile");
      setProfileData(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const searchPatientsByBloodGroup = async (bloodGroup) => {
    if (!bloodGroup) {
      setBloodSearchResults([]);
      return;
    }

    setBloodSearchLoading(true);
    try {
      const response = await axios.get(`/patients/search-by-blood-group?bloodGroup=${bloodGroup}`);
      setBloodSearchResults(response.data);
      console.log("Blood group search results:", response.data);
    } catch (err) {
      console.error("Error searching patients by blood group:", err);
      error("Failed to search patients: " + (err.response?.data?.message || err.message));
    } finally {
      setBloodSearchLoading(false);
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
      await axios.put("/doctors/profile", profileData);
      setEditingProfile(false);
      setImagePreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }; 
 const updateAppointmentStatus = async () => {
    try {
      if (!selectedAppointment) return;

      const requestData = {
        status: updateData.status,
        doctorNotes: updateData.doctorNotes,
      };

      if (updateData.status === 'RESCHEDULED' && updateData.rescheduledDateTime) {
        requestData.rescheduledDateTime = updateData.rescheduledDateTime;
      }

      console.log('Updating appointment with data:', requestData);

      await axios.put(`/appointments/${selectedAppointment.id}/status`, requestData);
      
      setShowUpdateModal(false);
      setSelectedAppointment(null);
      setUpdateData({ status: "", doctorNotes: "", rescheduledDateTime: "" });
      
      // Refresh appointments
      fetchAppointments();
      fetchPendingAppointments();
      
      success('Appointment updated successfully!');
    } catch (err) {
      console.error('Error updating appointment:', err);
      error('Failed to update appointment: ' + (err.response?.data?.message || err.message));
    }
  };

  const openUpdateModal = (appointment) => {
    setSelectedAppointment(appointment);
    setUpdateData({
      status: "",
      doctorNotes: appointment.doctorNotes || "",
      rescheduledDateTime: "",
    });
    setShowUpdateModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'RESCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'ACCEPTED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      case 'RESCHEDULED': return <Calendar className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  }; 
 const stats = [
    {
      title: 'Total Appointments',
      value: appointments.length,
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Requests',
      value: pendingAppointments.length,
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-yellow-500'
    },
    {
      title: 'Accepted',
      value: appointments.filter(apt => apt.status === 'ACCEPTED').length,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      title: 'Completed',
      value: appointments.filter(apt => apt.status === 'COMPLETED').length,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              <Heart className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Dr. {user?.name}</p>
                <p className="text-sm text-gray-500">Doctor</p>
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
            {['overview', 'appointments', 'pending', 'blood-search', 'profile'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'blood-search' ? 'Blood Search' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>        {
/* Overview Tab */}
        {activeTab === 'overview' && (
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
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>



            {/* Recent Appointments */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Appointments</h3>
              </div>
              <div className="p-6">
                {appointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {appointment.patientImage ? (
                          <img
                            src={appointment.patientImage}
                            alt={appointment.patientName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{appointment.patientName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(appointment.appointmentDateTime).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">{appointment.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1">{appointment.status}</span>
                      </span>
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No appointments yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}       
 {/* Pending Appointments Tab */}
        {activeTab === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Appointment Requests</h3>
            </div>
            <div className="p-6">
              {pendingAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending appointment requests.</p>
              ) : (
                <div className="space-y-6">
                  {pendingAppointments.map((appointment) => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {appointment.patientImage ? (
                              <img
                                src={appointment.patientImage}
                                alt={appointment.patientName}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-green-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900">{appointment.patientName}</h4>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                <strong>Date & Time:</strong> {new Date(appointment.appointmentDateTime).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Reason:</strong> {appointment.reason}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Phone:</strong> {appointment.patientPhone || 'Not provided'}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Email:</strong> {appointment.patientEmail}
                              </p>
                              {appointment.patientDateOfBirth && (
                                <p className="text-sm text-gray-600">
                                  <strong>Date of Birth:</strong> {appointment.patientDateOfBirth}
                                </p>
                              )}
                              {appointment.patientGender && (
                                <p className="text-sm text-gray-600">
                                  <strong>Gender:</strong> {appointment.patientGender}
                                </p>
                              )}
                              {appointment.patientBloodGroup && (
                                <p className="text-sm text-gray-600">
                                  <strong>Blood Group:</strong> {appointment.patientBloodGroup}
                                </p>
                              )}
                              {appointment.patientAddress && (
                                <p className="text-sm text-gray-600">
                                  <strong>Address:</strong> {appointment.patientAddress}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openUpdateModal(appointment)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Respond
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}    
    {/* All Appointments Tab */}
        {activeTab === 'appointments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">All Appointments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
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
                            {appointment.patientImage ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={appointment.patientImage}
                                alt={appointment.patientName}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-green-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                            <div className="text-sm text-gray-500">{appointment.patientPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(appointment.appointmentDateTime).toLocaleString()}
                        </div>
                        {appointment.rescheduledDateTime && (
                          <div className="text-sm text-blue-600">
                            Rescheduled to: {new Date(appointment.rescheduledDateTime).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{appointment.reason}</div>
                        {appointment.doctorNotes && (
                          <div className="text-sm text-gray-500 mt-1">
                            <strong>Notes:</strong> {appointment.doctorNotes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1">{appointment.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(appointment.status === 'PENDING' || appointment.status === 'ACCEPTED') && (
                          <button
                            onClick={() => openUpdateModal(appointment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Update
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
                </div>
              )}
            </div>
          </motion.div>
        )} 

        {/* Blood Search Tab */}
        {activeTab === 'blood-search' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Heart className="w-8 h-8 text-red-600" />
                <div>
                  <h3 className="text-xl font-medium text-gray-900">Emergency Blood Search</h3>
                  <p className="text-sm text-gray-600">Find patients with specific blood groups for urgent blood needs</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Blood Group
                  </label>
                  <select
                    id="bloodGroup"
                    value={selectedBloodGroup}
                    onChange={(e) => {
                      setSelectedBloodGroup(e.target.value);
                      searchPatientsByBloodGroup(e.target.value);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => searchPatientsByBloodGroup(selectedBloodGroup)}
                    disabled={!selectedBloodGroup || bloodSearchLoading}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {bloodSearchLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      'Search Patients'
                    )}
                  </button>
                </div>
              </div>

              {selectedBloodGroup && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-sm text-red-800">
                      <strong>Emergency Search:</strong> Showing patients with blood group {selectedBloodGroup} who have appointments with you.
                      Please contact them directly for urgent blood donation requests.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {bloodSearchResults.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900">
                    Patients with Blood Group {selectedBloodGroup} ({bloodSearchResults.length} found)
                  </h4>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bloodSearchResults.map((patient) => (
                      <div key={patient.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {patient.profileImage ? (
                              <img
                                src={patient.profileImage}
                                alt={patient.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-red-200"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <User className="w-8 w-8 text-red-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 truncate">{patient.name}</h5>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center">
                                <Heart className="w-4 h-4 text-red-500 mr-2" />
                                <span className="text-sm font-medium text-red-600">{patient.bloodGroup}</span>
                              </div>
                              {patient.phoneNumber && (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">{patient.phoneNumber}</span>
                                </div>
                              )}
                              {patient.email && (
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600 truncate">{patient.email}</span>
                                </div>
                              )}
                              {patient.address && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600 truncate">{patient.address}</span>
                                </div>
                              )}
                              {patient.age && (
                                <p className="text-sm text-gray-600">Age: {patient.age}</p>
                              )}
                              {patient.gender && (
                                <p className="text-sm text-gray-600">Gender: {patient.gender}</p>
                              )}
                            </div>
                            <div className="mt-3 flex space-x-2">
                              {patient.phoneNumber && (
                                <a
                                  href={`tel:${patient.phoneNumber}`}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
                                >
                                  <Phone className="w-3 h-3 mr-1" />
                                  Call
                                </a>
                              )}
                              {patient.email && (
                                <a
                                  href={`mailto:${patient.email}`}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                                >
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedBloodGroup && bloodSearchResults.length === 0 && !bloodSearchLoading && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Patients Found</h4>
                <p className="text-gray-600">
                  No patients with blood group {selectedBloodGroup} found in your appointment records.
                </p>
              </div>
            )}
          </motion.div>
        )}

       {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
              <button
                onClick={() => (editingProfile ? updateProfile() : setEditingProfile(true))}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingProfile ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                <span>{editingProfile ? "Save" : "Edit"}</span>
              </button>
            </div>
            <div className="p-6">
              {/* Profile Image Section */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">Profile Image</label>
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    {imagePreview || profileData.profileImage ? (
                      <div className="relative">
                        <img
                          src={imagePreview || profileData.profileImage}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
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
                      <div className="w-32 h-32 rounded-full bg-blue-100 border-4 border-dashed border-blue-300 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-blue-400" />
                      </div>
                    )}
                  </div>

                  {editingProfile && (
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <label
                          htmlFor="profileImageEdit"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {imagePreview || profileData.profileImage ? "Change Image" : "Upload Image"}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  {editingProfile ? (
                    <input
                      type="text"
                      value={profileData.name || ""}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <p className="text-gray-900">{profileData.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  {editingProfile ? (
                    <input
                      type="tel"
                      value={profileData.phoneNumber || ""}
                      onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.phoneNumber || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  {editingProfile ? (
                    <input
                      type="text"
                      value={profileData.specialization || ""}
                      onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.specialization || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                  {editingProfile ? (
                    <input
                      type="number"
                      value={profileData.experience || ""}
                      onChange={(e) => setProfileData({ ...profileData, experience: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.experience || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                  {editingProfile ? (
                    <input
                      type="text"
                      value={profileData.qualification || ""}
                      onChange={(e) => setProfileData({ ...profileData, qualification: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.qualification || "Not provided"}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  {editingProfile ? (
                    <textarea
                      value={profileData.address || ""}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.address || "Not provided"}</p>
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )} 
     </div>

      {/* Update Appointment Modal */}
      {showUpdateModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Update Appointment
                </h3>
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedAppointment(null);
                    setUpdateData({ status: "", doctorNotes: "", rescheduledDateTime: "" });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-3 mb-4">
                  {selectedAppointment.patientImage ? (
                    <img
                      src={selectedAppointment.patientImage}
                      alt={selectedAppointment.patientName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{selectedAppointment.patientName}</p>
                    <p className="text-sm text-gray-500">{selectedAppointment.reason}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedAppointment.appointmentDateTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="ACCEPTED">Accept</option>
                    <option value="REJECTED">Reject</option>
                    <option value="RESCHEDULED">Reschedule</option>
                    <option value="COMPLETED">Mark as Completed</option>
                  </select>
                </div>

                {updateData.status === 'RESCHEDULED' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={updateData.rescheduledDateTime}
                      onChange={(e) => setUpdateData({...updateData, rescheduledDateTime: e.target.value})}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor's Notes (Optional)
                  </label>
                  <textarea
                    value={updateData.doctorNotes}
                    onChange={(e) => setUpdateData({...updateData, doctorNotes: e.target.value})}
                    rows="3"
                    placeholder="Add any notes for the patient..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedAppointment(null);
                    setUpdateData({ status: "", doctorNotes: "", rescheduledDateTime: "" });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateAppointmentStatus}
                  disabled={!updateData.status || (updateData.status === 'RESCHEDULED' && !updateData.rescheduledDateTime)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Update Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;