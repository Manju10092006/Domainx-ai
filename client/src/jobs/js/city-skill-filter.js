// City and Skill Filter for Jobs Page
// Filters jobs based on selected city and resume skills from localStorage

(function() {
    // Wait for DOM to be ready
    function initFilter() {
        // Get selected city and skills from localStorage
        const city = localStorage.getItem("selected_city") || "";
        const skills = JSON.parse(localStorage.getItem("resume_skills") || "[]");

        // Get all job cards
        const jobCards = document.querySelectorAll(".job-card");

        if (jobCards.length === 0) {
            // If no job cards found yet, wait a bit and try again
            setTimeout(initFilter, 500);
            return;
        }

        let visibleCount = 0;

        // Filter each job card
        jobCards.forEach(card => {
            // Get job location - look for span with map-pin icon (ri-map-pin-line)
            let cardCity = "";
            const mapPinIcon = card.querySelector("i.ri-map-pin-line");
            if (mapPinIcon && mapPinIcon.parentElement) {
                // Get text from parent span (location is after the icon)
                cardCity = mapPinIcon.parentElement.innerText.toLowerCase().trim();
                // Remove icon text if present
                cardCity = cardCity.replace(/map-pin|location/gi, "").trim();
            }
            
            const cardText = card.innerText.toLowerCase(); // searchable job content

            // Check city match
            const cityMatch = city === "" || cardCity.includes(city.toLowerCase());

            // Check skill match (at least one skill must be found)
            const skillMatch = skills.length === 0 || 
                              skills.some(skill => {
                                  const skillLower = skill.toLowerCase();
                                  return cardText.includes(skillLower);
                              });

            // Show or hide card based on matches
            if (cityMatch && skillMatch) {
                card.style.display = "";
                visibleCount++;
            } else {
                card.style.display = "none";
            }
        });

        // Update job count
        const jobCountElement = document.getElementById("jobCount") || 
                               document.getElementById("results-count");
        
        if (jobCountElement) {
            jobCountElement.innerText = `${visibleCount} jobs found`;
        }

        // Show empty state if no jobs visible
        const emptyState = document.getElementById("empty-state");
        if (emptyState) {
            if (visibleCount === 0) {
                emptyState.classList.remove("hidden");
            } else {
                emptyState.classList.add("hidden");
            }
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFilter);
    } else {
        // DOM already ready, but wait a bit for job cards to render
        setTimeout(initFilter, 300);
    }
})();

