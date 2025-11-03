// Zentrales Script zum Setzen der Seitentitel
// Wird auf allen Seiten geladen, bevor DOMContentLoaded

(function() {
    'use strict';
    
    // Seitennamen basierend auf dem Pfad identifizieren
    function getCurrentPageName() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'index';
        if (path.includes('/rsvp')) return 'rsvp';
        if (path.includes('/gallery')) return 'gallery';
        if (path.includes('/playlist')) return 'playlist';
        if (path.includes('/location')) return 'location';
        if (path.includes('/admin')) return 'admin';
        return 'index'; // Fallback
    }
    
    // Titel asynchron laden und setzen
    async function setPageTitle() {
        try {
            const res = await fetch('/api/links');
            if (!res.ok) return;
            const data = await res.json();
            
            const pageName = getCurrentPageName();
            const pageTitles = data.pageTitles || {};
            
            // Wenn spezifischer Seitentitel vorhanden, verwende diesen
            if (pageTitles[pageName]) {
                document.title = pageTitles[pageName];
            } else if (data.siteTitle) {
                // Fallback auf allgemeinen Seitentitel
                document.title = data.siteTitle;
            }
        } catch (e) {
            console.warn('Konnte Seitentitel nicht laden:', e);
        }
    }
    
    // Sofort ausführen (synchrones Laden wenn möglich)
    // Wenn die API noch nicht verfügbar ist, warte kurz
    if (document.readyState === 'loading') {
        // Seite lädt noch, warte auf DOMContentLoaded
        document.addEventListener('DOMContentLoaded', setPageTitle);
    } else {
        // Seite ist schon geladen, setze sofort
        setPageTitle();
    }
    
    // Falls asynchrones Laden zu langsam ist, setze auch nach kurzer Verzögerung
    setTimeout(setPageTitle, 100);
})();

