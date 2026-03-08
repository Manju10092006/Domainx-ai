// Main JavaScript for Jobs Page - Filtering, Pagination, and Navigation

// State
let currentPage = 1;
const jobsPerPage = 6;
let filteredJobs = [];
let activeFilters = {
    search: '',
    location: '',
    experience: [],
    salary: [],
    jobType: [],
    companyType: [],
    postedDate: null,
    industry: []
};

// Scroll Reveal Observer - Performance optimized
let scrollRevealObserver = null;

function initScrollReveal() {
    // Clean up previous observer
    if (scrollRevealObserver) {
        scrollRevealObserver.disconnect();
    }
    
    // Create IntersectionObserver for scroll reveal
    scrollRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add stagger delay based on card index
                const cardIndex = parseInt(entry.target.dataset.index) || 0;
                const delay = cardIndex * 80; // 80ms stagger
                
                setTimeout(() => {
                    entry.target.classList.remove('job-card-reveal');
                    entry.target.classList.add('job-card-revealed');
                }, delay);
                
                // Unobserve after reveal for performance
                scrollRevealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe all job cards
    document.querySelectorAll('.job-card-reveal').forEach(card => {
        scrollRevealObserver.observe(card);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Parse URL parameters
    parseURLParams();
    
    // Set up event listeners
    setupFilterListeners();
    setupSearchListeners();
    
    // Initial render
    applyFilters();
});

// Parse URL parameters from homepage
function parseURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Search keyword
    if (urlParams.has('search')) {
        activeFilters.search = urlParams.get('search');
        document.getElementById('search-input').value = activeFilters.search;
    }
    
    // Location
    if (urlParams.has('location')) {
        activeFilters.location = urlParams.get('location');
        document.getElementById('location-input').value = activeFilters.location;
    }
    
    // Experience
    if (urlParams.has('experience')) {
        const exp = urlParams.get('experience');
        activeFilters.experience = [exp];
        // Check the corresponding checkbox
        const checkbox = document.querySelector(`input[data-filter="experience"][value="${exp}"]`);
        if (checkbox) checkbox.checked = true;
    }
    
    // Job Type
    if (urlParams.has('jobType')) {
        const type = urlParams.get('jobType');
        activeFilters.jobType = [type];
        const checkbox = document.querySelector(`input[data-filter="jobType"][value="${type}"]`);
        if (checkbox) checkbox.checked = true;
    }
    
    // Company Type
    if (urlParams.has('companyType')) {
        const type = urlParams.get('companyType');
        activeFilters.companyType = [type];
        const checkbox = document.querySelector(`input[data-filter="companyType"][value="${type}"]`);
        if (checkbox) checkbox.checked = true;
    }
    
    // Industry
    if (urlParams.has('industry')) {
        const ind = urlParams.get('industry');
        activeFilters.industry = [ind];
        const checkbox = document.querySelector(`input[data-filter="industry"][value="${ind}"]`);
        if (checkbox) checkbox.checked = true;
    }
    
    // Company (search by company name)
    if (urlParams.has('company')) {
        activeFilters.search = urlParams.get('company');
        document.getElementById('search-input').value = activeFilters.search;
    }
}

// Set up filter checkboxes and radio buttons
function setupFilterListeners() {
    // Checkboxes
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const filterType = e.target.dataset.filter;
            const value = e.target.value;
            
            if (e.target.checked) {
                if (!activeFilters[filterType].includes(value)) {
                    activeFilters[filterType].push(value);
                }
            } else {
                activeFilters[filterType] = activeFilters[filterType].filter(v => v !== value);
            }
            
            currentPage = 1;
            applyFilters();
        });
    });
    
    // Radio buttons (Posted Date)
    document.querySelectorAll('.filter-radio').forEach(radio => {
        radio.addEventListener('change', (e) => {
            activeFilters.postedDate = parseInt(e.target.value);
            currentPage = 1;
            applyFilters();
        });
    });
}

// Set up search input listeners
function setupSearchListeners() {
    const searchInput = document.getElementById('search-input');
    const locationInput = document.getElementById('location-input');
    
    // Debounced search
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            activeFilters.search = e.target.value;
            currentPage = 1;
            applyFilters();
        }, 300);
    });
    
    locationInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            activeFilters.location = e.target.value;
            currentPage = 1;
            applyFilters();
        }, 300);
    });
    
    // Enter key to search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
}

// Apply all filters and render
function applyFilters() {
    filteredJobs = jobsData.filter(job => {
        // Search filter
        if (activeFilters.search) {
            const searchTerm = activeFilters.search.toLowerCase();
            const matchesSearch = 
                job.title.toLowerCase().includes(searchTerm) ||
                job.company.toLowerCase().includes(searchTerm) ||
                job.description.toLowerCase().includes(searchTerm) ||
                job.skills.some(skill => skill.toLowerCase().includes(searchTerm));
            if (!matchesSearch) return false;
        }
        
        // Location filter
        if (activeFilters.location) {
            const locationTerm = activeFilters.location.toLowerCase();
            if (!job.location.toLowerCase().includes(locationTerm)) return false;
        }
        
        // Experience filter
        if (activeFilters.experience.length > 0) {
            if (!activeFilters.experience.includes(job.experience)) return false;
        }
        
        // Job Type filter
        if (activeFilters.jobType.length > 0) {
            if (!activeFilters.jobType.includes(job.jobType)) return false;
        }
        
        // Company Type filter
        if (activeFilters.companyType.length > 0) {
            if (!activeFilters.companyType.includes(job.companyType)) return false;
        }
        
        // Industry filter
        if (activeFilters.industry.length > 0) {
            if (!activeFilters.industry.includes(job.industry)) return false;
        }
        
        // Posted Date filter
        if (activeFilters.postedDate) {
            if (job.postedDays > activeFilters.postedDate) return false;
        }
        
        // Salary filter (simplified - based on job salary string)
        if (activeFilters.salary.length > 0) {
            const salaryMatch = activeFilters.salary.some(range => {
                const salaryNum = extractSalaryNumber(job.salary);
                switch(range) {
                    case '0-5': return salaryNum >= 0 && salaryNum <= 5;
                    case '5-10': return salaryNum > 5 && salaryNum <= 10;
                    case '10-20': return salaryNum > 10 && salaryNum <= 20;
                    case '20-35': return salaryNum > 20 && salaryNum <= 35;
                    case '35+': return salaryNum > 35;
                    default: return true;
                }
            });
            if (!salaryMatch) return false;
        }
        
        return true;
    });
    
    renderJobs();
    renderPagination();
    renderActiveFilters();
    updateResultsCount();
}

// Extract salary number from string (e.g., "₹18-25 LPA" -> 18)
function extractSalaryNumber(salaryStr) {
    const match = salaryStr.match(/₹(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// Render job cards
function renderJobs() {
    const container = document.getElementById('jobs-container');
    const emptyState = document.getElementById('empty-state');
    
    if (filteredJobs.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    // Paginate
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    const pageJobs = filteredJobs.slice(startIndex, endIndex);
    
    container.innerHTML = pageJobs.map((job, index) => {
        // Escape job data for data attribute (HTML attribute safe)
        const jobDataAttr = JSON.stringify(job).replace(/"/g, '&quot;');
        return `
        <div class="job-card job-card-reveal rounded-2xl p-6" data-index="${index}">
            <div class="flex flex-col md:flex-row gap-4">
                <!-- Company Logo -->
                <div class="flex-shrink-0">
                    <img src="${job.logo}" alt="${job.company}" class="company-logo" onerror="this.src='https://via.placeholder.com/56?text=${job.company.charAt(0)}'">
                </div>
                
                <!-- Job Details -->
                <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                            <h3 class="text-lg font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer">${job.title}</h3>
                            <p class="text-sm font-medium text-gray-600">${job.company}</p>
                        </div>
                        <div class="flex gap-2">
                            ${job.badges.map(badge => `
                                <span class="badge ${getBadgeClass(badge)}">${badge}</span>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                        <span class="flex items-center gap-1">
                            <i class="ri-map-pin-line"></i>
                            ${job.location}
                        </span>
                        <span class="flex items-center gap-1">
                            <i class="ri-briefcase-line"></i>
                            ${formatExperience(job.experience)}
                        </span>
                        <span class="flex items-center gap-1">
                            <i class="ri-money-rupee-circle-line"></i>
                            ${job.salary}
                        </span>
                        <span class="flex items-center gap-1">
                            <i class="ri-time-line"></i>
                            ${formatPostedDate(job.postedDays)}
                        </span>
                    </div>
                    
                    <p class="text-sm text-gray-600 mb-4 line-clamp-2">${job.description}</p>
                    
                    <div class="flex flex-wrap items-center gap-2 mb-4">
                        ${job.skills.slice(0, 4).map(skill => `
                            <span class="skill-tag px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full cursor-pointer">${skill}</span>
                        `).join('')}
                        ${job.skills.length > 4 ? `<span class="text-xs text-gray-500">+${job.skills.length - 4} more</span>` : ''}
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex md:flex-col gap-2 md:ml-4">
                    <button class="apply-btn flex-1 md:flex-none bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                        Apply Now
                        <i class="ri-arrow-right-line arrow-icon"></i>
                    </button>
                    <button class="save-btn flex-1 md:flex-none border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2" data-job="${jobDataAttr}">
                        <i class="ri-bookmark-line transition-transform"></i>
                        Save
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
    
    // Initialize scroll reveal for job cards
    initScrollReveal();
}

// Get badge CSS class
function getBadgeClass(badge) {
    switch(badge.toLowerCase()) {
        case 'remote': return 'badge-remote';
        case 'fresher': return 'badge-fresher';
        case 'fast hiring': return 'badge-fast';
        default: return 'badge-remote';
    }
}

// Format experience
function formatExperience(exp) {
    if (exp === '0-1') return 'Fresher';
    if (exp === '10+') return '10+ years';
    return exp + ' years';
}

// Format posted date
function formatPostedDate(days) {
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
}

// Render pagination
function renderPagination() {
    const container = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `
        <button class="pagination-btn ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}" 
            onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="ri-arrow-left-s-line"></i>
        </button>
    `;
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="pagination-btn text-gray-700" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="px-2 text-gray-400">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === currentPage ? 'active' : 'text-gray-700'}" 
                onclick="goToPage(${i})">${i}</button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="px-2 text-gray-400">...</span>`;
        }
        html += `<button class="pagination-btn text-gray-700" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `
        <button class="pagination-btn ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}" 
            onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="ri-arrow-right-s-line"></i>
        </button>
    `;
    
    container.innerHTML = html;
}

// Go to specific page
function goToPage(page) {
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderJobs();
    renderPagination();
    
    // Scroll to top of jobs
    document.getElementById('jobs-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Render active filters tags
function renderActiveFilters() {
    const container = document.getElementById('active-filters');
    let html = '';
    
    // Add filter tags
    Object.entries(activeFilters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
            value.forEach(v => {
                html += `
                    <span class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                        ${formatFilterLabel(key, v)}
                        <button onclick="removeFilter('${key}', '${v}')" class="hover:text-primary-hover">
                            <i class="ri-close-line"></i>
                        </button>
                    </span>
                `;
            });
        } else if (value && typeof value === 'string' && key !== 'search' && key !== 'location') {
            html += `
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    ${formatFilterLabel(key, value)}
                    <button onclick="removeFilter('${key}', '${value}')" class="hover:text-primary-hover">
                        <i class="ri-close-line"></i>
                    </button>
                </span>
            `;
        } else if (typeof value === 'number' && key === 'postedDate') {
            html += `
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    Last ${value} days
                    <button onclick="removeFilter('${key}', ${value})" class="hover:text-primary-hover">
                        <i class="ri-close-line"></i>
                    </button>
                </span>
            `;
        }
    });
    
    container.innerHTML = html;
}

// Format filter label
function formatFilterLabel(key, value) {
    const labels = {
        experience: { '0-1': 'Fresher', '1-3': '1-3 yrs', '3-6': '3-6 yrs', '6-10': '6-10 yrs', '10+': '10+ yrs' },
        salary: { '0-5': '0-5 LPA', '5-10': '5-10 LPA', '10-20': '10-20 LPA', '20-35': '20-35 LPA', '35+': '35+ LPA' }
    };
    
    if (labels[key] && labels[key][value]) {
        return labels[key][value];
    }
    return value;
}

// Remove a specific filter
function removeFilter(key, value) {
    if (Array.isArray(activeFilters[key])) {
        activeFilters[key] = activeFilters[key].filter(v => v !== value);
        // Uncheck the checkbox
        const checkbox = document.querySelector(`input[data-filter="${key}"][value="${value}"]`);
        if (checkbox) checkbox.checked = false;
    } else if (key === 'postedDate') {
        activeFilters[key] = null;
        // Uncheck radio
        document.querySelectorAll(`input[data-filter="${key}"]`).forEach(r => r.checked = false);
    } else {
        activeFilters[key] = '';
    }
    
    currentPage = 1;
    applyFilters();
}

// Clear all filters
function clearAllFilters() {
    activeFilters = {
        search: '',
        location: '',
        experience: [],
        salary: [],
        jobType: [],
        companyType: [],
        postedDate: null,
        industry: []
    };
    
    // Clear inputs
    document.getElementById('search-input').value = '';
    document.getElementById('location-input').value = '';
    
    // Uncheck all checkboxes and radios
    document.querySelectorAll('.filter-checkbox, .filter-radio').forEach(input => {
        input.checked = false;
    });
    
    currentPage = 1;
    applyFilters();
    
    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname);
}

// Update results count
function updateResultsCount() {
    const countEl = document.getElementById('results-count');
    const total = filteredJobs.length;
    
    if (total === 0) {
        countEl.textContent = 'No jobs found';
    } else if (total === 1) {
        countEl.textContent = '1 job found';
    } else {
        countEl.textContent = `${total} jobs found`;
    }
}

// Expose functions to global scope for onclick handlers
window.applyFilters = applyFilters;
window.clearAllFilters = clearAllFilters;
window.goToPage = goToPage;
window.removeFilter = removeFilter;

