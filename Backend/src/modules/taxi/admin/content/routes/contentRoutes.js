import { Router } from 'express';
import { authenticate } from '../../../middlewares/authMiddleware.js';
import {
  adminCreateHotel,
  adminCreateTravelPackage,
  adminDeleteContentBlock,
  adminDeleteHotel,
  adminDeleteTravelPackage,
  adminListContentBlocks,
  adminListHotels,
  adminListTravelPackages,
  adminToggleHotel,
  adminToggleTravelPackage,
  adminUpdateHotel,
  adminUpdateTravelPackage,
  adminUpsertContentBlock,
  adminCreateHireDriver,
  adminDeleteHireDriver,
  adminListHireDrivers,
  adminToggleHireDriver,
  adminUpdateHireDriver,
} from '../controllers/contentController.js';
import {
  getAdminAllBookings,
  getAdminHotelBookings,
  getAdminPackageBookings,
  updateAdminHotelBooking,
  updateAdminPackageBooking,
} from '../controllers/bookingController.js';

export const contentRouter = Router();

contentRouter.use('/admin', authenticate(['admin']));

// Travel packages (domestic + international)
contentRouter.get('/admin/travel-packages', adminListTravelPackages);
contentRouter.post('/admin/travel-packages', adminCreateTravelPackage);
contentRouter.patch('/admin/travel-packages/:id', adminUpdateTravelPackage);
contentRouter.patch('/admin/travel-packages/:id/toggle', adminToggleTravelPackage);
contentRouter.delete('/admin/travel-packages/:id', adminDeleteTravelPackage);

// Hotels + their room types
contentRouter.get('/admin/hotels', adminListHotels);
contentRouter.post('/admin/hotels', adminCreateHotel);
contentRouter.patch('/admin/hotels/:id', adminUpdateHotel);
contentRouter.patch('/admin/hotels/:id/toggle', adminToggleHotel);
contentRouter.delete('/admin/hotels/:id', adminDeleteHotel);

// Keyed content blocks (hero slides, category chips, trust badges, add-ons)
contentRouter.get('/admin/content-blocks', adminListContentBlocks);
contentRouter.put('/admin/content-blocks', adminUpsertContentBlock);
contentRouter.delete('/admin/content-blocks/:id', adminDeleteContentBlock);

// Drivers available for hire (permanent / monthly / outstation)
contentRouter.get('/admin/hire-drivers', adminListHireDrivers);
contentRouter.post('/admin/hire-drivers', adminCreateHireDriver);
contentRouter.patch('/admin/hire-drivers/:id', adminUpdateHireDriver);
contentRouter.patch('/admin/hire-drivers/:id/toggle', adminToggleHireDriver);
contentRouter.delete('/admin/hire-drivers/:id', adminDeleteHireDriver);

contentRouter.get('/admin/hotel-bookings', getAdminHotelBookings);
contentRouter.patch('/admin/hotel-bookings/:id', updateAdminHotelBooking);
contentRouter.get('/admin/package-bookings', getAdminPackageBookings);
contentRouter.patch('/admin/package-bookings/:id', updateAdminPackageBooking);
contentRouter.get('/admin/all-bookings', getAdminAllBookings);

export default contentRouter;
