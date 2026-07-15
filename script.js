// תפריט המבורגר
function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  if (menu && icon) {
  menu.classList.toggle("open");
  icon.classList.toggle("open");
}
}

// פונקציית דיבאונס לשימוש בגלילה
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// גלילה חלקה (עודכן לשימוש עם Lenis)
document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;

  const href = link.getAttribute("href");
  
  // Prevent smooth scroll for links that don't start with #
  if (!href || !href.startsWith("#")) return;

  // Don't interfere with gallery sub-nav on pictures page
  const targetId = href.substring(1);
  const targetElement = document.getElementById(targetId);

  if (targetElement) {
    e.preventDefault();
    const nav = document.querySelector("nav#desktop-nav") || document.querySelector("nav#hamburger-nav");
    const subNav = document.querySelector(".gallery-sub-nav");
    const navHeight = (nav ? nav.offsetHeight : 0) + (subNav ? subNav.offsetHeight : 0);
    const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

    window.scrollTo({ top: offsetTop, behavior: "smooth" });

    // Close hamburger menu if a link inside it is clicked
    if (link.closest("#hamburger-nav")) {
        toggleMenu();
    }
  }
});


// =====================================================
// IMAGE POPUP FUNCTIONALITY FOR GALLERY PAGES
// =====================================================
(function() {
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    const popupOverlay = document.getElementById("popup-overlay");
    const popupImage = document.getElementById("popup-image");

    if (!popupOverlay || !popupImage) return; // Exit if popup elements don't exist

    // Open popup when clicking on any image with data-full attribute
    document.addEventListener('click', function(e) {
      const img = e.target.closest('img[data-full]');
      
      if (img) {
        e.preventDefault();
        e.stopPropagation();

        const fullSrc = img.getAttribute('data-full');
        if (fullSrc) {
          popupImage.src = fullSrc;
          popupImage.alt = img.alt || 'Gallery Image';
          
          popupOverlay.style.display = 'flex';
          document.body.style.overflow = 'hidden';
          
          requestAnimationFrame(() => {
            popupOverlay.classList.add("show");
          });
        }
      }
    });

    // Close popup when clicking on overlay (but not on the image itself)
    popupOverlay.addEventListener("click", function(e) {
      if (e.target === popupOverlay) {
        closePopup();
      }
    });

    // Close popup with Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && popupOverlay.classList.contains('show')) {
        closePopup();
      }
    });

    function closePopup() {
      popupOverlay.classList.remove("show");
      setTimeout(() => {
        popupOverlay.style.display = 'none';
        document.body.style.overflow = '';
        popupImage.src = ''; // Clear image source
      }, 300);
    }
  });
})();

// Video popup functionality
function openVideoPopup(videoSrc) {
  const popup = document.getElementById('video-popup-overlay');
  const video = document.getElementById('popup-video');
  if (popup && video) {
    video.src = videoSrc;
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => popup.classList.add('visible'));
    video.play();
  }
}

function closeVideoPopup() {
  const popup = document.getElementById('video-popup-overlay');
  const video = document.getElementById('popup-video');
  if (popup && video) {
    popup.classList.remove('visible');
    video.pause();
    setTimeout(() => {
      popup.style.display = 'none';
      video.src = '';
      document.body.style.overflow = '';
    }, 350);
  }
}

// YouTube popup functionality
function openYouTubePopup(youtubeId) {
  const popup = document.getElementById('youtube-popup-overlay');
  const iframe = document.getElementById('popup-youtube');
  if (!popup || !iframe) {
    console.error('YouTube Popup elements not found!');
    return;
  }
  iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
  popup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => popup.classList.add('visible'));
}

function closeYouTubePopup() {
  const popup = document.getElementById('youtube-popup-overlay');
  const iframe = document.getElementById('popup-youtube');
  if (popup && iframe) {
    popup.classList.remove('visible');
    setTimeout(() => {
      popup.style.display = 'none';
      iframe.src = '';
      document.body.style.overflow = '';
    }, 350);
  }
}

// ✅ הדגשת קישור סיידבר לפי מיקום גלילה
const sections = document.querySelectorAll("main section[id]");
const sidebarLinks = document.querySelectorAll(".sidebar a");

const updateActiveSidebarLink = debounce(() => {
  const nav = document.querySelector("nav#desktop-nav") || document.querySelector("nav#hamburger-nav");
  const navHeight = (nav ? nav.offsetHeight : 0) + 25;
  let currentSectionId = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - navHeight;
    if (window.pageYOffset >= sectionTop) {
      currentSectionId = section.id;
    }
  });

  sidebarLinks.forEach((link) => {
    const linkHref = link.getAttribute("href");
    link.classList.toggle("active", linkHref && linkHref.substring(1) === currentSectionId);
  });
}, 100);

if (sidebarLinks.length > 0) {
  window.addEventListener("scroll", updateActiveSidebarLink, { passive: true });
  updateActiveSidebarLink();
}

// Scroll to top button functionality
const scrollToTopBtn = document.querySelector(".scroll-to-top");

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) { // Show button after scrolling 300px
        scrollToTopBtn.classList.add('visible');
    } else {
        scrollToTopBtn.classList.remove('visible');
    }
}, { passive: true });


// DOMContentLoaded to set up initial state and listeners
document.addEventListener('DOMContentLoaded', function() {
  
  // Initialize AOS (Animate on Scroll) Library
  AOS.init({
    duration: 800, // Animation duration in milliseconds
    once: true,    // Whether animation should happen only once
    offset: 50,    // Trigger the animation 50px before the element is in view
  });

  // Add click handlers to all video thumbnails
  const thumbnails = document.querySelectorAll('.video-thumbnail');
  thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', function() {
      const videoSrc = this.getAttribute('data-video-src');
      const youtubeId = this.getAttribute('data-youtube-id');
      if (videoSrc) {
        openVideoPopup(videoSrc);
      } else if (youtubeId) {
        openYouTubePopup(youtubeId);
      }
    });
    // Make thumbnail focusable for keyboard users
    thumbnail.setAttribute('tabindex', '0');
    // Allow Enter/Space to trigger click
    thumbnail.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });

  // Close video popup when clicking outside the video
  const videoPopup = document.getElementById('video-popup-overlay');
  if (videoPopup) {
    videoPopup.addEventListener('click', function(e) {
      if (e.target === this) {
        closeVideoPopup();
      }
    });
  }
  
  // Close YouTube popup when clicking outside the video
  const youtubePopup = document.getElementById('youtube-popup-overlay');
  if (youtubePopup) {
    youtubePopup.addEventListener('click', function(e) {
      if (e.target === this) {
        closeYouTubePopup();
      }
    });
  }
  
  // Close popups when pressing Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeVideoPopup();
      closeYouTubePopup();
    }
  });
  
  // Page loader — remove from DOM after curtain animation ends
  const loader = document.querySelector('.page-loader');
  if (loader) {
    loader.addEventListener('animationend', () => loader.remove(), { once: true });
    setTimeout(() => loader.remove(), 1500); // fallback
  }

  // Scroll indicator — click scrolls to #about (home) or one viewport down (gallery pages)
  document.querySelectorAll('.scroll-indicator').forEach((scrollIndicator) => {
    scrollIndicator.addEventListener('click', () => {
      const about = document.getElementById('about');
      if (about) {
        const nav = document.querySelector('nav#desktop-nav') || document.querySelector('nav#hamburger-nav');
        const navHeight = nav ? nav.offsetHeight : 0;
        window.scrollTo({ top: about.offsetTop - navHeight - 20, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: window.innerHeight * 0.92, behavior: 'smooth' });
      }
    });
  });

  // Set initial language from localStorage
  setLanguage(localStorage.getItem('language') || 'en');

  // Social Media section
  var socialSection = document.getElementById('social');
  if (socialSection) {
    socialSection.querySelectorAll('.youtube-thumbnail').forEach(function(thumb) {
      thumb.addEventListener('click', function() {
        var overlay = document.getElementById('youtube-popup-overlay');
        if (overlay) overlay.classList.add('vertical-reel');
      });
    });
  }

  // All other YouTube thumbnails (outside Social Media)
  document.querySelectorAll('.youtube-thumbnail').forEach(function(thumb) {
    // Only add this if not in Social Media
    if (!socialSection || !socialSection.contains(thumb)) {
      thumb.addEventListener('click', function() {
        var overlay = document.getElementById('youtube-popup-overlay');
        if (overlay) overlay.classList.remove('vertical-reel');
      });
    }
  });
});


// ====================================================================
// =================== LANGUAGE SWITCHER FUNCTIONALITY ================
// ====================================================================

function setLanguage(lang) {
    const isHebrew = lang === 'he';

    document.documentElement.lang = lang;
    document.documentElement.dir = isHebrew ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-en][data-he]').forEach(el => {
        const text = el.getAttribute(isHebrew ? 'data-he' : 'data-en');
        // Use innerHTML to correctly render <br> tags
        if(el.innerHTML.includes('<br>')){
            el.innerHTML = text;
        } else {
            el.textContent = text;
        }
    });

    // Update body font-family
    document.body.style.fontFamily = isHebrew 
        ? "'Noto Sans Hebrew', 'Arial', sans-serif" 
        : "'Poppins', sans-serif";
        
    // Save preference
    localStorage.setItem('language', lang);
}

function toggleLanguage() {
    const currentLang = localStorage.getItem('language') || 'en';
    const newLang = currentLang === 'en' ? 'he' : 'en';
    setLanguage(newLang);
}

// Set initial language on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
});

// Nav — transparent when at hero, glassmorphism when scrolled
(function () {
  const navs = document.querySelectorAll('nav#desktop-nav, nav#hamburger-nav');
  function updateNav() {
    const atTop = window.scrollY < 60;
    navs.forEach(nav => nav.classList.toggle('nav-top', atTop));
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
})();

// =================================
// ===== CUSTOM CURSOR =============
// =================================
(function () {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  // Only activate on fine-pointer (mouse) devices
  if (!window.matchMedia('(pointer: fine)').matches) {
    dot.style.display = 'none';
    ring.style.display = 'none';
    return;
  }

  let ringX = 0, ringY = 0;
  let mouseX = 0, mouseY = 0;
  let rafId;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  // Ring follows with smooth lag
  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    rafId = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Expand ring on interactive elements
  const hoverTargets = 'a, button, .video-thumbnail, .masonry-item, .project-box, .gallery img, .contact-info-container, .hamburger-icon';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.add('expanded');
      dot.classList.add('expanded');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.remove('expanded');
      dot.classList.remove('expanded');
    }
  });

  // Hide when leaving window
  document.addEventListener('mouseleave', () => { dot.classList.add('hidden'); ring.classList.add('hidden'); });
  document.addEventListener('mouseenter', () => { dot.classList.remove('hidden'); ring.classList.remove('hidden'); });
})();

// =================================
// ===== PROJECT BOX 3D TILT =======
// =================================
(function () {
  const boxes = document.querySelectorAll('.project-box');
  if (!boxes.length) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  boxes.forEach(box => {
    box.addEventListener('mousemove', (e) => {
      const rect = box.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      const tiltX = (-y * 10).toFixed(2); // rotate around X axis
      const tiltY = ( x * 10).toFixed(2); // rotate around Y axis
      box.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.04)`;
    });

    box.addEventListener('mouseleave', () => {
      box.style.transform = '';
    });
  });
})();

// =================================
// ===== MAGNETIC ELEMENTS =========
// =================================
(function() {
  if (!window.matchMedia('(pointer: fine)').matches) return; // Only for mouse

  const targets = document.querySelectorAll('.btn, .hamburger-icon, #desktop-nav .nav-links a');
  
  targets.forEach(elem => {
    elem.classList.add('magnetic');
    
    elem.addEventListener('mousemove', (e) => {
      const rect = elem.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // reduce transition during movement for snappiness
      elem.style.transition = 'transform 0.1s ease-out';
      elem.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });

    elem.addEventListener('mouseleave', () => {
      // restore smooth transition for bounce back
      elem.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      elem.style.transform = 'translate(0px, 0px)';
    });
  });
})();

// ==========================================
// ===== HOME: SCROLL-LINKED DISSOLVE =======
// ==========================================
// The hero and about background images dissolve in/out
// based on scroll position (cinematic cross-dissolve feel).
(function () {
  const heroBg = document.querySelector('.hero-bg');
  const aboutBg = document.querySelector('.about-bg');
  const aboutSection = document.getElementById('about');
  if (!heroBg && !aboutBg) return;

  let ticking = false;
  const clamp = (v) => Math.min(Math.max(v, 0), 1);

  function update() {
    ticking = false;
    const vh = window.innerHeight;

    // Hero image dissolves out (with a slight zoom) over the first ~85% of the viewport scroll
    if (heroBg) {
      const p = clamp(window.scrollY / (vh * 0.85));
      heroBg.style.opacity = (1 - p).toFixed(3);
      heroBg.style.transform = 'scale(' + (1 + p * 0.05).toFixed(4) + ')';
    }

    // About image dissolves in as it enters the viewport, and out as it leaves
    if (aboutBg && aboutSection) {
      const rect = aboutSection.getBoundingClientRect();
      const fadeIn  = clamp(1 - rect.top / (vh * 0.75));
      const fadeOut = clamp(rect.bottom / (vh * 0.45));
      aboutBg.style.opacity = Math.min(fadeIn, fadeOut).toFixed(3);
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();

// =================================
// ===== SEAMLESS TRANSITIONS ======
// =================================
(function() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link || !link.href) return;
    
    // Ignore internal anchor links
    const currentBase = window.location.href.split('#')[0];
    const linkBase = link.href.split('#')[0];
    if (linkBase === currentBase) return;
    
    // Ignore external links or new tabs
    if (link.hostname !== window.location.hostname || link.target === '_blank') return;

    e.preventDefault();
    
    // Create and append an exit curtain
    const exitLoader = document.createElement('div');
    exitLoader.className = 'page-loader';
    exitLoader.style.animation = 'none'; // Prevent entrance animation
    exitLoader.style.transformOrigin = 'bottom';
    exitLoader.style.transform = 'scaleY(0)';
    exitLoader.style.zIndex = '100000';
    document.body.appendChild(exitLoader);

    // Trigger exit animation
    requestAnimationFrame(() => {
      exitLoader.style.transition = 'transform 0.5s cubic-bezier(0.77, 0, 0.175, 1)';
      exitLoader.style.transform = 'scaleY(1)';
    });

    // Navigate after animation
    setTimeout(() => {
      window.location.href = link.href;
    }, 500);
  });
})();