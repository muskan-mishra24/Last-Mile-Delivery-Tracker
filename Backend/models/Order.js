const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    order_number: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    pickup_address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    drop_address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    pickup_zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
    },
    drop_zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
    },
    dimensions: {
      length: { type: Number, required: true },
      breadth: { type: Number, required: true },
      height: { type: Number, required: true },
    },
    actual_weight: {
      type: Number,
      required: [true, 'Actual weight is required'],
    },
    volumetric_weight: {
      type: Number,
    },
    billed_weight: {
      type: Number,
    },
    order_type: {
      type: String,
      enum: ['B2B', 'B2C'],
      required: [true, 'order_type is required'],
    },
    payment_type: {
      type: String,
      enum: ['Prepaid', 'COD'],
      required: [true, 'payment_type is required'],
    },
    charge: {
      type: Number,
      default: 0,
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
      default: 'created',
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    scheduled_date: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (!this.order_number) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 9000) + 1000;
    this.order_number = `ORD-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
