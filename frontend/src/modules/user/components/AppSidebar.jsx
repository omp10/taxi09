import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronRight,
  FileText,
  Gift,
  Headset,
  Home,
  LogOut,
  MapPin,
  Share2,
  Shield,
  Star,
  Tag,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { clearLocalUserSession, userAuthService } from '../services/authService';

/**
 * Slide-in navigation drawer for the mobile app bar.
 *
 * Everything shown here is read from the API - the name, phone and wallet
 * balance included. Sections with nothing behind them are left out rather than
 * filled with placeholder numbers.
 */

const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const NAV_SECTIONS = [
  {
    items: [
      { icon: Home, label: 'Home', path: '/taxi/user' },
      { icon: User, label: 'Manage Profile', path: '/taxi/user/profile/settings' },
      { icon: FileText, label: 'My Bookings', path: '/taxi/user/activity' },
      { icon: MapPin, label: 'My Trips', path: '/taxi/user/activity', state: { tab: 'Rides' } },
      { icon: Wallet, label: 'Wallet', path: '/taxi/user/wallet', showsBalance: true },
      { icon: MapPin, label: 'Favourite Locations', path: '/taxi/user/profile/addresses' },
      { icon: Tag, label: 'Offers & Deals', path: '/taxi/user/promo', badge: 'NEW' },
      { icon: Gift, label: 'Refer & Earn', path: '/taxi/user/referral', badge: 'EARN' },
      { icon: Headset, label: 'Support / FAQ', path: '/taxi/user/support/tickets' },
    ],
  },
  {
    title: 'Community',
    items: [
      { icon: Share2, label: 'Share Us', action: 'share' },
      { icon: Star, label: 'Rate Us & Comment', path: '/taxi/user/support' },
    ],
  },
  {
    title: 'About Taxi09',
    items: [
      { icon: FileText, label: 'Terms & Conditions', path: '/taxi/user/terms' },
      { icon: Shield, label: 'Privacy Policy', path: '/taxi/user/privacy' },
      { icon: FileText, label: 'Refund Policy', path: '/taxi/user/refund' },
    ],
  },
];

const AppSidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState({ name: '', phone: '', image: '' });
  const [wallet, setWallet] = useState(null);

  // Loaded on first open, so a user who never opens the drawer pays nothing.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    const pick = (payload) => payload?.data || payload?.result || payload || {};

    Promise.allSettled([userAuthService.getCurrentUser(), userAuthService.getWallet()]).then(
      ([userResult, walletResult]) => {
        if (cancelled) return;

        if (userResult.status === 'fulfilled') {
          // /users/me nests the record one level deeper than the wallet does.
          const body = pick(userResult.value);
          const user = body.user || body;
          setProfile({
            name: user.name || '',
            phone: user.phone || '',
            image: user.profileImage || user.image || '',
          });
        }

        if (walletResult.status === 'fulfilled') {
          const data = pick(walletResult.value);
          const balance = data.balance ?? data.walletBalance ?? data.amount;
          if (Number.isFinite(Number(balance))) setWallet(Number(balance));
        }
      },
    );

    return () => { cancelled = true; };
  }, [open]);

  // Escape to close, and no background scrolling while the drawer is up.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const share = async () => {
    const url = `${window.location.origin}/taxi/user`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Taxi09', text: 'Book rides, rentals and stays on Taxi09', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {
      // A dismissed share sheet is not an error worth surfacing.
    }
  };

  const go = (item) => {
    onClose();
    if (item.action === 'share') { share(); return; }
    navigate(item.path, item.state ? { state: item.state } : undefined);
  };

  const logout = () => {
    clearLocalUserSession();
    onClose();
    navigate('/taxi/user/login', { replace: true });
  };

  // Portalled to the body: the app bar it lives in is a z-50 sticky element, and
  // staying inside that stacking context would let the bottom tab bar paint over
  // the drawer. The inner column keeps it aligned with the phone-width shell.
  return createPortal(
    <div className={`lg:hidden fixed inset-0 z-[100] flex justify-center ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-[330px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out"
        // Inline rather than a utility class: the composed translate utilities
        // resolved to 0 here, which left the panel sitting open over the page.
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
        role="dialog"
        aria-label="Menu"
      >
        {/* Brand header */}
        <div className="bg-gradient-to-b from-[#FFD400] to-[#F5B700] px-5 pb-5 pt-4">
          <div className="flex items-start justify-between">
            <div className="leading-none">
              <span className="text-[24px] font-black italic tracking-[-0.05em] text-slate-950">
                Taxi<span className="rounded-full bg-slate-950 px-2 py-0.5 text-[#F5B700]">09</span>
              </span>
              <p className="mt-2 text-[11.5px] font-semibold text-slate-800">Ride Your Way</p>
            </div>
            <button onClick={onClose} aria-label="Close menu" className="rounded-full p-1.5 text-slate-900 active:scale-95">
              <X size={20} strokeWidth={2.6} />
            </button>
          </div>

          {/* Profile card */}
          <button
            onClick={() => go({ path: '/taxi/user/profile' })}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-white px-3.5 py-3 text-left shadow-sm active:scale-[0.99]"
          >
            {profile.image ? (
              <img src={profile.image} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white">
                <User size={20} />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-black text-slate-900">
                {profile.name || 'Your account'}
              </span>
              <span className="block truncate text-[12.5px] font-semibold text-slate-500">
                {profile.phone || 'Tap to view profile'}
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {NAV_SECTIONS.map((section, index) => (
            <div key={section.title || index} className={index ? 'mt-3 border-t border-slate-100 pt-3' : ''}>
              {section.title ? (
                <p className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {section.title}
                </p>
              ) : null}

              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.path === location.pathname && !item.state;

                return (
                  <button
                    key={item.label}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      active ? 'bg-[#FFF7DB]' : 'active:bg-slate-50'
                    }`}
                  >
                    <Icon size={19} strokeWidth={2} className={active ? 'text-[#C79100]' : 'text-slate-700'} />
                    <span className={`flex-1 text-[14px] ${active ? 'font-black text-slate-900' : 'font-semibold text-slate-800'}`}>
                      {item.label}
                    </span>

                    {item.badge ? (
                      <span className="rounded-md bg-[#FFF0B8] px-1.5 py-0.5 text-[9.5px] font-black text-[#9A6B00]">
                        {item.badge}
                      </span>
                    ) : null}

                    {/* Only rendered once the balance has actually arrived. */}
                    {item.showsBalance && wallet !== null ? (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-700">
                        {money(wallet)}
                      </span>
                    ) : null}

                    <ChevronRight size={16} className="shrink-0 text-slate-300" />
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 px-4 py-3">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-[14px] font-black text-red-600 active:scale-[0.99]"
          >
            <LogOut size={18} strokeWidth={2.4} /> Logout
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
};

export default AppSidebar;
