import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import { connectWebSocket, disconnectWebSocket } from './services/socket';
import './index.css';

function App() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Connect to WebSocket
    const socket = connectWebSocket({
      onConnect: () => {
        setConnectionStatus('connected');
        toast.success('Connected to real-time dashboard');
      },
      onDisconnect: () => {
        setConnectionStatus('disconnected');
        toast.error('Disconnected from server');
      },
      onAlert: (alert) => {
        setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
        toast(alert.message, {
          icon: '🚨',
          duration: 5000,
        });
      },
      onDemoEvent: (event) => {
        console.log('Demo event:', event);
        if (event.type === 'demo_completed') {
          toast.success('Demo completed successfully! 🎉');
        }
      }
    });

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <div className="app-container">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <div style={{ fontSize: '2rem' }}>🚰</div>
            <div>
              <h1>JalSetu</h1>
              <div className="logo-subtitle">Smart Water Management System | Solapur</div>
            </div>
          </div>
          
          <div className="header-actions">
            <div className={`status-badge ${connectionStatus === 'connected' ? 'status-success' : 'status-danger'}`}>
              {connectionStatus === 'connected' ? '● Live' : '● Offline'}
            </div>
            <button className="btn btn-secondary">
              <span>👤</span>
              Operator Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Dashboard alerts={alerts} />
      </main>

      <footer style={{
        padding: '1rem 2rem',
        background: '#1f2937',
        color: 'white',
        textAlign: 'center',
        fontSize: '0.875rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p>© 2024 JalSetu - Smart Governance Hackathon Project | MIT Vishwaprayag University × Solapur Municipal Corporation</p>
          <p style={{ opacity: 0.8, marginTop: '0.5rem' }}>
            Real-time water management system for Solapur | Data refreshes every 10 seconds
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;