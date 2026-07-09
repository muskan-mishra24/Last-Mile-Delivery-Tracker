const User = require('../models/User');
const Order = require('../models/Order');

/**
 * Auto-assign an available agent to an order.
 * Priority: agents in pickup zone first, then any available agent.
 * @param {string} orderId
 * @returns {Object|null} assigned agent or null
 */
async function autoAssignAgent(orderId) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  let agent = null;

  // First priority: available agents in the pickup zone
  if (order.pickup_zone) {
    agent = await User.findOne({
      role: 'delivery_agent',
      isAvailable: true,
      currentZone: order.pickup_zone,
    });
  }

  // Second priority: any available agent
  if (!agent) {
    agent = await User.findOne({
      role: 'delivery_agent',
      isAvailable: true,
    });
  }

  if (!agent) {
    return null;
  }

  // Assign agent to order
  order.agent = agent._id;
  await order.save();

  // Mark agent as unavailable
  agent.isAvailable = false;
  await agent.save();

  return agent;
}

module.exports = { autoAssignAgent };
