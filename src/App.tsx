/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PostItem, Language, AppStats, GrievanceStatus, UserAccount, ApprovalStatus } from './types';
import { translations, categoriesMap } from './i18n/translations';
import {
  fetchPosts,
  fetchPostById,
  createPost,
  upvotePost,
  addPostComment,
  updateGrievanceStatus,
  updatePost,
  deletePost,
  fetchStats,
  updatePostApproval,
  loginUser,
  fetchSettings,
} from './lib/api';
import { Header } from './components/Header';
import { PostCard } from './components/PostCard';
import { PostDetailView } from './components/PostDetailView';
import { CreatePostModal } from './components/CreatePostModal';
import { ShareModal } from './components/ShareModal';
import { AdminPanel } from './components/AdminPanel';
import { UserLoginModal } from './components/UserLoginModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ReporterIdCardModal } from './components/ReporterIdCardModal';
import { MobileFrame } from './components/MobileFrame';
import { StoryTodayLogo } from './components/StoryTodayLogo';
import { SplashScreen } from './components/SplashScreen';
import {
  Plus,
  Filter,
  Flame,
  AlertCircle,
  CheckCircle2,
  Newspaper,
  Sparkles,
  MapPin,
  RefreshCw,
  Clock,
  ShieldCheck,
  Bell,
  ArrowRight,
  Info,
} from 'lucide-react';

export function matchesCategoryFilter(postCategory: string | undefined, filterCategory: string): boolean {
  if (!filterCategory || filterCategory === 'all') return true;
  if (!postCategory) return false;

  const normPost = postCategory.toLowerCase().trim();
  const normFilter = filterCategory.toLowerCase().trim();

  if (normPost === normFilter) return true;

  switch (normFilter) {
    case 'press_release':
      return (
        (normPost === 'press_release' || normPost === 'press release' || normPost === 'press-release') &&
        !normPost.includes('health')
      );
    case 'press_release_health':
      return (
        normPost === 'press_release_health' ||
        normPost.includes('press release (health)') ||
        normPost.includes('press_release_health') ||
        (normPost.includes('press release') && normPost.includes('health')) ||
        (normPost.includes('press') && normPost.includes('health'))
      );
    case 'education_career':
      return (
        normPost === 'education_career' ||
        normPost === 'education & career' ||
        normPost === 'education/ career' ||
        normPost.includes('education') ||
        normPost.includes('career')
      );
    case 'geo_politics':
      return (
        normPost === 'geo_politics' ||
        normPost === 'geo-politics' ||
        normPost.includes('geopolitics') ||
        normPost.includes('geo-politics') ||
        normPost.includes('geo politics')
      );
    case 'mental_health':
      return (
        normPost === 'mental_health' ||
        normPost === 'mental health' ||
        normPost.includes('mental')
      );
    case 'politics':
      return (
        normPost === 'politics' ||
        (normPost.includes('politic') && !normPost.includes('geo'))
      );
    case 'social':
      return normPost === 'social' || normPost.includes('social') || normPost.includes('society');
    case 'art_culture':
      return (
        normPost === 'art_culture' ||
        normPost === 'art & culture' ||
        normPost.includes('art') ||
        normPost.includes('culture')
      );
    case 'product_review':
      return (
        normPost === 'product_review' ||
        normPost === 'product review' ||
        normPost.includes('product') ||
        normPost.includes('review')
      );
    case 'science_invention':
      return (
        normPost === 'science_invention' ||
        normPost === 'science & invention' ||
        normPost.includes('science') ||
        normPost.includes('invention')
      );
    case 'technology':
      return (
        normPost === 'technology' ||
        normPost === 'tech' ||
        normPost.includes('technology') ||
        normPost.includes('tech')
      );
    case 'sports':
      return normPost === 'sports' || normPost.includes('sport');
    case 'agriculture':
      return (
        normPost === 'agriculture' ||
        normPost.includes('agriculture') ||
        normPost.includes('kisan') ||
        normPost.includes('farming')
      );
    case 'market_economics':
      return (
        normPost === 'market_economics' ||
        normPost === 'market & economics' ||
        normPost.includes('market') ||
        normPost.includes('economic') ||
        normPost.includes('finance') ||
        normPost.includes('business')
      );
    default:
      return (
        normPost === normFilter ||
        normPost.replace(/[-_ ]/g, '') === normFilter.replace(/[-_ ]/g, '')
      );
  }
}

export default function App() {
  // Localization
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('story_today_lang') as Language) || 'hi';
  });

  // Current Logged-in User (Reporter / Citizen / Admin)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('story_today_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Admin state (active if logged in as admin role OR explicit passcode unlock)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem('story_today_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.role === 'admin') return true;
      }
    } catch {}
    return localStorage.getItem('story_today_admin_active') === 'true';
  });

  // Mobile viewport toggle
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  // Core Data
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [stats, setStats] = useState<AppStats>({
    totalPosts: 0,
    totalNews: 0,
    totalGrievances: 0,
    resolvedGrievances: 0,
    inProgressGrievances: 0,
    pendingApproval: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isArticleLoading, setIsArticleLoading] = useState<boolean>(false);
  const [articleNotFoundId, setArticleNotFoundId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p !== '/' && p !== '') return false;
      if (window.location.search.includes('article') || window.location.search.includes('grievance') || window.location.search.includes('id')) return false;
    }
    return true;
  });

  // Navigation & Active Views
  const [activeTab, setActiveTab] = useState<string>('all'); // category id filter, 'all' by default
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals & Active In-App Article
  const [activePost, setActivePost] = useState<PostItem | null>(null);
  const [sharePost, setSharePost] = useState<PostItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createInitialType, setCreateInitialType] = useState<'news' | 'grievance'>('news');
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showIdCardModal, setShowIdCardModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Upvoted IDs tracked in local storage
  const [upvotedIds, setUpvotedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('story_today_upvotes') || '[]');
    } catch {
      return [];
    }
  });

  const t = translations[lang];

  // Helper to sync Language
  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('story_today_lang', newLang);
  };

  // Helper to load all posts & stats from backend
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // If admin, fetch including pending so admin has full queue
      const [fetchedPosts, fetchedStats] = await Promise.all([
        fetchPosts({ includePending: true }),
        fetchStats(),
      ]);
      setPosts(fetchedPosts);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle URL route inspection on load & popstate (browser forward/back)
  const parseCurrentUrl = useCallback(async () => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const queryArticleId = searchParams.get('article') || searchParams.get('grievance') || searchParams.get('id');

    let targetId: string | null = null;

    if (queryArticleId) {
      targetId = queryArticleId;
    } else {
      const parts = pathname.split('/').filter(Boolean);
      // Handles /article/123, /grievance/123, /post/123
      if (parts.length >= 2 && ['article', 'grievance', 'post'].includes(parts[0])) {
        targetId = parts[1];
      }
    }

    if (targetId) {
      setShowSplash(false);
      setIsArticleLoading(true);
      setArticleNotFoundId(null);
      try {
        const post = await fetchPostById(targetId);
        if (post) {
          setActivePost(post);
          setArticleNotFoundId(null);
        } else {
          setActivePost(null);
          setArticleNotFoundId(targetId);
        }
      } catch (err) {
        console.error('Error fetching post by id:', err);
        setArticleNotFoundId(targetId);
      } finally {
        setIsArticleLoading(false);
      }
    } else {
      setActivePost(null);
      setArticleNotFoundId(null);
      setIsArticleLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadData();
    parseCurrentUrl();

    // Auto-sync permanent logo and branding settings from cloud
    fetchSettings()
      .then((settings) => {
        if (settings.customLogo) {
          localStorage.setItem('story_today_custom_logo', settings.customLogo);
          window.dispatchEvent(new Event('storage'));
        }
      })
      .catch((err) => console.warn('Non-critical: could not sync settings on boot', err));

    const handlePopState = () => {
      parseCurrentUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadData, parseCurrentUrl]);

  // User Login / Logout Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('story_today_current_user', JSON.stringify(user));
    if (user.role === 'admin') {
      setIsAdmin(true);
      localStorage.setItem('story_today_admin_active', 'true');
    }
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('story_today_current_user');
    setIsAdmin(false);
    localStorage.removeItem('story_today_admin_active');
  };

  // Open In-App Article & push URL
  const handleOpenPost = (post: PostItem) => {
    setActivePost(post);
    setArticleNotFoundId(null);
    const pathPrefix = post.type === 'grievance' ? 'grievance' : 'article';
    window.history.pushState({ postId: post.id }, '', `/${pathPrefix}/${post.id}`);
  };

  // Close Article View & restore URL to /
  const handleBackToFeed = () => {
    setActivePost(null);
    setArticleNotFoundId(null);
    setIsArticleLoading(false);
    window.history.pushState({}, '', '/');
    loadData();
  };

  // Upvote / Endorse
  const handleUpvote = async (id: string) => {
    if (upvotedIds.includes(id)) return;

    const newUpvotes = [...upvotedIds, id];
    setUpvotedIds(newUpvotes);
    localStorage.setItem('story_today_upvotes', JSON.stringify(newUpvotes));

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p))
    );
    if (activePost && activePost.id === id) {
      setActivePost({ ...activePost, upvotes: (activePost.upvotes || 0) + 1 });
    }

    await upvotePost(id);
  };

  // Add Comment
  const handleAddComment = async (id: string, author: string, text: string, authorAvatar?: string) => {
    const updatedComments = await addPostComment(id, author, text, authorAvatar);
    if (updatedComments) {
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, comments: updatedComments } : p))
      );
      if (activePost && activePost.id === id) {
        setActivePost({ ...activePost, comments: updatedComments });
      }
    }
  };

  // Update Grievance Status
  const handleUpdateStatus = async (
    id: string,
    status: GrievanceStatus,
    note: string,
    officerName?: string,
    department?: string
  ) => {
    const updated = await updateGrievanceStatus(id, status, note, officerName, department);
    if (updated) {
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (activePost && activePost.id === id) {
        setActivePost(updated);
      }
      loadData();
    }
  };

  // Pin Toggle
  const handleTogglePin = async (id: string, currentPin: boolean) => {
    const updated = await updatePost(id, { isPinned: !currentPin });
    if (updated) {
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (activePost && activePost.id === id) {
        setActivePost(updated);
      }
    }
  };

  // Delete Post
  const handleDeletePost = async (id: string) => {
    const ok = await deletePost(id);
    if (ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (activePost && activePost.id === id) {
        handleBackToFeed();
      }
      loadData();
    }
  };

  // Create Post
  const handleCreatePost = async (postData: any) => {
    const result = await createPost(postData);
    if (result && result.post) {
      setShowCreateModal(false);
      await loadData();

      if (result.post.approvalStatus === 'pending') {
        setSubmissionFeedback(
          lang === 'hi'
            ? 'आपकी पोस्ट सफलतापूर्वक जमा कर दी गई है! यह अभी "समीक्षाधीन" है और एडमिन द्वारा स्वीकृत होने के बाद लाइव दिखाई देगी।'
            : 'Your post has been submitted successfully! It is currently in "Pending Approval" status and will appear publicly once approved by the Admin.'
        );
        setTimeout(() => setSubmissionFeedback(null), 8000);
      } else {
        handleOpenPost(result.post);
      }
    }
  };

  // Content Approval Action
  const handlePostApprovalChange = async (
    id: string,
    approvalStatus: ApprovalStatus,
    reason?: string
  ) => {
    const adminName = currentUser?.name || 'Chief Editor & Admin';
    const res = await updatePostApproval(id, approvalStatus, reason, adminName);
    if (res.success && res.post) {
      setPosts((prev) => prev.map((p) => (p.id === id ? res.post : p)));
      if (activePost && activePost.id === id) {
        setActivePost(res.post);
      }
      await loadData();
    }
  };

  // Admin Auth Handler
  const handleAdminAuth = async (passcode: string): Promise<boolean> => {
    try {
      const cleanPass = passcode.trim();
      const res = await loginUser('admin', cleanPass);
      if (res.success && res.user) {
        setIsAdmin(true);
        setCurrentUser(res.user);
        localStorage.setItem('story_today_current_user', JSON.stringify(res.user));
        localStorage.setItem('story_today_admin_active', 'true');
        return true;
      }
    } catch (err) {
      console.error('Admin authentication error:', err);
    }

    // Direct fallback for default master password if server is in transit
    if (passcode.trim() === 'admin123') {
      const fallbackAdmin: UserAccount = {
        id: 'user_admin',
        name: 'Chief Editor & Admin',
        username: 'admin',
        role: 'admin',
        createdAt: new Date().toISOString(),
        status: 'active',
      };
      setIsAdmin(true);
      setCurrentUser(fallbackAdmin);
      localStorage.setItem('story_today_current_user', JSON.stringify(fallbackAdmin));
      localStorage.setItem('story_today_admin_active', 'true');
      return true;
    }

    return false;
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('story_today_admin_active');
    if (currentUser?.role === 'admin') {
      setCurrentUser(null);
      localStorage.removeItem('story_today_current_user');
    }
    setShowAdminModal(false);
  };

  // Filtered Posts for Feed (Only Approved posts appear for public viewers)
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Public feed: only approved posts (unless viewed specifically by admin in detail)
      const status = post.approvalStatus || 'approved';
      if (!isAdmin && status !== 'approved') return false;

      // Category filter (selected from top categories row)
      if (activeTab !== 'all') {
        if (!matchesCategoryFilter(post.category, activeTab)) {
          return false;
        }
      }

      // City filter
      if (
        selectedCity !== 'all' &&
        post.location?.city?.toLowerCase() !== selectedCity.toLowerCase()
      ) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle =
          post.title?.toLowerCase().includes(q) || post.titleHi?.toLowerCase().includes(q);
        const matchesContent =
          post.content?.toLowerCase().includes(q) || post.contentHi?.toLowerCase().includes(q);
        const matchesCity = post.location?.city?.toLowerCase().includes(q);
        const matchesArea = post.location?.area?.toLowerCase().includes(q);
        const matchesWard = post.location?.ward?.toLowerCase().includes(q);
        const matchesRef = post.referenceNumber?.toLowerCase().includes(q);
        const matchesAuthor = post.authorName?.toLowerCase().includes(q);

        if (
          !matchesTitle &&
          !matchesContent &&
          !matchesCity &&
          !matchesArea &&
          !matchesWard &&
          !matchesRef &&
          !matchesAuthor
        ) {
          return false;
        }
      }

      return true;
    });
  }, [posts, isAdmin, activeTab, selectedCity, searchQuery]);

  const pendingApprovalsCount = posts.filter((p) => p.approvalStatus === 'pending').length;

  return (
    <MobileFrame isMobileView={isMobileView}>
      <div id="app-root" className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#1A1A1A] font-sans">
        {/* Header */}
        <Header
          lang={lang}
          onLanguageChange={handleLanguageChange}
          isAdmin={isAdmin}
          onAdminToggle={() => setShowAdminModal(true)}
          currentUser={currentUser}
          onOpenLoginModal={(initialMode) => {
            setAuthModalMode(initialMode || 'login');
            setShowLoginModal(true);
          }}
          onOpenProfileModal={() => setShowProfileModal(true)}
          onOpenIdCardModal={() => setShowIdCardModal(true)}
          onUserLogout={handleUserLogout}
          pendingApprovalsCount={pendingApprovalsCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (activePost) {
              handleBackToFeed();
            }
          }}
          onLogoClick={handleBackToFeed}
          onOpenCreateModal={(initialType) => {
            setCreateInitialType(initialType || 'news');
            setShowCreateModal(true);
          }}
          isMobileView={isMobileView}
          onToggleMobileView={() => setIsMobileView(!isMobileView)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
          {/* Submission Feedback Toast / Alert Banner */}
          {submissionFeedback && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 shadow-xs flex items-start justify-between gap-3 text-xs text-amber-950 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">
                    {lang === 'hi' ? 'समीक्षा हेतु जमा किया गया (Pending Approval)' : 'Submitted for Editorial Approval'}
                  </h4>
                  <p className="mt-0.5 leading-relaxed">{submissionFeedback}</p>
                </div>
              </div>
              <button
                onClick={() => setSubmissionFeedback(null)}
                className="text-amber-700 hover:text-amber-950 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Admin Pending Review Prompt Banner (when Admin is active) */}
          {isAdmin && pendingApprovalsCount > 0 && !activePost && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {pendingApprovalsCount}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Editorial Moderation Queue</span>
                  </h4>
                  <p className="text-xs text-amber-900 mt-0.5">
                    There are <strong>{pendingApprovalsCount}</strong> pending citizen submissions waiting for your approval.
                  </p>
                </div>
              </div>

              <button
                id="btn-banner-review-pending"
                onClick={() => setShowAdminModal(true)}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>Review Pending Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Detail View Mode (when an article is opened or requested) */}
          {isArticleLoading ? (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#004D40]/20 border-t-[#004D40] rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-gray-600">
                {lang === 'hi' ? 'समाचार / शिकायत लोड हो रही है...' : 'Loading Story...'}
              </p>
            </div>
          ) : articleNotFoundId ? (
            <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 text-center bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
                ⚠️
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {lang === 'hi' ? 'यह समाचार या शिकायत उपलब्ध नहीं है' : 'Story or Grievance Not Found'}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {lang === 'hi'
                  ? 'यह पोस्ट हटा दी गई हो सकती है या गलत लिंक दर्ज किया गया है।'
                  : 'The requested story may have been removed or the link is incorrect.'}
              </p>
              <button
                type="button"
                onClick={handleBackToFeed}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors"
              >
                <span>{lang === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Return to Home Feed'}</span>
              </button>
            </div>
          ) : activePost ? (
            <PostDetailView
              post={activePost}
              lang={lang}
              isAdmin={isAdmin}
              currentUser={currentUser}
              onBack={handleBackToFeed}
              onShare={(post) => setSharePost(post)}
              onUpvote={handleUpvote}
              onAddComment={handleAddComment}
              onUpdateStatus={handleUpdateStatus}
              onDeletePost={handleDeletePost}
              onTogglePin={handleTogglePin}
              onPostApprovalChange={handlePostApprovalChange}
              isUpvoted={upvotedIds.includes(activePost.id)}
            />
          ) : (
            /* Feed / Explorer View Mode */
            <div className="space-y-6">
              {/* Top Banner / Quick Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E0E0E0] shadow-xs">
                <div>
                  <p className="text-[10px] font-bold text-[#004D40] uppercase tracking-[0.2em] mb-1">
                    {lang === 'hi'
                      ? 'आधिकारिक प्रेस वायर एवं मीडिया नेटवर्क'
                      : 'Official Press Wire & Media Network'}
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] font-serif tracking-tight">
                    PR / Media & News Network
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === 'hi'
                      ? 'प्रेस विज्ञप्तियां, मीडिया कवरेज, समाचार आलेख एवं आधिकारिक सूचनाएं प्रकाशित एवं प्रसारित करें।'
                      : 'Publish and distribute press releases, media coverage, editorial articles, and verified news.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    id="btn-quick-post-news"
                    onClick={() => {
                      setCreateInitialType('news');
                      setShowCreateModal(true);
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-xs transition-colors whitespace-nowrap cursor-pointer"
                  >
                    + Post News/Articles/Press Release
                  </button>
                </div>
              </div>

              {/* Stories / Grievances Grid */}
              {isLoading ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-[#004D40] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Loading Stories & Issues...
                  </p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-xl border border-dashed border-[#E0E0E0] p-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#E0F2F1] text-[#004D40] flex items-center justify-center mx-auto">
                    <Newspaper className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#1A1A1A]">
                      {t.noPostsYet}
                    </h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                      {t.noPostsSub}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setCreateInitialType('news');
                        setShowCreateModal(true);
                      }}
                      className="px-4 py-2.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                    >
                      + Post News/Articles/Press Release
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      lang={lang}
                      onOpen={handleOpenPost}
                      onShare={(p) => setSharePost(p)}
                      onUpvote={handleUpvote}
                      isUpvoted={upvotedIds.includes(post.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-[#E0E0E0] bg-white py-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <StoryTodayLogo size="sm" variant="icon-only" showDomain={false} />
              <span className="font-semibold text-gray-700">PR / Media & News Network</span>
            </div>
            <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-4 text-[11px]">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 font-medium">
                    {lang === 'hi' ? 'लॉगिन किया गया:' : 'Logged in as:'}{' '}
                    <strong className="text-gray-900">{currentUser.name}</strong> ({currentUser.role})
                  </span>
                  <button
                    onClick={handleUserLogout}
                    className="text-red-600 hover:underline font-bold"
                  >
                    {lang === 'hi' ? 'लॉगआउट' : 'Logout'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setShowLoginModal(true);
                    }}
                    className="text-gray-600 hover:text-[#004D40] font-semibold"
                  >
                    {lang === 'hi' ? 'यूज़र लॉगिन' : 'User Login'}
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => {
                      setAuthModalMode('register');
                      setShowLoginModal(true);
                    }}
                    className="text-[#004D40] hover:underline font-bold"
                  >
                    {lang === 'hi' ? 'नया खाता बनाएं' : 'Create Account'}
                  </button>
                </div>
              )}
              <span>•</span>
              <button
                onClick={() => setShowAdminModal(true)}
                className="text-gray-600 hover:text-[#004D40] font-bold"
              >
                Admin Desk
              </button>
            </div>
          </div>
        </footer>

        {/* Create Post Modal */}
        {showCreateModal && (
          <CreatePostModal
            lang={lang}
            initialType={createInitialType}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePost}
            onOpenLoginModal={(mode) => {
              setAuthModalMode(mode || 'login');
              setShowLoginModal(true);
            }}
          />
        )}

        {/* Share Modal */}
        {sharePost && (
          <ShareModal
            post={sharePost}
            lang={lang}
            onClose={() => setSharePost(null)}
          />
        )}

        {/* User Account Login / Register Modal */}
        {showLoginModal && (
          <UserLoginModal
            lang={lang}
            initialMode={authModalMode}
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {/* User Profile Modal */}
        {showProfileModal && currentUser && (
          <UserProfileModal
            user={currentUser}
            lang={lang}
            onClose={() => setShowProfileModal(false)}
            onProfileUpdated={(updatedUser) => {
              setCurrentUser(updatedUser);
              localStorage.setItem('story_today_current_user', JSON.stringify(updatedUser));
            }}
            onOpenIdCardModal={() => {
              setShowProfileModal(false);
              setShowIdCardModal(true);
            }}
          />
        )}

        {/* Reporter Identity Card Modal */}
        {showIdCardModal && currentUser && (
          <ReporterIdCardModal
            lang={lang}
            currentUser={currentUser}
            onClose={() => setShowIdCardModal(false)}
            onUserUpdate={(updatedUser) => {
              setCurrentUser(updatedUser);
              localStorage.setItem('story_today_current_user', JSON.stringify(updatedUser));
            }}
          />
        )}

        {/* Admin Management Panel Modal */}
        {showAdminModal && (
          <AdminPanel
            lang={lang}
            isAdmin={isAdmin}
            onAdminAuth={handleAdminAuth}
            onAdminLogout={handleAdminLogout}
            onClose={() => setShowAdminModal(false)}
            stats={stats}
            posts={posts}
            onDeletePost={handleDeletePost}
            onUpdateStatus={handleUpdateStatus}
            onPostApprovalChange={handlePostApprovalChange}
            onRefreshData={loadData}
          />
        )}

        {/* Splash Screen */}
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      </div>
    </MobileFrame>
  );
}
