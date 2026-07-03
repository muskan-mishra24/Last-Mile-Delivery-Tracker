const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: parseInt(SMTP_PORT || '587', 10) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

const STATUS_LABELS = {
  created: 'Order Created',
  confirmed: 'Order Confirmed',
  picked_up: 'Package Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed: 'Delivery Failed',
};

/**
 * Send a status update email to the customer.
 * Falls back to console.log if SMTP is not configured.
 * @param {string} toEmail
 * @param {string} orderNumber
 * @param {string} status
 * @param {string} notes
 */
async function sendStatusEmail(toEmail, orderNumber, status, notes = '') {
  const statusLabel = STATUS_LABELS[status] || status;
  const from = process.env.SMTP_FROM || 'noreply@lastmile.com';

  const subject = `Order ${orderNumber} — ${statusLabel}`;
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Last-Mile Delivery Tracker</h2>
      <hr/>
      <p>Hello,</p>
      <p>Your order <strong>${orderNumber}</strong> status has been updated.</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; font-size: 18px;">Status: <strong>${statusLabel}</strong></p>
        ${notes ? `<p style="margin: 8px 0 0 0; color: #6b7280;">${notes}</p>` : ''}
      </div>
      <p>Thank you for using Last-Mile Delivery Tracker.</p>
      <hr/>
      <p style="color: #9ca3af; font-size: 12px;">This is an automated notification. Please do not reply.</p>
    </div>
  `;

  const transport = getTransporter();

  if (!transport) {
    console.log(
      `[NOTIFICATION] To: ${toEmail} | Order: ${orderNumber} | Status: ${statusLabel}${notes ? ` | Notes: ${notes}` : ''}`
    );
    return;
  }

  try {
    await transport.sendMail({
      from,
      to: toEmail,
      subject,
      html: body,
    });
    console.log(`[EMAIL] Sent status email to ${toEmail} for order ${orderNumber}: ${statusLabel}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send email to ${toEmail}:`, err.message);
  }
}

module.exports = { sendStatusEmail };
