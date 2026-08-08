import crypto from 'node:crypto';
import { ApiError } from '../../../../utils/ApiError.js';
import { HotelBooking } from '../../admin/content/models/HotelBooking.js';
import { PackageBooking } from '../../admin/content/models/PackageBooking.js';
import { UserMembership } from '../../admin/content/models/UserMembership.js';
import { resolveConfiguredGatewayCredentials } from '../../services/paymentGatewayService.js';

/**
 * Razorpay for hotel and package bookings.
 *
 * The order is raised against an already-created booking, so the amount comes
 * from the stored (server-priced) total - the client never sends a figure. The
 * booking is only marked paid once the signature verifies.
 */

// Memberships ride the same order-and-verify path; the model activates itself
// once its paymentStatus flips to paid.
const MODELS = { hotel: HotelBooking, package: PackageBooking, membership: UserMembership };

/**
 * Rupees to paise. Going through toPrecision first avoids binary drift - a
 * plain `1.005 * 100` is 100.49999... and would round down, short-charging by
 * a paisa.
 */
export const toPaise = (rupees) => Math.round(Number((Number(rupees || 0) * 100).toPrecision(12)));

const modelFor = (kind) => {
  const Model = MODELS[String(kind || '').toLowerCase()];
  if (!Model) throw new ApiError(400, 'Unknown booking type');
  return Model;
};

const razorpayRequest = async ({ method, path, body, keyId, keySecret }) => {
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      response.status || 502,
      payload?.error?.description || payload?.error?.message || 'Razorpay request failed',
    );
  }
  return payload;
};

const loadOwnedBooking = async ({ kind, bookingId, userId }) => {
  const booking = await modelFor(kind).findOne({ _id: bookingId, userId });
  if (!booking) throw new ApiError(404, 'Booking not found');
  return booking;
};

export const createBookingPaymentOrder = async ({ kind, bookingId, userId }) => {
  const booking = await loadOwnedBooking({ kind, bookingId, userId });

  if (booking.paymentStatus === 'paid') {
    throw new ApiError(400, 'This booking is already paid');
  }
  if (booking.status === 'cancelled') {
    throw new ApiError(400, 'This booking has been cancelled');
  }

  const { keyId, keySecret } = await resolveConfiguredGatewayCredentials('razor_pay');

  // Razorpay works in paise, and the amount is read from the stored booking.
  const order = await razorpayRequest({
    method: 'POST',
    path: '/orders',
    keyId,
    keySecret,
    body: {
      amount: toPaise(booking.totalAmount),
      currency: 'INR',
      receipt: booking.bookingReference,
      notes: { kind, bookingId: String(booking._id), reference: booking.bookingReference },
    },
  });

  booking.paymentOrderId = order.id;
  await booking.save();

  return {
    keyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    bookingId: String(booking._id),
    bookingReference: booking.bookingReference,
  };
};

export const verifyBookingPayment = async ({ kind, bookingId, userId, orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) {
    throw new ApiError(400, 'Payment verification fields are required');
  }

  const booking = await loadOwnedBooking({ kind, bookingId, userId });

  // The order must be the one this booking raised, so a signature from another
  // (cheaper) order cannot be replayed against it.
  if (booking.paymentOrderId && booking.paymentOrderId !== orderId) {
    throw new ApiError(400, 'This payment does not belong to this booking');
  }

  const { keySecret } = await resolveConfiguredGatewayCredentials('razor_pay');
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expected !== signature) {
    booking.paymentStatus = 'failed';
    await booking.save();
    throw new ApiError(400, 'Invalid payment signature');
  }

  booking.paymentStatus = 'paid';
  booking.status = 'confirmed';
  booking.paymentId = paymentId;
  booking.paymentMethod = booking.paymentMethod || 'razorpay';
  await booking.save();

  return booking.toObject();
};
