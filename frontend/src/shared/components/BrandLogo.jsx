import React from 'react';
import { useSettings } from '../context/SettingsContext';

/**
 * The brand mark, wherever it appears.
 *
 * Driven by the admin's Brand Logo setting (Settings -> General), so uploading
 * a new one updates every surface at once rather than needing a code change.
 * The built-in wordmark is only a fallback for when nothing has been uploaded
 * yet - it is not a second brand to keep in step.
 */
const BrandLogo = ({ height = 40, withTagline = false, className = '', onClick }) => {
  const { settings } = useSettings();
  const logo = settings?.general?.logo || '';
  const appName = settings?.general?.app_name || 'Taxi09';

  const Wrapper = onClick ? 'button' : 'span';
  const wrapperProps = onClick ? { type: 'button', onClick } : {};

  if (logo) {
    return (
      <Wrapper {...wrapperProps} className={`inline-flex shrink-0 items-center ${className}`}>
        <img
          src={logo}
          alt={appName}
          style={{ height }}
          className="w-auto max-w-full object-contain"
        />
      </Wrapper>
    );
  }

  // Fallback wordmark, sized off the same height so swapping between the two
  // does not change the surrounding layout.
  return (
    <Wrapper
      {...wrapperProps}
      className={`inline-flex shrink-0 flex-col justify-center leading-none ${className}`}
      style={{ height }}
    >
      <svg viewBox="0 0 120 22" style={{ height: height * 0.16, width: height * 1.1 }} aria-hidden="true">
        <path d="M4 20C22 4 74 -2 116 8" fill="none" stroke="#F5B700" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <span
        className="font-black italic tracking-[-0.05em]"
        style={{ fontSize: height * 0.52, color: 'currentColor' }}
      >
        Taxi<span className="text-[#F5B700]">09</span>
      </span>
      {withTagline ? (
        <span className="font-semibold opacity-60" style={{ fontSize: height * 0.16, marginTop: 2 }}>
          Self Drive | Hire Driver
        </span>
      ) : null}
    </Wrapper>
  );
};

export default BrandLogo;
