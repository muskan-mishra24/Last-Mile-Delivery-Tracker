const Area = require('../models/Area');
const RateCard = require('../models/RateCard');
const CODSurcharge = require('../models/CODSurcharge');

/**
 * Calculate shipping charge for an order.
 * @param {Object} params
 * @param {string} params.pickupPincode
 * @param {string} params.dropPincode
 * @param {Object} params.dimensions - { length, breadth, height } in cm
 * @param {number} params.actual_weight - in kg
 * @param {string} params.order_type - 'B2B' | 'B2C'
 * @param {string} params.payment_type - 'Prepaid' | 'COD'
 * @returns {Object} charge breakdown
 */
async function calculateCharge({
  pickupPincode,
  dropPincode,
  dimensions,
  actual_weight,
  order_type,
  payment_type,
}) {
  // 1. Find Areas by pincode -> get Zones
  const pickupArea = await Area.findOne({ pincode: pickupPincode }).populate('zone');
  if (!pickupArea) {
    throw new Error(`Pickup pincode ${pickupPincode} not found in any zone`);
  }

  const dropArea = await Area.findOne({ pincode: dropPincode }).populate('zone');
  if (!dropArea) {
    throw new Error(`Drop pincode ${dropPincode} not found in any zone`);
  }

  const pickup_zone = pickupArea.zone;
  const drop_zone = dropArea.zone;

  // 2. Calculate volumetric weight
  const { length, breadth, height } = dimensions;
  const volumetric_weight = (length * breadth * height) / 5000;

  // 3. Billed weight = max(actual, volumetric)
  const billed_weight = Math.max(actual_weight, volumetric_weight);

  // 4. Find rate card for [pickup_zone, drop_zone, order_type]
  const rateCard = await RateCard.findOne({
    zone_from: pickup_zone._id,
    zone_to: drop_zone._id,
    order_type: order_type,
  });

  if (!rateCard) {
    throw new Error(
      `No rate card found for zone pair (${pickup_zone.name} -> ${drop_zone.name}) with order type ${order_type}`
    );
  }

  // 5. Base charge
  const base_charge = parseFloat((billed_weight * rateCard.rate_per_kg).toFixed(2));

  // 6. COD surcharge if applicable
  let cod_surcharge_amount = 0;
  let cod_surcharge_percentage = 0;

  if (payment_type === 'COD') {
    const codSurcharge = await CODSurcharge.findOne({ order_type });
    if (codSurcharge) {
      cod_surcharge_percentage = codSurcharge.percentage;
      cod_surcharge_amount = parseFloat(
        ((base_charge * cod_surcharge_percentage) / 100).toFixed(2)
      );
    }
  }

  const total_charge = parseFloat((base_charge + cod_surcharge_amount).toFixed(2));

  return {
    pickup_zone,
    drop_zone,
    volumetric_weight: parseFloat(volumetric_weight.toFixed(3)),
    billed_weight: parseFloat(billed_weight.toFixed(3)),
    rate_per_kg: rateCard.rate_per_kg,
    base_charge,
    cod_surcharge_percentage,
    cod_surcharge_amount,
    total_charge,
  };
}

module.exports = { calculateCharge };
