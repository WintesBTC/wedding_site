// Wishlist JavaScript Funktionalität

document.addEventListener('DOMContentLoaded', function() {
    loadWishlistItems();
});

async function loadWishlistItems() {
    try {
        const response = await fetch('/api/wishlist');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Wunschliste');
        }
        
        const data = await response.json();
        const items = (data.items || []).filter(item => item.visible !== false); // Nur sichtbare Items
        
        renderWishlistItems(items);
        
    } catch (error) {
        console.error('Fehler beim Laden der Wunschliste:', error);
        showError('Fehler beim Laden der Wunschliste');
    }
}

function renderWishlistItems(items) {
    const container = document.getElementById('wishlist-items');
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-gift"></i>
                <h3>Noch keine Wünsche</h3>
                <p>Die Wunschliste wird bald aktualisiert.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="wishlist-item ${item.purchased ? 'purchased' : ''}">
            <div class="item-checkbox">
                <input type="checkbox" disabled ${item.purchased ? 'checked' : ''}>
            </div>
            <div class="item-content">
                <div class="item-header">
                    <h3 class="item-title">${escapeHtml(item.title)}</h3>
                    <span class="item-status ${item.purchased ? 'purchased' : 'available'}">
                        <i class="fas ${item.purchased ? 'fa-check-circle' : 'fa-circle'}"></i>
                        ${item.purchased ? 'Bereits besorgt' : 'Gewünscht'}
                    </span>
                </div>
                ${item.description ? `<p class="item-description">${escapeHtml(item.description)}</p>` : ''}
                ${item.link ? `
                    <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="item-link">
                        <i class="fas fa-external-link-alt"></i>
                        Zum Produkt
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function showError(message) {
    const container = document.getElementById('wishlist-items');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Fehler</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

