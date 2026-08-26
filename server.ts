import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  Firestore,
} from 'firebase/firestore';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'posts.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load Firebase Config
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (err) {
  console.error('Error reading firebase-applet-config.json:', err);
}

// Initialize Firebase App & Firestore
let db: Firestore | null = null;
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const dbId =
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== ''
      ? firebaseConfig.firestoreDatabaseId
      : undefined;
  db = getFirestore(app, dbId);
  console.log(`[Firebase] Firestore connected with database ID: ${dbId || '(default)'}`);
} catch (err) {
  console.error('[Firebase] Error initializing Firestore:', err);
}

// In-Memory & Local Cache
let cachedUsers: any[] = [];
let cachedPosts: any[] = [];
let cachedSettings: { adminPassword?: string; customLogo?: string | null } = {
  adminPassword: 'admin',
};

// Initial default clean admin account (if database is completely fresh)
const INITIAL_ADMIN_USER = {
  id: 'user_admin',
  name: 'Chief Editor & Admin',
  username: 'admin',
  password: 'admin',
  role: 'admin',
  createdAt: new Date().toISOString(),
  status: 'active',
};

// =========================================================================
// FIRESTORE PERSISTENCE HELPERS
// =========================================================================

async function initFirestoreData() {
  console.log('[Persistence] Loading data from Firestore cloud database...');

  if (!db) {
    console.warn('[Persistence] Firestore not initialized, loading from local backup.');
    loadLocalFallback();
    return;
  }

  try {
    // 1. Load Admin Settings (password, branding)
    const settingsDoc = await getDoc(doc(db, 'settings', 'admin_settings'));
    if (settingsDoc.exists()) {
      cachedSettings = settingsDoc.data() as any;
      console.log('[Persistence] Admin settings retrieved from Firestore.');
    } else {
      cachedSettings = { adminPassword: 'admin' };
      await setDoc(doc(db, 'settings', 'admin_settings'), cachedSettings);
    }

    // 2. Load Users
    const usersSnap = await getDocs(collection(db, 'users'));
    if (!usersSnap.empty) {
      cachedUsers = usersSnap.docs.map((d) => d.data());
      console.log(`[Persistence] Loaded ${cachedUsers.length} user accounts from Firestore.`);
    } else {
      console.log('[Persistence] Users collection empty. Provisioning initial admin user.');
      cachedUsers = [INITIAL_ADMIN_USER];
      await setDoc(doc(db, 'users', INITIAL_ADMIN_USER.id), INITIAL_ADMIN_USER);
    }

    // Ensure user_admin has synchronized password
    const adminIdx = cachedUsers.findIndex((u) => u.role === 'admin' || u.username === 'admin');
    if (adminIdx !== -1 && cachedSettings.adminPassword) {
      cachedUsers[adminIdx].password = cachedSettings.adminPassword;
    }

    // 3. Load Posts
    const postsSnap = await getDocs(collection(db, 'posts'));
    if (!postsSnap.empty) {
      cachedPosts = postsSnap.docs.map((d) => d.data());
      console.log(`[Persistence] Loaded ${cachedPosts.length} posts from Firestore.`);
    } else {
      cachedPosts = [];
      console.log('[Persistence] Posts collection in Firestore is clean and ready.');
    }

    // Save local snapshot
    syncToLocalDisk();
  } catch (err) {
    console.error('[Persistence] Error syncing with Firestore on boot:', err);
    loadLocalFallback();
  }
}

function loadLocalFallback() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      cachedUsers = JSON.parse(raw);
    } else {
      cachedUsers = [INITIAL_ADMIN_USER];
    }
  } catch {
    cachedUsers = [INITIAL_ADMIN_USER];
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      cachedPosts = JSON.parse(raw);
    } else {
      cachedPosts = [];
    }
  } catch {
    cachedPosts = [];
  }
}

function syncToLocalDisk() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(cachedUsers, null, 2), 'utf-8');
    fs.writeFileSync(DATA_FILE, JSON.stringify(cachedPosts, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Persistence] Error writing local cache backup:', err);
  }
}

// User Persistence Operations
async function persistUser(user: any) {
  const idx = cachedUsers.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    cachedUsers[idx] = user;
  } else {
    cachedUsers.push(user);
  }
  syncToLocalDisk();

  if (db) {
    try {
      await setDoc(doc(db, 'users', user.id), user);
      console.log(`[Firestore] User saved: ${user.username} (${user.id})`);
    } catch (err) {
      console.error(`[Firestore] Failed to persist user ${user.id}:`, err);
    }
  }
}

async function removeUser(userId: string) {
  cachedUsers = cachedUsers.filter((u) => u.id !== userId);
  syncToLocalDisk();

  if (db) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      console.log(`[Firestore] User deleted: ${userId}`);
    } catch (err) {
      console.error(`[Firestore] Failed to delete user ${userId}:`, err);
    }
  }
}

// Post Persistence Operations
async function persistPost(post: any) {
  const idx = cachedPosts.findIndex((p) => p.id === post.id);
  if (idx !== -1) {
    cachedPosts[idx] = post;
  } else {
    cachedPosts.unshift(post);
  }
  syncToLocalDisk();

  if (db) {
    try {
      await setDoc(doc(db, 'posts', post.id), post);
      console.log(`[Firestore] Post saved: ${post.title?.slice(0, 30)} (${post.id})`);
    } catch (err) {
      console.error(`[Firestore] Failed to persist post ${post.id}:`, err);
    }
  }
}

async function removePost(postId: string) {
  cachedPosts = cachedPosts.filter((p) => p.id !== postId);
  syncToLocalDisk();

  if (db) {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      console.log(`[Firestore] Post deleted: ${postId}`);
    } catch (err) {
      console.error(`[Firestore] Failed to delete post ${postId}:`, err);
    }
  }
}

// Admin Settings Persistence
async function persistAdminSettings(settings: any) {
  cachedSettings = { ...cachedSettings, ...settings, updatedAt: new Date().toISOString() };
  if (db) {
    try {
      await setDoc(doc(db, 'settings', 'admin_settings'), cachedSettings);
      console.log('[Firestore] Admin settings updated.');
    } catch (err) {
      console.error('[Firestore] Failed to persist admin settings:', err);
    }
  }
}

// =========================================================================
// EXPRESS SERVER SETUP & ROUTING
// =========================================================================

async function startServer() {
  // Initialize Firestore connection and data cache
  await initFirestoreData();

  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Health & Persistence Status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: db ? 'firebase_firestore_connected' : 'local_fallback',
      postsCount: cachedPosts.length,
      usersCount: cachedUsers.length,
      time: new Date().toISOString(),
    });
  });

  // ==========================================
  // AUTH & USER MANAGEMENT APIs
  // ==========================================

  // User Login (Authenticates against persistent users in Firestore)
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const cleanUser = username.trim().toLowerCase();

    // Verify user in cached users (synced with Firestore)
    const user = cachedUsers.find(
      (u) =>
        (u.username.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser) &&
        u.password === password
    );

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'This account has been suspended by Admin' });
    }

    // Return sanitized user object
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Change Admin Password (Permanently saves to Firestore database)
  app.post('/api/auth/change-admin-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }

    if (newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long' });
    }

    let adminIndex = cachedUsers.findIndex((u) => u.role === 'admin' || u.username === 'admin');

    if (adminIndex === -1) {
      // Create admin user with new password
      const newAdminUser = {
        id: 'user_admin',
        name: 'Chief Editor & Admin',
        username: 'admin',
        password: newPassword.trim(),
        role: 'admin',
        createdAt: new Date().toISOString(),
        status: 'active',
      };
      await persistUser(newAdminUser);
      await persistAdminSettings({ adminPassword: newPassword.trim() });
      return res.json({ success: true, message: 'Admin password updated permanently.' });
    }

    const currentAdminUser = cachedUsers[adminIndex];
    if (currentAdminUser.password !== currentPassword && cachedSettings.adminPassword !== currentPassword) {
      return res.status(401).json({ success: false, error: 'Current admin password does not match' });
    }

    // Update password permanently in Firestore
    currentAdminUser.password = newPassword.trim();
    currentAdminUser.updatedAt = new Date().toISOString();
    await persistUser(currentAdminUser);
    await persistAdminSettings({ adminPassword: newPassword.trim() });

    console.log('[Auth] Admin password changed permanently in Firestore.');
    res.json({ success: true, message: 'Admin password updated and saved permanently to cloud database.' });
  });

  // List all users (Admin)
  app.get('/api/users', (req, res) => {
    const safeUsers = cachedUsers.map(({ password, ...safe }) => safe);
    res.json({ success: true, users: safeUsers });
  });

  // Get specific user profile
  app.get('/api/users/:id', (req, res) => {
    const user = cachedUsers.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // Update user profile (Name, email, avatar, phone, bio)
  app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const userIndex = cachedUsers.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { name, email, avatar, phone, bio } = req.body;
    const currentUser = cachedUsers[userIndex];

    if (name && name.trim()) {
      currentUser.name = name.trim();
    }
    if (email !== undefined) {
      currentUser.email = email ? email.trim() : undefined;
    }
    if (avatar !== undefined) {
      currentUser.avatar = avatar ? avatar.trim() : undefined;
    }
    if (phone !== undefined) {
      currentUser.phone = phone ? phone.trim() : undefined;
    }
    if (bio !== undefined) {
      currentUser.bio = bio ? bio.trim() : undefined;
    }

    currentUser.updatedAt = new Date().toISOString();
    await persistUser(currentUser);

    // Also retroactively update authorAvatar on posts created by this user
    if (avatar !== undefined) {
      cachedPosts.forEach((post) => {
        if (post.authorId === id) {
          post.authorAvatar = avatar ? avatar.trim() : undefined;
        }
      });
      syncToLocalDisk();
    }

    const { password: _, ...safeUser } = currentUser;
    res.json({ success: true, user: safeUser, message: 'Profile updated successfully.' });
  });

  // Update user profile photo specifically
  app.post('/api/users/:id/avatar', async (req, res) => {
    const { id } = req.params;
    const { avatar } = req.body;
    const userIndex = cachedUsers.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = cachedUsers[userIndex];
    user.avatar = avatar && avatar.trim() !== '' ? avatar.trim() : undefined;
    user.updatedAt = new Date().toISOString();
    await persistUser(user);

    // Update avatar on existing posts authored by this user
    cachedPosts.forEach((post) => {
      if (post.authorId === id) {
        post.authorAvatar = user.avatar;
      }
    });
    syncToLocalDisk();

    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      user: safeUser,
      message: avatar ? 'Profile photo uploaded successfully.' : 'Profile photo removed.',
    });
  });

  // Create new user account (Admin or Registration)
  app.post('/api/users', async (req, res) => {
    const { name, username, password, role, email, avatar, phone, bio } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, username, password, and role are required',
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (cachedUsers.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ success: false, error: 'Username already exists. Please choose another.' });
    }

    const newUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      username: cleanUsername,
      password: password.trim(),
      role: role || 'citizen',
      avatar: avatar?.trim() || undefined,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      bio: bio?.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    await persistUser(newUser);

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser });
  });

  // Delete user account (Admin)
  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const userToDelete = cachedUsers.find((u) => u.id === id);

    if (!userToDelete) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (userToDelete.username === 'admin' || userToDelete.id === 'user_admin' || userToDelete.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Primary Administrator account cannot be deleted' });
    }

    await removeUser(id);
    res.json({ success: true, message: 'User account removed permanently from database.' });
  });

  // ==========================================
  // SYSTEM & BRANDING SETTINGS APIs
  // ==========================================

  app.get('/api/settings', (req, res) => {
    res.json({
      success: true,
      settings: {
        customLogo: cachedSettings.customLogo || null,
      },
    });
  });

  app.post('/api/settings/logo', async (req, res) => {
    const { logo } = req.body;
    await persistAdminSettings({ customLogo: logo || null });
    res.json({ success: true, message: 'Branding logo updated permanently.' });
  });

  // ==========================================
  // POSTS & CONTENT APPROVAL APIs
  // ==========================================

  // Get all posts with filtering and approval status
  app.get('/api/posts', (req, res) => {
    const { type, category, search, status, city, approvalStatus, includePending } = req.query;
    let posts = [...cachedPosts];

    // Default: Public feeds only show approved posts
    if (includePending !== 'true') {
      if (approvalStatus) {
        if (approvalStatus !== 'all') {
          posts = posts.filter((p) => (p.approvalStatus || 'approved') === approvalStatus);
        }
      } else {
        posts = posts.filter((p) => (p.approvalStatus || 'approved') === 'approved');
      }
    } else if (approvalStatus && approvalStatus !== 'all') {
      posts = posts.filter((p) => (p.approvalStatus || 'approved') === approvalStatus);
    }

    if (type && type !== 'all') {
      posts = posts.filter((p) => p.type === type);
    }
    if (category && category !== 'all') {
      posts = posts.filter((p) => p.category === category);
    }
    if (status && status !== 'all') {
      posts = posts.filter((p) => p.status === status);
    }
    if (city && city !== 'all') {
      posts = posts.filter((p) => p.location?.city?.toLowerCase() === String(city).toLowerCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.titleHi?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q) ||
          p.location?.city?.toLowerCase().includes(q) ||
          p.location?.area?.toLowerCase().includes(q) ||
          p.location?.ward?.toLowerCase().includes(q) ||
          p.referenceNumber?.toLowerCase().includes(q) ||
          p.authorName?.toLowerCase().includes(q)
      );
    }

    // Sort: pinned first, then newest
    posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({ success: true, count: posts.length, posts });
  });

  // Get Stats
  app.get('/api/stats', (req, res) => {
    const posts = cachedPosts;
    const approvedPosts = posts.filter((p) => (p.approvalStatus || 'approved') === 'approved');
    const totalPosts = approvedPosts.length;
    const totalNews = approvedPosts.filter((p) => p.type === 'news').length;
    const totalGrievances = approvedPosts.filter((p) => p.type === 'grievance').length;
    const resolvedGrievances = approvedPosts.filter(
      (p) => p.type === 'grievance' && p.status === 'resolved'
    ).length;
    const inProgressGrievances = approvedPosts.filter(
      (p) => p.type === 'grievance' && p.status === 'in_progress'
    ).length;
    const pendingApproval = posts.filter((p) => p.approvalStatus === 'pending').length;

    res.json({
      totalPosts,
      totalNews,
      totalGrievances,
      resolvedGrievances,
      inProgressGrievances,
      pendingApproval,
    });
  });

  // Get single post by ID
  app.get('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    const postIndex = cachedPosts.findIndex((p) => p.id === id || String(p.id) === id);

    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Increment view count and persist
    cachedPosts[postIndex].views = (cachedPosts[postIndex].views || 0) + 1;
    await persistPost(cachedPosts[postIndex]);

    res.json({ success: true, post: cachedPosts[postIndex] });
  });

  // Create post (Permanently saved to Firestore, defaults to Pending Approval unless admin auto-approved)
  app.post('/api/posts', async (req, res) => {
    const body = req.body;
    if (!body.title || !body.content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const isGrievance = body.type === 'grievance';
    const referenceNumber = isGrievance
      ? `ST-GR-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`
      : undefined;

    const approvalStatus = body.autoApprove ? 'approved' : 'pending';

    // Find author avatar from body or from user account if authorId provided
    let authorAvatar = body.authorAvatar || undefined;
    if (!authorAvatar && body.authorId) {
      const matchedUser = cachedUsers.find((u) => u.id === body.authorId);
      if (matchedUser?.avatar) {
        authorAvatar = matchedUser.avatar;
      }
    }

    const newPost = {
      id,
      type: body.type || 'news',
      title: body.title.trim(),
      titleHi: body.titleHi?.trim() || undefined,
      content: body.content.trim(),
      contentHi: body.contentHi?.trim() || undefined,
      summary: body.summary?.trim() || undefined,
      category: body.category || (isGrievance ? 'civic' : 'general'),
      location: body.location || { city: 'Local Area' },
      authorName: body.authorName?.trim() || (isGrievance ? 'Concerned Citizen' : 'Staff Reporter'),
      authorAvatar: authorAvatar?.trim() || undefined,
      authorPhone: body.authorPhone?.trim() || undefined,
      authorRole: body.authorRole?.trim() || (isGrievance ? 'Citizen' : 'Reporter'),
      authorId: body.authorId || undefined,
      imageUrl: body.imageUrl || undefined,
      createdAt: now,
      updatedAt: now,
      views: 1,
      upvotes: 0,
      isBreaking: Boolean(body.isBreaking),
      isPinned: Boolean(body.isPinned),
      approvalStatus,
      approvedBy: body.autoApprove ? 'Admin (Direct)' : undefined,
      approvedAt: body.autoApprove ? now : undefined,
      status: isGrievance ? 'submitted' : undefined,
      priority: isGrievance ? body.priority || 'medium' : undefined,
      referenceNumber,
      statusHistory: isGrievance
        ? [
            {
              status: 'submitted',
              note: 'Grievance submitted and registered on Story Today portal.',
              timestamp: now,
              updatedBy: body.authorName || 'Citizen',
            },
          ]
        : undefined,
      comments: [],
    };

    await persistPost(newPost);

    res.status(201).json({
      success: true,
      post: newPost,
      message:
        approvalStatus === 'pending'
          ? 'Post submitted and permanently saved. Awaiting Editorial Approval by Admin before appearing in public feed.'
          : 'Post published and permanently saved to cloud database.',
    });
  });

  // Admin Approval / Rejection Endpoint
  app.post('/api/posts/:id/approval', async (req, res) => {
    const { id } = req.params;
    const { approvalStatus, reason, adminName } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid approval status' });
    }

    const postIndex = cachedPosts.findIndex((p) => p.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const now = new Date().toISOString();
    cachedPosts[postIndex].approvalStatus = approvalStatus;
    cachedPosts[postIndex].updatedAt = now;

    if (approvalStatus === 'approved') {
      cachedPosts[postIndex].approvedBy = adminName || 'Chief Editor & Admin';
      cachedPosts[postIndex].approvedAt = now;
      cachedPosts[postIndex].rejectionReason = undefined;
    } else if (approvalStatus === 'rejected') {
      cachedPosts[postIndex].rejectionReason =
        reason || 'Content does not meet publication standards or community guidelines.';
      cachedPosts[postIndex].approvedBy = undefined;
      cachedPosts[postIndex].approvedAt = undefined;
    }

    await persistPost(cachedPosts[postIndex]);

    res.json({
      success: true,
      post: cachedPosts[postIndex],
      message: `Post ${approvalStatus === 'approved' ? 'approved & published live' : 'rejected'} permanently in database.`,
    });
  });

  // Upvote / Endorse
  app.post('/api/posts/:id/upvote', async (req, res) => {
    const { id } = req.params;
    const postIndex = cachedPosts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    cachedPosts[postIndex].upvotes = (cachedPosts[postIndex].upvotes || 0) + 1;
    await persistPost(cachedPosts[postIndex]);

    res.json({ success: true, upvotes: cachedPosts[postIndex].upvotes });
  });

  // Add Comment
  app.post('/api/posts/:id/comment', async (req, res) => {
    const { id } = req.params;
    const { author, text, isOfficial, authorAvatar } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }

    const postIndex = cachedPosts.findIndex((p) => p.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const comment = {
      id: Date.now().toString(36),
      author: author?.trim() || 'Citizen',
      authorAvatar: authorAvatar?.trim() || undefined,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isOfficial: Boolean(isOfficial),
    };

    if (!cachedPosts[postIndex].comments) {
      cachedPosts[postIndex].comments = [];
    }
    cachedPosts[postIndex].comments.push(comment);
    await persistPost(cachedPosts[postIndex]);

    res.json({ success: true, comments: cachedPosts[postIndex].comments });
  });

  // Update Grievance Status (Admin / Authority Action)
  app.post('/api/posts/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, note, officerName, department } = req.body;

    const postIndex = cachedPosts.findIndex((p) => p.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const now = new Date().toISOString();
    cachedPosts[postIndex].status = status;
    cachedPosts[postIndex].updatedAt = now;

    if (!cachedPosts[postIndex].statusHistory) {
      cachedPosts[postIndex].statusHistory = [];
    }

    cachedPosts[postIndex].statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      timestamp: now,
      updatedBy: officerName || 'Admin / Municipal Authority',
    });

    if (department || note) {
      cachedPosts[postIndex].officialResponse = {
        department: department || 'Municipal / Civic Administration',
        message: note || 'Issue is currently being resolved.',
        timestamp: now,
        officerName: officerName || 'Designated Authority',
      };
    }

    await persistPost(cachedPosts[postIndex]);

    res.json({ success: true, post: cachedPosts[postIndex] });
  });

  // Update Post (Edit / Pin / Priority)
  app.put('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    const postIndex = cachedPosts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const current = cachedPosts[postIndex];
    cachedPosts[postIndex] = {
      ...current,
      ...req.body,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };

    await persistPost(cachedPosts[postIndex]);

    res.json({ success: true, post: cachedPosts[postIndex] });
  });

  // Delete Post (Permanent from Firestore)
  app.delete('/api/posts/:id', async (req, res) => {
    const { id } = req.params;
    const postIndex = cachedPosts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    await removePost(id);
    res.json({ success: true, message: 'Post deleted permanently from cloud database.' });
  });

  // Vite middleware for development vs static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Story Today server running on http://0.0.0.0:${PORT} with Firestore Cloud Database`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
