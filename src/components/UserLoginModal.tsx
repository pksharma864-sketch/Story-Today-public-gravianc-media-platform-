import React, { useState, useEffect } from 'react';
import { UserAccount, Language, UserRole } from '../types';
import { loginUser, createUser } from '../lib/api';
import { translations } from '../i18n/translations';
import {
  X,
  User,
  Lock,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Check,
  Newspaper,
  UserCheck,
  Mail,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';

interface Props {
  lang: Language;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
}

export const UserLoginModal: React.FC<Props> = ({
  lang,
  initialMode = 'login',
  onClose,
  onLoginSuccess,
}) => {
  const t = translations[lang];
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('citizen');
  const [regEmail, setRegEmail] = useState('');
  const [regAvatar, setRegAvatar] = useState<string | null>(null);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);

  // Shared State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialMode]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(lang === 'hi' ? 'फ़ोटो 5MB से कम होनी चाहिए।' : 'Photo must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setRegAvatar(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    if (pass.length < 4) return { score: 1, label: 'Too Short', color: 'bg-red-500' };
    
    let strength = 1;
    if (pass.length >= 8) strength += 1;
    if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;

    if (strength <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (strength === 3) return { score: 3, label: 'Good', color: 'bg-emerald-500' };
    return { score: 4, label: 'Strong', color: 'bg-teal-600' };
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया यूज़रनेम और पासवर्ड दोनों दर्ज करें।' : 'Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await loginUser(loginUsername.trim(), loginPassword.trim());
      if (res.success && res.user) {
        setSuccessMsg(
          lang === 'hi'
            ? `स्वागत है, ${res.user.name}! सफलतापूर्वक लॉगिन हो गए।`
            : `Welcome back, ${res.user.name}!`
        );
        setTimeout(() => {
          onLoginSuccess(res.user);
          onClose();
        }, 500);
      } else {
        setErrorMsg(res.error || (lang === 'hi' ? 'अमान्य क्रेडेंशियल्स। कृपया पुन: प्रयास करें।' : 'Invalid username or password. Please try again.'));
      }
    } catch {
      setErrorMsg(lang === 'hi' ? 'सर्वर से जुड़ने में त्रुटि हुई।' : 'An unexpected network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name.');
      return;
    }
    if (!regUsername.trim() || regUsername.trim().length < 3) {
      setErrorMsg(lang === 'hi' ? 'यूज़रनेम कम से कम 3 अक्षरों का होना चाहिए।' : 'Username must be at least 3 characters long.');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMsg(lang === 'hi' ? 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।' : 'Password must be at least 4 characters long.');
      return;
    }
    if (regPassword !== regConfirmPass) {
      setErrorMsg(lang === 'hi' ? 'पासवर्ड मेल नहीं खाते हैं।' : 'Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await createUser({
        name: regName.trim(),
        username: regUsername.trim().toLowerCase(),
        password: regPassword.trim(),
        role: regRole,
        email: regEmail.trim() || undefined,
        avatar: regAvatar || undefined,
      });

      if (res.success && res.user) {
        setSuccessMsg(
          lang === 'hi'
            ? `खाता सफलतापूर्वक बन गया! स्वागत है, ${res.user.name}!`
            : `Account created successfully! Welcome, ${res.user.name}!`
        );
        setTimeout(() => {
          onLoginSuccess(res.user!);
          onClose();
        }, 700);
      } else {
        setErrorMsg(res.error || (lang === 'hi' ? 'खाता बनाने में त्रुटि हुई।' : 'Failed to create account. Username might already exist.'));
      }
    } catch {
      setErrorMsg(lang === 'hi' ? 'सर्वर से जुड़ने में त्रुटि हुई।' : 'An unexpected error occurred while registering.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="user-auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="user-auth-modal-content"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E0E0E0] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E0E0E0] bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#004D40] text-white flex items-center justify-center shadow-xs">
              {mode === 'login' ? (
                <LogIn className="w-5 h-5 text-[#E0F2F1]" />
              ) : (
                <UserPlus className="w-5 h-5 text-[#E0F2F1]" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A1A1A]">
                {mode === 'login'
                  ? lang === 'hi'
                    ? 'खाते में लॉगिन करें'
                    : 'Sign In to Account'
                  : lang === 'hi'
                  ? 'नया खाता बनाएं'
                  : 'Create New Account'}
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                {mode === 'login'
                  ? lang === 'hi'
                    ? 'नागरिक, रिपोर्टर या व्यवस्थापक के रूप में प्रवेश करें'
                    : 'Access your Citizen, Reporter or Admin account'
                  : lang === 'hi'
                  ? 'नागरिक या स्वतंत्र पत्रकार के रूप में तुरंत जुड़ें'
                  : 'Join as a Citizen Reporter or Verified Journalist'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-[#F0F0F0] border-b border-[#E0E0E0] text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            id="tab-auth-login"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'login'
                ? 'bg-white text-[#004D40] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'लॉगिन' : 'Sign In'}</span>
          </button>
          <button
            type="button"
            id="tab-auth-register"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'register'
                ? 'bg-white text-[#004D40] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'नया खाता बनाएं' : 'Create Account'}</span>
          </button>
        </div>

        {/* Notifications */}
        <div className="px-5 pt-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}
        </div>

        {/* Form Body */}
        {mode === 'login' ? (
          /* ==================================================== */
          /* LOGIN FORM                                           */
          /* ==================================================== */
          <form onSubmit={handleLoginSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                {lang === 'hi' ? 'यूज़रनेम या ईमेल' : 'Username or Email'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-login-username"
                  type="text"
                  required
                  placeholder={lang === 'hi' ? 'अपना यूज़रनेम या ईमेल दर्ज करें' : 'Enter username or email'}
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-lg border border-[#E0E0E0] focus:border-[#004D40] focus:outline-hidden bg-white font-medium text-gray-800"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#1A1A1A]">
                  {lang === 'hi' ? 'पासवर्ड' : 'Password'} <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-login-password"
                  type={showLoginPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-9 pr-10 py-2.5 rounded-lg border border-[#E0E0E0] focus:border-[#004D40] focus:outline-hidden bg-white font-mono text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                  title={showLoginPass ? 'Hide password' : 'Show password'}
                >
                  {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-submit-user-login"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#E0F2F1]" />
              <span>
                {isLoading
                  ? lang === 'hi'
                    ? 'लॉगिन हो रहा है...'
                    : 'Signing in...'
                  : lang === 'hi'
                  ? 'लॉगिन करें'
                  : 'Sign In to Account'}
              </span>
            </button>

            {/* Quick Admin Helper */}
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-[11px] text-gray-600">
              <div>
                <span>Admin Login: </span>
                <strong className="font-mono text-gray-800">admin</strong> / <strong className="font-mono text-gray-800">admin123</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginUsername('admin');
                  setLoginPassword('admin123');
                  setErrorMsg('');
                }}
                className="text-[#004D40] hover:underline font-bold text-xs cursor-pointer"
              >
                ⚡ Fill Admin
              </button>
            </div>

            {/* Switch to Register link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-[#004D40] hover:underline font-semibold"
              >
                {lang === 'hi'
                  ? 'नया खाता बनाना चाहते हैं? यहां क्लिक करें →'
                  : "Don't have an account? Create one now →"}
              </button>
            </div>
          </form>
        ) : (
          /* ==================================================== */
          /* REGISTER FORM                                        */
          /* ==================================================== */
          <form onSubmit={handleRegisterSubmit} className="p-5 space-y-4">
            {/* Account Role Selector Cards */}
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                {lang === 'hi' ? 'खाते का प्रकार चुनें' : 'Select Account Type / Role'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Citizen Card */}
                <div
                  onClick={() => setRegRole('citizen')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    regRole === 'citizen'
                      ? 'border-[#004D40] bg-[#E0F2F1]/50 ring-2 ring-[#004D40]/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                      <User className="w-4 h-4 text-blue-700" />
                      <span>{lang === 'hi' ? 'नागरिक (Citizen)' : 'Citizen'}</span>
                    </div>
                    {regRole === 'citizen' && (
                      <div className="w-4 h-4 rounded-full bg-[#004D40] text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight">
                    {lang === 'hi'
                      ? 'नागरिक शिकायतें दर्ज करें, वार्ड समस्याओं को ट्रैक करें और समर्थन दें।'
                      : 'Report civic grievances, track ward complaints & upvote community stories.'}
                  </p>
                </div>

                {/* Reporter Card */}
                <div
                  onClick={() => setRegRole('reporter')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    regRole === 'reporter'
                      ? 'border-[#004D40] bg-[#E0F2F1]/50 ring-2 ring-[#004D40]/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                      <Newspaper className="w-4 h-4 text-[#004D40]" />
                      <span>{lang === 'hi' ? 'रिपोर्टर (Reporter)' : 'Journalist / Reporter'}</span>
                    </div>
                    {regRole === 'reporter' && (
                      <div className="w-4 h-4 rounded-full bg-[#004D40] text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight">
                    {lang === 'hi'
                      ? 'स्थानीय समाचार, ग्राउंड रिपोर्टिंग और ब्रेकिंग अपडेट्स प्रकाशित करें।'
                      : 'Publish verified local news, cover ward events & ground investigations.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Photo Upload (Optional) */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <label className="block text-xs font-bold text-[#1A1A1A] mb-2 flex items-center justify-between">
                <span>{lang === 'hi' ? 'प्रोफ़ाइल फ़ोटो (ऐच्छिक)' : 'Profile Photo (Optional)'}</span>
                <span className="text-[10px] text-gray-400 font-normal">Gallery / Camera</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 text-[#004D40] flex items-center justify-center font-bold text-sm border-2 border-white shadow-xs shrink-0">
                  {regAvatar ? (
                    <img src={regAvatar} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 cursor-pointer shadow-2xs transition-colors">
                    <Camera className="w-3.5 h-3.5 text-[#004D40]" />
                    <span>{lang === 'hi' ? 'फ़ोटो चुनें' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  {regAvatar && (
                    <button
                      type="button"
                      onClick={() => setRegAvatar(null)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Name and Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  {lang === 'hi' ? 'पूरा नाम' : 'Full Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-reg-name"
                    type="text"
                    required
                    placeholder={lang === 'hi' ? 'उदा. अमित कुमार' : 'e.g. Vikram Sharma'}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-lg border border-[#E0E0E0] focus:border-[#004D40] focus:outline-hidden bg-white font-medium text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  {lang === 'hi' ? 'यूज़रनेम' : 'Username'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">@</span>
                  <input
                    id="input-reg-username"
                    type="text"
                    required
                    placeholder="vikram_news"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full text-xs sm:text-sm pl-8 pr-3 py-2 rounded-lg border border-[#E0E0E0] focus:border-[#004D40] focus:outline-hidden bg-white font-mono text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Optional Email */}
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                {lang === 'hi' ? 'ईमेल या संपर्क' : 'Email (Optional)'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-reg-email"
                  type="email"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-lg border border-[#E0E0E0] focus:border-[#004D40] focus:outline-hidden bg-white font-medium text-gray-800"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  {lang === 'hi' ? 'पासवर्ड' : 'Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-reg-password"
                    type={showRegPass ? 'text' : 'password'}
                    required
                    placeholder="Min 4 chars"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full text-xs sm:text-sm pl-9 pr-9 py-2 rounded-lg border border-[#E0E0E0] focus:border-[#004D40] focus:outline-hidden bg-white font-mono text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                  >
                    {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {regPassword && (
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">Strength:</span>
                    <span
                      className={`font-bold ${
                        getPasswordStrength(regPassword).score <= 1
                          ? 'text-red-600'
                          : getPasswordStrength(regPassword).score === 2
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {getPasswordStrength(regPassword).label}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  {lang === 'hi' ? 'पासवर्ड पुष्टि करें' : 'Confirm Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-reg-confirm-password"
                    type={showRegConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={regConfirmPass}
                    onChange={(e) => setRegConfirmPass(e.target.value)}
                    className={`w-full text-xs sm:text-sm pl-9 pr-9 py-2 rounded-lg border bg-white font-mono text-gray-800 focus:outline-hidden ${
                      regConfirmPass && regPassword !== regConfirmPass
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-[#E0E0E0] focus:border-[#004D40]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                  >
                    {showRegConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {regConfirmPass && (
                  <div className="mt-1 text-[10px] font-bold">
                    {regPassword === regConfirmPass ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-red-500">Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-submit-user-register"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 text-[#E0F2F1]" />
              <span>
                {isLoading
                  ? lang === 'hi'
                    ? 'खाता बन रहा है...'
                    : 'Creating Account...'
                  : lang === 'hi'
                  ? 'खाता बनाएं और लॉगिन करें'
                  : 'Create Account & Sign In'}
              </span>
            </button>

            {/* Switch to Login link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-[#004D40] hover:underline font-semibold"
              >
                {lang === 'hi'
                  ? 'पहले से खाता है? लॉगिन करें →'
                  : 'Already have an account? Sign in here →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
