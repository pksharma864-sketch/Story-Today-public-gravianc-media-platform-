import React, { useState, useRef } from 'react';
import { UserAccount, Language } from '../types';
import { updateUserAvatar, updateUserProfile } from '../lib/api';
import {
  X,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Shield,
  Newspaper,
  Calendar,
  Sparkles,
  Edit3,
  BadgeCheck,
  Download,
  Clock,
} from 'lucide-react';

interface Props {
  user: UserAccount;
  lang: Language;
  onClose: () => void;
  onProfileUpdated: (updatedUser: UserAccount) => void;
  onOpenIdCardModal?: () => void;
}

export const UserProfileModal: React.FC<Props> = ({
  user,
  lang,
  onClose,
  onProfileUpdated,
  onOpenIdCardModal,
}) => {
  const [avatar, setAvatar] = useState<string | null>(user.avatar || null);
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [bio, setBio] = useState(user.bio || '');

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: lang === 'hi' ? 'मुख्य व्यवस्थापक' : 'Chief Administrator',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Shield,
        };
      case 'reporter':
        return {
          label: lang === 'hi' ? 'सत्यापित रिपोर्टर' : 'Verified Reporter',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: Newspaper,
        };
      default:
        return {
          label: lang === 'hi' ? 'नागरिक खाता' : 'Citizen Member',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: User,
        };
    }
  };

  const badge = getRoleBadge(user.role);
  const BadgeIcon = badge.icon;

  // Handle Photo selection from gallery or camera
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (cap around 5MB before base64)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(
        lang === 'hi'
          ? 'फोटो का आकार 5MB से कम होना चाहिए।'
          : 'Photo size should be less than 5MB.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setAvatar(base64);
        setErrorMsg('');
        // Instant preview + auto save photo
        try {
          setIsLoading(true);
          const res = await updateUserAvatar(user.id, base64);
          if (res.success && res.user) {
            onProfileUpdated(res.user);
            setSuccessMsg(
              lang === 'hi'
                ? 'प्रोफ़ाइल फ़ोटो सफलतापूर्वक अपडेट हो गई!'
                : 'Profile photo updated successfully!'
            );
            setTimeout(() => setSuccessMsg(''), 3500);
          } else {
            setErrorMsg(res.error || 'Failed to save profile photo');
          }
        } catch {
          setErrorMsg('Failed to upload photo');
        } finally {
          setIsLoading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await updateUserAvatar(user.id, null);
      if (res.success && res.user) {
        setAvatar(null);
        onProfileUpdated(res.user);
        setSuccessMsg(
          lang === 'hi'
            ? 'प्रोफ़ाइल फ़ोटो हटा दी गई।'
            : 'Profile photo removed.'
        );
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        setErrorMsg(res.error || 'Failed to remove photo');
      }
    } catch {
      setErrorMsg('Failed to remove photo');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Save Full Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(lang === 'hi' ? 'कृपया अपना नाम दर्ज करें।' : 'Please enter your name.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await updateUserProfile(user.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatar || undefined,
      });

      if (res.success && res.user) {
        onProfileUpdated(res.user);
        setSuccessMsg(
          lang === 'hi'
            ? 'प्रोफ़ाइल विवरण सहेज लिए गए!'
            : 'Profile details saved successfully!'
        );
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Failed to save profile changes');
      }
    } catch {
      setErrorMsg('Network error while saving profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="modal-user-profile"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E0E0E0] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#004D40] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E0F2F1]/20 flex items-center justify-center text-[#E0F2F1]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {lang === 'hi' ? 'उपयोगकर्ता प्रोफ़ाइल और पहचान' : 'User Profile & Identity'}
              </h3>
              <p className="text-[11px] text-[#B2DFDB]">
                {lang === 'hi' ? 'फ़ोटो और व्यक्तिगत जानकारी प्रबंधित करें' : 'Manage your photo and public identity'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-profile-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#E0F2F1] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Profile Photo Section (Large & Prominent) */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-[#FAFAFA] rounded-2xl border border-[#E0E0E0]">
            {/* Avatar Circle with Camera Trigger */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-3 border-[#004D40]/30 shadow-md bg-white flex items-center justify-center">
                {avatar ? (
                  <img
                    id="profile-modal-avatar-img"
                    src={avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-[#004D40] text-white flex items-center justify-center text-3xl font-serif font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Hover / Overlay Camera Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-[#004D40] hover:bg-[#00382E] text-white rounded-full shadow-lg border-2 border-white transition-all transform hover:scale-105 cursor-pointer"
                title={lang === 'hi' ? 'फ़ोटो अपलोड या बदलें' : 'Upload or change photo'}
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Hidden file input supporting gallery and camera */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {/* Photo Action Controls & Guidance */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}
                >
                  <BadgeIcon className="w-3 h-3" />
                  <span>{badge.label}</span>
                </span>
                <span className="text-[11px] text-gray-500 font-mono">@{user.username}</span>
              </div>

              <h4 className="text-sm font-bold text-gray-900">
                {lang === 'hi' ? 'आपकी प्रोफ़ाइल फ़ोटो' : 'Profile Photo'}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {lang === 'hi'
                  ? 'यह फ़ोटो आपके पोस्ट किए गए समाचार, जन शिकायतों और टिप्पणियों के साथ दिखाई देगी।'
                  : 'This photo appears next to your published articles, citizen reports, and comments.'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  id="btn-upload-profile-photo"
                  type="button"
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{avatar ? (lang === 'hi' ? 'फ़ोटो बदलें' : 'Change Photo') : (lang === 'hi' ? 'फ़ोटो जोड़ें' : 'Upload Photo')}</span>
                </button>

                {avatar && (
                  <button
                    id="btn-remove-profile-photo"
                    type="button"
                    disabled={isLoading}
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'फ़ोटो हटाएं' : 'Remove Photo'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reporter Press Identity Card Banner (For Reporters & Admins) */}
          {(user.role === 'reporter' || user.role === 'admin') && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#004D40] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <BadgeCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                      {lang === 'hi' ? 'पत्रकार पहचान पत्र (Press ID Card)' : 'Reporter Press Identity Card'}
                    </h4>
                    {user.idCard?.status === 'approved' ? (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {lang === 'hi' ? 'स्वीकृत व सक्रिय' : 'Approved & Active'}
                      </span>
                    ) : user.idCard?.status === 'pending' ? (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        {lang === 'hi' ? 'समीक्षाधीन' : 'Pending Approval'}
                      </span>
                    ) : user.idCard?.status === 'rejected' ? (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-red-100 text-red-800 border border-red-300">
                        {lang === 'hi' ? 'अस्वीकृत' : 'Rejected'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-gray-100 text-gray-700 border border-gray-300">
                        {lang === 'hi' ? 'आवेदन उपलब्ध' : 'Available'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {user.idCard?.status === 'approved'
                      ? lang === 'hi'
                        ? 'आपका पहचान पत्र अनुमोदित है। आप इसे सीधे डाउनलोड या प्रिंट कर सकते हैं।'
                        : 'Your ID card is approved and active. Ready for download & print.'
                      : user.idCard?.status === 'pending'
                      ? lang === 'hi'
                        ? 'पहचान पत्र का आवेदन संपादक की समीक्षा में है।'
                        : 'Application is awaiting Admin verification & approval.'
                      : lang === 'hi'
                      ? 'स्टोरी टुडे का आधिकारिक पत्रकार परिचय पत्र प्राप्त करने हेतु आवेदन करें।'
                      : 'Apply for your official Story Today Press Identity Card.'}
                  </p>
                </div>
              </div>

              <button
                id="btn-profile-open-id-card"
                type="button"
                onClick={() => {
                  if (onOpenIdCardModal) onOpenIdCardModal();
                }}
                className="px-3.5 py-2 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
              >
                {user.idCard?.status === 'approved' ? (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'कार्ड देखें व डाउनलोड करें' : 'View & Download ID Card'}</span>
                  </>
                ) : user.idCard?.status === 'pending' ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'स्थिति देखें' : 'View Application Status'}</span>
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'पहचान पत्र हेतु आवेदन करें' : 'Apply for Press ID'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Form Fields for Profile Info */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {lang === 'hi' ? 'पूरा नाम' : 'Full Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-profile-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-gray-300 focus:border-[#004D40] focus:ring-1 focus:ring-[#004D40] bg-white outline-hidden font-medium text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {lang === 'hi' ? 'यूज़रनेम' : 'Username (Login ID)'}
                </label>
                <input
                  type="text"
                  disabled
                  value={user.username}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {lang === 'hi' ? 'ईमेल पता' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rajesh@example.com"
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-gray-300 focus:border-[#004D40] focus:ring-1 focus:ring-[#004D40] bg-white outline-hidden text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {lang === 'hi' ? 'फ़ोन नंबर' : 'Phone / Contact'}
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-gray-300 focus:border-[#004D40] focus:ring-1 focus:ring-[#004D40] bg-white outline-hidden text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {lang === 'hi' ? 'संक्षिप्त विवरण / बायो' : 'Bio / Tagline'}
              </label>
              <textarea
                id="input-profile-bio"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={
                  lang === 'hi'
                    ? 'जैसे: वार्ड 14 के निवासी व नागरिक रिपोर्टर...'
                    : 'e.g. Civic activist & community reporter from Central District...'
                }
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:border-[#004D40] focus:ring-1 focus:ring-[#004D40] bg-white outline-hidden text-gray-900 leading-relaxed"
              />
            </div>

            {/* Member Since info */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {lang === 'hi' ? 'सदस्यता तिथि:' : 'Account Created:'}{' '}
                  {new Date(user.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </span>
              <span className="font-mono text-gray-400 text-[10px]">ID: {user.id}</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                {lang === 'hi' ? 'बंद करें' : 'Cancel'}
              </button>
              <button
                id="btn-save-profile"
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E0F2F1]" />
                <span>{isLoading ? (lang === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...') : (lang === 'hi' ? 'प्रोफ़ाइल सहेजें' : 'Save Changes')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
