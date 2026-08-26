import { PostItem, AppStats, GrievanceStatus, UserAccount, ApprovalStatus } from '../types';

const API_BASE = '/api';

export async function fetchPosts(filters?: {
  type?: string;
  category?: string;
  search?: string;
  status?: string;
  city?: string;
  approvalStatus?: string;
  includePending?: boolean;
}): Promise<PostItem[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.city && filters.city !== 'all') params.append('city', filters.city);
    if (filters?.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
    if (filters?.includePending) params.append('includePending', 'true');

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/posts${query}`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    const data = await res.json();
    return data.posts || [];
  } catch (err) {
    console.error('API fetchPosts error:', err);
    const local = localStorage.getItem('story_today_posts_backup');
    return local ? JSON.parse(local) : [];
  }
}

export async function fetchPostById(id: string): Promise<PostItem | null> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}`);
    if (!res.ok) throw new Error('Post not found');
    const data = await res.json();
    return data.post || null;
  } catch (err) {
    console.error('API fetchPostById error:', err);
    return null;
  }
}

export async function createPost(postData: Partial<PostItem> & { autoApprove?: boolean }): Promise<{ post: PostItem; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to create post');
    }
    const data = await res.json();
    return { post: data.post, message: data.message };
  } catch (err) {
    console.error('API createPost error:', err);
    throw err;
  }
}

export async function updatePostApproval(
  id: string,
  approvalStatus: ApprovalStatus,
  reason?: string,
  adminName?: string
): Promise<{ success: boolean; post: PostItem; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus, reason, adminName }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to update approval');
    }
    return await res.json();
  } catch (err) {
    console.error('API updatePostApproval error:', err);
    throw err;
  }
}

export async function upvotePost(id: string): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}/upvote`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to upvote');
    const data = await res.json();
    return data.upvotes;
  } catch (err) {
    console.error('API upvotePost error:', err);
    return null;
  }
}

export async function addPostComment(
  id: string,
  author: string,
  text: string,
  authorAvatar?: string,
  isOfficial?: boolean
): Promise<any[] | null> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text, authorAvatar, isOfficial }),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    const data = await res.json();
    return data.comments;
  } catch (err) {
    console.error('API addPostComment error:', err);
    return null;
  }
}

export async function updateGrievanceStatus(
  id: string,
  status: GrievanceStatus,
  note: string,
  officerName?: string,
  department?: string
): Promise<PostItem | null> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note, officerName, department }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    const data = await res.json();
    return data.post;
  } catch (err) {
    console.error('API updateGrievanceStatus error:', err);
    return null;
  }
}

export async function updatePost(id: string, updates: Partial<PostItem>): Promise<PostItem | null> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update post');
    const data = await res.json();
    return data.post;
  } catch (err) {
    console.error('API updatePost error:', err);
    return null;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/posts/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('API deletePost error:', err);
    return false;
  }
}

export async function fetchStats(): Promise<AppStats> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch (err) {
    console.error('API fetchStats error:', err);
    return {
      totalPosts: 0,
      totalNews: 0,
      totalGrievances: 0,
      resolvedGrievances: 0,
      inProgressGrievances: 0,
      pendingApproval: 0,
    };
  }
}

// ==========================================
// USER & ADMIN AUTH API CLIENTS
// ==========================================

export async function loginUser(username: string, password: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API loginUser error:', err);
    return { success: false, error: 'Network or server error during login' };
  }
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/change-admin-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API changeAdminPassword error:', err);
    return { success: false, error: 'Network error while changing password' };
  }
}

export async function fetchUsers(): Promise<UserAccount[]> {
  try {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    console.error('API fetchUsers error:', err);
    return [];
  }
}

export async function createUser(userData: {
  name: string;
  username: string;
  password: string;
  role: string;
  email?: string;
  avatar?: string;
  phone?: string;
  bio?: string;
}): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API createUser error:', err);
    return { success: false, error: 'Network error while creating user' };
  }
}

export async function updateUserAvatar(
  userId: string,
  avatar: string | null
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API updateUserAvatar error:', err);
    return { success: false, error: 'Network error while updating avatar' };
  }
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserAccount>
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result;
  } catch (err) {
    console.error('API updateUserProfile error:', err);
    return { success: false, error: 'Network error while updating profile' };
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API deleteUser error:', err);
    return { success: false, error: 'Network error while deleting user' };
  }
}

export async function fetchSettings(): Promise<{ customLogo?: string | null }> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    const data = await res.json();
    return data.settings || {};
  } catch (err) {
    console.error('API fetchSettings error:', err);
    return {};
  }
}

export async function updateBrandingLogo(logo: string | null): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/settings/logo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo }),
    });
    return res.ok;
  } catch (err) {
    console.error('API updateBrandingLogo error:', err);
    return false;
  }
}

