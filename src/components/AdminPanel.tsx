import React, { useState, useEffect } from 'react';
import { PostItem, Language, AppStats, UserAccount, ApprovalStatus, UserRole, ReporterIdCard } from '../types';
import { translations, categoriesMap } from '../i18n/translations';
import { StoryTodayLogo } from './StoryTodayLogo';
import { ReporterIdCardModal } from './ReporterIdCardModal';
import { BloggerImportSection } from './BloggerImportSection';
import {
  fetchUsers,
  createUser,
  deleteUser,
  changeAdminPassword,
  updatePostApproval,
  updateBrandingLogo,
  fetchSettings,
  resetAdminAccount,
  fetchIdCards,
  approveIdCard,
  rejectIdCard,
  deleteIdCard,
} from '../lib/api';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Download,
  X,
  Lock,
  Unlock,
  Settings,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Users,
  UserPlus,
  Clock,
  Check,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  FileText,
  AlertCircle,
  Sparkles,
  Copy,
  BadgeCheck,
  Phone,
  MapPin,
  Globe,
} from 'lucide-react';

interface Props {
  lang: Language;
  isAdmin: boolean;
  onAdminAuth: (passcode: string) => boolean | Promise<boolean>;
  onAdminLogout: () => void;
  onClose: () => void;
  stats: AppStats;
  posts: PostItem[];
  onDeletePost: (id: string) => void;
  onUpdateStatus: (id: string, status: any, note: string) => void;
  onPostApprovalChange: (id: string, status: ApprovalStatus, reason?: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const AdminPanel: React.FC<Props> = ({
  lang,
  isAdmin,
  onAdminAuth,
  onAdminLogout,
  onClose,
  stats,
  posts,
  onDeletePost,
  onUpdateStatus,
  onPostApprovalChange,
  onRefreshData,
}) => {
  const t = translations[lang];

  // Auth States
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Admin Sub-tab
  const [adminTab, setAdminTab] = useState<'approvals' | 'id_cards' | 'users' | 'security' | 'branding' | 'overview' | 'blogger_import'>('approvals');

  // Approvals Filter Tab
  const [approvalFilter, setApprovalFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedPostForReject, setSelectedPostForReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Reporter ID Card Management State
  const [idCardsList, setIdCardsList] = useState<ReporterIdCard[]>([]);
  const [isLoadingIdCards, setIsLoadingIdCards] = useState(false);
  const [idCardFilter, setIdCardFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedCardForReject, setSelectedCardForReject] = useState<string | null>(null);
  const [cardRejectReason, setCardRejectReason] = useState('');
  const [selectedCardForPreview, setSelectedCardForPreview] = useState<ReporterIdCard | null>(null);
  const [idCardActionLoadingId, setIdCardActionLoadingId] = useState<string | null>(null);
  const [idCardActionMsg, setIdCardActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User Management State
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPass, setShowNewUserPass] = useState(false);
  const [newUserRole, setNewUserRole] = useState<UserRole>('reporter');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState<string | null>(null);
  const [userActionMsg, setUserActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Management State
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Helper for password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    if (pass.length < 4) return { score: 1, label: 'Too Short (Min 4 chars)', color: 'bg-red-500' };
    
    let strength = 1;
    if (pass.length >= 8) strength += 1;
    if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;

    if (strength <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (strength === 3) return { score: 3, label: 'Good', color: 'bg-emerald-500' };
    return { score: 4, label: 'Strong', color: 'bg-teal-600' };
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewAdminPassword(result);
    setConfirmAdminPassword(result);
    setShowNewPass(true);
    setShowConfirmPass(true);
    setCopiedPass(false);
  };

  const handleCopyNewPassword = () => {
    if (!newAdminPassword) return;
    navigator.clipboard.writeText(newAdminPassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  // Branding Logo State
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [logoUploadedMsg, setLogoUploadedMsg] = useState('');

  // Load initial data
  useEffect(() => {
    const saved = localStorage.getItem('story_today_custom_logo');
    if (saved) setCurrentLogo(saved);

    fetchSettings().then((settings) => {
      if (settings.customLogo) {
        setCurrentLogo(settings.customLogo);
        localStorage.setItem('story_today_custom_logo', settings.customLogo);
        window.dispatchEvent(new Event('storage'));
      }
    });

    if (isAdmin) {
      loadUsers();
      loadIdCards();
    }
  }, [isAdmin]);

  const loadIdCards = async () => {
    setIsLoadingIdCards(true);
    try {
      const cards = await fetchIdCards();
      setIdCardsList(cards);
    } catch (err) {
      console.error('Failed to load ID cards', err);
    } finally {
      setIsLoadingIdCards(false);
    }
  };

  const handleApproveIdCard = async (cardId: string) => {
    setIdCardActionLoadingId(cardId);
    setIdCardActionMsg(null);
    try {
      const res = await approveIdCard(cardId, 'Chief Admin');
      if (res.success && res.idCard) {
        setIdCardsList((prev) => prev.map((c) => (c.id === cardId ? res.idCard! : c)));
        setIdCardActionMsg({
          type: 'success',
          text: `Press Identity Card approved successfully! Credential: ${res.idCard.cardNumber || cardId}`,
        });
        setTimeout(() => setIdCardActionMsg(null), 4000);
      } else {
        setIdCardActionMsg({ type: 'error', text: res.error || 'Failed to approve ID card' });
      }
    } catch (err) {
      setIdCardActionMsg({ type: 'error', text: 'Network error while approving ID card' });
    } finally {
      setIdCardActionLoadingId(null);
    }
  };

  const handleRejectIdCard = async (cardId: string) => {
    if (!cardRejectReason.trim()) {
      setIdCardActionMsg({ type: 'error', text: 'Please provide a reason for rejecting the ID card application.' });
      return;
    }
    setIdCardActionLoadingId(cardId);
    setIdCardActionMsg(null);
    try {
      const res = await rejectIdCard(cardId, cardRejectReason.trim());
      if (res.success && res.idCard) {
        setIdCardsList((prev) => prev.map((c) => (c.id === cardId ? res.idCard! : c)));
        setSelectedCardForReject(null);
        setCardRejectReason('');
        setIdCardActionMsg({
          type: 'success',
          text: 'ID card application rejected and user notified.',
        });
        setTimeout(() => setIdCardActionMsg(null), 4000);
      } else {
        setIdCardActionMsg({ type: 'error', text: res.error || 'Failed to reject ID card' });
      }
    } catch (err) {
      setIdCardActionMsg({ type: 'error', text: 'Network error while rejecting ID card' });
    } finally {
      setIdCardActionLoadingId(null);
    }
  };

  const handleDeleteIdCard = async (cardId: string) => {
    if (!window.confirm('Are you sure you want to revoke and delete this Press Identity Card?')) return;
    setIdCardActionLoadingId(cardId);
    setIdCardActionMsg(null);
    try {
      const res = await deleteIdCard(cardId);
      if (res.success) {
        setIdCardsList((prev) => prev.filter((c) => c.id !== cardId));
        setIdCardActionMsg({ type: 'success', text: 'ID card deleted / revoked.' });
        setTimeout(() => setIdCardActionMsg(null), 4000);
      } else {
        setIdCardActionMsg({ type: 'error', text: res.error || 'Failed to delete ID card' });
      }
    } catch (err) {
      setIdCardActionMsg({ type: 'error', text: 'Network error while deleting ID card' });
    } finally {
      setIdCardActionLoadingId(null);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await fetchUsers();
      setUsersList(users);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        if (base64) {
          localStorage.setItem('story_today_custom_logo', base64);
          setCurrentLogo(base64);
          await updateBrandingLogo(base64);
          setLogoUploadedMsg('Custom logo updated and saved permanently to database!');
          setTimeout(() => setLogoUploadedMsg(''), 4000);
          window.dispatchEvent(new Event('storage'));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = async () => {
    localStorage.removeItem('story_today_custom_logo');
    setCurrentLogo(null);
    await updateBrandingLogo(null);
    setLogoUploadedMsg('Logo reset to default vector emblem.');
    setTimeout(() => setLogoUploadedMsg(''), 4000);
    window.dispatchEvent(new Event('storage'));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const success = await onAdminAuth(passcode);
      if (!success) {
        setAuthError(
          lang === 'hi'
            ? 'अमान्य पासवर्ड। कृपया पुन: प्रयास करें।'
            : 'Invalid admin passcode. Please try again.'
        );
      } else {
        setAuthError('');
        setPasscode('');
        loadUsers();
      }
    } catch {
      setAuthError('Authentication error occurred.');
    }
  };

  const handleApprove = async (post: PostItem) => {
    setActionLoadingId(post.id);
    try {
      await onPostApprovalChange(post.id, 'approved');
      await onRefreshData();
    } catch (err) {
      console.error(err);
      alert('Failed to approve post.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (postId: string) => {
    setActionLoadingId(postId);
    try {
      await onPostApprovalChange(postId, 'rejected', rejectionReason || 'Content does not meet publication standards.');
      setSelectedPostForReject(null);
      setRejectionReason('');
      await onRefreshData();
    } catch (err) {
      console.error(err);
      alert('Failed to reject post.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) {
      setUserActionMsg({ type: 'error', text: 'Please fill in Name, Username, and Password.' });
      return;
    }

    try {
      const res = await createUser({
        name: newUserName.trim(),
        username: newUserUsername.trim(),
        password: newUserPassword.trim(),
        role: newUserRole,
        email: newUserEmail.trim() || undefined,
        avatar: newUserAvatar || undefined,
      });

      if (res.success) {
        setUserActionMsg({ type: 'success', text: `User account "${newUserUsername}" created successfully!` });
        setNewUserName('');
        setNewUserUsername('');
        setNewUserPassword('');
        setNewUserEmail('');
        setNewUserAvatar(null);
        setShowAddUserForm(false);
        await loadUsers();
        setTimeout(() => setUserActionMsg(null), 4000);
      } else {
        setUserActionMsg({ type: 'error', text: res.error || 'Failed to create user account' });
      }
    } catch (err) {
      setUserActionMsg({ type: 'error', text: 'An unexpected error occurred.' });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove user account "${userName}"?`)) return;

    try {
      const res = await deleteUser(userId);
      if (res.success) {
        setUserActionMsg({ type: 'success', text: 'User removed successfully.' });
        await loadUsers();
        setTimeout(() => setUserActionMsg(null), 3000);
      } else {
        setUserActionMsg({ type: 'error', text: res.error || 'Failed to delete user' });
      }
    } catch (err) {
      setUserActionMsg({ type: 'error', text: 'Error deleting user.' });
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdminPassword || !newAdminPassword || !confirmAdminPassword) {
      setPasswordChangeMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordChangeMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    if (newAdminPassword.length < 4) {
      setPasswordChangeMsg({ type: 'error', text: 'Password must be at least 4 characters.' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordChangeMsg(null);

    try {
      const res = await changeAdminPassword(currentAdminPassword, newAdminPassword);
      if (res.success) {
        setPasswordChangeMsg({ type: 'success', text: 'Admin password updated successfully! Please use your new password next time.' });
        // Update localStorage passcode cache if stored
        localStorage.setItem('story_today_custom_admin_pass', newAdminPassword);
        setCurrentAdminPassword('');
        setNewAdminPassword('');
        setConfirmAdminPassword('');
      } else {
        setPasswordChangeMsg({ type: 'error', text: res.error || 'Failed to update password.' });
      }
    } catch (err) {
      setPasswordChangeMsg({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(posts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `story_today_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter posts for approval review
  const filteredApprovalPosts = posts.filter((p) => {
    const status = p.approvalStatus || 'approved';
    return status === approvalFilter;
  });

  const pendingCount = posts.filter((p) => p.approvalStatus === 'pending').length;

  return (
    <div
      id="admin-panel-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="admin-panel-content"
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-[#E0E0E0] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0] bg-[#FAFAFA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#004D40] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#E0F2F1]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                <span>{t.adminPortal}</span>
                {isAdmin && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Active
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isAdmin
                  ? 'Manage content approvals, user accounts, security & branding'
                  : 'Enter password to unlock administrative controls'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-admin-panel"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {!isAdmin ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="max-w-md mx-auto py-6 space-y-4">
              <div className="p-4 bg-[#E0F2F1]/70 rounded-xl border border-[#B2DFDB] text-xs text-[#004D40] space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Admin Desk Authentication
                  </p>
                  <span className="px-2 py-0.5 bg-[#004D40] text-white rounded text-[10px] font-mono font-bold">
                    SECURE
                  </span>
                </div>
                <p className="text-gray-700">
                  Access the editorial desk, approve or reject civic reports, manage journalist accounts, and customize app configurations.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                  {t.enterAdminPasscode}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-admin-passcode"
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setAuthError('');
                    }}
                    className="w-full text-xs sm:text-sm pl-9 pr-10 py-2.5 rounded-lg border border-[#E0E0E0] focus:outline-hidden focus:border-[#004D40] font-mono bg-white"
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
                {authError && (
                  <p className="text-xs text-red-600 font-semibold mt-1.5">
                    {authError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  id="btn-submit-admin-auth"
                  className="px-5 py-2.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4 text-[#E0F2F1]" />
                  <span>Unlock Admin Desk</span>
                </button>
              </div>
            </form>
          ) : (
            /* Admin Active View with Multi-Section Tabs */
            <div className="space-y-5">
              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 border-b border-[#E0E0E0] pb-2 overflow-x-auto no-scrollbar">
                <button
                  id="tab-admin-approvals"
                  onClick={() => setAdminTab('approvals')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 ${
                    adminTab === 'approvals'
                      ? 'bg-[#004D40] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Content Approvals</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-500 text-white font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  id="tab-admin-id-cards"
                  onClick={() => {
                    setAdminTab('id_cards');
                    loadIdCards();
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-lg uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 ${
                    adminTab === 'id_cards'
                      ? 'bg-[#004D40] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <BadgeCheck className="w-4 h-4" />
                  <span>Reporter ID Cards</span>
                  {idCardsList.filter((c) => c.status === 'pending').length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500 text-white font-bold">
                      {idCardsList.filter((c) => c.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  id="tab-admin-users"
                  onClick={() => setAdminTab('users')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 ${
                    adminTab === 'users'
                      ? 'bg-[#004D40] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>User Accounts</span>
                </button>

                <button
                  id="tab-admin-security"
                  onClick={() => setAdminTab('security')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 ${
                    adminTab === 'security'
                      ? 'bg-[#004D40] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Admin Password</span>
                </button>

                <button
                  id="tab-admin-branding"
                  onClick={() => setAdminTab('branding')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 ${
                    adminTab === 'branding'
                      ? 'bg-[#004D40] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Logo & Brand</span>
                </button>

                <button
                  id="tab-admin-blogger-import"
                  onClick={() => setAdminTab('blogger_import')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 ${
                    adminTab === 'blogger_import'
                      ? 'bg-[#004D40] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Globe className="w-4 h-4 text-emerald-300" />
                  <span>Import (story-today.in)</span>
                </button>

                <button
                  id="tab-admin-overview"
                  onClick={() => setAdminTab('overview')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 ${
                    adminTab === 'overview'
                      ? 'bg-[#004D40] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Overview & Backup</span>
                </button>
              </div>

              {/* ------------------------------------------- */}
              {/* TAB 1: CONTENT APPROVAL SYSTEM */}
              {/* ------------------------------------------- */}
              {adminTab === 'approvals' && (
                <div className="space-y-4">
                  {/* Filter Sub-Tabs */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-[#FAFAFA] p-1 rounded-lg border border-[#E0E0E0]">
                      <button
                        onClick={() => setApprovalFilter('pending')}
                        className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          approvalFilter === 'pending'
                            ? 'bg-[#004D40] text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Review ({pendingCount})</span>
                      </button>

                      <button
                        onClick={() => setApprovalFilter('approved')}
                        className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          approvalFilter === 'approved'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approved Live ({posts.filter((p) => (p.approvalStatus || 'approved') === 'approved').length})</span>
                      </button>

                      <button
                        onClick={() => setApprovalFilter('rejected')}
                        className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          approvalFilter === 'rejected'
                            ? 'bg-red-700 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejected ({posts.filter((p) => p.approvalStatus === 'rejected').length})</span>
                      </button>
                    </div>

                    <button
                      onClick={onRefreshData}
                      className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3 text-[#004D40]" />
                      <span>Refresh Queue</span>
                    </button>
                  </div>

                  {/* List of Posts */}
                  {filteredApprovalPosts.length === 0 ? (
                    <div className="py-12 text-center bg-[#FAFAFA] rounded-xl border border-dashed border-[#E0E0E0] p-6">
                      <FileCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-700">
                        {approvalFilter === 'pending'
                          ? 'No posts pending approval!'
                          : `No ${approvalFilter} posts found.`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {approvalFilter === 'pending'
                          ? 'All newly submitted articles and grievances have been reviewed and processed.'
                          : ''}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredApprovalPosts.map((post) => (
                        <div
                          key={post.id}
                          className="bg-white p-4 rounded-xl border border-[#E0E0E0] hover:border-gray-300 shadow-xs space-y-3 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                <span
                                  className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[10px] ${
                                    post.type === 'grievance'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-[#E0F2F1] text-[#004D40] border border-[#B2DFDB]'
                                  }`}
                                >
                                  {post.type === 'grievance' ? '📢 Grievance' : '📰 News Article'}
                                </span>

                                <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                                  <div className="w-4 h-4 rounded-full overflow-hidden bg-[#004D40] text-white flex items-center justify-center text-[8px] font-bold shrink-0 border border-gray-300">
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
                                  <span>
                                    by <strong className="text-gray-800">{post.authorName}</strong> ({post.authorRole || 'Citizen'})
                                  </span>
                                </div>

                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500">
                                  {post.location?.city} {post.location?.ward ? `(Ward ${post.location.ward})` : ''}
                                </span>

                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500">
                                  {new Date(post.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-[#1A1A1A] leading-snug">
                                {post.title}
                              </h4>
                              {post.titleHi && (
                                <p className="text-xs font-medium text-gray-600">
                                  {post.titleHi}
                                </p>
                              )}
                            </div>

                            {post.imageUrl && (
                              <img
                                src={post.imageUrl}
                                alt="Attachment"
                                className="w-16 h-16 rounded-lg object-cover border border-[#E0E0E0] shrink-0"
                              />
                            )}
                          </div>

                          <p className="text-xs text-gray-700 line-clamp-3 bg-[#FAFAFA] p-2.5 rounded-lg border border-[#E0E0E0]/60">
                            {post.content}
                          </p>

                          {post.rejectionReason && (
                            <div className="text-xs p-2 bg-red-50 border border-red-200 rounded-md text-red-800">
                              <strong>Rejection Reason:</strong> {post.rejectionReason}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#E0E0E0]/80 gap-2 flex-wrap">
                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                              {post.referenceNumber && (
                                <span className="font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                  Ref: {post.referenceNumber}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {post.approvalStatus !== 'approved' && (
                                <button
                                  type="button"
                                  disabled={actionLoadingId === post.id}
                                  onClick={() => handleApprove(post)}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold uppercase tracking-wider shadow-xs flex items-center gap-1.5 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{actionLoadingId === post.id ? 'Approving...' : 'Approve & Publish'}</span>
                                </button>
                              )}

                              {post.approvalStatus !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPostForReject(post.id)}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => onDeletePost(post.id)}
                                className="p-1.5 text-gray-400 hover:text-red-700 rounded-md"
                                title="Permanently delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Rejection Reason Modal/Input */}
                          {selectedPostForReject === post.id && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2 animate-in fade-in duration-150">
                              <label className="block text-xs font-bold text-red-900">
                                Provide Rejection Reason for Author:
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Inappropriate language, unverified allegations, or insufficient location details..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full text-xs p-2 rounded border border-red-300 bg-white focus:outline-hidden"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPostForReject(null)}
                                  className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoadingId === post.id}
                                  onClick={() => handleReject(post.id)}
                                  className="px-3 py-1 bg-red-700 text-white text-xs font-bold rounded uppercase tracking-wider"
                                >
                                  Confirm Rejection
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------- */}
              {/* TAB: REPORTER IDENTITY CARD APPROVALS */}
              {/* ------------------------------------------- */}
              {adminTab === 'id_cards' && (
                <div className="space-y-4">
                  {idCardActionMsg && (
                    <div
                      className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                        idCardActionMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {idCardActionMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span>{idCardActionMsg.text}</span>
                    </div>
                  )}

                  {/* Filter Sub-Tabs */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-[#FAFAFA] p-1 rounded-lg border border-[#E0E0E0]">
                      <button
                        onClick={() => setIdCardFilter('pending')}
                        className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          idCardFilter === 'pending'
                            ? 'bg-[#004D40] text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Review ({idCardsList.filter((c) => c.status === 'pending').length})</span>
                      </button>

                      <button
                        onClick={() => setIdCardFilter('approved')}
                        className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          idCardFilter === 'approved'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approved ({idCardsList.filter((c) => c.status === 'approved').length})</span>
                      </button>

                      <button
                        onClick={() => setIdCardFilter('rejected')}
                        className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          idCardFilter === 'rejected'
                            ? 'bg-red-700 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejected ({idCardsList.filter((c) => c.status === 'rejected').length})</span>
                      </button>

                      <button
                        onClick={() => setIdCardFilter('all')}
                        className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          idCardFilter === 'all'
                            ? 'bg-gray-800 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <span>All ({idCardsList.length})</span>
                      </button>
                    </div>

                    <button
                      onClick={loadIdCards}
                      className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 rounded hover:bg-gray-100 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIdCards ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* ID Cards List */}
                  {isLoadingIdCards ? (
                    <div className="py-12 text-center text-xs text-gray-500 font-semibold flex flex-col items-center gap-2">
                      <div className="w-7 h-7 border-2 border-[#004D40]/30 border-t-[#004D40] rounded-full animate-spin" />
                      <span>Loading reporter identity card requests...</span>
                    </div>
                  ) : idCardsList.filter((c) => (idCardFilter === 'all' ? true : c.status === idCardFilter)).length === 0 ? (
                    <div className="py-12 bg-white rounded-xl border border-dashed border-[#E0E0E0] text-center space-y-2">
                      <BadgeCheck className="w-10 h-10 text-gray-300 mx-auto" />
                      <p className="text-xs font-bold text-gray-500">
                        {idCardFilter === 'pending'
                          ? 'No pending ID card applications for review.'
                          : `No ${idCardFilter} identity cards found.`}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        When reporters apply for their official Press ID Cards, requests will appear here for editorial approval.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {idCardsList
                        .filter((c) => (idCardFilter === 'all' ? true : c.status === idCardFilter))
                        .map((card) => (
                          <div
                            key={card.id}
                            className="bg-white p-4 rounded-xl border border-gray-200 hover:border-gray-300 shadow-xs flex flex-col justify-between space-y-3 transition-all"
                          >
                            <div className="flex items-start gap-3">
                              {/* Photo */}
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-300 shrink-0 flex items-center justify-center">
                                {card.photoUrl ? (
                                  <img
                                    src={card.photoUrl}
                                    alt={card.fullName}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <span className="font-bold text-[#004D40] text-lg">
                                    {card.fullName.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-sm font-bold text-gray-900 truncate">
                                    {card.fullName}
                                  </h4>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      card.status === 'approved'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : card.status === 'rejected'
                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}
                                  >
                                    {card.status}
                                  </span>
                                </div>

                                <p className="text-xs font-bold text-[#004D40] flex items-center gap-1">
                                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{card.designation}</span>
                                </p>

                                <div className="text-[11px] text-gray-600 space-y-0.5 pt-1 border-t border-gray-100">
                                  <p className="flex items-center gap-1 truncate">
                                    <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span>{card.mobileNumber}</span>
                                  </p>
                                  <p className="flex items-center gap-1 truncate">
                                    <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span className="uppercase">
                                      {card.idProofType}: {card.idProofNumber}
                                    </span>
                                  </p>
                                  <p className="flex items-start gap-1 text-gray-500 line-clamp-1">
                                    <MapPin className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                                    <span>{card.address}</span>
                                  </p>
                                  {card.cardNumber && (
                                    <p className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                                      Card ID: {card.cardNumber}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Rejection Note */}
                            {card.rejectionReason && (
                              <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                                <strong>Rejection Reason:</strong> {card.rejectionReason}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setSelectedCardForPreview(card)}
                                className="px-2.5 py-1 text-xs font-bold text-[#004D40] hover:bg-[#E0F2F1] rounded border border-[#B2DFDB] flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview Card</span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                {card.status !== 'approved' && (
                                  <button
                                    type="button"
                                    disabled={idCardActionLoadingId === card.id}
                                    onClick={() => handleApproveIdCard(card.id)}
                                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{idCardActionLoadingId === card.id ? 'Approving...' : 'Approve'}</span>
                                  </button>
                                )}

                                {card.status !== 'rejected' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCardForReject(card.id);
                                      setCardRejectReason('');
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 rounded text-xs font-bold border border-red-200 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  disabled={idCardActionLoadingId === card.id}
                                  onClick={() => handleDeleteIdCard(card.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                                  title="Delete / Revoke ID Card"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inline Rejection Input Form */}
                            {selectedCardForReject === card.id && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2 animate-in fade-in duration-150">
                                <label className="block text-xs font-bold text-red-900">
                                  State Rejection Reason:
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Unclear photograph, invalid ID proof number, or unverified address..."
                                  value={cardRejectReason}
                                  onChange={(e) => setCardRejectReason(e.target.value)}
                                  className="w-full text-xs p-2 rounded border border-red-300 bg-white focus:outline-hidden"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCardForReject(null)}
                                    className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idCardActionLoadingId === card.id}
                                    onClick={() => handleRejectIdCard(card.id)}
                                    className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded uppercase tracking-wider cursor-pointer"
                                  >
                                    Confirm Reject
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------- */}
              {/* TAB 2: USER ACCOUNT MANAGEMENT */}
              {/* ------------------------------------------- */}
              {adminTab === 'users' && (
                <div className="space-y-4">
                  {userActionMsg && (
                    <div
                      className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                        userActionMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {userActionMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{userActionMsg.text}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                        Authorized User Accounts
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Create and manage accounts for staff reporters, citizens, moderators, and admins.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddUserForm(!showAddUserForm)}
                      className="px-3 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#E0F2F1]" />
                      <span>{showAddUserForm ? 'Close Form' : '+ Add New User'}</span>
                    </button>
                  </div>

                  {/* Create New User Form */}
                  {showAddUserForm && (
                    <form
                      onSubmit={handleCreateUser}
                      className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0] space-y-3 animate-in fade-in duration-150"
                    >
                      <h5 className="text-xs font-bold text-[#004D40] uppercase tracking-wider">
                        Create New User Account
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh Kumar"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            className="w-full text-xs p-2 rounded-md border border-gray-300 bg-white focus:border-[#004D40] focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Username / Login ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ramesh_reporter"
                            value={newUserUsername}
                            onChange={(e) => setNewUserUsername(e.target.value)}
                            className="w-full text-xs p-2 rounded-md border border-gray-300 bg-white focus:border-[#004D40] focus:outline-hidden font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showNewUserPass ? 'text' : 'password'}
                              required
                              placeholder="••••••••"
                              value={newUserPassword}
                              onChange={(e) => setNewUserPassword(e.target.value)}
                              className="w-full text-xs pl-2.5 pr-8 py-2 rounded-md border border-gray-300 bg-white focus:border-[#004D40] focus:outline-hidden font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewUserPass(!showNewUserPass)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700"
                              title={showNewUserPass ? 'Hide password' : 'Show password'}
                            >
                              {showNewUserPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            User Role <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                            className="w-full text-xs p-2 rounded-md border border-gray-300 bg-white font-medium focus:border-[#004D40] focus:outline-hidden"
                          >
                            <option value="reporter">Reporter (पत्रकार - News & Articles)</option>
                            <option value="citizen">Citizen (नागरिक - Grievances & News)</option>
                            <option value="moderator">Moderator (मध्यस्थ - Editorial Review)</option>
                            <option value="admin">Administrator (व्यवस्थापक - Full Access)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. ramesh@story-today.in"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="w-full text-xs p-2 rounded-md border border-gray-300 bg-white focus:border-[#004D40] focus:outline-hidden"
                        />
                      </div>

                      {/* Optional Profile Photo for new user */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Profile Photo (Optional)
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs border border-gray-300 shrink-0">
                            {newUserAvatar ? (
                              <img src={newUserAvatar} alt="New user" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span>{newUserName ? newUserName.charAt(0).toUpperCase() : '?'}</span>
                            )}
                          </div>
                          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-md text-xs font-bold text-gray-700 cursor-pointer transition-colors shadow-2xs">
                            <Upload className="w-3.5 h-3.5 text-[#004D40]" />
                            <span>Upload Avatar</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => setNewUserAvatar(ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }}
                              className="hidden"
                            />
                          </label>
                          {newUserAvatar && (
                            <button
                              type="button"
                              onClick={() => setNewUserAvatar(null)}
                              className="text-xs text-red-600 hover:underline font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddUserForm(false)}
                          className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-xs"
                        >
                          Save User Account
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Users Table */}
                  <div className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFAFA] border-b border-[#E0E0E0] text-[10px] font-bold uppercase text-gray-500">
                          <tr>
                            <th className="p-3">User</th>
                            <th className="p-3">Username</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Created</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E0E0E0]">
                          {usersList.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#004D40] text-white flex items-center justify-center text-xs font-bold shrink-0 border border-gray-300">
                                    {u.avatar ? (
                                      <img
                                        src={u.avatar}
                                        alt={u.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <span>{u.name.charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900">{u.name}</div>
                                    {u.email && <div className="text-[11px] text-gray-500">{u.email}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-mono text-gray-700">
                                {u.username}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    u.role === 'admin'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : u.role === 'reporter'
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : u.role === 'moderator'
                                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-3 text-gray-500 text-[11px]">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-right">
                                {u.username !== 'admin' && u.id !== 'user_admin' ? (
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-gray-400 font-mono">Master</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------- */}
              {/* TAB 3: ADMIN PASSWORD MANAGEMENT */}
              {/* ------------------------------------------- */}
              {adminTab === 'security' && (
                <div className="max-w-lg mx-auto space-y-4 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-[#004D40]" />
                        {lang === 'hi' ? 'एडमिन लॉगिन पासवर्ड बदलें' : 'Admin Login Password Management'}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {lang === 'hi'
                          ? 'सुरक्षित रूप से अपना मुख्य एडमिन पासवर्ड अपडेट करें।'
                          : 'Update and manage your master administrator password securely.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-mono font-bold text-amber-900">
                      <Shield className="w-3.5 h-3.5 text-amber-700" />
                      <span>User: admin</span>
                    </div>
                  </div>

                  {passwordChangeMsg && (
                    <div
                      className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
                        passwordChangeMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {passwordChangeMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      )}
                      <span className="font-medium">{passwordChangeMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangeAdminPassword} className="space-y-4 bg-[#FAFAFA] p-4 sm:p-5 rounded-2xl border border-[#E0E0E0] shadow-xs">
                    {/* Current Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-gray-700">
                          {lang === 'hi' ? 'वर्तमान एडमिन पासवर्ड' : 'Current Admin Password'}{' '}
                          <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          required
                          placeholder={lang === 'hi' ? 'वर्तमान पासवर्ड दर्ज करें' : 'Enter current password'}
                          value={currentAdminPassword}
                          onChange={(e) => setCurrentAdminPassword(e.target.value)}
                          className="w-full text-xs sm:text-sm pl-3 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white font-mono focus:border-[#004D40] focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                          title={showCurrentPass ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-gray-700">
                          {lang === 'hi' ? 'नया पासवर्ड' : 'New Admin Password'}{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateRandomPassword}
                          className="text-[10px] font-bold text-[#004D40] hover:text-[#00382E] flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{lang === 'hi' ? 'मजबूत पासवर्ड बनाएं' : 'Generate Strong'}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          required
                          placeholder={lang === 'hi' ? 'नया पासवर्ड (न्यूनतम 4 अक्षर)' : 'New password (min 4 characters)'}
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          className="w-full text-xs sm:text-sm pl-3 pr-16 py-2.5 rounded-lg border border-gray-300 bg-white font-mono focus:border-[#004D40] focus:outline-hidden"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {newAdminPassword && (
                            <button
                              type="button"
                              onClick={handleCopyNewPassword}
                              className="p-1 text-gray-400 hover:text-gray-700"
                              title="Copy password"
                            >
                              {copiedPass ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="p-1 text-gray-400 hover:text-gray-700"
                            title={showNewPass ? 'Hide password' : 'Show password'}
                          >
                            {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Strength Indicator */}
                      {newAdminPassword && (
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-500 font-medium">Strength:</span>
                            <span
                              className={`font-bold ${
                                getPasswordStrength(newAdminPassword).score <= 1
                                  ? 'text-red-600'
                                  : getPasswordStrength(newAdminPassword).score === 2
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {getPasswordStrength(newAdminPassword).label}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex gap-0.5">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`h-full flex-1 transition-all ${
                                  step <= getPasswordStrength(newAdminPassword).score
                                    ? getPasswordStrength(newAdminPassword).color
                                    : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-gray-700">
                          {lang === 'hi' ? 'नए पासवर्ड की पुष्टि करें' : 'Confirm New Password'}{' '}
                          <span className="text-red-500">*</span>
                        </label>
                        {confirmAdminPassword && (
                          <span
                            className={`text-[10px] font-bold flex items-center gap-1 ${
                              newAdminPassword === confirmAdminPassword
                                ? 'text-emerald-600'
                                : 'text-red-500'
                            }`}
                          >
                            {newAdminPassword === confirmAdminPassword ? (
                              <>
                                <Check className="w-3 h-3" /> Passwords match
                              </>
                            ) : (
                              'Does not match'
                            )}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          required
                          placeholder={lang === 'hi' ? 'नया पासवर्ड फिर से दर्ज करें' : 'Re-enter new password'}
                          value={confirmAdminPassword}
                          onChange={(e) => setConfirmAdminPassword(e.target.value)}
                          className={`w-full text-xs sm:text-sm pl-3 pr-10 py-2.5 rounded-lg border bg-white font-mono focus:outline-hidden ${
                            confirmAdminPassword && newAdminPassword !== confirmAdminPassword
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-300 focus:border-[#004D40]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                          title={showConfirmPass ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Security Notice */}
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-[11px] text-gray-600 flex items-start gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#004D40] shrink-0 mt-0.5" />
                      <span>
                        {lang === 'hi'
                          ? 'पासवर्ड बदलने के बाद, यह तुरंत आपके एडमिन डेस्क और लॉगिन क्रेडेंशियल्स के लिए लागू हो जाएगा।'
                          : 'Updating your password takes effect immediately for both desktop and mobile admin sessions.'}
                      </span>
                    </div>

                    <div className="pt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentAdminPassword('');
                          setNewAdminPassword('');
                          setConfirmAdminPassword('');
                          setPasswordChangeMsg(null);
                        }}
                        className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        {lang === 'hi' ? 'रीसेट' : 'Clear'}
                      </button>
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="flex-1 py-2.5 bg-[#004D40] hover:bg-[#00382E] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#E0F2F1]" />
                        <span>
                          {isChangingPassword
                            ? lang === 'hi'
                              ? 'पासवर्ड अपडेट हो रहा है...'
                              : 'Updating Password...'
                            : lang === 'hi'
                            ? 'नया पासवर्ड सहेजें'
                            : 'Save New Admin Password'}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ------------------------------------------- */}
              {/* TAB 4: BRANDING & LOGO */}
              {/* ------------------------------------------- */}
              {adminTab === 'branding' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-xl border border-[#E0E0E0] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#004D40]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                          App Logo & Icon Branding
                        </h4>
                      </div>
                      {currentLogo && (
                        <button
                          type="button"
                          onClick={handleResetLogo}
                          className="text-[11px] font-semibold text-gray-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset to Default
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <div className="p-3 bg-[#FAFAFA] rounded-2xl border border-[#E0E0E0] shrink-0">
                        <StoryTodayLogo size="lg" variant="icon-only" />
                      </div>
                      <div className="flex-1 text-xs space-y-2">
                        <p className="text-gray-600 text-xs">
                          Upload your official custom app logo (PNG, JPG, SVG). It updates the header icon, splash screen, and share badges instantly.
                        </p>
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer shadow-xs transition-colors">
                          <Upload className="w-3.5 h-3.5 text-[#E0F2F1]" />
                          <span>Choose Custom Logo File</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/svg+xml, image/webp"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                        </label>
                      </div>
                    </div>

                    {logoUploadedMsg && (
                      <p className="text-xs text-emerald-700 font-bold bg-[#E0F2F1] p-2 rounded-lg text-center">
                        {logoUploadedMsg}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------- */}
              {/* TAB 5: OVERVIEW & BACKUP */}
              {/* ------------------------------------------- */}
              {adminTab === 'overview' && (
                <div className="space-y-4">
                  {/* Stats Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="p-3 bg-[#FAFAFA] rounded-xl border border-[#E0E0E0]">
                      <span className="block text-xl font-serif font-bold text-[#1A1A1A]">{stats.totalPosts}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Live Stories</span>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="block text-xl font-serif font-bold text-amber-900">{pendingCount}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pending Review</span>
                    </div>
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="block text-xl font-serif font-bold text-red-900">{stats.totalGrievances}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Grievances</span>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="block text-xl font-serif font-bold text-emerald-900">{stats.resolvedGrievances}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Resolved</span>
                    </div>
                  </div>

                  {/* System & Export Options */}
                  <div className="p-4 bg-white rounded-xl border border-[#E0E0E0] space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                      Database & Backup
                    </h4>
                    <p className="text-xs text-gray-600">
                      Export a full JSON backup of all published and pending stories, grievances, and comments.
                    </p>
                    <div className="pt-1">
                      <button
                        id="btn-export-backup"
                        onClick={handleExportData}
                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#E0E0E0] transition-colors"
                      >
                        <Download className="w-4 h-4 text-[#004D40]" />
                        <span>Export Full Database Backup (JSON)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------- */}
              {/* TAB 7: BLOGGER (story-today.in) IMPORTER */}
              {/* ------------------------------------------- */}
              {adminTab === 'blogger_import' && (
                <BloggerImportSection
                  lang={lang}
                  onRefreshData={onRefreshData}
                  existingPosts={posts}
                />
              )}

              {/* Footer Controls */}
              <div className="pt-4 border-t border-[#E0E0E0] flex items-center justify-between gap-3">
                <button
                  id="btn-admin-logout"
                  onClick={onAdminLogout}
                  className="text-xs font-bold text-red-700 hover:text-red-800 hover:underline flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock & Sign Out Admin</span>
                </button>

                <button
                  id="btn-close-admin-active"
                  onClick={onClose}
                  className="px-5 py-2 bg-[#004D40] hover:bg-[#00382E] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin ID Card Preview Modal */}
      {selectedCardForPreview && (
        <ReporterIdCardModal
          lang={lang}
          currentUser={{
            id: selectedCardForPreview.userId,
            username: selectedCardForPreview.userId,
            name: selectedCardForPreview.fullName,
            role: 'reporter',
            createdAt: selectedCardForPreview.createdAt,
            avatar: selectedCardForPreview.photoUrl,
            idCard: selectedCardForPreview,
          }}
          previewCard={selectedCardForPreview}
          isAdminPreview={true}
          onClose={() => setSelectedCardForPreview(null)}
        />
      )}
    </div>
  );
};
