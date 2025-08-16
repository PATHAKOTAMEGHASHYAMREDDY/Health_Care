import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle, Users, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';
import BloodGroupChatWindow from './BloodGroupChatWindow';
import CreateBloodGroupChatModal from './CreateBloodGroupChatModal';

const BloodGroupChat = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bloodGroupChats, setBloodGroupChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchBloodGroupChats();
  }, []);

  const fetchBloodGroupChats = async () => {
    setLoading(true);
    try {
      const endpoint = user.role === 'DOCTOR' 
        ? '/api/blood-group-chat/doctor' 
        : `/api/blood-group-chat/patient/${user.bloodGroup}`;
      
      const response = await axios.get(endpoint);
      setBloodGroupChats(response.data);
    } catch (error) {
      console.error('Error fetching blood group chats:', error);
      showToast('Failed to load blood group chats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'EMERGENCY':
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4" />;
      case 'MEDIUM':
        return <Clock className="w-4 h-4" />;
      case 'LOW':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleCreateChat = (newChat) => {
    setBloodGroupChats(prev => [newChat, ...prev]);
    setShowCreateModal(false);
    showToast('Blood group chat created successfully', 'success');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blood Group Emergency Chat</h2>
          <p className="text-gray-600 mt-1">
            {user.role === 'DOCTOR' 
              ? 'Create emergency blood donation requests' 
              : `Join emergency chats for blood group ${user.bloodGroup}`
            }
          </p>
        </div>
        {user.role === 'DOCTOR' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Emergency Chat</span>
          </motion.button>
        )}
      </div>

      {/* Blood Group Chats List */}
      <div className="grid gap-4">
        {bloodGroupChats.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Emergency Chats</h3>
            <p className="text-gray-600">
              {user.role === 'DOCTOR' 
                ? 'Create an emergency chat to request blood donations'
                : 'No emergency blood requests for your blood group at the moment'
              }
            </p>
          </div>
        ) : (
          bloodGroupChats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-all"
              onClick={() => setSelectedChat(chat)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(chat.priority)}`}>
                      {getPriorityIcon(chat.priority)}
                      <span>{chat.priority}</span>
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      {chat.bloodGroup}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      chat.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : chat.status === 'RESOLVED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {chat.status}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {chat.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {chat.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Dr. {chat.doctor?.name}</span>
                    <span>{formatTimeAgo(chat.createdAt)}</span>
                  </div>
                </div>
                
                <div className="ml-4 text-right">
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{chat.messageCount || 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Chat Window Modal */}
      <AnimatePresence>
        {selectedChat && (
          <BloodGroupChatWindow
            chat={selectedChat}
            isOpen={!!selectedChat}
            onClose={() => setSelectedChat(null)}
          />
        )}
      </AnimatePresence>

      {/* Create Chat Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateBloodGroupChatModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateChat={handleCreateChat}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BloodGroupChat;