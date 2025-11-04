// Pricing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Pricing page loaded');
    
    // Optional: Add any interactive features here
    // For example, smooth scroll animations, form handling, etc.
    
    // Ensure contact button works correctly
    const contactButton = document.querySelector('.contact-button');
    if (contactButton) {
        contactButton.addEventListener('click', function(e) {
            console.log('Contact button clicked');
            // The mailto link will naturally open the email client
        });
    }
});


