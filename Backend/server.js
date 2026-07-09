require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { corsOptions } = require('./utils/cors');

const app = express();

// Middleware
app.use(cors(corsOptions()));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/zones', require('./routes/zones'));
app.use('/api/areas', require('./routes/areas'));
app.use('/api/rate-cards', require('./routes/rateCards'));
app.use('/api/cod-surcharges', require('./routes/codSurcharges'));
app.use('/api/agents', require('./routes/agents'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ---- Seed Function ----
async function seedDatabase() {
  const User = require('./models/User');
  const Zone = require('./models/Zone');
  const Area = require('./models/Area');
  const RateCard = require('./models/RateCard');
  const CODSurcharge = require('./models/CODSurcharge');

  // Check if already seeded
  const adminExists = await User.findOne({ role: 'admin' });
  if (adminExists) {
    console.log('[SEED] Database already seeded. Skipping.');
    return;
  }

  console.log('[SEED] Seeding database...');

  // Create admin
  const admin = new User({
    name: 'Admin',
    email: 'admin@lastmile.com',
    password: 'admin123',
    role: 'admin',
    phone: '9999999999',
  });
  await admin.save();
  console.log('[SEED] Admin created: admin@lastmile.com / admin123');

  // Create delivery agents
  const agent1 = new User({
    name: 'Ravi Kumar',
    email: 'ravi@lastmile.com',
    password: 'agent123',
    role: 'delivery_agent',
    phone: '9111111111',
    isAvailable: true,
  });

  const agent2 = new User({
    name: 'Priya Singh',
    email: 'priya@lastmile.com',
    password: 'agent123',
    role: 'delivery_agent',
    phone: '9222222222',
    isAvailable: true,
  });

  const agent3 = new User({
    name: 'Suresh Mehta',
    email: 'suresh@lastmile.com',
    password: 'agent123',
    role: 'delivery_agent',
    phone: '9333333333',
    isAvailable: true,
  });

  // Create sample customer
  const customer = new User({
    name: 'Test Customer',
    email: 'customer@lastmile.com',
    password: 'customer123',
    role: 'customer',
    phone: '9444444444',
  });

  // Create zones
  const zoneA = new Zone({ name: 'Zone-A', description: 'Metro city center' });
  const zoneB = new Zone({ name: 'Zone-B', description: 'Suburban areas' });
  const zoneC = new Zone({ name: 'Zone-C', description: 'Rural outskirts' });

  await Promise.all([zoneA.save(), zoneB.save(), zoneC.save()]);
  console.log('[SEED] Zones created: Zone-A, Zone-B, Zone-C');

  // Assign agents to zones
  agent1.currentZone = zoneA._id;
  agent2.currentZone = zoneB._id;
  agent3.currentZone = zoneC._id;

  await Promise.all([agent1.save(), agent2.save(), agent3.save(), customer.save()]);
  console.log('[SEED] Agents and customer created');

  // Create areas with pincodes
  const areas = [
    // Zone-A
    { name: 'Connaught Place', pincode: '110001', zone: zoneA._id },
    { name: 'Karol Bagh', pincode: '110005', zone: zoneA._id },
    { name: 'Paharganj', pincode: '110055', zone: zoneA._id },
    { name: 'Chandni Chowk', pincode: '110006', zone: zoneA._id },
    // Zone-B
    { name: 'Dwarka', pincode: '110075', zone: zoneB._id },
    { name: 'Rohini', pincode: '110085', zone: zoneB._id },
    { name: 'Janakpuri', pincode: '110058', zone: zoneB._id },
    { name: 'Pitampura', pincode: '110088', zone: zoneB._id },
    // Zone-C
    { name: 'Faridabad', pincode: '121001', zone: zoneC._id },
    { name: 'Gurgaon', pincode: '122001', zone: zoneC._id },
    { name: 'Noida', pincode: '201301', zone: zoneC._id },
    { name: 'Ghaziabad', pincode: '201001', zone: zoneC._id },
  ];

  await Area.insertMany(areas);
  console.log('[SEED] Areas created');

  // Create rate cards — all zone pair combinations for B2B and B2C
  const zones = [zoneA, zoneB, zoneC];
  const rateCards = [];

  const rateMatrix = {
    // [from][to] => { B2B, B2C }
    'A-A': { B2B: 30, B2C: 25 },
    'A-B': { B2B: 40, B2C: 35 },
    'A-C': { B2B: 55, B2C: 50 },
    'B-A': { B2B: 40, B2C: 35 },
    'B-B': { B2B: 30, B2C: 25 },
    'B-C': { B2B: 45, B2C: 40 },
    'C-A': { B2B: 55, B2C: 50 },
    'C-B': { B2B: 45, B2C: 40 },
    'C-C': { B2B: 30, B2C: 25 },
  };

  const zoneKeys = { [zoneA._id.toString()]: 'A', [zoneB._id.toString()]: 'B', [zoneC._id.toString()]: 'C' };

  for (const from of zones) {
    for (const to of zones) {
      const key = `${zoneKeys[from._id.toString()]}-${zoneKeys[to._id.toString()]}`;
      const rates = rateMatrix[key];
      if (rates) {
        rateCards.push({
          zone_from: from._id,
          zone_to: to._id,
          order_type: 'B2B',
          rate_per_kg: rates.B2B,
          is_intra: from._id.toString() === to._id.toString(),
        });
        rateCards.push({
          zone_from: from._id,
          zone_to: to._id,
          order_type: 'B2C',
          rate_per_kg: rates.B2C,
          is_intra: from._id.toString() === to._id.toString(),
        });
      }
    }
  }

  await RateCard.insertMany(rateCards);
  console.log('[SEED] Rate cards created');

  // Create COD surcharges
  await CODSurcharge.insertMany([
    { order_type: 'B2B', percentage: 2 },
    { order_type: 'B2C', percentage: 1.5 },
  ]);
  console.log('[SEED] COD surcharges created');

  console.log('[SEED] Database seeding complete!');
  console.log('[SEED] Test accounts:');
  console.log('[SEED]   Admin:    admin@lastmile.com / admin123');
  console.log('[SEED]   Agent:    ravi@lastmile.com / agent123');
  console.log('[SEED]   Customer: customer@lastmile.com / customer123');
}

// Connect and start
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lastmile';

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log(`[DB] Connected to MongoDB: ${MONGODB_URI}`);
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`[SERVER] Running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  });
