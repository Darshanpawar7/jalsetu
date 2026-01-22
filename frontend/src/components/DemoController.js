import React, { useState } from 'react';
import './DemoController.css';

const DemoController = ({ status, onStartDemo, onNextStep }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const demoSteps = [
    {
      id: 'citizen_complaint',
      title: 'Citizen Complaint',
      description: 'WhatsApp bot receives complaint from Nana Peth',
      icon: '📱'
    },
    {
      id: 'ticket_creation',
      title: 'Auto Ticket Generation',
      description: 'System creates ticket with unique ID',
      icon: '🎫'
    },
    {
      id: 'priority_calculation',
      title: 'Priority Engine',
      description: 'AI calculates P1 priority with 4-hour SLA',
      icon: '🤖'
    },
    {
      id: 'sensor_correlation',
      title: 'Sensor Correlation',
      description: 'Low pressure confirmed by nearby sensor',
      icon: '📡'
    },
    {
      id: 'je_assignment',
      title: 'JE Dispatch',
      description: 'Assigned to JE A. Deshmukh (8 years experience)',
      icon: '👷'
    },
    {
      id: 'field_work',
      title: 'Field Repair',
      description: 'Leak located and repaired at site',
      icon: '🔧'
    },
    {
      id: 'photo_verification',
      title: 'AI Verification',
      description: 'Before/after photos verified with 94% confidence',
      icon: '📸'
    },
    {
      id: 'resolution',
      title: 'Issue Resolution',
      description: 'Ticket closed, citizen notified via WhatsApp',
      icon: '✅'
    },
    {
      id: 'equity_update',
      title: 'Equity Index Update',
      description: 'Nana Peth equity score improves by +0.15',
      icon: '⚖️'
    }
  ];

  const handleStartDemo = () => {
    setCurrentStep(0);
    onStartDemo();
  };

  const handleNextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      onNextStep();
    }
  };

  const handleResetDemo = () => {
    setCurrentStep(0);
  };

  const getProgressPercentage = () => {
    return ((currentStep + 1) / demoSteps.length) * 100;
  };

  return (
    <div className="demo-controller">
      <div className="demo-header">
        <h3>Live Hackathon Demo</h3>
        <div className="demo-status">
          <span className={`status-indicator ${
            status === 'in_progress' ? 'active' : 'ready'
          }`}>
            {status === 'in_progress' ? '● LIVE' : '● READY'}
          </span>
        </div>
      </div>

      <div className="demo-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <div className="progress-text">
          Step {currentStep + 1} of {demoSteps.length}
        </div>
      </div>

      <div className="demo-steps">
        {demoSteps.map((step, index) => (
          <div 
            key={step.id}
            className={`demo-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'current' : ''}`}
          >
            <div className="step-icon">{step.icon}</div>
            <div className="step-content">
              <div className="step-title">
                {step.title}
                {index < currentStep && (
                  <span className="step-check">✓</span>
                )}
              </div>
              <div className="step-description">{step.description}</div>
            </div>
            <div className="step-number">{index + 1}</div>
          </div>
        ))}
      </div>

      <div className="demo-controls">
        {status !== 'in_progress' ? (
          <button 
            className="demo-btn start-btn"
            onClick={handleStartDemo}
          >
            🚀 Start Live Demo
          </button>
        ) : (
          <>
            <button 
              className="demo-btn next-btn"
              onClick={handleNextStep}
              disabled={currentStep >= demoSteps.length - 1}
            >
              ⏭️ Next Step
            </button>
            <button 
              className="demo-btn reset-btn"
              onClick={handleResetDemo}
            >
              🔄 Reset Demo
            </button>
          </>
        )}
      </div>

      <div className="demo-impact">
        <h4>Demo Impact Metrics</h4>
        <div className="impact-metrics">
          <div className="impact-metric">
            <div className="metric-value">75%</div>
            <div className="metric-label">Faster Resolution</div>
          </div>
          <div className="impact-metric">
            <div className="metric-value">25K</div>
            <div className="metric-label">Liters/Day Saved</div>
          </div>
          <div className="impact-metric">
            <div className="metric-value">94%</div>
            <div className="metric-label">Verification Accuracy</div>
          </div>
        </div>
      </div>

      <div className="demo-notes">
        <p>
          <strong>Note for Judges:</strong> This demo shows the complete 
          "complaint-to-resolution" workflow with real-time updates, 
          AI prioritization, and equity impact tracking.
        </p>
      </div>
    </div>
  );
};

export default DemoController;