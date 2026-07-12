const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
//  POSTGRESQL CONNECTION
// ============================================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ PostgreSQL connection error:', err.stack);
    } else {
        console.log('✅ Connected to PostgreSQL - Data is PERMANENT!');
        release();
        initDatabase();
    }
});

// ============================================================
//  CREATE TABLES
// ============================================================
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS apks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT,
                version TEXT,
                size TEXT,
                android TEXT,
                developer TEXT,
                modinfo TEXT,
                description TEXT,
                icon TEXT,
                downloadlink TEXT,
                views INTEGER DEFAULT 0,
                downloads INTEGER DEFAULT 0,
                viewedSessions TEXT[],
                createdat BIGINT
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                apk_id TEXT REFERENCES apks(id) ON DELETE CASCADE,
                user_name TEXT,
                comment_text TEXT,
                comment_time BIGINT
            )
        `);

        console.log('📦 Database tables ready');
        
        const result = await pool.query('SELECT COUNT(*) FROM apks');
        if (parseInt(result.rows[0].count) === 0) {
            await insertSampleData();
        }
    } catch (error) {
        console.error('Database init error:', error);
    }
}

// ============================================================
//  SAMPLE DATA
// ============================================================
async function insertSampleData() {
    try {
        const samples = [
            {
                id: '1',
                title: 'CapCut Pro v18.5.0 (Premium Unlocked)',
                category: 'video-players',
                version: '18.5.0',
                size: '280 MB',
                android: '5.0+',
                developer: 'Bytedance',
                modinfo: 'Premium Unlocked',
                description: 'CapCut Pro Premium Unlocked has become a go-to choice for people who create videos directly from their phones...',
                icon: '',
                downloadlink: 'https://example.com/capcut-pro.apk',
                views: 2847,
                downloads: 1253,
                viewedSessions: [],
                createdat: Date.now() - 86400000
            },
            {
                id: '2',
                title: 'Download Diskwala Premium',
                category: 'apps',
                version: '2.5.0',
                size: '45 MB',
                android: '5.0+',
                developer: 'Diskwala',
                modinfo: 'Premium Unlocked',
                description: 'Diskwala is a powerful download manager that supports multiple downloads...',
                icon: '',
                downloadlink: 'https://example.com/diskwala-premium.apk',
                views: 1953,
                downloads: 876,
                viewedSessions: [],
                createdat: Date.now() - 172800000
            },
            {
                id: '3',
                title: 'Graph Messenger v12.8.1.1 (Premium)',
                category: 'communication',
                version: '12.8.1.1',
                size: '62 MB',
                android: '5.0+',
                developer: 'Graph Team',
                modinfo: 'Premium Unlocked',
                description: 'Graph Messenger is a feature-rich messaging app with advanced privacy features...',
                icon: '',
                downloadlink: 'https://example.com/graph-messenger.apk',
                views: 1421,
                downloads: 543,
                viewedSessions: [],
                createdat: Date.now() - 259200000
            },
            {
                id: '4',
                title: 'Bobble AI Keyboard v10.7.1 (Premium)',
                category: 'personalization',
                version: '10.7.1',
                size: '38 MB',
                android: '5.0+',
                developer: 'Bobble AI',
                modinfo: 'Premium Unlocked',
                description: 'Bobble AI Keyboard is an intelligent keyboard with AI-powered suggestions...',
                icon: '',
                downloadlink: 'https://example.com/bobble-keyboard.apk',
                views: 876,
                downloads: 412,
                viewedSessions: [],
                createdat: Date.now() - 345600000
            }
        ];

        for (const apk of samples) {
            await pool.query(`
                INSERT INTO apks (
                    id, title, category, version, size, android, 
                    developer, modinfo, description, icon, downloadlink, 
                    views, downloads, viewedSessions, createdat
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            `, [
                apk.id, apk.title, apk.category, apk.version, apk.size, apk.android,
                apk.developer, apk.modinfo, apk.description, apk.icon, apk.downloadlink,
                apk.views, apk.downloads, apk.viewedSessions, apk.createdat
            ]);
        }
        console.log('📦 Sample data inserted into PostgreSQL');
    } catch (error) {
        console.error('Sample data error:', error);
    }
}

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
//  API ENDPOINTS
// ============================================================

// Get all APKs
app.get('/api/apks', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, 
                   COALESCE(json_agg(json_build_object('user', c.user_name, 'text', c.comment_text, 'time', c.comment_time)) 
                   FILTER (WHERE c.id IS NOT NULL), '[]') as comments
            FROM apks a
            LEFT JOIN comments c ON a.id = c.apk_id
            GROUP BY a.id
            ORDER BY a.createdat DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching APKs:', error);
        res.status(500).json({ error: 'Failed to fetch APKs' });
    }
});

// Get single APK
app.get('/api/apks/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, 
                   COALESCE(json_agg(json_build_object('user', c.user_name, 'text', c.comment_text, 'time', c.comment_time)) 
                   FILTER (WHERE c.id IS NOT NULL), '[]') as comments
            FROM apks a
            LEFT JOIN comments c ON a.id = c.apk_id
            WHERE a.id = $1
            GROUP BY a.id
        `, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'APK not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching APK:', error);
        res.status(500).json({ error: 'Failed to fetch APK' });
    }
});

// Add/Update APK
app.post('/api/apks', upload.fields([{ name: 'icon', maxCount: 1 }]), async (req, res) => {
    try {
        const { id, title, category, version, size, android, developer, description, downloadLink, iconData } = req.body;

        let iconUrl = '';
        if (req.files && req.files.icon && req.files.icon[0]) {
            iconUrl = '/uploads/' + req.files.icon[0].filename;
        } else if (iconData && iconData.startsWith('data:image')) {
            iconUrl = iconData;
        }

        if (id && id !== '') {
            const existing = await pool.query('SELECT views, downloads, viewedSessions FROM apks WHERE id = $1', [id]);
            if (existing.rows.length === 0) {
                return res.status(404).json({ error: 'APK not found' });
            }
            
            await pool.query(`
                UPDATE apks SET 
                    title = $1, category = $2, version = $3, size = $4, 
                    android = $5, developer = $6, description = $7, icon = $8, downloadlink = $9
                WHERE id = $10
            `, [title, category || 'apps', version || '1.0', size || '10 MB', 
                android || '5.0+', developer || 'Unknown', description || '', iconUrl, downloadLink || '', id]);
            
            const result = await pool.query('SELECT * FROM apks WHERE id = $1', [id]);
            res.json({ success: true, apk: result.rows[0] });
        } else {
            const newId = uuidv4();
            await pool.query(`
                INSERT INTO apks (
                    id, title, category, version, size, android, 
                    developer, modinfo, description, icon, downloadlink, 
                    views, downloads, viewedSessions, createdat
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            `, [newId, title, category || 'apps', version || '1.0', size || '10 MB', 
                android || '5.0+', developer || 'Unknown', 'Premium Unlocked', 
                description || '', iconUrl, downloadLink || '', 0, 0, [], Date.now()]);
            
            const result = await pool.query('SELECT * FROM apks WHERE id = $1', [newId]);
            res.json({ success: true, apk: result.rows[0] });
        }
    } catch (error) {
        console.error('Error saving APK:', error);
        res.status(500).json({ error: 'Failed to save APK' });
    }
});

// Delete APK
app.delete('/api/apks/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM apks WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'APK not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting APK:', error);
        res.status(500).json({ error: 'Failed to delete APK' });
    }
});

// Track view
app.post('/api/apks/:id/view', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        const result = await pool.query(
            'SELECT viewedSessions FROM apks WHERE id = $1',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'APK not found' });
        }
        
        const viewedSessions = result.rows[0].viewedsessions || [];
        if (!viewedSessions.includes(sessionId)) {
            viewedSessions.push(sessionId);
            await pool.query(
                'UPDATE apks SET views = views + 1, viewedSessions = $1 WHERE id = $2',
                [viewedSessions, req.params.id]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking view:', error);
        res.status(500).json({ error: 'Failed to track view' });
    }
});

// Track download
app.post('/api/apks/:id/download', async (req, res) => {
    try {
        await pool.query(
            'UPDATE apks SET downloads = downloads + 1 WHERE id = $1',
            [req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking download:', error);
        res.status(500).json({ error: 'Failed to track download' });
    }
});

// Add comment
app.post('/api/apks/:id/comment', async (req, res) => {
    try {
        const { user, text } = req.body;
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Comment cannot be empty' });
        }

        await pool.query(
            'INSERT INTO comments (apk_id, user_name, comment_text, comment_time) VALUES ($1, $2, $3, $4)',
            [req.params.id, user || 'User', text.trim(), Date.now()]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get stats
app.get('/api/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as totalApks,
                COALESCE(SUM(views), 0) as totalViews,
                COALESCE(SUM(downloads), 0) as totalDownloads,
                (SELECT COUNT(*) FROM comments) as totalComments
            FROM apks
        `);
        res.json({
            totalApks: parseInt(result.rows[0].totalapks),
            totalViews: parseInt(result.rows[0].totalviews),
            totalDownloads: parseInt(result.rows[0].totaldownloads),
            totalComments: parseInt(result.rows[0].totalcomments),
            activeUsers: 0
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Get categories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT category, COUNT(*) as count FROM apks GROUP BY category'
        );
        const categories = {};
        result.rows.forEach(row => {
            categories[row.category] = parseInt(row.count);
        });
        res.json(categories);
    } catch (error) {
        console.error('Error getting categories:', error);
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
    ║   📱 MODSCOM Server Started!                            ║
    ║                                                          ║
    ║   🌐 http://localhost:${PORT}                             ║
    ║                                                          ║
    ║   🗄️  PostgreSQL Connected - DATA IS PERMANENT!         ║
    ║                                                          ║
    ║   🔑 Admin Access: http://localhost:${PORT}#x7K9mP2qL4nR8 ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
    `);
});
