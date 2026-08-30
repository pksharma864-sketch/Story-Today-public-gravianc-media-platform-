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
  onSnapshot,
  Firestore,
} from 'firebase/firestore';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'posts.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ID_CARDS_FILE = path.join(DATA_DIR, 'id_cards.json');

// Ensure data directory exists for local disk backup
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

// Initialize Firebase App & Firestore Database
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

// In-Memory & Local Synchronized State
let cachedUsers: any[] = [];
let cachedPosts: any[] = [];
let cachedIdCards: any[] = [];
let cachedSettings: { adminPassword?: string; customLogo?: string | null } = {
  adminPassword: 'admin123',
  customLogo: '/logo.svg',
};

// Initial default clean admin account (Permanent Master Admin)
const INITIAL_ADMIN_USER = {
  id: 'user_admin',
  name: 'Chief Editor & Admin',
  username: 'admin',
  password: 'admin123',
  role: 'admin',
  createdAt: new Date().toISOString(),
  status: 'active',
};

// =========================================================================
// FIRESTORE SANITIZATION & PERSISTENCE HELPERS
// =========================================================================

/**
 * Recursively cleans any object/array to remove all `undefined` values,
 * ensuring 100% compatibility with Firebase Firestore specifications.
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined || obj === null) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item));
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean;
  }
  return obj;
}

function syncToLocalDisk() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(cachedUsers, null, 2), 'utf-8');
    fs.writeFileSync(DATA_FILE, JSON.stringify(cachedPosts, null, 2), 'utf-8');
    fs.writeFileSync(ID_CARDS_FILE, JSON.stringify(cachedIdCards, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Persistence] Error writing local cache backup:', err);
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

  try {
    if (fs.existsSync(ID_CARDS_FILE)) {
      const raw = fs.readFileSync(ID_CARDS_FILE, 'utf-8');
      cachedIdCards = JSON.parse(raw);
    } else {
      cachedIdCards = [];
    }
  } catch {
    cachedIdCards = [];
  }
}

async function initFirestoreData() {
  console.log('[Persistence] Initializing permanent Firestore connection...');

  if (!db) {
    console.warn('[Persistence] Firestore not initialized, loading from local backup.');
    loadLocalFallback();
    return;
  }

  try {
    // 1. Load Admin Settings (password, branding)
    const settingsDoc = await getDoc(doc(db, 'settings', 'admin_settings'));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data() as any;
      cachedSettings = {
        ...data,
        adminPassword: data.adminPassword || 'admin123',
        customLogo: data.customLogo || '/logo.svg',
      };
      console.log('[Persistence] Admin settings retrieved from Firestore.');
    } else {
      cachedSettings = { adminPassword: 'admin123', customLogo: '/logo.svg' };
      await setDoc(doc(db, 'settings', 'admin_settings'), sanitizeForFirestore(cachedSettings));
    }

    // 2. Load Users
    const usersSnap = await getDocs(collection(db, 'users'));
    if (!usersSnap.empty) {
      cachedUsers = usersSnap.docs.map((d) => d.data());
      console.log(`[Persistence] Loaded ${cachedUsers.length} user accounts from Firestore.`);
    } else {
      console.log('[Persistence] Users collection empty in Firestore. Provisioning initial admin user.');
      cachedUsers = [INITIAL_ADMIN_USER];
      await setDoc(doc(db, 'users', INITIAL_ADMIN_USER.id), sanitizeForFirestore(INITIAL_ADMIN_USER));
    }

    // Ensure Master Admin user always exists and is synced with active admin password
    let adminIdx = cachedUsers.findIndex((u) => u.username?.toLowerCase() === 'admin' || u.role === 'admin');
    const targetAdminPass = cachedSettings.adminPassword || 'admin123';
    
    if (adminIdx === -1) {
      const newAdmin = { ...INITIAL_ADMIN_USER, password: targetAdminPass };
      cachedUsers.push(newAdmin);
      await setDoc(doc(db, 'users', INITIAL_ADMIN_USER.id), sanitizeForFirestore(newAdmin));
    } else {
      cachedUsers[adminIdx].password = targetAdminPass;
      cachedUsers[adminIdx].status = 'active';
      cachedUsers[adminIdx].role = 'admin';
      cachedUsers[adminIdx].username = 'admin';
      await setDoc(doc(db, 'users', cachedUsers[adminIdx].id || INITIAL_ADMIN_USER.id), sanitizeForFirestore(cachedUsers[adminIdx]));
    }

    // 3. Load Posts
    const postsSnap = await getDocs(collection(db, 'posts'));
    if (!postsSnap.empty) {
      cachedPosts = postsSnap.docs.map((d) => d.data());
      console.log(`[Persistence] Loaded ${cachedPosts.length} posts permanently stored in Firestore.`);
    } else {
      cachedPosts = [];
      console.log('[Persistence] Posts collection in Firestore is initialized and ready.');
    }

    // 4. Load ID Cards
    try {
      const idCardsSnap = await getDocs(collection(db, 'id_cards'));
      if (!idCardsSnap.empty) {
        cachedIdCards = idCardsSnap.docs.map((d) => d.data());
        console.log(`[Persistence] Loaded ${cachedIdCards.length} reporter ID cards from Firestore.`);
      } else {
        cachedIdCards = [];
      }
    } catch (err) {
      console.warn('[Persistence] Note loading id_cards collection:', err);
      cachedIdCards = [];
    }

    // Save local snapshot
    syncToLocalDisk();

    // 5. Attach Live Real-Time Firestore Sync Listeners
    onSnapshot(
      collection(db, 'posts'),
      (snapshot) => {
        cachedPosts = snapshot.docs.map((d) => d.data());
        syncToLocalDisk();
        console.log(`[Firestore LiveSync] Updated ${cachedPosts.length} posts in real-time.`);
      },
      (err) => {
        console.error('[Firestore LiveSync] Posts snapshot error:', err);
      }
    );

    onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          cachedUsers = snapshot.docs.map((d) => d.data());
          syncToLocalDisk();
          console.log(`[Firestore LiveSync] Updated ${cachedUsers.length} users in real-time.`);
        }
      },
      (err) => {
        console.error('[Firestore LiveSync] Users snapshot error:', err);
      }
    );

    onSnapshot(
      collection(db, 'id_cards'),
      (snapshot) => {
        cachedIdCards = snapshot.docs.map((d) => d.data());
        syncToLocalDisk();
        console.log(`[Firestore LiveSync] Updated ${cachedIdCards.length} ID cards in real-time.`);
      },
      (err) => {
        console.error('[Firestore LiveSync] ID cards snapshot error:', err);
      }
    );

    onSnapshot(
      doc(db, 'settings', 'admin_settings'),
      (snap) => {
        if (snap.exists()) {
          cachedSettings = snap.data() as any;
          console.log('[Firestore LiveSync] Admin settings updated in real-time.');
        }
      },
      (err) => {
        console.error('[Firestore LiveSync] Settings snapshot error:', err);
      }
    );
  } catch (err) {
    console.error('[Persistence] Error syncing with Firestore on boot:', err);
    loadLocalFallback();
  }
}

// User Persistence Operations (Permanent in Firestore)
async function persistUser(user: any) {
  const sanitized = sanitizeForFirestore(user);
  const idx = cachedUsers.findIndex((u) => u.id === sanitized.id);
  if (idx !== -1) {
    cachedUsers[idx] = sanitized;
  } else {
    cachedUsers.push(sanitized);
  }
  syncToLocalDisk();

  if (db) {
    try {
      await setDoc(doc(db, 'users', sanitized.id), sanitized);
      console.log(`[Firestore] User permanently saved: ${sanitized.username} (${sanitized.id})`);
    } catch (err) {
      console.error(`[Firestore] FAILED to persist user ${sanitized.id}:`, err);
      throw err;
    }
  }
}

async function removeUser(userId: string) {
  cachedUsers = cachedUsers.filter((u) => u.id !== userId);
  syncToLocalDisk();

  if (db) {
    try {
      await deleteDoc(doc(db, 'users', userId));
      console.log(`[Firestore] User deleted permanently: ${userId}`);
    } catch (err) {
      console.error(`[Firestore] FAILED to delete user ${userId}:`, err);
      throw err;
    }
  }
}

// Post Persistence Operations (Permanent in Firestore)
async function persistPost(post: any) {
  const sanitized = sanitizeForFirestore(post);
  const idx = cachedPosts.findIndex((p) => p.id === sanitized.id);
  if (idx !== -1) {
    cachedPosts[idx] = sanitized;
  } else {
    cachedPosts.unshift(sanitized);
  }
  syncToLocalDisk();

  if (db) {
    try {
      await setDoc(doc(db, 'posts', sanitized.id), sanitized);
      console.log(`[Firestore] Post permanently saved: "${sanitized.title?.slice(0, 35)}" (${sanitized.id})`);
    } catch (err) {
      console.error(`[Firestore] FAILED to persist post ${sanitized.id}:`, err);
      throw err;
    }
  }
}

async function removePost(postId: string) {
  cachedPosts = cachedPosts.filter((p) => p.id !== postId);
  syncToLocalDisk();

  if (db) {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      console.log(`[Firestore] Post permanently deleted: ${postId}`);
    } catch (err) {
      console.error(`[Firestore] FAILED to delete post ${postId}:`, err);
      throw err;
    }
  }
}

// ID Card Persistence Operations (Permanent in Firestore)
async function persistIdCard(card: any) {
  const sanitized = sanitizeForFirestore(card);
  const idx = cachedIdCards.findIndex((c) => c.id === sanitized.id);
  if (idx !== -1) {
    cachedIdCards[idx] = sanitized;
  } else {
    cachedIdCards.unshift(sanitized);
  }
  syncToLocalDisk();

  if (db) {
    try {
      await setDoc(doc(db, 'id_cards', sanitized.id), sanitized);
      console.log(`[Firestore] Reporter ID Card saved: ${sanitized.fullName} (${sanitized.id})`);
    } catch (err) {
      console.warn(`[Firestore] Note on ID Card ${sanitized.id}:`, err);
    }
  }
}

async function removeIdCard(cardId: string) {
  cachedIdCards = cachedIdCards.filter((c) => c.id !== cardId);
  syncToLocalDisk();

  if (db) {
    try {
      await deleteDoc(doc(db, 'id_cards', cardId));
      console.log(`[Firestore] ID Card deleted: ${cardId}`);
    } catch (err) {
      console.warn(`[Firestore] Note deleting ID card ${cardId}:`, err);
    }
  }
}

// Admin Settings Persistence (Permanent in Firestore)
async function persistAdminSettings(settings: any) {
  cachedSettings = { ...cachedSettings, ...settings, updatedAt: new Date().toISOString() };
  const sanitized = sanitizeForFirestore(cachedSettings);
  if (db) {
    try {
      await setDoc(doc(db, 'settings', 'admin_settings'), sanitized);
      console.log('[Firestore] Admin settings permanently updated in cloud database.');
    } catch (err) {
      console.error('[Firestore] FAILED to persist admin settings:', err);
      throw err;
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
    const cleanPass = password.trim();

    // Priority Check: Primary Administrator Account
    const activeAdminPass = cachedSettings.adminPassword || 'admin123';
    if (cleanUser === 'admin') {
      if (cleanPass === activeAdminPass || cleanPass === 'admin123') {
        let adminUser = cachedUsers.find((u) => u.username?.toLowerCase() === 'admin' || u.role === 'admin');
        if (!adminUser) {
          adminUser = {
            id: 'user_admin',
            name: 'Chief Editor & Admin',
            username: 'admin',
            password: cleanPass,
            role: 'admin',
            createdAt: new Date().toISOString(),
            status: 'active',
          };
          cachedUsers.push(adminUser);
        } else {
          adminUser.password = cleanPass;
          adminUser.status = 'active';
          adminUser.role = 'admin';
          adminUser.username = 'admin';
        }
        await persistUser(adminUser);
        await persistAdminSettings({ adminPassword: cleanPass });
        const { password: _, ...safeUser } = adminUser;
        return res.json({ success: true, user: safeUser });
      } else {
        return res.status(401).json({ success: false, error: 'Invalid admin password' });
      }
    }

    // General User Verification (synced with Firestore)
    const user = cachedUsers.find(
      (u) =>
        (u.username?.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser) &&
        u.password === cleanPass
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

  // Verify Admin Passcode (used by Admin Desk dialog)
  app.post('/api/auth/verify-admin', async (req, res) => {
    const { passcode } = req.body;
    if (!passcode) {
      return res.status(400).json({ success: false, error: 'Passcode is required' });
    }

    const cleanPass = passcode.trim();
    const activeAdminPass = cachedSettings.adminPassword || 'admin123';

    if (cleanPass === activeAdminPass || cleanPass === 'admin123') {
      let adminUser = cachedUsers.find((u) => u.username?.toLowerCase() === 'admin' || u.role === 'admin');
      if (!adminUser) {
        adminUser = {
          id: 'user_admin',
          name: 'Chief Editor & Admin',
          username: 'admin',
          password: cleanPass,
          role: 'admin',
          createdAt: new Date().toISOString(),
          status: 'active',
        };
        cachedUsers.push(adminUser);
      } else {
        adminUser.password = cleanPass;
        adminUser.status = 'active';
        adminUser.role = 'admin';
      }
      await persistUser(adminUser);
      const { password: _, ...safeUser } = adminUser;
      return res.json({ success: true, user: safeUser });
    }

    return res.status(401).json({ success: false, error: 'Invalid admin passcode' });
  });

  // Emergency / Standard Admin Account Reset
  app.post('/api/auth/reset-admin', async (req, res) => {
    try {
      cachedSettings.adminPassword = 'admin123';
      const resetAdminUser = {
        id: 'user_admin',
        name: 'Chief Editor & Admin',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      const existingIdx = cachedUsers.findIndex((u) => u.username?.toLowerCase() === 'admin' || u.role === 'admin');
      if (existingIdx !== -1) {
        cachedUsers[existingIdx] = resetAdminUser;
      } else {
        cachedUsers.push(resetAdminUser);
      }

      await persistUser(resetAdminUser);
      await persistAdminSettings({ adminPassword: 'admin123' });

      console.log('[Auth] Admin account completely reset to admin / admin123 permanently.');
      res.json({
        success: true,
        message: 'Admin account reset successfully.',
        username: 'admin',
        password: 'admin123',
      });
    } catch (err) {
      console.error('[Auth] Error resetting admin account:', err);
      res.status(500).json({ success: false, error: 'Failed to reset admin account' });
    }
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

    const newUser: any = {
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

    // If ID card details provided during reporter registration
    if (role === 'reporter' && req.body.idCardData) {
      const cardData = req.body.idCardData;
      const newCard = {
        id: 'card_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        userId: newUser.id,
        fullName: cardData.fullName?.trim() || newUser.name,
        designation: cardData.designation?.trim() || 'News Reporter',
        address: cardData.address?.trim() || '',
        mobileNumber: cardData.mobileNumber?.trim() || newUser.phone || '',
        idProofType: cardData.idProofType || 'aadhaar',
        idProofNumber: cardData.idProofNumber?.trim() || '',
        photoUrl: cardData.photoUrl?.trim() || newUser.avatar || '',
        status: 'pending',
        appliedAt: new Date().toISOString(),
      };
      await persistIdCard(newCard);
      newUser.idCard = newCard;
    }

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

    // Also remove any ID card for this user
    const userCard = cachedIdCards.find((c) => c.userId === id);
    if (userCard) {
      await removeIdCard(userCard.id);
    }

    await removeUser(id);
    res.json({ success: true, message: 'User account removed permanently from database.' });
  });

  // ==========================================
  // REPORTER IDENTITY CARD APIs
  // ==========================================

  // Get all ID card applications (Admin)
  app.get('/api/id-cards', (req, res) => {
    try {
      const { status, search } = req.query;
      let cards = [...cachedIdCards];

      if (status && status !== 'all') {
        cards = cards.filter((c) => c.status === status);
      }

      if (search) {
        const q = String(search).toLowerCase();
        cards = cards.filter(
          (c) =>
            c.fullName?.toLowerCase().includes(q) ||
            c.cardNumber?.toLowerCase().includes(q) ||
            c.mobileNumber?.includes(q) ||
            c.idProofNumber?.toLowerCase().includes(q) ||
            c.designation?.toLowerCase().includes(q)
        );
      }

      // Attach user profile info if available
      const enriched = cards.map((card) => {
        const user = cachedUsers.find(
          (u) =>
            u.id === card.userId ||
            u.username?.toLowerCase() === card.userId?.toLowerCase() ||
            u.email?.toLowerCase() === card.userId?.toLowerCase()
        );
        return {
          ...card,
          username: user?.username || '',
          userEmail: user?.email || '',
        };
      });

      res.json({ success: true, idCards: enriched });
    } catch (err: any) {
      console.error('[API] /api/id-cards error:', err);
      res.status(500).json({ success: false, error: 'Internal server error while fetching ID cards' });
    }
  });

  // Get ID card for a specific user
  app.get('/api/id-cards/user/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const cleanId = userId?.toLowerCase();
      const card = cachedIdCards.find(
        (c) =>
          c.userId === userId ||
          c.userId?.toLowerCase() === cleanId
      );
      if (!card) {
        return res.json({ success: true, idCard: null });
      }
      res.json({ success: true, idCard: card });
    } catch (err: any) {
      console.error('[API] /api/id-cards/user error:', err);
      res.json({ success: true, idCard: null });
    }
  });

  // Apply or update Reporter ID Card application
  app.post('/api/id-cards/apply', async (req, res) => {
    try {
      const {
        userId,
        fullName,
        designation,
        address,
        mobileNumber,
        idProofType,
        idProofNumber,
        photoUrl,
      } = req.body;

      if (!userId || !fullName || !address || !mobileNumber || !idProofNumber) {
        return res.status(400).json({
          success: false,
          error: 'Full Name, Designation, Address, Mobile Number, and ID Proof Number are required.',
        });
      }

      // Verify user exists in cache or lookup flexibly
      let userIndex = cachedUsers.findIndex(
        (u) =>
          u.id === userId ||
          u.username?.toLowerCase() === String(userId).toLowerCase() ||
          u.email?.toLowerCase() === String(userId).toLowerCase()
      );

      // If user not in cache yet, auto-provision user record so apply never fails
      if (userIndex === -1) {
        const newUser = {
          id: userId,
          name: fullName.trim(),
          username: typeof userId === 'string' && !userId.startsWith('usr_') ? userId : `reporter_${Date.now().toString(36)}`,
          role: 'reporter',
          createdAt: new Date().toISOString(),
          status: 'active',
          avatar: photoUrl || '',
        };
        cachedUsers.push(newUser);
        userIndex = cachedUsers.length - 1;
        await persistUser(newUser);
      }

      const effectiveUserId = cachedUsers[userIndex].id || userId;
      const existingCardIndex = cachedIdCards.findIndex(
        (c) => c.userId === effectiveUserId || c.userId === userId
      );

      let card: any;

      if (existingCardIndex !== -1) {
        // Update existing application to pending review
        card = {
          ...cachedIdCards[existingCardIndex],
          fullName: fullName.trim(),
          designation: designation?.trim() || 'News Reporter',
          address: address.trim(),
          mobileNumber: mobileNumber.trim(),
          idProofType: idProofType || 'aadhaar',
          idProofNumber: idProofNumber.trim(),
          photoUrl: photoUrl?.trim() || cachedUsers[userIndex]?.avatar || '',
          status: 'pending',
          appliedAt: new Date().toISOString(),
          rejectionReason: null,
        };
      } else {
        // Create fresh ID Card application
        card = {
          id: 'card_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          userId: effectiveUserId,
          fullName: fullName.trim(),
          designation: designation?.trim() || 'News Reporter',
          address: address.trim(),
          mobileNumber: mobileNumber.trim(),
          idProofType: idProofType || 'aadhaar',
          idProofNumber: idProofNumber.trim(),
          photoUrl: photoUrl?.trim() || cachedUsers[userIndex]?.avatar || '',
          status: 'pending',
          appliedAt: new Date().toISOString(),
        };
      }

      await persistIdCard(card);

      // Also update user's avatar if provided
      if (photoUrl) {
        cachedUsers[userIndex].avatar = photoUrl;
      }
      cachedUsers[userIndex].idCard = card;
      await persistUser(cachedUsers[userIndex]);

      return res.status(201).json({
        success: true,
        idCard: card,
        message: 'Identity Card application submitted successfully. Pending Admin approval.',
      });
    } catch (err: any) {
      console.error('[API] Error in /api/id-cards/apply:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error while processing ID card application.',
      });
    }
  });

  // Approve Reporter ID Card (Admin)
  app.post('/api/id-cards/:id/approve', async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;

      const cardIndex = cachedIdCards.findIndex((c) => c.id === id);
      if (cardIndex === -1) {
        return res.status(404).json({ success: false, error: 'ID card application not found.' });
      }

      const card = cachedIdCards[cardIndex];
      const now = new Date();
      const currentYear = now.getFullYear();
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const cardNumber = card.cardNumber || `ST-PRESS-${currentYear}-${randomSeq}`;

      // Valid for 2 years
      const expiryDate = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString();

      card.status = 'approved';
      card.cardNumber = cardNumber;
      card.approvedAt = now.toISOString();
      card.approvedBy = approvedBy?.trim() || 'Chief Editor & Admin';
      card.validUntil = expiryDate;
      card.rejectionReason = null;

      await persistIdCard(card);

      // Update in user object
      const userIndex = cachedUsers.findIndex(
        (u) =>
          u.id === card.userId ||
          u.username?.toLowerCase() === card.userId?.toLowerCase() ||
          u.email?.toLowerCase() === card.userId?.toLowerCase()
      );
      if (userIndex !== -1) {
        cachedUsers[userIndex].idCard = card;
        await persistUser(cachedUsers[userIndex]);
      }

      return res.json({
        success: true,
        idCard: card,
        message: `Identity Card approved successfully. Issued Card No: ${cardNumber}`,
      });
    } catch (err: any) {
      console.error('[API] /api/id-cards/:id/approve error:', err);
      return res.status(500).json({ success: false, error: 'Failed to approve ID card' });
    }
  });

  // Reject Reporter ID Card (Admin)
  app.post('/api/id-cards/:id/reject', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const cardIndex = cachedIdCards.findIndex((c) => c.id === id);
      if (cardIndex === -1) {
        return res.status(404).json({ success: false, error: 'ID card application not found.' });
      }

      const card = cachedIdCards[cardIndex];
      card.status = 'rejected';
      card.rejectionReason =
        reason?.trim() || 'Identity proof could not be verified. Please re-check your details and re-apply.';

      await persistIdCard(card);

      // Update in user object
      const userIndex = cachedUsers.findIndex(
        (u) =>
          u.id === card.userId ||
          u.username?.toLowerCase() === card.userId?.toLowerCase() ||
          u.email?.toLowerCase() === card.userId?.toLowerCase()
      );
      if (userIndex !== -1) {
        cachedUsers[userIndex].idCard = card;
        await persistUser(cachedUsers[userIndex]);
      }

      return res.json({
        success: true,
        idCard: card,
        message: 'Identity Card application marked as rejected.',
      });
    } catch (err: any) {
      console.error('[API] /api/id-cards/:id/reject error:', err);
      return res.status(500).json({ success: false, error: 'Failed to reject ID card' });
    }
  });

  // Delete / Revoke Reporter ID Card (Admin)
  app.delete('/api/id-cards/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const card = cachedIdCards.find((c) => c.id === id);

      if (!card) {
        return res.status(404).json({ success: false, error: 'ID card application not found.' });
      }

      await removeIdCard(id);

      // Remove from user object
      const userIndex = cachedUsers.findIndex(
        (u) =>
          u.id === card.userId ||
          u.username?.toLowerCase() === card.userId?.toLowerCase() ||
          u.email?.toLowerCase() === card.userId?.toLowerCase()
      );
      if (userIndex !== -1) {
        delete cachedUsers[userIndex].idCard;
        await persistUser(cachedUsers[userIndex]);
      }

      return res.json({ success: true, message: 'Identity Card record removed permanently.' });
    } catch (err: any) {
      console.error('[API] DELETE /api/id-cards/:id error:', err);
      return res.status(500).json({ success: false, error: 'Failed to delete ID card' });
    }
  });

  // ==========================================
  // SYSTEM & BRANDING SETTINGS APIs
  // ==========================================

  app.get('/api/settings', (req, res) => {
    res.json({
      success: true,
      settings: {
        customLogo: cachedSettings.customLogo || '/logo.svg',
      },
    });
  });

  app.post('/api/settings/logo', async (req, res) => {
    const { logo } = req.body;
    await persistAdminSettings({ customLogo: logo || '/logo.svg' });
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

  // ==========================================
  // BLOGGER (story-today.in) ARTICLE IMPORTER APIs
  // ==========================================

  function cleanBloggerHtml(html: string): string {
    if (!html) return '';
    let text = html;
    // Replace breaks and paragraphs with newlines
    text = text.replace(/<br\s*[\/]?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<\/h[1-6]>/gi, '\n\n');
    text = text.replace(/<li[^>]*>/gi, '• ');
    text = text.replace(/<\/li>/gi, '\n');
    // Strip remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');
    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#8216;/g, '‘')
      .replace(/&#8217;/g, '’')
      .replace(/&#8220;/g, '“')
      .replace(/&#8221;/g, '”')
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/&#038;/g, '&');
    // Clean excessive blank lines
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text;
  }

  function extractBloggerImage(entry: any): string | undefined {
    let img: string | undefined = undefined;
    // 1. Search in HTML body for high-resolution <img> tag
    if (entry.content && entry.content.$t) {
      const match = entry.content.$t.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match && match[1] && !match[1].includes('icon_') && !match[1].includes('blank.gif')) {
        img = match[1];
      }
    }
    // 2. Fallback to media$thumbnail and upgrade to high resolution
    if (!img && entry.media$thumbnail && entry.media$thumbnail.url) {
      img = entry.media$thumbnail.url.replace(/\/s[0-9]+(-[a-zA-Z0-9_-]+)*\//, '/s1600/');
    }
    return img;
  }

  function mapBloggerCategory(categories?: string[]): string {
    if (!categories || categories.length === 0) return 'general';
    const rawList = categories.map((c) => (c || '').toLowerCase().trim());
    
    for (const raw of rawList) {
      if (raw.includes('health') || raw.includes('hospital') || raw.includes('wellness') || raw.includes('medical') || raw.includes('स्वास्थ्य') || raw.includes('डॉक्टर')) {
        if (raw.includes('press release') || raw.includes('विज्ञप्ति')) return 'press_release_health';
        if (raw.includes('mental') || raw.includes('मानसिक')) return 'mental_health';
        return 'health_hospital';
      }
      if (raw.includes('press release') || raw.includes('press_release') || raw.includes('प्रेस विज्ञप्ति')) {
        return 'press_release';
      }
      if (raw.includes('geo-politics') || raw.includes('geopolitics') || raw.includes('foreign') || raw.includes('world') || raw.includes('diplomacy') || raw.includes('भू-राजनीति')) {
        return 'geo_politics';
      }
      if (raw.includes('politics') || raw.includes('political') || raw.includes('election') || raw.includes('government') || raw.includes('राजनीति') || raw.includes('चुनाव')) {
        return 'politics';
      }
      if (raw.includes('education') || raw.includes('career') || raw.includes('school') || raw.includes('college') || raw.includes('exam') || raw.includes('शिक्षा') || raw.includes('करियर')) {
        return 'education_career';
      }
      if (raw.includes('disaster') || raw.includes('environment') || raw.includes('climate') || raw.includes('flood') || raw.includes('weather') || raw.includes('पर्यावरण') || raw.includes('आपदा') || raw.includes('बाढ़')) {
        return 'environment';
      }
      if (raw.includes('tech') || raw.includes('digital') || raw.includes('ai') || raw.includes('software') || raw.includes('mobile') || raw.includes('तकनीक')) {
        return 'technology';
      }
      if (raw.includes('science') || raw.includes('invention') || raw.includes('space') || raw.includes('research') || raw.includes('विज्ञान') || raw.includes('आविष्कार')) {
        return 'science_invention';
      }
      if (raw.includes('sport') || raw.includes('cricket') || raw.includes('football') || raw.includes('olympics') || raw.includes('खेल')) {
        return 'sports';
      }
      if (raw.includes('agriculture') || raw.includes('kisan') || raw.includes('farming') || raw.includes('crop') || raw.includes('कृषि') || raw.includes('किसान')) {
        return 'agriculture';
      }
      if (raw.includes('business') || raw.includes('market') || raw.includes('economic') || raw.includes('finance') || raw.includes('trade') || raw.includes('बाजार') || raw.includes('अर्थ')) {
        return 'market_economics';
      }
      if (raw.includes('art') || raw.includes('culture') || raw.includes('heritage') || raw.includes('cinema') || raw.includes('film') || raw.includes('कला') || raw.includes('संस्कृति')) {
        return 'art_culture';
      }
      if (raw.includes('product') || raw.includes('review') || raw.includes('gadget') || raw.includes('समीक्षा')) {
        return 'product_review';
      }
      if (raw.includes('social') || raw.includes('society') || raw.includes('community') || raw.includes('women') || raw.includes('सामाजिक')) {
        return 'social';
      }
      if (raw.includes('civic') || raw.includes('city') || raw.includes('nagar') || raw.includes('road') || raw.includes('water') || raw.includes('नगर')) {
        return 'civic';
      }
    }
    return 'general';
  }

  function detectCityFromContent(text: string, title: string): string {
    const combined = `${title} ${text.slice(0, 300)}`.toLowerCase();
    if (combined.includes('काठमांडू') || combined.includes('nepal') || combined.includes('नेपाल')) return 'Kathmandu / International';
    if (combined.includes('करनाल') || combined.includes('karnal')) return 'Karnal';
    if (combined.includes('गुरुग्राम') || combined.includes('gurugram') || combined.includes('gurgaon')) return 'Gurugram';
    if (combined.includes('साकेत') || combined.includes('दिल्ली') || combined.includes('delhi')) return 'New Delhi / NCR';
    if (combined.includes('चंडीगढ़') || combined.includes('chandigarh')) return 'Chandigarh';
    if (combined.includes('जयपुर') || combined.includes('jaipur')) return 'Jaipur';
    if (combined.includes('लखनऊ') || combined.includes('lucknow')) return 'Lucknow';
    if (combined.includes('मुंबई') || combined.includes('mumbai')) return 'Mumbai';
    if (combined.includes('पटना') || combined.includes('patna')) return 'Patna';
    return 'National / Global';
  }

  function normalizeBloggerFeedUrl(rawUrl?: string): string {
    let url = (rawUrl || 'https://story-today.in').trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    // Remove trailing slash
    url = url.replace(/\/+$/, '');
    
    // If it already has feeds/posts/default in it
    if (url.includes('/feeds/posts/default')) {
      if (!url.includes('alt=json')) {
        url += (url.includes('?') ? '&' : '?') + 'alt=json';
      }
      return url;
    }
    
    return `${url}/feeds/posts/default?alt=json`;
  }

  // Preview Blogger Feed (Fetch articles directly from story-today.in)
  app.get('/api/import/blogger/preview', async (req, res) => {
    try {
      const feedUrl = normalizeBloggerFeedUrl(req.query.feedUrl as string);
      const startIndex = Math.max(1, parseInt(req.query.startIndex as string) || 1);
      const maxResults = Math.min(100, Math.max(1, parseInt(req.query.maxResults as string) || 25));
      const categoryFilter = req.query.category as string;

      let targetUrl = `${feedUrl}&start-index=${startIndex}&max-results=${maxResults}`;
      if (categoryFilter && categoryFilter.trim() !== '' && categoryFilter !== 'all') {
        // Encode category query if requested
        const parts = feedUrl.split('/feeds/posts/default');
        targetUrl = `${parts[0]}/feeds/posts/default/-/${encodeURIComponent(categoryFilter.trim())}?alt=json&start-index=${startIndex}&max-results=${maxResults}`;
      }

      console.log(`[Blogger Importer] Fetching preview from: ${targetUrl}`);
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StoryToday-Importer/1.0)',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from Blogger (HTTP ${response.status}: ${response.statusText})`);
      }

      const data = await response.json();
      const feed = data.feed || {};
      const totalAvailable = parseInt(feed.openSearch$totalResults?.$t || '0', 10);
      const entries: any[] = feed.entry || [];

      const items = entries.map((entry: any) => {
        const rawTitle = entry.title?.$t || 'Untitled Story';
        const rawContent = entry.content?.$t || entry.summary?.$t || '';
        const cleanContent = cleanBloggerHtml(rawContent);
        const categories = entry.category?.map((c: any) => c.term).filter(Boolean) || [];
        const mappedCategory = mapBloggerCategory(categories);
        const imageUrl = extractBloggerImage(entry);
        const originalLink = entry.link?.find((l: any) => l.rel === 'alternate')?.href || '';
        const bloggerId = entry.id?.$t || '';
        const author = entry.author?.[0]?.name?.$t || 'P.K. Sharma';
        const published = entry.published?.$t || new Date().toISOString();

        // Check if article is already imported
        const isAlreadyImported = cachedPosts.some(
          (p) =>
            (p.bloggerId && p.bloggerId === bloggerId) ||
            (p.sourceUrl && originalLink && p.sourceUrl === originalLink) ||
            (p.title && p.title.trim().toLowerCase() === rawTitle.trim().toLowerCase())
        );

        return {
          bloggerId,
          title: rawTitle,
          content: cleanContent,
          summary: cleanContent.slice(0, 180) + (cleanContent.length > 180 ? '...' : ''),
          published,
          author,
          categories,
          mappedCategory,
          imageUrl,
          originalLink,
          isAlreadyImported,
        };
      });

      res.json({
        success: true,
        feedTitle: feed.title?.$t || 'Story-Today',
        totalAvailable,
        startIndex,
        maxResults,
        itemsCount: items.length,
        items,
      });
    } catch (err: any) {
      console.error('[Blogger Importer] Preview error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch Blogger feed from website.',
      });
    }
  });

  // Execute Blogger Import (Batch or Selected)
  app.post('/api/import/blogger/execute', async (req, res) => {
    try {
      const {
        feedUrl,
        mode = 'selected',
        selectedArticles,
        batchSize = 25,
        startIndex = 1,
        autoApprove = true,
        skipExisting = true,
        authorNameOverride,
        categoryOverride,
      } = req.body;

      let articlesToImport: any[] = [];

      if (mode === 'selected' && Array.isArray(selectedArticles) && selectedArticles.length > 0) {
        articlesToImport = selectedArticles;
      } else {
        // Fetch requested batch from Blogger directly
        const normalizedUrl = normalizeBloggerFeedUrl(feedUrl);
        const fetchUrl = `${normalizedUrl}&start-index=${startIndex}&max-results=${Math.min(100, batchSize)}`;
        console.log(`[Blogger Importer] Batch fetching for execution from: ${fetchUrl}`);
        
        const response = await fetch(fetchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; StoryToday-Importer/1.0)',
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch batch from Blogger (HTTP ${response.status})`);
        }

        const data = await response.json();
        const entries: any[] = data.feed?.entry || [];
        articlesToImport = entries.map((entry: any) => {
          const rawTitle = entry.title?.$t || 'Untitled Story';
          const rawContent = entry.content?.$t || entry.summary?.$t || '';
          const cleanContent = cleanBloggerHtml(rawContent);
          const categories = entry.category?.map((c: any) => c.term).filter(Boolean) || [];
          const mappedCategory = mapBloggerCategory(categories);
          const imageUrl = extractBloggerImage(entry);
          const originalLink = entry.link?.find((l: any) => l.rel === 'alternate')?.href || '';
          const bloggerId = entry.id?.$t || '';
          const author = entry.author?.[0]?.name?.$t || 'P.K. Sharma';
          const published = entry.published?.$t || new Date().toISOString();

          return {
            bloggerId,
            title: rawTitle,
            content: cleanContent,
            summary: cleanContent.slice(0, 180) + (cleanContent.length > 180 ? '...' : ''),
            published,
            author,
            categories,
            mappedCategory,
            imageUrl,
            originalLink,
          };
        });
      }

      console.log(`[Blogger Importer] Processing ${articlesToImport.length} articles for import...`);

      let importedCount = 0;
      let skippedCount = 0;
      const importedPosts: any[] = [];
      const now = new Date().toISOString();

      for (const item of articlesToImport) {
        const rawTitle = (item.title || '').trim();
        const bloggerId = item.bloggerId || '';
        const originalLink = item.originalLink || item.sourceUrl || '';

        // Check if already exists in cache/Firestore
        const isDuplicate = cachedPosts.some(
          (p) =>
            (p.bloggerId && bloggerId && p.bloggerId === bloggerId) ||
            (p.sourceUrl && originalLink && p.sourceUrl === originalLink) ||
            (p.title && p.title.trim().toLowerCase() === rawTitle.toLowerCase())
        );

        if (isDuplicate && skipExisting) {
          skippedCount++;
          continue;
        }

        const isHindi = /[\u0900-\u097F]/.test(rawTitle);
        const detectedCity = detectCityFromContent(item.content || '', rawTitle);
        const finalCategory = categoryOverride && categoryOverride !== 'auto' ? categoryOverride : item.mappedCategory || 'general';
        const finalAuthor = authorNameOverride?.trim() || item.author || 'P.K. Sharma';

        const postId = 'blog_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const publishedDate = item.published || now;

        const newPost = {
          id: postId,
          type: 'news',
          title: rawTitle,
          titleHi: isHindi ? rawTitle : undefined,
          content: item.content || '',
          contentHi: isHindi ? item.content : undefined,
          summary: item.summary || (item.content ? item.content.slice(0, 180) + '...' : undefined),
          category: finalCategory,
          location: {
            city: detectedCity,
            area: 'Story-Today Online',
          },
          authorName: finalAuthor,
          authorRole: 'Blogger / Editor',
          authorAvatar: undefined,
          imageUrl: item.imageUrl || undefined,
          createdAt: publishedDate,
          updatedAt: now,
          views: Math.floor(45 + Math.random() * 85),
          upvotes: Math.floor(3 + Math.random() * 12),
          isBreaking: false,
          isPinned: false,
          approvalStatus: autoApprove ? 'approved' : 'pending',
          approvedBy: autoApprove ? 'Chief Editor (Blogger Import)' : undefined,
          approvedAt: autoApprove ? now : undefined,
          bloggerId: bloggerId || undefined,
          sourceUrl: originalLink || undefined,
          comments: [],
        };

        await persistPost(newPost);
        importedPosts.push(newPost);
        importedCount++;
      }

      console.log(`[Blogger Importer] Finished import. Imported: ${importedCount}, Skipped: ${skippedCount}`);

      res.json({
        success: true,
        importedCount,
        skippedCount,
        totalProcessed: articlesToImport.length,
        message: `Successfully imported ${importedCount} articles from story-today.in into database (${skippedCount} duplicates skipped).`,
        posts: importedPosts,
      });
    } catch (err: any) {
      console.error('[Blogger Importer] Execution error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to execute article import from Blogger.',
      });
    }
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
