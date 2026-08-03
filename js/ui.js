/**
 * UI module for DailyDose TMKOC, Resume Timestamp Player, and Fan Stats Leaderboard.
 */

let allArticlesMap = {};
let masterEpNumberMap = {};
let currentModalEpNum = null;

// LocalStorage Keys
const STORAGE_WATCHED = 'readArticles'; // Keeps compatibility with DailyBrief read system
const STORAGE_TIMESTAMPS = 'tmkoc_timestamps';
const STORAGE_HANDLE = 'tmkoc_user_handle';

function getWatchedList() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_WATCHED) || '[]');
    } catch(e) {
        return [];
    }
}

function getTimestamps() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_TIMESTAMPS) || '{}');
    } catch(e) {
        return {};
    }
}

window.markAsRead = function(id) {
    try {
        const watched = getWatchedList();
        if (!watched.includes(id)) {
            watched.push(id);
            if (watched.length > 1000) watched.shift();
            localStorage.setItem(STORAGE_WATCHED, JSON.stringify(watched));
        }
        
        const elements = document.querySelectorAll(`[data-id="${id}"]`);
        elements.forEach(el => el.classList.add('read-article', 'watched-article'));
    } catch(e) {}
};

window.playEpisode = function(id) {
    window.markAsRead(id);
    const article = allArticlesMap[id] || masterEpNumberMap[id];
    if (article) {
        openCleanPlayer(article);
    }
};

export function registerMasterArticles(articles) {
    articles.forEach(art => {
        allArticlesMap[art.id] = art;
        masterEpNumberMap[art.epNumber] = art;
    });
}

function createHeroHTML(articles) {
    if (!articles || articles.length === 0) return '';
    
    let slidesHTML = '';
    let dotsHTML = '';
    
    articles.forEach((article, index) => {
        allArticlesMap[article.id] = article;
        masterEpNumberMap[article.epNumber] = article;
        const imageUrl = article.image;
        const activeClass = index === 0 ? 'active' : '';
        
        let readClass = '';
        const watched = getWatchedList();
        if (watched.includes(article.id)) {
            readClass = 'read-article watched-article';
        }
        
        slidesHTML += `
            <article class="hero-slide ${activeClass} ${readClass}" data-index="${index}" data-category="${article.category.toLowerCase()}" data-id="${article.id}">
                <a href="javascript:void(0)" class="hero-img-wrap" onclick="playEpisode('${article.id}')">
                    <img src="${imageUrl}" alt="${article.title}" class="hero-img" onerror="this.src='https://via.placeholder.com/1280x720/18181b/818cf8?text=TMKOC+Episode'">
                    <div class="hero-overlay"></div>
                    <div class="hero-content">
                        <div class="hero-meta">
                            <span class="hero-category">${article.category}</span>
                            <span class="hero-source">${article.source}</span>
                            <span>${article.airDate || ''}</span>
                        </div>
                        <h1 class="hero-title">${article.title}</h1>
                        <p class="hero-desc">${article.description || ''}</p>
                    </div>
                </a>
            </article>
        `;
        
        dotsHTML += `<button class="hero-dot ${activeClass}" aria-label="Go to slide ${index + 1}" data-slide="${index}"></button>`;
    });

    return `
        <div class="hero-slider">
            ${slidesHTML}
            <button class="hero-nav-btn prev" aria-label="Previous slide">
                <svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" fill="currentColor"></path></svg>
            </button>
            <button class="hero-nav-btn next" aria-label="Next slide">
                <svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"></path></svg>
            </button>
            <div class="hero-nav">
                ${dotsHTML}
            </div>
        </div>
    `;
}

function createCardHTML(article) {
    allArticlesMap[article.id] = article;
    masterEpNumberMap[article.epNumber] = article;
    const imageUrl = article.image;
    
    let readClass = '';
    const watched = getWatchedList();
    if (watched.includes(article.id)) {
        readClass = 'read-article watched-article';
    }

    const timestamps = getTimestamps();
    const savedTimeSec = timestamps[article.id] || 0;
    const progressPercent = savedTimeSec ? Math.min(100, Math.round((savedTimeSec / 1260) * 100)) : 0;
    
    return `
        <article class="card ${readClass}" data-id="${article.id}" data-category="${article.category.toLowerCase()}">
            <a href="javascript:void(0)" class="card-img-wrap" onclick="playEpisode('${article.id}')">
                <img src="${imageUrl}" alt="${article.title}" loading="lazy" class="card-img" onerror="this.src='https://via.placeholder.com/480x270/18181b/818cf8?text=TMKOC+Episode'">
                <span class="card-duration-badge">⏱️ ${article.durationText || '21:45'}</span>
                ${progressPercent > 0 ? `<div class="card-progress-container"><div class="card-progress-bar" style="width: ${progressPercent}%;"></div></div>` : ''}
            </a>
            <div class="card-content">
                <div class="card-meta">
                    <span class="card-source">${article.source}</span>
                    <span>•</span>
                    <span class="card-date">${article.airDate || 'EPISODE ' + article.epNumber}</span>
                </div>
                <h2 class="card-title">
                    <a href="javascript:void(0)" onclick="playEpisode('${article.id}')">${article.title}</a>
                </h2>
            </div>
        </article>
    `;
}

export function renderArticles(articles, containerId, append = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!append) {
        container.innerHTML = '';
    }

    if (articles.length === 0 && !append) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; opacity: 0.6;">No episodes found matching your search.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');

    articles.forEach(article => {
        tempDiv.innerHTML = createCardHTML(article);
        fragment.appendChild(tempDiv.firstElementChild);
    });

    container.appendChild(fragment);
}

let heroAutoTimer = null;

function setupHeroSlider() {
    const slider = document.querySelector('.hero-slider');
    if (!slider) return;

    const slides = slider.querySelectorAll('.hero-slide');
    const dots = slider.querySelectorAll('.hero-dot');
    const prevBtn = slider.querySelector('.hero-nav-btn.prev');
    const nextBtn = slider.querySelector('.hero-nav-btn.next');

    if (slides.length <= 1) return;

    let currentIndex = 0;

    function goToSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));

        currentIndex = (index + slides.length) % slides.length;

        slides[currentIndex].classList.add('active');
        if (dots[currentIndex]) dots[currentIndex].classList.add('active');
    }

    function startAutoSlide() {
        stopAutoSlide();
        heroAutoTimer = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, 6000);
    }

    function stopAutoSlide() {
        if (heroAutoTimer) clearInterval(heroAutoTimer);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goToSlide(currentIndex - 1);
            startAutoSlide();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goToSlide(currentIndex + 1);
            startAutoSlide();
        });
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            goToSlide(i);
            startAutoSlide();
        });
    });

    startAutoSlide();
}

export function renderHeroContainer(articles, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!articles || articles.length === 0) {
        container.innerHTML = '';
        return;
    }

    const featured = articles.slice(0, 4);
    container.innerHTML = createHeroHTML(featured);
    setupHeroSlider();
}

// ----------------------------------------------------
// RESUME TIMESTAMP PLAYER & CLEAN MODAL ENGINE
// ----------------------------------------------------
function openCleanPlayer(article) {
    currentModalEpNum = article.epNumber;

    let backdrop = document.getElementById('tmkoc-clean-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'tmkoc-clean-backdrop';
        backdrop.className = 'tmkoc-modal-backdrop';
        backdrop.innerHTML = `
            <div class="tmkoc-modal-dialog">
                <div class="tmkoc-modal-header">
                    <div class="tmkoc-modal-title-wrap">
                        <span id="clean-badge" class="tmkoc-modal-badge">EP 1</span>
                        <h3 id="clean-title" class="tmkoc-modal-title">Episode Title</h3>
                    </div>
                    <button class="tmkoc-modal-close" onclick="closeCleanPlayer()">✕</button>
                </div>
                <div class="tmkoc-video-viewport">
                    <iframe id="clean-iframe" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div class="tmkoc-modal-footer">
                    <button class="tmkoc-nav-btn" onclick="navCleanEp(-1)">◀ Previous Ep</button>
                    <button class="tmkoc-nav-btn" onclick="navCleanEp(1)">Next Ep ▶</button>
                </div>
            </div>
        `;
        document.body.appendChild(backdrop);
    }

    document.getElementById('clean-title').textContent = article.title;
    document.getElementById('clean-badge').textContent = `EP ${article.epNumber}`;

    // Get saved resume timestamp
    const timestamps = getTimestamps();
    const resumeSeconds = timestamps[article.id] || 0;
    const startParam = resumeSeconds > 5 ? `&start=${resumeSeconds}` : '';

    const iframe = document.getElementById('clean-iframe');
    if (article.videoId) {
        iframe.src = `https://www.youtube.com/embed/${article.videoId}?autoplay=1&rel=0&controls=1${startParam}`;
    } else {
        iframe.src = `https://www.youtube.com/embed?listType=search&list=Taarak+Mehta+Ka+Ooltah+Chashmah+Episode+${article.epNumber}`;
    }

    backdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

window.closeCleanPlayer = function() {
    const backdrop = document.getElementById('tmkoc-clean-backdrop');
    if (backdrop) backdrop.style.display = 'none';
    const iframe = document.getElementById('clean-iframe');
    if (iframe) iframe.src = '';
    document.body.style.overflow = 'auto';
};

window.navCleanEp = function(dir) {
    if (!currentModalEpNum) return;
    const targetEp = currentModalEpNum + dir;
    const targetArticle = masterEpNumberMap[targetEp];
    if (targetArticle) {
        openCleanPlayer(targetArticle);
    }
};

// ----------------------------------------------------
// FAN DASHBOARD & SUPERFAN LEADERBOARD ENGINE
// ----------------------------------------------------
function getFanLevel(watchedCount) {
    if (watchedCount >= 1000) return { title: '👑 Gokuldham Legend', color: '#8b5cf6' };
    if (watchedCount >= 301) return { title: '🥇 Bapuji\'s Favorite', color: '#f59e0b' };
    if (watchedCount >= 51) return { title: '🥈 Soda Shop Regular', color: '#3b82f6' };
    return { title: '🥉 Gokuldham Resident', color: '#10b981' };
}

export function updateFanDashboard() {
    const watchedList = getWatchedList();
    const count = watchedList.length;
    const watchHours = Math.floor((count * 21.5) / 60);
    const watchMins = Math.floor((count * 21.5) % 60);

    const level = getFanLevel(count);

    const countEl = document.getElementById('stat-episodes-count');
    const hoursEl = document.getElementById('stat-watch-hours');
    const levelEl = document.getElementById('stat-fan-level');

    if (countEl) countEl.textContent = count;
    if (hoursEl) hoursEl.textContent = `${watchHours}h ${watchMins}m`;
    if (levelEl) {
        levelEl.textContent = level.title;
        levelEl.style.color = level.color;
    }

    const savedHandle = localStorage.getItem(STORAGE_HANDLE) || '@TMKOCSuperfan';
    const handleInput = document.getElementById('user-handle-input');
    if (handleInput && !handleInput.value) {
        handleInput.value = savedHandle;
    }

    // Social Share Text Card
    const shareText = `I've watched ${count} episodes (${watchHours} Hours) of TMKOC on Daily Dose! 🥤 My Fan Level: ${level.title}. Check your level at CodeMasterAbhishek.github.io/tmkoc-youtube-playlist-bot/`;
    const shareTextEl = document.getElementById('social-card-text');
    if (shareTextEl) shareTextEl.textContent = shareText;

    renderLeaderboardList(savedHandle, count, watchHours, level.title);
}

function renderLeaderboardList(userHandle, userCount, userHours, userLevel) {
    const leaderboardEl = document.getElementById('leaderboard-list');
    if (!leaderboardEl) return;

    // Standard Community Rankings
    const sampleLeaderboard = [
        { rank: '1 👑', handle: '@JethaFanatic', count: 1420, hours: 508, level: 'Gokuldham Legend' },
        { rank: '2 🥇', handle: '@BhideSecretary', count: 1150, hours: 412, level: 'Gokuldham Legend' },
        { rank: '3 🥈', handle: '@SodaShopGang', count: 890, hours: 318, level: 'Bapuji\'s Favorite' },
        { rank: '4 🥉', handle: userHandle || '@You', count: userCount, hours: userHours, level: userLevel, isUser: true }
    ];

    sampleLeaderboard.sort((a, b) => b.count - a.count);

    let html = '';
    sampleLeaderboard.forEach((item, idx) => {
        const activeBg = item.isUser ? 'background: rgba(99, 102, 241, 0.15); border-color: #6366f1;' : 'background: var(--bg-secondary);';
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border-color); ${activeBg}">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: 800; font-size: 14px; min-width: 30px;">#${idx + 1}</span>
                    <div>
                        <div style="font-weight: 700; font-size: 13px;">${item.handle} ${item.isUser ? '<span style="font-size: 10px; background: #6366f1; color: white; padding: 1px 6px; border-radius: 4px;">YOU</span>' : ''}</div>
                        <div style="font-size: 11px; opacity: 0.7;">${item.level}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 800; font-size: 13px; color: #6366f1;">${item.count} Eps</div>
                    <div style="font-size: 11px; opacity: 0.7;">${item.hours} hrs</div>
                </div>
            </div>
        `;
    });

    leaderboardEl.innerHTML = html;
}

window.saveUserHandle = function() {
    const input = document.getElementById('user-handle-input');
    if (input && input.value.trim()) {
        localStorage.setItem(STORAGE_HANDLE, input.value.trim());
        updateFanDashboard();
    }
};

window.copyShareCardText = function() {
    const text = document.getElementById('social-card-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied Social Share Card text to clipboard!');
    });
};

window.closeFanModal = function() {
    const backdrop = document.getElementById('fan-modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.closeCleanPlayer();
        window.closeFanModal();
    }
});
