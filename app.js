// Gokuldham Hub App Controller
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const totalEpBadge = document.getElementById('totalEpBadge');
  const continueBanner = document.getElementById('continueBanner');
  const continueTitle = document.getElementById('continueTitle');
  const resumeBtn = document.getElementById('resumeBtn');
  
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const sortOrder = document.getElementById('sortOrder');
  const eraTabs = document.querySelectorAll('.tab-btn');
  
  const episodeGrid = document.getElementById('episodeGrid');
  const resultsCount = document.getElementById('resultsCount');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  
  const playerModal = document.getElementById('playerModal');
  const modalTitle = document.getElementById('modalTitle');
  const youtubeIframe = document.getElementById('youtubeIframe');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const prevEpBtn = document.getElementById('prevEpBtn');
  const nextEpBtn = document.getElementById('nextEpBtn');
  const modalEpBadge = document.getElementById('modalEpBadge');

  // Application State
  let allEpisodes = [];
  let filteredEpisodes = [];
  let currentRenderCount = 24;
  let activeEra = 'all';
  let currentSort = 'asc';
  let currentPlayingEp = null;

  // LocalStorage Keys
  const STORAGE_WATCHED = 'tmkoc_watched_eps';
  const STORAGE_LAST_WATCHED = 'tmkoc_last_watched';

  function getWatchedEpisodes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_WATCHED)) || [];
    } catch {
      return [];
    }
  }

  function markAsWatched(epNum) {
    const watched = getWatchedEpisodes();
    if (!watched.includes(epNum)) {
      watched.push(epNum);
      localStorage.setItem(STORAGE_WATCHED, JSON.stringify(watched));
    }
  }

  function getLastWatched() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_LAST_WATCHED)) || null;
    } catch {
      return null;
    }
  }

  function setLastWatched(epObj) {
    localStorage.setItem(STORAGE_LAST_WATCHED, JSON.stringify(epObj));
    updateContinueBanner();
  }

  function updateContinueBanner() {
    const last = getLastWatched();
    if (last && last.ep) {
      continueBanner.classList.remove('hidden');
      continueTitle.textContent = `Episode ${last.ep} - ${last.title || 'Taarak Mehta Ka Ooltah Chashmah'}`;
    } else {
      continueBanner.classList.add('hidden');
    }
  }

  // Extract Video ID from URL
  function extractVideoId(url) {
    if (!url) return '';
    const match = url.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|^)([a-zA-Z0-9_-]{11})(?:[&?]|$)/);
    return match ? match[1] : '';
  }

  // Load and Parse CSV File
  async function loadEpisodeData() {
    try {
      const response = await fetch('episodes.csv');
      if (!response.ok) throw new Error('Failed to fetch episodes.csv');
      
      const text = await response.text();
      const lines = text.split('\n');
      
      const parsed = [];
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parser handling quotes
        const match = line.match(/^(\d+),"?([^",]+|"[^"]+")?"?,([^,]+),?([^,]+)?$/);
        let epNum = 0, title = '', url = '', status = 'Found';

        if (match) {
          epNum = parseInt(match[1]);
          title = (match[2] || '').replace(/^"|"$/g, '');
          url = match[3] || '';
          status = match[4] || 'Found';
        } else {
          const parts = line.split(',');
          epNum = parseInt(parts[0]);
          url = parts[2] || '';
          title = parts[1] || '';
        }

        if (epNum > 0) {
          const videoId = extractVideoId(url);
          parsed.push({
            ep: epNum,
            title: title || `Episode ${epNum} - Taarak Mehta Ka Ooltah Chashmah`,
            url: url,
            videoId: videoId,
            status: status
          });
        }
      }

      allEpisodes = parsed;
      totalEpBadge.textContent = `${allEpisodes.length}+ Episodes`;
      
      applyFilters();
      updateContinueBanner();

    } catch (err) {
      console.error('Error loading episode dataset:', err);
      episodeGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">
          <h3>Failed to load episodes dataset</h3>
          <p style="margin-top: 8px; color: #94a3b8;">Make sure episodes.csv is present in the repository.</p>
        </div>
      `;
    }
  }

  // Apply Search, Era Filter, and Sorting
  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();

    filteredEpisodes = allEpisodes.filter(item => {
      // Era Filter
      if (activeEra === 'classic' && (item.ep < 1 || item.ep > 500)) return false;
      if (activeEra === 'golden' && (item.ep < 501 || item.ep > 1500)) return false;
      if (activeEra === 'modern' && (item.ep < 1501 || item.ep > 3000)) return false;
      if (activeEra === 'recent' && item.ep < 3001) return false;

      // Search Query Filter
      if (query) {
        const matchEp = item.ep.toString() === query || item.ep.toString().startsWith(query);
        const matchTitle = item.title.toLowerCase().includes(query);
        return matchEp || matchTitle;
      }

      return true;
    });

    // Sorting
    filteredEpisodes.sort((a, b) => {
      return currentSort === 'asc' ? a.ep - b.ep : b.ep - a.ep;
    });

    currentRenderCount = 24;
    renderGrid();
  }

  // Render Episode Cards
  function renderGrid() {
    episodeGrid.innerHTML = '';
    const watchedList = getWatchedEpisodes();
    const itemsToRender = filteredEpisodes.slice(0, currentRenderCount);

    resultsCount.textContent = `Showing ${itemsToRender.length} of ${filteredEpisodes.length} episodes`;

    if (itemsToRender.length === 0) {
      episodeGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #94a3b8;">
          <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
          <h3>No episodes found matching your criteria</h3>
          <p style="font-size: 13px; margin-top: 4px;">Try searching for another episode number or keyword.</p>
        </div>
      `;
      loadMoreBtn.classList.add('hidden');
      return;
    }

    itemsToRender.forEach(item => {
      const card = document.createElement('div');
      card.className = 'episode-card';

      const isWatched = watchedList.includes(item.ep);
      const thumbUrl = item.videoId 
        ? `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`
        : 'https://via.placeholder.com/480x270/1e293b/818cf8?text=TMKOC+Episode';

      card.innerHTML = `
        <div class="thumbnail-box">
          <img src="${thumbUrl}" alt="${item.title}" loading="lazy">
          <div class="play-overlay">
            <div class="play-icon-circle">▶</div>
          </div>
          <span class="ep-badge">EP ${item.ep}</span>
          ${isWatched ? '<span class="watched-badge">✓ WATCHED</span>' : ''}
        </div>
        <div class="card-details">
          <h4 class="card-title">${item.title}</h4>
        </div>
      `;

      card.addEventListener('click', () => openPlayerModal(item));
      episodeGrid.appendChild(card);
    });

    // Show/Hide Load More Button
    if (currentRenderCount < filteredEpisodes.length) {
      loadMoreBtn.classList.remove('hidden');
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }

  // Load More Button Event
  loadMoreBtn.addEventListener('click', () => {
    currentRenderCount += 24;
    renderGrid();
  });

  // Open Theatre Mode Modal Player
  function openPlayerModal(item) {
    if (!item) return;
    currentPlayingEp = item;
    
    markAsWatched(item.ep);
    setLastWatched(item);

    modalTitle.textContent = item.title;
    modalEpBadge.textContent = `Episode ${item.ep}`;

    if (item.videoId) {
      youtubeIframe.src = `https://www.youtube.com/embed/${item.videoId}?autoplay=1&rel=0`;
    } else {
      youtubeIframe.src = `https://www.youtube.com/embed?listType=search&list=Taarak+Mehta+Ka+Ooltah+Chashmah+Episode+${item.ep}`;
    }

    playerModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Re-render grid to update watched badge
    renderGrid();
  }

  function closePlayerModal() {
    playerModal.classList.add('hidden');
    youtubeIframe.src = '';
    document.body.style.overflow = 'auto';
  }

  // Navigation: Next & Previous Episode
  prevEpBtn.addEventListener('click', () => {
    if (!currentPlayingEp) return;
    const prevEpNum = currentPlayingEp.ep - 1;
    const prevObj = allEpisodes.find(e => e.ep === prevEpNum);
    if (prevObj) openPlayerModal(prevObj);
  });

  nextEpBtn.addEventListener('click', () => {
    if (!currentPlayingEp) return;
    const nextEpNum = currentPlayingEp.ep + 1;
    const nextObj = allEpisodes.find(e => e.ep === nextEpNum);
    if (nextObj) openPlayerModal(nextObj);
  });

  // Event Listeners
  closeModalBtn.addEventListener('click', closePlayerModal);
  playerModal.addEventListener('click', (e) => {
    if (e.target === playerModal) closePlayerModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !playerModal.classList.contains('hidden')) {
      closePlayerModal();
    }
  });

  resumeBtn.addEventListener('click', () => {
    const last = getLastWatched();
    if (last) {
      const found = allEpisodes.find(e => e.ep === last.ep);
      if (found) openPlayerModal(found);
    }
  });

  // Search Input Events
  searchInput.addEventListener('input', () => {
    if (searchInput.value.trim()) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    applyFilters();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    applyFilters();
  });

  sortOrder.addEventListener('change', () => {
    currentSort = sortOrder.value;
    applyFilters();
  });

  // Era Tab Controls
  eraTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      eraTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeEra = tab.getAttribute('data-era');
      applyFilters();
    });
  });

  // Initialize
  loadEpisodeData();
});
