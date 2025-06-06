// Function to toggle the hamburger menu
function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  if (menu && icon) {
    menu.classList.toggle("open");
    icon.classList.toggle("open");
  }
}

// Function to scroll to the top of the page
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}


document.addEventListener("DOMContentLoaded", () => {
  // --- CORE FUNCTIONALITY ---

  // Image popup functionality for pictures.html
  if (document.body.classList.contains("gallery-page")) {
    const galleryImages = document.querySelectorAll(".gallery img");
    const popupOverlay = document.getElementById("popup-overlay");
    const popupImage = document.getElementById("popup-image");

    if (galleryImages.length > 0 && popupOverlay && popupImage) {
      galleryImages.forEach((img) => {
        img.addEventListener("click", () => {
          popupImage.src = img.src;
          popupImage.alt = img.alt;
          popupOverlay.classList.add("show");
          document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
      });

      popupOverlay.addEventListener("click", (e) => {
        // Close popup only if the overlay background is clicked
        if (e.target === popupOverlay) {
          popupOverlay.classList.remove("show");
          document.body.style.overflow = ''; // Restore scrolling
        }
      });
    }
  }

  // --- UNIFIED SCROLLING LOGIC WITH NAVIGATION OFFSET FIX ---
  // This section handles all internal links (#) to fix the issue where the 
  // sticky nav covers the section title.
  const allNavLinks = document.querySelectorAll(
    '#desktop-nav a, #hamburger-nav a, .sidebar a, footer a'
  );

  allNavLinks.forEach(link => {
    link.addEventListener("click", function(e) {
      const href = this.getAttribute("href");
      
      // Check if it's an internal link on the same page
      if (href && href.startsWith("#")) {
        e.preventDefault(); // Stop the default anchor jump
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          // 1. Find the currently visible navigation bar
          const navElement = document.querySelector("nav#desktop-nav") || document.querySelector("nav#hamburger-nav");
          // 2. Get its height, default to 0
          const navHeight = navElement ? navElement.offsetHeight : 0;
          // 3. Calculate target's position
          const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
          // 4. Calculate final position with offset (nav height + 20px buffer)
          const offsetPosition = elementPosition - navHeight - 20;

          // 5. Scroll smoothly
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
          
          // If the hamburger menu link was clicked, close the menu
          if(this.closest('#hamburger-nav')) {
            toggleMenu();
          }
        }
      } else if (href && href.includes("#")) {
        // Handle links to other pages with hashes (e.g., index.html#about)
        // This part is a simple navigation. For a seamless scroll after page load,
        // the logic would need to be more complex (e.g., using localStorage).
        // For now, it will navigate to the page.
        return; 
      }
    });
  });
  
  // Highlight current section in sidebar on scroll
  const sections = document.querySelectorAll("main section[id]");
  const sidebarLinks = document.querySelectorAll(".sidebar a");
  
  function updateActiveSidebarLink() {
      // Return early if there's no sidebar on the page
      if (sidebarLinks.length === 0 || sections.length === 0) return;

      let currentSectionId = "";
      const navElement = document.querySelector("nav#desktop-nav") || document.querySelector("nav#hamburger-nav");
      const navHeight = (navElement ? navElement.offsetHeight : 0) + 25; // Add buffer

      sections.forEach(section => {
          const sectionTop = section.offsetTop - navHeight;
          if (window.pageYOffset >= sectionTop) {
              currentSectionId = section.id;
          }
      });
      
      sidebarLinks.forEach(link => {
          link.classList.remove("active");
          const linkHref = link.getAttribute("href");
          if (linkHref && linkHref.substring(1) === currentSectionId) {
              link.classList.add("active");
          }
      });
  }

  // Add scroll listener only on pages with a sidebar
  if (document.querySelector('.sidebar')) {
      window.addEventListener("scroll", updateActiveSidebarLink);
      updateActiveSidebarLink(); // Run on load
  }


  // Scroll-to-top button visibility
  const scrollToTopBtn = document.querySelector(".scroll-to-top");
  if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }
    });
  }

  // --- OPTIONAL ANIMATIONS (can be removed if not needed) ---
  
  // Intersection Observer for fade-in section animations
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('section').forEach(section => {
    sectionObserver.observe(section);
  });

  // Parallax effect for profile image (if on homepage)
  const profileImageForParallax = document.querySelector('#profile .parallax-effect');
  if (profileImageForParallax) {
    window.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 10; // Reduced intensity
      const yPos = (clientY / window.innerHeight - 0.5) * 10;
      profileImageForParallax.style.transform = `translate(${xPos}px, ${yPos}px)`;
    });
  }

  // Typing effect for title (if on homepage)
  const titleElementForTyping = document.querySelector('.title.typing-effect');
  if (titleElementForTyping) {
    const originalText = titleElementForTyping.textContent;
    titleElementForTyping.textContent = '';
    let i = 0;
    const typeWriter = () => {
      if (i < originalText.length) {
        titleElementForTyping.textContent += originalText.charAt(i);
        i++;
        setTimeout(typeWriter, 100);
      }
    };

    const typingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting && i === 0){ // Type only once when it becomes visible
                typeWriter();
                typingObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.8 });
    typingObserver.observe(titleElementForTyping);
  }
});
