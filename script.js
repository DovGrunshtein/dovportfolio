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

  e.preventDefault();
  const targetId = href.substring(1);
  const targetElement = document.getElementById(targetId);

  if (targetElement) {
    const nav = document.querySelector("nav#desktop-nav") || document.querySelector("nav#hamburger-nav");
    const navHeight = nav ? nav.offsetHeight : 0;
    const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

    window.scrollTo({ top: offsetTop, behavior: "smooth" });

    // Close hamburger menu if a link inside it is clicked
    if (link.closest("#hamburger-nav")) {
        toggleMenu();
    }
  }
});


// Image popup functionality for pictures.html
if (document.body.classList.contains("gallery-page")) {
  const galleryImages = document.querySelectorAll(".gallery img");
const popupOverlay = document.getElementById("popup-overlay");
const popupImage = document.getElementById("popup-image");

  if (galleryImages.length > 0 && popupOverlay && popupImage) {
    // Use event delegation for better performance
    document.querySelectorAll('.gallery').forEach(gallery => {
      gallery.addEventListener('click', (e) => {
        const img = e.target.closest('img');
        if (img) {
          // Set the image source to the full-size version
          popupImage.src = img.getAttribute('data-full');
          popupImage.alt = img.alt;
          
          // Show the overlay
          popupOverlay.style.display = 'flex';
          document.body.style.overflow = 'hidden';
          
          // Trigger the animation after a small delay
          requestAnimationFrame(() => {
    popupOverlay.classList.add("show");
          });
        }
  });
});

    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        // Remove the show class first for fade out
  popupOverlay.classList.remove("show");
        
        // Wait for the fade out animation to complete
        setTimeout(() => {
          popupOverlay.style.display = 'none';
          document.body.style.overflow = '';
        }, 300); // Match this with the CSS transition duration
      }
    });

    // Close popup with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popupOverlay.classList.contains('show')) {
        // Remove the show class first for fade out
        popupOverlay.classList.remove("show");

        // Wait for the fade out animation to complete
        setTimeout(() => {
          popupOverlay.style.display = 'none';
          document.body.style.overflow = '';
        }, 300); // Match this with the CSS transition duration
      }
    });
  }
}

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