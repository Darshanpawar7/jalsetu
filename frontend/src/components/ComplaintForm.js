// frontend/src/components/ComplaintForm.js
import React, { useState } from 'react';
import { submitComplaint } from '../services/api'; // <-- corrected path
import './ComplaintForm.css';
import { toast } from 'react-hot-toast'; // optional, if you use toasts

const ComplaintForm = () => {
  const [form, setForm] = useState({
    phone: '',
    issue: '',
    ward: '',
    location: '',
    photo: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const solapurWards = [
    'Nana Peth', 'Sadar Bazaar', 'Akkalkot Road', 'North Solapur',
    'Central Solapur', 'Uppar Bazaar', 'Mangalwar Peth', 'Tembhurni Road'
  ];

  const commonIssues = [
    'No water supply',
    'Low water pressure',
    'Water leakage',
    'Dirty water',
    'Irregular timing',
    'Tanker requirement',
    'Other issue'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleIssueSelect = (issue) => {
    setForm(prev => ({ ...prev, issue }));
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setForm(prev => ({ ...prev, location: `POINT(${longitude} ${latitude})` }));
          setStatus({ type: 'success', message: 'Location captured successfully' });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setStatus({ type: 'error', message: 'Unable to get location. Please enter manually.' });
        }
      );
    } else {
      setStatus({ type: 'error', message: 'Geolocation not supported by your browser' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.phone || !form.issue) {
      setStatus({ type: 'error', message: 'Phone number and issue description are required' });
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(form.phone.replace(/\D/g, ''))) {
      setStatus({ type: 'error', message: 'Please enter a valid Indian phone number' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const payload = {
        phone: `+91${form.phone}`,
        issue: form.issue,
        ward_name: form.ward,
        location: form.location || `POINT(75.9167 17.6833)`,
        photo_url: form.photo
      };

      // submitComplaint returns backend response body
      const result = await submitComplaint(payload);

      // Defensive: check backend's success field explicitly
      if (result && result.success === true) {
        const ticketText = result.ticketId ? ` Ticket #${result.ticketId}.` : '';
        const msg = result.message || `Complaint submitted successfully.${ticketText}`;
        setStatus({ type: 'success', message: msg });
        if (typeof toast === 'function') toast.success(msg);

        // reset form
        setForm({ phone: '', issue: '', ward: '', location: '', photo: '' });

        // optionally notify other parts of UI (socket handles real-time updates as well)
      } else {
        // backend returned success: false (rare)
        const msg = result?.message || 'Failed to submit complaint. Please try again.';
        setStatus({ type: 'error', message: msg });
        if (typeof toast === 'function') toast.error(msg);
      }
    } catch (error) {
      // error normalized by api.js interceptor -> object with .message
      console.error('Complaint submission error:', error);
      const msg = (error && error.message) ? error.message : 'Failed to submit complaint. Please try again.';
      setStatus({ type: 'error', message: msg });
      if (typeof toast === 'function') toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complaint-form">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h4>Report Water Issue</h4>
          <p className="form-subtitle">Submit via WhatsApp: <strong>+91-XXXXXXXXXX</strong></p>
        </div>

        {/* Phone */}
        <div className="form-group">
          <label className="form-label">📱 Your Phone Number *</label>
          <div className="phone-input">
            <span className="country-code">+91</span>
            <input
              type="tel"
              name="phone"
              placeholder="9876543210"
              value={form.phone}
              onChange={handleChange}
              className="form-input"
              required
              maxLength="10"
            />
          </div>
          <small className="form-help">We'll send WhatsApp confirmation to this number</small>
        </div>

        {/* Ward */}
        <div className="form-group">
          <label className="form-label">🏙️ Select Ward</label>
          <select name="ward" value={form.ward} onChange={handleChange} className="form-input">
            <option value="">Select your ward</option>
            {solapurWards.map(ward => <option key={ward} value={ward}>{ward}</option>)}
          </select>
        </div>

        {/* Issues */}
        <div className="form-group">
          <label className="form-label">🚰 What's the Issue? *</label>
          <div className="issue-buttons">
            {commonIssues.map(issue => (
              <button
                key={issue}
                type="button"
                className={`issue-btn ${form.issue === issue ? 'selected' : ''}`}
                onClick={() => handleIssueSelect(issue)}
              >
                {issue}
              </button>
            ))}
          </div>
        </div>

        {/* Additional details */}
        <div className="form-group">
          <label className="form-label">📝 Additional Details (Optional)</label>
          <textarea
            name="issue"
            placeholder="Describe the issue in detail. Include timing, duration, and any other relevant information..."
            value={form.issue}
            onChange={handleChange}
            className="form-input form-textarea"
            rows="3"
          />
        </div>

        {/* Location */}
        <div className="form-group">
          <label className="form-label">📍 Location</label>
          <div className="location-input">
            <input
              type="text"
              name="location"
              placeholder='e.g. "Near Hanuman Temple, Nana Peth"'
              value={form.location}
              onChange={handleChange}
              className="form-input"
            />
            <button type="button" className="location-btn" onClick={handleCurrentLocation}>📍 Use My Location</button>
          </div>
          <small className="form-help">Enter address or use GPS location</small>
        </div>

        {/* Photo */}
        <div className="form-group">
          <label className="form-label">📸 Upload Photo (Optional)</label>
          <input type="text" name="photo" placeholder="Paste image URL or upload later via WhatsApp"
            value={form.photo} onChange={handleChange} className="form-input" />
          <small className="form-help">You can send photos via WhatsApp after submitting</small>
        </div>

        {/* Status */}
        {status.message && <div className={`status-message ${status.type}`}>{status.type === 'success' ? '✅' : '❌'} {status.message}</div>}

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (<><span className="spinner" /> Submitting...</>) : '🚀 Submit Complaint'}
          </button>
          <p className="form-note">By submitting, you agree to receive updates via WhatsApp</p>
        </div>
      </form>
    </div>
  );
};

export default ComplaintForm;
