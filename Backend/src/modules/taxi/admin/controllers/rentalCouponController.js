import { RentalCoupon } from '../models/RentalCoupon.js';
import { RentalVehicleType } from '../models/RentalVehicleType.js';
import { ApiError } from '../../../../utils/ApiError.js';
import { asyncHandler } from '../../../../utils/asyncHandler.js';

const ok = (res, data, message) => res.status(200).json({ success: true, data, message });
const created = (res, data, message) => res.status(201).json({ success: true, data, message });

export const getRentalCoupons = asyncHandler(async (req, res) => {
  const { search, active } = req.query || {};
  const query = {};

  if (search) {
    query.code = { $regex: String(search).trim(), $options: 'i' };
  }

  if (active !== undefined && active !== '') {
    query.active = active === 'true' || active === '1';
  }

  const results = await RentalCoupon.find(query)
    .populate('vehicle_ids', 'name')
    .sort({ createdAt: -1 })
    .lean();
  return ok(res, results, 'Rental coupons fetched successfully');
});

export const createRentalCoupon = asyncHandler(async (req, res) => {
  const { code, description, type, amount, cap, min_booking_amount, expiry_date, active, vehicle_ids } = req.body || {};

  if (!code || !amount || !expiry_date) {
    throw new ApiError(400, 'Code, amount, and expiry date are required');
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const existing = await RentalCoupon.findOne({ code: normalizedCode }).lean();
  if (existing) {
    throw new ApiError(409, 'Rental coupon code already exists');
  }

  const coupon = await RentalCoupon.create({
    code: normalizedCode,
    description: description || '',
    type: type || 'flat',
    amount: Number(amount),
    cap: Number(cap || 0),
    min_booking_amount: Number(min_booking_amount || 0),
    expiry_date: new Date(expiry_date),
    active: active !== false,
    vehicle_ids: Array.isArray(vehicle_ids) ? vehicle_ids : [],
  });

  return created(res, coupon, 'Rental coupon created successfully');
});

export const updateRentalCoupon = asyncHandler(async (req, res) => {
  const { code, description, type, amount, cap, min_booking_amount, expiry_date, active, vehicle_ids } = req.body || {};
  const coupon = await RentalCoupon.findById(req.params.id);

  if (!coupon) {
    throw new ApiError(404, 'Rental coupon not found');
  }

  if (code) {
    const normalizedCode = String(code).trim().toUpperCase();
    if (normalizedCode !== coupon.code) {
      const existing = await RentalCoupon.findOne({ code: normalizedCode, _id: { $ne: coupon._id } }).lean();
      if (existing) {
        throw new ApiError(409, 'Rental coupon code already exists');
      }
      coupon.code = normalizedCode;
    }
  }

  if (description !== undefined) coupon.description = description;
  if (type !== undefined) coupon.type = type;
  if (amount !== undefined) coupon.amount = Number(amount);
  if (cap !== undefined) coupon.cap = Number(cap);
  if (min_booking_amount !== undefined) coupon.min_booking_amount = Number(min_booking_amount);
  if (expiry_date !== undefined) coupon.expiry_date = new Date(expiry_date);
  if (active !== undefined) coupon.active = active === true || active === 'true' || active === 1 || active === '1';
  if (vehicle_ids !== undefined) coupon.vehicle_ids = Array.isArray(vehicle_ids) ? vehicle_ids : [];

  await coupon.save();
  return ok(res, coupon, 'Rental coupon updated successfully');
});

export const deleteRentalCoupon = asyncHandler(async (req, res) => {
  const coupon = await RentalCoupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    throw new ApiError(404, 'Rental coupon not found');
  }
  return ok(res, null, 'Rental coupon deleted successfully');
});

export const toggleRentalCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await RentalCoupon.findById(req.params.id);
  if (!coupon) {
    throw new ApiError(404, 'Rental coupon not found');
  }

  coupon.active = !coupon.active;
  await coupon.save();
  return ok(res, coupon, 'Rental coupon status toggled successfully');
});

export const getActiveRentalCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const query = {
    active: true,
    expiry_date: { $gt: now },
  };

  const results = await RentalCoupon.find(query)
    .populate('vehicle_ids', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return ok(res, results, 'Active rental coupons fetched successfully');
});

export const validateRentalCoupon = asyncHandler(async (req, res) => {
  const { code, bookingAmount, vehicleId } = req.body || {};

  if (!code) {
    throw new ApiError(400, 'Coupon code is required');
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const coupon = await RentalCoupon.findOne({ code: normalizedCode }).lean();

  if (!coupon) {
    return res.status(200).json({
      success: false,
      reason: 'NOT_FOUND',
      message: 'Rental coupon code not found',
    });
  }

  if (!coupon.active) {
    return res.status(200).json({
      success: false,
      reason: 'INACTIVE',
      message: 'Rental coupon is inactive',
    });
  }

  const now = new Date();
  if (new Date(coupon.expiry_date) < now) {
    return res.status(200).json({
      success: false,
      reason: 'EXPIRED',
      message: 'Rental coupon has expired',
    });
  }

  // Vehicle check
  if (coupon.vehicle_ids && coupon.vehicle_ids.length > 0) {
    if (!vehicleId) {
      return res.status(200).json({
        success: false,
        reason: 'VEHICLE_REQUIRED',
        message: 'This coupon is only applicable for specific vehicles',
      });
    }
    const isAllowed = coupon.vehicle_ids.some(
      (id) => id.toString() === vehicleId.toString()
    );
    if (!isAllowed) {
      return res.status(200).json({
        success: false,
        reason: 'VEHICLE_NOT_ALLOWED',
        message: 'This coupon is not applicable for the selected vehicle',
      });
    }
  }

  const amount = Number(bookingAmount || 0);
  if (amount < coupon.min_booking_amount) {
    return res.status(200).json({
      success: false,
      reason: 'MIN_AMOUNT_NOT_MET',
      message: `Minimum booking amount to use this coupon is Rs. ${coupon.min_booking_amount}`,
    });
  }

  let discount = 0;
  if (coupon.type === 'flat') {
    discount = Math.min(amount, coupon.amount);
  } else if (coupon.type === 'percent') {
    const calculated = Math.round(amount * (coupon.amount / 100));
    discount = coupon.cap > 0 ? Math.min(coupon.cap, calculated) : calculated;
  }

  return res.status(200).json({
    success: true,
    data: {
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        amount: coupon.amount,
        cap: coupon.cap,
        discount,
      },
    },
  });
});
