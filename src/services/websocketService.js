import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(token) {
    if (this.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.client = new Client({
        brokerURL: 'ws://localhost:8080/ws',
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = (frame) => {
        console.log('Connected to WebSocket:', frame);
        this.connected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      this.client.onStompError = (frame) => {
        console.error('STOMP error:', frame);
        this.connected = false;
        reject(new Error('WebSocket connection failed'));
      };

      this.client.onWebSocketError = (error) => {
        console.error('WebSocket error:', error);
        this.connected = false;
        this.handleReconnect();
      };

      this.client.onDisconnect = () => {
        console.log('Disconnected from WebSocket');
        this.connected = false;
        this.handleReconnect();
      };

      this.client.activate();
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        const token = localStorage.getItem('token');
        if (token) {
          this.connect(token).catch(console.error);
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.clear();
      this.client.deactivate();
      this.connected = false;
    }
  }

  subscribe(destination, callback) {
    if (!this.connected || !this.client) {
      console.warn('WebSocket not connected, cannot subscribe to:', destination);
      return null;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.subscriptions.set(destination, subscription);
    return subscription;
  }

  unsubscribe(destination) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  send(destination, message) {
    if (!this.connected || !this.client) {
      console.warn('WebSocket not connected, cannot send message to:', destination);
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(message)
    });
  }

  // Chat-specific methods
  subscribeToChat(conversationId, callback) {
    return this.subscribe(`/topic/chat/${conversationId}`, callback);
  }

  subscribeToBloodGroupChat(chatId, callback) {
    return this.subscribe(`/topic/blood-group-chat/${chatId}`, callback);
  }

  subscribeToNotifications(userId, userType, callback) {
    return this.subscribe(`/topic/notifications/${userType}/${userId}`, callback);
  }

  sendChatMessage(conversationId, message) {
    this.send('/app/chat.send', {
      conversationId,
      ...message
    });
  }

  sendTypingIndicator(conversationId, userId, isTyping) {
    this.send('/app/chat.typing', {
      conversationId,
      userId,
      isTyping
    });
  }
}

export default new WebSocketService();