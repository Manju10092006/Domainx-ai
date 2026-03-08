// dashboardButtonAnimations.js - Dashboard button animation system
// Neon Edge + 3D Press + Hover Lift

import { ANIMATION_TIMINGS, EASINGS } from './sharedEasings.js';
import { safeScale, safeTranslate, shouldDisableAnimations } from './reducedMotion.js';

let gsap;

// Initialize GSAP
if (typeof window !== 'undefined') {
  gsap = window.gsap;
}

/**
 * Initialize dashboard button animations
 */
export function initDashboardButtonAnimations() {
  if (shouldDisableAnimations() || !gsap) return;

  // Select dashboard buttons
  const dashboardButtons = document.querySelectorAll(
    '.dash-btn, [data-anim="cta"], .btn-header, .dashboard-body button, .dashboard-shell button'
  );

  if (dashboardButtons.length === 0) return;

  dashboardButtons.forEach(button => {
    // Skip if already initialized or disabled
    if (button.hasAttribute('data-dash-anim-initialized') || button.disabled) {
      return;
    }

    button.setAttribute('data-dash-anim-initialized', 'true');

    // Add class for CSS targeting
    button.classList.add('dash-btn-animated');

    // Hover Lift Effect
    button.addEventListener('pointerenter', handleHoverEnter, { passive: true });
    button.addEventListener('pointerleave', handleHoverLeave, { passive: true });

    // 3D Press Effect
    button.addEventListener('pointerdown', handlePressDown, { passive: true });
    button.addEventListener('pointerup', handlePressUp, { passive: true });
    button.addEventListener('pointercancel', handlePressUp, { passive: true });

    // Disabled state handling
    if (button.disabled) {
      button.classList.add('dash-btn-disabled');
    }

    // Observe disabled state changes
    const observer = new MutationObserver(() => {
      if (button.disabled) {
        button.classList.add('dash-btn-disabled');
        gsap.to(button, {
          opacity: 0.5,
          duration: ANIMATION_TIMINGS.medium,
          ease: EASINGS.smooth
        });
      } else {
        button.classList.remove('dash-btn-disabled');
        gsap.to(button, {
          opacity: 1,
          duration: ANIMATION_TIMINGS.medium,
          ease: EASINGS.smooth
        });
      }
    });

    observer.observe(button, {
      attributes: true,
      attributeFilter: ['disabled']
    });
  });
}

/**
 * Handle hover enter
 */
function handleHoverEnter(e) {
  const button = e.currentTarget;
  if (button.disabled || button.classList.contains('dash-btn-loading')) return;

  // Hover lift: scale 1.06, translateY -2px
  gsap.to(button, {
    scale: safeScale(1.06),
    y: safeTranslate(-2),
    boxShadow: '0 10px 24px rgba(0, 255, 255, 0.25)',
    duration: ANIMATION_TIMINGS.medium,
    ease: EASINGS.smooth
  });

  // Neon edge glow
  const beforeEl = button;
  gsap.to(beforeEl, {
    '--neon-opacity': 1,
    duration: ANIMATION_TIMINGS.medium,
    ease: EASINGS.smooth
  });
}

/**
 * Handle hover leave
 */
function handleHoverLeave(e) {
  const button = e.currentTarget;
  if (button.disabled || button.classList.contains('dash-btn-loading')) return;

  // Return to normal
  gsap.to(button, {
    scale: 1,
    y: 0,
    boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
    duration: ANIMATION_TIMINGS.medium,
    ease: EASINGS.smooth
  });

  // Hide neon edge
  const beforeEl = button;
  gsap.to(beforeEl, {
    '--neon-opacity': 0,
    duration: ANIMATION_TIMINGS.medium,
    ease: EASINGS.smooth
  });
}

/**
 * Handle press down
 */
function handlePressDown(e) {
  const button = e.currentTarget;
  if (button.disabled || button.classList.contains('dash-btn-loading')) return;

  // 3D press: scale 0.92, translateY 1px
  gsap.to(button, {
    scale: safeScale(0.92),
    y: safeTranslate(1),
    duration: ANIMATION_TIMINGS.fast,
    ease: EASINGS.smooth
  });
}

/**
 * Handle press up
 */
function handlePressUp(e) {
  const button = e.currentTarget;
  if (button.disabled || button.classList.contains('dash-btn-loading')) return;

  // Bounce back to hover state
  gsap.to(button, {
    scale: safeScale(1.06),
    y: safeTranslate(-2),
    duration: ANIMATION_TIMINGS.medium,
    ease: EASINGS.bounce
  });
}

/**
 * Show loading state
 */
export function setDashboardButtonLoading(button, isLoading) {
  if (!gsap || !button) return;

  if (isLoading) {
    button.classList.add('dash-btn-loading');
    button.disabled = true;

    // Create spinner if not exists
    if (!button.querySelector('.dash-btn-spinner')) {
      const spinner = document.createElement('div');
      spinner.className = 'dash-btn-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      button.appendChild(spinner);
    }

    gsap.to(button, {
      opacity: 0.7,
      duration: ANIMATION_TIMINGS.medium,
      ease: EASINGS.smooth
    });
  } else {
    button.classList.remove('dash-btn-loading');
    button.disabled = false;

    const spinner = button.querySelector('.dash-btn-spinner');
    if (spinner) {
      gsap.to(spinner, {
        opacity: 0,
        duration: ANIMATION_TIMINGS.fast,
        ease: EASINGS.smooth,
        onComplete: () => spinner.remove()
      });
    }

    gsap.to(button, {
      opacity: 1,
      duration: ANIMATION_TIMINGS.medium,
      ease: EASINGS.smooth
    });
  }
}

/**
 * Show success state
 */
export function showDashboardButtonSuccess(button) {
  if (!gsap || !button) return;

  button.classList.add('dash-btn-success');

  // Green glow pulse
  gsap.to(button, {
    boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
    duration: 0.125,
    ease: EASINGS.smooth,
    yoyo: true,
    repeat: 1,
    onComplete: () => {
      button.classList.remove('dash-btn-success');
      gsap.to(button, {
        boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
        duration: 0.125,
        ease: EASINGS.smooth
      });
    }
  });
}

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  function tryInit() {
    if (!gsap) {
      gsap = window.gsap;
    }
    if (gsap) {
      initDashboardButtonAnimations();
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

  // Re-initialize on dynamic content
  const observer = new MutationObserver(() => {
    if (gsap) {
      initDashboardButtonAnimations();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

