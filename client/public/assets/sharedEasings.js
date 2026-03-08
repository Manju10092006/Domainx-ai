// sharedEasings.js - Shared animation timing and easing constants

export const ANIMATION_TIMINGS = {
  fast: 0.18,
  medium: 0.3,
  slow: 0.45,
  slower: 0.6
};

export const EASINGS = {
  smooth: "power3.out",
  bounce: "back.out(1.7)",
  elastic: "elastic.out(1, 0.3)",
  linear: "none"
};

export const TRANSFORM_ORIGIN = {
  center: "center center",
  top: "center top",
  bottom: "center bottom",
  left: "left center",
  right: "right center"
};

