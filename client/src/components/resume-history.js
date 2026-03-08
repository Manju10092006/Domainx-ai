/**
 * Resume History
 * Loads and displays resume history for authenticated users
 */

// API Base URL - same as other dashboard APIs
const RESUME_HISTORY_API_BASE = 'http://localhost:5001/api/resume';

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
 * Load resume history from API
 */
async function loadResumeHistory() {
    const token = getToken();
    const container = document.getElementById('resumeHistoryList');

    if (!container) {
        console.log('Resume history container not found');
        return;
    }

    // Show loading state
    container.innerHTML = `
        <div class="empty-state text-center py-12 text-slate-500">
            <i class="fa-solid fa-spinner fa-spin text-3xl mb-4"></i>
            <p>Loading your resume history...</p>
        </div>
    `;

    if (!token) {
        // Check localStorage for any locally stored history first
        try {
            const localHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
            if (localHistory.length > 0) {
                console.log('No token but found localStorage history:', localHistory.length, 'items');
                renderResumeHistory(localHistory);
                return;
            }
        } catch (localErr) {
            console.error('Error loading from localStorage:', localErr);
        }

        container.innerHTML = `
            <div class="empty-state text-center py-12 text-slate-500">
                <i class="fa-solid fa-user-lock text-4xl mb-4 text-slate-400"></i>
                <p class="text-lg font-medium mb-2">Please login to view your resume history.</p>
                <p class="text-sm">Sign in to see your past resume analyses.</p>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`${RESUME_HISTORY_API_BASE}/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            container.innerHTML = `
                <div class="empty-state text-center py-12 text-slate-500">
                    <i class="fa-solid fa-clock text-4xl mb-4 text-amber-500"></i>
                    <p class="text-lg font-medium mb-2">Session expired. Please login again.</p>
                </div>
            `;
            return;
        }

        const data = await response.json();

        if (!data.success) {
            // Try localStorage first before showing error
            try {
                const localHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
                if (localHistory.length > 0) {
                    console.log('API returned error, loading from localStorage:', localHistory.length, 'items');
                    renderResumeHistory(localHistory);
                    return;
                }
            } catch (localErr) {
                console.error('Error loading from localStorage:', localErr);
            }

            container.innerHTML = `
                <div class="empty-state text-center py-12 text-red-500">
                    <i class="fa-solid fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="text-lg font-medium mb-2">Error: ${data.error || 'Failed to load history'}</p>
                </div>
            `;
            return;
        }

        // If API returns empty, check localStorage as fallback
        if (!Array.isArray(data.history) || data.history.length === 0) {
            // Check localStorage for locally stored history
            try {
                const localHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
                if (localHistory.length > 0) {
                    console.log('API returned empty, loading from localStorage:', localHistory.length, 'items');
                    renderResumeHistory(localHistory);
                    return;
                }
            } catch (localErr) {
                console.error('Error loading from localStorage:', localErr);
            }

            // Show empty state only if both API and localStorage are empty
            container.innerHTML = `
                <div class="empty-state text-center py-12 text-slate-500">
                    <i class="fa-solid fa-file-circle-question text-4xl mb-4 text-slate-400"></i>
                    <p class="text-lg font-medium mb-2">No resume history yet.</p>
                    <p class="text-sm">Upload a resume to see your analysis history here.</p>
                </div>
            `;
            return;
        }

        console.log('Loaded resume history:', data.history.length, 'items');
        renderResumeHistory(data.history);

    } catch (err) {
        console.error('Error loading resume history:', err);

        // Try to load from localStorage as fallback
        try {
            const localHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
            if (localHistory.length > 0) {
                console.log('Loading resume history from localStorage:', localHistory.length, 'items');
                renderResumeHistory(localHistory);
                return;
            }
        } catch (localErr) {
            console.error('Error loading from localStorage:', localErr);
        }

        container.innerHTML = `
            <div class="empty-state text-center py-12 text-red-500">
                <i class="fa-solid fa-wifi-slash text-4xl mb-4"></i>
                <p class="text-lg font-medium mb-2">Error loading resume history.</p>
                <p class="text-sm">Please check your connection and try again.</p>
            </div>
        `;
    }
}

/**
 * Render resume history items
 */
function renderResumeHistory(history) {
    const container = document.getElementById('resumeHistoryList');
    if (!container) {
        console.error('resumeHistoryList container not found!');
        return;
    }

    console.log('Rendering resume history:', history.length, 'items');
    console.log('History data:', history);

    container.innerHTML = history.map(item => {
        const date = new Date(item.createdAt || item.analyzedAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Get analysis score (handle both API and localStorage formats)
        const analysisScore = item.analysisScore || item.analysisResult?.score || 0;

        // Determine score color - green for high scores
        let scoreBgColor = '#10b981'; // green-500
        if (analysisScore < 50) {
            scoreBgColor = '#ef4444'; // red-500
        } else if (analysisScore < 70) {
            scoreBgColor = '#f59e0b'; // amber-500
        }

        // Get skills preview (first 5)
        // Handle both API format (item.skills) and localStorage format (item.analysisResult.skills)
        const skills = item.skills || item.analysisResult?.skills || [];
        const skillsPreview = skills.slice(0, 5);
        const moreSkillsCount = skills.length - 5;

        // Create resume snippet from summary or experience
        // Handle both API format and localStorage format
        const summary = item.summary || item.analysisResult?.summary || '';
        const experience = item.experience || item.analysisResult?.experience || '';
        const resumeSnippetText = summary || experience || 'No summary available.';
        const resumeSnippet = resumeSnippetText
            .substring(0, 200)
            .trim() + (resumeSnippetText.length > 200 ? '...' : '');

        // Get item ID (could be _id from database or id from localStorage)
        const itemId = item._id || item.id;

        return `
            <div class="resume-history-card" data-id="${itemId}">
                <div class="resume-card-header">
                    <div class="resume-card-title-section">
                        <h3 class="resume-card-filename">${escapeHtml(item.originalFilename || item.fileName || 'Resume.pdf')}</h3>
                        <p class="resume-card-date">${formattedDate}</p>
                    </div>
                    <div class="resume-card-score" style="background-color: ${scoreBgColor};">
                        ${analysisScore}/100
                    </div>
                </div>
                
                <div class="resume-card-content">
                    <div class="resume-card-skills-section">
                        <p class="skills-label">Top Skills:</p>
                        <div class="skills-tags">
                            ${skillsPreview.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
                            ${moreSkillsCount > 0 ? `<span class="skill-tag more-skills">+${moreSkillsCount} more</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="resume-card-snippet">
                        <p class="snippet-text">${escapeHtml(resumeSnippet)}</p>
                    </div>
                </div>
                
                <div class="resume-card-actions">
                    <button class="action-btn view-report-btn" onclick="viewHistoryDetails('${itemId}')">
                        <i class="fa-solid fa-eye"></i>
                        View Full Report
                    </button>
                    <button class="action-btn find-jobs-btn" onclick="findJobsFromResume('${itemId}')">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        Find Jobs
                    </button>
                    <button class="action-btn download-btn" onclick="downloadResume('${itemId}')">
                        <i class="fa-solid fa-download"></i>
                        Download
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * View details of a history item
 */
async function viewHistoryDetails(id) {
    // Check if this is a localStorage entry (numeric/timestamp string) or API entry (MongoDB ObjectId)
    const isLocalStorageEntry = !id.match(/^[0-9a-fA-F]{24}$/); // MongoDB ObjectId is 24 hex chars

    if (isLocalStorageEntry) {
        // Load from localStorage
        try {
            const localHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
            const item = localHistory.find(h => (h.id || h._id) === id);

            if (item) {
                // Convert localStorage format to API format for the modal
                const formattedItem = {
                    _id: item.id,
                    originalFilename: item.fileName || 'Resume.pdf',
                    createdAt: item.analyzedAt || item.uploadedAt,
                    analysisScore: item.analysisResult?.score || 0,
                    skills: item.analysisResult?.skills || [],
                    summary: item.analysisResult?.summary || '',
                    strengths: item.analysisResult?.strengths || [],
                    weaknesses: item.analysisResult?.weaknesses || [],
                    suggestions: item.analysisResult?.suggestions || [],
                    experience: item.analysisResult?.experience || '',
                    education: item.analysisResult?.education || ''
                };
                showHistoryDetailModal(formattedItem);
            } else {
                alert('Resume history item not found in local storage.');
            }
        } catch (err) {
            console.error('Error loading from localStorage:', err);
            alert('Error loading details from local storage.');
        }
        return;
    }

    // Otherwise, try to load from API
    const token = getToken();
    if (!token) {
        alert('Please login to view details.');
        return;
    }

    try {
        const response = await fetch(`${RESUME_HISTORY_API_BASE}/history/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.item) {
            showHistoryDetailModal(data.item);
        } else {
            // If API fails, try localStorage as fallback
            try {
                const localHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
                const item = localHistory.find(h => (h.id || h._id) === id);

                if (item) {
                    const formattedItem = {
                        _id: item.id,
                        originalFilename: item.fileName || 'Resume.pdf',
                        createdAt: item.analyzedAt || item.uploadedAt,
                        analysisScore: item.analysisResult?.score || 0,
                        skills: item.analysisResult?.skills || [],
                        summary: item.analysisResult?.summary || '',
                        strengths: item.analysisResult?.strengths || [],
                        weaknesses: item.analysisResult?.weaknesses || [],
                        suggestions: item.analysisResult?.suggestions || [],
                        experience: item.analysisResult?.experience || '',
                        education: item.analysisResult?.education || ''
                    };
                    showHistoryDetailModal(formattedItem);
                    return;
                }
            } catch (localErr) {
                console.error('Error loading from localStorage fallback:', localErr);
            }

            alert('Failed to load details: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        console.error('Error loading history details:', err);

        // Try localStorage as fallback
        try {
            const localHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
            const item = localHistory.find(h => (h.id || h._id) === id);

            if (item) {
                const formattedItem = {
                    _id: item.id,
                    originalFilename: item.fileName || 'Resume.pdf',
                    createdAt: item.analyzedAt || item.uploadedAt,
                    analysisScore: item.analysisResult?.score || 0,
                    skills: item.analysisResult?.skills || [],
                    summary: item.analysisResult?.summary || '',
                    strengths: item.analysisResult?.strengths || [],
                    weaknesses: item.analysisResult?.weaknesses || [],
                    suggestions: item.analysisResult?.suggestions || [],
                    experience: item.analysisResult?.experience || '',
                    education: item.analysisResult?.education || ''
                };
                showHistoryDetailModal(formattedItem);
                return;
            }
        } catch (localErr) {
            console.error('Error loading from localStorage fallback:', localErr);
        }

        alert('Error loading details. Please try again.');
    }
}

/**
 * Show detail modal for history item
 */
function showHistoryDetailModal(item) {
    // Remove existing modal if present
    const existingModal = document.getElementById('historyDetailModal');
    if (existingModal) existingModal.remove();

    // Handle both API format and localStorage format
    const createdAt = item.createdAt || item.analyzedAt || new Date().toISOString();
    const date = new Date(createdAt);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Get data in consistent format
    const analysisScore = item.analysisScore || item.analysisResult?.score || 0;
    const skills = item.skills || item.analysisResult?.skills || [];
    const strengths = item.strengths || item.analysisResult?.strengths || [];
    const weaknesses = item.weaknesses || item.analysisResult?.weaknesses || [];
    const suggestions = item.suggestions || item.analysisResult?.suggestions || [];
    const summary = item.summary || item.analysisResult?.summary || '';
    const experience = item.experience || item.analysisResult?.experience || '';
    const education = item.education || item.analysisResult?.education || '';
    const originalFilename = item.originalFilename || item.fileName || 'Resume.pdf';

    const modal = document.createElement('div');
    modal.id = 'historyDetailModal';
    modal.className = 'history-modal-overlay';
    modal.innerHTML = `
        <div class="history-modal">
            <div class="history-modal-header">
                <h3><i class="fa-solid fa-file-pdf text-red-500 mr-2"></i>${escapeHtml(originalFilename)}</h3>
                <button class="modal-close" onclick="closeHistoryModal()">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
            <div class="history-modal-body">
                <div class="modal-score-section">
                    <div class="modal-score ${analysisScore >= 70 ? 'good' : analysisScore >= 50 ? 'medium' : 'low'}">
                        ${analysisScore}
                    </div>
                    <p>ATS Score</p>
                    <small>Analyzed on ${formattedDate}</small>
                </div>
                
                <div class="modal-details-section">
                    ${summary ? `
                    <div class="detail-block">
                        <h4><i class="fa-solid fa-file-text text-blue-600 mr-2"></i>Summary</h4>
                        <p class="detail-text">${escapeHtml(summary)}</p>
                    </div>
                    ` : ''}
                    
                    <div class="detail-block">
                        <h4><i class="fa-solid fa-code text-blue-600 mr-2"></i>Skills (${skills.length})</h4>
                        <div class="skills-list">
                            ${skills.map(s => `<span class="skill-badge">${escapeHtml(s)}</span>`).join('')}
                        </div>
                    </div>
                    
                    ${strengths.length > 0 ? `
                    <div class="detail-block">
                        <h4><i class="fa-solid fa-check-circle text-green-600 mr-2"></i>Strengths</h4>
                        <ul class="detail-list strengths">
                            ${strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${weaknesses.length > 0 ? `
                    <div class="detail-block">
                        <h4><i class="fa-solid fa-exclamation-triangle text-amber-600 mr-2"></i>Weaknesses</h4>
                        <ul class="detail-list weaknesses">
                            ${weaknesses.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${suggestions.length > 0 ? `
                    <div class="detail-block">
                        <h4><i class="fa-solid fa-lightbulb text-blue-600 mr-2"></i>Suggestions</h4>
                        <ul class="detail-list suggestions">
                            ${suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    ${experience ? `
                    <div class="detail-block">
                        <h4><i class="fa-solid fa-briefcase text-purple-600 mr-2"></i>Experience</h4>
                        <p class="detail-text">${escapeHtml(experience)}</p>
                    </div>
                    ` : ''}
                    
                    ${education ? `
                    <div class="detail-block">
                        <h4><i class="fa-solid fa-graduation-cap text-indigo-600 mr-2"></i>Education</h4>
                        <p class="detail-text">${escapeHtml(education)}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeHistoryModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            closeHistoryModal();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}

/**
 * Close history detail modal
 */
function closeHistoryModal() {
    const modal = document.getElementById('historyDetailModal');
    if (modal) modal.remove();
}

/**
 * Delete a history item
 */
async function deleteHistoryItem(id) {
    if (!confirm('Are you sure you want to delete this resume history entry?')) {
        return;
    }

    const token = getToken();
    if (!token) {
        alert('Please login to delete history.');
        return;
    }

    try {
        const response = await fetch(`${RESUME_HISTORY_API_BASE}/history/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Remove the item from DOM with animation
            const item = document.querySelector(`.resume-history-item[data-id="${id}"]`);
            if (item) {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    item.remove();
                    // Check if list is empty
                    const container = document.getElementById('resumeHistoryList');
                    if (container && container.children.length === 0) {
                        container.innerHTML = `
                            <div class="empty-state text-center py-12 text-slate-500">
                                <i class="fa-solid fa-file-circle-question text-4xl mb-4 text-slate-400"></i>
                                <p class="text-lg font-medium mb-2">No resume history yet.</p>
                                <p class="text-sm">Upload a resume to see your analysis history here.</p>
                            </div>
                        `;
                    }
                }, 300);
            }
        } else {
            alert('Failed to delete: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        console.error('Error deleting history item:', err);
        alert('Error deleting item. Please try again.');
    }
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Setup refresh button
    const refreshBtn = document.getElementById('refreshHistoryBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadResumeHistory();
        });
    }

    // Load history if we're on the resume history section
    const historySection = document.getElementById('section-resume-history');
    if (historySection && historySection.classList.contains('active')) {
        loadResumeHistory();
    }

    // Also observe for section visibility changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.id === 'section-resume-history' && target.classList.contains('active')) {
                    loadResumeHistory();
                }
            }
        });
    });

    if (historySection) {
        observer.observe(historySection, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // Also check for resume history on initial load (even if section not active)
    // This ensures localStorage history is available when user navigates to the section
    setTimeout(() => {
        const localHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
        if (localHistory.length > 0) {
            console.log('Found resume history in localStorage on page load:', localHistory.length, 'items');
        }
    }, 1000);
});

/**
 * Find jobs from resume history
 */
async function findJobsFromResume(historyId) {
    const token = getToken();
    if (!token) {
        alert('Please login to find jobs.');
        return;
    }

    try {
        // Get the resume history item to extract skills
        const response = await fetch(`${RESUME_HISTORY_API_BASE}/history/${historyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.item) {
            // Extract skills for job search (get all skills, not just first 5)
            const skills = data.item.skills || [];
            
            // If no skills from API, try localStorage as fallback
            let finalSkills = skills;
            if (finalSkills.length === 0) {
                try {
                    const localHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
                    const localItem = localHistory.find(h => (h.id || h._id) === historyId);
                    if (localItem) {
                        finalSkills = localItem.analysisResult?.skills || localItem.skills || [];
                    }
                } catch (localErr) {
                    console.error('Error loading from localStorage:', localErr);
                }
            }
            
            // Join skills with comma for URL parameter (max 10 skills)
            const skillsQuery = finalSkills.slice(0, 10).join(',');
            
            // Build URL with skills and location parameters
            const jobsUrl = `../../jobs/jobs.html?skills=${encodeURIComponent(skillsQuery)}&location=India`;
            
            // Redirect to jobs page with skills and location
            window.location.href = jobsUrl;
        } else {
            // Fallback: try localStorage
            try {
                const localHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
                const localItem = localHistory.find(h => (h.id || h._id) === historyId);
                if (localItem) {
                    const skills = localItem.analysisResult?.skills || localItem.skills || [];
                    const skillsQuery = skills.slice(0, 10).join(',');
                    const jobsUrl = `../../jobs/jobs.html?skills=${encodeURIComponent(skillsQuery)}&location=India`;
                    window.location.href = jobsUrl;
                    return;
                }
            } catch (localErr) {
                console.error('Error loading from localStorage:', localErr);
            }
            
            // Final fallback: redirect without skills
            window.location.href = '../../jobs/jobs.html?location=India';
        }
    } catch (err) {
        console.error('Error loading resume for job search:', err);
        
        // Try localStorage as fallback
        try {
            const localHistory = JSON.parse(localStorage.getItem('resumeHistory') || '[]');
            const localItem = localHistory.find(h => (h.id || h._id) === historyId);
            if (localItem) {
                const skills = localItem.analysisResult?.skills || localItem.skills || [];
                const skillsQuery = skills.slice(0, 10).join(',');
                const jobsUrl = `../../jobs/jobs.html?skills=${encodeURIComponent(skillsQuery)}&location=India`;
                window.location.href = jobsUrl;
                return;
            }
        } catch (localErr) {
            console.error('Error loading from localStorage fallback:', localErr);
        }
        
        // Final fallback: redirect anyway
        window.location.href = '../../jobs/jobs.html?location=India';
    }
}

/**
 * Download resume file
 */
async function downloadResume(historyId) {
    const token = getToken();
    if (!token) {
        alert('Please login to download resume.');
        return;
    }

    try {
        // Get the resume history item to get file path
        const response = await fetch(`${RESUME_HISTORY_API_BASE}/history/${historyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.item) {
            const item = data.item;

            // Check if we have a file path
            if (item.storedFilepath) {
                // Try to download from server
                const downloadUrl = `${RESUME_HISTORY_API_BASE}/download/${historyId}`;
                window.open(downloadUrl, '_blank');
            } else {
                alert('Resume file not available for download. The file may have been removed.');
            }
        } else {
            alert('Failed to load resume details for download.');
        }
    } catch (err) {
        console.error('Error downloading resume:', err);
        alert('Error downloading resume. Please try again.');
    }
}

// Export function for manual refresh
if (typeof window !== 'undefined') {
    window.loadResumeHistory = loadResumeHistory;
    window.viewHistoryDetails = viewHistoryDetails;
    window.deleteHistoryItem = deleteHistoryItem;
    window.closeHistoryModal = closeHistoryModal;
    window.findJobsFromResume = findJobsFromResume;
    window.downloadResume = downloadResume;
}



