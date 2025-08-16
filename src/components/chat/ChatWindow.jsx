import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Video, MoreVertical, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import axios from 'axios';

const ChatWindow = ({ conversation, onClose, isOpen }) => {
  const { user } = useAuth();
  const { subscribeToChat, sendChatMessage, sendTypingIndicator, unsubscribe } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (conversation && isOpen) {
      fetchMessages();
      markMessagesAsRead();
      
      // Subscribe to real-time messages
      const subscription = subscribeToChat(conversation.id, handleRealTimeMessage);
      
      return () => {
        if (subscription) {
          unsubscribe(`/topic/chat/${conversation.id}`);
        }
      };
    }
  }, [conversation, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRealTimeMessage = (message) => {
    // Only add message if it's not from current user (to avoid duplicates)
    if (message.senderId !== user.id) {
      setMessages(prev => {
        // Check if message already exists
        const exists = prev.some(msg => msg.id === message.id);
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      });
      
      // Mark as read if chat is open
      if (isOpen) {
        markMessagesAsRead();
      }
    }
  };

  const fetchMessages = async () => {
    if (!conversation) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/chat/conversations/${conversation.id}/messages`);
      setMessages(response.data.content.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!conversation) return;
    
    try {
      await axios.put(`/api/chat/conversations/${conversation.id}/read`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (!typing && e.target.value.trim()) {
      setTyping(true);
      sendTypingIndicator(conversation.id, user.id, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      sendTypingIndicator(conversation.id, user.id, false);
    }, 1000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    // Stop typing indicator
    setTyping(false);
    sendTypingIndicator(conversation.id, user.id, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Optimistically add message to UI
    const tempMessage = {
      id: Date.now(),
      messageContent,
      senderId: user.id,
      senderType: user.role === 'PATIENT' ? 'PATIENT' : 'DOCTOR',
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await axios.post(`/api/chat/conversations/${conversation.id}/messages`, {
        content: messageContent
      });
      
      // Replace temp message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? response.data : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOtherParticipant = () => {
    if (!conversation) return null;
    return user.role === 'PATIENT' ? conversation.doctor : conversation.patient;
  };

  const otherParticipant = getOtherParticipant();

  if (!isOpen || !conversation) return null;

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
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {otherParticipant?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {user.role === 'PATIENT' ? 'Dr. ' : ''}{otherParticipant?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {user.role === 'PATIENT' ? otherParticipant?.specialization : 'Patient'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <MoreVertical className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>No messages yet</p>
                <p className="text-sm">Start a conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.senderId === user.id;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.messageContent}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
            {otherUserTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatWindow;