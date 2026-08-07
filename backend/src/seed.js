require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { v4: uuidv4 } = require('uuid');
const { db, recalculateQueue } = require('./db');

db.exec(`DELETE FROM tokens; DELETE FROM queues;`);

const queues = [
  {
    id: 'queue-movies-001',
    service_name: 'PVR Cinemas — Ticket Counter',
    provider_id: 'provider-movies',
    description: 'Movie ticket collection, seat upgrades, F&B combos & group bookings',
    token_prefix: 'C',
    avg_service_time: 5,
    status: 'active',
  },
  {
    id: 'queue-clinic-001',
    service_name: 'City Medical Center',
    provider_id: 'provider-001',
    description: 'OPD consultations, diagnostics, blood tests & specialist referrals',
    token_prefix: 'M',
    avg_service_time: 15,
    status: 'active',
  },
  {
    id: 'queue-train-001',
    service_name: 'Indian Railways Booking',
    provider_id: 'provider-002',
    description: 'Train ticket reservations, cancellations, PNR enquiry & passes',
    token_prefix: 'T',
    avg_service_time: 12,
    status: 'active',
  },
  {
    id: 'queue-flight-001',
    service_name: 'Airport Services Counter',
    provider_id: 'provider-003',
    description: 'Flight booking, web check-in, baggage claim & boarding passes',
    token_prefix: 'F',
    avg_service_time: 10,
    status: 'active',
  },
];

const insertQueue = db.prepare(`
  INSERT INTO queues (id, service_name, provider_id, description, token_prefix, avg_service_time, status)
  VALUES (@id, @service_name, @provider_id, @description, @token_prefix, @avg_service_time, @status)
`);
for (const q of queues) insertQueue.run(q);

const counters = { 'queue-movies-001': 0, 'queue-clinic-001': 0, 'queue-train-001': 0, 'queue-flight-001': 0 };
function nextToken(queueId) {
  counters[queueId]++;
  const prefix = queues.find(q => q.id === queueId).token_prefix;
  return `${prefix}-${String(counters[queueId]).padStart(3, '0')}`;
}

const insertToken = db.prepare(`
  INSERT INTO tokens (
    id, queue_id, token_number, user_name, phone, request_text,
    service_type, urgency, request_category, estimated_service_duration,
    notes, priority, status, estimated_wait_time, position, created_at
  ) VALUES (
    @id, @queue_id, @token_number, @user_name, @phone, @request_text,
    @service_type, @urgency, @request_category, @estimated_service_duration,
    @notes, @priority, @status, @estimated_wait_time, @position, @created_at
  )
`);

const clinicTokens = [
  { id: uuidv4(), queue_id: 'queue-clinic-001', token_number: nextToken('queue-clinic-001'), user_name: 'Rajan Mehta', phone: '9876543210', request_text: 'Blood pressure check + routine blood work', service_type: 'Diagnostics', urgency: 'medium', request_category: 'appointment', estimated_service_duration: 15, notes: 'Regular checkup', priority: 2, status: 'in-progress', estimated_wait_time: 0, position: 0, created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-clinic-001', token_number: nextToken('queue-clinic-001'), user_name: 'Priya Sharma', phone: '9123456789', request_text: 'Urgent chest pain since morning, emergency', service_type: 'Emergency OPD', urgency: 'high', request_category: 'walk-in', estimated_service_duration: 20, notes: 'Chest pain — high priority', priority: 3, status: 'waiting', estimated_wait_time: 15, position: 1, created_at: new Date(Date.now() - 20 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-clinic-001', token_number: nextToken('queue-clinic-001'), user_name: 'Arjun Nair', phone: '8899001122', request_text: 'Diabetes follow-up, monthly visit', service_type: 'Endocrinology', urgency: 'low', request_category: 'appointment', estimated_service_duration: 10, notes: 'Monthly diabetes checkup', priority: 1, status: 'waiting', estimated_wait_time: 30, position: 2, created_at: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-clinic-001', token_number: nextToken('queue-clinic-001'), user_name: 'Sunita Verma', phone: '7766554433', request_text: 'Mild fever for 2 days, general physician', service_type: 'General OPD', urgency: 'medium', request_category: 'walk-in', estimated_service_duration: 12, notes: 'Fever 2 days', priority: 2, status: 'waiting', estimated_wait_time: 45, position: 3, created_at: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-clinic-001', token_number: nextToken('queue-clinic-001'), user_name: 'Deepak Kumar', phone: '9944332211', request_text: 'Prescription renewal for hypertension meds', service_type: 'Prescription', urgency: 'low', request_category: 'service_request', estimated_service_duration: 5, notes: 'Renewal only', priority: 1, status: 'waiting', estimated_wait_time: 60, position: 4, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
];

const trainTokens = [
  { id: uuidv4(), queue_id: 'queue-train-001', token_number: nextToken('queue-train-001'), user_name: 'Vikram Singh', phone: '9871234567', request_text: 'Book 2 seats Rajdhani Express Delhi to Mumbai, 3rd AC', service_type: 'Seat Reservation', urgency: 'medium', request_category: 'service_request', estimated_service_duration: 12, notes: 'Delhi-Mumbai Rajdhani 3AC', priority: 2, status: 'in-progress', estimated_wait_time: 0, position: 0, created_at: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-train-001', token_number: nextToken('queue-train-001'), user_name: 'Neha Gupta', phone: '8822334455', request_text: 'Cancel my ticket PNR 4521893476, need refund status', service_type: 'Cancellation & Refund', urgency: 'high', request_category: 'service_request', estimated_service_duration: 15, notes: 'PNR: 4521893476', priority: 3, status: 'waiting', estimated_wait_time: 12, position: 1, created_at: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-train-001', token_number: nextToken('queue-train-001'), user_name: 'Rohit Joshi', phone: '7711223344', request_text: 'Senior citizen concession pass renewal, monthly', service_type: 'Pass Renewal', urgency: 'low', request_category: 'appointment', estimated_service_duration: 10, notes: 'Senior citizen pass', priority: 1, status: 'waiting', estimated_wait_time: 24, position: 2, created_at: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-train-001', token_number: nextToken('queue-train-001'), user_name: 'Kavya Reddy', phone: '9933221100', request_text: 'Tatkal booking Mumbai to Hyderabad Shatabdi tomorrow morning', service_type: 'Tatkal Booking', urgency: 'high', request_category: 'walk-in', estimated_service_duration: 8, notes: 'Tatkal - urgent travel', priority: 3, status: 'waiting', estimated_wait_time: 36, position: 3, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
];

const flightTokens = [
  { id: uuidv4(), queue_id: 'queue-flight-001', token_number: nextToken('queue-flight-001'), user_name: 'Anil Kapoor', phone: '9856741230', request_text: 'Check-in for IndiGo 6E-204 Bangalore to Delhi, 2 bags', service_type: 'Check-in & Baggage', urgency: 'high', request_category: 'walk-in', estimated_service_duration: 8, notes: 'IndiGo 6E-204, 2 checked bags', priority: 3, status: 'in-progress', estimated_wait_time: 0, position: 0, created_at: new Date(Date.now() - 20 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-flight-001', token_number: nextToken('queue-flight-001'), user_name: 'Meena Iyer', phone: '8811223344', request_text: 'Upgrade my Air India seat to business class, AI-131', service_type: 'Seat Upgrade', urgency: 'medium', request_category: 'service_request', estimated_service_duration: 10, notes: 'AI-131, business upgrade', priority: 2, status: 'waiting', estimated_wait_time: 10, position: 1, created_at: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-flight-001', token_number: nextToken('queue-flight-001'), user_name: 'Suresh Pillai', phone: '7722334455', request_text: 'Lost baggage complaint, SpiceJet SG-208, bag not arrived', service_type: 'Lost Baggage', urgency: 'high', request_category: 'walk-in', estimated_service_duration: 15, notes: 'SG-208 baggage missing', priority: 3, status: 'waiting', estimated_wait_time: 20, position: 2, created_at: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-flight-001', token_number: nextToken('queue-flight-001'), user_name: 'Ananya Das', phone: '9944556677', request_text: 'Missed my flight due to traffic, want to rebook next available', service_type: 'Rebooking', urgency: 'high', request_category: 'walk-in', estimated_service_duration: 12, notes: 'Missed flight, urgent rebooking', priority: 3, status: 'waiting', estimated_wait_time: 30, position: 3, created_at: new Date(Date.now() - 7 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-flight-001', token_number: nextToken('queue-flight-001'), user_name: 'Ramesh Tiwari', phone: '8833445566', request_text: 'Refund for cancelled Vistara flight UK-812, booked 2 weeks ago', service_type: 'Refund Processing', urgency: 'low', request_category: 'service_request', estimated_service_duration: 10, notes: 'Vistara UK-812 refund', priority: 1, status: 'done', estimated_wait_time: 0, position: 0, created_at: new Date(Date.now() - 60 * 60000).toISOString() },
];

const movieTokens = [
  { id: uuidv4(), queue_id: 'queue-movies-001', token_number: nextToken('queue-movies-001'), user_name: 'Pooja Mehta', phone: '9876001122', request_text: 'Spider-Man: Brand New Day — PVR IMAX Phoenix — 7:45 PM — 2x Recliner (IMAX 3D)', service_type: 'Movie: Spider-Man: Brand New Day', urgency: 'medium', request_category: 'appointment', estimated_service_duration: 5, notes: '2 × Recliner | IMAX 3D | ₹1500', priority: 2, status: 'in-progress', estimated_wait_time: 0, position: 0, created_at: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-movies-001', token_number: nextToken('queue-movies-001'), user_name: 'Aryan Shah', phone: '9922334455', request_text: 'Odyssey — PVR IMAX Phoenix — 10:30 PM — 3x Gold (IMAX)', service_type: 'Movie: Odyssey', urgency: 'low', request_category: 'appointment', estimated_service_duration: 5, notes: '3 × Gold | IMAX | ₹1350', priority: 1, status: 'waiting', estimated_wait_time: 5, position: 1, created_at: new Date(Date.now() - 8 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-movies-001', token_number: nextToken('queue-movies-001'), user_name: 'Divya Nair', phone: '8811990011', request_text: 'KGF: Chapter 3 — PVR IMAX Phoenix — 4:30 PM — 4x Silver (2D)', service_type: 'Movie: KGF: Chapter 3', urgency: 'medium', request_category: 'appointment', estimated_service_duration: 5, notes: '4 × Silver | 2D | ₹1120', priority: 2, status: 'waiting', estimated_wait_time: 10, position: 2, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: uuidv4(), queue_id: 'queue-movies-001', token_number: nextToken('queue-movies-001'), user_name: 'Rohan Pillai', phone: '7700112233', request_text: 'Pushpa: The Fire — PVR IMAX Phoenix — 7:45 PM — 2x Gold (Dolby)', service_type: 'Movie: Pushpa: The Fire', urgency: 'low', request_category: 'appointment', estimated_service_duration: 5, notes: '2 × Gold | Dolby Atmos | ₹900', priority: 1, status: 'waiting', estimated_wait_time: 15, position: 3, created_at: new Date(Date.now() - 3 * 60000).toISOString() },
];

const seedAll = db.transaction(() => {
  for (const t of [...movieTokens, ...clinicTokens, ...trainTokens, ...flightTokens]) insertToken.run(t);
});
seedAll();

console.log('✅ Database seeded!');
console.log(`   • PVR Cinemas: ${movieTokens.length} bookings`);
console.log(`   • City Medical Center: ${clinicTokens.length} bookings`);
console.log(`   • Indian Railways: ${trainTokens.length} bookings`);
console.log(`   • Airport Services: ${flightTokens.length} bookings`);
process.exit(0);
