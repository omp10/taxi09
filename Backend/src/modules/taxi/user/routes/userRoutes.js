import { Router } from 'express';
import { asyncHandler } from '../../../../utils/asyncHandler.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import {
  cancelMyBusBooking,
  createBusBookingOrder,
  createRentalAdvancePaymentOrder,
  createPhonePeRentalAdvancePaymentOrder,
  payRentalAdvanceWithWallet,
  createRentalBookingRequest,
  quoteRentalBooking,
  quoteHireDriverTrip,
  createRentalQuoteRequest,
  createRazorpayWalletTopupOrder,
  createPhonePeWalletTopupOrder,
  handleUserRazorpayWalletTopupCallback,
  getBusSeatLayout,
  getBusRouteSuggestions,
  getMyBusBookingById,
  listMyBusBookings,
  getUserWallet,
  getCurrentUser,
  getUserNotifications,
  deleteUserNotification,
  endMyActiveRentalRide,
  getIntercityPackageCatalog,
  clearAllUserNotifications,
  getMyActiveRentalBooking,
  listPublicServiceLocations,
  listPublicServiceStores,
  listMyRentalBookings,
  loginUser,
  registerUser,
  requestAccountDeletion,
  saveUserFcmToken,
  searchBuses,
  signupUser,
  startUserOtpRequest,
  submitMyBusBookingReview,
  topupUserWallet,
  transferUserWalletToDriver,
  transferUserWallet,
  updateMyActiveRentalLocation,
  updateCurrentUser,
  uploadUserProfileImage,
  verifyBusBookingPayment,
  verifyRentalAdvancePayment,
  verifyPhonePeRentalAdvancePayment,
  verifyRazorpayWalletTopup,
  verifyPhonePeWalletTopup,
  verifyUserOtpRequest,
  verifyUserPhoneForOtpLogin,
  getAvailableSubscriptionPlans,
  getMySubscriptions,
  buySubscription,
  getSetPrices,
  getZones,
} from '../controllers/userController.js';
import {
  postHotelBooking,
  getMyHotelBookings,
  postPackageBooking,
  getMyPackageBookings,
  postBookingPaymentOrder,
  postBookingPaymentVerify,
} from '../../admin/content/controllers/bookingController.js';
import {
  addEmergencyContact,
  deleteEmergencyContact,
  listEmergencyContacts,
} from '../controllers/userController.js';
import {
  getPublicContentBlocks,
  getPublicBlogs,
  getPublicBlog,
  getPublicHotelBySlug,
  quoteHotelStay,
  quoteTravelPackage,
  getPublicTravelPackageBySlug,
  getPublicHotels,
  getPublicTravelPackages,
  getPublicHireDrivers,
  getPublicMembershipPlans,
  getMyMembership,
  postMembershipPurchase,
  getMyAttachedVehicles,
  getMyAttachedVehicle,
  postAttachedVehicle,
  patchAttachedVehicle,
  postAttachedVehicleSubmit,
  getPublicTravelStories,
  getPublicTravelStoryBySlug,
  getTravelStoryFacets,
  getTravelStoryPins,
  postTravelStory,
  postTravelStoryLike,
  getMyTravelStories,
  getPlatformStats,
  getPublicInternshipTracks,
  getPublicInternshipStats,
  getMyInternshipApplications,
  postInternshipApplication,
  getPublicCourses,
  getPublicCourseBySlug,
  getVerifyCertificate,
} from '../../admin/content/controllers/contentController.js';
import { getAppBootstrap, getAppModules, getGeneralSettingsCategory, getGoodsTypes, getPublicBanners, getPublicRideFares, getPublicRentalVehicleCatalog, getPublicRentalVehicleSubcategories, getPublicVehicleTypeCatalog } from '../../admin/controllers/adminController.js';
import { triggerUserSosAlert } from '../../safety/controllers/safetyController.js';

export const userRouter = Router();

userRouter.get('/bootstrap', asyncHandler(getAppBootstrap));
userRouter.get('/app-modules', asyncHandler(getAppModules));
userRouter.get('/settings/:category', asyncHandler(getGeneralSettingsCategory));
userRouter.get('/intercity-packages', asyncHandler(getIntercityPackageCatalog));
userRouter.get('/goods-types', asyncHandler(getGoodsTypes));
userRouter.get('/vehicle-types', asyncHandler(getPublicVehicleTypeCatalog));
userRouter.get('/ride-fares', asyncHandler(getPublicRideFares));
userRouter.get('/set-prices', asyncHandler(getSetPrices));
userRouter.get('/zones', asyncHandler(getZones));
userRouter.get('/rental-vehicles', asyncHandler(getPublicRentalVehicleCatalog));
userRouter.get('/rental-vehicle-subcategories', asyncHandler(getPublicRentalVehicleSubcategories));
userRouter.get('/banners', asyncHandler(getPublicBanners));
userRouter.get('/travel-packages', getPublicTravelPackages);
userRouter.post('/travel-packages/quote', authenticate(['user']), asyncHandler(quoteTravelPackage));
// Declared after /quote so the dynamic segment cannot shadow it.
userRouter.get('/travel-packages/:slug', getPublicTravelPackageBySlug);

userRouter.post('/hotel-bookings', authenticate(['user']), postHotelBooking);
userRouter.get('/hotel-bookings', authenticate(['user']), getMyHotelBookings);
userRouter.post('/package-bookings', authenticate(['user']), postPackageBooking);

// Membership: plans are public, buying and reading your own needs a session.
userRouter.get('/membership-plans', getPublicMembershipPlans);
userRouter.get('/membership', authenticate(['user']), getMyMembership);
userRouter.post('/membership/purchase', authenticate(['user']), postMembershipPurchase);

// Attach your car: drafts are private to the owner until submitted.
userRouter.get('/attached-vehicles', authenticate(['user']), getMyAttachedVehicles);
userRouter.get('/attached-vehicles/:id', authenticate(['user']), getMyAttachedVehicle);
userRouter.post('/attached-vehicles', authenticate(['user']), postAttachedVehicle);
userRouter.patch('/attached-vehicles/:id', authenticate(['user']), patchAttachedVehicle);
userRouter.post('/attached-vehicles/:id/submit', authenticate(['user']), postAttachedVehicleSubmit);

// Travel stories. Reading is public; writing and liking need a session.
// The static segments are declared before /:slug so they cannot be shadowed.
// Blog posts. Public reading only; writing happens in the admin panel.
userRouter.get('/blogs', getPublicBlogs);
userRouter.get('/blogs/:slug', getPublicBlog);

userRouter.get('/travel-stories/facets', getTravelStoryFacets);
userRouter.get('/travel-stories/pins', getTravelStoryPins);
userRouter.get('/travel-stories/mine', authenticate(['user']), getMyTravelStories);
userRouter.get('/travel-stories', getPublicTravelStories);
userRouter.post('/travel-stories', authenticate(['user']), postTravelStory);
userRouter.post('/travel-stories/:slug/like', authenticate(['user']), postTravelStoryLike);
userRouter.get('/travel-stories/:slug', getPublicTravelStoryBySlug);

// Internship programme and courses. Reading is public; applying needs a session.
userRouter.get('/platform-stats', getPlatformStats);
userRouter.get('/internship/tracks', getPublicInternshipTracks);
userRouter.get('/internship/stats', getPublicInternshipStats);
userRouter.get('/internship/mine', authenticate(['user']), getMyInternshipApplications);
userRouter.post('/internship/apply', authenticate(['user']), postInternshipApplication);
userRouter.get('/courses', getPublicCourses);
userRouter.get('/courses/:slug', getPublicCourseBySlug);
userRouter.get('/certificates/verify/:number', getVerifyCertificate);
userRouter.get('/package-bookings', authenticate(['user']), getMyPackageBookings);

// kind is 'hotel' or 'package'; the amount always comes from the stored booking.
userRouter.post('/bookings/:kind/:id/pay/order', authenticate(['user']), postBookingPaymentOrder);
userRouter.post('/bookings/:kind/:id/pay/verify', authenticate(['user']), postBookingPaymentVerify);
userRouter.get('/hotels', getPublicHotels);
userRouter.post('/hotels/quote', authenticate(['user']), asyncHandler(quoteHotelStay));
userRouter.get('/hotels/:slug', getPublicHotelBySlug);
userRouter.get('/content-blocks', getPublicContentBlocks);
userRouter.get('/hire-drivers', getPublicHireDrivers);

userRouter.get('/me/emergency-contacts', authenticate(['user']), asyncHandler(listEmergencyContacts));
userRouter.post('/me/emergency-contacts', authenticate(['user']), asyncHandler(addEmergencyContact));
userRouter.delete('/me/emergency-contacts/:id', authenticate(['user']), asyncHandler(deleteEmergencyContact));
userRouter.get('/service-locations', asyncHandler(listPublicServiceLocations));
userRouter.get('/service-stores', asyncHandler(listPublicServiceStores));
userRouter.post('/rental-quote-requests', asyncHandler(createRentalQuoteRequest));
userRouter.post('/rental-bookings/quote', authenticate(['user']), asyncHandler(quoteRentalBooking));
userRouter.post('/hire-driver/quote', authenticate(['user']), asyncHandler(quoteHireDriverTrip));
userRouter.post('/rental-bookings', authenticate(['user']), asyncHandler(createRentalBookingRequest));
userRouter.get('/rental-bookings', authenticate(['user']), asyncHandler(listMyRentalBookings));
userRouter.get('/rental-bookings/active', authenticate(['user']), asyncHandler(getMyActiveRentalBooking));
userRouter.post('/rental-bookings/:id/end', authenticate(['user']), asyncHandler(endMyActiveRentalRide));
userRouter.post('/rental-bookings/:id/location', authenticate(['user']), asyncHandler(updateMyActiveRentalLocation));
userRouter.post('/register', asyncHandler(registerUser));
userRouter.post('/signup', asyncHandler(signupUser));
userRouter.post('/login', asyncHandler(loginUser));
userRouter.post('/profile-image', asyncHandler(uploadUserProfileImage));
userRouter.post('/auth/send-otp', asyncHandler(startUserOtpRequest));
userRouter.post('/auth/verify-otp', asyncHandler(verifyUserOtpRequest));
userRouter.post('/otp-login', asyncHandler(verifyUserPhoneForOtpLogin));
userRouter.post('/fcm-token', authenticate(['user']), asyncHandler(saveUserFcmToken));
userRouter.get('/me', authenticate(['user']), asyncHandler(getCurrentUser));
userRouter.patch('/me', authenticate(['user']), asyncHandler(updateCurrentUser));
userRouter.get('/subscriptions/plans', authenticate(['user']), asyncHandler(getAvailableSubscriptionPlans));
userRouter.get('/subscriptions/me', authenticate(['user']), asyncHandler(getMySubscriptions));
userRouter.post('/subscriptions/purchase', authenticate(['user']), asyncHandler(buySubscription));
userRouter.post('/me/delete-request', authenticate(['user']), asyncHandler(requestAccountDeletion));
userRouter.get('/notifications', authenticate(['user']), asyncHandler(getUserNotifications));
userRouter.delete('/notifications/:id', authenticate(['user']), asyncHandler(deleteUserNotification));
userRouter.delete('/notifications', authenticate(['user']), asyncHandler(clearAllUserNotifications));
userRouter.post('/sos', authenticate(['user']), asyncHandler(triggerUserSosAlert));
userRouter.get('/wallet', authenticate(['user']), asyncHandler(getUserWallet));
userRouter.post('/wallet/topup', authenticate(['user']), asyncHandler(topupUserWallet));
userRouter.post('/wallet/transfer', authenticate(['user']), asyncHandler(transferUserWallet));
userRouter.post('/wallet/transfer/driver', authenticate(['user']), asyncHandler(transferUserWalletToDriver));
userRouter.post('/wallet/razorpay/order', authenticate(['user']), asyncHandler(createRazorpayWalletTopupOrder));
userRouter.post('/wallet/razorpay/verify', authenticate(['user']), asyncHandler(verifyRazorpayWalletTopup));
userRouter.post('/wallet/razorpay/callback', asyncHandler(handleUserRazorpayWalletTopupCallback));
userRouter.get('/wallet/razorpay/callback', asyncHandler(handleUserRazorpayWalletTopupCallback));
userRouter.post('/wallet/phonepe/order', authenticate(['user']), asyncHandler(createPhonePeWalletTopupOrder));
userRouter.get('/wallet/phonepe/status/:merchantTransactionId', authenticate(['user']), asyncHandler(verifyPhonePeWalletTopup));
userRouter.post('/rental-advance/razorpay/order', authenticate(['user']), asyncHandler(createRentalAdvancePaymentOrder));
userRouter.post('/rental-advance/razorpay/verify', authenticate(['user']), asyncHandler(verifyRentalAdvancePayment));
userRouter.post('/rental-advance/phonepe/order', authenticate(['user']), asyncHandler(createPhonePeRentalAdvancePaymentOrder));
userRouter.get('/rental-advance/phonepe/status/:merchantTransactionId', authenticate(['user']), asyncHandler(verifyPhonePeRentalAdvancePayment));
userRouter.post('/rental-advance/wallet', authenticate(['user']), asyncHandler(payRentalAdvanceWithWallet));
// Public: these are the active routes on offer, with no user context - the
// handler does not read req at all. Browsing the bus page does not require
// signing in, and gating this made a logged-out visitor see the raw
// "Authorization token is required" on screen.
userRouter.get('/buses/routes', asyncHandler(getBusRouteSuggestions));
userRouter.get('/buses/search', asyncHandler(searchBuses));
userRouter.get('/buses/:id/seats', asyncHandler(getBusSeatLayout));
userRouter.get('/bus-bookings', authenticate(['user']), asyncHandler(listMyBusBookings));
userRouter.get('/bus-bookings/:id', authenticate(['user']), asyncHandler(getMyBusBookingById));
userRouter.post('/bus-bookings/:id/review', authenticate(['user']), asyncHandler(submitMyBusBookingReview));
userRouter.post('/bus-bookings/order', authenticate(['user']), asyncHandler(createBusBookingOrder));
userRouter.post('/bus-bookings/verify', authenticate(['user']), asyncHandler(verifyBusBookingPayment));
userRouter.post('/bus-bookings/:id/cancel', authenticate(['user']), asyncHandler(cancelMyBusBooking));

