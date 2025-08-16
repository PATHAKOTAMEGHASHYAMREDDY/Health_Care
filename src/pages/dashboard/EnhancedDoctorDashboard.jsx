import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import axios from "axios";

const EnhancedDoctorDashboard = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [appointmentsRes, patientsRes] = await Promise.all([
        axios.get("/doctors/appointments", { headers }),
        axios.get("/doctors/patients", { headers }),
      ]);

      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);

      // Calculate stats
      const today = new Date().toDateString();
      const todayAppointments = appointmentsRes.data.filter(
        (apt) => new Date(apt.appointmentDateTime).toDateString() === today
      ).length;

      const pending = appointmentsRes.data.filter(
        (apt) => apt.status === "PENDING"
      ).length;
      const completed = appointmentsRes.data.filter(
        (apt) => apt.status === "COMPLETED"
      ).length;

      setStats({
        totalPatients: patientsRes.data.length,
        todayAppointments,
        pendingAppointments: pending,
        completedAppointments: completed,
      });
    } catch (err) {
      error("Failed to load dashboard data. Please try again.");
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentUpdate = async (appointmentId, status, notes = "") => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/appointments/${appointmentId}`,
        { status, doctorNotes: notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchDashboardData();
      setShowModal(false);
      setSelectedAppointment(null);
      success(`Appointment ${status.toLowerCase()} successfully!`);
    } catch (err) {
      error("Failed to update appointment. Please try again.");
      console.error("Error updating appointment:", err);
    }
  };

  const StatCard = ({ title, value, icon, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p
              className={`text-sm mt-1 ${
                trend > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend > 0 ? "↗" : "↘"} {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
        <div className={`text-4xl ${color.replace("border-l-", "text-")}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  const AppointmentCard = ({ appointment }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-blue-500"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {appointment.patient?.name}
          </h3>
          <p className="text-gray-600 text-sm">{appointment.reason}</p>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span className="mr-4">
              📅{" "}
              {new Date(appointment.appointmentDateTime).toLocaleDateString()}
            </span>
            <span>
              🕐{" "}
              {new Date(appointment.appointmentDateTime).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              appointment.status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : appointment.status === "ACCEPTED"
                ? "bg-blue-100 text-blue-800"
                : appointment.status === "COMPLETED"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {appointment.status}
          </span>
          <button
            onClick={() => {
              setSelectedAppointment(appointment);
              setShowModal(true);
            }}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Manage
          </button>
        </div>
      </div>
    </motion.div>
  );

  const PatientCard = ({ patient }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          {patient.name?.charAt(0)}
        </div>
        <div className="ml-4 flex-1">
          <h3 className="font-semibold text-gray-900">{patient.name}</h3>
          <p className="text-gray-600 text-sm">{patient.email}</p>
          <p className="text-gray-500 text-xs">
            Blood Group: {patient.bloodGroup || "N/A"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {patient.appointments?.length || 0} appointments
          </p>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1">
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );

  const AppointmentModal = () => (
    <AnimatePresence>
      {showModal && selectedAppointment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Manage Appointment</h2>
            <div className="mb-4">
              <p>
                <strong>Patient:</strong> {selectedAppointment.patient?.name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(
                  selectedAppointment.appointmentDateTime
                ).toLocaleString()}
              </p>
              <p>
                <strong>Reason:</strong> {selectedAppointment.reason}
              </p>
              <p>
                <strong>Status:</strong> {selectedAppointment.status}
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() =>
                  handleAppointmentUpdate(selectedAppointment.id, "ACCEPTED")
                }
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() =>
                  handleAppointmentUpdate(selectedAppointment.id, "COMPLETED")
                }
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
              >
                Complete
              </button>
              <button
                onClick={() =>
                  handleAppointmentUpdate(selectedAppointment.id, "CANCELLED")
                }
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, Dr. {user?.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.specialization} • {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                📧 Messages
              </button>
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                🩸 Blood Group Chat
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon="👥"
            color="border-l-blue-500"
            trend={5}
          />
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon="📅"
            color="border-l-green-500"
            trend={12}
          />
          <StatCard
            title="Pending Appointments"
            value={stats.pendingAppointments}
            icon="⏳"
            color="border-l-yellow-500"
            trend={-3}
          />
          <StatCard
            title="Completed This Week"
            value={stats.completedAppointments}
            icon="✅"
            color="border-l-purple-500"
            trend={8}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {["overview", "appointments", "patients", "analytics"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Recent Appointments */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Recent Appointments
                </h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {appointments.slice(0, 5).map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              </div>

              {/* Recent Patients */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Patients</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {patients.slice(0, 5).map((patient) => (
                    <PatientCard key={patient.id} patient={patient} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "appointments" && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold mb-4">All Appointments</h2>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "patients" && (
            <motion.div
              key="patients"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold mb-4">My Patients</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Analytics</h2>
              <p className="text-gray-600">
                Analytics dashboard coming soon...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AppointmentModal />
    </div>
  );
};

export default EnhancedDoctorDashboard;
