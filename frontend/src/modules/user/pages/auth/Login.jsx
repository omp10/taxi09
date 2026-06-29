import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { getLocalUserToken, userAuthService } from '../../services/authService';
import { useSettings } from '../../../../shared/context/SettingsContext';
import loginIllustration from '../../../../assets/images/login-illustration.png';

const extractLoginErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  return (
    error?.message ||
    error?.error ||
    error?.details?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    ''
  );
};

const isBlockedAccountMessage = (message) => {
  const normalizedMessage = String(message || '').trim().toLowerCase();

  return (
    normalizedMessage.includes('not active') ||
    normalizedMessage.includes('blocked') ||
    normalizedMessage.includes('inactive')
  );
};

const getFriendlyLoginError = (message) => {
  const normalizedMessage = String(message || '').trim();
  const loweredMessage = normalizedMessage.toLowerCase();

  if (!normalizedMessage) {
    return 'Unable to send OTP. Please try again.';
  }

  if (
    loweredMessage.includes('not active') ||
    loweredMessage.includes('blocked') ||
    loweredMessage.includes('inactive')
  ) {
    return 'Your account has been blocked. Please contact support for help.';
  }

  return normalizedMessage;
};

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const phoneInputRef = useRef(null);
  const locationError = extractLoginErrorMessage(location.state?.error);
  
  const [phoneNumber, setPhoneNumber] = useState(() => String(location.state?.phone || '').replace(/\D/g, '').slice(-10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => (
    isBlockedAccountMessage(locationError) ? getFriendlyLoginError(locationError) : ''
  ));
  const [showInput, setShowInput] = useState(false);
  
  const appName = settings.general?.app_name || 'Taxi09';
  const appLogo = settings.general?.logo || settings.customization?.logo || settings.general?.favicon || '';
  
  const userHomeRoute = useMemo(
    () => (location.pathname.startsWith('/taxi/user') ? '/taxi/user' : '/user'),
    [location.pathname],
  );

  const isValidPhone = phoneNumber.length === 10 && /^\d+$/.test(phoneNumber);

  useEffect(() => {
    const token = getLocalUserToken();
    if (token) {
      navigate(userHomeRoute, { replace: true });
    }
  }, [navigate, userHomeRoute]);

  useEffect(() => {
    if (!location.state) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!isValidPhone || loading) return;

    setLoading(true);
    setError('');

    try {
      await userAuthService.startOtp(phoneNumber);
      navigate('/taxi/user/verify-otp', {
        state: { phone: phoneNumber },
      });
    } catch (err) {
      setError(getFriendlyLoginError(extractLoginErrorMessage(err)));
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
                <span className="material-symbols-outlined text-2xl">directions_car</span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Self-Drive & Chauffeur Rides</h3>
                <p className="text-xs text-slate-500 mt-1">Book direct or rental cars and bikes on demand with transparent pricing.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-600">
                <span className="material-symbols-outlined text-2xl">shield</span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">24/7 Verified Security</h3>
                <p className="text-xs text-slate-500 mt-1">Real-time SOS tracking, secure payments, and fully verified driver credentials.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 text-emerald-600">
                <span className="material-symbols-outlined text-2xl">electric_car</span>
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
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sign In / Register</h2>
            <p className="text-slate-500 text-sm">Enter your phone number to get started with Taxi09.</p>
          </div>

          <AnimatePresence mode="wait">
            {!showInput ? (
              <motion.div
                key="welcome-action"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <button
                  onClick={() => setShowInput(true)}
                  className="w-full py-5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl text-[16px] font-bold shadow-2xl flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  <Phone size={18} />
                  <span>Continue with Phone Number</span>
                </button>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span>SECURED LOGIN</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  By continuing, you agree that you have read and accept our{' '}
                  <Link to="/terms" className="text-amber-600 font-bold hover:underline">T&Cs</Link> and{' '}
                  <Link to="/privacy" className="text-amber-600 font-bold hover:underline">Privacy Policy</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="input-action"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowInput(false)}
                    className="p-2 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-900 transition-all cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <span className="font-extrabold text-sm text-slate-500 uppercase tracking-widest">Back</span>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
                    
                    <div className={`flex items-center gap-4 p-5 rounded-2xl transition-all border ${error ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50 focus-within:border-slate-900 focus-within:bg-white focus-within:shadow-xl'}`}>
                      <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
                        <img src="https://flagcdn.com/w40/in.png" alt="India" className="w-5 h-3.5 object-cover rounded-sm" />
                        <span className="text-slate-550 text-sm font-black">+91</span>
                      </div>
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        autoFocus
                        value={phoneNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setPhoneNumber(val);
                          if (error) setError('');
                        }}
                        placeholder="000 000 0000"
                        className="flex-1 bg-transparent border-none p-0 text-xl font-bold text-slate-900 outline-none focus:ring-0 placeholder:text-slate-300 tracking-widest"
                      />
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {error}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isValidPhone}
                    className={`w-full py-5 rounded-2xl text-[16px] font-bold transition-all flex items-center justify-center gap-3 cursor-pointer ${
                      isValidPhone
                        ? 'bg-[#FFC107] text-black hover:bg-amber-400 shadow-2xl shadow-amber-400/20'
                        : 'bg-slate-100 text-slate-400 pointer-events-none border border-slate-200/50'
                    }`}
                  >
                    {loading ? (
                      <div className="h-6 w-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="uppercase tracking-widest">Send Verification Code</span>
                        <ChevronRight size={20} strokeWidth={3} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer brand label */}
        <div className="text-center z-20 mt-auto text-xs text-slate-400 select-none">
          &copy; {new Date().getFullYear()} {appName}. Powered by OMP10.
        </div>

      </div>
    </div>
  );
};

export default Login;
