// Playlist JavaScript Funktionalität

let allSongs = [];
let filteredSongs = [];

document.addEventListener('DOMContentLoaded', function() {
    initializePlaylist();
    loadSongs();
    setupEventListeners();
});

function initializePlaylist() {
    console.log('Playlist initialisiert');
}

async function loadSongs() {
    try {
        const response = await fetch('/api/playlist');
        if (response.ok) {
            const data = await response.json();
            allSongs = data.songs || [];
            filteredSongs = [...allSongs];
            updateStats();
            renderSongs();
        }
    } catch (error) {
        console.error('Fehler beim Laden der Songs:', error);
        showError('Fehler beim Laden der Playlist');
    }
}

function setupEventListeners() {
    // Form Submit
    document.getElementById('add-song-form').addEventListener('submit', handleSongSubmit);
    
    // Filter
    document.getElementById('filter-genre').addEventListener('change', applyFilters);
    document.getElementById('filter-mood').addEventListener('change', applyFilters);
    document.getElementById('search-songs').addEventListener('input', applyFilters);
}

async function handleSongSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const songData = Object.fromEntries(formData.entries());
    
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // Button deaktivieren
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wird hinzugefügt...';
    
    try {
        const response = await fetch('/api/playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...songData,
                submittedAt: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Hinzufügen des Songs');
        }
        
        const result = await response.json();
        
        // Erfolg
        showNotification('Song erfolgreich hinzugefügt!', 'success');
        form.reset();
        
        // DEMO MODUS: Füge Song temporär zur Anzeige hinzu
        // (Er wird nicht in der Datenbank gespeichert und verschwindet nach Reload)
        if (result && result.stats) {
            const newSong = {
                id: Date.now().toString(),
                ...songData,
                submittedAt: new Date().toISOString()
            };
            allSongs.push(newSong);
            filteredSongs = [...allSongs];
            updateStats();
            renderSongs();
        } else {
            // Fallback: Playlist neu laden
            await loadSongs();
        }
        
    } catch (error) {
        console.error('Song Submit Error:', error);
        showNotification('Fehler beim Hinzufügen des Songs: ' + error.message, 'error');
    } finally {
        // Button zurücksetzen
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function applyFilters() {
    const genreFilter = document.getElementById('filter-genre').value;
    const moodFilter = document.getElementById('filter-mood').value;
    const searchTerm = document.getElementById('search-songs').value.toLowerCase();
    
    filteredSongs = allSongs.filter(song => {
        const matchesGenre = !genreFilter || song.genre === genreFilter;
        const matchesMood = !moodFilter || song.mood === moodFilter;
        const matchesSearch = !searchTerm || 
            song.title.toLowerCase().includes(searchTerm) ||
            song.artist.toLowerCase().includes(searchTerm);
        
        return matchesGenre && matchesMood && matchesSearch;
    });
    
    renderSongs();
}

function renderSongs() {
    const songsList = document.getElementById('songs-list');
    
    if (filteredSongs.length === 0) {
        songsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-music"></i>
                <h3>Keine Songs gefunden</h3>
                <p>Es wurden keine Songs gefunden, die den Filterkriterien entsprechen.</p>
            </div>
        `;
        return;
    }
    
    songsList.innerHTML = filteredSongs.map(song => `
        <div class="song-item">
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
                <div class="song-meta">
                    ${song.genre ? `<span class="genre">${song.genre}</span>` : ''}
                    ${song.mood ? `<span class="mood">${song.mood}</span>` : ''}
                </div>
                ${song.reason ? `<div class="song-reason">"${song.reason}"</div>` : ''}
            </div>
            <div class="song-contributor">
                von <strong>${song.submitter}</strong>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const totalSongs = allSongs.length;
    const uniqueContributors = new Set(allSongs.map(song => song.submitter)).size;
    
    document.getElementById('total-songs').textContent = `${totalSongs} Song${totalSongs !== 1 ? 's' : ''}`;
    document.getElementById('total-contributors').textContent = `${uniqueContributors} Beitrag${uniqueContributors !== 1 ? 'e' : ''}`;
}

function showNotification(message, type = 'info') {
    // Bestehende Notifications entfernen
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Neue Notification erstellen
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Styles hinzufügen
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Nach 3 Sekunden entfernen
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        case 'error': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        case 'warning': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        default: return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    }
}

function showError(message) {
    const songsList = document.getElementById('songs-list');
    songsList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Fehler</h3>
            <p>${message}</p>
        </div>
    `;
}

// CSS für Animationen hinzufügen
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
`;
document.head.appendChild(style);

