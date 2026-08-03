/**
 * UI module for rendering DailyBrief DOM elements & Clean Native Video Player.
 */

let allArticlesMap = {};
let currentModalEpNum = null;

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
        openCleanPlayer(article);
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
// THEME-AWARE CLEAN PLAYER ENGINE
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

    const iframe = document.getElementById('clean-iframe');
    if (article.videoId) {
        iframe.src = `https://www.youtube.com/embed/${article.videoId}?autoplay=1&rel=0&controls=1`;
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
    const targetArticle = Object.values(allArticlesMap).find(a => a.epNumber === targetEp);
    if (targetArticle) {
        openCleanPlayer(targetArticle);
    }
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.closeCleanPlayer();
    }
});
