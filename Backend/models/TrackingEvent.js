const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required'],
  },
  status: {
    type: String,
    enum: [
      'created',
      'confirmed',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'failed',
    ],
    required: [true, 'Status is required'],
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// This collection is append-only — never update/delete
module.exports = mongoose.model('TrackingEvent', trackingEventSchema);
