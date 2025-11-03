// Zentrales Script zum Setzen des Hintergrunds
// Wird auf allen Seiten geladen

(function() {
    'use strict';
    
    // CSS-Style-Element erstellen oder finden
    let styleElement = document.getElementById('dynamic-background-style');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'dynamic-background-style';
        document.head.appendChild(styleElement);
    }
    
    // Hintergrund asynchron laden und setzen
    window.setBackground = async function setBackground() {
        try {
            const res = await fetch('/api/links');
            if (!res.ok) return;
            const data = await res.json();
            
            const background = data.background || {
                type: 'gradient',
                value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            };
            
            let backgroundStyle = '';
            
            if (background.type === 'gradient') {
                backgroundStyle = background.value || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            } else if (background.type === 'color') {
                let colorValue = background.value || '#667eea';
                // Wenn es ein RGB-Wert ohne rgb() ist, füge rgb() hinzu
                if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                    colorValue = `rgb(${colorValue})`;
                }
                backgroundStyle = colorValue;
            } else if (background.type === 'image') {
                if (background.image && background.image.trim()) {
                    const bgImageUrl = background.image.trim();
                    const position = background.position || 'cover';
                    
                    // Fallback-Farbe für bessere Lesbarkeit
                    const fallbackColor = background.fallbackColor || '#667eea';
                    
                    if (position === 'cover') {
                        backgroundStyle = `${fallbackColor} url("${bgImageUrl}") center/cover no-repeat`;
                    } else if (position === 'contain') {
                        backgroundStyle = `${fallbackColor} url("${bgImageUrl}") center/contain no-repeat`;
                    } else if (position === 'repeat') {
                        backgroundStyle = `${fallbackColor} url("${bgImageUrl}") repeat`;
                    } else {
                        backgroundStyle = `${fallbackColor} url("${bgImageUrl}") ${position}`;
                    }
                } else {
                    // Kein Bild vorhanden, verwende Fallback
                    backgroundStyle = background.fallbackColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }
            }
            
            if (backgroundStyle) {
                // Verwende CSS mit !important, um alle anderen CSS-Regeln zu überschreiben
                styleElement.textContent = `
                    body {
                        background: ${backgroundStyle} !important;
                        background-attachment: fixed !important;
                    }
                    .admin-container {
                        background: ${backgroundStyle} !important;
                        background-attachment: fixed !important;
                    }
                    html {
                        background: ${backgroundStyle} !important;
                        background-attachment: fixed !important;
                    }
                `;
            }
        } catch (e) {
            console.warn('Konnte Hintergrund nicht laden:', e);
        }
    };
    
    // Sofort ausführen
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setBackground);
    } else {
        setBackground();
    }
    
    // Mehrfach versuchen, falls asynchrones Laden zu langsam ist
    setTimeout(setBackground, 100);
    setTimeout(setBackground, 500);
})();

