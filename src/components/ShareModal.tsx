import React, { useState } from 'react';
import { PostItem, Language } from '../types';
import { translations } from '../i18n/translations';
import { StoryTodayLogo } from './StoryTodayLogo';
import { X, Copy, Check, Share2, Send, MessageCircle, Twitter, Facebook, ExternalLink, Printer } from 'lucide-react';

interface Props {
  post: PostItem;
  lang: Language;
  onClose: () => void;
}

export const ShareModal: React.FC<Props> = ({ post, lang, onClose }) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  // Generate web URL
  const origin = window.location.origin;
  const pathPrefix = post.type === 'grievance' ? 'grievance' : 'article';
  const shareUrl = `${origin}/${pathPrefix}/${post.id}`;
  
  const titleText = (lang === 'hi' && post.titleHi) ? post.titleHi : post.title;
  const shareMessage = `📢 [${post.type === 'grievance' ? 'जन शिकायत' : 'ताज़ा खबर'}] ${titleText}\n📍 ${post.location.city}${post.location.area ? `, ${post.location.area}` : ''}\n\n👉 पढ़ें Story Today पर: ${shareUrl}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: titleText,
          text: shareMessage,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(titleText)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="share-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        id="share-modal-content"
        className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-[#E0E0E0] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E0E0E0] bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#004D40] text-white flex items-center justify-center">
              <Share2 className="w-4 h-4 text-[#E0F2F1]" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1A1A1A]">
                {post.type === 'grievance' ? t.shareGrievance : t.shareArticle}
              </h3>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">{t.shareVia}</p>
            </div>
          </div>
          <button
            id="btn-close-share"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-3.5 text-xs">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#E0E0E0]">
              <StoryTodayLogo variant="icon-only" size="sm" showDomain={false} lang={lang} theme="emerald" />
              <span className="inline-block font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-widest bg-[#E0F2F1] text-[#004D40] border border-[#B2DFDB]">
                {post.type === 'grievance' ? 'Grievance' : 'News'}
              </span>
            </div>
            <p className="font-serif font-bold text-[#1A1A1A] line-clamp-2">{titleText}</p>
            <p className="text-gray-500 mt-1 flex items-center gap-1 text-[11px]">
              <span>📍 {post.location.city}</span>
              {post.referenceNumber && <span>• Ref: {post.referenceNumber}</span>}
            </p>
          </div>

          {/* Browser Link Input & Copy */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#004D40] mb-1.5">
              {t.openWebLink}
            </label>
            <div className="flex items-center gap-2 bg-[#FAFAFA] p-1.5 rounded-lg border border-[#E0E0E0]">
              <input
                id="share-link-input"
                type="text"
                readOnly
                value={shareUrl}
                className="w-full text-xs text-gray-800 bg-transparent px-2 py-1 focus:outline-hidden font-mono select-all"
              />
              <button
                id="btn-copy-share-url"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-md transition-all shrink-0 ${
                  copied
                    ? 'bg-[#004D40] text-white'
                    : 'bg-[#004D40] hover:bg-[#00382E] text-white shadow-xs'
                }`}
              >
                {copied ? (
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
            </div>
            {copied && (
              <p className="text-[11px] text-[#004D40] font-bold mt-1">
                {t.linkCopied}
              </p>
            )}
          </div>

          {/* Social Share Grid */}
          <div>
            <span className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">
              Instant Share Channels
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                id="btn-share-whatsapp"
                onClick={handleWhatsApp}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 transition-all text-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
              </button>

              <button
                id="btn-share-twitter"
                onClick={handleTwitter}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 transition-all text-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
                  <Twitter className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Twitter / X</span>
              </button>

              <button
                id="btn-share-telegram"
                onClick={handleTelegram}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 transition-all text-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Telegram</span>
              </button>

              <button
                id="btn-share-facebook"
                onClick={handleFacebook}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 transition-all text-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Facebook className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Facebook</span>
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center gap-2 border-t border-gray-100">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                id="btn-native-share"
                onClick={handleNativeShare}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Device Share Menu</span>
              </button>
            )}
            <button
              id="btn-print-story"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-[#E0E0E0] hover:bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
              title="Print Summary / Save PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#004D40]" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
