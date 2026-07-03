const mongoose = require('mongoose');

const codSurchargeSchema = new mongoose.Schema(
  {
    order_type: {
      type: String,
      enum: ['B2B', 'B2C'],
      required: [true, 'order_type is required'],
      unique: true,
    },
    percentage: {
      type: Number,
      required: [true, 'percentage is required'],
      default: 2,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CODSurcharge', codSurchargeSchema);
