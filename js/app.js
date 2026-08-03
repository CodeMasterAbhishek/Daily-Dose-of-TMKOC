import { fetchNewsData } from './api.js';
import { renderArticles, renderHeroContainer, registerMasterArticles } from './ui.js';

// Setup current year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Theme Management (Light / Dark Mode matching DailyBrief)
const themeToggle = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;

const ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
};

function setTheme(isDark) {
    if (isDark) {
        htmlEl.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.innerHTML = ICONS.sun;
        localStorage.setItem('theme', 'dark');
    } else {
        htmlEl.setAttribute('data-theme', 'light');
        if (themeToggle) themeToggle.innerHTML = ICONS.moon;
        localStorage.setItem('theme', 'light');
    }
}

const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    setTheme(true);
} else {
    setTheme(false);
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = htmlEl.getAttribute('data-theme') === 'dark';
        setTheme(!isDark);
    });
}

// State
let allArticles = [];
let searchQuery = '';
let currentCategory = sessionStorage.getItem('currentCategory') || 'all';
const ITEMS_PER_PAGE = 30;
let currentPage = 1;

const paginationSection = document.getElementById('pagination');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

// Main Initialization
async function init() {
    const filterChips = document.querySelectorAll('.chip');
    filterChips.forEach(c => c.classList.remove('active'));
    const activeChip = document.querySelector(`.chip[data-category="${currentCategory}"]`);
    if (activeChip) activeChip.classList.add('active');

    try {
        allArticles = await fetchNewsData();
        
        // Register all episodes for cross-category Next/Prev episode navigation
        registerMasterArticles(allArticles);

        // Render Hero Slider
        renderHeroContainer(allArticles, 'hero-container');

        // Render Cards Grid
        renderPage();
    } catch (error) {
        console.error("Initialization failed:", error);
        document.getElementById('news-container').innerHTML = '<p style="color:red">Failed to load news. Please try again later.</p>';
    }
}

function renderPage(append = false) {
    const filteredArticles = allArticles.filter(article => {
        // Category Filter
        let categoryMatch = true;
        if (currentCategory !== 'all') {
            categoryMatch = article.category.toLowerCase() === currentCategory.toLowerCase();
        }

        // Search Query Filter
        let searchMatch = true;
        if (searchQuery) {
            const epMatch = article.epNumber.toString() === searchQuery || article.epNumber.toString().startsWith(searchQuery);
            const titleMatch = article.title.toLowerCase().includes(searchQuery);
            searchMatch = epMatch || titleMatch;
        }

        return categoryMatch && searchMatch;
    });

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const articlesToShow = filteredArticles.slice(startIndex, endIndex);

    renderArticles(articlesToShow, 'news-container', append);

    if (endIndex < filteredArticles.length) {
        if (paginationSection) paginationSection.style.display = 'block';
    } else {
        if (paginationSection) paginationSection.style.display = 'none';
    }
}

// Search Form Listener
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        searchQuery = searchInput.value.trim().toLowerCase();
        currentPage = 1;
        renderPage(false);
    });
}

if (searchInput) {
    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        currentPage = 1;
        renderPage(false);
    });
}

// Category Chips Handler
const filterChips = document.querySelectorAll('.chip');
filterChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        currentCategory = chip.getAttribute('data-category');
        sessionStorage.setItem('currentCategory', currentCategory);

        currentPage = 1;
        renderPage(false);
    });
});

// Infinite Scroll Listener
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        const filteredArticles = allArticles.filter(article => {
            let categoryMatch = true;
            if (currentCategory !== 'all') {
                categoryMatch = article.category.toLowerCase() === currentCategory.toLowerCase();
            }
            let searchMatch = true;
            if (searchQuery) {
                const epMatch = article.epNumber.toString() === searchQuery || article.epNumber.toString().startsWith(searchQuery);
                const titleMatch = article.title.toLowerCase().includes(searchQuery);
                searchMatch = epMatch || titleMatch;
            }
            return categoryMatch && searchMatch;
        });

        if (currentPage * ITEMS_PER_PAGE < filteredArticles.length) {
            currentPage++;
            renderPage(true);
        }
    }
});

// Run Init
init();
