import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { ContentBlock } from '../content/models/ContentBlock.js';

/**
 * Seeds the admin-editable content behind the "hire a driver" flow.
 *
 * Every block below started life as a hardcoded array inside a screen. The
 * values here are those originals verbatim, so seeding changes nothing visually
 * - it only moves the copy somewhere an admin can edit it without a deploy.
 *
 * `icon` fields carry a lucide icon *name*, not a component; each screen maps
 * the name back to a component and falls back to a sensible default when a name
 * is unknown, so an admin typing a bad icon degrades to a generic glyph rather
 * than a blank render.
 *
 * Existing blocks are left untouched - re-running this never overwrites copy an
 * admin has since edited.
 */
const BLOCKS = [
  {
    key: 'hireDriver.services',
    label: 'Hire a Driver - service cards',
    description: 'The service tiles on the mobile "with driver" home screen.',
    items: [
      {
        key: 'local',
        title: 'Local (Hourly)',
        subtitle: 'Hire a driver for local city rides by the hour.',
        color: 'from-[#fff2b6] to-white',
        action: 'bg-[#f5b700]',
        image: '/taxi09_driver_local_hourly.png',
      },
      {
        key: 'outstation',
        title: 'Outstation',
        subtitle: 'For intercity or long distance trips.',
        color: 'from-emerald-100 to-white',
        action: 'bg-emerald-600',
        image: '/taxi09_driver_outstation.png',
      },
      {
        key: 'outstation-drop',
        title: 'Outstation Drop',
        subtitle: 'One way drop to your destination.',
        color: 'from-teal-100 to-white',
        action: 'bg-emerald-600',
        image: '/taxi09_driver_outstation_drop.png',
      },
      {
        key: 'permanent',
        title: 'Permanent Driver',
        subtitle: 'Hire a driver for daily, weekly or monthly basis.',
        color: 'from-rose-100 to-white',
        action: 'bg-red-500',
        image: '/taxi09_driver_permanent.png',
      },
    ],
  },
  {
    key: 'hireDriver.trust',
    label: 'Hire a Driver - trust badges',
    description: 'The four reassurance tiles on the "with driver" home screen.',
    items: [
      { icon: 'ShieldCheck', label: 'Police Verified\nDrivers' },
      { icon: 'Star', label: 'Experienced &\nTrained' },
      { icon: 'Headset', label: '24x7\nSupport' },
      { icon: 'CalendarDays', label: 'Transparent\nPricing' },
    ],
  },
  {
    key: 'hireDriver.journeyOptions',
    label: 'Hire a Driver - journey add-ons',
    description:
      'Add-on surcharges. These prices are authoritative: the server charges from this block, so editing a price here changes what riders are billed.',
    items: [
      { key: 'night', label: 'Night Journey', price: 500, icon: 'Moon' },
      { key: 'hill', label: 'Hill Driving', price: 300, icon: 'Mountain' },
      { key: 'luggage', label: 'Extra Luggage', price: 150, icon: 'Briefcase' },
      { key: 'stops', label: 'Multiple Stops', price: 250, icon: 'Map' },
    ],
  },
  {
    key: 'hireDriver.preferences',
    label: 'Hire a Driver - driver preferences',
    description: 'Driver gender preference choices on the booking screen.',
    items: [
      { label: 'Male Driver', icon: 'Mars' },
      { label: 'Female Driver', icon: 'Venus' },
      { label: 'No Preference', icon: 'UserRoundCheck', recommended: true },
    ],
  },
  {
    key: 'hireDriver.bookingTrust',
    label: 'Hire a Driver - booking screen trust badges',
    description: 'Reassurance tiles shown on the booking detail screen.',
    items: [
      { icon: 'MapPin', label: 'GPS Tracked\nDrivers' },
      { icon: 'Headphones', label: 'Live\nSupport' },
      { icon: 'CalendarDays', label: 'Digital\nDuty Slip' },
      { icon: 'ShieldCheck', label: 'Trip\nInsurance' },
    ],
  },
  {
    key: 'hireDriver.confirmDetails',
    label: 'Hire a Driver - driver credentials',
    description: 'Credential chips on the permanent-driver confirmation screen.',
    items: [
      { icon: 'BadgeCheck', title: 'Driving License', sub: 'Verified' },
      { icon: 'UserCheck', title: 'Aadhaar', sub: 'Verified' },
      { icon: 'CircleSlash', title: 'No Smoking', sub: 'Driver' },
      { icon: 'Headphones', title: 'Automatic &', sub: 'Manual Expert' },
      { icon: 'Clock3', title: 'Night Drive', sub: 'Expert' },
      { icon: 'Car', title: 'Luxury Vehicle', sub: 'Experience' },
    ],
  },
  {
    key: 'hireDriver.desktopPromises',
    label: 'Hire a Driver - desktop promise strip',
    description: 'The promise row on the desktop "with driver" listing page.',
    items: [
      { icon: 'BadgeCheck', label: 'Best Price Guarantee' },
      { icon: 'CheckCircle2', label: 'No Hidden Charges' },
      { icon: 'Clock', label: 'On Time Pickup' },
      { icon: 'CreditCard', label: 'Multiple Payment Options' },
    ],
  },
  {
    key: 'hireDriver.desktopFooter',
    label: 'Hire a Driver - desktop footer notes',
    description: 'The reassurance cards at the foot of the desktop listing page.',
    items: [
      { icon: 'Ticket', title: 'Free Cancellation', copy: 'Cancel till 30 mins before pickup' },
      { icon: 'MapPin', title: 'Live Tracking', copy: 'Share your ride with friends & family' },
      { icon: 'ShieldCheck', title: 'Verified Drivers', copy: 'All drivers are background verified' },
      { icon: 'Headphones', title: '24/7 Customer Support', copy: 'We are always here to help' },
    ],
  },
  {
    key: 'hireDriver.permanentFare',
    label: 'Hire a Driver - engagement fare lines',
    description:
      'Fare summary lines for a permanent/monthly engagement, added on top of the rate held on the driver profile. A line with a numeric `amount` is charged; a line with only `note` (e.g. "Actual") is shown but adds nothing.',
    items: [
      { label: 'Night Allowance', amount: 500 },
      { label: 'Toll & Parking', note: 'Actual' },
      { label: 'GST (0%)', note: 'Included' },
    ],
  },
  {
    key: 'hireDriver.safety',
    label: 'Hire a Driver - safety tiles',
    description: 'The "Your Safety, Our Priority" grid on the confirmation screen.',
    items: [
      { icon: 'MapPin', label: 'Live GPS\nTracking' },
      { icon: 'Siren', label: 'SOS\nSupport' },
      { icon: 'Sparkles', label: 'Share Live\nTrip' },
      { icon: 'ShieldCheck', label: 'Trip Recording\nAvailable' },
      { icon: 'Headphones', label: '24x7\nSupport' },
      { icon: 'Bell', label: 'Emergency\nContact' },
    ],
  },
];

export const seedHireDriverContent = async () => {
  console.log('Seeding "hire a driver" content blocks...');

  let created = 0;
  for (const block of BLOCKS) {
    const result = await ContentBlock.updateOne(
      { key: block.key },
      { $setOnInsert: { ...block, active: true } },
      { upsert: true },
    );
    if (result.upsertedCount) created += 1;
  }

  console.log(`Hire-driver content blocks: ${created} created, ${BLOCKS.length - created} already present`);
  return true;
};

export default seedHireDriverContent;

// Runnable on its own: `npm run seed:hire-driver` from Backend/.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { connectDatabase } = await import('../../../../config/database.js');
  try {
    await connectDatabase();
    await seedHireDriverContent();
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
