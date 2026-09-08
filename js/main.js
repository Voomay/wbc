/**
 * Wesbank Baptist Church - Main JavaScript
 * Interactive functionality: Countdown, Audio Player, Prayer Wall, Mobile Nav
 */

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initHeroSlider();
  initPhotoGallery();
  initMobileNav();
  initScrollEffects();
  initSermonAudioPlayer();
  initPrayerWall();
  initGivingClipboard();
  initContactForm();
  initChurchChatWidget();
});

/* ==========================================================================
   1. SUNDAY SERVICE COUNTDOWN TIMER (Every Sunday 09:30 AM SAST)
   ========================================================================== */
function initCountdown() {
  const daysEl = document.getElementById('timer-days');
  const hoursEl = document.getElementById('timer-hours');
  const minsEl = document.getElementById('timer-mins');
  const secsEl = document.getElementById('timer-secs');
  const serviceLabelEl = document.getElementById('countdown-service-title');

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  function getNextSundayService() {
    const now = new Date();
    // Sunday is day 0
    const dayOfWeek = now.getDay();
    const serviceTarget = new Date(now);

    let daysUntilSunday = (7 - dayOfWeek) % 7;

    // Set time to 10:00:00 AM
    serviceTarget.setDate(now.getDate() + daysUntilSunday);
    serviceTarget.setHours(10, 0, 0, 0);

    // If today is Sunday
    if (dayOfWeek === 0) {
      const serviceEnd = new Date(now);
      serviceEnd.setHours(12, 0, 0, 0);

      // If currently between 09:30 and 11:30
      if (now >= serviceTarget && now <= serviceEnd) {
        return { isLive: true, targetDate: serviceEnd };
      }
      // If Sunday afternoon past 11:30, target next Sunday
      if (now > serviceEnd) {
        serviceTarget.setDate(serviceTarget.getDate() + 7);
      }
    }

    return { isLive: false, targetDate: serviceTarget };
  }

  function updateTimer() {
    const { isLive, targetDate } = getNextSundayService();
    const now = new Date();
    const diff = targetDate - now;

    if (isLive) {
      if (serviceLabelEl) serviceLabelEl.textContent = "Service In Progress! Join Us Now";
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      return;
    }

    if (serviceLabelEl) serviceLabelEl.textContent = "Sunday Morning Worship";

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ==========================================================================
   2. MOBILE NAVIGATION DRAWER
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileToggle');
  const closeBtn = document.getElementById('mobileCloseBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  const backdrop = document.getElementById('mobileNavBackdrop');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!toggleBtn || !drawer || !backdrop) return;

  function openMenu() {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);

  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/* ==========================================================================
   3. SCROLL EFFECTS & BACK TO TOP
   ========================================================================== */
function initScrollEffects() {
  const header = document.querySelector('.site-header');
  const backToTopBtn = document.getElementById('backToTopBtn');

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;

    if (header) {
      if (scrollPos > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    if (backToTopBtn) {
      if (scrollPos > 450) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ==========================================================================
   4. INTERACTIVE SERMON AUDIO PLAYER (Web Audio API synth + progress)
   ========================================================================== */
function initSermonAudioPlayer() {
  const playBtn = document.getElementById('audioPlayPauseBtn');
  const iconPlay = document.getElementById('iconPlay');
  const iconPause = document.getElementById('iconPause');
  const progressFill = document.getElementById('audioProgressFill');
  const progressBar = document.getElementById('audioProgressBar');
  const currentTimeEl = document.getElementById('audioCurrentTime');
  const totalDurationEl = document.getElementById('audioTotalDuration');
  const visualizer = document.getElementById('audioVisualizer');
  const rewindBtn = document.getElementById('audioRewindBtn');
  const forwardBtn = document.getElementById('audioForwardBtn');

  if (!playBtn) return;

  let isPlaying = false;
  let currentSeconds = 0;
  const totalSeconds = 34 * 60 + 12; // 34 mins 12 secs
  let timerInterval = null;

  // Web Audio ambient tone generator
  let audioCtx = null;
  let osc1 = null, osc2 = null, gainNode = null;

  function initSynth() {
    if (audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioCtx = new AudioContext();

      // Create gentle church ambient chord (F major / C warm pad)
      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gainNode.connect(audioCtx.destination);

      osc1 = audioCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(174.61, audioCtx.currentTime); // F3

      osc2 = audioCtx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4

      osc1.connect(gainNode);
      osc2.connect(gainNode);

      osc1.start();
      osc2.start();
    } catch (e) {
      console.warn("AudioContext not allowed without user gesture", e);
    }
  }

  function startAudioSynth() {
    initSynth();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (gainNode && audioCtx) {
      gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 1.2);
    }
  }

  function stopAudioSynth() {
    if (gainNode && audioCtx) {
      gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
    }
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  if (totalDurationEl) {
    totalDurationEl.textContent = formatTime(totalSeconds);
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      if (visualizer) visualizer.classList.add('playing');
      startAudioSynth();

      timerInterval = setInterval(() => {
        currentSeconds += 1;
        if (currentSeconds >= totalSeconds) {
          currentSeconds = 0;
          togglePlay();
          return;
        }
        updatePlayerUI();
      }, 1000);
    } else {
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      if (visualizer) visualizer.classList.remove('playing');
      stopAudioSynth();
      clearInterval(timerInterval);
    }
  }

  function updatePlayerUI() {
    if (currentTimeEl) currentTimeEl.textContent = formatTime(currentSeconds);
    const pct = (currentSeconds / totalSeconds) * 100;
    if (progressFill) progressFill.style.width = `${pct}%`;
  }

  playBtn.addEventListener('click', togglePlay);

  if (rewindBtn) {
    rewindBtn.addEventListener('click', () => {
      currentSeconds = Math.max(0, currentSeconds - 15);
      updatePlayerUI();
    });
  }

  if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
      currentSeconds = Math.min(totalSeconds, currentSeconds + 15);
      updatePlayerUI();
    });
  }

  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      currentSeconds = Math.floor(ratio * totalSeconds);
      updatePlayerUI();
    });
  }
}

/* ==========================================================================
   5. INTERACTIVE COMMUNITY PRAYER WALL
   ========================================================================== */
function initPrayerWall() {
  const form = document.getElementById('prayerRequestForm');
  const feed = document.getElementById('prayerWallFeed');

  // Initial seed prayers
  const defaultPrayers = [
    {
      id: 'prayer-1',
      name: 'Sister Rachel & Family',
      date: 'Yesterday',
      text: 'Praying for divine health and strength for our elderly community members in Wesbank, and for open doors for our young people seeking employment.',
      prayersCount: 28,
      prayed: false
    },
    {
      id: 'prayer-2',
      name: 'Wesbank Outreach Team',
      date: '3 days ago',
      text: 'Thanking God for the faithful provision in our weekly feeding scheme! Praying for more partners and sponsors as we prepare meals for over 500 children this Saturday.',
      prayersCount: 45,
      prayed: false
    },
    {
      id: 'prayer-3',
      name: 'Brother Jerome',
      date: '5 days ago',
      text: 'Please hold our matriculants and high school learners in prayer during their upcoming test exams. May the Lord grant them wisdom, focus, and peace of mind.',
      prayersCount: 19,
      prayed: false
    }
  ];

  // Load from localStorage or seed
  let storedPrayers = [];
  try {
    const raw = localStorage.getItem('wesbank_prayers');
    if (raw) {
      storedPrayers = JSON.parse(raw);
    } else {
      storedPrayers = defaultPrayers;
      localStorage.setItem('wesbank_prayers', JSON.stringify(storedPrayers));
    }
  } catch (e) {
    storedPrayers = defaultPrayers;
  }

  function renderPrayerItem(prayer) {
    const card = document.createElement('div');
    card.className = 'prayer-wall-item';
    card.id = prayer.id;
    card.innerHTML = `
      <div class="prayer-item-header">
        <span class="prayer-author">${escapeHtml(prayer.name)}</span>
        <span class="prayer-date">${prayer.date}</span>
      </div>
      <p class="prayer-body-text">${escapeHtml(prayer.text)}</p>
      <div class="prayer-action-bar">
        <button type="button" class="pray-btn ${prayer.prayed ? 'prayed' : ''}" data-id="${prayer.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${prayer.prayed ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>${prayer.prayed ? 'Prayed' : 'I Prayed'}</span>
        </button>
        <span class="pray-count" id="count-${prayer.id}">${prayer.prayersCount} people praying</span>
      </div>
    `;

    // Hook up button
    const btn = card.querySelector('.pray-btn');
    btn.addEventListener('click', () => {
      togglePrayerSupport(prayer.id);
    });

    return card;
  }

  function renderFeed() {
    if (!feed) return;
    feed.innerHTML = '';
    storedPrayers.forEach(prayer => {
      feed.appendChild(renderPrayerItem(prayer));
    });
  }

  function togglePrayerSupport(id) {
    const item = storedPrayers.find(p => p.id === id);
    if (!item) return;

    if (!item.prayed) {
      item.prayed = true;
      item.prayersCount += 1;
      showToast("Thank you for joining in prayer! 🙏");
    } else {
      item.prayed = false;
      item.prayersCount = Math.max(0, item.prayersCount - 1);
    }

    try {
      localStorage.setItem('wesbank_prayers', JSON.stringify(storedPrayers));
    } catch (e) {}

    renderFeed();
  }

  renderFeed();

  // Form submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('prayerName');
      const textInput = document.getElementById('prayerMessage');
      const isConfidential = document.getElementById('prayerConfidential').checked;

      const name = nameInput.value.trim() || 'Anonymous';
      const text = textInput.value.trim();

      if (!text) {
        showToast("Please enter your prayer request.");
        return;
      }

      if (isConfidential) {
        showToast("Your confidential prayer request was sent to Pastor Jonathan Pretorius.");
        form.reset();
        return;
      }

      const newPrayer = {
        id: 'prayer-' + Date.now(),
        name: name,
        date: 'Just now',
        text: text,
        prayersCount: 1,
        prayed: true
      };

      storedPrayers.unshift(newPrayer);
      try {
        localStorage.setItem('wesbank_prayers', JSON.stringify(storedPrayers));
      } catch (e) {}

      renderFeed();
      form.reset();
      showToast("Your prayer request has been shared on the church wall.");
    });
  }
}

/* ==========================================================================
   6. GIVING & TITHE CLIPBOARD UTILITY
   ========================================================================== */
function initGivingClipboard() {
  const copyBtns = document.querySelectorAll('.copy-btn');

  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const copyVal = btn.getAttribute('data-copy');
      if (!copyVal) return;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(copyVal).then(() => {
          showToast(`Copied to clipboard: ${copyVal}`);
        }).catch(() => {
          fallbackCopy(copyVal);
        });
      } else {
        fallbackCopy(copyVal);
      }
    });
  });

  function fallbackCopy(text) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast(`Copied: ${text}`);
  }
}

/* ==========================================================================
   7. CONTACT FORM SUBMISSION
   ========================================================================== */
function initContactForm() {
  const contactForm = document.getElementById('churchContactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !message) {
      showToast("Please fill in your name and message.");
      return;
    }

    showToast(`Thank you, ${name}! Your message has been received. We will be in touch soon.`);
    contactForm.reset();
  });
}

/* ==========================================================================
   8. TOAST NOTIFICATION HELPER
   ========================================================================== */
function showToast(message) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

function escapeHtml(string) {
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}

/* ==========================================================================
   9. HERO IMAGE SLIDER (5 Authentic Church Photos, Auto-advance, Dots, Swipe)
   ========================================================================== */
function initHeroSlider() {
  const slider = document.getElementById('heroSlider');
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.slider-dot');
  const prevBtn = document.getElementById('sliderPrevBtn');
  const nextBtn = document.getElementById('sliderNextBtn');
  const captionEl = document.getElementById('sliderCaptionText');

  if (!slider || slides.length === 0) return;

  let currentIndex = 0;
  let timer = null;
  const slideIntervalMs = 5000;

  function setSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    slides[currentIndex].classList.remove('active');
    if (dots[currentIndex]) dots[currentIndex].classList.remove('active');

    currentIndex = index;

    slides[currentIndex].classList.add('active');
    if (dots[currentIndex]) dots[currentIndex].classList.add('active');

    if (captionEl) {
      const cap = slides[currentIndex].getAttribute('data-caption') || '';
      captionEl.textContent = cap;
    }
  }

  function startAuto() {
    stopAuto();
    timer = setInterval(() => {
      setSlide(currentIndex + 1);
    }, slideIntervalMs);
  }

  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      setSlide(currentIndex - 1);
      startAuto();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      setSlide(currentIndex + 1);
      startAuto();
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-slide'), 10);
      if (!isNaN(idx)) {
        setSlide(idx);
        startAuto();
      }
    });
  });

  // Pause auto-rotation on mouse hover
  slider.addEventListener('mouseenter', stopAuto);
  slider.addEventListener('mouseleave', startAuto);
  const navWrap = document.querySelector('.hero-slider-nav');
  if (navWrap) {
    navWrap.addEventListener('mouseenter', stopAuto);
    navWrap.addEventListener('mouseleave', startAuto);
  }

  // Touch Swipe for Mobile Phones
  let startX = 0;
  slider.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].screenX;
    stopAuto();
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].screenX;
    const diff = startX - endX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        setSlide(currentIndex + 1); // Swiped left -> next slide
      } else {
        setSlide(currentIndex - 1); // Swiped right -> previous slide
      }
    }
    startAuto();
  }, { passive: true });

  startAuto();
}

/* ==========================================================================
   10. CHURCH LIFE PHOTO GALLERY & LIGHTBOX
   ========================================================================== */
function initPhotoGallery() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const cards = document.querySelectorAll('.gallery-card');
  const lightbox = document.getElementById('galleryLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxTag = document.getElementById('lightboxTag');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxOverlay = document.getElementById('lightboxOverlay');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  if (!cards.length) return;

  // Filter functionality
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      cards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.classList.remove('hidden');
          card.style.animation = 'lightboxZoomIn 0.35s ease';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // Lightbox Data & Navigation
  let currentLightboxIdx = 0;
  let visibleCards = [];

  function getVisibleCards() {
    return Array.from(cards).filter(c => !c.classList.contains('hidden'));
  }

  function openLightbox(card) {
    visibleCards = getVisibleCards();
    const idx = visibleCards.indexOf(card);
    if (idx !== -1) {
      showPhoto(idx);
      if (lightbox) {
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    }
  }

  function showPhoto(idx) {
    visibleCards = getVisibleCards();
    if (visibleCards.length === 0) return;

    if (idx < 0) idx = visibleCards.length - 1;
    if (idx >= visibleCards.length) idx = 0;
    currentLightboxIdx = idx;

    const activeCard = visibleCards[currentLightboxIdx];
    const img = activeCard.querySelector('img');
    const title = activeCard.querySelector('.gallery-card-title');
    const desc = activeCard.querySelector('.gallery-card-desc');
    const badge = activeCard.querySelector('.gallery-badge');

    if (lightboxImg && img) {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
    }
    if (lightboxTitle && title) lightboxTitle.textContent = title.textContent;
    if (lightboxDesc && desc) lightboxDesc.textContent = desc.textContent;
    if (lightboxTag && badge) lightboxTag.textContent = badge.textContent;
    if (lightboxCounter) lightboxCounter.textContent = `${currentLightboxIdx + 1} / ${visibleCards.length}`;
  }

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // Card click events
  cards.forEach((card) => {
    card.addEventListener('click', () => openLightbox(card));
  });

  // Lightbox controls
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxOverlay) lightboxOverlay.addEventListener('click', closeLightbox);
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      showPhoto(currentLightboxIdx - 1);
    });
  }
  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      showPhoto(currentLightboxIdx + 1);
    });
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPhoto(currentLightboxIdx - 1);
    if (e.key === 'ArrowRight') showPhoto(currentLightboxIdx + 1);
  });

  // Mobile swipe on lightbox
  if (lightbox) {
    let lbStartX = 0;
    lightbox.addEventListener('touchstart', (e) => {
      lbStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      const lbEndX = e.changedTouches[0].screenX;
      const diff = lbStartX - lbEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          showPhoto(currentLightboxIdx + 1);
        } else {
          showPhoto(currentLightboxIdx - 1);
        }
      }
    }, { passive: true });
  }
}

/* ==========================================================================
   9. FLOATING CHURCH CHATBOT ASSISTANT
   ========================================================================== */
function initChurchChatWidget() {
  const floaterBtn = document.getElementById('churchChatFloaterBtn');
  const chatWindow = document.getElementById('churchChatWindow');
  const closeBtn = document.getElementById('churchChatCloseBtn');
  const messagesContainer = document.getElementById('churchChatMessages');
  const chatForm = document.getElementById('churchChatForm');
  const chatInput = document.getElementById('churchChatInput');

  if (!floaterBtn || !chatWindow || !messagesContainer) return;

  let isOpen = false;

  function toggleChat(open) {
    isOpen = typeof open === 'boolean' ? open : !isOpen;
    if (isOpen) {
      chatWindow.classList.add('active');
      floaterBtn.classList.add('open');
      chatWindow.setAttribute('aria-hidden', 'false');
      if (chatInput && window.innerWidth > 768) {
        setTimeout(() => chatInput.focus(), 300);
      }
    } else {
      chatWindow.classList.remove('active');
      floaterBtn.classList.remove('open');
      chatWindow.setAttribute('aria-hidden', 'true');
    }
  }

  floaterBtn.addEventListener('click', () => toggleChat());
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleChat(false);
    });
  }

  // Pre-configured questions and rich church answers
  const churchKnowledgeBase = {
    times: {
      question: "Sunday Service Times",
      answer: `
        <strong>Sunday Worship Times:</strong><br>
        &bull; <strong>09:00 AM – 10:00 AM</strong>: Sunday School (Children &amp; Adult Bible Classes)<br>
        &bull; <strong>10:00 AM – 12:00 PM</strong>: Main Sunday Morning Worship &amp; Preaching<br><br>
        <em>"Therefore go and make disciples of all nations..." &mdash; Matt 28:19</em>
      `,
      actions: [
        { label: "Join Us Sunday", href: "#services" },
        { label: "Church Location", href: "#location" }
      ]
    },
    schedule: {
      question: "Weekly Church Schedule",
      answer: `
        <strong>Weekly Ministries &amp; Gatherings:</strong><br>
        &bull; <strong>Wednesday (19:00 – 20:30)</strong>: Midweek Bible Study &amp; Corporate Prayer<br>
        &bull; <strong>Friday (18:30 – 20:30)</strong>: Wesbank Youth Fellowship &amp; Mentorship<br>
        &bull; <strong>Saturday (11:00 AM)</strong>: Community Feeding Scheme Outreach<br>
        &bull; <strong>Sunday (09:00 AM)</strong>: Sunday School &amp; Kingdom Kids<br>
        &bull; <strong>Sunday (10:00 AM)</strong>: Sunday Morning Worship Service
      `,
      actions: [
        { label: "View Ministries", href: "#ministries" },
        { label: "Feeding Scheme", href: "#outreach" }
      ]
    },
    prayer: {
      question: "Prayer Group Times & Wall",
      answer: `
        <strong>Prayer Gatherings &amp; Intercession:</strong><br>
        &bull; <strong>Wednesday Prayer Meeting</strong>: Every Wednesday at <strong>19:00 SAST</strong> at the church.<br>
        &bull; <strong>Sunday Pre-Service Prayer</strong>: Every Sunday morning from <strong>09:15 AM</strong>.<br><br>
        You can also post your personal prayer request anytime on our website prayer wall for our deacons and pastoral team to pray over:
      `,
      actions: [
        { label: "Post on Prayer Wall", href: "#prayer" },
        { label: "Call Church Office", href: "tel:+27219096316" }
      ]
    },
    location: {
      question: "Church Location & Directions",
      answer: `
        <strong>Physical Address:</strong><br>
        📍 <strong>141 Diepwater St, Wesbank, Cape Town, 7580</strong><br><br>
        Easily accessible via Stellenbosch Arterial and Hindle Road in Kuils River. All visitors, families, and seekers are warmly welcomed!
      `,
      actions: [
        { label: "Google Maps Directions", href: "https://maps.google.com/?q=-33.966347,18.657777", target: "_blank" },
        { label: "Contact Details", href: "#location" }
      ]
    },
    contact: {
      question: "Contact & Pastoral Details",
      answer: `
        <strong>Wesbank Baptist Church Contact:</strong><br>
        &bull; <strong>Office Phone</strong>: <a href="tel:+27219096316" style="color: var(--primary); font-weight: 700;">021 909 6316</a><br>
        &bull; <strong>Senior Pastor</strong>: Pastor Jonathan Pretorius<br>
        &bull; <strong>First Lady</strong>: Sister Jacqueline Pretorius<br>
        &bull; <strong>Facebook Page</strong>: <a href="https://www.facebook.com/wesbankbaptistchurch/" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">facebook.com/wesbankbaptistchurch</a>
      `,
      actions: [
        { label: "Call: 021 909 6316", href: "tel:+27219096316" },
        { label: "Send Message", href: "#location" }
      ]
    },
    feeding: {
      question: "Community Feeding Scheme",
      answer: `
        <strong>The Heart of Wesbank Outreach:</strong><br>
        Every week our church prepares hot nutritious meals, groceries, and bread packages to feed vulnerable children and families across the Wesbank community.<br><br>
        Led by Pastor Jonathan, First Lady Jacqueline, and the Deacon Board.
      `,
      actions: [
        { label: "Feeding Details", href: "#outreach" },
        { label: "Support Outreach", href: "#giving" }
      ]
    },
    giving: {
      question: "Church Banking Details (EFT)",
      answer: `
        <strong>Official Church Bank Details:</strong><br>
        &bull; <strong>Bank</strong>: ABSA Bank<br>
        &bull; <strong>Account Name</strong>: Wesbank Baptist Church<br>
        &bull; <strong>Account Number</strong>: <code>406 328 8813</code><br>
        &bull; <strong>Branch Code</strong>: <code>632 005</code><br>
        &bull; <strong>Account Type</strong>: Cheque Account<br><br>
        <em>Reference: Your Surname &amp; TITHE / FEEDING</em>
      `,
      actions: [
        { label: "Go to Giving Section", href: "#giving" }
      ]
    }
  };

  // Helper to append message
  function appendMessage(sender, htmlContent, actions = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = htmlContent;

    if (actions && actions.length > 0) {
      const actionsWrap = document.createElement('div');
      actionsWrap.style.marginTop = '8px';
      actions.forEach(act => {
        const a = document.createElement('a');
        a.className = 'chat-action-link';
        a.href = act.href;
        if (act.target) a.target = act.target;
        if (act.target === '_blank') a.rel = 'noopener noreferrer';
        a.textContent = act.label;
        a.addEventListener('click', () => {
          if (act.href.startsWith('#') && window.innerWidth <= 768) {
            toggleChat(false);
          }
        });
        actionsWrap.appendChild(a);
      });
      bubble.appendChild(actionsWrap);
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    const now = new Date();
    timeSpan.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    msgDiv.appendChild(bubble);
    msgDiv.appendChild(timeSpan);
    messagesContainer.appendChild(msgDiv);

    // Auto-scroll
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show typing indicator
  function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg bot typing-msg';
    typingDiv.innerHTML = `
      <div class="typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typingDiv;
  }

  // Handle Query
  function handleQuery(queryKey, userLabel = null) {
    const data = churchKnowledgeBase[queryKey];
    const userText = userLabel || (data ? data.question : queryKey);

    // Show user question
    appendMessage('user', escapeHtml(userText));

    // Show typing
    const typingEl = showTypingIndicator();

    setTimeout(() => {
      if (typingEl && typingEl.parentNode) {
        typingEl.parentNode.removeChild(typingEl);
      }

      if (data) {
        appendMessage('bot', data.answer, data.actions);
      } else {
        findMatchingAnswer(queryKey);
      }

      appendFollowUpChips();
    }, 450);
  }

  function appendFollowUpChips() {
    const chipsDiv = document.createElement('div');
    chipsDiv.className = 'chat-quick-chips';
    chipsDiv.style.marginTop = '6px';
    chipsDiv.innerHTML = `
      <button type="button" class="chip-btn" data-query="times">🕒 Sunday Service</button>
      <button type="button" class="chip-btn" data-query="prayer">🙏 Prayer Times</button>
      <button type="button" class="chip-btn" data-query="schedule">📅 Weekly Schedule</button>
      <button type="button" class="chip-btn" data-query="location">📍 Location</button>
      <button type="button" class="chip-btn" data-query="contact">📞 Contact Details</button>
    `;
    messagesContainer.appendChild(chipsDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    chipsDiv.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-query');
        handleQuery(q, btn.textContent.trim());
      });
    });
  }

  function findMatchingAnswer(rawText) {
    const text = rawText.toLowerCase();

    if (text.includes('time') || text.includes('hour') || text.includes('sunday') || text.includes('service') || text.includes('worship') || text.includes('start') || text.includes('when')) {
      const data = churchKnowledgeBase.times;
      appendMessage('bot', data.answer, data.actions);
    } else if (text.includes('prayer') || text.includes('pray') || text.includes('intercession')) {
      const data = churchKnowledgeBase.prayer;
      appendMessage('bot', data.answer, data.actions);
    } else if (text.includes('schedule') || text.includes('week') || text.includes('wednesday') || text.includes('friday') || text.includes('activities')) {
      const data = churchKnowledgeBase.schedule;
      appendMessage('bot', data.answer, data.actions);
    } else if (text.includes('where') || text.includes('location') || text.includes('address') || text.includes('map') || text.includes('directions') || text.includes('kuils')) {
      const data = churchKnowledgeBase.location;
      appendMessage('bot', data.answer, data.actions);
    } else if (text.includes('contact') || text.includes('phone') || text.includes('call') || text.includes('number') || text.includes('pastor') || text.includes('jonathan')) {
      const data = churchKnowledgeBase.contact;
      appendMessage('bot', data.answer, data.actions);
    } else if (text.includes('feed') || text.includes('food') || text.includes('outreach') || text.includes('soup') || text.includes('hunger') || text.includes('children')) {
      const data = churchKnowledgeBase.feeding;
      appendMessage('bot', data.answer, data.actions);
    } else if (text.includes('give') || text.includes('giving') || text.includes('bank') || text.includes('account') || text.includes('tithe') || text.includes('offering') || text.includes('eft') || text.includes('absa')) {
      const data = churchKnowledgeBase.giving;
      appendMessage('bot', data.answer, data.actions);
    } else if (text.includes('youth') || text.includes('kids') || text.includes('children')) {
      appendMessage('bot', `
        <strong>Youth &amp; Children's Ministries:</strong><br>
        &bull; <strong>Kingdom Kids</strong>: Every Sunday morning during Sunday School (09:00 AM)<br>
        &bull; <strong>Wesbank Youth Fellowship</strong>: Every Friday evening at 18:30 – 20:30<br><br>
        Fun, spiritual mentorship, music, and wholesome Christian fellowship!
      `, [
        { label: "Youth Details", href: "#ministries" }
      ]);
    } else if (text.includes('hello') || text.includes('hi') || text.includes('hey') || text.includes('greetings') || text.includes('welcome')) {
      appendMessage('bot', `
        <strong>Welcome to Wesbank Baptist Church!</strong><br>
        Peace and blessings in Jesus' name! How can we help you today? Feel free to tap one of our quick topics or ask anything about our services, ministries, or prayer wall.
      `, [
        { label: "Service Times", href: "#services" },
        { label: "Prayer Wall", href: "#prayer" }
      ]);
    } else {
      appendMessage('bot', `
        Thank you for reaching out! For this inquiry or personal pastoral assistance, please call our church office at <a href="tel:+27219096316" style="color: var(--primary); font-weight: 700;">021 909 6316</a> or join us this Sunday morning at 10:00 AM!
      `, [
        { label: "Call Church Office", href: "tel:+27219096316" },
        { label: "Service Times", href: "#services" },
        { label: "Church Location", href: "#location" }
      ]);
    }
  }

  // Handle Initial Chip Clicks
  const initialChips = document.getElementById('churchChatPills');
  if (initialChips) {
    initialChips.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        handleQuery(query, btn.textContent.trim());
      });
    });
  }

  // Handle Form Submit
  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = chatInput.value.trim();
      if (!val) return;
      chatInput.value = '';
      handleQuery(val, val);
    });
  }

  // Keyboard close on Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      toggleChat(false);
    }
  });
}
