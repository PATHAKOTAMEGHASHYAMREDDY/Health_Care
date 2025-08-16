import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const ChatList = ({ onSelectConversation, selectedConversation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  const getOtherParticipant = (conversation) => {
    return user.role === 'PATIENT' ? conversation.doctor : conversation.patient;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <MessageCircle className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">No conversations yet</p>
        <p className="text-sm">
          {user.role === 'PATIENT' 
            ? 'Book an appointment to start chatting with doctors'
            : 'Conversations will appear when patients message you'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherParticipant = getOtherParticipant(conversation);
        const isSelected = selectedConversation?.id === conversation.id;
        
        return (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              isSelected
                ? 'bg-blue-50 border-2 border-blue-200'
                : 'bg-white hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {otherParticipant?.profileImage ? (
                  <img
                    src={otherParticipant.profileImage}
                    alt={otherParticipant.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.role === 'PATIENT' ? 'Dr. ' : ''}{otherParticipant?.name}
                  </p>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatLastMessageTime(conversation.lastMessageAt)}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 truncate">
                  {user.role === 'PATIENT' 
                    ? otherParticipant?.specialization 
                    : 'Patient'
                  }
                </p>
                
                {conversation.conversationType && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    {conversation.conversationType.toLowerCase()}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ChatList;