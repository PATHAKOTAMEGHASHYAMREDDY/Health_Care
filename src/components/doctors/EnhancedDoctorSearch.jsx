import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MapPin, Star, Calendar, User, Stethoscope, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';
import EnhancedAppointmentBooking from '../appointments/EnhancedAppointmentBooking';

const EnhancedDoctorSearch = ({ onAppointmentBooked }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filters, setFilters] = useState({
    specialization: '',
    experience: '',
    availability: '',
    rating: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const specializations = [
    'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
    'General Medicine', 'Neurology', 'Oncology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery'
  ];

  const experienceRanges = [
    { value: '0-2', label: '0-2 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '6-10', label: '6-10 years' },
    { value: '10+', label: '10+ years' }
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/doctors');
      setDoctors(response.data.map(doctor => ({
        ...doctor,
        rating: Math.random() * 2 + 3, // Mock rating between 3-5
        reviewCount: Math.floor(Math.random() * 100) + 10, // Mock review count
        nextAvailable: getNextAvailableSlot() // Mock next available slot
      })));
    } catch (error) {
      console.error('Error fetching doctors:', error);
      showToast('Failed to load doctors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getNextAvailableSlot = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + Math.floor(Math.random() * 7) + 1);
    return tomorrow.toLocaleDateString();
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSpecialization = !filters.specialization || 
                                   doctor.specialization === filters.specialization;
      
      const matchesExperience = !filters.experience || 
                               checkExperienceRange(doctor.experience, filters.experience);
      
      const matchesRating = !filters.rating || 
                           doctor.rating >= parseFloat(filters.rating);

      return matchesSearch && matchesSpecialization && matchesExperience && matchesRating;
    });
  }, [doctors, searchTerm, filters]);

  const checkExperienceRange = (experience, range) => {
    const exp = parseInt(experience);
    switch (range) {
      case '0-2':
        return exp >= 0 && exp <= 2;
      case '3-5':
        return exp >= 3 && exp <= 5;
      case '6-10':
        return exp >= 6 && exp <= 10;
      case '10+':
        return exp >= 10;
      default:
        return true;
    }
  };

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const handleAppointmentSuccess = (appointment) => {
    showToast('Appointment booked successfully!', 'success');
    setShowBookingModal(false);
    setSelectedDoctor(null);
    if (onAppointmentBooked) {
      onAppointmentBooked(appointment);
    }
  };

  const clearFilters = () => {
    setFilters({
      specialization: '',
      experience: '',
      availability: '',
      rating: ''
    });
    setSearchTerm('');
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search Bar */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search doctors by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </motion.button>
            
            {(filters.specialization || filters.experience || filters.rating || searchTerm) && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Specialization Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <select
                    value={filters.specialization}
                    onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All specializations</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                {/* Experience Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience
                  </label>
                  <select
                    value={filters.experience}
                    onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any experience</option>
                    {experienceRanges.map(range => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any rating</option>
                    <option value="4">4+ stars</option>
                    <option value="4.5">4.5+ stars</option>
                    <option value="5">5 stars</option>
                  </select>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <select
                    value={filters.availability}
                    onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any time</option>
                    <option value="today">Available today</option>
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600">
              {searchTerm || Object.values(filters).some(f => f)
                ? 'Try adjusting your search criteria or filters'
                : 'No doctors available at the moment'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dr. {doctor.name}
                      </h3>
                      <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{doctor.experience} years experience</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <div className="flex items-center space-x-1">
                            {renderStars(doctor.rating)}
                          </div>
                          <span>({doctor.reviewCount} reviews)</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 mt-2 text-sm text-green-600">
                        <Calendar className="w-4 h-4" />
                        <span>Next available: {doctor.nextAvailable}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 lg:items-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleBookAppointment(doctor)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Book Appointment
                    </motion.button>
                    
                    <p className="text-xs text-gray-500 text-center lg:text-right">
                      Multiple appointments allowed
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Appointment Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedDoctor && (
          <EnhancedAppointmentBooking
            doctor={selectedDoctor}
            isOpen={showBookingModal}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedDoctor(null);
            }}
            onSuccess={handleAppointmentSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedDoctorSearch;