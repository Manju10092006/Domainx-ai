// reducedMotion.js - Reduced motion detection and utilities

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get safe duration (reduced by 50% if reduced motion is preferred)
 */
export function safeDuration(ms) {
  return prefersReducedMotion() ? ms * 0.5 : ms;
}

/**
 * Get safe scale value (1 if reduced motion, otherwise provided value)
 */
export function safeScale(scale) {
  return prefersReducedMotion() ? 1 : scale;
}

/**
 * Get safe translate value (0 if reduced motion, otherwise provided value)
 */
export function safeTranslate(value) {
  return prefersReducedMotion() ? 0 : value;
}

/**
 * Check if animations should be disabled
 */
export function shouldDisableAnimations() {
  if (typeof window === 'undefined') return false;
  return prefersReducedMotion() || window.__ANIM_DISABLE__ === true;
}

