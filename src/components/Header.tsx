import React, { useState, useRef, useEffect } from 'react';
import { Language, UserAccount } from '../types';
import { translations } from '../i18n/translations';
import { StoryTodayLogo } from './StoryTodayLogo';
import {
  Newspaper,
  Languages,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  Flame,
  CheckCircle2,
  X,
  Smartphone,
  Monitor,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Bell,
  ChevronDown,
  Mail,
  Shield,
  Sparkles,
  Award,
} from 'lucide-react';

interface Props {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  isAdmin: boolean;
  onAdminToggle: () => void;
  currentUser: UserAccount | null;
  onOpenLoginModal: (mode?: 'login' | 'register') => void;
  onUserLogout: () => void;
  pendingApprovalsCount?: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenCreateModal: (type?: 'news' | 'grievance') => void;
  isMobileView: boolean;
  onToggleMobileView: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<Props> = ({
  lang,
  onLanguageChange,
  isAdmin,
  onAdminToggle,
  currentUser,
  onOpenLoginModal,
  onUserLogout,
  pendingApprovalsCount = 0,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onOpenCreateModal,
  isMobileView,
  onToggleMobileView,
  onLogoClick,
}) => {
  const t = translations[lang];
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: lang === 'hi' ? 'व्यवस्थापक' : 'Admin',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
        };
      case 'reporter':
        return {
          label: lang === 'hi' ? 'रिपोर्टर' : 'Reporter',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dot: 'bg-emerald-500',
        };
      default:
        return {
          label: lang === 'hi' ? 'नागरिक' : 'Citizen',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          dot: 'bg-blue-500',
        };
    }
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-[#E0E0E0] shadow-xs">
      {/* Top Bar with Prominent Branding & Tools */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Prominent Brand / Logo (Strictly Logo only, no text/domain) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="cursor-pointer group flex items-center bg-transparent border-0 p-0 focus:outline-none"
            onClick={() => {
              if (onLogoClick) {
                onLogoClick();
              } else {
                onTabChange('all');
              }
            }}
            title="Story Today Home"
            aria-label="Story Today Home"
          >
            <StoryTodayLogo
              variant="icon-only"
              size="header"
              showDomain={false}
              lang={lang}
              theme="emerald"
            />
          </button>
        </div>

        {/* Right Tools: Language + User Auth + Admin + Create */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile frame toggle */}
          <button
            id="btn-toggle-viewport"
            onClick={onToggleMobileView}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-[#F5F5F5] rounded-lg transition-colors border border-[#E0E0E0]"
            title={isMobileView ? 'Switch to Desktop View' : 'Switch to Mobile Frame'}
          >
            {isMobileView ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-[#004D40]" />
                <span className="hidden lg:inline">Desktop View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-[#004D40]" />
                <span className="hidden lg:inline">Mobile Frame</span>
              </>
            )}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-[#E0F2F1]/70 p-0.5 rounded-lg border border-[#B2DFDB]">
            <button
              id="btn-lang-en"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 text-[11px] sm:text-xs font-bold rounded-md uppercase tracking-wider transition-all ${
                lang === 'en'
                  ? 'bg-[#004D40] text-white shadow-xs'
                  : 'text-[#004D40] hover:bg-[#E0F2F1]'
              }`}
            >
              ENG
            </button>
            <button
              id="btn-lang-hi"
              onClick={() => onLanguageChange('hi')}
              className={`px-2 py-1 text-[11px] sm:text-xs font-bold rounded-md uppercase tracking-wider transition-all ${
                lang === 'hi'
                  ? 'bg-[#004D40] text-white shadow-xs'
                  : 'text-[#004D40] hover:bg-[#E0F2F1]'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* User Account State: Login / Create Account OR Profile Pill with Dropdown */}
          {currentUser ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                id="btn-user-profile-menu"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200/80 px-2 py-1 sm:py-1.5 rounded-lg border border-[#E0E0E0] text-xs transition-colors cursor-pointer"
                title="View User Profile"
              >
                <div className="w-5 h-5 rounded-full bg-[#004D40] text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-gray-800 hidden sm:inline max-w-[110px] truncate">
                  {currentUser.name}
                </span>
                <span
                  className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border font-bold ${
                    getRoleBadge(currentUser.role).bg
                  }`}
                >
                  {getRoleBadge(currentUser.role).label}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {/* Profile Dropdown Card */}
              {showProfileMenu && (
                <div
                  id="profile-dropdown-card"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-3 px-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
                >
                  <div className="flex items-start gap-2.5 pb-3 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-[#004D40] text-[#E0F2F1] flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {currentUser.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-mono">
                        @{currentUser.username}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            getRoleBadge(currentUser.role).bg
                          }`}
                        >
                          {getRoleBadge(currentUser.role).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Capabilities Info */}
                  <div className="py-2.5 text-[11px] text-gray-600 space-y-1">
                    {currentUser.role === 'reporter' ? (
                      <p className="flex items-center gap-1.5 text-emerald-800">
                        <Newspaper className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{lang === 'hi' ? 'सत्यापित समाचार रिपोर्टर' : 'Verified Journalist / Reporter'}</span>
                      </p>
                    ) : currentUser.role === 'admin' ? (
                      <p className="flex items-center gap-1.5 text-amber-800">
                        <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{lang === 'hi' ? 'मुख्य संपादक व व्यवस्थापक' : 'Chief Editor & Admin'}</span>
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-blue-800">
                        <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{lang === 'hi' ? 'सत्यापित नागरिक खाता' : 'Verified Citizen Account'}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions & Logout */}
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onAdminToggle();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber-900 hover:bg-amber-50 rounded-lg font-medium transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-700" />
                        <span>{lang === 'hi' ? 'एडमिन डेस्क खोलें' : 'Open Admin Desk'}</span>
                      </button>
                    )}

                    <button
                      id="btn-profile-logout"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onUserLogout();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? 'लॉगआउट करें' : 'Sign Out / Logout'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Clear Login & Create Account Option Group */
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Login Button */}
              <button
                id="btn-header-login"
                onClick={() => onOpenLoginModal('login')}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-[#E0E0E0] transition-colors shadow-xs"
                title="Login to your account"
              >
                <LogIn className="w-3.5 h-3.5 text-[#004D40]" />
                <span>{lang === 'hi' ? 'लॉगिन' : 'Login'}</span>
              </button>

              {/* Create Account Button */}
              <button
                id="btn-header-register"
                onClick={() => onOpenLoginModal('register')}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#004D40] bg-[#E0F2F1] hover:bg-[#B2DFDB] border border-[#B2DFDB] transition-colors shadow-xs"
                title="Create Citizen or Reporter Account"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {lang === 'hi' ? 'खाता बनाएं' : 'Create Account'}
                </span>
                <span className="sm:hidden">
                  {lang === 'hi' ? 'साइनअप' : 'Sign Up'}
                </span>
              </button>
            </div>
          )}

          {/* Admin Switch & Pending Approvals Notification Badge */}
          <button
            id="btn-admin-toggle"
            onClick={onAdminToggle}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isAdmin
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-white hover:bg-gray-100 text-gray-700 border-[#E0E0E0]'
            }`}
            title="Admin Management Panel"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-700' : 'text-gray-400'}`} />
            <span className="hidden sm:inline">
              {isAdmin ? t.adminBadge : 'Admin'}
            </span>
            {isAdmin && pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-rose-600 text-white font-bold animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* Post Action Button */}
          <button
            id="btn-header-post"
            onClick={() => onOpenCreateModal()}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-[#E0F2F1]" />
            <span className="hidden sm:inline">{lang === 'hi' ? '+ नया पोस्ट' : '+ New Post'}</span>
            <span className="sm:hidden">{lang === 'hi' ? 'पोस्ट' : 'Post'}</span>
          </button>
        </div>
      </div>

      {/* Nav Tabs & Search Row */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 border-t border-[#E0E0E0] bg-[#FAFAFA]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            id="tab-all"
            onClick={() => onTabChange('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-[#004D40] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            {t.allPosts}
          </button>
          <button
            id="tab-news"
            onClick={() => onTabChange('news')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === 'news'
                ? 'bg-[#004D40] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            📰 {t.news}
          </button>
          <button
            id="tab-grievances"
            onClick={() => onTabChange('grievances')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === 'grievances'
                ? 'bg-[#004D40] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            📢 {t.grievances}
          </button>
          <button
            id="tab-resolved"
            onClick={() => onTabChange('resolved')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === 'resolved'
                ? 'bg-[#004D40] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            ✅ {t.resolved}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="header-search-input"
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-36 sm:w-60 text-xs pl-8 pr-7 py-1.5 bg-white hover:bg-gray-50 focus:bg-white rounded-md border border-[#E0E0E0] focus:border-[#004D40] focus:outline-hidden transition-all text-gray-800"
            />
            {searchQuery && (
              <button
                id="btn-clear-search"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

