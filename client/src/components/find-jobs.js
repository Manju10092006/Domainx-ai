/**
 * Find Jobs Page - Save Job Functionality
 * Handles saving jobs to Redis via backend API
 */

const API_BASE_URL = 'http://localhost:5000'; // Backend server

// Get JWT token from localStorage
function getToken() {
    return localStorage.getItem('jwt') || localStorage.getItem('authToken') || '';
}

// Mark button as saved
function markButtonAsSaved(btn, alreadySaved = false) {
    if (alreadySaved) {
        btn.classList.add('saved');
        btn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Saved';
        return;
    }

    btn.classList.add('saved');
    btn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Saved';

    // Add animation class
    btn.style.transform = 'scale(1.1)';
    setTimeout(() => {
        btn.style.transform = '';
    }, 200);
}

// Show toast notification
function showSavedToast(message, isError = false) {
    // Remove existing toast if any
    const existingToast = document.getElementById('save-job-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'save-job-toast';
    toast.className = `save-job-toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;

    // Add styles
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '14px 20px',
        borderRadius: '12px',
        backgroundColor: isError ? '#ef4444' : '#10b981',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateY(20px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none'
    });

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        toast.style.pointerEvents = 'auto';
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Initialize save job functionality
document.addEventListener('DOMContentLoaded', () => {
    // Use event delegation for save buttons
    document.addEventListener('click', async (event) => {
        const btn = event.target.closest('.save-job-btn');
        if (!btn) return;

        event.preventDefault();
        event.stopPropagation();

        const card = btn.closest('.job-card') || btn.closest('.info-card');
        if (!card) return;

        // Get job data from data attributes or DOM
        const jobId = card.dataset.jobId ||
            card.querySelector('[data-job-id]')?.dataset.jobId ||
            `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Extract job details
        const titleEl = card.querySelector('.job-title') ||
            card.querySelector('h2') ||
            card.querySelector('h3');
        const companyEl = card.querySelector('.job-company') ||
            card.querySelector('p');
        const locationEl = card.querySelector('.job-location') ||
            card.querySelector('[data-location]');
        const salaryEl = card.querySelector('.job-salary') ||
            card.querySelector('[data-salary]');
        const jobTypeEl = card.querySelector('.job-type') ||
            card.querySelector('[data-job-type]');
        const logoEl = card.querySelector('img') ||
            card.querySelector('.job-logo img');

        const job = {
            id: jobId,
            title: titleEl?.innerText.trim() || titleEl?.textContent.trim() || 'Job Title',
            company: companyEl?.innerText.trim() || companyEl?.textContent.trim() || 'Company',
            location: locationEl?.innerText.trim() || locationEl?.textContent.trim() || locationEl?.dataset.location || '',
            salary: salaryEl?.innerText.trim() || salaryEl?.textContent.trim() || salaryEl?.dataset.salary || '',
            jobType: jobTypeEl?.innerText.trim() || jobTypeEl?.textContent.trim() || jobTypeEl?.dataset.jobType || 'Full-time',
            logo: logoEl?.src || logoEl?.dataset.logo || ''
        };

        // Check if already saved
        if (btn.classList.contains('saved')) {
            showSavedToast('Job already saved', false);
            return;
        }

        // Get token
        const token = getToken();
        if (!token) {
            showSavedToast('Please login to save jobs', true);
            // Redirect to login or show login modal
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/saved-jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(job)
            });

            const data = await res.json();

            if (res.ok && data.saved) {
                markButtonAsSaved(btn, !!data.alreadySaved);
                showSavedToast(data.alreadySaved ? 'Job already saved' : 'Job saved to your Saved Jobs');
            } else if (res.status === 401) {
                showSavedToast('Please login to save jobs', true);
                // Optionally redirect to login
            } else {
                showSavedToast('Could not save job', true);
            }
        } catch (err) {
            console.error('Error saving job:', err);
            showSavedToast('Network error, please try again', true);
        }
    });

    // Add save buttons to existing job cards if they don't have them
    const jobCards = document.querySelectorAll('.info-card, .job-card');
    jobCards.forEach(card => {
        if (!card.querySelector('.save-job-btn')) {
            // Try to find an existing action button area
            let actionArea = card.querySelector('.job-footer') ||
                card.querySelector('.job-actions') ||
                card;

            // Create save button
            const saveBtn = document.createElement('button');
            saveBtn.className = 'save-job-btn';
            saveBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i> Save';

            // Add styles if not in stylesheet
            if (!document.getElementById('save-btn-styles')) {
                const style = document.createElement('style');
                style.id = 'save-btn-styles';
                style.textContent = `
                    .save-job-btn {
                        padding: 8px 16px;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        background: white;
                        color: #6b7280;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .save-job-btn:hover {
                        background: #f9fafb;
                        border-color: #2563eb;
                        color: #2563eb;
                    }
                    .save-job-btn.saved {
                        background: #2563eb;
                        border-color: #2563eb;
                        color: white;
                    }
                    .save-job-btn.saved:hover {
                        background: #1d4ed8;
                    }
                `;
                document.head.appendChild(style);
            }

            // Insert button
            if (actionArea === card) {
                // Append to card
                actionArea.appendChild(saveBtn);
            } else {
                // Insert before existing buttons or at end
                const existingBtn = actionArea.querySelector('button');
                if (existingBtn) {
                    actionArea.insertBefore(saveBtn, existingBtn);
                } else {
                    actionArea.appendChild(saveBtn);
                }
            }
        }

        // Ensure card has data-job-id
        if (!card.dataset.jobId) {
            const title = card.querySelector('h2, h3')?.textContent || '';
            const company = card.querySelector('p')?.textContent || '';
            card.dataset.jobId = `job-${btoa(title + company).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;
        }
    });
});

