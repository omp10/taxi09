import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, Trash2, Tag, ShieldCheck, Star, AlertCircle, RefreshCw, Megaphone, CheckCircle2 } from 'lucide-react';
import BottomNavbar from '../components/BottomNavbar';
import { userAuthService } from '../services/authService';
import {
  USER_NOTIFICATIONS_UPDATED_EVENT,
  clearRealtimeNotifications,
  getRealtimeNotifications,
  isRealtimeNotification,
  removeRealtimeNotification,
} from '../utils/realtimeNotificationStore';
import toast from 'react-hot-toast';

const formatNotificationTime = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TYPE_ICONS = {
  ride:     { icon: Star,        bg: 'bg-amber-50',   color: 'text-[#d48c00]'  },
  promo:    { icon: Tag,         bg: 'bg-rose-50',    color: 'text-rose-500'   },
  safety:   { icon: ShieldCheck, bg: 'bg-blue-50',    color: 'text-blue-500'   },
  referral: { icon: Star,        bg: 'bg-emerald-50', color: 'text-emerald-500' },
  parcel:   { icon: Bell,        bg: 'bg-violet-50',  color: 'text-violet-500' },
};

const SkeletonCard = () => (
  <div className="animate-pulse rounded-[20px] bg-white/70 border border-slate-200/50 p-4 flex items-start gap-3">
    <div className="w-10 h-10 rounded-[12px] bg-slate-200 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-200 rounded-full w-2/3" />
      <div className="h-2.5 bg-slate-100 rounded-full w-full" />
      <div className="h-2.5 bg-slate-100 rounded-full w-4/5" />
    </div>
  </div>
);

const Notifications = () => {
  const navigate = useNavigate();
  const [serverNotifications, setServerNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clearing, setClearing] = useState(false);

  const notifications = useMemo(() => {
    const merged = [...serverNotifications, ...getRealtimeNotifications()];

    return merged
      .filter((notification) => notification?.id)
      .sort((left, right) => {
        const leftTime = new Date(left.sentAt || 0).getTime();
        const rightTime = new Date(right.sentAt || 0).getTime();
        return rightTime - leftTime;
      });
  }, [serverNotifications]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userAuthService.getNotifications();
      setServerNotifications(response?.data?.results || []);
    } catch (err) {
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    const handleRealtimeNotificationsUpdated = () => {
      setServerNotifications((current) => [...current]);
    };

    window.addEventListener(USER_NOTIFICATIONS_UPDATED_EVENT, handleRealtimeNotificationsUpdated);

    return () => {
      window.removeEventListener(USER_NOTIFICATIONS_UPDATED_EVENT, handleRealtimeNotificationsUpdated);
    };
  }, []);

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;

    setClearing(true);
    try {
      await userAuthService.clearAllNotifications();
      clearRealtimeNotifications();
      setServerNotifications([]);
      toast.success('All notifications cleared', {
        icon: <CheckCircle2 size={18} className="text-emerald-500" />,
        className: 'font-bold text-[13px] rounded-2xl shadow-xl border border-emerald-50 bg-white',
      });
    } catch (err) {
      toast.error(err?.message || 'Failed to clear notifications');
    } finally {
      setClearing(false);
    }
  };

  const handleRemoveSingle = async (id) => {
    if (isRealtimeNotification(id)) {
      removeRealtimeNotification(id);
      toast.success('Notification removed', {
        className: 'font-bold text-[13px] rounded-2xl shadow-xl border border-slate-50 bg-white',
      });
      return;
    }

    try {
      await userAuthService.deleteNotification(id);
      setServerNotifications((prev) => prev.filter((notification) => notification.id !== id));
      toast.success('Notification removed', {
        className: 'font-bold text-[13px] rounded-2xl shadow-xl border border-slate-50 bg-white',
      });
    } catch (err) {
      toast.error('Failed to remove notification');
    }
  };

  const totalCount = useMemo(() => notifications.length, [notifications.length]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FAF9F5_0%,#F6F4EB_50%,#EAE7D7_100%)] max-w-lg mx-auto font-sans pb-28 relative overflow-hidden">
      <div className="absolute -top-16 right-[-40px] h-44 w-44 rounded-full bg-[#ffc400]/20 blur-3xl pointer-events-none" />
      <div className="absolute top-52 left-[-60px] h-52 w-52 rounded-full bg-[#ffd54f]/15 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="bg-gradient-to-r from-[#ffc400] to-[#ffd54f] px-5 pt-12 pb-4 sticky top-0 z-20 border-b border-amber-500/25 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/taxi/user/profile')} className="w-9 h-9 rounded-[12px] border border-white/40 bg-white/85 flex items-center justify-center shadow-sm active:scale-95 transition-all text-[#332000] hover:bg-white">
            <ArrowLeft size={18} className="text-[#332000]" strokeWidth={2.5} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.26em] text-[#5c4600]">Inbox</p>
            <h1 className="text-[19px] font-black tracking-tight text-[#332000] leading-tight">Notifications</h1>
          </div>
          <div className="bg-[#332000] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
            {totalCount}
          </div>
        </div>
      </header>

      <div className="px-5 pt-4 space-y-2.5">
        <div className="flex items-center justify-between px-1 mb-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">System Alerts</p>
          <div className="flex items-center gap-2 shrink-0">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearing || loading}
                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all disabled:opacity-50 shrink-0 border border-rose-100"
              >
                <Trash2 size={11} strokeWidth={2.5} />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={fetchNotifications}
              className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all shrink-0 border border-slate-200/50"
            >
              <RefreshCw size={11} strokeWidth={2.5} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 bg-[#ffc400]/10 border border-[#ffc400]/20 rounded-3xl flex items-center justify-center">
              <AlertCircle size={28} className="text-[#d48c00]" strokeWidth={2} />
            </div>
            <p className="text-[14px] font-black text-slate-700">{error}</p>
            <button onClick={fetchNotifications}
              className="flex items-center gap-2 bg-[#ffc400] text-[#332000] px-6 py-3 rounded-full text-[12px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md">
              <RefreshCw size={13} strokeWidth={2.5} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] border border-[#ffc400]/20 rounded-3xl flex items-center justify-center shadow-sm">
              <Bell size={36} className="text-[#d48c00]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[16px] font-black text-slate-700">You're all caught up</p>
              <p className="text-[12px] font-bold text-slate-400 mt-1">No new notifications right now</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {!loading && !error && notifications.map((n) => {
            const typeConfig = TYPE_ICONS[n.type] || { icon: Megaphone, bg: 'bg-[#ffc400]/10', color: 'text-[#d48c00]' };
            const IconComponent = typeConfig.icon;

            return (
              <motion.div key={n.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="relative rounded-[20px] border border-slate-200/50 bg-white hover:bg-gradient-to-b hover:from-white hover:to-[#fffbeb] hover:border-[#ffc400] p-4 flex items-start gap-3 transition-all duration-300 shadow-[0_4px_14px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_20px_rgba(255,196,0,0.1)]">
                <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${typeConfig.bg} border border-slate-100 shadow-sm`}>
                  <IconComponent size={16} className={typeConfig.color} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] leading-tight font-black text-slate-900">{n.title || 'Notification'}</p>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                        {formatNotificationTime(n.sentAt)}
                      </span>
                      <button
                        onClick={() => handleRemoveSingle(n.id)}
                        className="p-1.5 text-slate-350 hover:text-[#d48c00] transition-colors"
                      >
                        <Trash2 size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 mt-1 leading-relaxed whitespace-pre-wrap">{n.body || 'No message'}</p>
                  
                  {n.image && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                      <img 
                        src={n.image} 
                        alt="Notification content" 
                        className="w-full h-auto max-h-[180px] object-cover"
                      />
                    </div>
                  )}

                  {n.serviceLocationName && (
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">
                      {n.serviceLocationName}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <BottomNavbar />
    </div>
  );
};

export default Notifications;
