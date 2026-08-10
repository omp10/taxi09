import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Siren,
  Ticket,
  XCircle,
} from 'lucide-react';
import { DesktopNav } from '../../components/desktop/DesktopChrome';
import { useDesktopTheme } from '../../components/desktop/desktopShared';
import { SUPPORT_INFO } from '../../../shared/content/supportInfo';

/**
 * Help & Support on desktop.
 *
 * Same actions as the phone layout - open a chat, call, raise a ticket - laid
 * out for a wide screen and wearing the desktop chrome. Every contact detail
 * comes from the shared SUPPORT_INFO, so the two layouts cannot disagree.
 */

const HELP_TOPICS = [
  { title: "Driver didn't arrive", icon: XCircle, tone: 'text-rose-500 bg-rose-50' },
  { title: 'Safety concern', icon: ShieldCheck, tone: 'text-blue-600 bg-blue-50' },
  { title: 'I lost an item', icon: HelpCircle, tone: 'text-orange-500 bg-orange-50' },
  { title: 'Payment failure', icon: AlertCircle, tone: 'text-slate-700 bg-slate-100' },
];

const DesktopSupport = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useDesktopTheme();

  const openChat = (topic = '') =>
    navigate('/taxi/user/ride/chat?admin=true&role=user', {
      state: topic ? { initialDraft: `Hi, I need help with: ${topic}.` } : undefined,
    });

  return (
    <div className={`desktop-home ${theme === 'dark' ? 'theme-dark' : ''} min-h-screen bg-[var(--dh-bg)] font-sans`}>
      <DesktopNav activePath="/taxi/user/support" theme={theme} onToggleTheme={toggleTheme} />

      <div className="mx-auto max-w-[1440px] px-8 pb-16 pt-5 xl:px-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            {/* Hero */}
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-r from-[#FFF9E6] to-white p-8">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF0B8] px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-[#9A6B00]">
                <Clock size={12} /> {SUPPORT_INFO.supportLabel}
              </span>
              <h1 className="mt-3 text-[34px] font-black leading-tight text-slate-900">Help &amp; Support</h1>
              <p className="mt-2 max-w-2xl text-[14px] text-slate-600">
                {SUPPORT_INFO.serviceArea}. {SUPPORT_INFO.responseTime}.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <button
                  onClick={() => openChat()}
                  className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3.5 text-left"
                >
                  <MessageCircle size={19} className="shrink-0 text-[#F5B700]" />
                  <span>
                    <span className="block text-[13.5px] font-black text-white">Chat with us</span>
                    <span className="block text-[11px] text-slate-300">Usually replies fastest</span>
                  </span>
                </button>

                <a
                  href={`tel:${SUPPORT_INFO.phoneHref}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
                >
                  <Phone size={19} className="shrink-0 text-emerald-600" />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-black text-slate-900">Call us</span>
                    <span className="block truncate text-[11px] text-slate-500">{SUPPORT_INFO.phone}</span>
                  </span>
                </a>

                <button
                  onClick={() => navigate('/taxi/user/support/tickets')}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left"
                >
                  <Ticket size={19} className="shrink-0 text-[#C79100]" />
                  <span>
                    <span className="block text-[13.5px] font-black text-slate-900">My tickets</span>
                    <span className="block text-[11px] text-slate-500">Track a request</span>
                  </span>
                </button>
              </div>
            </section>

            {/* Topics */}
            <h2 className="mt-8 text-[19px] font-black text-slate-900">What do you need help with?</h2>
            <p className="text-[12.5px] text-slate-500">Pick a topic and we will start the chat for you.</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {HELP_TOPICS.map((topic) => (
                <button
                  key={topic.title}
                  onClick={() => openChat(topic.title)}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left transition-shadow hover:shadow-md"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${topic.tone}`}>
                    <topic.icon size={18} />
                  </span>
                  <span className="text-[14px] font-black text-slate-900">{topic.title}</span>
                </button>
              ))}
            </div>

            {/* Emergency */}
            <button
              onClick={() => navigate('/taxi/user/sos')}
              className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <Siren size={18} className="text-rose-600" />
              </span>
              <span>
                <span className="block text-[14px] font-black text-rose-900">Emergency SOS</span>
                <span className="block text-[12px] text-rose-700">Get safety help fast</span>
              </span>
            </button>
          </div>

          {/* Contact details */}
          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-100 bg-white p-5">
              <h2 className="text-[15px] font-black text-slate-900">Contact</h2>

              <dl className="mt-3 space-y-3.5 text-[12.5px]">
                <div className="flex gap-2.5">
                  <Phone size={15} className="mt-0.5 shrink-0 text-[#C79100]" />
                  <span>
                    <dt className="font-bold text-slate-900">{SUPPORT_INFO.phone}</dt>
                    <dd className="text-slate-500">{SUPPORT_INFO.availability}</dd>
                  </span>
                </div>
                <div className="flex gap-2.5">
                  <Mail size={15} className="mt-0.5 shrink-0 text-[#C79100]" />
                  <span className="min-w-0">
                    <dt className="break-all font-bold text-slate-900">{SUPPORT_INFO.email}</dt>
                    <dd className="text-slate-500">{SUPPORT_INFO.responseTime}</dd>
                  </span>
                </div>
                <div className="flex gap-2.5">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[#C79100]" />
                  <span>
                    <dt className="font-bold text-slate-900">{SUPPORT_INFO.companyName}</dt>
                    <dd className="text-slate-500">{SUPPORT_INFO.officeAddress}</dd>
                  </span>
                </div>
              </dl>
            </section>

            <div className="rounded-2xl bg-gradient-to-br from-[#FFD400] to-[#F5B700] p-5">
              <p className="text-[15px] font-black text-slate-900">Still stuck?</p>
              <p className="mt-1 text-[12px] text-slate-800">
                Start a chat and a real person will pick it up.
              </p>
              <button
                onClick={() => openChat()}
                className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-[12.5px] font-black text-white"
              >
                Open chat
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DesktopSupport;
