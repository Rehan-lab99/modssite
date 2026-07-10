const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Database setup
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const APKS_FILE = path.join(DATA_DIR, 'apks.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Initialize APKs file
if (!fs.existsSync(APKS_FILE)) {
    const sampleApks = [{
        id: '1',
        title: 'Spotify Premium Mod',
        category: 'apps',
        version: '8.9.18.512',
        size: '72.5 MB',
        android: '5.0+',
        description: 'Spotify Premium Mod APK - Unlimited skips, no ads, offline downloads, and all premium features unlocked. The best music streaming app with millions of songs.',
        icon: '',
        screenshots: [],
        downloadLink: 'https://example.com/spotify-premium-mod.apk',
        views: 2847,
        downloads: 1253,
        comments: [
            { user: 'Rahul', text: 'Working perfectly! Thanks 🔥', time: Date.now() - 3600000 },
            { user: 'Priya', text: 'No ads, amazing app! 💯', time: Date.now() - 7200000 }
        ],
        viewedSessions: [],
        createdAt: Date.now()
    }, {
        id: '2',
        title: 'Minecraft Premium',
        category: 'games',
        version: '1.20.81.01',
        size: '185.3 MB',
        android: '5.0+',
        description: 'Minecraft Premium APK - Full unlocked game with all features. Build, explore, and survive in infinite worlds. Includes all latest updates.',
        icon: '',
        screenshots: [],
        downloadLink: 'https://example.com/minecraft-premium.apk',
        views: 1953,
        downloads: 876,
        comments: [
            { user: 'Amit', text: 'Best game ever! 🎮', time: Date.now() - 1800000 }
        ],
        viewedSessions: [],
        createdAt: Date.now()
    }, {
        id: '3',
        title: 'GCam Mod 8.9',
        category: 'apps',
        version: '8.9.097',
        size: '124.8 MB',
        android: '8.0+',
        description: 'Google Camera Mod APK - Enhanced camera features, night mode, portrait mode, and HDR+ for all Android devices. Professional quality photos.',
        icon: '',
        screenshots: [],
        downloadLink: 'https://example.com/gcam-mod.apk',
        views: 1421,
        downloads: 543,
        comments: [
            { user: 'Vikram', text: 'Camera quality improved a lot! 📸', time: Date.now() - 900000 }
        ],
        viewedSessions: [],
        createdAt: Date.now()
    }, {
        id: '4',
        title: 'Subway Surfers Mod',
        category: 'games',
        version: '3.25.0',
        size: '95.2 MB',
        android: '4.4+',
        description: 'Subway Surfers Mod APK - Unlimited coins, keys, and power-ups. All characters and boards unlocked. The most popular runner game.',
        icon: '',
        screenshots: [],
        downloadLink: 'https://example.com/subway-surfers-mod.apk',
        views: 876,
        downloads: 412,
        comments: [
            { user: 'Neha', text: 'Unlimited coins working! 🏃', time: Date.now() - 300000 }
        ],
        viewedSessions: [],
        createdAt: Date.now()
    }];
    fs.writeFileSync(APKS_FILE, JSON.stringify(sampleApks, null, 2));
}

// File upload config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'icon') {
            cb(null, UPLOAD_DIR);
        } else {
            cb(null, UPLOAD_DIR);
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, uuidv4() + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'icon') {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only images are allowed for icon'));
            }
        } else {
            cb(null, true);
        }
    }
});

// ============================================================
//  API ENDPOINTS
// ============================================================

// Get all APKs
app.get('/api/apks', (req, res) => {
    try {
        const apks = JSON.parse(fs.readFileSync(APKS_FILE));
        // Sort by newest first
        apks.sort((a, b) => b.createdAt - a.createdAt);
        res.json(apks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch APKs' });
    }
});

// Get single APK
app.get('/api/apks/:id', (req, res) => {
    try {
        const apks = JSON.parse(fs.readFileSync(APKS_FILE));
        const apk = apks.find(a => a.id === req.params.id);
        if (!apk) return res.status(404).json({ error: 'APK not found' });
        res.json(apk);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch APK' });
    }
});

// Add/Update APK
app.post('/api/apks', upload.fields([
    { name: 'icon', maxCount: 1 }
]), (req, res) => {
    try {
        const apks = JSON.parse(fs.readFileSync(APKS_FILE));
        const { id, title, category, version, size, android, description, downloadLink, iconData } = req.body;

        const apkData = {
            title: title,
            category: category || 'apps',
            version: version || '1.0.0',
            size: size || '10 MB',
            android: android || '5.0+',
            description: description || '',
            downloadLink: downloadLink || '',
            views: 0,
            downloads: 0,
            comments: [],
            viewedSessions: [],
            createdAt: Date.now(),
            screenshots: []
        };

        // Handle icon upload
        if (req.files && req.files.icon && req.files.icon[0]) {
            apkData.icon = '/uploads/' + req.files.icon[0].filename;
        } else if (iconData && iconData.startsWith('data:image')) {
            apkData.icon = iconData;
        } else if (iconData) {
            apkData.icon = iconData;
        } else {
            apkData.icon = '';
        }

        if (id && id !== '') {
            // UPDATE
            const index = apks.findIndex(a => a.id === id);
            if (index !== -1) {
                apkData.views = apks[index].views || 0;
                apkData.downloads = apks[index].downloads || 0;
                apkData.comments = apks[index].comments || [];
                apkData.viewedSessions = apks[index].viewedSessions || [];
                apkData.createdAt = apks[index].createdAt || Date.now();
                if (!req.files || !req.files.icon || !req.files.icon[0]) {
                    apkData.icon = apks[index].icon;
                }
                apkData.id = id;
                apks[index] = apkData;
            } else {
                return res.status(404).json({ error: 'APK not found' });
            }
        } else {
            // ADD NEW
            apkData.id = uuidv4();
            apks.push(apkData);
        }

        fs.writeFileSync(APKS_FILE, JSON.stringify(apks, null, 2));
        res.json({ success: true, apk: apkData });
    } catch (error) {
        console.error('Error saving APK:', error);
        res.status(500).json({ error: 'Failed to save APK' });
    }
});

// Delete APK
app.delete('/api/apks/:id', (req, res) => {
    try {
        const apks = JSON.parse(fs.readFileSync(APKS_FILE));
        const filtered = apks.filter(a => a.id !== req.params.id);
        if (filtered.length === apks.length) {
            return res.status(404).json({ error: 'APK not found' });
        }
        fs.writeFileSync(APKS_FILE, JSON.stringify(filtered, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete APK' });
    }
});

// Track view
app.post('/api/apks/:id/view', (req, res) => {
    try {
        const apks = JSON.parse(fs.readFileSync(APKS_FILE));
        const apk = apks.find(a => a.id === req.params.id);
        if (!apk) return res.status(404).json({ error: 'APK not found' });

        const { sessionId } = req.body;
        if (!apk.viewedSessions) apk.viewedSessions = [];

        if (!apk.viewedSessions.includes(sessionId)) {
            apk.viewedSessions.push(sessionId);
            apk.views = (apk.views || 0) + 1;
            fs.writeFileSync(APKS_FILE, JSON.stringify(apks, null, 2));
        }

        res.json({ success: true, views: apk.views });
    } catch (error) {
        res.status(500).json({ error: 'Failed to track view' });
    }
});

// Track download
app.post('/api/apks/:id/download', (req, res) => {
    try {
        const apks = JSON.parse(fs.readFileSync(APKS_FILE));
        const apk = apks.find(a => a.id === req.params.id);
        if (!apk) return res.status(404).json({ error: 'APK not found' });

        apk.downloads = (apk.downloads || 0) + 1;
        fs.writeFileSync(APKS_FILE, JSON.stringify(apks, null, 2));

        res.json({ success: true, downloads: apk.downloads });
    } catch (error) {
        res.status(500).json({ error: 'Failed to track download' });
    }
});

// Add comment
app.post('/api/apks/:id/comment', (req, res) => {
    try {
        const apks = JSON.parse(fs.readFileSync(APKS_FILE));
        const apk = apks.find(a => a.id === req.params.id);
        if (!apk) return res.status(404).json({ error: 'APK not found' });

        const { user, text } = req.body;
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Comment cannot be empty' });
        }

        if (!apk.comments) apk.comments = [];
        apk.comments.push({
            user: user || 'User',
            text: text.trim(),
            time: Date.now()
        });

        fs.writeFileSync(APKS_FILE, JSON.stringify(apks, null, 2));
        res.json({ success: true, comments: apk.comments });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get stats
app.get('/api/stats', (req, res) => {
    try {
        const apks = JSON.parse(fs.readFileSync(APKS_FILE));
        let totalViews = 0;
        let totalDownloads = 0;
        let totalComments = 0;
        const sessions = new Set();

        apks.forEach(a => {
            totalViews += (a.views || 0);
            totalDownloads += (a.downloads || 0);
            totalComments += (a.comments || []).length;
            if (a.viewedSessions) {
                a.viewedSessions.forEach(s => sessions.add(s));
            }
        });

        res.json({
            totalApks: apks.length,
            totalViews: totalViews,
            totalDownloads: totalDownloads,
            totalComments: totalComments,
            activeUsers: sessions.size
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Get categories stats
app.get('/api/categories', (req, res) => {
    try {
        const apks = JSON.parse(fs.readFileSync(APKS_FILE));
        const categories = {
            apps: 0,
            games: 0,
            mods: 0,
            tools: 0
        };
        apks.forEach(a => {
            if (categories[a.category] !== undefined) {
                categories[a.category]++;
            } else {
                categories['apps']++;
            }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║   📱 LiteAPKS Clone Server Started!                     ║
    ║                                                          ║
    ║   🌐 http://localhost:${PORT}                             ║
    ║                                                          ║
    ║   🔑 Admin Access: http://localhost:${PORT}#x7K9mP2qL4nR8 ║
    ║                                                          ║
    ║   📊 API Endpoints:                                     ║
    ║   GET  /api/apks       - All APKs                      ║
    ║   GET  /api/apks/:id   - Single APK                    ║
    ║   POST /api/apks       - Add/Update APK                ║
    ║   DELETE /api/apks/:id - Delete APK                   ║
    ║   POST /api/apks/:id/view - Track view               ║
    ║   POST /api/apks/:id/download - Track download       ║
    ║   POST /api/apks/:id/comment - Add comment           ║
    ║   GET  /api/stats       - Get stats                  ║
    ║   GET  /api/categories  - Get categories             ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
    `);
});