import mongoose from 'mongoose';

/**
 * Room types belong to a hotel. `priceMultiplier` scales the hotel's base
 * nightly rate so a hotel's whole ladder re-prices from one number - the same
 * rule the UI was applying client-side.
 */
const hotelRoomSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Deluxe', trim: true },
    sqft: { type: Number, default: 0 },
    adults: { type: Number, default: 2, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    bed: { type: String, default: '1 King Bed', trim: true },
    priceMultiplier: { type: Number, default: 1, min: 0 },
    perks: { type: [String], default: [] },
    image: { type: String, default: '', trim: true },
    roomsLeft: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const hotelSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    area: { type: String, default: '', trim: true },
    distance: { type: String, default: '', trim: true },

    badge: { type: String, default: '', trim: true },
    image: { type: String, default: '', trim: true },
    gallery: { type: [String], default: [] },

    amenities: { type: [String], default: [] },
    facilities: { type: [String], default: [] },

    // The property's official star class (1-5). Distinct from `rating`, which
    // is the guest score. 0 means unclassified and is simply not shown.
    starRating: { type: Number, default: 0, min: 0, max: 5 },
    propertyType: {
      type: String,
      enum: ['', 'Hotel', 'Resort', 'Apartment', 'Guest House', 'Villa', 'Homestay', 'Hostel'],
      default: '',
      trim: true,
      index: true,
    },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: String, default: '0', trim: true },

    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: 0, min: 0 },

    checkInTime: { type: String, default: '2:00 PM', trim: true },
    checkOutTime: { type: String, default: '11:00 AM', trim: true },

    rooms: { type: [hotelRoomSchema], default: [] },

    // Optional extras offered with a stay. `perNight` bills per night per room;
    // otherwise it is a one-off charge for the booking.
    addOns: {
      type: [
        new mongoose.Schema(
          {
            id: { type: String, required: true, trim: true },
            label: { type: String, required: true, trim: true },
            price: { type: Number, default: 0, min: 0 },
            perNight: { type: Boolean, default: false },
            active: { type: Boolean, default: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

hotelSchema.index({ active: 1, city: 1, sortOrder: 1 });

export const Hotel = mongoose.models.TaxiHotel || mongoose.model('TaxiHotel', hotelSchema);
