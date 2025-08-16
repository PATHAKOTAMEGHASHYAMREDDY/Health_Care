import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useToast } from '../../contexts/ToastContext';
import axios from 'axios';

const BloodGroupChatWindow = ({ chat, isOpen, onClose }) => {
  const { user } = useAuth();
  const { subscribeToBloodGroupChat, unsubscribe } = useWebSocket();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chat && isOpen) {
      fetchMessages();
      fetchParticipants();
      
      // Subscribe to real-time messages
      const subscription = subscribeToBloodGroupChat(chat.id, handleRealTimeMessage);
      
      return () => {
        if (subscription) {
          unsubscribe(`/topic/blood-group-chat/${chat.id}`);
        }
      };
    }
  }, [chat, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!chat) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/blood-group-chat/${chat.id}/messages`);
      setMessages(response.data.content || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    if (!chat) return;
    
    try {
      const response = await axios.get(`/api/blood-group-chat/${chat.id}/participants`);
      setParticipants(response.data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleRealTimeMessage = (message) => {
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === message.id);
      if (!exists) {
        return [...prev, message];
      }
      return prev;
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Optimistically add message to UI
    const tempMessage = {
      id: Date.now(),
      messageContent,
      senderId: user.id,
      senderType: user.role === 'PATIENT' ? 'PATIENT' : 'DOCTOR',
      senderName: user.name,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await axios.post(`/api/blood-group-chat/${chat.id}/messages`, {
        content: messageContent
      });
      
      // Replace temp message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? response.data : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const markChatAsResolved = async () => {
    if (user.role !== 'DOCTOR' || chat.status === 'RESOLVED') return;

    try {
      await axios.put(`/api/blood-group-chat/${chat.id}/resolve`);
      showToast('Chat marked as resolved', 'success');
      onClose();
    } catch (error) {
      console.error('Error resolving chat:', error);
      showToast('Failed to resolve chat', 'error');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  if (!isOpen || !chat) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      >
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[700px] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(chat.priority)}`}>
                {getPriorityIcon(chat.priority)}
                <span>{chat.priority}</span>
              </span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                {chat.bloodGroup}
              </span>
              <div>
                <h3 className="font-medium text-gray-900">{chat.title}</h3>
                <p className="text-sm text-gray-500">Dr. {chat.doctor?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {user.role === 'DOCTOR' && chat.status === 'ACTIVE' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={markChatAsResolved}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark Resolved</span>
                </motion.button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {/* Chat Description */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <p className="text-sm text-gray-700">{chat.description}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Users className="w-12 h-12 mb-4" />
                    <p>No messages yet</p>
                    <p className="text-sm">Be the first to respond to this emergency request!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === user.id;
                    const isDoctor = message.senderType === 'DOCTOR';
                    
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-xs lg:max-w-md">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-xs font-medium ${
                              isDoctor ? 'text-blue-600' : 'text-green-600'
                            }`}>
                              {isDoctor ? 'Dr. ' : ''}{message.senderName || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-red-600 text-white'
                                : isDoctor
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.messageContent}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {chat.status === 'ACTIVE' && (
                <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={user.role === 'DOCTOR' ? "Send update to patients..." : "Respond to emergency request..."}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Participants Sidebar */}
            <div className="w-64 border-l border-gray-200 bg-gray-50">
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Participants ({participants.length})
                </h4>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {participant.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {participant.role === 'DOCTOR' ? 'Dr. ' : ''}{participant.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {participant.role === 'DOCTOR' ? 'Doctor' : `${participant.bloodGroup} Donor`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BloodGroupChatWindow;