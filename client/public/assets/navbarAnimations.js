// navbarAnimations.js - Navbar animation system
// Underline Reveal + Soft Glow + Micro-Lift + Scroll-Aware

import { ANIMATION_TIMINGS, EASINGS } from './sharedEasings.js';
import { safeScale, safeTranslate, shouldDisableAnimations } from './reducedMotion.js';

let gsap, ScrollTrigger;

// Initialize GSAP
if (typeof window !== 'undefined') {
  gsap = window.gsap;
  ScrollTrigger = window.ScrollTrigger;
}

let lastScrollY = 0;
let scrollDirection = 'up';
let navbar = null;

/**
 * Initialize navbar animations
 */
export function initNavbarAnimations() {
  if (shouldDisableAnimations()) return;

  navbar = document.querySelector('header.header, .header, nav[data-anim="nav-scroll"]')?.closest('header') || 
           document.querySelector('header.header');

  if (!navbar) return;

  // Select navbar links
  const navLinks = document.querySelectorAll(
    '.nav-item, nav a, .nav-link, [data-anim="nav-link"], .nav a.nav-link'
  );

  if (navLinks.length === 0) return;

  // Initialize link animations
  navLinks.forEach(link => {
    if (link.hasAttribute('data-nav-anim-initialized')) return;
    link.setAttribute('data-nav-anim-initialized', 'true');
    link.classList.add('nav-link-animated');

    // Underline and glow on hover
    link.addEventListener('pointerenter', handleNavHoverEnter, { passive: true });
    link.addEventListener('pointerleave', handleNavHoverLeave, { passive: true });

    // Check if active
    updateActiveState(link);
  });

  // Scroll-aware navbar behavior
  initScrollAwareNavbar();

  // Update active states on navigation
  updateActiveNavLinks();
}

/**
 * Handle nav hover enter
 */
function handleNavHoverEnter(e) {
  const link = e.currentTarget;
  if (link.classList.contains('nav-link-active')) return;

  if (gsap) {
    // Micro-lift: translateY -2px, scale 1.03
    gsap.to(link, {
      y: safeTranslate(-2),
      scale: safeScale(1.03),
      duration: ANIMATION_TIMINGS.medium,
      ease: EASINGS.smooth
    });

    // Underline reveal
    const afterEl = link;
    gsap.to(afterEl, {
      '--underline-scale': 1,
      '--glow-opacity': 0.2,
      duration: ANIMATION_TIMINGS.medium,
      ease: EASINGS.smooth
    });
  }
}

/**
 * Handle nav hover leave
 */
function handleNavHoverLeave(e) {
  const link = e.currentTarget;
  if (link.classList.contains('nav-link-active')) return;

  if (gsap) {
    // Return to normal
    gsap.to(link, {
      y: 0,
      scale: 1,
      duration: ANIMATION_TIMINGS.medium,
      ease: EASINGS.smooth
    });

    // Hide underline
    const afterEl = link;
    gsap.to(afterEl, {
      '--underline-scale': 0,
      '--glow-opacity': 0,
      duration: ANIMATION_TIMINGS.medium,
      ease: EASINGS.smooth
    });
  }
}

/**
 * Update active state
 */
function updateActiveState(link) {
  const href = link.getAttribute('href');
  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;

  // Check if active
  const isActive = 
    (href === currentPath) ||
    (href === currentHash) ||
    (currentHash && href.endsWith(currentHash)) ||
    link.classList.contains('active') ||
    link.getAttribute('aria-current') === 'page';

  if (isActive) {
    link.classList.add('nav-link-active');
    if (gsap) {
      gsap.to(link, {
        '--underline-scale': 1,
        '--glow-opacity': 0.15,
        duration: 0,
        ease: EASINGS.smooth
      });
    }
  } else {
    link.classList.remove('nav-link-active');
  }
}

/**
 * Update all active nav links
 */
function updateActiveNavLinks() {
  const navLinks = document.querySelectorAll(
    '.nav-item, nav a, .nav-link, [data-anim="nav-link"], .nav a.nav-link'
  );
  navLinks.forEach(updateActiveState);
}

/**
 * Initialize scroll-aware navbar
 */
function initScrollAwareNavbar() {
  if (!navbar || !gsap) return;

  let ticking = false;

  const handleScroll = () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const currentScrollY = window.scrollY || window.pageYOffset;
      scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
      lastScrollY = currentScrollY;

      // Hide/show navbar based on scroll direction
      if (scrollDirection === 'down' && currentScrollY > 50) {
        // Hide navbar (slide up, reduce opacity)
        gsap.to(navbar, {
          y: -20,
          opacity: 0.8,
          duration: ANIMATION_TIMINGS.medium,
          ease: EASINGS.smooth
        });

        // Add background blur after 50px scroll
        if (currentScrollY > 50) {
          navbar.classList.add('navbar-scrolled');
        }
      } else if (scrollDirection === 'up' || currentScrollY < 50) {
        // Show navbar (slide to full visible)
        gsap.to(navbar, {
          y: 0,
          opacity: 1,
          duration: ANIMATION_TIMINGS.medium,
          ease: EASINGS.smooth
        });

        if (currentScrollY < 50) {
          navbar.classList.remove('navbar-scrolled');
        }
      }

      ticking = false;
    });
  };

  // Use ScrollTrigger if available, otherwise use scroll listener
  if (ScrollTrigger && gsap) {
    ScrollTrigger.create({
      start: 'top top',
      end: 'max',
      onUpdate: (self) => {
        const scrollY = self.scroll();
        scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
        lastScrollY = scrollY;

        if (scrollDirection === 'down' && scrollY > 50) {
          gsap.to(navbar, {
            y: -20,
            opacity: 0.8,
            duration: ANIMATION_TIMINGS.medium,
            ease: EASINGS.smooth
          });
          navbar.classList.add('navbar-scrolled');
        } else if (scrollDirection === 'up' || scrollY < 50) {
          gsap.to(navbar, {
            y: 0,
            opacity: 1,
            duration: ANIMATION_TIMINGS.medium,
            ease: EASINGS.smooth
          });
          if (scrollY < 50) {
            navbar.classList.remove('navbar-scrolled');
          }
        }
      }
    });
  } else {
    // Fallback to scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  function tryInit() {
    if (!gsap) {
      gsap = window.gsap;
      ScrollTrigger = window.ScrollTrigger;
    }
    if (gsap) {
      initNavbarAnimations();
    } else {
      // Retry after a short delay if GSAP not loaded yet
      setTimeout(tryInit, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }

  // Re-initialize on navigation
  window.addEventListener('hashchange', updateActiveNavLinks);
  window.addEventListener('popstate', updateActiveNavLinks);

  // Re-initialize on dynamic content
  const observer = new MutationObserver(() => {
    if (gsap) {
      initNavbarAnimations();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

