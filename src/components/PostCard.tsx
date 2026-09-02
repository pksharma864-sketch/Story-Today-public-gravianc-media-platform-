import React from 'react';
import { PostItem, Language } from '../types';
import { translations, categoriesMap, legacyCategoriesMap, getStatusText } from '../i18n/translations';
import {
  MapPin,
  Clock,
  Eye,
  ThumbsUp,
  Share2,
  AlertTriangle,
  Pin,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface Props {
  post: PostItem;
  lang: Language;
  onOpen: (post: PostItem) => void;
  onShare: (post: PostItem) => void;
  onUpvote: (id: string) => void;
  isUpvoted?: boolean;
}

export const PostCard: React.FC<Props> = ({
  post,
  lang,
  onOpen,
  onShare,
  onUpvote,
  isUpvoted,
}) => {
  const t = translations[lang];

  const title = lang === 'hi' && post.titleHi ? post.titleHi : post.title;
  const content = lang === 'hi' && post.contentHi ? post.contentHi : post.content;
  const categoryInfo = categoriesMap[post.category] || legacyCategoriesMap[post.category] || {
    en: post.category,
    hi: post.category,
  };
  const categoryLabel = lang === 'hi' ? categoryInfo.hi : categoryInfo.en;

  const formattedDate = new Date(post.createdAt).toLocaleDateString(
    lang === 'hi' ? 'hi-IN' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  const isGrievance = post.type === 'grievance';

  const statusBadge = () => {
    if (!isGrievance || !post.status) return null;
    const statusText = getStatusText(post.status, lang);

    switch (post.status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3" />
            {statusText}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
            {statusText}
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
            {statusText}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
            {statusText}
          </span>
        );
    }
  };

  return (
    <article
      id={`post-card-${post.id}`}
      onClick={() => onOpen(post)}
      className="group bg-white rounded-xl border border-[#E0E0E0] hover:border-[#004D40] hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Urgent / Breaking Banner */}
        {post.isBreaking && (
          <div className="bg-red-700 text-white px-3 py-1 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span>{t.breakingNews}</span>
          </div>
        )}

        {/* Card Header Tags */}
        <div className="p-4 sm:p-5 pb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Type Badge */}
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                isGrievance
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-[#E0F2F1] text-[#004D40] border border-[#B2DFDB]'
              }`}
            >
              {isGrievance
                ? lang === 'hi'
                  ? 'जन शिकायत'
                  : 'Grievance'
                : lang === 'hi'
                ? 'स्थानीय समाचार'
                : 'Local News'}
            </span>

            {/* Category Tag */}
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
              {categoryLabel}
            </span>

            {/* Pinned Marker */}
            {post.isPinned && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                <Pin className="w-3 h-3 rotate-45" />
                {lang === 'hi' ? 'पिन' : 'Pinned'}
              </span>
            )}
          </div>

          {/* Grievance Status Badge */}
          {statusBadge()}
        </div>

        {/* Main Body */}
        <div className="px-4 sm:px-5 py-2">
          {/* Reference number if grievance */}
          {post.referenceNumber && (
            <p className="text-[10px] font-mono text-gray-400 mb-1 tracking-wider uppercase">
              Ref: {post.referenceNumber}
            </p>
          )}

          {/* Title */}
          <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A1A1A] leading-tight group-hover:text-[#004D40] transition-colors">
            {title}
          </h3>

          {/* Content snippet */}
          <p className="text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed">
            {post.summary || content}
          </p>

          {/* Optional Image Thumbnail Preview */}
          {post.imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden max-h-48 bg-gray-100 border border-[#E0E0E0]">
              <img
                src={post.imageUrl}
                alt={title}
                className="w-full h-48 object-cover group-hover:scale-102 transition-transform duration-300"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Info & Interactive Bar */}
      <div className="p-4 sm:p-5 pt-3 border-t border-gray-100 bg-[#FAFAFA]/70">
        {/* Meta row: Location, Author, Date */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2 mb-3">
          <div className="flex items-center gap-1 font-medium text-gray-700">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>
              {post.location.city}
              {post.location.area ? `, ${post.location.area}` : ''}
              {post.location.ward ? ` (Ward ${post.location.ward})` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <div className="w-4 h-4 rounded-full overflow-hidden bg-[#004D40] text-white flex items-center justify-center text-[8px] font-bold shrink-0 border border-gray-200">
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.authorName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{post.authorName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="font-medium text-gray-700">{post.authorName}</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400 text-[10px]">{formattedDate}</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
          {/* Upvote / Support Counter */}
          <button
            id={`btn-upvote-${post.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onUpvote(post.id);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              isUpvoted
                ? 'bg-[#004D40] text-white'
                : 'bg-white hover:bg-gray-100 text-[#004D40] border border-[#E0E0E0]'
            }`}
            title={isGrievance ? t.supportIssue : 'Upvote'}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? 'fill-white text-white' : ''}`} />
            <span>{post.upvotes || 0}</span>
            <span className="hidden sm:inline">
              {isGrievance ? (lang === 'hi' ? 'समर्थन' : 'Supports') : ''}
            </span>
          </button>

          {/* Views & Comments */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1" title="Views">
              <Eye className="w-3.5 h-3.5" />
              {post.views || 1}
            </span>
            {post.comments && post.comments.length > 0 && (
              <span className="flex items-center gap-1" title="Comments">
                <MessageSquare className="w-3.5 h-3.5" />
                {post.comments.length}
              </span>
            )}
          </div>

          {/* Right: Share Button & Read in-app button */}
          <div className="flex items-center gap-1.5">
            <button
              id={`btn-share-${post.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onShare(post);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-md text-xs font-semibold border border-[#E0E0E0] transition-colors"
              title="Share Web Link"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-500" />
              <span>{lang === 'hi' ? 'साझा' : 'Share'}</span>
            </button>

            <button
              id={`btn-open-${post.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpen(post);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              <span>{t.readMore}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
