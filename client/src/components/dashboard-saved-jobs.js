/**
 * Dashboard Saved Jobs
 * Loads and displays saved jobs for authenticated users
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

// Load saved jobs function
async function loadDashboardSavedJobs() {
  const token = getToken();

  const container = document.getElementById("dashboardSavedJobsContainer");
  if (!container) {
    // Container not found, try again after a short delay (in case it's loaded dynamically)
    setTimeout(loadDashboardSavedJobs, 500);
    return;
  }

  if (!token) {
    container.innerHTML = `
      <p class="text-gray-500 text-center mt-4">Please login to see saved jobs.</p>
    `;
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/saved-jobs", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      container.innerHTML = `
        <p class="text-gray-500 text-center mt-4">Please login to see saved jobs.</p>
      `;
      return;
    }

    const data = await response.json();
    
    if (!data.success) {
      container.innerHTML = `
        <p class="text-red-600 text-center mt-4">Error: ${data.error || 'Failed to load saved jobs'}</p>
      `;
      return;
    }
    
    if (!Array.isArray(data.jobs) || data.jobs.length === 0) {
      container.innerHTML = `
        <p class="text-gray-500 text-center mt-4">No saved jobs found.</p>
      `;
      return;
    }

    console.log('Loaded saved jobs:', data.jobs.length);
    
    container.innerHTML = data.jobs
      .map(
        (job) => `
      <div class="saved-job-card">
        <div class="saved-job-main">
          <div class="saved-job-text">
            <div class="saved-job-title">${escapeHtml(job.title || 'N/A')}</div>
            <div class="saved-job-meta">${escapeHtml(job.company || 'N/A')} • ${escapeHtml(job.location || 'N/A')}</div>
          </div>
          <div class="saved-job-actions">
            <a href="${escapeHtml(job.url || job.applyLink || '#')}" target="_blank" class="btn btn-view-job">View</a>
            <button class="btn btn-remove-job" data-id="${escapeHtml(job.jobId)}">Remove</button>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    // Attach remove button listeners
    attachRemoveListeners();
  } catch (err) {
    console.error('Error loading saved jobs:', err);
    container.innerHTML = `
      <p class="text-red-600 text-center mt-4">Error loading saved jobs. Please refresh the page.</p>
    `;
  }
}

// Attach remove button click listeners
function attachRemoveListeners() {
  const container = document.getElementById("dashboardSavedJobsContainer");
  if (!container) return;

  // Remove old listeners by cloning the container
  const newContainer = container.cloneNode(true);
  container.parentNode.replaceChild(newContainer, container);

  // Add new listener
  newContainer.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("btn-remove-job")) return;

      const jobId = e.target.getAttribute("data-id");
      const currentToken = getToken();

    if (!currentToken) {
      alert('Please login to remove saved jobs.');
      return;
    }

    try {
      const deleteResponse = await fetch("http://localhost:5000/api/saved-jobs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ jobId }),
      });

      const deleteData = await deleteResponse.json();

      if (deleteResponse.ok && deleteData.success) {
        // Remove the card with animation
        const card = e.target.closest('.saved-job-card');
        if (card) {
          card.style.opacity = '0';
          card.style.transform = 'translateY(-10px)';
          setTimeout(() => {
            card.remove();
            // Reload if empty
            const updatedContainer = document.getElementById("dashboardSavedJobsContainer");
            if (updatedContainer && updatedContainer.children.length === 0) {
              updatedContainer.innerHTML = `
                <p class="text-gray-500 text-center mt-4">No saved jobs found.</p>
              `;
            }
          }, 300);
        }
      } else {
        alert('Failed to remove job. Please try again.');
      }
    } catch (err) {
      console.error('Error removing saved job:', err);
      alert('Network error. Please try again.');
    }
  });
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  loadDashboardSavedJobs();

  // Also load when saved jobs view becomes visible (using MutationObserver)
  const savedJobsView = document.getElementById("view-saved-jobs");
  if (savedJobsView) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isVisible = !savedJobsView.classList.contains('hidden');
          if (isVisible) {
            // View became visible, refresh saved jobs
            loadDashboardSavedJobs();
          }
        }
      });
    });

    observer.observe(savedJobsView, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  // Also listen for hash changes (in case navigation uses hash)
  window.addEventListener('hashchange', () => {
    const container = document.getElementById("dashboardSavedJobsContainer");
    if (container && container.closest('#view-saved-jobs') && !container.closest('#view-saved-jobs').classList.contains('hidden')) {
      loadDashboardSavedJobs();
    }
  });
});

// Export function for manual refresh
if (typeof window !== 'undefined') {
  window.refreshDashboardSavedJobs = loadDashboardSavedJobs;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

