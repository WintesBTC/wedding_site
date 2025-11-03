// Konfiguration wird vom Server geladen
const linkConfig = { profile: {}, links: [] };

// DOM-Elemente
let profileName, profileBio, profileImg, linkButtons;

// Initialisierung
document.addEventListener('DOMContentLoaded', async function() {
    initializeElements();
    await fetchLinks();
    updateProfile();
    updateLinks();
    addEventListeners();
});

async function fetchLinks() {
    try {
        const res = await fetch('/api/links');
        if (!res.ok) return;
        const data = await res.json();
        linkConfig.profile = data.profile || {};
        linkConfig.links = (data.links || []).filter(l => l.visible !== false);
        
        // Titel setzen (nur für index-Seite, falls page-titles.js nicht geladen wurde)
        // page-titles.js sollte den Titel bereits gesetzt haben
        if (data.pageTitles && data.pageTitles.index) {
            document.title = data.pageTitles.index;
        } else if (data.siteTitle) {
            document.title = data.siteTitle;
        }
    } catch (e) {
        console.warn('Konnte Links nicht laden, verwende Fallback.');
    }
}

function initializeElements() {
    profileName = document.getElementById('profile-name');
    profileBio = document.getElementById('profile-bio');
    profileImg = document.getElementById('profile-img');
    linkButtons = document.querySelectorAll('.link-button');
}

function updateProfile() {
    if (profileName) profileName.textContent = linkConfig.profile.name;
    if (profileBio) profileBio.textContent = linkConfig.profile.bio;
    if (profileImg) profileImg.src = linkConfig.profile.image;
}

function updateLinks() {
    linkButtons.forEach((button, index) => {
        const link = linkConfig.links[index];
        if (!link) {
            button.style.display = 'none';
            return;
        }
        button.style.display = '';
        button.href = link.url;
        const titleElement = button.querySelector('.link-title');
        const subtitleElement = button.querySelector('.link-subtitle');
        if (titleElement) titleElement.textContent = link.title;
        if (subtitleElement) subtitleElement.textContent = link.subtitle;
        const iconElement = button.querySelector('.link-icon i');
        if (iconElement) iconElement.className = link.icon;
        const iconContainer = button.querySelector('.link-icon');
        if (iconContainer) iconContainer.style.background = link.color;
    });
}

function addEventListeners() {
    // Klick-Tracking für Analytics (optional)
    linkButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            const link = linkConfig.links[index];
            if (link) {
                console.log(`Link geklickt: ${link.title} -> ${link.url}`);
                
                // Hier können Sie Analytics-Code hinzufügen
                // z.B. Google Analytics, Facebook Pixel, etc.
                
                // Beispiel für Google Analytics:
                // gtag('event', 'click', {
                //     'event_category': 'link',
                //     'event_label': link.title,
                //     'value': index + 1
                // });
            }
        });
    });
    
    // Smooth Scrolling für bessere UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility-Funktionen
function updateLinkConfig(newConfig) {
    Object.assign(linkConfig, newConfig);
    updateProfile();
    updateLinks();
}

function addNewLink(linkData) {
    if (linkConfig.links.length < 5) {
        linkConfig.links.push(linkData);
        updateLinks();
    } else {
        console.warn('Maximum von 5 Links erreicht');
    }
}

function removeLink(index) {
    if (index >= 0 && index < linkConfig.links.length) {
        linkConfig.links.splice(index, 1);
        updateLinks();
    }
}

// Responsive Design Helper
function handleResize() {
    const container = document.querySelector('.container');
    if (window.innerWidth < 480) {
        container.classList.add('mobile');
    } else {
        container.classList.remove('mobile');
    }
}

window.addEventListener('resize', handleResize);
handleResize(); // Initial call

// Performance Optimierung
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced resize handler
const debouncedResize = debounce(handleResize, 250);
window.addEventListener('resize', debouncedResize);

// Export für externe Nutzung
window.LinkTree = {
    updateConfig: updateLinkConfig,
    addLink: addNewLink,
    removeLink: removeLink,
    config: linkConfig
};

