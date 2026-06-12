const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/modules/user/pages/rental/BikeRentalHome.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Rename variable references and mock IDs
content = content.replace(/\brevvCars\b/g, 'taxi09Cars');
content = content.replace(/\brevv-([1-5])\b/g, 'taxi09-$1');

// 2. Replace comments and strings containing "revv" or "Revv"
content = content.replace(/\bRevv allows up to\b/g, 'Taxi09 allows up to');
content = content.replace(/\bWhy Revv\b/g, 'Why Taxi09');
content = content.replace(/\bWhy Revv\?\b/g, 'Why Taxi09?');
content = content.replace(/italic drop-shadow-\[0_2px_4px_rgba\(0,0,0,0.1\)\]">revv<\/span>/g, 'italic drop-shadow-[0_2px_10px_rgba(99,102,241,0.5)]">Taxi09</span>');
content = content.replace(/by CARS24 Group/g, 'Premium Self-Drive');
content = content.replace(/\/\/ If selectedCategoryFilter is 'car', render the custom Revv UI/g, "// If selectedCategoryFilter is 'car', render the custom Taxi09 UI");
content = content.replace(/\/\/ 1\. Render Revv Dashboard View/g, "// 1. Render Taxi09 Dashboard View");

// 3. Replace color classes and hex values to indigo/violet theme
// Teal Header Gradient -> Midnight/Indigo/Purple Premium
content = content.replace(
  /bg-gradient-to-br from-\\[#0B94A4\\] via-\\[#097E8B\\] to-\\[#055E6B\\]/g,
  'bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#2E1065] shadow-[0_12px_40px_rgba(46,16,101,0.25)]'
);
content = content.replace(/bg-white\/5 blur-\[40px\]/g, 'bg-indigo-500/10 blur-[40px]');

// Segment Tabs
content = content.replace(/bg-\\[#097E8B\\]\/80 backdrop-blur-md/g, 'bg-white/5 backdrop-blur-md');
content = content.replace(/text-slate-500(?=\`\:\'text-white\/60\'\}\}\>\$\{tab\})/g, 'text-indigo-600/80');
content = content.replace(/text-slate-500(?=\`\:\'text-white\/60\'\}\}\>For hours)/g, 'text-indigo-600/80');
content = content.replace(/text-slate-500(?=\`\:\'text-white\/60\'\}\}\>For months)/g, 'text-indigo-600/80');

// Search input wrapper shadow and borders
content = content.replace(
  /shadow-\\[0_12px_40px_rgba\(11,148,164,0.15\)\\] hover:shadow-\\[0_16px_48px_rgba\(11,148,164,0.22\)\\] focus-within:shadow-\\[0_16px_48px_rgba\(11,148,164,0.22\)\\]/g,
  'shadow-[0_12px_40px_rgba(99,102,241,0.12)] hover:shadow-[0_16px_48px_rgba(99,102,241,0.18)] focus-within:shadow-[0_16px_48px_rgba(99,102,241,0.18)]'
);
content = content.replace(
  /bg-gradient-to-br from-\\[#0B94A4\\] to-\\[#097E8B\\]/g,
  'bg-gradient-to-br from-indigo-500 to-purple-600'
);
content = content.replace(/text-\\[#0B94A4\\]/g, 'text-indigo-650');
content = content.replace(/border-\\[#0B94A4\\] bg-\\[#0B94A4\\]\/5/g, 'border-indigo-650 bg-indigo-50');
content = content.replace(/bg-\\[#0B94A4\\]/g, 'bg-indigo-650 hover:bg-indigo-700 shadow-sm transition-colors');
content = content.replace(/hover:bg-\\[#097E8B\\]/g, 'hover:bg-indigo-750');

// Location Pin Suggestions
content = content.replace(/text-teal-600/g, 'text-indigo-600');
content = content.replace(/stroke-teal-600/g, 'stroke-indigo-600');
content = content.replace(/bg-\\[#E0F2F1\\]/g, 'bg-indigo-50');

// Banners Gradient (From Teal to Indigo/Purple)
content = content.replace(/from-\\[#E0F7FA\\] to-\\[#80DEEA\\]/g, 'from-indigo-50 to-purple-100');
content = content.replace(/text-teal-800/g, 'text-indigo-750');
content = content.replace(/from-teal-500\/30/g, 'from-indigo-500/30');

// Notice Banner in Results View
content = content.replace(
  /bg-gradient-to-r from-\\[#B2EBF2\\]\/80 to-\\[#E0F7FA\\]\/80 rounded-2xl p-4 flex gap-4 border border-teal-100\/50/g,
  'bg-gradient-to-r from-indigo-50/90 to-purple-50/70 rounded-2xl p-4 flex gap-4 border border-indigo-100/40 shadow-sm'
);
content = content.replace(/text-teal-700/g, 'text-indigo-650 hover:text-indigo-800 transition-colors');

// Delivery Check icons
content = content.replace(/border-teal-500\/20 bg-teal-50/g, 'border-indigo-500/20 bg-indigo-50');

// Selling Fast Badge
content = content.replace(/bg-\\[#E75D35\\]/g, 'bg-gradient-to-r from-orange-500 to-rose-500');

// FAQs View All Chevron / Text Active color
content = content.replace(/activeFaqIndex === 0 \? \'rotate-180 text-\\[#0B94A4\\]\' \: \'\'/g, "activeFaqIndex === 0 ? 'rotate-180 text-indigo-650' : ''");

// Subscriptions play icon and tabs border line
content = content.replace(/bg-\\[#0B94A4\\]/g, 'bg-indigo-600');
content = content.replace(/text-\\[#0B94A4\\]/g, 'text-indigo-600');
content = content.replace(/border-\\[#0B94A4\\]/g, 'border-indigo-600');

fs.writeFileSync(filePath, content, 'utf8');
console.log('BikeRentalHome.jsx updated successfully.');
