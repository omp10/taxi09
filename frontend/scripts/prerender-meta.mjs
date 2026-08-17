/**
 * Write a per-route index.html with that route's own metadata.
 *
 * This is not server-side rendering and does not try to be. It solves the one
 * SEO problem a client-rendered SPA cannot: crawlers and link unfurlers read
 * <head> before any JavaScript runs, so every route was advertising the same
 * title and description. WhatsApp and Facebook never run JS at all, so a
 * shared link could only ever unfurl the homepage.
 *
 * Each public route gets a copy of the built index.html with its own title,
 * description, canonical and OG tags swapped in. The bundle is untouched, so
 * the SPA boots and takes over exactly as before - the user sees no
 * difference, the crawler sees the right page.
 *
 * nginx resolves these through `try_files $uri $uri/ /index.html`: a request
 * for /taxi/user/rental finds the directory and serves the index.html inside
 * it. Anything not listed here falls through to the SPA shell as before.
 *
 * Runs as part of `npm run build`.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const ORIGIN = 'https://taxi09.com';

/**
 * Only routes a signed-out visitor can actually reach. A private route
 * prerendered here would promise a crawler content it gets redirected away
 * from, which is worse than not listing it.
 */
const ROUTES = [
  {
    path: '/taxi/user/rental',
    title: 'Self Drive Car Rental in Indore - Taxi09',
    description:
      'Rent a self drive car in Indore from hourly to daily packages. Kilometre limits and extra-km rates shown before you book, no charges added at the counter.',
  },
  {
    path: '/taxi/user/with-driver',
    title: 'Hire a Driver in Indore - Hourly, Daily & Monthly - Taxi09',
    description:
      'Hire a verified professional driver in Indore by the hour, day or month. Background-checked drivers with ratings and experience shown up front.',
  },
  {
    path: '/taxi/user/rental/bike-categories',
    title: 'Bike & Scooty Rental in Indore - Taxi09',
    description:
      'Rent a scooty or bike in Indore by the hour or day. Helmet included, fuel-efficient, and sanitised before every ride.',
  },
  {
    path: '/taxi/user/tours',
    title: 'Tour Packages from Indore - Taxi09',
    description:
      'Curated tour packages from Indore covering Mandu, Maheshwar, Omkareshwar and more, with transport and stay arranged.',
  },
  {
    path: '/taxi/user/hotel',
    title: 'Hotel Booking in Indore - Taxi09',
    description: 'Book hotels across India at transparent prices, alongside your car rental or tour.',
  },
  {
    path: '/taxi/user/bus',
    title: 'Bus Booking - Taxi09',
    description: 'Book bus tickets for outstation and group travel with live seat selection.',
  },
  {
    path: '/taxi/user/blog',
    title: 'Travel Guides & Car Rental Tips - Taxi09 Blog',
    description:
      'Weekend drives from Indore, self drive checklists and rental guides written by the Taxi09 team.',
  },
  {
    path: '/taxi/user/stories',
    title: 'Travel Stories from Our Riders - Taxi09',
    description: 'Real trips and routes shared by people who rented with Taxi09.',
  },
  {
    path: '/taxi/user/internship',
    title: 'Internship Program - Taxi09',
    description:
      'Paid internship tracks in tourism operations, customer experience and digital growth at Taxi09, Indore.',
  },
];

/** Replace a tag's content, or leave the html untouched if it is not there. */
const setTag = (html, pattern, replacement) =>
  pattern.test(html) ? html.replace(pattern, replacement) : html;

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const run = async () => {
  const shell = await readFile(join(DIST, 'index.html'), 'utf8');

  for (const route of ROUTES) {
    const title = escapeHtml(route.title);
    const description = escapeHtml(route.description);
    const url = `${ORIGIN}${route.path}`;

    let html = shell;
    html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
    html = setTag(html, /<meta name="description" content="[^"]*"/, `<meta name="description" content="${description}"`);
    html = setTag(html, /<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`);
    html = setTag(html, /<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`);
    html = setTag(html, /<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`);
    html = setTag(html, /<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`);
    html = setTag(html, /<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${title}"`);
    html = setTag(html, /<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${description}"`);

    const outDir = join(DIST, route.path);
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, 'index.html'), html, 'utf8');
  }

  console.log(`prerendered metadata for ${ROUTES.length} routes`);
};

run().catch((error) => {
  console.error('prerender-meta failed:', error);
  process.exit(1);
});
