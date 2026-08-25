import React, { useState, useEffect } from 'react';
import { PostType, Language, GrievancePriority, UserAccount } from '../types';
import { translations, categoriesMap } from '../i18n/translations';
import {
  X,
  Plus,
  Image as ImageIcon,
  MapPin,
  Upload,
  AlertTriangle,
  Flame,
  FileText,
  Building,
  User,
  ShieldCheck,
  Clock,
  Info,
} from 'lucide-react';

interface Props {
  lang: Language;
  initialType?: PostType;
  currentUser?: UserAccount | null;
  isAdmin?: boolean;
  onClose: () => void;
  onSubmit: (postData: any) => Promise<void>;
  onOpenLoginModal?: (mode?: 'login' | 'register') => void;
}

export const CreatePostModal: React.FC<Props> = ({
  lang,
  initialType = 'news',
  currentUser,
  isAdmin = false,
  onClose,
  onSubmit,
  onOpenLoginModal,
}) => {
  const t = translations[lang];

  const [type, setType] = useState<PostType>(initialType);
  const [title, setTitle] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [content, setContent] = useState('');
  const [contentHi, setContentHi] = useState('');
  const [category, setCategory] = useState(type === 'grievance' ? 'water_supply' : 'general');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [ward, setWard] = useState('');
  const [landmark, setLandmark] = useState('');
  const [authorName, setAuthorName] = useState(currentUser?.name || '');
  const [authorRole, setAuthorRole] = useState(
    currentUser?.role === 'reporter'
      ? 'Staff Reporter'
      : currentUser?.role === 'admin'
      ? 'Chief Editor'
      : type === 'grievance'
      ? 'Local Citizen'
      : 'Community Reporter'
  );
  const [priority, setPriority] = useState<GrievancePriority>('medium');
  const [isBreaking, setIsBreaking] = useState(false);
  const [autoApproveDirect, setAutoApproveDirect] = useState(isAdmin);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHindiFields, setShowHindiFields] = useState(lang === 'hi');

  useEffect(() => {
    if (currentUser) {
      setAuthorName(currentUser.name);
      if (currentUser.role === 'reporter') {
        setAuthorRole('Staff Reporter');
      } else if (currentUser.role === 'admin') {
        setAuthorRole('Chief Editor');
      } else if (currentUser.role === 'citizen') {
        setAuthorRole('Citizen');
      }
    }
  }, [currentUser]);

  const handleTypeChange = (newType: PostType) => {
    setType(newType);
    setCategory(newType === 'grievance' ? 'water_supply' : 'general');
    if (!currentUser) {
      setAuthorRole(newType === 'grievance' ? 'Local Citizen' : 'Reporter');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !city.trim()) {
      alert('Please fill in the Title, Content, and City location.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        titleHi: titleHi.trim() || undefined,
        content: content.trim(),
        contentHi: contentHi.trim() || undefined,
        category,
        location: {
          city: city.trim(),
          area: area.trim() || undefined,
          ward: ward.trim() || undefined,
          landmark: landmark.trim() || undefined,
        },
        authorName: authorName.trim() || (type === 'grievance' ? 'Concerned Citizen' : 'Staff Reporter'),
        authorRole: authorRole.trim() || undefined,
        authorId: currentUser?.id,
        priority: type === 'grievance' ? priority : undefined,
        isBreaking: type === 'news' ? isBreaking : false,
        imageUrl: imageUrl.trim() || undefined,
        autoApprove: isAdmin && autoApproveDirect,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const relevantCategories = Object.entries(categoriesMap).filter(([key]) => {
    if (type === 'grievance') {
      return [
        'water_supply',
        'roads_traffic',
        'electricity',
        'sanitation_waste',
        'drainage_sewage',
        'street_lights',
        'public_safety',
        'health_hospital',
        'corruption',
        'other',
      ].includes(key);
    } else {
      return [
        'general',
        'politics',
        'civic',
        'development',
        'education',
        'environment',
        'sports',
        'business',
        'other',
      ].includes(key);
    }
  });

  return (
    <div
      id="create-post-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="create-post-modal-content"
        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-[#E0E0E0] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0] bg-[#FAFAFA] shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#1A1A1A]">
              {type === 'grievance' ? t.postGrievance : t.postNews}
            </h2>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">
              {type === 'grievance'
                ? lang === 'hi'
                  ? 'नागरिक जन शिकायत दर्ज करें • समीक्षा के बाद लाइव होगी'
                  : 'Report community grievance • Sent to Admin for review'
                : lang === 'hi'
                ? 'स्वतंत्र समाचार व स्थानीय खबर प्रकाशित करें'
                : 'Publish news story • Editorial verification queue'}
            </p>
          </div>
          <button
            id="btn-close-create-modal"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice for content review */}
        <div className="bg-amber-50/80 px-5 py-2.5 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              {lang === 'hi'
                ? 'नोट: सबमिशन के बाद यह पोस्ट "समीक्षाधीन (Pending Approval)" रहेगी और एडमिन द्वारा स्वीकृत होने पर लाइव होगी।'
                : 'Editorial Policy: Submitted posts enter "Pending Approval" and become live once verified by Admin.'}
            </span>
          </div>
          {currentUser ? (
            <span className="text-[11px] font-bold text-[#004D40] bg-[#E0F2F1] px-2 py-0.5 rounded-md flex items-center gap-1">
              <User className="w-3 h-3" />
              {currentUser.name} ({currentUser.role})
            </span>
          ) : onOpenLoginModal ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLoginModal('login');
              }}
              className="text-[11px] text-[#004D40] hover:underline font-bold"
            >
              {lang === 'hi' ? 'खाते में लॉगिन करें →' : 'Login / Register →'}
            </button>
          ) : null}
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Post Type Selector Tabs */}
          <div>
            <label className="block text-[10px] font-bold text-[#004D40] uppercase tracking-wider mb-1.5">
              Select Post Type / प्रकार चुनें
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAFAFA] rounded-lg border border-[#E0E0E0]">
              <button
                type="button"
                id="btn-select-type-news"
                onClick={() => handleTypeChange('news')}
                className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-2 ${
                  type === 'news'
                    ? 'bg-[#004D40] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4 text-[#E0F2F1]" />
                <span>📰 {t.news} (News)</span>
              </button>

              <button
                type="button"
                id="btn-select-type-grievance"
                onClick={() => handleTypeChange('grievance')}
                className={`py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-2 ${
                  type === 'grievance'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>📢 {t.grievances} (Grievance)</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#1A1A1A]">
                {t.formTitle} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowHindiFields(!showHindiFields)}
                className="text-[11px] font-bold text-[#004D40] hover:underline"
              >
                {showHindiFields ? 'Hide Hindi Box' : '+ Add Hindi Title'}
              </button>
            </div>
            <input
              id="input-post-title"
              type="text"
              required
              placeholder={t.formTitlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-md border border-[#E0E0E0] focus:border-[#004D40] focus:outline-hidden font-medium bg-white"
            />
          </div>

          {/* Hindi Title (Optional / Bilingual) */}
          {showHindiFields && (
            <div className="bg-[#E0F2F1]/50 p-3 rounded-lg border border-[#B2DFDB]">
              <label className="block text-xs font-bold text-[#004D40] mb-1">
                शीर्षक (हिन्दी में) / Hindi Headline
              </label>
              <input
                id="input-post-title-hi"
                type="text"
                placeholder="उदा. वार्ड 12 में पेयजल समस्या..."
                value={titleHi}
                onChange={(e) => setTitleHi(e.target.value)}
                className="w-full text-xs sm:text-sm p-2 rounded-md border border-[#B2DFDB] bg-white focus:border-[#004D40] focus:outline-hidden"
              />
            </div>
          )}

          {/* Category & Priority / Breaking row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                {t.formCategory}
              </label>
              <select
                id="select-post-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-md border border-[#E0E0E0] bg-white font-medium focus:border-[#004D40] focus:outline-hidden"
              >
                {relevantCategories.map(([key, val]) => (
                  <option key={key} value={key}>
                    {lang === 'hi' ? val.hi : val.en} ({val.en})
                  </option>
                ))}
              </select>
            </div>

            {type === 'grievance' ? (
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  {t.priority} / Urgency
                </label>
                <select
                  id="select-post-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as GrievancePriority)}
                  className="w-full text-xs p-2.5 rounded-md border border-[#E0E0E0] bg-white font-medium focus:border-[#004D40] focus:outline-hidden"
                >
                  <option value="low">{t.priorityLow} (Low)</option>
                  <option value="medium">{t.priorityMedium} (Medium)</option>
                  <option value="high">{t.priorityHigh} (High)</option>
                  <option value="urgent">{t.priorityUrgent} (Urgent Action Required)</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1A1A1A]">
                  <input
                    id="checkbox-breaking-news"
                    type="checkbox"
                    checked={isBreaking}
                    onChange={(e) => setIsBreaking(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-[#E0E0E0] focus:ring-[#004D40]"
                  />
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-red-600" />
                    Mark as Breaking News (ब्रेकिंग न्यूज़)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Location Fields */}
          <div className="bg-[#FAFAFA] p-3.5 rounded-lg border border-[#E0E0E0] space-y-2.5">
            <span className="block text-xs font-bold text-[#004D40] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#004D40]" />
              {t.location} <span className="text-red-500">*</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <input
                  id="input-location-city"
                  type="text"
                  required
                  placeholder={t.formCity + ' *'}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-gray-300 bg-white font-medium focus:border-[#004D40] focus:outline-hidden"
                />
              </div>
              <div>
                <input
                  id="input-location-area"
                  type="text"
                  placeholder={t.formArea}
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-gray-300 bg-white focus:border-[#004D40] focus:outline-hidden"
                />
              </div>
              <div>
                <input
                  id="input-location-ward"
                  type="text"
                  placeholder={t.formWard}
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-gray-300 bg-white focus:border-[#004D40] focus:outline-hidden"
                />
              </div>
              <div>
                <input
                  id="input-location-landmark"
                  type="text"
                  placeholder={t.formLandmark}
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-gray-300 bg-white focus:border-[#004D40] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Content / Description */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
              {t.formContent} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="textarea-post-content"
              required
              rows={4}
              placeholder={t.formContentPlaceholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-md border border-[#E0E0E0] focus:border-[#004D40] focus:outline-hidden leading-relaxed bg-white"
            />
          </div>

          {/* Author Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                {t.formAuthorName}
              </label>
              <input
                id="input-author-name"
                type="text"
                placeholder={type === 'grievance' ? 'e.g. Ramesh Kumar' : 'e.g. Staff Reporter'}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-[#E0E0E0] bg-white font-medium focus:border-[#004D40] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                {t.formAuthorRole}
              </label>
              <input
                id="input-author-role"
                type="text"
                placeholder={type === 'grievance' ? 'Resident / Citizen' : 'Staff Reporter'}
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-[#E0E0E0] bg-white focus:border-[#004D40] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Admin Direct Approval Option */}
          {isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900">
                <input
                  type="checkbox"
                  checked={autoApproveDirect}
                  onChange={(e) => setAutoApproveDirect(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Admin Privilege: Publish Live Immediately (Bypass Review Queue)
                </span>
              </label>
            </div>
          )}

          {/* Photo / Image Attachment */}
          <div className="bg-[#FAFAFA] p-3.5 rounded-lg border border-[#E0E0E0] space-y-2">
            <span className="block text-xs font-bold text-[#004D40] uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#004D40]" />
              {t.formImageUrl}
            </span>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                id="input-image-url"
                type="url"
                placeholder="Paste Image URL (https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full sm:flex-1 text-xs p-2 rounded-md border border-gray-300 bg-white focus:border-[#004D40] focus:outline-hidden"
              />
              <label className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-[#E0E0E0] rounded-md text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5 text-[#004D40]" />
                <span>{t.formUploadPhoto}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {imageUrl && (
              <div className="relative mt-2 rounded-lg overflow-hidden border border-[#E0E0E0] max-h-32 bg-gray-100">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1.5 right-1.5 bg-black/80 text-white p-1 rounded-full text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Footer Submit Row */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E0E0E0]">
            <button
              type="button"
              id="btn-cancel-create"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              id="btn-submit-create"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-wider text-white rounded-md shadow-xs transition-colors flex items-center gap-1.5 ${
                type === 'grievance'
                  ? 'bg-red-700 hover:bg-red-800'
                  : 'bg-[#004D40] hover:bg-[#00382E]'
              }`}
            >
              <Plus className="w-4 h-4 text-[#E0F2F1]" />
              <span>
                {isSubmitting
                  ? 'Submitting...'
                  : type === 'grievance'
                  ? t.formSubmitGrievance
                  : t.formSubmitNews}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
