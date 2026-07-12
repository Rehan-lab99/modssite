const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
//  MONGODB CONNECTION
// ============================================================
// YAHAN APNA MONGODB CONNECTION STRING DAALEIN
const MONGODB_URI = 'mongodb+srv://mdrehanshaikh913620_db_user:<db_password>@cluster0.tqtiw9l.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('✅ Connected to MongoDB Atlas - Data is PERMANENT!');
});

// ============================================================
//  MONGOOSE SCHEMA
// ============================================================
const commentSchema = new mongoose.Schema({
    user: String,
    text: String,
    time: Number
});

const apkSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    title: String,
    category: String,
    version: String,
    size: String,
    android: String,
    description: String,
    icon: String,
    downloadLink: String,
    views: Number,
    downloads: Number,
    comments: [commentSchema],
    viewedSessions: [String],
    createdAt: Number
});

const APK = mongoose.model('APK', apkSchema);

// ============================================================
//  MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// ============================================================
//  FILE UPLOAD
// ============================================================
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, uuidv4() + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 },
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
//  INIT SAMPLE DATA (ONLY IF EMPTY)
// ============================================================
async function initSampleData() {
    const count = await APK.countDocuments();
    if (count === 0) {
        const samples = [
            {
                id: '1',
                title: 'Spotify Premium Mod',
                category: 'music-audio',
                version: '8.9.18.512',
                size: '72.5 MB',
                android: '5.0+',
                description: 'Spotify Premium Mod APK - Unlimited skips, no ads, offline downloads, and all premium features unlocked.',
                icon: '',
                downloadLink: 'https://example.com/spotify-premium-mod.apk',
                views: 2847,
                downloads: 1253,
                comments: [
                    { user: 'Rahul', text: 'Working perfectly! Thanks 🔥', time: Date.now() - 3600000 },
                    { user: 'Priya', text: 'No ads, amazing app! 💯', time: Date.now() - 7200000 }
                ],
                viewedSessions: [],
                createdAt: Date.now()
            },
            {
                id: '2',
                title: 'Minecraft Premium',
                category: 'games',
                version: '1.20.81.01',
                size: '185.3 MB',
                android: '5.0+',
                description: 'Minecraft Premium APK - Full unlocked game with all features. Build, explore, and survive.',
                icon: '',
                downloadLink: 'https://example.com/minecraft-premium.apk',
                views: 1953,
                downloads: 876,
                comments: [
                    { user: 'Amit', text: 'Best game ever! 🎮', time: Date.now() - 1800000 }
                ],
                viewedSessions: [],
                createdAt: Date.now()
            }
        ];
        await APK.insertMany(samples);
        console.log('📦 Sample data inserted into MongoDB');
    }
}
initSampleData();

// ============================================================
//  API ENDPOINTS
// ============================================================

// Get all APKs
app.get('/api/apks', async (req, res) => {
    try {
        const apks = await APK.find().sort({ createdAt: -1 });
        res.json(apks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch APKs' });
    }
});

// Get single APK
app.get('/api/apks/:id', async (req, res) => {
    try {
        const apk = await APK.findOne({ id: req.params.id });
        if (!apk) return res.status(404).json({ error: 'APK not found' });
        res.json(apk);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch APK' });
    }
});

// Add/Update APK
app.post('/api/apks', upload.fields([{ name: 'icon', maxCount: 1 }]), async (req, res) => {
    try {
        const { id, title, category, version, size, android, description, downloadLink, iconData } = req.body;

        let iconUrl = '';
        if (req.files && req.files.icon && req.files.icon[0]) {
            iconUrl = '/uploads/' + req.files.icon[0].filename;
        } else if (iconData && iconData.startsWith('data:image')) {
            iconUrl = iconData;
        } else if (iconData) {
            iconUrl = iconData;
        }

        if (id && id !== '') {
            // UPDATE
            const existing = await APK.findOne({ id: id });
            if (!existing) return res.status(404).json({ error: 'APK not found' });

            // Preserve views, downloads, comments, viewedSessions
            const updateData = {
                title: title,
                category: category,
                version: version || '1.0',
                size: size || '10 MB',
                android: android || '5.0+',
                description: description || '',
                downloadLink: downloadLink || '',
                icon: iconUrl || existing.icon,
                views: existing.views || 0,
                downloads: existing.downloads || 0,
                comments: existing.comments || [],
                viewedSessions: existing.viewedSessions || [],
                createdAt: existing.createdAt || Date.now()
            };

            await APK.updateOne({ id: id }, updateData);
            const updated = await APK.findOne({ id: id });
            res.json({ success: true, apk: updated });
        } else {
            // ADD NEW
            const newApk = new APK({
                id: uuidv4(),
                title: title,
                category: category,
                version: version || '1.0',
                size: size || '10 MB',
                android: android || '5.0+',
                description: description || '',
                downloadLink: downloadLink || '',
                icon: iconUrl,
                views: 0,
                downloads: 0,
                comments: [],
                viewedSessions: [],
                createdAt: Date.now()
            });
            await newApk.save();
            res.json({ success: true, apk: newApk });
        }
    } catch (error) {
        console.error('Error saving APK:', error);
        res.status(500).json({ error: 'Failed to save APK' });
    }
});

// Delete APK
app.delete('/api/apks/:id', async (req, res) => {
    try {
        const result = await APK.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'APK not found' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete APK' });
    }
});

// Track view
app.post('/api/apks/:id/view', async (req, res) => {
    try {
        const apk = await APK.findOne({ id: req.params.id });
        if (!apk) return res.status(404).json({ error: 'APK not found' });

        const { sessionId } = req.body;
        if (!apk.viewedSessions) apk.viewedSessions = [];

        if (!apk.viewedSessions.includes(sessionId)) {
            apk.viewedSessions.push(sessionId);
            apk.views = (apk.views || 0) + 1;
            await apk.save();
        }

        res.json({ success: true, views: apk.views });
    } catch (error) {
        res.status(500).json({ error: 'Failed to track view' });
    }
});

// Track download
app.post('/api/apks/:id/download', async (req, res) => {
    try {
        const apk = await APK.findOne({ id: req.params.id });
        if (!apk) return res.status(404).json({ error: 'APK not found' });

        apk.downloads = (apk.downloads || 0) + 1;
        await apk.save();

        res.json({ success: true, downloads: apk.downloads });
    } catch (error) {
        res.status(500).json({ error: 'Failed to track download' });
    }
});

// Add comment
app.post('/api/apks/:id/comment', async (req, res) => {
    try {
        const apk = await APK.findOne({ id: req.params.id });
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
        await apk.save();

        res.json({ success: true, comments: apk.comments });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get stats
app.get('/api/stats', async (req, res) => {
    try {
        const apks = await APK.find();
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

// Get categories
app.get('/api/categories', async (req, res) => {
    try {
        const apks = await APK.find();
        const categories = {};
        apks.forEach(a => {
            const cat = a.category || 'apps';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// ============================================================
//  SERVE FRONTEND
// ============================================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
//  START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║   📱 ModsCom Server Started!                            ║
    ║                                                          ║
    ║   🌐 http://localhost:${PORT}                             ║
    ║                                                          ║
    ║   🗄️  MongoDB Atlas Connected - DATA IS PERMANENT!      ║
    ║                                                          ║
    ║   🔑 Admin Access: http://localhost:${PORT}#x7K9mP2qL4nR8 ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
    `);
});
