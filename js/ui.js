/**
 * UI module for rendering DailyBrief DOM elements & Theatre Player.
 */

let allArticlesMap = {};

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
        openModalPlayer(article);
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

// Generate HTML for the Featured Hero Slider (DailyBrief Hero)
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

// Render Articles Engine
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

// Setup Hero Slider Behavior
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

    // Take top 4 featured episodes for hero slider
    const featured = articles.slice(0, 4);
    container.innerHTML = createHeroHTML(featured);
    setupHeroSlider();
}

// Modal Theatre Player Controls
let currentModalEpNum = null;

function openModalPlayer(article) {
    currentModalEpNum = article.epNumber;
    
    let modal = document.getElementById('tmkoc-player-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'tmkoc-player-modal';
        modal.className = 'tmkoc-modal-backdrop';
        modal.innerHTML = `
            <div class="tmkoc-modal-box">
                <div class="tmkoc-modal-top">
                    <h3 id="tmkoc-modal-title"></h3>
                    <button class="tmkoc-modal-close" onclick="closeModalPlayer()">✕</button>
                </div>
                <div class="tmkoc-video-frame">
                    <iframe id="tmkoc-iframe" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <div class="tmkoc-modal-bottom">
                    <button class="tmkoc-nav-btn" onclick="navModalEp(-1)">◀ Previous Ep</button>
                    <span id="tmkoc-modal-badge" class="tmkoc-ep-badge"></span>
                    <button class="tmkoc-nav-btn" onclick="navModalEp(1)">Next Ep ▶</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('tmkoc-modal-title').textContent = article.title;
    document.getElementById('tmkoc-modal-badge').textContent = `Episode ${article.epNumber}`;

    const iframe = document.getElementById('tmkoc-iframe');
    if (article.videoId) {
        iframe.src = `https://www.youtube.com/embed/${article.videoId}?autoplay=1&rel=0`;
    } else {
        iframe.src = `https://www.youtube.com/embed?listType=search&list=Taarak+Mehta+Ka+Ooltah+Chashmah+Episode+${article.epNumber}`;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

window.closeModalPlayer = function() {
    const modal = document.getElementById('tmkoc-player-modal');
    if (modal) {
        modal.style.display = 'none';
        const iframe = document.getElementById('tmkoc-iframe');
        if (iframe) iframe.src = '';
    }
    document.body.style.overflow = 'auto';
};

window.navModalEp = function(dir) {
    if (!currentModalEpNum) return;
    const targetEp = currentModalEpNum + dir;
    const targetArticle = Object.values(allArticlesMap).find(a => a.epNumber === targetEp);
    if (targetArticle) {
        openModalPlayer(targetArticle);
    }
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.closeModalPlayer();
    }
});
