// Solapur Municipal Corporation Ward Data
// Source: Public data and approximations for demo purposes

export const solapurWards = [
  {
    id: 1,
    name: 'Nana Peth',
    coordinates: { lat: 17.6833, lng: 75.9167 },
    population: 45000,
    avgSupplyHours: 8,
    equityScore: 0.6,
    description: 'Historic residential area with water access challenges',
    issues: ['Low pressure', 'Irregular timing', 'Old pipelines'],
    priority: 'HIGH'
  },
  {
    id: 2,
    name: 'Sadar Bazaar',
    coordinates: { lat: 17.6711, lng: 75.9012 },
    population: 52000,
    avgSupplyHours: 16,
    equityScore: 1.2,
    description: 'Commercial hub with better water infrastructure',
    issues: ['Peak hour shortages', 'Leakage complaints'],
    priority: 'MEDIUM'
  },
  {
    id: 3,
    name: 'Akkalkot Road',
    coordinates: { lat: 17.6923, lng: 75.8894 },
    population: 38000,
    avgSupplyHours: 12,
    equityScore: 0.9,
    description: 'Mixed residential and industrial area',
    issues: ['Pressure fluctuations', 'Quality concerns'],
    priority: 'MEDIUM'
  },
  {
    id: 4,
    name: 'North Solapur',
    coordinates: { lat: 17.7102, lng: 75.9034 },
    population: 55000,
    avgSupplyHours: 10,
    equityScore: 0.7,
    description: 'Rapidly developing residential area',
    issues: ['Supply timing', 'New connection requests'],
    priority: 'HIGH'
  },
  {
    id: 5,
    name: 'Central Solapur',
    coordinates: { lat: 17.6598, lng: 75.9201 },
    population: 48000,
    avgSupplyHours: 14,
    equityScore: 1.1,
    description: 'Administrative and institutional area',
    issues: ['Old infrastructure', 'Maintenance delays'],
    priority: 'MEDIUM'
  },
  {
    id: 6,
    name: 'Uppar Bazaar',
    coordinates: { lat: 17.6765, lng: 75.9312 },
    population: 42000,
    avgSupplyHours: 11,
    equityScore: 0.8,
    description: 'Traditional market area with dense population',
    issues: ['Leakage', 'Waste water mixing'],
    priority: 'HIGH'
  },
  {
    id: 7,
    name: 'Mangalwar Peth',
    coordinates: { lat: 17.6689, lng: 75.9123 },
    population: 39000,
    avgSupplyHours: 13,
    equityScore: 1.0,
    description: 'Well-established residential colony',
    issues: ['Seasonal shortages', 'Pipeline corrosion'],
    priority: 'MEDIUM'
  },
  {
    id: 8,
    name: 'Tembhurni Road',
    coordinates: { lat: 17.7012, lng: 75.8945 },
    population: 35000,
    avgSupplyHours: 12,
    equityScore: 0.85,
    description: 'Peripheral area with mixed land use',
    issues: ['Distance from source', 'Pressure issues'],
    priority: 'MEDIUM'
  }
];

export const waterSources = [
  {
    id: 1,
    name: 'Solapur Main Reservoir',
    type: 'reservoir',
    capacity: '25 MLD',
    coordinates: { lat: 17.6931, lng: 75.9284 },
    status: 'operational',
    serving: ['Nana Peth', 'Sadar Bazaar', 'Central Solapur']
  },
  {
    id: 2,
    name: 'North Zone Pumping Station',
    type: 'pumping_station',
    capacity: '15 MLD',
    coordinates: { lat: 17.7156, lng: 75.9112 },
    status: 'operational',
    serving: ['North Solapur', 'Tembhurni Road']
  },
  {
    id: 3,
    name: 'Central Filtration Plant',
    type: 'treatment_plant',
    capacity: '40 MLD',
    coordinates: { lat: 17.6684, lng: 75.9056 },
    status: 'operational',
    serving: ['All wards']
  }
];

export const initialSensorData = [
  {
    sensor_id: 'sensor-np-01',
    ward_id: 1,
    coordinates: { lat: 17.6845, lng: 75.9172 },
    type: 'pressure_flow',
    installed: '2024-01-15',
    status: 'active'
  },
  {
    sensor_id: 'sensor-sb-01',
    ward_id: 2,
    coordinates: { lat: 17.6723, lng: 75.9021 },
    type: 'pressure_flow',
    installed: '2024-01-10',
    status: 'active'
  },
  {
    sensor_id: 'sensor-ar-01',
    ward_id: 3,
    coordinates: { lat: 17.6918, lng: 75.8901 },
    type: 'pressure',
    installed: '2024-01-20',
    status: 'active'
  },
  {
    sensor_id: 'sensor-ns-01',
    ward_id: 4,
    coordinates: { lat: 17.7098, lng: 75.9041 },
    type: 'pressure_flow',
    installed: '2024-02-01',
    status: 'active'
  },
  {
    sensor_id: 'sensor-cs-01',
    ward_id: 5,
    coordinates: { lat: 17.6602, lng: 75.9213 },
    type: 'quality',
    installed: '2024-01-25',
    status: 'active'
  }
];

export const mockComplaints = [
  {
    id: 1,
    ward: 'Nana Peth',
    issue: 'No water supply since yesterday morning',
    status: 'pending',
    created_at: '2024-02-10T08:30:00Z',
    priority: 'P1'
  },
  {
    id: 2,
    ward: 'Sadar Bazaar',
    issue: 'Low pressure in evening hours',
    status: 'in_progress',
    created_at: '2024-02-10T10:15:00Z',
    priority: 'P2'
  },
  {
    id: 3,
    ward: 'Akkalkot Road',
    issue: 'Water leakage near main road',
    status: 'resolved',
    created_at: '2024-02-09T14:20:00Z',
    priority: 'P1'
  }
];

export default {
  solapurWards,
  waterSources,
  initialSensorData,
  mockComplaints
};