import mongoose from 'mongoose';

/**
 * A blog post written by the business.
 *
 * Distinct from TravelStory, which is user-generated trip content with a
 * location, likes and pins. This is editorial: written in the admin panel,
 * shown in the "Read about us" row on the homepage, and read on its own page.
 *
 * `content` holds the body as plain text or simple HTML. It is rendered as
 * text, not injected as markup, so a post cannot introduce script.
 */
const blogSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    /** One or two lines used on the card and for search results. */
    excerpt: { type: String, default: '', trim: true },
    content: { type: String, default: '' },
    coverImage: { type: String, default: '', trim: true },
    /** Extra images the post can show beneath the body. */
    gallery: { type: [String], default: [] },
    author: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    tags: { type: [String], default: [] },
    readMinutes: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    /** Pins a post to the front of the homepage row. */
    featured: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

blogSchema.index({ status: 1, featured: -1, publishedAt: -1 });
blogSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

export const Blog = mongoose.models.TaxiBlog || mongoose.model('TaxiBlog', blogSchema);
