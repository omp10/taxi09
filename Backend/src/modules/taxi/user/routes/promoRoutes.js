import { Router } from 'express';
import { asyncHandler } from '../../../../utils/asyncHandler.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { getAvailablePromos, validatePromo, validateRentalCoupon, getActiveRentalCoupons } from '../controllers/promoController.js';

export const promoRouter = Router();

promoRouter.post('/validate', authenticate(['user']), asyncHandler(validatePromo));
promoRouter.post('/rental/validate', authenticate(['user']), asyncHandler(validateRentalCoupon));
promoRouter.get('/rental/active', authenticate(['user']), asyncHandler(getActiveRentalCoupons));
promoRouter.get('/available', authenticate(['user']), asyncHandler(getAvailablePromos));
