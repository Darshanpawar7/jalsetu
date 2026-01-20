// pages/Dashboard.js
import React from 'react';
import MapView from '../components/MapView';
import ComplaintForm from '../components/ComplaintForm';

const Dashboard = () => {
  return (
    <div>
      <h2>JalSetu Water Dashboard</h2>
      <MapView />
      <ComplaintForm />
    </div>
  );
};

export default Dashboard;
