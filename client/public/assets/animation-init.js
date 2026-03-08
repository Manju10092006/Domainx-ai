// animation-init.js - Production-ready GSAP + Lottie animation system
// ESM module for modern browsers

// Import GSAP and plugins (using CDN fallback if module imports fail)
let gsap, ScrollTrigger, MotionPathPlugin, Flip, lottie;

// Initialize GSAP from global (already loaded via CDN in index.html)
if (typeof window !== 'undefined') {
  gsap = window.gsap;
  ScrollTrigger = window.ScrollTrigger;
  
  // Register plugins if available
  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }
  
  // Load Lottie from CDN if not already loaded
  if (!window.lottie) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lottie-web@5/build/player/lottie.min.js';
    script.async = true;
    document.head.appendChild(script);
    
    script.onload = () => {
      lottie = window.lottie;
      // Wait a bit for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
      } else {
        setTimeout(initAnimations, 100);
      }
    };
  } else {
    lottie = window.lottie;
    // Wait for DOM if needed
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
      setTimeout(initAnimations, 100);
    }
  }
}

// Respect prefers-reduced-motion
const PREFERS_REDUCED = typeof window !== 'undefined' && 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Animation tokens
export const ANIM_TOKENS = {
  fast: 0.18,
  medium: 0.45,
  slow: 0.85,
  ease: "power3.out"
};

export function safeDuration(ms) {
  return PREFERS_REDUCED ? ms * 0.5 : ms;
}

// Text splitting helper
export function splitToWords(el) {
  if (!el) return [];
  const text = el.textContent.trim();
  const words = text.split(/\s+/);
  el.innerHTML = '';
  const wordElements = [];
  
  words.forEach((w, i) => {
    const span = document.createElement('span');
    span.className = 'anim-word';
    span.style.display = 'inline-block';
    span.style.willChange = 'transform,opacity';
    span.textContent = (i === words.length - 1) ? w : w + ' ';
    el.appendChild(span);
    wordElements.push(span);
  });
  
  return wordElements;
}

// Batch reveal for cards
function batchReveal(selector, vars = {}) {
  if (!ScrollTrigger || !gsap) return;
  
  ScrollTrigger.batch(selector, {
    onEnter: (batch) => {
      gsap.fromTo(batch, 
        { autoAlpha: 0, y: 30, scale: 0.98 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          stagger: 0.08,
          duration: safeDuration(350) / 1000,
          ease: ANIM_TOKENS.ease
        }
      );
    },
    start: "top 85%",
    once: true,
    ...vars
  });
}

// Hero timeline with Lottie sync
function initHeroAnimations() {
  const hero = document.querySelector('[data-anim*="hero"]');
  if (!hero || !gsap || !ScrollTrigger) return;

  const headline = hero.querySelector('.hero-title, h1');
  const subtitle = hero.querySelector('.hero-subtitle, .hero p');
  const cta = hero.querySelector('[data-anim*="cta"], .btn-primary');
  const lottieContainer = hero.querySelector('[data-lottie], .hero__lottie');

  // Split headline text
  if (headline) {
    const words = splitToWords(headline);
    if (words.length > 0) {
      gsap.fromTo(words,
        { y: 20, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          stagger: 0.03,
          duration: safeDuration(360) / 1000,
          ease: ANIM_TOKENS.ease
        }
      );
    }
  }

  // Animate subtitle
  if (subtitle) {
    gsap.fromTo(subtitle,
      { y: 15, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: safeDuration(400) / 1000,
        ease: ANIM_TOKENS.ease,
        delay: 0.2
      }
    );
  }

  // Lottie scroll sync (if container exists)
  if (lottieContainer && lottie) {
    const lottieId = lottieContainer.getAttribute('data-lottie') || 'hero-1';
    const animPath = `/assets/animations/${lottieId}.json`;
    
    try {
      const heroLottie = lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: animPath
      });

      heroLottie.addEventListener('DOMLoaded', () => {
        ScrollTrigger.create({
          trigger: hero,
          start: 'top top',
          end: '+=1200',
          scrub: 0.8,
          onUpdate: (self) => {
            if (heroLottie.totalFrames) {
              const frame = Math.floor(heroLottie.totalFrames * self.progress);
              heroLottie.goToAndStop(frame, true);
            }
          }
        });
      });
    } catch (e) {
      console.warn('Lottie load failed:', e);
      // Show fallback poster if available
      const poster = lottieContainer.querySelector('img[data-poster]');
      if (poster) poster.style.display = 'block';
    }
  }
}

// CTA microinteractions
function initCTAs() {
  const ctas = document.querySelectorAll('[data-anim*="cta"], .btn-primary');
  
  ctas.forEach(btn => {
    if (!gsap) return;
    
    btn.addEventListener('pointerenter', () => {
      gsap.to(btn, {
        scale: 1.04,
        boxShadow: '0 8px 30px rgba(12,24,60,0.12)',
        duration: safeDuration(180) / 1000
      });
    });
    
    btn.addEventListener('pointerleave', () => {
      gsap.to(btn, {
        scale: 1,
        boxShadow: '0 0 0 rgba(0,0,0,0)',
        duration: safeDuration(160) / 1000
      });
    });
    
    btn.addEventListener('focus', () => {
      gsap.to(btn, { scale: 1.02, duration: 0.12 });
    });
    
    btn.addEventListener('blur', () => {
      gsap.to(btn, { scale: 1, duration: 0.1 });
    });
  });
}

// Floating decorative elements
function floatDecors(selector) {
  const items = document.querySelectorAll(selector);
  if (!gsap) return;
  
  items.forEach((el, i) => {
    const offset = Math.random() * 1.2;
    gsap.to(el, {
      y: '+=12',
      rotation: '+=3',
      duration: 4 + Math.random() * 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: offset
    });
  });
}

// Card tilt on pointer move
function initCardTilts() {
  const cards = document.querySelectorAll('[data-anim*="card"], .category-card, .step-card');
  if (!gsap) return;
  
  cards.forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      
      gsap.to(card, {
        rotationX: py * 6,
        rotationY: px * 6,
        transformPerspective: 800,
        transformOrigin: 'center',
        duration: 0.4
      });
    });
    
    card.addEventListener('pointerleave', () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.6
      });
    });
  });
}

// Main initialization function
function initAnimations() {
  if (typeof window === 'undefined') return;
  
  // Check for disable flag
  if (window.__ANIM_DISABLE__) {
    console.log('Animations disabled via __ANIM_DISABLE__');
    return;
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
    return;
  }

  // Wait for GSAP
  if (!gsap || !ScrollTrigger) {
    setTimeout(initAnimations, 100);
    return;
  }

  // Refresh ScrollTrigger after Lenis integration
  if (window.lenis) {
    window.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      window.lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // Initialize animations by data-anim attribute
  const heroElements = document.querySelectorAll('[data-anim*="hero"]');
  if (heroElements.length > 0) {
    initHeroAnimations();
  }

  const cardElements = document.querySelectorAll('[data-anim*="card"]');
  if (cardElements.length > 0) {
    batchReveal('[data-anim*="card"], .category-card, .step-card');
    initCardTilts();
  }

  initCTAs();

  // Floating decorations
  floatDecors('.floating-avatar, .availability-banner');

  // Section titles
  const sectionTitles = document.querySelectorAll('h2.categories-title, h2.platform-works-title, h2.faq-title');
  sectionTitles.forEach(title => {
    const words = splitToWords(title);
    if (words.length > 0 && ScrollTrigger) {
      ScrollTrigger.create({
        trigger: title,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo(words,
            { y: 20, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              stagger: 0.05,
              duration: safeDuration(400) / 1000,
              ease: ANIM_TOKENS.ease
            }
          );
        }
      });
    }
  });

  // Log mounted animations
  window.__ANIMATION_LOG__ = {
    mounted: Date.now(),
    reducedMotion: PREFERS_REDUCED,
    animations: {
      hero: heroElements.length,
      cards: cardElements.length,
      ctas: document.querySelectorAll('[data-anim*="cta"]').length
    }
  };

  console.log('Animation system initialized', window.__ANIMATION_LOG__);
}

// Auto-init is handled above in the GSAP/Lottie initialization block

export default initAnimations;

