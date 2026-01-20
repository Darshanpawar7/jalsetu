// components/ComplaintForm.js
import React, { useState } from 'react';
import { submitComplaint } from '../services/api';

const ComplaintForm = () => {
  const [form, setForm] = useState({
    user_id: 1, // Hardcoded for now
    issue: '',
    location: '',
    photo: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await submitComplaint(form);
      setStatus('✅ Complaint submitted!');
      console.log(res);
    } catch (err) {
      console.error(err);
      setStatus('❌ Error submitting complaint.');
    }
  };

  return (
    <div>
      <h3>📣 Report Water Issue</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          name="issue"
          placeholder="Describe the problem (e.g. low pressure, no water)"
          value={form.issue}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="location"
          placeholder='e.g. "POINT(75.91 17.68)"'
          value={form.location}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="photo"
          placeholder="Photo URL (optional)"
          value={form.photo}
          onChange={handleChange}
        />
        <button type="submit">Submit Complaint</button>
      </form>
      <p>{status}</p>
    </div>
  );
};

export default ComplaintForm;
