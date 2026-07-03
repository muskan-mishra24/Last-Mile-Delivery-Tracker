const express = require('express');
const Order = require('../models/Order');
const TrackingEvent = require('../models/TrackingEvent');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { calculateCharge } = require('../services/rateCalculator');
const { autoAssignAgent } = require('../services/agentAssignment');
const { sendStatusEmail } = require('../services/notification');

const router = express.Router();

// Helper: create tracking event + update order status + notify customer
async function recordStatusChange(order, newStatus, actor, notes = '') {
  order.status = newStatus;
  await order.save();

  await TrackingEvent.create({
    order: order._id,
    status: newStatus,
    actor: actor._id,
    notes,
  });

  // Get customer email
  const customer = await User.findById(order.customer);
  if (customer) {
    await sendStatusEmail(customer.email, order.order_number, newStatus, notes);
  }

  // Free up agent on terminal statuses
  if ((newStatus === 'delivered' || newStatus === 'failed') && order.agent) {
    await User.findByIdAndUpdate(order.agent, { isAvailable: true });
  }
}

// GET /api/orders — list orders
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    const { role, _id } = req.user;

    if (role === 'customer') {
      filter.customer = _id;
    } else if (role === 'delivery_agent') {
      filter.agent = _id;
    } else if (role === 'admin') {
      // Admin can filter by status, zone, agent
      if (req.query.status) filter.status = req.query.status;
      if (req.query.zone_id) {
        filter.$or = [
          { pickup_zone: req.query.zone_id },
          { drop_zone: req.query.zone_id },
        ];
      }
      if (req.query.agent_id) filter.agent = req.query.agent_id;
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('agent', 'name email phone')
      .populate('pickup_zone', 'name')
      .populate('drop_zone', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/orders/calculate — calculate charge preview (no order created)
router.post('/calculate', auth, async (req, res) => {
  try {
    const {
      pickup_pincode,
      drop_pincode,
      dimensions,
      actual_weight,
      order_type,
      payment_type,
    } = req.body;

    if (!pickup_pincode || !drop_pincode || !dimensions || !actual_weight || !order_type || !payment_type) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const result = await calculateCharge({
      pickupPincode: pickup_pincode,
      dropPincode: drop_pincode,
      dimensions,
      actual_weight: parseFloat(actual_weight),
      order_type,
      payment_type,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/orders — create order (customer or admin)
router.post('/', auth, async (req, res) => {
  try {
    const {
      pickup_address,
      drop_address,
      dimensions,
      actual_weight,
      order_type,
      payment_type,
      customer_id, // admin can specify customer
    } = req.body;

    if (!pickup_address || !drop_address || !dimensions || !actual_weight || !order_type || !payment_type) {
      return res.status(400).json({ message: 'All order fields are required' });
    }

    // Determine customer
    let customerId;
    if (req.user.role === 'admin' && customer_id) {
      customerId = customer_id;
    } else if (req.user.role === 'customer') {
      customerId = req.user._id;
    } else if (req.user.role === 'admin') {
      return res.status(400).json({ message: 'Admin must specify customer_id' });
    } else {
      return res.status(403).json({ message: 'Only customers or admin can create orders' });
    }

    // Calculate charge
    const chargeResult = await calculateCharge({
      pickupPincode: pickup_address.pincode,
      dropPincode: drop_address.pincode,
      dimensions,
      actual_weight: parseFloat(actual_weight),
      order_type,
      payment_type,
    });

    const order = new Order({
      customer: customerId,
      created_by: req.user._id,
      pickup_address,
      drop_address,
      pickup_zone: chargeResult.pickup_zone._id,
      drop_zone: chargeResult.drop_zone._id,
      dimensions,
      actual_weight: parseFloat(actual_weight),
      volumetric_weight: chargeResult.volumetric_weight,
      billed_weight: chargeResult.billed_weight,
      order_type,
      payment_type,
      charge: chargeResult.total_charge,
      status: 'created',
    });

    await order.save();

    // Create initial tracking event
    await TrackingEvent.create({
      order: order._id,
      status: 'created',
      actor: req.user._id,
      notes: 'Order placed',
    });

    // Send notification
    const customer = await User.findById(customerId);
    if (customer) {
      await sendStatusEmail(customer.email, order.order_number, 'created', 'Your order has been placed.');
    }

    const populated = await Order.findById(order._id)
      .populate('customer', 'name email phone')
      .populate('pickup_zone', 'name')
      .populate('drop_zone', 'name');

    res.status(201).json({ order: populated, chargeBreakdown: chargeResult });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/orders/:id — get order with tracking events
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('agent', 'name email phone')
      .populate('pickup_zone', 'name')
      .populate('drop_zone', 'name')
      .populate('created_by', 'name email');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Access control
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'delivery_agent' && order.agent && order.agent._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const trackingEvents = await TrackingEvent.find({ order: order._id })
      .populate('actor', 'name role')
      .sort({ timestamp: 1 });

    res.json({ order, trackingEvents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/orders/:id/confirm — customer confirms order (created -> confirmed)
router.post('/:id/confirm', auth, requireRole('customer'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'created') {
      return res.status(400).json({ message: `Cannot confirm order in status: ${order.status}` });
    }

    await recordStatusChange(order, 'confirmed', req.user, 'Customer confirmed order');

    res.json({ message: 'Order confirmed', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/orders/:id/status — agent updates status
router.put('/:id/status', auth, requireRole('delivery_agent'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.agent || order.agent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this order' });
    }

    const agentAllowedStatuses = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'];
    if (!agentAllowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    await recordStatusChange(order, status, req.user, notes || '');

    res.json({ message: 'Status updated', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/orders/:id/reschedule — customer reschedules failed order
router.post('/:id/reschedule', auth, requireRole('customer'), async (req, res) => {
  try {
    const { new_date } = req.body;
    if (!new_date) return res.status(400).json({ message: 'new_date is required' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'failed') {
      return res.status(400).json({ message: 'Only failed orders can be rescheduled' });
    }

    order.scheduled_date = new Date(new_date);
    await recordStatusChange(order, 'confirmed', req.user, `Rescheduled for ${new_date}`);

    // Auto-assign a new agent
    const agent = await autoAssignAgent(order._id);

    res.json({
      message: 'Order rescheduled',
      order,
      agent: agent ? { name: agent.name, email: agent.email } : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- ADMIN ROUTES ----

// PUT /api/admin/orders/:id/assign — admin assigns agent
router.put('/admin/:id/assign', auth, requireRole('admin'), async (req, res) => {
  try {
    const { agent_id } = req.body;
    if (!agent_id) return res.status(400).json({ message: 'agent_id is required' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const agent = await User.findOne({ _id: agent_id, role: 'delivery_agent' });
    if (!agent) return res.status(404).json({ message: 'Agent not found' });

    // Free previous agent if any
    if (order.agent && order.agent.toString() !== agent_id) {
      await User.findByIdAndUpdate(order.agent, { isAvailable: true });
    }

    order.agent = agent._id;
    await order.save();

    agent.isAvailable = false;
    await agent.save();

    res.json({ message: 'Agent assigned', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/orders/:id/auto-assign — admin triggers auto-assign
router.post('/admin/:id/auto-assign', auth, requireRole('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const agent = await autoAssignAgent(order._id);
    if (!agent) {
      return res.status(404).json({ message: 'No available agents found' });
    }

    res.json({ message: 'Agent auto-assigned', agent: { name: agent.name, email: agent.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/orders/:id/status — admin overrides status
router.put('/admin/:id/status', auth, requireRole('admin'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['created', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await recordStatusChange(order, status, req.user, notes || 'Admin override');

    res.json({ message: 'Status overridden', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/agents — list all agents with availability
router.get('/admin/agents', auth, requireRole('admin'), async (req, res) => {
  try {
    const filter = { role: 'delivery_agent' };
    if (req.query.isAvailable !== undefined) {
      filter.isAvailable = req.query.isAvailable === 'true';
    }

    const agents = await User.find(filter)
      .populate('currentZone', 'name')
      .select('-password')
      .sort({ name: 1 });

    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/admin/customers — list customers (admin, for order creation)
router.get('/admin/customers', auth, requireRole('admin'), async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('name email phone').sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
