/**
 * UI module for rendering DailyBrief DOM elements & Custom Video Player Engine.
 */

let allArticlesMap = {};
let ytPlayer = null;
let isYtApiReady = false;
let currentModalEpNum = null;
let progressInterval = null;

// Load YouTube IFrame API
if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = function() {
    isYtApiReady = true;
};

window.markAsRead = function(id) {
    try {
        const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
        if (!readArticles.includes(id)) {
            readArticles.push(id);
            if (readArticles.length > 500) readArticles.shift();
            localStorage.setItem('readArticles', JSON.stringify(readArticles));
        }
        
        const elements = document.querySelectorAll(`[data-id="${id}"]`);
        elements.forEach(el => el.classList.add('read-article'));
    } catch(e) {}
};

window.playEpisode = function(id) {
    window.markAsRead(id);
    const article = allArticlesMap[id];
    if (article) {
        openCustomPlayer(article);
    }
};

function formatTime(dateString) {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMins / 60);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHrs < 24) return `${diffHrs} hours ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Generate HTML for the Featured Hero Slider
function createHeroHTML(articles) {
    if (!articles || articles.length === 0) return '';
    
    let slidesHTML = '';
    let dotsHTML = '';
    
    articles.forEach((article, index) => {
        allArticlesMap[article.id] = article;
        const imageUrl = article.image;
        const activeClass = index === 0 ? 'active' : '';
        
        let readClass = '';
        try {
            const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
            if (readArticles.includes(article.id)) {
                readClass = 'read-article';
            }
        } catch(e) {}
        
        slidesHTML += `
            <article class="hero-slide ${activeClass} ${readClass}" data-index="${index}" data-category="${article.category.toLowerCase()}" data-id="${article.id}">
                <a href="javascript:void(0)" class="hero-img-wrap" onclick="playEpisode('${article.id}')">
                    <img src="${imageUrl}" alt="${article.title}" class="hero-img" onerror="this.src='https://via.placeholder.com/1280x720/18181b/818cf8?text=TMKOC+Episode'">
                    <div class="hero-overlay"></div>
                    <div class="hero-content">
                        <div class="hero-meta">
                            <span class="hero-category">${article.category}</span>
                            <span class="hero-source">${article.source}</span>
                            <span>${formatTime(article.publishedAt)}</span>
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

// Generate HTML for a single article grid card
function createCardHTML(article) {
    allArticlesMap[article.id] = article;
    const imageUrl = article.image;
    
    let readClass = '';
    try {
        const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
        if (readArticles.includes(article.id)) {
            readClass = 'read-article';
        }
    } catch(e) {}
    
    return `
        <article class="card ${readClass}" data-id="${article.id}" data-category="${article.category.toLowerCase()}">
            <a href="javascript:void(0)" class="card-img-wrap" onclick="playEpisode('${article.id}')">
                <img src="${imageUrl}" alt="${article.title}" loading="lazy" class="card-img" onerror="this.src='https://via.placeholder.com/480x270/18181b/818cf8?text=TMKOC+Episode'">
                <span class="card-category">${article.category}</span>
            </a>
            <div class="card-content">
                <div class="card-meta">
                    <span class="card-source">${article.source}</span>
                    <span>•</span>
                    <span class="card-date">EPISODE ${article.epNumber}</span>
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
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; opacity: 0.6;">No episodes found.</div>';
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
// CUSTOM VIDEO PLAYER ENGINE
// ----------------------------------------------------
function openCustomPlayer(article) {
    currentModalEpNum = article.epNumber;

    let backdrop = document.getElementById('custom-player-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'custom-player-backdrop';
        backdrop.className = 'custom-player-backdrop';
        backdrop.innerHTML = `
            <div class="custom-player-dialog">
                <div class="custom-player-header">
                    <div class="custom-player-title-wrap">
                        <span id="custom-badge" class="custom-player-badge">EP 1</span>
                        <h3 id="custom-title" class="custom-player-title">Episode Title</h3>
                    </div>
                    <button class="custom-player-close" onclick="closeCustomPlayer()">✕</button>
                </div>
                <div class="custom-video-viewport">
                    <div id="yt-player-target"></div>
                </div>
                <div class="custom-controls-bar">
                    <div class="custom-progress-row">
                        <input type="range" id="custom-seek-bar" class="custom-seek-bar" value="0" min="0" max="100" step="0.1">
                        <span id="custom-time-display" class="custom-time-display">00:00 / 00:00</span>
                    </div>
                    <div class="custom-buttons-row">
                        <div class="custom-controls-left">
                            <button id="custom-play-btn" class="ctrl-btn ctrl-btn-primary" onclick="togglePlayPause()">▶ Play</button>
                            <button class="ctrl-btn" onclick="navCustomEp(-1)">◀ Prev Ep</button>
                            <button class="ctrl-btn" onclick="navCustomEp(1)">Next Ep ▶</button>
                        </div>
                        <div class="custom-controls-right">
                            <select id="custom-speed-select" class="speed-select" onchange="changeSpeed(this.value)">
                                <option value="0.75">0.75x</option>
                                <option value="1" selected>1.0x (Normal)</option>
                                <option value="1.25">1.25x</option>
                                <option value="1.5">1.5x</option>
                                <option value="2">2.0x</option>
                            </select>
                            <button class="ctrl-btn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(backdrop);

        // Seek Bar Drag Listener
        const seekBar = document.getElementById('custom-seek-bar');
        seekBar.addEventListener('input', () => {
            if (ytPlayer && ytPlayer.getDuration) {
                const dur = ytPlayer.getDuration();
                const seekTo = (seekBar.value / 100) * dur;
                ytPlayer.seekTo(seekTo, true);
            }
        });
    }

    document.getElementById('custom-title').textContent = article.title;
    document.getElementById('custom-badge').textContent = `EP ${article.epNumber}`;

    backdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Initialize or load video into YouTube Player
    if (window.YT && window.YT.Player) {
        if (!ytPlayer) {
            ytPlayer = new YT.Player('yt-player-target', {
                videoId: article.videoId,
                playerVars: {
                    autoplay: 1,
                    controls: 0, // Hide default YT controls to use our custom player controls!
                    modestbranding: 1,
                    rel: 0
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange
                }
            });
        } else {
            ytPlayer.loadVideoById(article.videoId);
        }
    } else {
        // Fallback if YT API not loaded yet
        document.getElementById('yt-player-target').innerHTML = `
            <iframe src="https://www.youtube.com/embed/${article.videoId}?autoplay=1&rel=0" frameborder="0" allow="autoplay; fullscreen" allowfullscreen style="width:100%;height:100%;"></iframe>
        `;
    }
}

function onPlayerReady(event) {
    event.target.playVideo();
    startProgressTimer();
}

function onPlayerStateChange(event) {
    const playBtn = document.getElementById('custom-play-btn');
    if (!playBtn) return;

    if (event.data === YT.PlayerState.PLAYING) {
        playBtn.innerHTML = '❚❚ Pause';
        startProgressTimer();
    } else {
        playBtn.innerHTML = '▶ Play';
        stopProgressTimer();
    }
}

function startProgressTimer() {
    stopProgressTimer();
    progressInterval = setInterval(() => {
        if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getDuration) {
            const current = ytPlayer.getCurrentTime();
            const dur = ytPlayer.getDuration();
            const timeDisplay = document.getElementById('custom-time-display');
            const seekBar = document.getElementById('custom-seek-bar');

            if (timeDisplay) {
                timeDisplay.textContent = `${formatDuration(current)} / ${formatDuration(dur)}`;
            }
            if (seekBar && dur > 0) {
                seekBar.value = (current / dur) * 100;
            }
        }
    }, 500);
}

function stopProgressTimer() {
    if (progressInterval) clearInterval(progressInterval);
}

window.togglePlayPause = function() {
    if (!ytPlayer) return;
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo();
    } else {
        ytPlayer.playVideo();
    }
};

window.changeSpeed = function(val) {
    if (ytPlayer && ytPlayer.setPlaybackRate) {
        ytPlayer.setPlaybackRate(parseFloat(val));
    }
};

window.toggleFullscreen = function() {
    const frame = document.querySelector('.custom-video-viewport');
    if (!frame) return;

    if (!document.fullscreenElement) {
        if (frame.requestFullscreen) frame.requestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
};

window.closeCustomPlayer = function() {
    const backdrop = document.getElementById('custom-player-backdrop');
    if (backdrop) backdrop.style.display = 'none';
    if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
    stopProgressTimer();
    document.body.style.overflow = 'auto';
};

window.navCustomEp = function(dir) {
    if (!currentModalEpNum) return;
    const targetEp = currentModalEpNum + dir;
    const targetArticle = Object.values(allArticlesMap).find(a => a.epNumber === targetEp);
    if (targetArticle) {
        openCustomPlayer(targetArticle);
    }
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.closeCustomPlayer();
    }
});
