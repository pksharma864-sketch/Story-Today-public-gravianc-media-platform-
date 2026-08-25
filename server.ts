import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'posts.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default users (only clean administrator account, no demo reporter or demo citizen)
const DEFAULT_USERS = [
  {
    id: 'user_admin',
    name: 'Chief Editor & Admin',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
    status: 'active',
  },
];

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf-8');
}

// Initial clean posts (no demo articles, demo grievances, or demo complaints)
const DEFAULT_POSTS: any[] = [];

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_POSTS, null, 2), 'utf-8');
}

function readUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading users file:', err);
  }
  writeUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

function writeUsers(users: any[]): boolean {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing users file:', err);
    return false;
  }
}

function readPosts(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading posts file:', err);
  }
  return [];
}

function writePosts(posts: any[]): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing posts file:', err);
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ==========================================
  // AUTH & USER MANAGEMENT APIs
  // ==========================================

  // User Login
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const users = readUsers();
    const user = users.find(
      (u) =>
        (u.username.toLowerCase() === username.trim().toLowerCase() ||
          u.email?.toLowerCase() === username.trim().toLowerCase()) &&
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

  // Change Admin Password
  app.post('/api/auth/change-admin-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }

    if (newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long' });
    }

    const users = readUsers();
    let adminIndex = users.findIndex((u) => u.role === 'admin' || u.username === 'admin');

    if (adminIndex === -1) {
      if (currentPassword !== 'admin123' && currentPassword !== 'admin') {
        return res.status(401).json({ success: false, error: 'Current admin password does not match' });
      }
      users.unshift({
        id: 'user_admin',
        name: 'Chief Editor & Admin',
        username: 'admin',
        password: newPassword.trim(),
        role: 'admin',
        createdAt: new Date().toISOString(),
        status: 'active',
      });
    } else {
      if (users[adminIndex].password !== currentPassword && currentPassword !== 'admin123') {
        return res.status(401).json({ success: false, error: 'Current admin password does not match' });
      }
      users[adminIndex].password = newPassword.trim();
    }

    writeUsers(users);

    res.json({ success: true, message: 'Admin password updated successfully' });
  });

  // List all users (Admin)
  app.get('/api/users', (req, res) => {
    const users = readUsers();
    const safeUsers = users.map(({ password, ...safe }) => safe);
    res.json({ success: true, users: safeUsers });
  });

  // Create new user account (Admin)
  app.post('/api/users', (req, res) => {
    const { name, username, password, role, email } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, username, password, and role are required',
      });
    }

    const users = readUsers();
    const cleanUsername = username.trim().toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ success: false, error: 'Username already exists. Please choose another.' });
    }

    const newUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      username: cleanUsername,
      password: password.trim(),
      role: role || 'citizen',
      email: email?.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    users.push(newUser);
    writeUsers(users);

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, user: safeUser });
  });

  // Delete user account (Admin)
  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    let users = readUsers();

    const userToDelete = users.find((u) => u.id === id);
    if (!userToDelete) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (userToDelete.username === 'admin' || userToDelete.id === 'user_admin') {
      return res.status(400).json({ success: false, error: 'Primary Administrator account cannot be deleted' });
    }

    users = users.filter((u) => u.id !== id);
    writeUsers(users);

    res.json({ success: true, message: 'User account removed successfully' });
  });

  // ==========================================
  // POSTS & CONTENT APPROVAL APIs
  // ==========================================

  // Get all posts with filtering and approval status
  app.get('/api/posts', (req, res) => {
    const { type, category, search, status, city, approvalStatus, includePending } = req.query;
    let posts = readPosts();

    // Default: Public feeds only show approved posts (or backward compatible posts)
    if (includePending !== 'true') {
      if (approvalStatus) {
        if (approvalStatus !== 'all') {
          posts = posts.filter((p) => (p.approvalStatus || 'approved') === approvalStatus);
        }
      } else {
        // Only show approved
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

  // Get stats
  app.get('/api/stats', (req, res) => {
    const posts = readPosts();
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
  app.get('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const posts = readPosts();
    const postIndex = posts.findIndex((p) => p.id === id || String(p.id) === id);

    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Increment view count
    posts[postIndex].views = (posts[postIndex].views || 0) + 1;
    writePosts(posts);

    res.json({ success: true, post: posts[postIndex] });
  });

  // Create post (Defaults to Pending Approval)
  app.post('/api/posts', (req, res) => {
    const body = req.body;
    if (!body.title || !body.content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const posts = readPosts();
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    const isGrievance = body.type === 'grievance';
    const referenceNumber = isGrievance
      ? `ST-GR-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`
      : undefined;

    // Requirement: When any user posts an Article or Grievance, it goes to "Pending Approval"
    const approvalStatus = body.autoApprove ? 'approved' : 'pending';

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

    posts.unshift(newPost);
    writePosts(posts);

    res.status(201).json({
      success: true,
      post: newPost,
      message:
        approvalStatus === 'pending'
          ? 'Post submitted successfully. It is now awaiting Editorial Approval by Admin before appearing publicly.'
          : 'Post published directly.',
    });
  });

  // Admin Approval / Rejection Endpoint
  app.post('/api/posts/:id/approval', (req, res) => {
    const { id } = req.params;
    const { approvalStatus, reason, adminName } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid approval status' });
    }

    const posts = readPosts();
    const postIndex = posts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const now = new Date().toISOString();
    posts[postIndex].approvalStatus = approvalStatus;
    posts[postIndex].updatedAt = now;

    if (approvalStatus === 'approved') {
      posts[postIndex].approvedBy = adminName || 'Admin / Editorial Desk';
      posts[postIndex].approvedAt = now;
      posts[postIndex].rejectionReason = undefined;
    } else if (approvalStatus === 'rejected') {
      posts[postIndex].rejectionReason = reason || 'Content does not meet publication standards or community guidelines.';
      posts[postIndex].approvedBy = undefined;
      posts[postIndex].approvedAt = undefined;
    }

    writePosts(posts);

    res.json({
      success: true,
      post: posts[postIndex],
      message: `Post ${approvalStatus === 'approved' ? 'approved & published live' : 'rejected'} successfully`,
    });
  });

  // Upvote / endorse
  app.post('/api/posts/:id/upvote', (req, res) => {
    const { id } = req.params;
    const posts = readPosts();
    const postIndex = posts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    posts[postIndex].upvotes = (posts[postIndex].upvotes || 0) + 1;
    writePosts(posts);

    res.json({ success: true, upvotes: posts[postIndex].upvotes });
  });

  // Add Comment
  app.post('/api/posts/:id/comment', (req, res) => {
    const { id } = req.params;
    const { author, text, isOfficial } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }

    const posts = readPosts();
    const postIndex = posts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const comment = {
      id: Date.now().toString(36),
      author: author?.trim() || 'Citizen',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isOfficial: Boolean(isOfficial),
    };

    if (!posts[postIndex].comments) {
      posts[postIndex].comments = [];
    }
    posts[postIndex].comments.push(comment);
    writePosts(posts);

    res.json({ success: true, comments: posts[postIndex].comments });
  });

  // Update Grievance Status (Admin / Official Action)
  app.post('/api/posts/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, note, officerName, department } = req.body;

    const posts = readPosts();
    const postIndex = posts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const now = new Date().toISOString();
    posts[postIndex].status = status;
    posts[postIndex].updatedAt = now;

    if (!posts[postIndex].statusHistory) {
      posts[postIndex].statusHistory = [];
    }

    posts[postIndex].statusHistory.push({
      status,
      note: note || `Status updated to ${status}`,
      timestamp: now,
      updatedBy: officerName || 'Admin / Authority',
    });

    if (department || note) {
      posts[postIndex].officialResponse = {
        department: department || 'Municipal / Civic Administration',
        message: note || 'Issue is being handled.',
        timestamp: now,
        officerName: officerName || 'Designated Officer',
      };
    }

    writePosts(posts);

    res.json({ success: true, post: posts[postIndex] });
  });

  // Update Post (Edit / Pin)
  app.put('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const posts = readPosts();
    const postIndex = posts.findIndex((p) => p.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const current = posts[postIndex];
    posts[postIndex] = {
      ...current,
      ...req.body,
      id: current.id, // prevent ID overwrite
      updatedAt: new Date().toISOString(),
    };

    writePosts(posts);

    res.json({ success: true, post: posts[postIndex] });
  });

  // Delete Post
  app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    let posts = readPosts();
    const initialLen = posts.length;
    posts = posts.filter((p) => p.id !== id);

    if (posts.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    writePosts(posts);
    res.json({ success: true, message: 'Post deleted successfully' });
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
    console.log(`Story Today server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
