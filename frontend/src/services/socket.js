import { io } from 'socket.io-client';

let socket = null;

export const connectWebSocket = (callbacks = {}) => {
  // Disconnect existing connection if any
  if (socket) {
    socket.disconnect();
  }

  const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
  
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Connection events
  socket.on('connect', () => {
    console.log('✅ WebSocket connected');
    if (callbacks.onConnect) callbacks.onConnect();
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ WebSocket disconnected:', reason);
    if (callbacks.onDisconnect) callbacks.onDisconnect();
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  // Real-time data events
  socket.on('welcome', (data) => {
    console.log('WebSocket welcome:', data);
  });

  socket.on('new_complaint', (complaint) => {
    console.log('New complaint via WebSocket:', complaint);
    if (callbacks.onNewComplaint) callbacks.onNewComplaint(complaint);
  });

  socket.on('ticket_created', (ticket) => {
    console.log('Ticket created via WebSocket:', ticket);
    if (callbacks.onTicketCreated) callbacks.onTicketCreated(ticket);
  });

  socket.on('ticket_updated', (ticket) => {
    console.log('Ticket updated via WebSocket:', ticket);
    if (callbacks.onTicketUpdate) callbacks.onTicketUpdate(ticket);
  });

  socket.on('sensor_data', (data) => {
    console.log('Sensor data via WebSocket:', data);
    if (callbacks.onSensorUpdate) callbacks.onSensorUpdate(data);
  });

  socket.on('sensor_anomaly', (anomaly) => {
    console.log('Sensor anomaly via WebSocket:', anomaly);
    if (callbacks.onSensorAnomaly) callbacks.onSensorAnomaly(anomaly);
  });

  socket.on('critical_alert', (alert) => {
    console.log('Critical alert via WebSocket:', alert);
    if (callbacks.onCriticalAlert) callbacks.onCriticalAlert(alert);
  });

  socket.on('alert', (alert) => {
    console.log('Alert via WebSocket:', alert);
    if (callbacks.onAlert) callbacks.onAlert(alert);
  });

  socket.on('real_time_update', (update) => {
    console.log('Real-time update:', update);
    if (callbacks.onRealTimeUpdate) callbacks.onRealTimeUpdate(update);
  });

  // Demo events
  socket.on('demo_event', (event) => {
    console.log('Demo event via WebSocket:', event);
    if (callbacks.onDemoEvent) callbacks.onDemoEvent(event);
  });

  socket.on('demo_started', (data) => {
    console.log('Demo started via WebSocket:', data);
    if (callbacks.onDemoStarted) callbacks.onDemoStarted(data);
  });

  socket.on('demo_step_result', (result) => {
    console.log('Demo step result via WebSocket:', result);
    if (callbacks.onDemoStepResult) callbacks.onDemoStepResult(result);
  });

  socket.on('demo_completed', (data) => {
    console.log('Demo completed via WebSocket:', data);
    if (callbacks.onDemoCompleted) callbacks.onDemoCompleted(data);
  });

  // MQTT status
  socket.on('mqtt_status', (status) => {
    console.log('MQTT status via WebSocket:', status);
    if (callbacks.onMqttStatus) callbacks.onMqttStatus(status);
  });

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('WebSocket disconnected');
  }
};

export const emitEvent = (eventName, data) => {
  if (socket && socket.connected) {
    socket.emit(eventName, data);
    return true;
  }
  console.warn('WebSocket not connected, cannot emit:', eventName);
  return false;
};

export const getSocket = () => {
  return socket;
};

export const isConnected = () => {
  return socket && socket.connected;
};