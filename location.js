// Location Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Optional: Add any interactive features here
    console.log('Location page loaded');
    
    // Ensure the route button opens correctly on mobile
    const routeButton = document.querySelector('.route-button');
    if (routeButton) {
        routeButton.addEventListener('click', function(e) {
            // The link will naturally open Google Maps on mobile devices
            console.log('Route planen clicked');
        });
    }
});

