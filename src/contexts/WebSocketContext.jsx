import React, { createContext, useContext, useEffect, useState } from 'react';
import websocketService from '../services/websocketService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const { user, token } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user && token) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, token]);

  const connectWebSocket = async () => {
    if (!token) return;

    try {
      setConnectionStatus('connecting');
      await websocketService.connect(token);
      setConnected(true);
      setConnectionStatus('connected');
      
      // Subscribe to user notifications
      if (user) {
        websocketService.subscribeToNotifications(
          user.id, 
          user.role?.toLowerCase() || 'patient', 
          handleNotification
        );
      }
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnected(false);
      setConnectionStatus('error');
      showToast('Connection lost. Some features may not work properly.', 'warning');
    }
  };

  const disconnectWebSocket = () => {
    websocketService.disconnect();
    setConnected(false);
    setConnectionStatus('disconnected');
  };

  const handleNotification = (notification) => {
    console.log('Received notification:', notification);
    
    // Show toast notification
    showToast(notification.content || notification.message, 'info');
    
    // You can add more notification handling logic here
    // For example, updating unread message counts, appointment notifications, etc.
  };

  const subscribeToChat = (conversationId, callback) => {
    return websocketService.subscribeToChat(conversationId, callback);
  };

  const subscribeToBloodGroupChat = (chatId, callback) => {
    return websocketService.subscribeToBloodGroupChat(chatId, callback);
  };

  const sendChatMessage = (conversationId, message) => {
    websocketService.sendChatMessage(conversationId, message);
  };

  const sendTypingIndicator = (conversationId, userId, isTyping) => {
    websocketService.sendTypingIndicator(conversationId, userId, isTyping);
  };

  const unsubscribe = (destination) => {
    websocketService.unsubscribe(destination);
  };

  const value = {
    connected,
    connectionStatus,
    subscribeToChat,
    subscribeToBloodGroupChat,
    sendChatMessage,
    sendTypingIndicator,
    unsubscribe,
    reconnect: connectWebSocket
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};