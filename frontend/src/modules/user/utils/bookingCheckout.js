import api from '../../../shared/api/axiosInstance';

/**
 * Razorpay checkout for hotel and package bookings.
 *
 * The amount is never passed in - the server reads it from the stored booking
 * when it raises the order, and only marks the booking paid once the signature
 * verifies. This module just drives the SDK between those two calls.
 */

let scriptPromise = null;

const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(true);

  // One in-flight load shared by every caller.
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => { scriptPromise = null; resolve(false); };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
};

const unwrap = (response) => response?.data?.data ?? response?.data;

/**
 * @param kind      'hotel' | 'package'
 * @param bookingId id of a booking that already exists
 * @param name      title shown in the Razorpay modal
 * @param description line under the title
 * @param prefill   { name, contact, email }
 * @returns the verified booking, or null if the customer dismissed the modal
 */
export const payForBooking = async ({ kind, bookingId, name, description, prefill = {} }) => {
  const loaded = await loadRazorpay();
  if (!loaded) throw new Error('Could not load the payment window. Check your connection and retry.');

  const order = unwrap(await api.post(`/users/bookings/${kind}/${bookingId}/pay/order`));
  if (!order?.orderId) throw new Error('Could not start the payment.');

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: name || 'Taxi09',
      description: description || order.bookingReference,
      prefill,
      theme: { color: '#F5B700' },
      // Dismissing the modal is not an error - the booking simply stays unpaid.
      modal: { ondismiss: () => resolve(null) },
      handler: async (response) => {
        try {
          const verified = unwrap(
            await api.post(`/users/bookings/${kind}/${bookingId}/pay/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          );
          resolve(verified);
        } catch (error) {
          reject(new Error(error?.response?.data?.message || 'Payment could not be verified.'));
        }
      },
    });

    checkout.on('payment.failed', (event) =>
      reject(new Error(event?.error?.description || 'Payment failed.')),
    );
    checkout.open();
  });
};
