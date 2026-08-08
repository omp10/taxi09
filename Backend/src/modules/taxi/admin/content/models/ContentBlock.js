import mongoose from 'mongoose';

/**
 * Generic keyed content used across screens - hero slides, category chips,
 * trust badges, add-on catalogues. One collection keyed by `key` so a new block
 * needs no schema change; `items` holds whatever that block's shape is.
 *
 * Known keys (see seedContent.js):
 *   tours.hero, tours.categories, tours.trust
 *   international.filters
 *   hotel.hero, hotel.destinations
 *   bus.addons, hotel.addons, international.addons
 */
const contentBlockSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    label: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const ContentBlock =
  mongoose.models.TaxiContentBlock || mongoose.model('TaxiContentBlock', contentBlockSchema);
