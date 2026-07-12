// ============================================================
//  DETAIL PAGE - GETMODAPKS STYLE
// ============================================================

const API_URL = '/api';

// Get APK ID from URL
const urlParams = new URLSearchParams(window.location.search);
const apkId = urlParams.get('id');

// Session ID for tracking
let sessionId = localStorage.getItem('viewer_session_id');
if (!sessionId) {
    sessionId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('viewer_session_id', sessionId);
}

// Category name mapping
const categoryNames = {
    'apps': 'Apps',
    'games': 'Games',
    'mods': 'Mods',
    'tools': 'Tools',
    'video-players': 'Video Players & Editors',
    'music-audio': 'Music & Audio',
    'communication': 'Communication',
    'personalization': 'Personalization'
};

// ============================================================
//  DOM REFS
// ============================================================
const detailContent = document.getElementById('detailContent');
const commentList = document.getElementById('commentList');
const commentInput = document.getElementById('commentInput');
const commentName = document.getElementById('commentName');
const commentSubmitBtn = document.getElementById('commentSubmitBtn');
const detailCommentCount = document.getElementById('detailCommentCount');
const breadcrumbCategory = document.getElementById('breadcrumbCategory');
const breadcrumbTitle = document.getElementById('breadcrumbTitle');

// ============================================================
//  API FUNCTIONS
// ============================================================
async function fetchAPK(id) {
    try {
        const response = await fetch(API_URL + '/apks/' + id);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'APK not found');
        }
        return data;
    } catch (error) {
        console.error('Error fetching APK:', error);
        return null;
    }
}

async function trackView(id) {
    try {
        await fetch(API_URL + '/apks/' + id + '/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        });
    } catch (error) {
        console.error('Error tracking view:', error);
    }
}

async function trackDownload(id) {
    try {
        await fetch(API_URL + '/apks/' + id + '/download', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error tracking download:', error);
    }
}

async function addComment(id, user, text) {
    try {
        const response = await fetch(API_URL + '/apks/' + id + '/comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, text })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error adding comment:', error);
        return false;
    }
}

// ============================================================
//  RENDER DETAIL
// ============================================================
function renderDetail(apk) {
    if (!apk) {
        detailContent.innerHTML = `
            <div class="detail-card">
                <div class="detail-error" style="text-align:center;padding:60px 20px;">
                    <i class="fas fa-exclamation-circle" style="font-size:4rem;color:#ef4444;margin-bottom:16px;"></i>
                    <h2>APK Not Found</h2>
                    <p style="color:var(--text-muted);margin-bottom:20px;">The APK you're looking for doesn't exist.</p>
                    <a href="/" class="btn-back" style="display:inline-flex;align-items:center;gap:10px;padding:10px 24px;background:var(--accent);color:#fff;border-radius:30px;font-weight:600;transition:0.3s;">
                        <i class="fas fa-arrow-left"></i> Go Back Home
                    </a>
                </div>
            </div>
        `;
        return;
    }

    const categoryName = categoryNames[apk.category] || apk.category || 'Apps';
    const developer = apk.developer || 'Unknown';
    const modInfo = apk.modInfo || 'Premium Unlocked';

    // Update breadcrumb
    breadcrumbCategory.textContent = categoryName;
    breadcrumbTitle.textContent = apk.title;

    detailContent.innerHTML = `
        <div class="detail-card">
            <div class="detail-header">
                <div class="detail-icon">
                    ${apk.icon ? `<img src="${apk.icon}" alt="${apk.title}" />` : `<span class="no-icon"><i class="fas fa-android"></i></span>`}
                </div>
                <div class="detail-title-section">
                    <h1>${escapeHtml(apk.title)}</h1>
                    <div class="detail-published">
                        <i class="fas fa-user"></i> ${escapeHtml(developer)} 
                        <i class="fas fa-calendar" style="margin-left:12px;"></i> ${formatDate(apk.createdAt)}
                    </div>
                    <div class="detail-tags">
                        <span><i class="fas fa-tag"></i> ${escapeHtml(categoryName)}</span>
                        <span><i class="fas fa-fire"></i> ${escapeHtml(modInfo)}</span>
                        <span><i class="fas fa-download"></i> ${(apk.downloads || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div class="detail-body">
                <div class="detail-stats">
                    <span><i class="fas fa-eye"></i> ${(apk.views || 0).toLocaleString()} views</span>
                    <span><i class="fas fa-download"></i> ${(apk.downloads || 0).toLocaleString()} downloads</span>
                    <span><i class="fas fa-comment"></i> ${(apk.comments || []).length} comments</span>
                </div>

                <!-- Table of Contents -->
                <div class="detail-toc">
                    <h3><i class="fas fa-list"></i> Table of Contents</h3>
                    <ul>
                        <li><a href="#about-app">About App</a></li>
                        <li><a href="#app-info">App Info</a></li>
                        <li><a href="#download">Download</a></li>
                        <li><a href="#comments">Comments</a></li>
                    </ul>
                </div>

                <!-- About App -->
                <div class="detail-description" id="about-app">
                    <h3><i class="fas fa-align-left"></i> About App</h3>
                    <p>${escapeHtml(apk.description || 'No description available.')}</p>
                </div>

                <!-- App Info Table -->
                <div class="app-info-table" id="app-info">
                    <table>
                        <tr><td>App Name</td><td>${escapeHtml(apk.title)}</td></tr>
                        <tr><td>Latest Version</td><td>${escapeHtml(apk.version || '1.0')}</td></tr>
                        <tr><td>Size</td><td>${escapeHtml(apk.size || '10 MB')}</td></tr>
                        <tr><td>Category</td><td>${escapeHtml(categoryName)}</td></tr>
                        <tr><td>Developer</td><td>${escapeHtml(developer)}</td></tr>
                        <tr><td>Mod Info</td><td>${escapeHtml(modInfo)}</td></tr>
                    </table>
                </div>

                <!-- Download Section -->
                <div class="detail-download" id="download">
                    ${apk.downloadLink && apk.downloadLink.trim() !== '' ? `
                        <a href="${apk.downloadLink}" class="btn-download-main" target="_blank" rel="noopener noreferrer" onclick="trackDownload('${apk.id}')">
                            <i class="fas fa-download"></i> Download
                            <span class="size-tag">Opens in new tab</span>
                        </a>
                    ` : `
                        <div class="btn-download-disabled" style="display:inline-flex;align-items:center;gap:12px;padding:16px 44px;background:#e2e8f0;color:#94a3b8;border-radius:12px;font-weight:700;font-size:1.1rem;cursor:not-allowed;">
                            <i class="fas fa-download"></i> No Download Link Available
                        </div>
                    `}
                </div>

                <!-- Telegram -->
                <div class="detail-telegram">
                    <a href="https://t.me/modsowner_bot" target="_blank">
                        <i class="fab fa-telegram"></i> JOIN @GOLDMODSAPK ON TELEGRAM
                    </a>
                </div>
            </div>
        </div>
    `;

    // Update comments
    const comments = apk.comments || [];
    detailCommentCount.textContent = comments.length;

    if (comments.length === 0) {
        commentList.innerHTML = `
            <div style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.85rem;">
                <i class="fas fa-comment" style="opacity:0.3;"></i> No comments yet. Be the first!
            </div>
        `;
    } else {
        commentList.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-user">
                    <i class="fas fa-user-circle"></i> ${escapeHtml(c.user || 'Anonymous')}
                    <span class="time"><i class="far fa-clock"></i> ${formatTime(c.time)}</span>
                </div>
                <div class="comment-text">${escapeHtml(c.text)}</div>
            </div>
        `).join('');
    }

    // Store current APK ID for comments
    window.currentDetailId = apk.id;
    window.currentApk = apk;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function formatTime(time) {
    if (!time) return 'Just now';
    const date = new Date(time);
    const now = Date.now();
    const diff = Math.floor((now - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return date.toLocaleDateString();
}

// ============================================================
//  COMMENTS
// ============================================================
commentSubmitBtn.addEventListener('click', async () => {
    const text = commentInput.value.trim();
    const name = commentName.value.trim() || 'User';
    if (!text || !window.currentDetailId) return;

    const success = await addComment(window.currentDetailId, name, text);
    if (success) {
        commentInput.value = '';
        const apk = await fetchAPK(window.currentDetailId);
        if (apk) {
            renderDetail(apk);
        }
    }
});

commentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commentSubmitBtn.click();
});

// ============================================================
//  SEARCH
// ============================================================
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        window.location.href = '/?search=' + encodeURIComponent(query);
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// ============================================================
//  EXPOSE FUNCTIONS
// ============================================================
window.trackDownload = trackDownload;

// ============================================================
//  INIT
// ============================================================
async function init() {
    if (!apkId) {
        detailContent.innerHTML = `
            <div class="detail-card">
                <div class="detail-error" style="text-align:center;padding:60px 20px;">
                    <i class="fas fa-exclamation-circle" style="font-size:4rem;color:#ef4444;margin-bottom:16px;"></i>
                    <h2>No APK Selected</h2>
                    <p style="color:var(--text-muted);margin-bottom:20px;">Please go back and select an APK.</p>
                    <a href="/" class="btn-back" style="display:inline-flex;align-items:center;gap:10px;padding:10px 24px;background:var(--accent);color:#fff;border-radius:30px;font-weight:600;transition:0.3s;">
                        <i class="fas fa-arrow-left"></i> Go Back Home
                    </a>
                </div>
            </div>
        `;
        return;
    }

    detailContent.innerHTML = `
        <div class="detail-card">
            <div class="detail-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading APK details...</p>
            </div>
        </div>
    `;

    const apk = await fetchAPK(apkId);
    if (apk) {
        await trackView(apkId);
        renderDetail(apk);
    } else {
        detailContent.innerHTML = `
            <div class="detail-card">
                <div class="detail-error" style="text-align:center;padding:60px 20px;">
                    <i class="fas fa-exclamation-circle" style="font-size:4rem;color:#ef4444;margin-bottom:16px;"></i>
                    <h2>APK Not Found</h2>
                    <p style="color:var(--text-muted);margin-bottom:20px;">The APK you're looking for doesn't exist.</p>
                    <a href="/" class="btn-back" style="display:inline-flex;align-items:center;gap:10px;padding:10px 24px;background:var(--accent);color:#fff;border-radius:30px;font-weight:600;transition:0.3s;">
                        <i class="fas fa-arrow-left"></i> Go Back Home
                    </a>
                </div>
            </div>
        `;
    }
}

init();

console.log('📱 Detail Page - GETMODAPKS Style Loaded');
