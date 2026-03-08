// script.js

document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // GSAP SETUP - MUST BE FIRST!
    // ============================================
    gsap.registerPlugin(ScrollTrigger);

    // ============================================
    // LENIS SMOOTH SCROLL SETUP
    // ============================================
    const lenis = new Lenis({
        duration: 2.5,
        easing: (t) => 1 - Math.pow(1 - t, 4),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    // Sync Lenis and ScrollTrigger
    ScrollTrigger.scrollerProxy(document.documentElement, {
        scrollTop(value) {
            return arguments.length ? lenis.scrollTo(value) : lenis.scroll;
        },
        getBoundingClientRect() {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        }
    });

    // RAF loop for Lenis + ScrollTrigger
    function raf(time) {
        lenis.raf(time);
        ScrollTrigger.update();
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Ensure ScrollTrigger refresh calls Lenis.update
    ScrollTrigger.addEventListener("refresh", () => lenis.update());
    ScrollTrigger.refresh();

    // Make lenis globally available
    window.lenis = lenis;

    // ============================================
    // CURSOR SPOTLIGHT (Hero Section)
    // ============================================
    const cursorSpotlight = document.querySelector('.cursor-spotlight');
    if (cursorSpotlight) {
        let mouseX = 0, mouseY = 0;
        let spotlightX = 0, spotlightY = 0;
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        function updateSpotlight() {
            spotlightX += (mouseX - spotlightX) * 0.02;
            spotlightY += (mouseY - spotlightY) * 0.02;
            gsap.set(cursorSpotlight, {
                x: spotlightX,
                y: spotlightY,
                xPercent: -50,
                yPercent: -50
            });
            requestAnimationFrame(updateSpotlight);
        }
        updateSpotlight();
    }

    // ============================================
    // BACKGROUND VIDEO PARALLAX
    // ============================================
    const bgVideo = document.querySelector("#bg-video");
    if (bgVideo) {
        gsap.set(bgVideo, { scale: 1.12, y: 20 });
        gsap.to(bgVideo, {
            y: -20,
            duration: 12,
            ease: "power1.inOut",
            repeat: -1,
            yoyo: true
        });
        // Parallax on scroll
        gsap.to(bgVideo, {
            y: -60,
            scale: 1.15,
            scrollTrigger: {
                trigger: ".section-hero",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });
    }

    // ============================================
    // NAVBAR SCROLL TRANSITION
    // ============================================
    const navbar = document.querySelector("#navbar");
    if (navbar) {
        gsap.set(navbar, {
            backgroundColor: "rgba(255, 255, 255, 0)",
            backdropFilter: "blur(0px)",
            paddingTop: "1.5rem",
            paddingBottom: "1.5rem"
        });
        ScrollTrigger.create({
            trigger: "body",
            start: "top -100",
            end: "max",
            onEnter: () => {
                gsap.to(navbar, {
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(12px)",
                    paddingTop: "1rem",
                    paddingBottom: "1rem",
                    duration: 0.6,
                    ease: "power2.out"
                });
            },
            onLeaveBack: () => {
                gsap.to(navbar, {
                    backgroundColor: "rgba(255, 255, 255, 0)",
                    backdropFilter: "blur(0px)",
                    paddingTop: "1.5rem",
                    paddingBottom: "1.5rem",
                    duration: 0.6,
                    ease: "power2.out"
                });
            }
        });
    }

    // ============================================
    // HERO SECTION ANIMATIONS (On Page Load)
    // ============================================
    const heroTl = gsap.timeline({ delay: 0.2 });
    heroTl.from("#navbar", {
        opacity: 0,
        y: -30,
        duration: 0.8,
        ease: "power3.out"
    });
    heroTl.from(".hero-anim:first-child", {
        opacity: 0,
        y: 30,
        scale: 0.95,
        duration: 0.9,
        ease: "power4.out"
    }, "-=0.4");
    heroTl.from(".hero-title", {
        opacity: 0,
        y: 50,
        scale: 0.96,
        duration: 1.2,
        ease: "power4.out"
    }, "-=0.6");
    heroTl.from(".hero-subtitle", {
        opacity: 0,
        y: 40,
        letterSpacing: "0.1em",
        duration: 1,
        ease: "power3.out"
    }, "-=0.8");
    heroTl.from(".hero-search", {
        opacity: 0,
        y: 40,
        scale: 0.94,
        duration: 1.1,
        ease: "power4.out"
    }, "-=0.6");
    heroTl.from(".hero-trust", {
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: "power2.out"
    }, "-=0.5");

    // Hero fade-out on scroll
    gsap.to(".section-hero", {
        opacity: 0,
        y: -40,
        scale: 0.98,
        scrollTrigger: {
            trigger: ".section-hero",
            start: "top top",
            end: "bottom top",
            scrub: 1.2
        },
        ease: "power2.in"
    });

    // ============================================
    // EXPLORE CATEGORIES SECTION (Scroll Animations)
    // ============================================
    const sectionRevealConfig = {
        start: "top 82%",
        once: true,
        toggleActions: "play none none none"
    };

    // Header fade in
    gsap.from(".section-categories .section-header", {
        opacity: 0,
        y: 40,
        scale: 0.96,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: {
            trigger: ".section-categories",
            ...sectionRevealConfig
        }
    });

    // Category cards stagger in
    gsap.from(".section-categories .cat-anim", {
        opacity: 0,
        y: 40,
        scale: 0.94,
        rotationX: -15,
        duration: 1,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".section-categories",
            ...sectionRevealConfig
        },
        onComplete: function() {
            gsap.set(".section-categories .cat-anim", {
                opacity: 1,
                y: 0,
                scale: 1,
                rotationX: 0,
                clearProps: "all"
            });
        }
    });

    // ============================================
    // TOP COMPANIES SECTION (Scroll Animations)
    // ============================================
    // Header fade in
    gsap.from(".section-companies .section-header", {
        opacity: 0,
        y: 40,
        scale: 0.96,
        duration: 1.1,
        ease: "power4.out",
        scrollTrigger: {
            trigger: ".section-companies",
            ...sectionRevealConfig
        }
    });

    // Company cards slide in
    gsap.from(".section-companies .company-card", {
        opacity: 0,
        x: 60,
        y: 30,
        scale: 0.94,
        rotationY: -10,
        duration: 1,
        stagger: 0.05,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".section-companies",
            ...sectionRevealConfig
        },
        onComplete: function() {
            gsap.set(".section-companies .company-card", {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                rotationY: 0,
                clearProps: "all"
            });
        }
    });

    // ============================================
    // PROFILE HERO SECTION (Scroll Animations)
    // ============================================
    const profileHero = document.querySelector("#profile-hero");
    if (profileHero) {
        // Center Logo - Pulsing Glow (scroll-triggered)
        gsap.from("#mainLogo", {
            scale: 0.85,
            opacity: 0,
            duration: 1.4,
            ease: "power4.out",
            scrollTrigger: {
                trigger: profileHero,
                start: "top 85%",
                once: true
            }
        });

        // Continuous pulsing
        gsap.to("#mainLogo", {
            scale: 1.05,
            duration: 2.5,
            ease: "power1.inOut",
            repeat: -1,
            yoyo: true
        });

        // Profile text fade-in
        gsap.from(".profile-text", {
            opacity: 0,
            y: 40,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.05,
            scrollTrigger: {
                trigger: profileHero,
                start: "top 85%",
                once: true
            }
        });

        // Profile CTA fade-in
        gsap.from(".profile-cta", {
            opacity: 0,
            y: 26,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
                trigger: profileHero,
                start: "top 85%",
                once: true
            }
        });

        // Orbit ring continuous rotation
        const baseRotation = gsap.to(".profile-orbit-ring", {
            rotate: 360,
            duration: 32,
            ease: "none",
            repeat: -1,
            transformOrigin: "50% 50%"
        });

        // Counter-rotation on scroll
        let scrollRotation = 0;
        ScrollTrigger.create({
            trigger: profileHero,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
            onUpdate: (self) => {
                const progress = self.progress;
                const newScrollRotation = progress * -180;
                const delta = newScrollRotation - scrollRotation;
                scrollRotation = newScrollRotation;
                if (Math.abs(delta) > 0.1) {
                    gsap.to(".profile-orbit-ring", {
                        rotation: `+=${delta}`,
                        duration: 0.1,
                        ease: "none"
                    });
                }
            }
        });

        // Orbit icons subtle animations
        gsap.set(".profile-orbit-icon", { opacity: 0.85 });
        gsap.to(".profile-orbit-icon", {
            opacity: () => gsap.utils.random(0.85, 1),
            scale: () => gsap.utils.random(0.96, 1.05),
            duration: () => gsap.utils.random(1.4, 2.3),
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut",
            stagger: { each: 0.15, from: "random" },
            repeatRefresh: true
        });
    }

    // ============================================
    // FOOTER SECTION (Fade in on scroll)
    // ============================================
    const footer = document.querySelector(".footer-section");
    if (footer) {
        gsap.from(".footer-section", {
            opacity: 0,
            y: 20,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
                trigger: ".footer-section",
                start: "top 90%",
                once: true
            }
        });
    }

    // ============================================
    // MAGNETIC HOVER EFFECT (All CTAs)
    // ============================================
    const magneticButtons = document.querySelectorAll(".cta-magnet");
    magneticButtons.forEach((button) => {
        const inner = button.querySelector(".cta-inner") || button;
        const strength = 16;
        button.addEventListener("mousemove", (event) => {
            const bounds = button.getBoundingClientRect();
            const offsetX = event.clientX - bounds.left - bounds.width / 2;
            const offsetY = event.clientY - bounds.top - bounds.height / 2;
            gsap.to(inner, {
                x: Math.max(Math.min(offsetX * 0.35, strength), -strength),
                y: Math.max(Math.min(offsetY * 0.35, strength), -strength),
                duration: 0.3,
                ease: "power2.out"
            });
        });
        let isHovering = false;
        button.addEventListener("mouseenter", () => {
            isHovering = true;
            gsap.to(button, { scale: 1.05, duration: 0.4, ease: "power2.out" });
        });
        button.addEventListener("mouseleave", () => {
            isHovering = false;
            gsap.to(inner, { x: 0, y: 0, duration: 0.4, ease: "power2.out" });
            gsap.to(button, { scale: 1, duration: 0.4, ease: "back.out(1.7)" });
        });
        button.addEventListener("mousedown", () => {
            gsap.to(button, { scale: 0.96, duration: 0.1, ease: "power2.out" });
        });
        button.addEventListener("mouseup", () => {
            const targetScale = isHovering ? 1.05 : 1;
            gsap.to(button, { scale: targetScale, duration: 0.2, ease: "power2.out" });
        });
    });

    // ============================================
    // 3D HOVER EFFECT (Category Cards)
    // ============================================
    const catCards = document.querySelectorAll(".cat-anim");
    catCards.forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            gsap.to(card, {
                rotationX: rotateX,
                rotationY: rotateY,
                scale: 1.03,
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.15)",
                filter: "blur(0px)",
                duration: 0.3,
                ease: "power2.out",
                transformPerspective: 1000
            });
        });
        card.addEventListener("mouseleave", () => {
            gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                scale: 1,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
                filter: "blur(0px)",
                duration: 0.4,
                ease: "power2.out"
            });
        });
    });

    // ============================================
    // 3D HOVER EFFECT (Company Cards)
    // ============================================
    const companyCards = document.querySelectorAll(".company-card");
    companyCards.forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 12;
            const rotateY = (centerX - x) / 12;
            gsap.to(card, {
                rotationX: rotateX,
                rotationY: rotateY,
                scale: 1.02,
                z: 20,
                boxShadow: "0 30px 70px rgba(0, 0, 0, 0.18)",
                duration: 0.3,
                ease: "power2.out",
                transformPerspective: 1000
            });
        });
        card.addEventListener("mouseleave", () => {
            gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                scale: 1,
                z: 0,
                boxShadow: "0 18px 45px rgba(0, 0, 0, 0.08)",
                duration: 0.4,
                ease: "power2.out"
            });
        });
    });
});

// Horizontal scroll buttons for companies (outside DOMContentLoaded)
const companiesScroll = document.getElementById("companies-scroll");
const leftArrow = document.getElementById("scroll-left");
const rightArrow = document.getElementById("scroll-right");
if (companiesScroll && leftArrow && rightArrow) {
    rightArrow.addEventListener("click", () => {
        companiesScroll.scrollBy({ left: 380, behavior: "smooth" });
    });
    leftArrow.addEventListener("click", () => {
        companiesScroll.scrollBy({ left: -380, behavior: "smooth" });
    });
}
