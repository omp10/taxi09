import mongoose from 'mongoose';
import { ApiError } from '../../../../utils/ApiError.js';
import { ContentBlock } from '../../admin/content/models/ContentBlock.js';
import { HireDriver } from '../../admin/content/models/HireDriver.js';
import { HireDriverBooking } from '../../admin/content/models/HireDriverBooking.js';

/**
 * Quoting and creation for "hire a driver" engagements.
 *
 * The client sends which driver and which plan; every rupee is resolved here
 * from the driver's own profile plus the admin-managed allowance block. The
 * confirmation screen renders this same quote, so what the rider is shown and
 * what is written to the booking come from one place and cannot drift.
 */

const reference = (prefix) =>
  `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const clean = (value) => String(value || '').trim();

const PLANS = ['permanent', 'monthly', 'daily', 'hourly'];

const normalizePlan = (value) => {
  const plan = clean(value).toLowerCase();
  if (PLANS.includes(plan)) return plan;
  // The mobile screens pass the card's display title ("Permanent Driver").
  if (plan.includes('hour')) return 'hourly';
  if (plan.includes('daily') || plan.includes('day')) return 'daily';
  if (plan.includes('month')) return 'monthly';
  return 'permanent';
};

/** The retainer for a plan, read from the driver's own profile. */
const rateForPlan = (profile, plan) => {
  if (plan === 'hourly') return profile.hourlyRate;
  if (plan === 'daily') return profile.dailyRate;
  return profile.monthlySalary;
};

/**
 * Fixed allowances applied on top of the retainer. Items without a numeric
 * `amount` (e.g. "Toll & Parking - Actual") are presentational: they are shown
 * on the summary but add nothing to the total.
 */
const loadAllowances = async () => {
  try {
    const block = await ContentBlock.findOne({
      key: 'hireDriver.permanentFare',
      active: true,
    }).lean();

    return (Array.isArray(block?.items) ? block.items : [])
      .filter((item) => Number(item?.amount) > 0)
      .map((item) => ({
        label: clean(item.label),
        amount: Math.max(0, Number(item.amount)),
      }));
  } catch {
    return [];
  }
};

export const quoteHireDriver = async ({ hireDriverId, plan: requestedPlan }) => {
  if (!mongoose.Types.ObjectId.isValid(clean(hireDriverId))) {
    throw new ApiError(400, 'A valid driver must be selected');
  }

  const profile = await HireDriver.findById(hireDriverId).lean();
  if (!profile || profile.active === false) {
    throw new ApiError(404, 'This driver is no longer available');
  }
  if (profile.available === false) {
    throw new ApiError(409, 'This driver is not currently taking bookings');
  }

  const plan = normalizePlan(requestedPlan);
  const driverCharges = Math.max(0, Number(rateForPlan(profile, plan) || 0));

  if (!driverCharges) {
    throw new ApiError(400, 'This driver has no rate set for the selected plan');
  }

  const allowances = await loadAllowances();
  const allowancesTotal = allowances.reduce((total, item) => total + item.amount, 0);

  return {
    profile,
    plan,
    driverCharges,
    allowances,
    allowancesTotal,
    totalAmount: driverCharges + allowancesTotal,
  };
};

export const createHireDriverBooking = async ({ userId, payload = {} }) => {
  const quote = await quoteHireDriver({
    hireDriverId: payload.hireDriverId,
    plan: payload.plan,
  });

  const { profile } = quote;

  return HireDriverBooking.create({
    bookingReference: reference('HDR'),
    userId,
    customerName: clean(payload.customerName),
    customerPhone: clean(payload.customerPhone),

    hireDriverId: profile._id,
    hireDriverName: clean(profile.name),
    hireDriverPhoto: clean(profile.photo),
    vehicleName: clean(profile.vehicleName),
    vehiclePlate: clean(profile.vehiclePlate),

    plan: quote.plan,
    startDate: clean(payload.startDate),
    driverPreference: clean(payload.driverPreference),
    instructions: clean(payload.instructions).slice(0, 250),

    driverCharges: quote.driverCharges,
    allowances: quote.allowances,
    allowancesTotal: quote.allowancesTotal,
    totalAmount: quote.totalAmount,
  });
};

export const listMyHireDriverBookings = async (userId) =>
  HireDriverBooking.find({ userId }).sort({ createdAt: -1 }).lean();
