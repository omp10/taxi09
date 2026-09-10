import React, { useEffect, useMemo, useState } from 'react';
import { 
    ChevronRight, 
    ShieldCheck, 
    Briefcase, 
    User, 
    Building2, 
    CheckCircle2, 
    Check, 
    Phone, 
    ChevronDown, 
    ArrowRight,
    UserCheck,
    Bus
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    buildDriverOnboardingSessionSnapshot,
    clearDriverRegistrationSession,
    getDriverOnboardingResumeStep,
    getDriverOnboardingSession,
    getStoredDriverRegistrationSession,
    saveDriverRegistrationSession,
    sendDriverLoginOtp,
    sendDriverOtp,
} from '../../services/registrationService';

import { useSettings } from '../../../../shared/context/SettingsContext';
import sunnyTaxiBg from '../../../../assets/images/sunny_taxi_bg.jpg';

const ROLE_CONFIG = [
    { id: 'driver', label: 'DRIVER', Icon: User, color: '#FFB800' },
    { id: 'owner', label: 'OWNER', Icon: Briefcase, color: '#FFB800' },
    { id: 'bus_driver', label: 'BUS', Icon: Bus, color: '#FFB800' },
    { id: 'service_center', label: 'CENTER', Icon: Building2, color: '#FFB800' },
    { id: 'service_center_staff', label: 'STAFF', Icon: UserCheck, color: '#FFB800' },
];

const getErrorMessage = (err) => String(
    err?.message ||
    err?.error ||
    err?.response?.data?.message ||
    '',
).trim();

const isAlreadyRegisteredError = (err) =>
    Number(err?.status || err?.response?.status) === 409 &&
    getErrorMessage(err).toLowerCase().includes('already registered');

const isAccountNotFoundError = (err) =>
    Number(err?.status || err?.response?.status) === 404 &&
    getErrorMessage(err).toLowerCase().includes('account not found');

const getFlowRoutePrefix = (selectedRole) =>
    String(selectedRole || '').toLowerCase() === 'owner' ? '/taxi/owner' : '/taxi/driver';

const PhoneRegistration = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { settings } = useSettings();
    const appName = settings.general?.app_name || 'TAXI09';
    const appLogo = settings.general?.logo || settings.customization?.logo || settings.general?.favicon || '';
    const storedSession = getStoredDriverRegistrationSession();
    const isOwnerPortal = location.pathname.startsWith('/taxi/owner');
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const sharedReferralCode = String(
        searchParams.get('ref') ||
        searchParams.get('referral') ||
        searchParams.get('code') ||
        storedSession.referralCode ||
        '',
    ).trim().toUpperCase();
    
    const [phone, setPhone] = useState(() => String(location.state?.phone || storedSession.phone || '').replace(/\D/g, '').slice(-10));
    const [role, setRole] = useState(() => {
        if (isOwnerPortal) return 'owner';

        const normalizePortalRole = (value) => {
            const normalized = String(value || '').toLowerCase();
            if (normalized === 'owner') return 'owner';
            if (normalized === 'bus_driver' || normalized === 'bus-driver' || normalized === 'busdriver') return 'bus_driver';
            if (normalized === 'service_center' || normalized === 'service-center' || normalized === 'servicecenter') return 'service_center';
            if (normalized === 'service_center_staff' || normalized === 'service-center-staff' || normalized === 'servicecenterstaff') return 'service_center_staff';
            return 'driver';
        };

        const stateRole = String(location.state?.role || '').toLowerCase();
        if (stateRole) return normalizePortalRole(stateRole);
        return normalizePortalRole(storedSession.role);
    });
    
    const [agreed, setAgreed] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const routePrefix = isOwnerPortal ? '/taxi/owner' : '/taxi/driver';
    const isLoginPage = location.pathname === `${routePrefix}/login` || location.pathname === `${routePrefix}/login/`;
    const entryPath = isLoginPage ? `${routePrefix}/login` : `${routePrefix}/reg-phone`;
    const shouldUseUnifiedFlow = (role === 'driver') && routePrefix === '/taxi/driver';
    const portalLabel = isOwnerPortal ? 'Owner' : 'Driver';
    const roleOptions = isOwnerPortal
        ? ROLE_CONFIG.filter((item) => item.id === 'owner')
        : ROLE_CONFIG;
    
    const activeRole = ROLE_CONFIG.find(r => r.id === role) || ROLE_CONFIG[0];
    const storedSessionResumeKey = JSON.stringify({
        registrationId: storedSession.registrationId || '',
        phone: storedSession.phone || '',
        role: storedSession.role || '',
        otpVerified: Boolean(storedSession.otpVerified),
        status: storedSession.status || '',
    });

    useEffect(() => {
        saveDriverRegistrationSession({
            ...storedSession,
            role: isOwnerPortal ? 'owner' : role,
            phone,
            loginMode: isLoginPage,
            entryPath,
            referralCode: sharedReferralCode,
        });
    }, [entryPath, isLoginPage, isOwnerPortal, role, phone, sharedReferralCode]);

    useEffect(() => {
        if (isOwnerPortal && role !== 'owner') {
            setRole('owner');
        }
    }, [isOwnerPortal, role]);

    useEffect(() => {
        let active = true;

        const resumeOnboardingIfNeeded = async () => {
            if (isLoginPage) {
                return;
            }

            const storedPhone = String(storedSession.phone || '').replace(/\D/g, '').slice(-10);
            const storedRegistrationId = String(storedSession.registrationId || '').trim();
            const storedRole = String(storedSession.role || 'driver').toLowerCase();
            const expectedRole = isOwnerPortal ? 'owner' : role;
            const flowRoutePrefix = getFlowRoutePrefix(storedRole || expectedRole);

            if (!storedPhone || !storedRegistrationId || storedRole !== expectedRole) {
                return;
            }

            if (storedSession.otpVerified) {
                navigate(`${flowRoutePrefix}/${getDriverOnboardingResumeStep(storedSession)}`, {
                    replace: true,
                    state: saveDriverRegistrationSession(storedSession),
                });
                return;
            }

            try {
                const response = await getDriverOnboardingSession({
                    registrationId: storedRegistrationId,
                    phone: storedPhone,
                });
                const payload = response?.data?.data || response?.data || response;
                const nextSession = saveDriverRegistrationSession(
                    buildDriverOnboardingSessionSnapshot(payload, storedSession),
                );

                if (!active || !nextSession.otpVerified) {
                    return;
                }

                navigate(`${flowRoutePrefix}/${getDriverOnboardingResumeStep(nextSession)}`, {
                    replace: true,
                    state: nextSession,
                });
            } catch (err) {
                const status = Number(err?.status || err?.response?.status || 0);
                if (status === 404 || status === 410) {
                    clearDriverRegistrationSession();
                }
            }
        };

        resumeOnboardingIfNeeded();

        return () => {
            active = false;
        };
    }, [isLoginPage, isOwnerPortal, navigate, role, routePrefix, storedSessionResumeKey]);

    useEffect(() => {
        document.title = `${appName} | ${isLoginPage ? `${portalLabel} Login` : `${portalLabel} Registration`}`;
    }, [appName, isLoginPage, portalLabel]);

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }
        if (!agreed) {
            setError('Please accept Terms & Privacy to continue');
            return;
        }

        setLoading(true);
        setError('');

        try {
            clearDriverRegistrationSession();
            let response;
            let loginMode = isLoginPage;
            const requestRole = isOwnerPortal ? 'owner' : role;
            const flowRoutePrefix = getFlowRoutePrefix(requestRole);
            const flowEntryPath = `${flowRoutePrefix}/login`;

            if (isOwnerPortal) {
                try {
                    response = await sendDriverOtp({ phone, role: requestRole });
                    loginMode = false;
                } catch (requestError) {
                    if (isAccountNotFoundError(requestError)) {
                        response = await sendDriverOtp({ phone, role: requestRole });
                        loginMode = false;
                    } else {
                        if (!isAlreadyRegisteredError(requestError)) throw requestError;

                        response = await sendDriverLoginOtp({ phone, role: requestRole });
                        loginMode = true;
                    }
                }
            } else if (shouldUseUnifiedFlow) {
                try {
                    response = isLoginPage
                        ? await sendDriverLoginOtp({ phone, role: requestRole })
                        : await sendDriverOtp({ phone, role: requestRole });
                    loginMode = isLoginPage;
                } catch (requestError) {
                    if (isLoginPage && ['driver', 'owner'].includes(requestRole)) {
                        if (!isAccountNotFoundError(requestError)) throw requestError;

                        response = await sendDriverOtp({ phone, role: requestRole });
                        loginMode = false;
                    } else {
                        if (!isAlreadyRegisteredError(requestError)) throw requestError;

                        response = await sendDriverLoginOtp({ phone, role: requestRole });
                        loginMode = true;
                    }
                }
            } else {
                try {
                    response = isLoginPage ? await sendDriverLoginOtp({ phone, role: requestRole }) : await sendDriverOtp({ phone, role: requestRole });
                    loginMode = isLoginPage;
                } catch (requestError) {
                    if (isLoginPage && ['driver', 'owner'].includes(requestRole)) {
                        if (!isAccountNotFoundError(requestError)) throw requestError;

                        response = await sendDriverOtp({ phone, role: requestRole });
                        loginMode = false;
                    } else {
                        if (!isAlreadyRegisteredError(requestError)) throw requestError;

                        response = await sendDriverLoginOtp({ phone, role: requestRole });
                        loginMode = true;
                    }
                }
            }

            const sessionData = response?.data?.session || response?.session || {};
            loginMode = Boolean(sessionData.loginMode || response?.data?.loginMode || response?.loginMode || loginMode);
            const nextState = saveDriverRegistrationSession({
                phone,
                role: requestRole,
                registrationId: sessionData.registrationId || '',
                debugOtp: sessionData.debugOtp || '',
                loginMode,
                entryPath: flowEntryPath,
                referralCode: sharedReferralCode,
            });

            navigate(`${flowRoutePrefix}/otp-verify`, { state: nextState });
        } catch (err) {
            setError(getErrorMessage(err) || 'Try again in a moment');
        } finally {
            setLoading(false);
        }
    };

    const getRoleName = () => {
        if (role === 'owner') return 'owner';
        if (role === 'bus_driver') return 'bus driver';
        if (role === 'service_center') return 'service center';
        if (role === 'service_center_staff') return 'staff';
        return 'driver';
    };

    return (
        <div className="min-h-screen relative bg-[#F8FAFC] select-none overflow-x-hidden font-['Outfit'] flex flex-col justify-between">
            {/* Background image & gradient overlays */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img 
                    src={sunnyTaxiBg} 
                    alt="City Taxi Background" 
                    className="w-full h-full object-cover object-center"
                />
                {/* Sun flare & warm soft glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/70 to-white/95" />
                <div className="absolute top-0 left-0 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
                
                {/* Bottom Left Topo / Contour Decorative Waves */}
                <div className="absolute -bottom-10 -left-10 w-72 h-72 pointer-events-none opacity-45 overflow-hidden">
                    <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <circle cx="50" cy="250" r="40" stroke="#FFB800" strokeWidth="1" strokeDasharray="3 3" />
                        <circle cx="50" cy="250" r="70" stroke="#FFB800" strokeWidth="1.2" />
                        <circle cx="50" cy="250" r="100" stroke="#FFB800" strokeWidth="1" strokeDasharray="4 4" />
                        <circle cx="50" cy="250" r="130" stroke="#FFB800" strokeWidth="1.2" />
                        <circle cx="50" cy="250" r="160" stroke="#FFB800" strokeWidth="1" strokeDasharray="2 3" />
                        <circle cx="50" cy="250" r="190" stroke="#FFB800" strokeWidth="1.2" />
                        <circle cx="50" cy="250" r="220" stroke="#FFB800" strokeWidth="1" />
                        <circle cx="50" cy="250" r="250" stroke="#FFB800" strokeWidth="1.2" />
                        <circle cx="50" cy="250" r="280" stroke="#FFB800" strokeWidth="0.8" />
                    </svg>
                </div>
            </div>

            {/* Main Content Container */}
            <main className="relative z-10 mx-auto w-full max-w-sm sm:max-w-md px-5 sm:px-6 pt-10 pb-10 flex-1 flex flex-col justify-between">
                <div>
                    {/* App Logo & Brand Header */}
                    <div className="text-center flex flex-col items-center">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="w-20 h-20 bg-white rounded-[24px] shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-slate-100/90 p-2.5 flex items-center justify-center"
                        >
                            {appLogo ? (
                                <img
                                    src={appLogo}
                                    alt="Taxi09 Logo"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-1">
                                        <div className="w-5 h-3 bg-amber-400 rounded-sm flex items-center justify-center text-[7px] font-black text-black">🚕</div>
                                        <div className="w-5 h-3 bg-amber-400 rounded-sm flex items-center justify-center text-[7px] font-black text-black">🚕</div>
                                    </div>
                                    <div className="text-[13px] font-black text-slate-900 tracking-tight leading-none mt-1">
                                        TAXI<span className="text-[#FFB800]">09</span>
                                    </div>
                                    <div className="text-[6.5px] font-bold text-slate-600 tracking-tighter mt-0.5">
                                        Self Drive • Hire Driver
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        <p className="text-[12px] font-black uppercase tracking-[0.28em] text-slate-800 mt-2.5">
                            TAXI09
                        </p>
                    </div>

                    {/* SELECT YOUR ROLE Section */}
                    <div className="mt-7">
                        <p className="text-[10.5px] font-black uppercase tracking-[0.24em] text-slate-500 text-center mb-3">
                            SELECT YOUR ROLE
                        </p>

                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5 justify-start sm:justify-center">
                            {roleOptions.map((item) => {
                                const active = role === item.id;
                                return (
                                    <motion.button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            setRole(item.id);
                                            setError('');
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`flex-none flex items-center gap-2 py-2.5 px-4 sm:px-5 rounded-[18px] transition-all cursor-pointer ${
                                            active
                                                ? 'bg-white border-2 border-[#FFB800] text-slate-950 font-black shadow-[0_6px_20px_rgba(255,184,0,0.2)]'
                                                : 'bg-white/80 backdrop-blur-sm border border-slate-200/80 text-slate-600 font-bold hover:bg-white'
                                        }`}
                                    >
                                        <item.Icon 
                                            size={16} 
                                            strokeWidth={active ? 3 : 2.2} 
                                            className={active ? 'text-[#FFB800]' : 'text-slate-400'} 
                                        />
                                        <span className="text-[11.5px] uppercase tracking-wider">{item.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Input Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[34px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100/90 space-y-5 mt-5"
                    >
                        {/* Phone Number Field */}
                        <div className={`flex items-center gap-3 px-4 py-3.5 rounded-[20px] transition-all border ${
                            error 
                                ? 'border-rose-300 bg-rose-50/20' 
                                : 'border-slate-200/90 bg-[#F9FAFB] focus-within:bg-white focus-within:border-[#FFB800] focus-within:ring-4 focus-within:ring-amber-400/15 shadow-inner/sm'
                        }`}>
                            {/* Country Code with Chevron */}
                            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-200 text-slate-800 font-black text-base select-none">
                                <span>+91</span>
                                <ChevronDown size={15} strokeWidth={2.5} className="text-slate-400" />
                            </div>

                            {/* Phone Receiver Icon */}
                            <Phone size={18} className="text-slate-400 shrink-0" strokeWidth={2} />

                            {/* Phone Input */}
                            <input 
                                type="tel" 
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={10}
                                value={phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setPhone(val);
                                    if (error) setError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && phone.length === 10 && agreed && !loading) {
                                        handleSendOTP(e);
                                    }
                                }}
                                placeholder="Phone Number"
                                className="flex-1 bg-transparent border-none p-0 text-lg font-bold text-slate-900 outline-none focus:ring-0 placeholder:text-slate-400 placeholder:font-normal"
                            />

                            {/* Success validation tick */}
                            {phone.length === 10 && (
                                <motion.div 
                                    initial={{ scale: 0 }} 
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                                </motion.div>
                            )}
                        </div>

                        {/* Terms & Privacy Checkbox */}
                        <div className="flex items-center gap-3 px-1">
                            <button
                                type="button"
                                onClick={() => setAgreed(!agreed)}
                                className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                    agreed 
                                        ? 'bg-[#FFB800] text-slate-950 shadow-sm shadow-amber-300' 
                                        : 'border-2 border-slate-300 bg-white hover:border-slate-400'
                                }`}
                            >
                                {agreed && <Check size={14} strokeWidth={3.5} />}
                            </button>
                            <label 
                                onClick={() => setAgreed(!agreed)}
                                className="text-[13.5px] font-medium text-slate-600 leading-snug cursor-pointer select-none"
                            >
                                I accept the{' '}
                                <span 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`${routePrefix}/terms`);
                                    }} 
                                    className="text-[#FF9E00] font-bold hover:underline cursor-pointer"
                                >
                                    Terms & Privacy
                                </span>
                            </label>
                        </div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-rose-600 text-xs font-bold text-center bg-rose-50 border border-rose-200/80 p-2.5 rounded-xl"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Need help? Contact Support */}
                    <div className="text-center mt-5">
                        <p className="text-slate-500 text-[13px] font-semibold">
                            Need help?{' '}
                            <button
                                type="button"
                                onClick={() => navigate(`${routePrefix}/support`)}
                                className="text-[#FF9E00] font-bold hover:underline cursor-pointer"
                            >
                                Contact Support
                            </button>
                        </p>
                    </div>
                </div>

                {/* GET STARTED CTA Button */}
                <div className="mt-7">
                    <motion.button 
                        whileHover={phone.length === 10 && agreed && !loading ? { scale: 1.02 } : {}}
                        whileTap={phone.length === 10 && agreed && !loading ? { scale: 0.98 } : {}}
                        onClick={handleSendOTP}
                        disabled={loading || !agreed || phone.length !== 10}
                        className={`w-full py-4.5 rounded-[22px] font-black text-[15px] uppercase tracking-[0.14em] flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                            agreed && phone.length === 10 && !loading
                                ? 'bg-[#FFB800] hover:bg-[#FFAE00] text-slate-950 shadow-[0_12px_28px_rgba(255,184,0,0.38)] hover:shadow-[0_14px_32px_rgba(255,184,0,0.48)]' 
                                : 'bg-slate-200/80 text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                    >
                        {loading ? (
                            <div className="h-5 w-5 border-3 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>GET STARTED</span>
                                <ArrowRight size={19} strokeWidth={3} />
                            </>
                        )}
                    </motion.button>

                    {/* Bottom Home Indicator Bar for Native App Feel */}
                    <div className="w-32 h-1 bg-slate-950/80 rounded-full mx-auto mt-6" />
                </div>
            </main>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default PhoneRegistration;

