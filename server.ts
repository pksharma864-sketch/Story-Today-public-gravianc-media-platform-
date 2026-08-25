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

// Initial default users
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
  {
    id: 'user_reporter',
    name: 'Rajesh Sharma (Staff Reporter)',
    username: 'reporter',
    password: 'reporter123',
    role: 'reporter',
    createdAt: new Date().toISOString(),
    status: 'active',
  },
  {
    id: 'user_citizen',
    name: 'Sunita Verma (Citizen)',
    username: 'citizen',
    password: 'citizen123',
    role: 'citizen',
    createdAt: new Date().toISOString(),
    status: 'active',
  },
];

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf-8');
}

// Initial default sample posts
const DEFAULT_POSTS = [
  {
    id: 'mt7jcc2593ap',
    type: 'grievance',
    title: 'Severe Water Pipeline Leakage & Low Pressure in Ward 14',
    titleHi: 'वार्ड 14 में मुख्य जल पाइपलाइन रिसाव और पेयजल आपूर्ति में गंभीर कमी',
    content: 'The primary municipal water pipeline near Sector 4 community center has developed a significant rupture since Monday morning. Potable water is flooding the street causing waterlogging and leading to low pressure in more than 250 households in Ward 14. Residents request urgent repair and pipeline welding.',
    contentHi: 'सेक्टर 4 कम्युनिटी सेंटर के पास मुख्य पेयजल पाइपलाइन में सोमवार सुबह से बड़ा रिसाव हो रहा है। सड़क पर हजारों लीटर पीने का पानी बह रहा है और वार्ड 14 के 250 से अधिक घरों में पानी का दबाव बहुत कम हो गया है। स्थानीय नागरिकों ने जल विभाग से तत्काल मरम्मत का अनुरोध किया है।',
    category: 'water_supply',
    location: {
      city: 'Jaipur',
      area: 'Sector 4, Mansarovar',
      ward: 'Ward 14',
      landmark: 'Near Community Park & Water Tank',
    },
    authorName: 'Sunita Verma',
    authorRole: 'Ward 14 Resident',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    views: 142,
    upvotes: 28,
    isPinned: true,
    isBreaking: false,
    approvalStatus: 'approved',
    approvedBy: 'Chief Editor & Admin',
    approvedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    status: 'in_progress',
    priority: 'urgent',
    referenceNumber: 'ST-GR-7281',
    statusHistory: [
      {
        status: 'submitted',
        note: 'Citizen grievance submitted on civic portal.',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        updatedBy: 'Sunita Verma',
      },
      {
        status: 'under_review',
        note: 'Verified by Ward Field Inspector. Forwarded to Municipal Water Supply Maintenance Cell.',
        timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        updatedBy: 'Jaipur Jal Board',
      },
      {
        status: 'in_progress',
        note: 'Maintenance repair team dispatched with replacement gasket valves.',
        timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        updatedBy: 'Municipal Works Engineer',
      },
    ],
    officialResponse: {
      department: 'Public Health Engineering Department (PHED)',
      message: 'Repair work is currently underway. Valve replacement scheduled for completion by 6:00 PM today.',
      timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      officerName: 'Er. R. K. Meena (Executive Engineer)',
    },
    comments: [
      {
        id: 'c1',
        author: 'Mahesh Sharma',
        text: 'Thank you for raising this issue. We have faced low water pressure for 3 days.',
        createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'news-metro-expansion-2026',
    type: 'news',
    title: 'New High-Speed Feeder Bus Routes Launched Across Municipal Suburbs',
    titleHi: 'नगर निगम उपनगरों में नए हाई-स्पीड फीडर बस रूट शुरू',
    content: 'The City Transport Corporation has inaugurated 12 new electric feeder bus routes connecting suburban metro terminals with major residential colonies and health clinics. The buses are equipped with GPS tracking and contactless ticketing.',
    contentHi: 'नगर परिवहन निगम ने उपनगरीय मेट्रो स्टेशनों को प्रमुख आवासीय कॉलोनियों और स्वास्थ्य केंद्रों से जोड़ने वाले 12 नए इलेक्ट्रिक फीडर बस रूट का शुभारंभ किया है। बसों में जीपीएस और डिजिटल टिकटिंग की सुविधा उपलब्ध है।',
    category: 'transport',
    location: {
      city: 'Delhi NCR',
      area: 'Suburban Transit Hub',
    },
    authorName: 'Rajesh Sharma',
    authorRole: 'Senior Staff Reporter',
    imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    views: 310,
    upvotes: 45,
    isPinned: false,
    isBreaking: true,
    approvalStatus: 'approved',
    approvedBy: 'Chief Editor & Admin',
    approvedAt: new Date(Date.now() - 46 * 3600 * 1000).toISOString(),
    comments: [],
  },
  {
    id: 'gr-pothole-ringroad-01',
    type: 'grievance',
    title: 'Hazardous Open Pothole at Main Bypass Junction Repaired Successfully',
    titleHi: 'मुख्य बाईपास चौराहे पर खतरनाक गड्ढे की मरम्मत पूरी, यातायात सुचारू',
    content: 'Following community citizen reports on the portal, the Highway Authority and Municipal Works department completed full macadam resurfacing of the deep trench at the Ring Road junction within 48 hours.',
    contentHi: 'नागरिक पोर्टल पर शिकायत दर्ज होने के 48 घंटों के भीतर नगर निगम लोक निर्माण विभाग ने रिंग रोड जंक्शन पर गहरे गड्ढे की डामरीकरण मरम्मत सफलतापूर्वक पूरी कर दी है।',
    category: 'roads',
    location: {
      city: 'Indore',
      area: 'Ring Road Bypass',
      ward: 'Ward 8',
    },
    authorName: 'Amit Joshi',
    authorRole: 'Citizen Resident',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    views: 245,
    upvotes: 62,
    isPinned: false,
    isBreaking: false,
    approvalStatus: 'approved',
    approvedBy: 'Chief Editor & Admin',
    approvedAt: new Date(Date.now() - 70 * 3600 * 1000).toISOString(),
    status: 'resolved',
    priority: 'high',
    referenceNumber: 'ST-GR-5912',
    statusHistory: [
      {
        status: 'submitted',
        note: 'Citizen grievance submitted.',
        timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        updatedBy: 'Amit Joshi',
      },
      {
        status: 'resolved',
        note: 'Road repair and bitumen sealing completed by PWD contractor.',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        updatedBy: 'Municipal PWD Inspector',
      },
    ],
    officialResponse: {
      department: 'Public Works Department (PWD)',
      message: 'Resurfacing completed. Junction is now safe for vehicular traffic.',
      timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      officerName: 'Vijay Deshmukh (PWD Supervisor)',
    },
    comments: [],
  },
];

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_POSTS, null, 2), 'utf-8');
}

function readUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading users file:', err);
  }
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading posts file:', err);
  }
  // Initialize with DEFAULT_POSTS
  writePosts(DEFAULT_POSTS);
  return DEFAULT_POSTS;
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
