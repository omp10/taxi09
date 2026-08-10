import React from 'react';
import { useSettings } from '../context/SettingsContext';

/**
 * Floating WhatsApp contact, bottom-left on every customer-facing page.
 *
 * The number comes from the admin's General settings (WhatsApp Number), so it
 * is changed in one place rather than in the markup. Digits are stripped to
 * build the wa.me link and re-grouped for display, so the admin can type the
 * number in whatever shape they like.
 */

const DEFAULT_NUMBER = '919753000064';

const toDigits = (value) => String(value || '').replace(/\D/g, '');

/** wa.me needs a country code; a bare 10-digit Indian number gets 91. */
const toWaNumber = (digits) => {
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits.replace(/^0+/, '');
};

const formatForDisplay = (waNumber) => {
  if (waNumber.startsWith('91') && waNumber.length === 12) {
    const local = waNumber.slice(2);
    return `(+91) ${local.slice(0, 3)} ${local.slice(3, 7)} ${local.slice(7)}`;
  }
  return `+${waNumber}`;
};

const WhatsAppFloat = () => {
  const { settings } = useSettings();

  const configured = settings?.general?.whatsapp_number;

  // Clearing the field in the admin hides the button; leaving it unset (never
  // configured) falls back to the default rather than offering no contact.
  if (configured !== undefined && String(configured).trim() === '') {
    return null;
  }

  const waNumber = toWaNumber(toDigits(configured)) || DEFAULT_NUMBER;

  return (
    <a
      href={`https://wa.me/${waNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 left-5 z-[9999] flex items-center gap-2 rounded-full bg-[#25D366] py-1.5 pl-1.5 pr-4 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 print:hidden"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-[#25D366]" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.25-4.36c0-4.54 3.7-8.24 8.25-8.24a8.19 8.19 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.21-8.24 8.21z" />
        </svg>
      </span>
      <span className="whitespace-nowrap text-[15px] font-semibold">
        WhatsApp - {formatForDisplay(waNumber)}
      </span>
    </a>
  );
};

export default WhatsAppFloat;
