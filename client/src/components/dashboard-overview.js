/**
 * Dashboard Overview
 * Fetches and displays saved jobs count, latest saved jobs, and last resume info
 */

(function() {
    'use strict';

    const API_BASE_URL = 'http://localhost:5000/api';
    
    /**
     * Get JWT token from localStorage
     */
    /**
     * Get JWT token from localStorage
     * PRIMARY KEY: jc_token
     */
    function getToken() {
        return (
            localStorage.getItem('jc_token') ||
            localStorage.getItem('jwt') ||
            localStorage.getItem('authToken') ||
            localStorage.getItem('token') ||
            null
        );
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format date
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    /**
     * Fetch dashboard overview
     */
    async function fetchDashboardOverview() {
        const token = getToken();
        
        if (!token) {
            return null;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/dashboard/overview`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                return null;
            }

            const result = await response.json();
            return result.success ? result : null;
        } catch (error) {
            console.error('Error fetching dashboard overview:', error);
            return null;
        }
    }

    /**
     * Update saved jobs count
     */
    function updateSavedJobsCount(count) {
        // Try multiple selectors for saved jobs count
        const selectors = [
            '#savedJobsCount',
            '.saved-jobs-count',
            '[data-saved-jobs-count]'
        ];

        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = count || 0;
            }
        });
    }

    /**
     * Update latest saved jobs list
     * DISABLED: Saved Jobs Overview section removed - only dynamic Saved Jobs list is shown
     */
    function updateLatestSavedJobs(jobs) {
        // Saved Jobs Overview section has been removed - return early
        // Only the dynamic Saved Jobs section (id="view-saved-jobs") is shown
        return;
    }

    /**
     * Update last resume info
     */
    function updateLastResume(resume) {
        // Try multiple selectors for last resume
        const selectors = [
            '#lastResumeName',
            '#lastResumeDate',
            '#lastResumeScore',
            '.last-resume-name',
            '.last-resume-date',
            '.last-resume-score'
        ];

        if (resume) {
            const nameEl = document.querySelector('#lastResumeName, .last-resume-name');
            if (nameEl) nameEl.textContent = resume.fileName || 'N/A';

            const dateEl = document.querySelector('#lastResumeDate, .last-resume-date');
            if (dateEl) dateEl.textContent = formatDate(resume.uploadedAt) || 'N/A';

            const scoreEl = document.querySelector('#lastResumeScore, .last-resume-score');
            if (scoreEl && resume.atsScore !== null && resume.atsScore !== undefined) {
                scoreEl.textContent = `${resume.atsScore}/100`;
                scoreEl.classList.remove('hidden');
            }
        } else {
            // Show "No resume uploaded yet"
            const nameEl = document.querySelector('#lastResumeName, .last-resume-name');
            if (nameEl) nameEl.textContent = 'No resume uploaded yet';

            const dateEl = document.querySelector('#lastResumeDate, .last-resume-date');
            if (dateEl) dateEl.textContent = '';

            const scoreEl = document.querySelector('#lastResumeScore, .last-resume-score');
            if (scoreEl) scoreEl.classList.add('hidden');
        }
    }

    /**
     * Initialize dashboard overview
     */
    async function init() {
        // Only run on dashboard page
        if (!document.getElementById('view-upload-resume') && 
            !document.getElementById('view-saved-jobs') &&
            !document.getElementById('view-profile')) {
            return;
        }

        const token = getToken();
        if (!token) {
            return;
        }

        const overview = await fetchDashboardOverview();
        
        if (!overview) {
            return;
        }

        // Update saved jobs count
        updateSavedJobsCount(overview.savedJobsCount);

        // Update latest saved jobs
        updateLatestSavedJobs(overview.latestSavedJobs);

        // Update last resume
        updateLastResume(overview.lastResume);
    }

    /**
     * Remove any existing Saved Jobs Overview section
     */
    function removeSavedJobsOverview() {
        const overviewSection = document.getElementById('dashboard-saved-jobs-section');
        if (overviewSection) {
            overviewSection.remove();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            removeSavedJobsOverview();
            init();
        });
    } else {
        removeSavedJobsOverview();
        init();
    }

    // Re-initialize when view changes (if using SPA navigation)
    const observer = new MutationObserver(() => {
        if (document.getElementById('view-upload-resume') || 
            document.getElementById('view-saved-jobs')) {
            init();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();



