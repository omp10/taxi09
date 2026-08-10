import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, MapPin, Moon, Phone, Sun, UserRound } from 'lucide-react';
import { NAV_LINKS, QUICK_RAIL, SERVICES, openRentalVehicle, readUserToken } from './desktopShared';
import { useSettings } from '../../../../shared/context/SettingsContext';
import BrandLogo from '../../../../shared/components/BrandLogo';

/**
 * Chrome shared by the desktop landing pages (home, self drive).
 *
 * These pieces are identical across those screens, so they live here rather
 * than being copied per page - the nav in particular has to stay consistent.
 */

export const DesktopNav = ({ activePath, theme, onToggleTheme, loading = false }) => {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(readUserToken());

  return (
    <header className="sticky top-0 z-50 bg-[var(--dh-bg)] px-4 pb-2 pt-3 xl:px-6">
      <div className="relative mx-auto flex max-w-[1440px] items-stretch gap-2.5">
        {/* The mark sits on its own panel, set apart from the links. */}
        <button
          onClick={() => navigate('/taxi/user')}
          className="flex h-[76px] shrink-0 items-center justify-center rounded-[20px] bg-[var(--dh-surface)] px-4 text-[var(--dh-text)] ring-1 ring-[var(--dh-border)]"
        >
          <BrandLogo height={52} withTagline />
        </button>

        <div className="flex h-[76px] min-w-0 flex-1 items-center gap-1 rounded-[20px] bg-[var(--dh-surface)] px-3 ring-1 ring-[var(--dh-border)]">
          {/* Ten links do not fit on a narrow desktop. Scrolling keeps every
              one of them reachable instead of letting the row collide with the
              account button or quietly clipping the last few. */}
          <nav className="dh-nav-scroll flex min-w-0 flex-1 items-center justify-start overflow-x-auto">
            {NAV_LINKS.map(({ label, path, badge, icon: Icon }) => {
              const isActive = path === activePath;
              return (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className={`group flex shrink-0 items-center whitespace-nowrap rounded-[14px] px-1.5 py-2.5 text-[14.5px] transition-colors ${
                    isActive
                      ? 'bg-[#F5B700] font-bold text-slate-950'
                      : 'font-semibold text-[var(--dh-text)] hover:bg-[var(--dh-chip)] hover:text-[#F5B700]'
                  }`}
                >
                  {/* Ten permanent icons would not fit, so the slot opens for
                      the current link and on hover rather than jumping wide. */}
                  {Icon ? (
                    <span
                      className={`flex items-center overflow-hidden transition-[width] duration-200 ${
                        isActive ? 'w-[20px]' : 'w-0 group-hover:w-[20px]'
                      }`}
                    >
                      <Icon size={16} strokeWidth={2.4} className="shrink-0" />
                    </span>
                  ) : null}
                  {label}
                  {badge ? (
                    <span
                      className={`ml-1.5 rounded-md px-1.5 py-[2px] text-[10px] font-black ${
                        isActive ? 'bg-slate-950 text-[#F5B700]' : 'bg-[#F5B700] text-slate-950'
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 pl-1">
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-2 rounded-full px-1 py-2"
              aria-label="Toggle theme"
              aria-pressed={theme === 'dark'}
            >
              <Sun size={18} className={theme === 'light' ? 'text-[#F5B700]' : 'text-[var(--dh-muted)]'} strokeWidth={2.4} />
              <Moon size={18} className={theme === 'dark' ? 'text-[#F5B700]' : 'text-[var(--dh-muted)]'} strokeWidth={2.4} />
            </button>

            <button
              onClick={() => navigate(isAuthenticated ? '/taxi/user/profile' : '/taxi/user/login')}
              className="flex h-[52px] items-center gap-2 rounded-[16px] bg-[#F5B700] px-4 text-[16px] font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
            >
              <UserRound size={18} strokeWidth={2.6} />
              {isAuthenticated ? 'My Account' : 'Login / Sign Up'}
              <ChevronDown size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
      {/* Indeterminate bar: the page cannot know how much is left, so it
          sweeps rather than pretending to measure progress. */}
      {loading ? (
        <div className="dh-navbar-progress absolute inset-x-0 bottom-0 h-[3px] overflow-hidden">
          <span className="dh-navbar-progress-fill block h-full w-1/3 rounded-full bg-[#F5B700]" />
        </div>
      ) : null}
    </header>
  );
};

export const QuickRail = () => {
  const navigate = useNavigate();

  return (
    <div className="absolute -right-1 top-1/2 w-[104px] -translate-y-1/2 rounded-[20px] bg-[var(--dh-surface)] py-4 shadow-[0_18px_44px_rgba(15,23,42,0.16)]">
      {QUICK_RAIL.map(({ icon: Icon, label, path }) => (
        <button
          key={label}
          onClick={() => navigate(path)}
          className="flex w-full flex-col items-center gap-1.5 px-2 py-2.5 transition-colors hover:bg-[var(--dh-chip)]"
        >
          <Icon size={22} className="text-[#F5B700]" strokeWidth={2.2} />
          <span className="text-center text-[12.5px] font-bold leading-tight text-[var(--dh-text)]">{label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Live vehicle panel. Driven by the real rental catalogue - these are cars
 * that are actually listed, not invented "recently booked" rows.
 */
export const LiveFleetPanel = ({ fleet, className = '' }) => {
  const navigate = useNavigate();
  if (!fleet.length) return null;

  return (
    <div className={`w-[230px] rounded-[18px] bg-[var(--dh-surface)] p-4 shadow-[0_18px_44px_rgba(15,23,42,0.16)] ${className}`}>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <span className="text-[15.5px] font-black text-[var(--dh-text)]">Live Booking</span>
      </div>
      <p className="mt-1 text-[14px] font-semibold text-[var(--dh-muted)]">Available now</p>

      <div className="mt-3 space-y-2">
        {fleet.map((vehicle) => (
          <button
            key={vehicle.id || vehicle._id}
            onClick={() => openRentalVehicle(navigate, vehicle)}
            className="flex w-full items-center gap-2.5 rounded-[12px] border border-[var(--dh-border)] p-2 text-left"
          >
            <img
              src={vehicle.image || vehicle.coverImage || '/taxi09_rental_self_drive.png'}
              alt=""
              className="h-9 w-12 shrink-0 rounded-[6px] object-cover"
            />
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-black text-[var(--dh-text)]">{vehicle.name}</span>
              <span className="block truncate text-[13px] font-semibold text-[var(--dh-muted)]">
                {vehicle.vehicleCategory || 'Car'}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const ServiceCard = ({ title, copy, image, path, badge, highlighted }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className={`group relative flex flex-col overflow-hidden rounded-[18px] p-3.5 text-left shadow-[0_8px_24px_rgba(15,23,42,0.07)] transition-transform hover:-translate-y-1 ${
        highlighted
          ? 'bg-[#FFFCF2] ring-2 ring-[#F5B700]'
          : 'bg-[var(--dh-surface)] ring-1 ring-[var(--dh-border)]'
      }`}
    >
      {badge && (
        <span className="absolute left-0 top-0 rounded-br-[12px] bg-[#F5B700] px-2.5 py-1 text-[12.5px] font-black text-slate-950">
          {badge}
        </span>
      )}
      <img src={image} alt="" className="h-[92px] w-full object-contain" />
      <span className="mt-2.5 block min-h-[40px] text-[16.5px] font-black leading-[1.3] tracking-[-0.02em] text-[var(--dh-text)]">{title}</span>
      <span className="mt-1.5 block min-h-[70px] text-[13.5px] font-medium leading-[1.45] text-[var(--dh-muted)]">{copy}</span>
      <span className="mt-auto flex h-8 w-8 items-center justify-center self-end rounded-full border border-[#F5B700] mt-3 text-[#F5B700] transition-colors group-hover:bg-[#F5B700] group-hover:text-slate-950">
        <ArrowRight size={15} strokeWidth={2.8} />
      </span>
    </button>
  );
};

/**
 * Site footer for the desktop pages.
 *
 * Everything here is real: the phone numbers and the two copyright lines come
 * from the admin's general settings, the service links are the same ones the
 * nav and the service grid use, and the cities are the branches the fleet
 * actually operates from. Anything the admin has not filled in is left out
 * rather than replaced with a plausible-looking placeholder.
 */
export const DesktopFooter = ({ locations = [] }) => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const general = settings?.general || {};

  const phones = [
    { label: 'Bookings', value: general.contact_booking_number },
    { label: 'Support', value: general.contact_phone_1 },
    { label: 'Alternate', value: general.contact_phone_2 },
  ].filter((item) => String(item.value || '').trim());

  // Whatever the nav offers that the Services column does not already list.
  const serviceLabels = new Set(SERVICES.map((service) => service.title));
  const company = NAV_LINKS.filter(
    (link) => link.label !== 'Home' && !serviceLabels.has(link.label) && !SERVICES.some((service) => service.path === link.path),
  );

  const column = 'text-[14.5px] font-medium text-[var(--dh-muted)] transition-colors hover:text-[#F5B700]';

  return (
    <footer className="border-t border-[var(--dh-border)] bg-[var(--dh-surface)]">
      <div className="mx-auto max-w-[1440px] px-8 py-12 xl:px-12">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-10">
          <div>
            <div className="flex text-[var(--dh-text)]">
              <BrandLogo height={48} />
            </div>
            <p className="mt-4 max-w-[300px] text-[15px] font-medium leading-[1.65] text-[var(--dh-muted)]">
              Self drive cars, bikes, buses, hotels and tour packages - booked in one place,
              with round the clock support on every trip.
            </p>
            {phones.length ? (
              <div className="mt-5 space-y-2">
                {phones.map(({ label, value }) => (
                  <a
                    key={label}
                    href={`tel:${value}`}
                    className="flex items-center gap-2.5 text-[15px] font-semibold text-[var(--dh-text)] transition-colors hover:text-[#F5B700]"
                  >
                    <Phone size={15} className="shrink-0 text-[#F5B700]" strokeWidth={2.4} />
                    {value}
                    <span className="text-[13.5px] font-medium text-[var(--dh-muted)]">{label}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-[13.5px] font-black uppercase tracking-[0.12em] text-[var(--dh-text)]">Services</p>
            <ul className="mt-4 space-y-2.5">
              {SERVICES.map((service) => (
                <li key={service.title}>
                  <button type="button" onClick={() => navigate(service.path)} className={column}>
                    {service.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[13.5px] font-black uppercase tracking-[0.12em] text-[var(--dh-text)]">Company</p>
            <ul className="mt-4 space-y-2.5">
              {company.map((link) => (
                <li key={link.label}>
                  <button type="button" onClick={() => navigate(link.path)} className={column}>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {locations.length ? (
            <div>
              <p className="text-[13.5px] font-black uppercase tracking-[0.12em] text-[var(--dh-text)]">Where We Operate</p>
              <ul className="mt-4 space-y-2.5">
                {locations.map((name) => (
                  <li key={name} className="flex items-start gap-2 text-[14.5px] font-medium text-[var(--dh-muted)]">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-[#F5B700]" strokeWidth={2.4} />
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {general.footer_1 || general.footer_2 ? (
          <div className="mt-10 flex items-center justify-between gap-6 border-t border-[var(--dh-border)] pt-6">
            <p className="text-[14px] font-medium text-[var(--dh-muted)]">{general.footer_1}</p>
            <p className="text-[14px] font-medium text-[var(--dh-muted)]">{general.footer_2}</p>
          </div>
        ) : null}
      </div>
    </footer>
  );
};
