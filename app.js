// Alekto - Application Front-end Logic

// State Management
let appData = {
  audio: [],
  artistes: [],
  lecture: []
};

let playerState = {
  currentAudio: null,
  isPlaying: false,
  duration: 0,
  currentTime: 0
};

let readerState = {
  currentReading: null,
  pages: [],
  currentPageIndex: 0
};

// DOM References
const audioEl = document.getElementById('main-audio-element');

// View Containers
const views = {
  accueil: document.getElementById('view-accueil'),
  artistes: document.getElementById('view-artistes'),
  lecture: document.getElementById('view-lecture'),
  audioDetail: document.getElementById('view-audio-detail'),
  lectureDetail: document.getElementById('view-lecture-detail')
};

// Navigation Items
const navItems = {
  accueil: document.getElementById('nav-accueil'),
  artistes: document.getElementById('nav-artistes'),
  lecture: document.getElementById('nav-lecture')
};

// Floating Mini Player
const miniPlayer = document.getElementById('mini-player');
const miniPlayerBody = document.getElementById('mini-player-body');
const miniPlayPauseBtn = document.getElementById('mini-play-pause-btn');
const miniPlayIcon = document.getElementById('mini-play-icon');

// Header elements
const headerTitle = document.getElementById('header-title');
const headerAvatar = document.getElementById('header-avatar');
const headerBackBtn = document.getElementById('header-back-btn');

// Startup Initialization
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadData();
    initApp();
    setupEventListeners();
    // Default route
    handleRouting();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service Worker enregistré avec succès !', reg))
        .catch(err => console.error('Erreur d\'enregistrement du Service Worker:', err));
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation de l'application :", error);
  }
});

// Load JSON data files
async function loadData() {
  const [audioRes, artistesRes, lectureRes] = await Promise.all([
    fetch('data/audio.json'),
    fetch('data/artistes.json'),
    fetch('data/lecture.json')
  ]);
  
  appData.audio = await audioRes.json();
  appData.artistes = await artistesRes.json();
  appData.lecture = await lectureRes.json();
  
  console.log('Données chargées avec succès :', appData);
}

// Initialize Application UI
function initApp() {
  // Set up the default "Continuer l'écoute" in LocalStorage if empty
  if (!localStorage.getItem('alekto_continue_listening')) {
    const defaultContinue = {
      audioId: 'renard_etoile',
      progressSeconds: 765, // 12:45
      durationSeconds: 1100 // 18:20
    };
    localStorage.setItem('alekto_continue_listening', JSON.stringify(defaultContinue));
  }
  
  renderAccueil();
  renderArtistes();
  renderLecture();
  updateContinueListeningCard();
}

// Setup Event Listeners
function setupEventListeners() {
  // Routing
  window.addEventListener('hashchange', handleRouting);
  
  // Header Back Button
  headerBackBtn.addEventListener('click', () => {
    // Go back in history
    window.history.back();
  });
  
  // Mini Player Events
  miniPlayerBody.addEventListener('click', () => {
    if (playerState.currentAudio) {
      window.location.hash = `#audio-detail?id=${playerState.currentAudio.id}`;
    }
  });
  
  miniPlayPauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlayPause();
  });
  
  // Audio Element Events
  audioEl.addEventListener('timeupdate', handleAudioTimeUpdate);
  audioEl.addEventListener('loadedmetadata', () => {
    playerState.duration = audioEl.duration;
    updatePlayerDurationUI();
  });
  audioEl.addEventListener('ended', () => {
    playerState.isPlaying = false;
    updatePlayPauseUI();
    // Clear mini player status
    document.getElementById('mini-status-text').textContent = 'Lecture terminée';
  });
  
  // Detailed Player Controls
  document.getElementById('btn-main-play').addEventListener('click', togglePlayPause);
  document.getElementById('btn-replay-10').addEventListener('click', () => seekRelative(-10));
  document.getElementById('btn-forward-10').addEventListener('click', () => seekRelative(10));
  
  // Detailed Player Cover controls (secondary)
  const coverPlayBtn = document.querySelector('.cover-control-buttons .play-pause-btn');
  if (coverPlayBtn) {
    coverPlayBtn.addEventListener('click', () => togglePlayPause());
  }
  const coverPrevBtn = document.querySelector('.cover-control-buttons .prev-btn');
  if (coverPrevBtn) {
    coverPrevBtn.addEventListener('click', () => playSiblingAudio(-1));
  }
  const coverNextBtn = document.querySelector('.cover-control-buttons .next-btn');
  if (coverNextBtn) {
    coverNextBtn.addEventListener('click', () => playSiblingAudio(1));
  }
  
  // Wavy Seeker Click handler
  const wavySeeker = document.getElementById('wavy-seeker');
  wavySeeker.addEventListener('click', (e) => {
    const rect = wavySeeker.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    seekToPercentage(percentage);
  });

  // Modals
  const searchModal = document.getElementById('search-modal');
  const settingsModal = document.getElementById('settings-modal');
  
  document.getElementById('btn-open-search').addEventListener('click', () => {
    searchModal.style.display = 'flex';
    document.getElementById('search-input').focus();
  });
  document.getElementById('btn-open-settings').addEventListener('click', () => {
    settingsModal.style.display = 'flex';
  });
  
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      searchModal.style.display = 'none';
      settingsModal.style.display = 'none';
    });
  });
  
  // Search logic
  document.getElementById('search-input').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    if (!query) return;
    
    // Search audio
    const audios = appData.audio.filter(a => a.titre.toLowerCase().includes(query) || a.description.toLowerCase().includes(query));
    audios.forEach(a => {
      const div = document.createElement('div');
      div.className = 'audio-card';
      div.style.flex = 'none';
      div.style.flexDirection = 'row';
      div.style.gap = '10px';
      div.style.alignItems = 'center';
      div.style.marginBottom = '8px';
      div.innerHTML = `<img src="${a.image}" style="width: 40px; height: 40px; border-radius: 8px;"> <div><h4 style="margin: 0; font-size: 14px;">${a.titre}</h4><p style="margin: 0; font-size: 11px; color: var(--text-muted)">Audio</p></div>`;
      div.onclick = () => { searchModal.style.display = 'none'; window.location.hash = '#audio-detail?id=' + a.id; };
      resultsContainer.appendChild(div);
    });
    
    // Search lecture
    const lectures = appData.lecture.filter(a => a.titre.toLowerCase().includes(query) || a.description.toLowerCase().includes(query));
    lectures.forEach(l => {
      const div = document.createElement('div');
      div.className = 'audio-card';
      div.style.flex = 'none';
      div.style.flexDirection = 'row';
      div.style.gap = '10px';
      div.style.alignItems = 'center';
      div.style.marginBottom = '8px';
      div.innerHTML = `<img src="${l.image}" style="width: 40px; height: 40px; border-radius: 8px;"> <div><h4 style="margin: 0; font-size: 14px;">${l.titre}</h4><p style="margin: 0; font-size: 11px; color: var(--text-muted)">Lecture</p></div>`;
      div.onclick = () => { searchModal.style.display = 'none'; window.location.hash = '#lecture-detail?id=' + l.id; };
      resultsContainer.appendChild(div);
    });
  });

  // Dark mode toggle
  document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  });

  // Font size settings
  let currentFontSize = 16;
  document.getElementById('font-size-increase').addEventListener('click', () => {
    currentFontSize += 2;
    const contentArea = document.getElementById('reader-content-area');
    if (contentArea) contentArea.style.fontSize = currentFontSize + 'px';
  });
  document.getElementById('font-size-decrease').addEventListener('click', () => {
    currentFontSize = Math.max(12, currentFontSize - 2);
    const contentArea = document.getElementById('reader-content-area');
    if (contentArea) contentArea.style.fontSize = currentFontSize + 'px';
  });

  // PWA Install Banner Logic
  let deferredPrompt;
  const installBanner = document.getElementById('pwa-install-banner');
  const btnInstall = document.getElementById('pwa-btn-install');
  const btnCancel = document.getElementById('pwa-btn-cancel');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) {
      installBanner.style.display = 'flex';
    }
  });

  if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      if (installBanner) installBanner.style.display = 'none';
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      if (installBanner) installBanner.style.display = 'none';
    });
  }
}

// Router
function handleRouting() {
  const hash = window.location.hash || '#accueil';
  const parts = hash.split('?');
  const route = parts[0];
  const queryParams = parseQueryParams(parts[1]);
  
  // Hide all views
  Object.values(views).forEach(view => view.classList.remove('active'));
  Object.values(navItems).forEach(nav => nav.classList.remove('active'));
  
  // Header state defaults
  headerTitle.style.display = 'block';
  headerAvatar.style.display = 'block';
  headerBackBtn.style.display = 'none';
  headerTitle.textContent = 'Alekto';
  
  // Manage Mini Player visibility on Detailed Player view
  if (route === '#audio-detail') {
    miniPlayer.style.display = 'none';
  } else if (playerState.currentAudio) {
    miniPlayer.style.display = 'flex';
  }
  
  switch(route) {
    case '#accueil':
      views.accueil.classList.add('active');
      navItems.accueil.classList.add('active');
      updateContinueListeningCard();
      break;
      
    case '#artistes':
      views.artistes.classList.add('active');
      navItems.artistes.classList.add('active');
      break;
      
    case '#lecture':
      views.lecture.classList.add('active');
      navItems.lecture.classList.add('active');
      break;
      
    case '#audio-detail':
      views.audioDetail.classList.add('active');
      // Keep active bottom tab matching the category or default to home
      navItems.accueil.classList.add('active'); 
      headerAvatar.style.display = 'none';
      headerBackBtn.style.display = 'flex';
      headerTitle.textContent = 'Lecteur Audio';
      
      const audioId = queryParams.id;
      loadAudioIntoPlayer(audioId);
      break;
      
    case '#lecture-detail':
      views.lectureDetail.classList.add('active');
      navItems.lecture.classList.add('active');
      
      const readingId = queryParams.id;
      loadReadingIntoReader(readingId);
      break;
      
    default:
      views.accueil.classList.add('active');
      navItems.accueil.classList.add('active');
      break;
  }
  
  // Auto-scroll to top when switching views
  document.getElementById('app-viewport').scrollTop = 0;
}

// Helpers
function parseQueryParams(queryString) {
  const params = {};
  if (!queryString) return params;
  const pairs = queryString.split('&');
  for (const pair of pairs) {
    const [key, val] = pair.split('=');
    params[key] = decodeURIComponent(val);
  }
  return params;
}

// Rendering Views

// 1. Accueil
function renderAccueil() {
  const container = document.getElementById('dynamic-categories-container');
  if (!container) return;
  container.innerHTML = '';
  
  // Extract dynamic categories from audio.json
  const categories = [...new Set(appData.audio.map(a => a.categorie))];
  
  categories.forEach(cat => {
    const section = document.createElement('div');
    section.className = 'section-container';
    
    const catAudios = appData.audio.filter(a => a.categorie === cat);
    
    let itemsHTML = '';
    catAudios.forEach(audio => {
      // Use different style for "Animaux rigolos" to keep the fun vibe, or keep them all uniform.
      // Let's keep them uniform as cards since they all use the cat image now.
      itemsHTML += `
        <div class="audio-card" onclick="window.location.hash='#audio-detail?id=${audio.id}'">
          <div class="audio-cover-wrapper">
            <div class="audio-cover-img" style="background-image: url('${audio.image}')"></div>
            <button class="play-overlay-btn" aria-label="Jouer">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
            </button>
          </div>
          <div class="audio-info">
            <h4>${audio.titre}</h4>
            <p>${audio.duree.replace(':', ' min ')}</p>
          </div>
        </div>
      `;
    });
    
    section.innerHTML = `
      <div class="section-header">
        <h3>${cat}</h3>
      </div>
      <div class="horizontal-scroll">
        ${itemsHTML}
      </div>
    `;
    
    container.appendChild(section);
  });
}

// Update the orange hero card with progress info
function updateContinueListeningCard() {
  const savedState = localStorage.getItem('alekto_continue_listening');
  if (!savedState) return;
  
  const continueState = JSON.parse(savedState);
  const audio = appData.audio.find(a => a.id === continueState.audioId);
  if (!audio) return;
  
  const cardImg = document.getElementById('hero-continue-img');
  const cardTitle = document.getElementById('hero-continue-title');
  const cardFill = document.getElementById('hero-continue-fill');
  const cardTime = document.getElementById('hero-continue-time');
  const cardPlayBtn = document.getElementById('hero-continue-play-btn');
  
  cardImg.style.backgroundImage = `url('${audio.image}')`;
  cardTitle.textContent = audio.titre;
  
  const progressPercent = (continueState.progressSeconds / continueState.durationSeconds) * 100;
  cardFill.style.width = `${progressPercent}%`;
  
  cardTime.textContent = `${formatTime(continueState.progressSeconds)} / ${formatTime(continueState.durationSeconds)}`;
  
  // Set up click on card
  const card = document.getElementById('continue-listening-card');
  // Avoid duplicating listeners
  card.onclick = () => {
    window.location.hash = `#audio-detail?id=${audio.id}`;
    // Fast forward to saved progress seconds after loading
    setTimeout(() => {
      if (playerState.currentAudio && playerState.currentAudio.id === audio.id) {
        audioEl.currentTime = continueState.progressSeconds;
      }
    }, 100);
  };
}

// 2. Artistes
function renderArtistes() {
  // Articles list inside Artistes View
  const articlesList = document.getElementById('articles-horizontal-list');
  articlesList.innerHTML = '';
  
  const articles = appData.lecture.filter(l => l.type === 'Article');
  articles.forEach(article => {
    const card = document.createElement('div');
    card.className = 'article-h-card';
    
    let displayDate = article.date;
    if (displayDate && displayDate.includes('T')) {
      try {
        displayDate = new Date(displayDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {
        // Fallback
      }
    }

    card.innerHTML = `
      <div class="article-h-cover" style="background-image: url('${article.image}')"></div>
      <div class="article-h-info">
        <h4>${article.titre}</h4>
        <p>${displayDate}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      window.location.hash = `#lecture-detail?id=${article.id}`;
    });
    articlesList.appendChild(card);
  });
  
  // Artist filter pill handlers
  const filterPills = document.querySelectorAll('#view-artistes .filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      const role = pill.getAttribute('data-role');
      filterAndRenderArtists(role);
    });
  });
  
  // Render initial list
  filterAndRenderArtists('Tous');
}

function filterAndRenderArtists(role) {
  const container = document.getElementById('artists-container');
  container.innerHTML = '';
  
  let filteredArtists = appData.artistes;
  if (role !== 'Tous') {
    const mapping = {
      'Écrivains': ['ÉCRITAINE', 'Auteur', 'Autrice'],
      'Narrateurs': ['NARRATEUR', 'Narratrice', 'Actrice'],
      'Illustrateurs': ['Illustrateur', 'Illustratrice']
    };
    
    const keywords = mapping[role] || [];
    filteredArtists = appData.artistes.filter(artist => {
      const artistRole = artist.rôle || artist.role || '';
      return keywords.some(kw => artistRole.toLowerCase().includes(kw.toLowerCase()));
    });
  }
  
  filteredArtists.forEach(artist => {
    const card = document.createElement('div');
    card.className = 'artist-card';
    
    // Role styling
    const artistRole = artist.rôle || artist.role || '';
    let roleClass = 'role-ecrivain';
    if (artistRole.toLowerCase().includes('narrat') || artistRole.toLowerCase().includes('actrice')) {
      roleClass = 'role-narrateur';
    } else if (artistRole.toLowerCase().includes('illustra')) {
      roleClass = 'role-illustrateur';
    }
    
    // Build Creations Thumbnails
    let creationsHTML = '';
    if (artist.derniers_travaux && artist.derniers_travaux.length > 0) {
      creationsHTML += `<div class="artist-creations-title">Ses dernières créations :</div>`;
      creationsHTML += `<div class="artist-creations-row">`;
      artist.derniers_travaux.forEach(img => {
        creationsHTML += `<div class="creation-thumb" style="background-image: url('${img}')"></div>`;
      });
      creationsHTML += `<button class="creation-more-btn">&rarr;</button>`;
      creationsHTML += `</div>`;
    }
    
    // If it's a quote profile (like Yumi Sato)
    let quoteHTML = '';
    if (artist.citation) {
      quoteHTML = `
        <div class="player-section-card orange-dashed-bg" style="margin-top: 12px; padding: 12px 16px;">
          <p style="font-style: italic; font-family: var(--font-serif); font-size: 13px;">"${artist.citation}"</p>
          <div class="artist-creations-row" style="margin-top: 8px;">
            ${artist.citation_travaux.map(t => `<div class="creation-thumb" style="background-image: url('${t}'); border-radius: 6px; width: 44px; height: 32px;"></div>`).join('')}
          </div>
        </div>
      `;
    }
    
    // If it's Marc Voisin (listening block matching mockup 1)
    let specialActionHTML = '';
    if (artist.id === 'marc_voisin') {
      specialActionHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; border-top: 1px solid rgba(43,29,22,0.06); padding-top: 12px;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">&darr; ${artist.nb_histoires}</span>
          <button class="see-all-link" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px;" onclick="window.location.hash='#audio-detail?id=chene_voyageur'">
            Écouter <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
          </button>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="artist-main">
        <div class="artist-photo" style="background-image: url('${artist.image}')"></div>
        <div class="artist-text">
          <h3>${artist.nom}</h3>
          <span class="artist-role-badge ${roleClass}">${artist.role}</span>
        </div>
      </div>
      <div class="artist-bio">${artist.description}</div>
      ${creationsHTML}
      ${quoteHTML}
      ${specialActionHTML}
    `;
    container.appendChild(card);
  });
}

// 3. Lecture
function renderLecture() {
  const filterPills = document.querySelectorAll('#lecture-filters .filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      const type = pill.getAttribute('data-type');
      filterAndRenderReadings(type);
    });
  });
  
  filterAndRenderReadings('Tous');
}

function filterAndRenderReadings(type) {
  const container = document.getElementById('readings-container');
  container.innerHTML = '';
  
  let filteredReadings = appData.lecture;
  if (type !== 'Tous') {
    filteredReadings = appData.lecture.filter(l => l.type === type);
  }
  
  filteredReadings.forEach(item => {
    const card = document.createElement('div');
    
    // Add "featured-reading" class to the first featured story if viewing all
    const isFeatured = item.la_une;
    card.className = `reading-card ${isFeatured ? 'featured-reading' : ''}`;
    
    // Tag formatting
    let tagLabel = item.type;
    let badgeClass = 'type-conte';
    if (item.type === 'Récit') badgeClass = 'type-recit';
    else if (item.type === 'Partition') badgeClass = 'type-partition';
    else if (item.type === 'Théâtre') badgeClass = 'type-theatre';
    else if (item.type === 'Article') badgeClass = 'type-article';
    
    if (isFeatured) {
      tagLabel = `À LA UNE • ${item.type}`;
    }
    
    let authorName = "Inconnu";
    const refList = getArtistIds(item.artiste_ref);
    if (refList.length > 0) {
      const artist = appData.artistes.find(a => a.id === refList[0]);
      if (artist) authorName = artist.nom;
    }

    let displayDate = item.date;
    if (displayDate && displayDate.includes('T')) {
      try {
        displayDate = new Date(displayDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {
        // Fallback
      }
    }

    card.innerHTML = `
      <div class="reading-cover-box" style="background-image: url('${item.image}')">
        <span class="reading-type-pill ${badgeClass}">
          ${item.type === 'Partition' ? '🎵' : '📖'} ${tagLabel}
        </span>
      </div>
      <div class="reading-info">
        <h4>${item.titre}</h4>
        <p>${authorName} • ${displayDate}</p>
        <div class="reading-desc">${item.description}</div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      // PARTITIONS REDIRECT DIRECTLY TO PDF
      if (item.type === 'Partition' && item.pdf_url) {
        window.open(item.pdf_url, '_blank');
      } else {
        // Open internal Reader
        window.location.hash = `#lecture-detail?id=${item.id}`;
      }
    });
    
    container.appendChild(card);
  });
}

// 4. Audio Player Detailed View
function loadAudioIntoPlayer(id) {
  const audio = appData.audio.find(a => a.id === id);
  if (!audio) return;
  
  // If loading a new song
  if (!playerState.currentAudio || playerState.currentAudio.id !== audio.id) {
    playerState.currentAudio = audio;
    audioEl.src = audio.audio_ref;
    audioEl.load();
    playerState.isPlaying = false;
    playerState.currentTime = 0;
  }
  
  // Render Player View HTML Contents
  document.getElementById('player-artwork').style.backgroundImage = `url('${audio.image}')`;
  document.getElementById('player-title').textContent = audio.titre;
  document.getElementById('player-subtitle').textContent = `${audio.categorie} par ${audio.narrateur_nom}`;
  
  document.getElementById('player-description').textContent = audio.description;
  
  // Artists details list (Autrice, compositeur)
  const artistsContainer = document.getElementById('player-artists-list');
  artistsContainer.innerHTML = '';
  
  const refList = getArtistIds(audio.artiste_ref);
  refList.forEach(artId => {
    const artist = appData.artistes.find(art => art.id === artId);
    if (artist) {
      const row = document.createElement('div');
      row.className = 'artist-row-item';
      row.innerHTML = `
        <div class="artist-row-avatar" style="background-image: url('${artist.image}')"></div>
        <div class="artist-row-info">
          <h4>${artist.nom}</h4>
          <p>${artist.rôle || artist.role}</p>
        </div>
      `;
      artistsContainer.appendChild(row);
    }
  });
  
  // Mini player details updating (just in case they go back)
  updateMiniPlayerUI();
  updatePlayPauseUI();
}

function playSiblingAudio(direction) {
  // Move to previous or next audio in list
  if (!playerState.currentAudio) return;
  const currentIndex = appData.audio.findIndex(a => a.id === playerState.currentAudio.id);
  let nextIndex = currentIndex + direction;
  if (nextIndex < 0) nextIndex = appData.audio.length - 1;
  if (nextIndex >= appData.audio.length) nextIndex = 0;
  
  const nextAudio = appData.audio[nextIndex];
  window.location.hash = `#audio-detail?id=${nextAudio.id}`;
  
  // Auto play
  setTimeout(() => {
    playAudio();
  }, 150);
}

// 5. Lecture text reader View
async function loadReadingIntoReader(id) {
  const reading = appData.lecture.find(l => l.id === id);
  if (!reading) return;
  
  readerState.currentReading = reading;
  
  // Resolve Author from first artiste_ref
  const authorName = getFirstArtistName(reading.artiste_ref);

  // Reader view header updates
  document.getElementById('reader-title-display').textContent = reading.titre;
  document.getElementById('reader-author-display').textContent = `Par ${authorName}`;
  document.getElementById('reader-type-text').textContent = reading.type || 'Lecture';
  
  const contentArea = document.getElementById('reader-content-area');
  const pageControls = document.getElementById('reader-page-controls');
  contentArea.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Chargement...</div>';
  
  if (reading.pdf_url) {
    let pdfPath = reading.pdf_url;
    if (pdfPath && !pdfPath.startsWith('http://') && !pdfPath.startsWith('https://')) {
      pdfPath = './' + pdfPath;
    }
    contentArea.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px; width: 100%;">
        <p style="text-align: center; color: var(--text-muted);">Ce document est disponible au format PDF.</p>
        <iframe src="${pdfPath}" style="width: 100%; height: 500px; border: 1px solid var(--text-muted); border-radius: var(--radius-md);"></iframe>
        <a href="${pdfPath}" target="_blank" class="font-btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px; background-color: var(--color-orange); border-color: var(--color-orange); color: white; padding: 10px 20px;">
          Ouvrir le PDF dans un nouvel onglet
        </a>
      </div>
    `;
    pageControls.style.display = 'none';
  } else if (reading.ref_md) {
    try {
      const res = await fetch(reading.ref_md);
      const markdown = await res.text();
      
      // Parse pages using horizontal line separator '---'
      const rawPages = markdown.split(/\n---\r?\n/);
      readerState.pages = rawPages.map(page => parseMarkdown(page));
      readerState.currentPageIndex = 0;
      
      displayReaderPage();
      setupReaderTapNavigation();
    } catch (error) {
      console.error("Erreur de chargement du fichier Markdown :", error);
      if (reading.contenu) {
        renderContenu(reading.contenu);
      } else {
        contentArea.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--color-brown);">Impossible de charger le texte.</div>`;
        pageControls.style.display = 'none';
      }
    }
  } else if (reading.contenu) {
    renderContenu(reading.contenu);
  } else {
    contentArea.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Aucun contenu disponible.</div>`;
    pageControls.style.display = 'none';
  }
}

function renderContenu(text) {
  readerState.pages = [parseMarkdown(text)];
  readerState.currentPageIndex = 0;
  displayReaderPage();
  setupReaderTapNavigation();
}
}

// Display page of markdown in book view
function displayReaderPage() {
  const contentArea = document.getElementById('reader-content-area');
  const pageControls = document.getElementById('reader-page-controls');
  const pageIndicator = document.getElementById('reader-page-indicator');
  const pageProgress = document.getElementById('reader-page-progress');
  
  if (readerState.pages.length === 0) return;
  
  let pageHtml = readerState.pages[readerState.currentPageIndex];
  
  // Add Dropcap to first paragraph of first page
  if (readerState.currentPageIndex === 0) {
    pageHtml = applyDropcap(pageHtml);
  }
  
  contentArea.innerHTML = pageHtml;
  
  // If only 1 page (like typical articles)
  if (readerState.pages.length <= 1) {
    pageControls.style.display = 'none';
  } else {
    pageControls.style.display = 'flex';
    pageIndicator.textContent = `Page ${readerState.currentPageIndex + 1} sur ${readerState.pages.length}`;
    
    const progressPercent = ((readerState.currentPageIndex + 1) / readerState.pages.length) * 100;
    pageProgress.style.width = `${progressPercent}%`;
  }
  
  // Scroll reader view back to top
  contentArea.scrollTop = 0;
}

function setupReaderTapNavigation() {
  const contentArea = document.getElementById('reader-content-area');
  
  // Clean old event listeners
  contentArea.onclick = null;
  
  // Simple Kindle-style tap areas (left 30% page back, right 70% page forward)
  contentArea.addEventListener('click', (e) => {
    // If it's an article (single page), ignore tap pagination
    if (readerState.pages.length <= 1) return;
    
    // Ignore clicks on links or interactive elements
    if (e.target.tagName === 'A' || e.target.closest('button')) return;
    
    const rect = contentArea.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    if (clickX < width * 0.3) {
      // Tap Left: Prev Page
      changePage(-1);
    } else {
      // Tap Right: Next Page
      changePage(1);
    }
  });
}

function changePage(direction) {
  const newIndex = readerState.currentPageIndex + direction;
  if (newIndex >= 0 && newIndex < readerState.pages.length) {
    readerState.currentPageIndex = newIndex;
    displayReaderPage();
  }
}

// Simple regex markdown parser
function parseMarkdown(md) {
  let html = md.trim();
  
  // Escape HTML tags to prevent injections but allow formatting
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Recover double-escaped standard dividers we might want
  
  // Headings
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  
  // Bold and Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Blockquotes (styled)
  html = html.replace(/^&gt;\s*(.*?)$/gm, '<blockquote>$1</blockquote>');
  
  // Custom actor lists in play scripts (e.g. **GOUPIL** *(se pavanant)*)
  html = html.replace(/\*(\(.*?\))\*/g, '<span class="stage-direction">$1</span>');
  
  // Lists
  // Simple markdown bullet points
  html = html.replace(/^\-\s*(.*?)$/gm, '<li>$1</li>');
  
  // Paragraph split (double return)
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<h') || block.startsWith('<blockquote') || block.startsWith('<li>')) {
      return block;
    }
    // If it's a list item, let's wrap it in <ul>
    if (block.startsWith('<li>')) {
      return `<ul>${block}</ul>`;
    }
    return `<p>${block}</p>`;
  }).join('\n');
  
  // Consecutive lists wrapper cleanup
  html = html.replace(/<\/ul>\n<ul>/g, '');
  
  return html;
}

function applyDropcap(html) {
  // Finds the first character inside the first <p> paragraph and wraps it in dropcap span
  const match = html.match(/<p>(.)(.*?)<\/p>/s);
  if (match) {
    const firstChar = match[1];
    const restOfPara = match[2];
    const replacement = `<p class="dropcap-paragraph"><span class="dropcap">${firstChar}</span>${restOfPara}</p>`;
    return html.replace(match[0], replacement);
  }
  return html;
}

// Audio Player Control Logic

function playAudio() {
  audioEl.play().then(() => {
    playerState.isPlaying = true;
    updatePlayPauseUI();
    document.getElementById('mini-status-text').textContent = 'Lecture en cours';
    
    // Save state to localStorage for Continuer l'écoute card
    savePlaybackState();
  }).catch(err => {
    console.error("Erreur de lecture audio :", err);
    // Silent audio mock might fail on first gesture. Let user trigger it.
  });
}

function pauseAudio() {
  audioEl.pause();
  playerState.isPlaying = false;
  updatePlayPauseUI();
  document.getElementById('mini-status-text').textContent = 'Lecture en pause';
  savePlaybackState();
}

function togglePlayPause() {
  if (!playerState.currentAudio) return;
  if (playerState.isPlaying) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function seekRelative(seconds) {
  if (!playerState.currentAudio) return;
  audioEl.currentTime = Math.max(0, Math.min(audioEl.duration, audioEl.currentTime + seconds));
}

function seekToPercentage(percent) {
  if (!playerState.currentAudio || !audioEl.duration) return;
  audioEl.currentTime = percent * audioEl.duration;
}

function handleAudioTimeUpdate() {
  playerState.currentTime = audioEl.currentTime;
  
  // Save current progress every few seconds
  if (Math.floor(playerState.currentTime) % 5 === 0) {
    savePlaybackState();
  }
  
  updatePlayerProgressUI();
}

// Save player state for "Continuer l'écoute" card
function savePlaybackState() {
  if (!playerState.currentAudio) return;
  
  const continueState = {
    audioId: playerState.currentAudio.id,
    progressSeconds: Math.floor(playerState.currentTime),
    durationSeconds: Math.floor(playerState.duration || audioEl.duration || 600)
  };
  localStorage.setItem('alekto_continue_listening', JSON.stringify(continueState));
}

// UI Sync Functions

function updatePlayPauseUI() {
  const mainPlayBtn = document.getElementById('btn-main-play');
  const mainPlayIcon = document.getElementById('main-play-icon');
  
  const miniPlayIcon = document.getElementById('mini-play-icon');
  const coverPlayBtn = document.querySelector('.cover-control-buttons .play-pause-btn svg');
  
  const playSvg = `<polygon points="6 4 20 12 6 20 6 4"></polygon>`;
  const pauseSvg = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
  
  if (playerState.isPlaying) {
    mainPlayIcon.innerHTML = pauseSvg;
    miniPlayIcon.innerHTML = pauseSvg;
    if (coverPlayBtn) coverPlayBtn.innerHTML = pauseSvg;
  } else {
    mainPlayIcon.innerHTML = playSvg;
    miniPlayIcon.innerHTML = playSvg;
    if (coverPlayBtn) coverPlayBtn.innerHTML = playSvg;
  }
}

function updateMiniPlayerUI() {
  if (!playerState.currentAudio) {
    miniPlayer.style.display = 'none';
    return;
  }
  
  // Don't show mini player if currently inside the Detailed player view
  const hash = window.location.hash || '#accueil';
  if (hash.startsWith('#audio-detail')) {
    miniPlayer.style.display = 'none';
  } else {
    miniPlayer.style.display = 'flex';
  }
  
  document.getElementById('mini-cover-img').style.backgroundImage = `url('${playerState.currentAudio.image}')`;
  document.getElementById('mini-title').textContent = playerState.currentAudio.titre;
  document.getElementById('mini-narrator').textContent = `Narré par ${playerState.currentAudio.narrateur_nom}`;
}

function updatePlayerDurationUI() {
  document.getElementById('player-time-duration').textContent = formatTime(playerState.duration);
  
  // Update cover mini durations as well
  const coverEnd = document.getElementById('player-cover-time-end');
  if (coverEnd) coverEnd.textContent = formatTime(playerState.duration);
}

function updatePlayerProgressUI() {
  const current = playerState.currentTime;
  const duration = playerState.duration || audioEl.duration || 1;
  const percentage = (current / duration) * 100;
  
  // Update Detailed Player Time Displays
  document.getElementById('player-time-current').textContent = formatTime(current);
  
  // Update cover mini start time
  const coverStart = document.getElementById('player-cover-time-start');
  if (coverStart) coverStart.textContent = formatTime(current);
  
  const coverFill = document.querySelector('.cover-mini-progress-fill');
  if (coverFill) coverFill.style.width = `${percentage}%`;
  
  // Seeker Wavy Progress SVG fill
  const progressPath = document.getElementById('wave-progress-path');
  const totalLength = progressPath.getTotalLength ? progressPath.getTotalLength() : 300;
  
  progressPath.style.strokeDasharray = totalLength;
  progressPath.style.strokeDashoffset = totalLength - (percentage / 100) * totalLength;
  
  // Move thumb ball slider
  const thumb = document.getElementById('wave-seeker-thumb');
  thumb.style.left = `${percentage}%`;
  
  // Update Mini Player progress
  document.getElementById('mini-progress-fill').style.width = `${percentage}%`;
  
  // Update the mini-player's duration as it plays
  updateMiniPlayerUI();
}

// Convert seconds into standard MM:SS string
function formatTime(secs) {
  if (isNaN(secs)) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Get comma-separated string of artist names from reference IDs
function getArtistIds(artisteRef) {
  if (!artisteRef) return [];
  if (Array.isArray(artisteRef)) return artisteRef;
  if (typeof artisteRef === 'string') {
    return artisteRef.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function getArtistNameString(artisteRef) {
  const refList = getArtistIds(artisteRef);
  return refList.map(refId => {
    const artist = appData.artistes.find(a => a.id === refId);
    return artist ? artist.nom : '';
  }).filter(name => name !== '').join(' & ');
}

function getFirstArtistName(artisteRef) {
  const refList = getArtistIds(artisteRef);
  if (refList.length === 0) return 'Inconnu';
  const artist = appData.artistes.find(a => a.id === refList[0]);
  return artist ? artist.nom : 'Inconnu';
}
