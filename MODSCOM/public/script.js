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
let apksData = [];
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
const latestGrid = document.getElementById('latestGrid');
const hotGrid = document.getElementById('hotGrid');
const allGrid = document.getElementById('allGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const adminPanel = document.getElementById('secretAdminPanel');
const closeAdminPanelBtn = document.getElementById('closeAdminPanelBtn');
const resultCount = document.getElementById('resultCount');
const totalCount = document.getElementById('totalCount');

const adminStatsContainer = document.getElementById('adminStatsContainer');

const contentForm = document.getElementById('contentForm');
const editId = document.getElementById('editId');
const titleInput = document.getElementById('title');
const categorySelect = document.getElementById('category');
const versionInput = document.getElementById('version');
const sizeInput = document.getElementById('size');
const developerInput = document.getElementById('developer');
const descInput = document.getElementById('description');
const downloadLinkInput = document.getElementById('downloadLink');
const iconInput = document.getElementById('iconInput');
const iconPreview = document.getElementById('iconPreview');
const previewImg = document.getElementById('previewImg');
const iconData = document.getElementById('iconData');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

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

async function getStats() {
    const data = await apiFetch('/stats');
    return data;
}

// ============================================================
//  TELEGRAM FUNCTION
// ============================================================
function openTelegram() {
    window.open('https://t.me/modscom18', '_blank');
}

// ============================================================
//  FILTER CATEGORY
// ============================================================
function filterCategory(category) {
    currentCategory = category;
    render();
    document.querySelector('.section-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <li><a href="/detail.html?id=${apk.id}" target="_blank">
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

        document.getElementById('dashApks').textContent = stats.totalApks;
        document.getElementById('dashViews').textContent = stats.totalViews.toLocaleString();
        document.getElementById('dashDownloads').textContent = stats.totalDownloads.toLocaleString();
        document.getElementById('dashComments').textContent = stats.totalComments;
        totalCount.textContent = stats.totalApks;
    }
}

// ============================================================
//  RENDER APK CARD
// ============================================================
function renderApkCard(apk) {
    return `
        <div class="apk-card" onclick="window.open('/detail.html?id=${apk.id}', '_blank')">
            <div class="apk-icon">
                ${apk.icon ? `<img src="${apk.icon}" alt="${apk.title}" loading="lazy" />` : `<span class="no-icon"><i class="fas fa-android"></i></span>`}
            </div>
            <div class="apk-info">
                <h3>${escapeHtml(apk.title)}</h3>
                <div class="meta">
                    <span><i class="fas fa-tag"></i> ${escapeHtml(categoryNames[apk.category] || apk.category || 'Apps')}</span>
                    <span><i class="fas fa-download"></i> ${(apk.downloads || 0).toLocaleString()}</span>
                </div>
            </div>
            <div class="apk-downloads">
                <i class="fas fa-download"></i> ${(apk.downloads || 0).toLocaleString()}
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

    // Latest Updates - Last 5 (by createdAt)
    const latest = [...apksData].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
    latestGrid.innerHTML = latest.length > 0 ? latest.map(renderApkCard).join('') : 
        '<div class="empty-state"><i class="fas fa-clock"></i><h3>No latest updates</h3></div>';

    // Hot & Exclusive - Top 5 by downloads
    const hot = [...apksData].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 5);
    hotGrid.innerHTML = hot.length > 0 ? hot.map(renderApkCard).join('') : 
        '<div class="empty-state"><i class="fas fa-fire"></i><h3>No hot APKs yet</h3></div>';

    // All APKs
    resultCount.textContent = `Showing ${filtered.length} results`;

    if (filtered.length === 0) {
        allGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-android"></i>
                <h3>No APKs found</h3>
                <p>${isAdminUnlocked ? 'Add your first APK using the Admin panel.' : 'Check back later for new APKs!'}</p>
            </div>
        `;
        return;
    }

    filtered.sort((a, b) => b.createdAt - a.createdAt);
    allGrid.innerHTML = filtered.map(renderApkCard).join('');
}

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
    categorySelect.value = apk.category || 'apps';
    versionInput.value = apk.version || '';
    sizeInput.value = apk.size || '';
    developerInput.value = apk.developer || '';
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
    categorySelect.value = 'apps';
    versionInput.value = '';
    sizeInput.value = '';
    developerInput.value = '';
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
    formData.append('developer', developerInput.value.trim());
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
//  SEARCH
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
//  EXPOSE FUNCTIONS
// ============================================================
window.filterCategory = filterCategory;
window.openTelegram = openTelegram;

// ============================================================
//  INIT
// ============================================================
loadAPKs();

console.log('📱 MODSCOM - White Theme Loaded');
console.log('🔑 Admin Password: ' + ADMIN_PASSWORD);
console.log('🔐 Secret URL: Add #' + SECRET_KEY + ' to the URL');
console.log('📌 Example: ' + window.location.href.split('#')[0] + '#' + SECRET_KEY);
console.log('📂 Categories: Apps, Games, Mods, Tools');
console.log('📱 Telegram: @modscom18');
console.log('🔄 Auto-sync every 5 seconds');
