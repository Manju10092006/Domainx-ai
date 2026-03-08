document.addEventListener('DOMContentLoaded', () => {

    // Lenis Butter Smooth Scroll - heavy momentum/glide when stopping
    const lenis = new Lenis({
        duration: 3.5,                // Very long duration = more glide distance
        easing: (t) => 1 - Math.pow(1 - t, 5),  // Strong ease-out for long glide
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    // Sync with requestAnimationFrame for smoothest performance
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    
    // Make lenis available globally for debugging
    window.lenis = lenis;

    // GSAP
    gsap.registerPlugin(ScrollTrigger);

    gsap.set("#bg-video", { scale: 1.12, y: 20 });

    const introTl = gsap.timeline();
    introTl.from("#navbar", {
        opacity: 0,
        y: -20,
        duration: 0.7,
        ease: "power3.out"
    })
        .from(".hero-title", {
            opacity: 0,
            y: 40,
            scale: 0.96,
            duration: 1.4,
            ease: "power4.out"
        }, "-=0.1")
        .from(".hero-subtitle", {
            opacity: 0,
            y: 25,
            duration: 0.9,
            letterSpacing: "0.18em",
            ease: "power2.out",
            autoRound: false
        }, "<+=0.3")
        .from(".hero-search", {
            opacity: 0,
            y: 35,
            scale: 0.94,
            duration: 1,
            ease: "power4.out"
        }, "-=0.2")
        .from(".hero-trust", {
            opacity: 0,
            y: 25,
            duration: 0.8,
            ease: "power2.out"
        }, "-=0.1");

    gsap.to("#bg-video", {
        y: -20,
        duration: 12,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true
    });

    // Hero section fade - only after scrolling past it
    gsap.to(".hero-section", {
        scrollTrigger: {
            trigger: ".section-categories",
            start: "top 90%",
            scrub: true
        },
        opacity: 0.4,
        y: -20,
        duration: 1
    });

    const sectionRevealConfig = { start: "top 82%" };

    gsap.from(".section-categories .section-header", {
        opacity: 0,
        y: 35,
        scale: 0.96,
        duration: 0.9,
        ease: "power4.out",
        scrollTrigger: {
            trigger: ".section-categories",
            ...sectionRevealConfig
        }
    });

    gsap.from(".section-categories .cat-anim", {
        opacity: 0,
        y: 35,
        scale: 0.94,
        duration: 0.9,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".section-categories",
            ...sectionRevealConfig
        }
    });

    gsap.from(".section-companies .section-header", {
        opacity: 0,
        y: 35,
        scale: 0.96,
        duration: 0.9,
        ease: "power4.out",
        scrollTrigger: {
            trigger: ".section-companies",
            ...sectionRevealConfig
        }
    });

    gsap.from(".section-companies .company-card", {
        opacity: 0,
        y: 35,
        scale: 0.94,
        duration: 0.9,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".section-companies",
            ...sectionRevealConfig
        }
    });

    const magneticButtons = document.querySelectorAll(".cta-magnet");
    magneticButtons.forEach((button) => {
        const inner = button.querySelector(".cta-inner") || button;
        const strength = 14;

        button.addEventListener("mousemove", (event) => {
            const bounds = button.getBoundingClientRect();
            const offsetX = event.clientX - bounds.left - bounds.width / 2;
            const offsetY = event.clientY - bounds.top - bounds.height / 2;
            gsap.to(inner, {
                x: Math.max(Math.min(offsetX * 0.3, strength), -strength),
                y: Math.max(Math.min(offsetY * 0.3, strength), -strength),
                duration: 0.25,
                ease: "power2.out"
            });
        });

        button.addEventListener("mouseleave", () => {
            gsap.to(inner, { x: 0, y: 0, duration: 0.3, ease: "power2.out" });
            gsap.to(button, { scale: 1, duration: 0.3, ease: "back.out(1.7)" });
        });

        button.addEventListener("mousedown", () => {
            gsap.to(button, { scale: 0.97, duration: 0.15, ease: "power2.out" });
        });

        button.addEventListener("mouseup", () => {
            gsap.to(button, { scale: 1, duration: 0.2, ease: "back.out(1.7)" });
        });
    });
});

// Top Companies Scroll Buttons
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
