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

// גלילה חלקה עם קיזוז ניווט
document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;

  const href = link.getAttribute("href");
  
  // Prevent smooth scroll for links that don't start with #
  if (!href || !href.startsWith("#")) return;

  // Don't interfere with gallery sub-nav on pictures page
  e.preventDefault();
  const targetId = href.substring(1);
  const targetElement = document.getElementById(targetId);

  if (targetElement) {
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
  
  if(popup && video){
  video.src = videoSrc;
  popup.style.display = 'flex';
  video.play();
  }
}

function closeVideoPopup() {
  const popup = document.getElementById('video-popup-overlay');
  const video = document.getElementById('popup-video');
  
  if(popup && video){
  video.pause();
  video.src = '';
  popup.style.display = 'none';
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
  
  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
  
  iframe.src = embedUrl;
  popup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeYouTubePopup() {
  const popup = document.getElementById('youtube-popup-overlay');
  const iframe = document.getElementById('popup-youtube');
  
  if(popup && iframe){
      iframe.src = '';
      popup.style.display = 'none';
      document.body.style.overflow = '';
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