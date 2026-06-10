import fs from 'fs';
import path from 'path';

const filePath = 'z:/projects/taxi09/frontend/src/modules/admin/components/AdminLayout.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF for consistent matching
content = content.replace(/\r\n/g, '\n');

// 1. Remove Banner Image from Promotions Management
const promoTarget = `            subItems: [
              { label: 'Promo Code', path: '/admin/promotions/promo-codes', permission: 'promotions.view' },
              { label: 'Push Notifications', path: '/admin/promotions/send-notification', permission: 'promotions.view' },
              //{ label: 'Banner Image', path: '/admin/promotions/banner-image', permission: 'promotions.view' },
            ],`;

const promoReplacement = `            subItems: [
              { label: 'Promo Code', path: '/admin/promotions/promo-codes', permission: 'promotions.view' },
              { label: 'Push Notifications', path: '/admin/promotions/send-notification', permission: 'promotions.view' },
            ],`;

if (!content.includes(promoTarget)) {
  console.error('Could not find promotions target in AdminLayout.jsx!');
  process.exit(1);
}

content = content.replace(promoTarget, promoReplacement);

// 2. Add Banner Image to Rental subItems
const rentalTarget = `            label: 'Rental',
            subItems: [
              { label: 'Service Stores', path: '/admin/pricing/service-stores', permission: 'service_stores.view' },
              { label: 'Pending Service Stores', path: '/admin/pricing/service-stores/pending', permission: 'service_stores.view' },
              { label: 'Pending Service Staff', path: '/admin/pricing/service-stores/pending-staff', permission: 'service_stores.view' },
              { label: 'Rental Commission', path: '/admin/pricing/rental-commission', permission: 'rental.view' },
              { label: 'Rental Vehicles', path: '/admin/pricing/rental-vehicles', permission: 'rental.view' },
              { label: 'Track Vehicles', path: '/admin/pricing/rental-tracking', permission: 'rental.view' },
              { label: 'Rental Requests', path: '/admin/pricing/rental-requests', permission: 'rental.view' },
              { label: 'Rental Quote Requests', path: '/admin/pricing/rental-quotes', permission: 'rental.view' },
              { label: 'Rental Package Types', path: '/admin/pricing/rental-packages', permission: 'rental.view' },
              { label: 'Package Pricing', path: '/admin/pricing/package-pricing', permission: 'rental.view' },
            ],`;

const rentalReplacement = `            label: 'Rental',
            subItems: [
              { label: 'Service Stores', path: '/admin/pricing/service-stores', permission: 'service_stores.view' },
              { label: 'Pending Service Stores', path: '/admin/pricing/service-stores/pending', permission: 'service_stores.view' },
              { label: 'Pending Service Staff', path: '/admin/pricing/service-stores/pending-staff', permission: 'service_stores.view' },
              { label: 'Rental Commission', path: '/admin/pricing/rental-commission', permission: 'rental.view' },
              { label: 'Rental Vehicles', path: '/admin/pricing/rental-vehicles', permission: 'rental.view' },
              { label: 'Track Vehicles', path: '/admin/pricing/rental-tracking', permission: 'rental.view' },
              { label: 'Rental Requests', path: '/admin/pricing/rental-requests', permission: 'rental.view' },
              { label: 'Rental Quote Requests', path: '/admin/pricing/rental-quotes', permission: 'rental.view' },
              { label: 'Rental Package Types', path: '/admin/pricing/rental-packages', permission: 'rental.view' },
              { label: 'Package Pricing', path: '/admin/pricing/package-pricing', permission: 'rental.view' },
              { label: 'Banner Image', path: '/admin/promotions/banner-image', permission: 'rental.view' },
            ],`;

if (!content.includes(rentalTarget)) {
  console.error('Could not find rental target in AdminLayout.jsx!');
  process.exit(1);
}

content = content.replace(rentalTarget, rentalReplacement);

// Write back to file (keep standard LF or write back using CRLF if desired, but node generally outputs standard format)
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AdminLayout.jsx!');
