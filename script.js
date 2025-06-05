function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  menu.classList.toggle("open");
  icon.classList.toggle("open");
}

const images = document.querySelectorAll(".gallery img");
const popupOverlay = document.getElementById("popup-overlay");
const popupImage = document.getElementById("popup-image");

images.forEach(img => {
  img.addEventListener("click", () => {
    popupImage.src = img.src;
    popupOverlay.classList.add("show");
  });
});

popupOverlay.addEventListener("click", () => {
  popupOverlay.classList.remove("show");
});

document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll('section:not(#experience)');
  const titles = document.querySelectorAll('.section-title:not(#experience .section-title)');
  const brandNames = document.querySelectorAll('.brand-name');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  // Observe all sections, titles, and brand names except Knowledge section
  sections.forEach(section => observer.observe(section));
  titles.forEach(title => observer.observe(title));
  brandNames.forEach(name => observer.observe(name));
});

// Carousel functionality
let currentIndex = 0;
const track = document.querySelector('.carousel-track');
const items = document.querySelectorAll('.carousel-item');
const dotsContainer = document.querySelector('.carousel-dots');

// Create dots
items.forEach((_, index) => {
  const dot = document.createElement('div');
  dot.classList.add('dot');
  if (index === 0) dot.classList.add('active');
  dot.addEventListener('click', () => goToSlide(index));
  dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll('.dot');

function updateDots() {
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentIndex);
  });
}

function moveCarousel(direction) {
  currentIndex = (currentIndex + direction + items.length) % items.length;
  updateCarousel();
}

function goToSlide(index) {
  currentIndex = index;
  updateCarousel();
}

function updateCarousel() {
  const offset = -currentIndex * (280 + 20); // item width + gap
  track.style.transform = `translateX(${offset}px)`;
  updateDots();
}

// Optional: Auto-play functionality
let autoplayInterval;

function startAutoplay() {
  autoplayInterval = setInterval(() => {
    moveCarousel(1);
  }, 5000); // Change slide every 5 seconds
}

function stopAutoplay() {
  clearInterval(autoplayInterval);
}

// Start autoplay when the page loads
document.addEventListener('DOMContentLoaded', () => {
  startAutoplay();
  
  // Stop autoplay when user interacts with the carousel
  const carousel = document.querySelector('.carousel');
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
});

// Scroll to top functionality
const scrollToTopButton = document.createElement('div');
scrollToTopButton.className = 'scroll-to-top';
document.body.appendChild(scrollToTopButton);

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 300) {
    scrollToTopButton.classList.add('visible');
  } else {
    scrollToTopButton.classList.remove('visible');
  }
});

scrollToTopButton.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// Add hover sound effect for buttons
const buttons = document.querySelectorAll('.btn');
buttons.forEach(button => {
  button.addEventListener('mouseenter', () => {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
    audio.volume = 0.1;
    audio.play();
  });
});

// Add parallax effect to profile image
const profileImage = document.querySelector('.section__pic-container img');
if (profileImage) {
  window.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const xPos = (clientX / window.innerWidth - 0.5) * 20;
    const yPos = (clientY / window.innerHeight - 0.5) * 20;
    profileImage.style.transform = `translate(${xPos}px, ${yPos}px)`;
  });
}

// Add typing effect to title
const title = document.querySelector('.title');
if (title) {
  const text = title.textContent;
  title.textContent = '';
  let i = 0;
  const typeWriter = () => {
    if (i < text.length) {
      title.textContent += text.charAt(i);
      i++;
      setTimeout(typeWriter, 100);
    }
  };
  typeWriter();
}

// Video popup functionality
const videoPopupOverlay = document.getElementById('video-popup-overlay');
const popupVideo = document.getElementById('popup-video');
const closePopupBtn = document.querySelector('.close-popup');
const videos = document.querySelectorAll('.video-row video');

videos.forEach(video => {
  // Listen for play event
  video.addEventListener('play', (e) => {
    e.preventDefault(); // Prevent default play
    const videoSrc = video.querySelector('source').src;
    popupVideo.querySelector('source').src = videoSrc;
    popupVideo.load();
    videoPopupOverlay.classList.add('show');
    popupVideo.play();
  });

  // Prevent default play on click
  video.addEventListener('click', (e) => {
    e.preventDefault();
  });
});

closePopupBtn.addEventListener('click', () => {
  videoPopupOverlay.classList.remove('show');
  popupVideo.pause();
  popupVideo.currentTime = 0;
});

videoPopupOverlay.addEventListener('click', (e) => {
  if (e.target === videoPopupOverlay) {
    videoPopupOverlay.classList.remove('show');
    popupVideo.pause();
    popupVideo.currentTime = 0;
  }
});