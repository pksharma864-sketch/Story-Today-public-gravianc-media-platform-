import React, { useState, useEffect } from 'react';
import { PostItem, Language, GrievanceStatus, ApprovalStatus, UserAccount } from '../types';
import { translations, categoriesMap, legacyCategoriesMap, getStatusText } from '../i18n/translations';
import { GrievanceProgressBar } from './GrievanceProgressBar';
import { printStory } from '../lib/printStory';
import {
  ArrowLeft,
  Share2,
  ThumbsUp,
  MapPin,
  Clock,
  Eye,
  User,
  ShieldCheck,
  Building2,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Trash2,
  Pin,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  Flame,
  AlertCircle,
  Edit3,
  XCircle,
  FileCheck,
  Globe,
  ExternalLink,
} from 'lucide-react';

interface Props {
  post: PostItem;
  lang: Language;
  isAdmin: boolean;
  currentUser?: UserAccount | null;
  onBack: () => void;
  onShare: (post: PostItem) => void;
  onUpvote: (id: string) => void;
  onAddComment: (id: string, author: string, text: string, authorAvatar?: string) => void;
  onUpdateStatus: (id: string, status: GrievanceStatus, note: string, officerName?: string, department?: string) => void;
  onDeletePost: (id: string) => void;
  onTogglePin: (id: string, currentPin: boolean) => void;
  onPostApprovalChange?: (id: string, status: ApprovalStatus, reason?: string) => Promise<void>;
  isUpvoted?: boolean;
}

export const PostDetailView: React.FC<Props> = ({
  post,
  lang,
  isAdmin,
  currentUser,
  onBack,
  onShare,
  onUpvote,
  onAddComment,
  onUpdateStatus,
  onDeletePost,
  onTogglePin,
  onPostApprovalChange,
  isUpvoted,
}) => {
  const t = translations[lang];

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [commentName, setCommentName] = useState(currentUser?.name || '');
  const [commentText, setCommentText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  useEffect(() => {
    if (currentUser?.name && !commentName) {
      setCommentName(currentUser.name);
    }
  }, [currentUser]);

  // Synchronize Open Graph, Twitter, and document title for active article in DOM
  useEffect(() => {
    const titleText = (lang === 'hi' && post.titleHi) ? post.titleHi : post.title;
    const prevTitle = document.title;
    document.title = `${titleText} | Story Today`;

    const origin = window.location.origin;
    const isGrievance = post.type === 'grievance';
    const pathPrefix = isGrievance ? 'grievance' : 'article';
    const articleUrl = `${origin}/${pathPrefix}/${post.id}`;

    let imageUrl = (post.imageUrl || '').trim();
    if (!imageUrl) {
      imageUrl = `${origin}/logo.svg`;
    } else if (imageUrl.startsWith('data:image/')) {
      imageUrl = `${origin}/api/posts/${post.id}/image.jpg`;
    } else if (imageUrl.startsWith('//')) {
      imageUrl = `https:${imageUrl}`;
    } else if (imageUrl.startsWith('/')) {
      imageUrl = `${origin}${imageUrl}`;
    } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      imageUrl = `${origin}/${imageUrl}`;
    }

    const description = (post.summary || post.content || '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 250);

    const updateMetaTag = (property: string, content: string, isName = false) => {
      const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        if (isName) {
          element.name = property;
        } else {
          element.setAttribute('property', property);
        }
        document.head.appendChild(element);
      }
      element.content = content;
    };

    updateMetaTag('og:title', titleText);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', imageUrl);
    updateMetaTag('og:image:secure_url', imageUrl);
    updateMetaTag('og:url', articleUrl);
    updateMetaTag('og:type', 'article');
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', titleText, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', imageUrl, true);

    return () => {
      document.title = prevTitle;
    };
  }, [post, lang]);

  // Admin status update state
  const [selectedStatus, setSelectedStatus] = useState<GrievanceStatus>(
    post.status || 'submitted'
  );
  const [statusNote, setStatusNote] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const title = lang === 'hi' && post.titleHi ? post.titleHi : post.title;
  const content = lang === 'hi' && post.contentHi ? post.contentHi : post.content;
  const isGrievance = post.type === 'grievance';

  const categoryInfo = categoriesMap[post.category] || legacyCategoriesMap[post.category] || {
    en: post.category,
    hi: post.category,
  };
  const categoryLabel = lang === 'hi' ? categoryInfo.hi : categoryInfo.en;

  const formattedDate = new Date(post.createdAt).toLocaleDateString(
    lang === 'hi' ? 'hi-IN' : 'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const shareUrl = `${window.location.origin}/${isGrievance ? 'grievance' : 'article'}/${post.id}`;

  // Web Speech synthesis for audio reader
  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech audio is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${title}. ${content}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.95;

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      // Fallback
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(
      post.id,
      commentName.trim() || 'Citizen',
      commentText.trim(),
      currentUser?.avatar || undefined
    );
    setCommentText('');
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(
      post.id,
      selectedStatus,
      statusNote.trim() || `Status updated to ${selectedStatus}`,
      officerName.trim() || 'Admin / Authority',
      departmentName.trim() || 'Civic Authority'
    );
    setIsUpdatingStatus(false);
    setStatusNote('');
  };

  const handleApproveAction = async () => {
    if (!onPostApprovalChange) return;
    setIsApproving(true);
    try {
      await onPostApprovalChange(post.id, 'approved');
    } catch (err) {
      alert('Failed to approve post.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectAction = async () => {
    if (!onPostApprovalChange) return;
    setIsApproving(true);
    try {
      await onPostApprovalChange(post.id, 'rejected', rejectionNote || 'Content does not meet publication standards.');
      setShowRejectBox(false);
    } catch (err) {
      alert('Failed to reject post.');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div id="post-detail-view" className="max-w-3xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-200">
      {/* Top Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E0E0E0]">
        <button
          id="btn-back-to-feed"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 bg-white hover:bg-gray-100 rounded-md border border-[#E0E0E0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#004D40]" />
          <span>{t.backToFeed}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Audio TTS button */}
          <button
            id="btn-listen-audio"
            onClick={toggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all border ${
              isPlayingAudio
                ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                : 'bg-white hover:bg-gray-100 text-gray-700 border-[#E0E0E0]'
            }`}
            title="Listen to Story / आवाज़ में सुनें"
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                <span>{lang === 'hi' ? 'रोकें' : 'Stop Audio'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#004D40]" />
                <span>{lang === 'hi' ? 'आवाज़ में सुनें' : 'Listen Story'}</span>
              </>
            )}
          </button>

          {/* Share Button (Primary) */}
          <button
            id="btn-detail-share"
            onClick={() => onShare(post)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-[#E0F2F1]" />
            <span>{lang === 'hi' ? 'साझा करें' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Editorial Approval Status Banner */}
      {post.approvalStatus === 'pending' && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Pending Editorial Approval
                </h4>
                <p className="text-xs text-amber-800">
                  This post is currently in the review queue. It will not be visible on the public feed until approved by the Admin.
                </p>
              </div>
            </div>

            {isAdmin && onPostApprovalChange && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isApproving}
                  onClick={handleApproveAction}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isApproving ? 'Approving...' : 'Approve & Publish'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectBox(!showRejectBox)}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            )}
          </div>

          {showRejectBox && (
            <div className="p-3 bg-white rounded-lg border border-amber-300 space-y-2">
              <label className="block text-xs font-bold text-gray-700">Reason for rejection:</label>
              <input
                type="text"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="e.g. Unverified claims, duplicate issue..."
                className="w-full text-xs p-2 rounded border border-gray-300"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectAction}
                  className="px-3 py-1 bg-red-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {post.approvalStatus === 'rejected' && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
            <XCircle className="w-4 h-4 text-red-700" />
            <span>Post Rejected by Editorial Admin</span>
          </div>
          {post.rejectionReason && (
            <p className="text-red-800">
              <strong>Reason:</strong> {post.rejectionReason}
            </p>
          )}
        </div>
      )}

      {/* Article Article Container */}
      <article className="bg-white rounded-xl border border-[#E0E0E0] shadow-xs p-6 sm:p-10">
        {/* Breaking / Urgency Alert */}
        {post.isBreaking && (
          <div className="mb-4 bg-red-700 text-white px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Flame className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>{t.breakingNews}</span>
          </div>
        )}

        {/* Editorial Eyebrow */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <p className="text-[#004D40] font-bold text-xs uppercase tracking-[0.2em]">
            {isGrievance
              ? lang === 'hi'
                ? 'नागरिक शिकायत / Citizen Grievance'
                : 'Citizen Grievance / नागरिक शिकायत'
              : 'News/Article/समाचार/लेख'}
          </p>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
              {categoryLabel}
            </span>

            {post.referenceNumber && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                Ref: {post.referenceNumber}
              </span>
            )}
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#1A1A1A] leading-[1.15] mb-6">
          {title}
        </h1>

        {/* Author, Location, Date Meta Row */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#004D40] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-gray-300 shrink-0">
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{post.authorName.slice(0, 2).toUpperCase() || 'CT'}</span>
              )}
            </div>
            <div className="text-xs">
              <p className="font-bold uppercase tracking-wider text-[#1A1A1A]">{post.authorName}</p>
              <p className="text-gray-400 text-[11px]">{post.authorRole || (isGrievance ? 'Citizen' : 'Reporter')} • {formattedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-[#FAFAFA] px-3 py-1.5 rounded-md border border-[#E0E0E0]">
            <MapPin className="w-3.5 h-3.5 text-[#004D40]" />
            <span>
              {post.location.city}
              {post.location.country ? `, ${post.location.country}` : ''}
              {post.location.area ? `, ${post.location.area}` : ''}
              {post.location.ward ? ` (Ward ${post.location.ward})` : ''}
            </span>
          </div>
        </div>

        {/* Image Display */}
        {post.imageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden bg-gray-100 border border-[#E0E0E0]">
            <img
              src={post.imageUrl}
              alt={title}
              className="w-full max-h-[440px] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Grievance Progress Stepper if grievance */}
        {isGrievance && (
          <GrievanceProgressBar
            status={post.status || 'submitted'}
            lang={lang}
            history={post.statusHistory}
          />
        )}

        {/* Article Body Content with Editorial Lead */}
        {post.summary && (
          <p className="text-lg italic font-serif text-gray-600 mb-6 leading-relaxed border-l-2 border-[#004D40] pl-4">
            {post.summary}
          </p>
        )}

        <div className="prose prose-slate max-w-none text-[#1A1A1A] text-sm sm:text-base leading-relaxed whitespace-pre-line my-6">
          {content}
        </div>

        {/* Source Citation for Imported Articles */}
        {post.sourceUrl && (
          <div className="my-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#004D40]" />
              <span>
                {lang === 'hi' ? 'मूल स्रोत: ' : 'Original Source: '}
                <strong className="text-gray-800">story-today.in</strong>
              </span>
            </div>
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#004D40] hover:underline font-bold flex items-center gap-1"
            >
              <span>{lang === 'hi' ? 'मूल लेख देखें' : 'View on story-today.in'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Official Response Box if available */}
        {post.officialResponse && (
          <div className="my-6 bg-[#E0F2F1]/40 border border-[#B2DFDB] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-[#004D40]" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#004D40]">
                {lang === 'hi' ? 'प्रशासनिक जवाब व आधिकारिक अपडेट' : 'Official Administration Response'}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-[#004D40] leading-relaxed font-medium">
              "{post.officialResponse.message}"
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#00796B] mt-3 pt-2 border-t border-[#B2DFDB]">
              <span>{post.officialResponse.department} {post.officialResponse.officerName ? `• ${post.officialResponse.officerName}` : ''}</span>
              <span>{new Date(post.officialResponse.timestamp).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US')}</span>
            </div>
          </div>
        )}

        {/* Editorial Shareable Browser Link Banner */}
        <div className="my-6 bg-[#FFF8E1] border border-[#FFD54F] p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#856404]">
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-[#856404] uppercase tracking-wider">
              {lang === 'hi' ? 'शेयर करने योग्य लिंक' : 'Shareable Browser Link'}
            </p>
            <p className="text-xs font-mono text-[#856404] truncate mt-0.5">
              {shareUrl}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-quick-copy-link"
              onClick={handleCopyLink}
              className="bg-[#FFC107] hover:bg-[#FFA000] text-slate-900 text-xs font-bold px-4 py-2 rounded-md transition-colors flex items-center gap-1.5"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.copyLink}</span>
                </>
              )}
            </button>
            <button
              id="btn-print-view"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                printStory(post, lang);
              }}
              className="p-2 bg-white/80 hover:bg-white text-[#856404] border border-[#FFD54F] rounded-md text-xs font-semibold cursor-pointer active:scale-95 transition-all"
              title={lang === 'hi' ? 'प्रिंट करें / Save as PDF' : 'Print Article / Save as PDF'}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Citizen Endorsement & Reactions */}
        <div className="my-6 p-4 rounded-lg bg-[#FAFAFA] border border-[#E0E0E0] flex flex-wrap items-center justify-between gap-3">
          <button
            id="btn-detail-upvote"
            onClick={() => onUpvote(post.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xs ${
              isUpvoted
                ? 'bg-[#004D40] text-white'
                : 'bg-white hover:bg-gray-100 text-[#004D40] border border-[#E0E0E0]'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${isUpvoted ? 'fill-white text-white' : ''}`} />
            <span>
              {isUpvoted ? 'Liked' : 'Like'}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs ${isUpvoted ? 'bg-white/20 text-white' : 'bg-[#E0F2F1] text-[#004D40]'}`}>
              {post.upvotes || 0}
            </span>
          </button>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {post.views || 1} Views
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {post.comments?.length || 0} Comments
            </span>
          </div>
        </div>

        {/* Admin Controls Panel if Admin */}
        {isAdmin && (
          <div className="my-6 p-4 sm:p-5 rounded-xl bg-amber-50/70 border border-amber-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  {t.adminPortal} - {lang === 'hi' ? 'प्रबंधन' : 'Controls'}
                </h4>
              </div>
              <button
                id="btn-admin-toggle-pin"
                onClick={() => onTogglePin(post.id, Boolean(post.isPinned))}
                className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 bg-amber-200/60 px-2.5 py-1 rounded-md"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>{post.isPinned ? t.unpinPost : t.pinPost}</span>
              </button>
            </div>

            {/* If grievance, status update form */}
            {isGrievance && (
              <form onSubmit={handleStatusSubmit} className="space-y-3 mt-3 bg-white p-3.5 rounded-lg border border-amber-200">
                <p className="text-xs font-bold text-gray-800">{t.updateStatus}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">New Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as GrievanceStatus)}
                      className="w-full text-xs p-2 rounded-md border border-gray-300 bg-white font-medium"
                    >
                      <option value="submitted">{t.statusSubmitted}</option>
                      <option value="under_review">{t.statusUnderReview}</option>
                      <option value="in_progress">{t.statusInProgress}</option>
                      <option value="resolved">{t.statusResolved}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Designated Officer / Authority</label>
                    <input
                      type="text"
                      placeholder="e.g. Municipal Commissioner / Ward Inspector"
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      className="w-full text-xs p-2 rounded-md border border-gray-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Official Action Remark / Resolution Note</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Repair crew dispatched, pipeline repaired on site."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-gray-300 bg-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-xs"
                  >
                    {lang === 'hi' ? 'स्थिति अपडेट करें' : 'Save Status Update'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this post?')) {
                        onDeletePost(post.id);
                      }
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.deletePost}</span>
                  </button>
                </div>
              </form>
            )}

            {!isGrievance && (
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this news article?')) {
                      onDeletePost(post.id);
                    }
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-white px-3 py-1.5 rounded-md border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.deletePost}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Public Comments / Citizen Updates */}
        <section className="mt-8 pt-6 border-t border-[#E0E0E0]">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-[#004D40]" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
              {t.comments} ({post.comments?.length || 0})
            </h3>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-6 bg-[#FAFAFA] p-4 rounded-lg border border-[#E0E0E0] space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder={t.yourName}
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                className="text-xs p-2 rounded-md border border-gray-300 bg-white sm:w-1/3"
              />
              <input
                type="text"
                placeholder={t.yourComment}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                className="text-xs p-2 rounded-md border border-gray-300 bg-white flex-1"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1 px-4 py-2 bg-[#004D40] hover:bg-[#00382E] text-white rounded-md text-xs font-bold uppercase tracking-wider shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-[#E0F2F1]" />
                <span>{t.postComment}</span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-2.5">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((c) => (
                <div key={c.id} className="p-3.5 bg-white rounded-lg border border-[#E0E0E0] text-xs">
                  <div className="flex items-center justify-between text-gray-500 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-[#004D40] text-white flex items-center justify-center text-[9px] font-bold shrink-0 border border-gray-200">
                        {c.authorAvatar ? (
                          <img
                            src={c.authorAvatar}
                            alt={c.author}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span>{c.author.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-bold text-[#1A1A1A]">{c.author}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed pl-7">{c.text}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic py-2">
                {lang === 'hi'
                  ? 'अभी कोई टिप्पणी नहीं है। पहली टिप्पणी करें।'
                  : 'No comments yet. Be the first to share an update.'}
              </p>
            )}
          </div>
        </section>
      </article>
    </div>
  );
};
