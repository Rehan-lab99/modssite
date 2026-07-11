// ============================================================
//  CONFIGURATION
// ============================================================
const ADMIN_PASSWORD = 'Xy9#mP2$qL4@nR8vW3z';
const SECRET_KEY = 'x7K9mP2qL4nR8vW3zT6yH5jF2aB8cD1e';
const API_URL = '/api';

// ============================================================
//  STATE
// ============================================================
let isAdminUnlocked = false;
let currentCategory = 'all';
let searchQuery = '';
let currentDetailId = null;
let apksData = [];
let sessionId = localStorage.getItem('viewer_session_id');
if (!sessionId) {
    sessionId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('viewer_session_id', sessionId);
}

// Category name mapping
const categoryNames = {
    'all': 'Latest APKs',
    'art-design': 'Art & Design',
    'auto-vehicles': 'Auto & Vehicles',
    'beauty': 'Beauty',
    'books-reference': 'Books & Reference',
    'business': 'Business',
    'comics': 'Comics',
    'communication': 'Communication',
    'dating': 'Dating',
    'education': 'Education',
    'emulator': 'Emulator',
    'entertainment': 'Entertainment',
    'events': 'Events',
    'finance': 'Finance',
    'food-drink': 'Food & Drink',
    'health-fitness': 'Health & Fitness',
    'house-home': 'House & Home',
    'libraries-demo': 'Libraries & Demo',
    'lifestyle': 'Lifestyle',
    'maps-navigation': 'Maps & Navigation',
    'medical': 'Medical',
    'music-audio': 'Music & Audio',
    'news-magazines': 'News & Magazines',
    'parenting': 'Parenting',
    'personalization': 'Personalization',
    'photography': 'Photography',
    'productivity': 'Productivity',
    'shopping': 'Shopping',
    'social': 'Social',
    'sport': 'Sports',
    'tools': 'Tools',
    'travel-local': 'Travel & Local',
    'video-players': 'Video Players & Editors',
    'weather': 'Weather'
};

// ============================================================
//  DOM REFS
// ============================================================
const grid = document.getElementById('apkGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const catTabs = document.querySelectorAll('.category-grid .cat-tab');
const adminPanel = document.getElementById('secretAdminPanel');
const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');
const resultCount = document.getElementById('resultCount');
const totalCount = document.getElementById('totalCount');
const categoryTitle = document.getElementById('categoryTitle');

const adminStatsContainer = document.getElementById('adminStatsContainer');

const contentForm = document.getElementById('contentForm');
const editId = document.getElementById('editId');
const titleInput = document.getElementById('title');
const categorySelect = document.getElementById('category');
const versionInput = document.getElementById('version');
const sizeInput = document.getElementById('size');
const androidInput = document.getElementById('android');
const descInput = document.getElementById('description');
const downloadLinkInput = document.getElementById('downloadLink');
const iconInput = document.getElementById('iconInput');
const iconPreview = document.getElementById('iconPreview');
const previewImg = document.getElementById('previewImg');
const iconData = document.getElementById('iconData');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

const detailOverlay = document.getElementById('detailOverlay');
const detailTitle = document.getElementById('detailTitle');
const detailCategory = document.getElementById('detailCategory');
const detailVersion = document.getElementById('detailVersion');
const detailSize = document.getElementById('detailSize');
const detailAndroid = document.getElementById('detailAndroid');
const detailDesc = document.getElementById('detailDesc');
const detailViews = document.getElementById('detailViews');
const detailDownloads = document.getElementById('detailDownloads');
const detailCommentCount = document.getElementById('detailCommentCount');
const detailCommentCount2 = document.getElementById('detailCommentCount2');
const detailIconImg = document.getElementById('detailIconImg');
const detailNoIcon = document.querySelector('.detail-icon .no-icon');
const detailDownloadBtn = document.getElementById('detailDownloadBtn');
const commentList = document.getElementById('commentList');
const commentInput = document.getElementById('commentInput');
const commentName = document.getElementById('commentName');
const commentSubmitBtn = document.getElementById('commentSubmitBtn');
const detailEditBtn = document.getElementById('detailEditBtn');
const detailDeleteBtn = document.getElementById('detailDeleteBtn');
const detailCloseBtn = document.getElementById('detailCloseBtn');
const detailCloseBtn2 = document.getElementById('detailCloseBtn2');

const adminLoginPage = document.getElementById('adminLoginPage');
const adminLoginPassword = document.getElementById('adminLoginPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginError = document.getElementById('adminLoginError');
const adminLoginCancel = document.getElementById('adminLoginCancel');

// ============================================================
//  API FUNCTIONS
// ============================================================
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(API_URL + endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

async function loadAPKs() {
    const data = await apiFetch('/apks');
    if (data) {
        apksData = data;
        render();
        if (isAdminUnlocked) {
            updateAdminStats();
        }
        updateTopDownloads();
    }
}

async function saveAPK(formData) {
    try {
        const response = await fetch(API_URL + '/apks', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            await loadAPKs();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Save error:', error);
        return false;
    }
}

async function deleteAPK(id) {
    const data = await apiFetch('/apks/' + id, { method: 'DELETE' });
    if (data && data.success) {
        await loadAPKs();
        return true;
    }
    return false;
}

async function trackView(id) {
    await apiFetch('/apks/' + id + '/view', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
    });
}

async function trackDownload(id) {
    await apiFetch('/apks/' + id + '/download', { method: 'POST' });
}

async function addComment(id, user, text) {
    const data = await apiFetch('/apks/' + id + '/comment', {
        method: 'POST',
        body: JSON.stringify({ user, text })
    });
    return data && data.success;
}

async function getStats() {
    const data = await apiFetch('/stats');
    return data;
}

// ============================================================
//  UPDATE TOP DOWNLOADS
// ============================================================
function updateTopDownloads() {
    const container = document.getElementById('topDownloadsList');
    const sorted = [...apksData].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    const top5 = sorted.slice(0, 5);

    if (top5.length === 0) {
        container.innerHTML = '<li>No downloads yet</li>';
        return;
    }

    container.innerHTML = top5.map(apk => `
        <li><a href="#" onclick="openDetail('${apk.id}'); return false;">
            <i class="fas fa-download"></i> ${apk.title}
            <span style="float:right;color:var(--accent);">${(apk.downloads || 0)}</span>
        </a></li>
    `).join('');
}

// ============================================================
//  UPDATE ADMIN STATS
// ============================================================
async function updateAdminStats() {
    if (!isAdminUnlocked) {
        adminStatsContainer.style.display = 'none';
        return;
    }

    adminStatsContainer.style.display = 'block';
    const stats = await getStats();
    if (stats) {
        document.getElementById('statApks').textContent = stats.totalApks;
        document.getElementById('statViews').textContent = stats.totalViews.toLocaleString();
        document.getElementById('statDownloads').textContent = stats.totalDownloads.toLocaleString();
        document.getElementById('statComments').textContent = stats.totalComments;
        document.getElementById('statUsers').textContent = stats.activeUsers;

        document.getElementById('dashApks').textContent = stats.totalApks;
        document.getElementById('dashViews').textContent = stats.totalViews.toLocaleString();
        document.getElementById('dashDownloads').textContent = stats.totalDownloads.toLocaleString();
        document.getElementById('dashComments').textContent = stats.totalComments;
        totalCount.textContent = stats.totalApks;
    }
}

// ============================================================
//  RENDER
// ============================================================
function render() {
    let filtered = apksData;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(a => a.category === currentCategory);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
        filtered = filtered.filter(a =>
            a.title.toLowerCase().includes(q) ||
            (a.description && a.description.toLowerCase().includes(q)) ||
            (a.category && a.category.toLowerCase().includes(q))
        );
    }

    // Update category title
    categoryTitle.textContent = categoryNames[currentCategory] || 'Latest APKs';
    resultCount.textContent = `Showing ${filtered.length} results`;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-android"></i>
                <h3>No APKs found</h3>
                <p>${isAdminUnlocked ? 'Add your first APK using the Admin panel.' : 'Check back later for new APKs!'}</p>
            </div>
        `;
        return;
    }

    filtered.sort((a, b) => b.createdAt - a.createdAt);

    grid.innerHTML = filtered.map(apk => `
        <div class="apk-card" data-id="${apk.id}">
            <div class="apk-icon">
                ${apk.icon ? `<img src="${apk.icon}" alt="${apk.title}" loading="lazy" />` : `<span class="no-icon"><i class="fas fa-android"></i></span>`}
            </div>
            <div class="apk-info">
                <h3>${escapeHtml(apk.title)}</h3>
                <div class="meta">
                    <span><i class="fas fa-tag"></i> ${escapeHtml(categoryNames[apk.category] || apk.category || 'Apps')}</span>
                    <span><i class="fas fa-code-branch"></i> ${escapeHtml(apk.version || '1.0')}</span>
                    <span><i class="fas fa-hdd"></i> ${escapeHtml(apk.size || '10 MB')}</span>
                </div>
            </div>
            <div class="apk-downloads">
                <i class="fas fa-download"></i> ${(apk.downloads || 0).toLocaleString()}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.apk-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            openDetail(id);
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
//  DETAIL OVERLAY
// ============================================================
async function openDetail(id) {
    const apk = apksData.find(a => a.id === id);
    if (!apk) return;

    currentDetailId = id;

    await trackView(id);

    await loadAPKs();
    const updatedApk = apksData.find(a => a.id === id);
    if (!updatedApk) return;

    detailTitle.textContent = updatedApk.title;
    detailCategory.textContent = categoryNames[updatedApk.category] || updatedApk.category || 'Apps';
    detailVersion.textContent = updatedApk.version || '1.0';
    detailSize.textContent = updatedApk.size || '10 MB';
    detailAndroid.textContent = updatedApk.android || '5.0+';
    detailDesc.textContent = updatedApk.description || 'No description available.';
    detailViews.textContent = (updatedApk.views || 0).toLocaleString();
    detailDownloads.textContent = (updatedApk.downloads || 0).toLocaleString();

    if (updatedApk.icon) {
        detailIconImg.src = updatedApk.icon;
        detailIconImg.style.display = 'block';
        detailNoIcon.style.display = 'none';
    } else {
        detailIconImg.style.display = 'none';
        detailNoIcon.style.display = 'flex';
    }

    if (updatedApk.downloadLink && updatedApk.downloadLink.trim() !== '') {
        detailDownloadBtn.href = updatedApk.downloadLink;
        detailDownloadBtn.style.display = 'inline-flex';
        detailDownloadBtn.onclick = () => {
            trackDownload(id);
        };
    } else {
        detailDownloadBtn.style.display = 'none';
    }

    const comments = updatedApk.comments || [];
    detailCommentCount.textContent = comments.length;
    detailCommentCount2.textContent = comments.length;

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

    detailOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeDetail() {
    detailOverlay.classList.remove('visible');
    document.body.style.overflow = '';
    currentDetailId = null;
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

detailCloseBtn.addEventListener('click', closeDetail);
detailCloseBtn2.addEventListener('click', closeDetail);
detailOverlay.addEventListener('click', (e) => {
    if (e.target === detailOverlay) closeDetail();
});

// ============================================================
//  COMMENTS
// ============================================================
commentSubmitBtn.addEventListener('click', async () => {
    const text = commentInput.value.trim();
    const name = commentName.value.trim() || 'User';
    if (!text || !currentDetailId) return;

    const success = await addComment(currentDetailId, name, text);
    if (success) {
        commentInput.value = '';
        await loadAPKs();
        await openDetail(currentDetailId);
    }
});

commentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commentSubmitBtn.click();
});

// ============================================================
//  ADMIN LOGIN
// ============================================================
function checkSecretURL() {
    const hash = window.location.hash.replace('#', '');
    if (hash === SECRET_KEY) {
        adminLoginPage.classList.add('visible');
        adminLoginPassword.focus();
        history.pushState('', document.title, window.location.pathname + window.location.search);
        return true;
    }
    return false;
}

checkSecretURL();
window.addEventListener('hashchange', checkSecretURL);

let loginAttempts = 0;
const MAX_ATTEMPTS = 5;

function doAdminLogin() {
    if (loginAttempts >= MAX_ATTEMPTS) {
        alert('⚠️ Too many failed attempts. Please refresh the page.');
        return;
    }

    if (adminLoginPassword.value === ADMIN_PASSWORD) {
        isAdminUnlocked = true;
        sessionStorage.setItem('adminUnlocked', 'true');
        adminLoginPage.classList.remove('visible');
        adminPanel.classList.add('visible');
        
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.add('visible');
        });
        
        adminStatsContainer.style.display = 'block';
        
        resetForm();
        updateAdminStats();
        adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        loginAttempts = 0;
    } else {
        loginAttempts++;
        adminLoginError.style.display = 'block';
        adminLoginError.textContent = `❌ Incorrect password. Attempts remaining: ${MAX_ATTEMPTS - loginAttempts}`;
        adminLoginPassword.value = '';
        adminLoginPassword.focus();
    }
}

adminLoginBtn.addEventListener('click', doAdminLogin);
adminLoginPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doAdminLogin();
});
adminLoginCancel.addEventListener('click', () => {
    adminLoginPage.classList.remove('visible');
    history.pushState('', document.title, window.location.pathname + window.location.search);
});

if (sessionStorage.getItem('adminUnlocked') === 'true') {
    isAdminUnlocked = true;
    adminPanel.classList.add('visible');
    document.querySelectorAll('.admin-only').forEach(el => {
        el.classList.add('visible');
    });
    adminStatsContainer.style.display = 'block';
    updateAdminStats();
}

// ============================================================
//  CRUD - ADMIN ONLY
// ============================================================
function openEditForm(id) {
    const apk = apksData.find(a => a.id === id);
    if (!apk) return;

    editId.value = apk.id;
    titleInput.value = apk.title;
    categorySelect.value = apk.category;
    versionInput.value = apk.version || '';
    sizeInput.value = apk.size || '';
    androidInput.value = apk.android || '';
    descInput.value = apk.description || '';
    downloadLinkInput.value = apk.downloadLink || '';

    if (apk.icon && !apk.icon.startsWith('/uploads/')) {
        iconData.value = apk.icon;
        previewImg.src = apk.icon;
        iconPreview.classList.add('visible');
    } else if (apk.icon) {
        iconData.value = '';
        previewImg.src = apk.icon;
        iconPreview.classList.add('visible');
    } else {
        iconData.value = '';
        iconPreview.classList.remove('visible');
    }

    saveBtn.innerHTML = '<i class="fas fa-edit"></i> Update';
    if (!adminPanel.classList.contains('visible')) {
        adminPanel.classList.add('visible');
    }
    adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
    editId.value = '';
    titleInput.value = '';
    categorySelect.value = 'art-design';
    versionInput.value = '';
    sizeInput.value = '';
    androidInput.value = '';
    descInput.value = '';
    downloadLinkInput.value = '';
    iconData.value = '';
    iconPreview.classList.remove('visible');
    iconInput.value = '';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Add / Update';
}

iconInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        iconData.value = dataUrl;
        previewImg.src = dataUrl;
        iconPreview.classList.add('visible');
    };
    reader.readAsDataURL(file);
});

contentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    if (!title) {
        alert('Title is required.');
        return;
    }

    const downloadLink = downloadLinkInput.value.trim();
    if (!downloadLink) {
        alert('Download link is required.');
        return;
    }

    const formData = new FormData();
    formData.append('id', editId.value);
    formData.append('title', title);
    formData.append('category', categorySelect.value);
    formData.append('version', versionInput.value.trim());
    formData.append('size', sizeInput.value.trim());
    formData.append('android', androidInput.value.trim());
    formData.append('description', descInput.value.trim());
    formData.append('downloadLink', downloadLink);

    if (iconInput.files && iconInput.files[0]) {
        formData.append('icon', iconInput.files[0]);
    } else if (iconData.value && iconData.value.startsWith('data:image')) {
        formData.append('iconData', iconData.value);
    } else {
        formData.append('iconData', '');
    }

    const success = await saveAPK(formData);
    if (success) {
        resetForm();
        await loadAPKs();
        if (isAdminUnlocked) updateAdminStats();
    } else {
        alert('Failed to save APK. Please try again.');
    }
});

resetBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
});

clearAllBtn.addEventListener('click', async () => {
    if (confirm('⚠️ Delete ALL APKs? This cannot be undone.')) {
        for (const apk of apksData) {
            await deleteAPK(apk.id);
        }
        await loadAPKs();
        resetForm();
        if (isAdminUnlocked) updateAdminStats();
    }
});

closeAdminPanelBtn.addEventListener('click', () => {
    adminPanel.classList.remove('visible');
});

// ============================================================
//  DETAIL EDIT/DELETE - ADMIN ONLY
// ============================================================
detailEditBtn.addEventListener('click', () => {
    if (currentDetailId) {
        if (!isAdminUnlocked) {
            alert('⚠️ Admin access required.');
            return;
        }
        closeDetail();
        openEditForm(currentDetailId);
    }
});

detailDeleteBtn.addEventListener('click', async () => {
    if (currentDetailId && confirm('Delete this APK?')) {
        if (!isAdminUnlocked) {
            alert('⚠️ Admin access required.');
            return;
        }
        await deleteAPK(currentDetailId);
        closeDetail();
        await loadAPKs();
        if (isAdminUnlocked) updateAdminStats();
    }
});

// ============================================================
//  SEARCH & CATEGORY
// ============================================================
searchBtn.addEventListener('click', () => {
    searchQuery = searchInput.value;
    render();
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        searchQuery = searchInput.value;
        render();
    }
});

catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        catTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.cat;
        render();
        // Scroll to top of results
        document.querySelector('.section-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ============================================================
//  AUTO-SYNC
// ============================================================
let lastSync = 0;

async function syncData() {
    const now = Date.now();
    if (now - lastSync > 5000) {
        await loadAPKs();
        lastSync = now;
    }
}

setInterval(syncData, 5000);

// ============================================================
//  KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (detailOverlay.classList.contains('visible')) closeDetail();
        if (adminLoginPage.classList.contains('visible')) {
            adminLoginPage.classList.remove('visible');
        }
    }
});

// ============================================================
//  AUTO-LOGOUT
// ============================================================
let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (isAdminUnlocked) {
            sessionStorage.removeItem('adminUnlocked');
            isAdminUnlocked = false;
            adminPanel.classList.remove('visible');
            document.querySelectorAll('.admin-only').forEach(el => {
                el.classList.remove('visible');
            });
            adminStatsContainer.style.display = 'none';
            alert('⏰ Auto-logged out due to inactivity.');
            location.reload();
        }
    }, 30 * 60 * 1000);
}

['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer);
});

// ============================================================
//  EXPOSE FUNCTIONS FOR HTML onclick
// ============================================================
window.openDetail = openDetail;

// ============================================================
//  INIT
// ============================================================
loadAPKs();

console.log('📱 ModsCom - LiteAPKS Style Loaded');
console.log('🔑 Admin Password: ' + ADMIN_PASSWORD);
console.log('🔐 Secret URL: Add #' + SECRET_KEY + ' to the URL');
console.log('📌 Example: ' + window.location.href.split('#')[0] + '#' + SECRET_KEY);
console.log('📂 Categories: 30+ categories available');
console.log('👤 Users: Browse, Download & Comment');
console.log('👑 Admin: Full control with STATS');
console.log('🔄 Auto-sync every 5 seconds for REAL-TIME updates');
