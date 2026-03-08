document.addEventListener('DOMContentLoaded', () => {
    // Password Toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const eyeOpen = document.querySelector('.eye-open');
    const eyeClosed = document.querySelector('.eye-closed');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icons
            if (type === 'password') {
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            } else {
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            }
        });
    }

    // Form Submission
    const form = document.getElementById('signupForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Add loading state to button
            const btn = form.querySelector('.submit-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Creating Account...';
            btn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                // Redirect to dashboard
                window.location.href = 'index.html';
            }, 1500);
        });
    }
});
