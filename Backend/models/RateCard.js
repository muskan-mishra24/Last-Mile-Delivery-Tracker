const mongoose = require('mongoose');

const rateCardSchema = new mongoose.Schema(
  {
    zone_from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'zone_from is required'],
    },
    zone_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'zone_to is required'],
    },
    order_type: {
      type: String,
      enum: ['B2B', 'B2C'],
      required: [true, 'order_type is required'],
    },
    rate_per_kg: {
      type: Number,
      required: [true, 'rate_per_kg is required'],
      min: 0,
    },
    is_intra: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

rateCardSchema.index({ zone_from: 1, zone_to: 1, order_type: 1 }, { unique: true });

rateCardSchema.pre('save', function (next) {
  this.is_intra = this.zone_from.toString() === this.zone_to.toString();
  next();
});

module.exports = mongoose.model('RateCard', rateCardSchema);
