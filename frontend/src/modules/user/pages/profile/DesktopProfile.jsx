import React, { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BusFront, ChevronRight, Crown, FileText, Gift, HelpCircle, History,
  Loader2, LogOut, MapPin, Package, Shield, User, Wallet,
} from 'lucide-react';
import { AiChatBubble, DesktopNav } from '../../components/desktop/DesktopChrome';
import { useDesktopTheme } from '../../components/desktop/desktopShared';

/**
 * The account area on desktop.
 *
 * The phone app pushes each of these onto its own screen; on a wide screen
 * that wastes the space, so the menu stays on the left and the chosen section
 * renders beside it. Sections that already exist as their own pages are
 * embedded rather than reimplemented, so there is one copy of each.
 *
 * Anything living outside the account area - the wallet, membership, ride
 * history - still navigates away, since those are full pages in their own
 * right rather than panels.
 */

const ProfileSettings = lazy(() => import('./ProfileSettings'));
const AddressSettings = lazy(() => import('./AddressSettings'));
const PaymentSettings = lazy(() => import('./PaymentSettings'));
const Subscriptions = lazy(() => import('./Subscriptions'));
const BusBookings = lazy(() => import('./BusBookings'));

/** `panel` renders in place; `path` navigates away. */
const SECTIONS = [
  {
    title: 'Personal',
    items: [
      { key: 'settings', icon: User, title: 'Profile Settings', sub: 'Manage your personal info', panel: ProfileSettings },
      { key: 'addresses', icon: MapPin, title: 'Saved Addresses', sub: 'Home, office & others', panel: AddressSettings },
      { key: 'rides', icon: History, title: 'My Rides', sub: 'Rides, parcels & trips', path: '/taxi/user/activity' },
    ],
  },
  {
    title: 'Financial & Rewards',
    items: [
      { key: 'payments', icon: Wallet, title: 'Payment Methods', sub: 'Cards & saved methods', panel: PaymentSettings },
      { key: 'subscriptions', icon: Package, title: 'Subscriptions', sub: 'Ride plans & credits', panel: Subscriptions },
      { key: 'bus', icon: BusFront, title: 'Bus Tickets', sub: 'Manage bus bookings', panel: BusBookings },
      { key: 'membership', icon: Crown, title: 'Membership', sub: 'Save on every booking', path: '/taxi/user/membership' },
      { key: 'referral', icon: Gift, title: 'Refer & Earn', sub: 'Invite friends & get rewards', path: '/taxi/user/referral' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { key: 'notifications', icon: Bell, title: 'Notifications', sub: 'Offers & alerts', path: '/taxi/user/notifications' },
      { key: 'safety', icon: Shield, title: 'Security & SOS', sub: 'Trust & safety settings', path: '/safety/sos' },
      { key: 'support', icon: HelpCircle, title: 'Help & Support', sub: 'Help centre & tickets', path: '/taxi/user/support' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { key: 'terms', icon: FileText, title: 'Terms & Conditions', sub: 'Read service terms', path: '/terms' },
      { key: 'privacy', icon: FileText, title: 'Privacy Policy', sub: 'How we handle your data', path: '/taxi/user/privacy' },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((section) => section.items);

const DesktopProfile = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useDesktopTheme();
  const [active, setActive] = useState('settings');

  const current = ALL_ITEMS.find((item) => item.key === active) || ALL_ITEMS[0];
  const Panel = current.panel;

  const choose = (item) => {
    if (item.panel) setActive(item.key);
    else navigate(item.path);
  };

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/profile" theme={theme} onToggleTheme={toggleTheme} />

      <div className="mx-auto max-w-[1440px] px-8 pb-16 pt-5 xl:px-12">
        <h1 className="text-[24px] font-black text-slate-900">My Account</h1>

        <div className="mt-4 grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
          {/* Menu */}
          <aside className="space-y-4">
            {SECTIONS.map((section) => (
              <section key={section.title} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                <p className="border-b border-slate-100 px-4 py-2.5 text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const selected = item.panel && item.key === active;
                  return (
                    <button
                      key={item.key}
                      onClick={() => choose(item)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        selected ? 'bg-[#FFF9E6]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        selected ? 'bg-[#F5B700] text-slate-900' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <item.icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-[13px] ${selected ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                          {item.title}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">{item.sub}</span>
                      </span>
                      <ChevronRight size={14} className="shrink-0 text-slate-300" />
                    </button>
                  );
                })}
              </section>
            ))}

            <button
              onClick={() => navigate('/taxi/user/login')}
              className="flex w-full items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-black text-rose-700"
            >
              <LogOut size={15} /> Log out
            </button>
          </aside>

          {/* Selected section. The embedded pages carry their own phone chrome,
              so they are capped to a readable column rather than stretched. */}
          <section className="min-h-[560px] overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-[16px] font-black text-slate-900">{current.title}</h2>
              <p className="text-[12px] text-slate-500">{current.sub}</p>
            </div>

            <Suspense
              fallback={
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-slate-400" />
                </div>
              }
            >
              {Panel ? (
                <div className="[&_.max-w-lg]:mx-0 [&_.max-w-lg]:max-w-none">
                  <Panel embedded />
                </div>
              ) : null}
            </Suspense>
          </section>
        </div>
      </div>

      <AiChatBubble />
    </div>
  );
};

export default DesktopProfile;
