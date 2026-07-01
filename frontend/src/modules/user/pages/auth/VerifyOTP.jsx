import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ChevronRight, MessageSquare, Car, ShieldCheck, Zap } from 'lucide-react';
import { userAuthService } from '../../services/authService';
import { useSettings } from '../../../../shared/context/SettingsContext';
import loginIllustration from '../../../../assets/images/login-illustration.png';

const unwrap = (response) => response?.data?.data || response?.data || response;
const PENDING_SIGNUP_PHONE_KEY = 'pendingUserSignupPhone';
const PENDING_OTP_PHONE_KEY = 'pendingUserOtpPhone';
const PENDING_SIGNUP_REFERRAL_CODE_KEY = 'pendingUserSignupReferralCode';
const RESEND_OTP_COOLDOWN_SECONDS = 60;

const syncPushTokens = () => {
  window.__flushNativeFcmToken?.().catch?.(() => {});
  window.__registerBrowserFcmToken?.({ interactive: true }).catch?.(() => {});
};

const notifyAuthReady = () => {
  window.dispatchEvent(new CustomEvent('app:auth-ready', {
    detail: {
      role: 'user',
      hasToken: true,
      source: 'user',
    },
  }));
};

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const inputs = useRef([]);
  
  const phone = String(
    location.state?.phone ||
    sessionStorage.getItem(PENDING_OTP_PHONE_KEY) ||
    sessionStorage.getItem(PENDING_SIGNUP_PHONE_KEY) ||
    '',
  ).replace(/\D/g, '').slice(-10);
  
  const referralCode = String(
    location.state?.referralCode ||
    sessionStorage.getItem(PENDING_SIGNUP_REFERRAL_CODE_KEY) ||
    '',
  ).trim().toUpperCase();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(RESEND_OTP_COOLDOWN_SECONDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const appName = settings.general?.app_name || 'Taxi09';
  const appLogo = settings.general?.logo || settings.customization?.logo || settings.general?.favicon || '';

  useEffect(() => {
    if (!phone) {
      navigate('/taxi/user/signup', { replace: true });
      return;
    }
    sessionStorage.setItem(PENDING_OTP_PHONE_KEY, phone);
  }, [navigate, phone]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      inputs.current[0]?.focus();
    }, 500);
    return () => window.clearTimeout(focusTimer);
  }, []);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
    setError('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 4 || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await userAuthService.verifyOtp(phone, fullOtp);
      const payload = unwrap(response);

      setSuccess(true);

      if (payload.exists) {
        localStorage.setItem('token', payload.token || '');
        localStorage.setItem('userToken', payload.token || '');
        localStorage.setItem('role', 'user');
        localStorage.setItem('userInfo', JSON.stringify(payload.user || {}));
        notifyAuthReady();
        syncPushTokens();
        sessionStorage.removeItem(PENDING_OTP_PHONE_KEY);
        setTimeout(() => navigate('/taxi/user', { replace: true }), 1000);
        return;
      }

      setTimeout(() => navigate('/taxi/user/signup', { state: { phone, otpVerified: true, referralCode } }), 1000);
    } catch (err) {
      setError(err?.message || 'Invalid code. Please try again.');
      setOtp(['', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      await userAuthService.startOtp(phone);
      setOtp(['', '', '', '']);
      setTimer(RESEND_OTP_COOLDOWN_SECONDS);
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-850 flex flex-col lg:flex-row font-['Outfit'] select-none overflow-hidden relative">
      {/* Desktop Left Side Branding Panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#f1f5f9] relative items-center justify-center p-12 overflow-hidden border-r border-slate-200/80">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FFC107]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-lg space-y-10">
          {/* Logo */}
          <div className="flex items-center gap-3 w-fit bg-white border border-slate-200 p-2.5 pr-5 rounded-full shadow-sm backdrop-blur-md">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="h-10 w-10 object-contain rounded-full bg-black p-1.5" />
            ) : (
              <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm" />
              </div>
            )}
            <span className="text-xl font-black italic tracking-widest text-slate-900 uppercase">
              TAXI<span className="text-[#FFC107]">09</span>
            </span>
          </div>

          {/* Tagline */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-900">
              Explore new ways to<br/>travel with <span className="text-[#FFC107]">{appName}</span>
            </h1>
            <p className="text-slate-500 text-base md:text-lg">
              Premium mobility solutions at your fingertips. Self-drive rentals, chauffeur cabs, and more.
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 text-[#d48c00]">
                <Car size={24} className="text-[#d48c00]" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Self-Drive & Chauffeur Rides</h3>
                <p className="text-xs text-slate-500 mt-1">Book direct or rental cars and bikes on demand with transparent pricing.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-600">
                <ShieldCheck size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">24/7 Verified Security</h3>
                <p className="text-xs text-slate-500 mt-1">Real-time SOS tracking, secure payments, and fully verified driver credentials.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 text-emerald-600">
                <Zap size={24} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Eco-Friendly Premium Fleet</h3>
                <p className="text-xs text-slate-500 mt-1">Ride in standard sedan, SUV, or premium electric fleets optimized for efficiency.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Image/Graphic overlay */}
        <div className="absolute right-0 bottom-0 w-[400px] h-[300px] opacity-[0.15] pointer-events-none">
          <img src={loginIllustration} alt="" className="w-full h-full object-cover object-left-top" />
        </div>
      </div>

      {/* Right Side Input Panel (Split on desktop, full width on mobile) */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between bg-white min-h-screen relative p-6 sm:p-12 lg:p-16">
        
        {/* Mobile-only Logo header */}
        <div className="flex items-center justify-between lg:hidden z-20">
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-1.5 pr-3 rounded-full">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="h-6 w-6 object-contain rounded-full" />
            ) : (
              <div className="w-2 h-2 bg-[#FFC107] rounded-full" />
            )}
            <span className="text-xs font-black text-slate-900">TAXI09</span>
          </div>
        </div>

        {/* Centered Login Card */}
        <div className="my-auto w-full max-w-md mx-auto z-20 space-y-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-900 transition-all cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="font-extrabold text-sm text-slate-500 uppercase tracking-widest">Back</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Verify Number</h2>
            <p className="text-slate-500 text-sm">
              We've sent a code to <span className="text-slate-900 font-bold">+91 {phone}</span>
            </p>
          </div>

          {/* OTP Inputs */}
          <div className="flex justify-between gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputs.current[index] = el)}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`h-16 w-full rounded-2xl border-2 text-center text-3xl font-black transition-all outline-none ${
                  digit 
                    ? 'border-slate-900 bg-slate-50 text-slate-900 shadow-lg' 
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-900 focus:bg-white'
                }`}
              />
            ))}
          </div>

          <div className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center animate-in fade-in"
                >
                  <p className="text-rose-500 text-xs font-bold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col items-center gap-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={timer > 0 || loading}
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                  timer > 0 
                    ? 'text-slate-300' 
                    : 'text-slate-900 hover:opacity-75 underline underline-offset-4 decoration-2'
                }`}
              >
                <MessageSquare size={14} />
                {timer > 0 ? `Retry in ${timer}s` : 'Resend Code'}
              </button>
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 4 || success}
            className={`w-full py-5 rounded-2xl text-[16px] font-bold transition-all flex items-center justify-center gap-3 cursor-pointer ${
              otp.join('').length === 4 && !success
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xl'
                : success
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-slate-100 text-slate-400 pointer-events-none border border-slate-200/50'
            }`}
          >
            {loading ? (
              <div className="h-6 w-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            ) : success ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} />
                <span className="uppercase tracking-[0.15em]">Verified</span>
              </div>
            ) : (
              <>
                <span className="uppercase tracking-[0.15em]">Verify & Continue</span>
                <ChevronRight size={20} strokeWidth={3} />
              </>
            )}
          </button>
        </div>

        {/* Footer brand label */}
        <div className="text-center z-20 mt-auto text-xs text-slate-400 select-none">
          &copy; {new Date().getFullYear()} {appName}. Powered by OMP10.
        </div>

      </div>
    </div>
  );
};

export default VerifyOTP;
