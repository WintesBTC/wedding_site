// Admin Panel JavaScript

let allRSVPs = [];
let filteredRSVPs = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    loadRSVPData();
    setupEventListeners();
});

function initializeAdmin() {
    // Admin Panel initialisieren
    console.log('Admin Panel geladen');
    loadSiteSettings();
    loadLinksEditor();
    loadWishlistAdmin();
    loadGalleryAdmin();
}

async function loadRSVPData() {
    try {
        showLoading();
        
        const response = await fetch('/api/rsvp/all');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Rückmeldung-Daten');
        }
        
        const data = await response.json();
        allRSVPs = data.rsvps || [];
        filteredRSVPs = [...allRSVPs];
        
        updateStats(data.stats);
        renderRSVPList();
        
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        showError('Fehler beim Laden der Rückmeldung-Daten');
    } finally {
        hideLoading();
    }
}

function setupEventListeners() {
    // Refresh Button
    document.getElementById('refresh-btn').addEventListener('click', loadRSVPData);
    
    // Filter
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);
    
    // Export Button
    document.getElementById('export-btn').addEventListener('click', exportToCSV);

    // Seiteneinstellungen Buttons
    document.getElementById('save-site-settings').addEventListener('click', saveSiteSettings);
    
    // Profilbild Upload
    const profileImageUpload = document.getElementById('profile-image-upload');
    if (profileImageUpload) {
        profileImageUpload.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    await uploadProfileImage(file);
                } catch (error) {
                    console.error('Upload Fehler:', error);
                }
            }
        });
    }
    
    // Profilbild URL Vorschau
    const profileImageInput = document.getElementById('profile-image');
    if (profileImageInput) {
        profileImageInput.addEventListener('input', function(e) {
            updateProfileImagePreview(e.target.value);
        });
    }
    
    // Hintergrund-Type Änderung
    const backgroundTypeSelect = document.getElementById('background-type');
    if (backgroundTypeSelect) {
        backgroundTypeSelect.addEventListener('change', function(e) {
            updateBackgroundOptions(e.target.value);
        });
    }
    
    // Hintergrundbild Upload
    const backgroundImageUpload = document.getElementById('background-image-upload');
    if (backgroundImageUpload) {
        backgroundImageUpload.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    await uploadBackgroundImage(file);
                } catch (error) {
                    console.error('Upload Fehler:', error);
                }
            }
        });
    }
    
    // Hintergrundbild URL Vorschau
    const backgroundImageInput = document.getElementById('background-image');
    if (backgroundImageInput) {
        backgroundImageInput.addEventListener('input', function(e) {
            updateBackgroundImagePreview(e.target.value);
        });
    }
    
    // Links Buttons
    document.getElementById('save-links').addEventListener('click', saveLinks);
    document.getElementById('reload-links').addEventListener('click', loadLinksEditor);
    
    // Wishlist Buttons
    document.getElementById('add-wishlist-item').addEventListener('click', addWishlistItem);
    
    // Modal
    const modal = document.getElementById('rsvp-modal');
    const modalClose = document.querySelector('.modal-close');
    
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // ESC zum Schließen
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Seiteneinstellungen
async function loadSiteSettings() {
    try {
        const res = await fetch('/api/links');
        if (!res.ok) throw new Error('Fehler beim Laden der Einstellungen');
        const data = await res.json();
        
        // Allgemeiner Titel setzen
        const siteTitleInput = document.getElementById('site-title');
        if (siteTitleInput) {
            siteTitleInput.value = data.siteTitle || 'Meine Links';
        }
        
        // Seitentitel für alle Seiten setzen
        const pageTitles = data.pageTitles || {};
        const pageTitleFields = ['index', 'rsvp', 'gallery', 'playlist', 'location', 'program', 'wishlist', 'admin'];
        pageTitleFields.forEach(pageName => {
            const input = document.getElementById(`page-title-${pageName}`);
            if (input) {
                input.value = pageTitles[pageName] || '';
            }
        });
        
        // Profil-Daten setzen
        const profileNameInput = document.getElementById('profile-name');
        if (profileNameInput && data.profile) {
            profileNameInput.value = data.profile.name || '';
        }
        
        const profileBioInput = document.getElementById('profile-bio');
        if (profileBioInput && data.profile) {
            profileBioInput.value = data.profile.bio || '';
        }
        
        const profileImageInput = document.getElementById('profile-image');
        if (profileImageInput && data.profile) {
            profileImageInput.value = data.profile.image || '';
            // Vorschau anzeigen
            updateProfileImagePreview(data.profile.image);
        }
        
        // Hintergrund-Einstellungen laden
        loadBackgroundSettings(data.background || {});
    } catch (e) {
        console.error('Fehler beim Laden der Seiteneinstellungen:', e);
    }
}

function loadBackgroundSettings(background) {
    const bgType = background.type || 'gradient';
    const bgTypeSelect = document.getElementById('background-type');
    if (bgTypeSelect) {
        bgTypeSelect.value = bgType;
        updateBackgroundOptions(bgType);
        
        // Werte setzen
        if (bgType === 'gradient') {
            const gradientInput = document.getElementById('background-gradient');
            if (gradientInput) {
                gradientInput.value = background.value || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
        } else if (bgType === 'color') {
            const colorInput = document.getElementById('background-color');
            if (colorInput) {
                colorInput.value = background.value || '#667eea';
            }
        } else if (bgType === 'image') {
            const imageInput = document.getElementById('background-image');
            const positionSelect = document.getElementById('background-position');
            if (imageInput) {
                imageInput.value = background.image || '';
                updateBackgroundImagePreview(background.image);
            }
            if (positionSelect && background.position) {
                positionSelect.value = background.position;
            }
        }
    }
}

function updateBackgroundOptions(type) {
    const gradientOpt = document.getElementById('background-gradient-option');
    const colorOpt = document.getElementById('background-color-option');
    const imageOpt = document.getElementById('background-image-option');
    
    if (gradientOpt) gradientOpt.style.display = type === 'gradient' ? 'block' : 'none';
    if (colorOpt) colorOpt.style.display = type === 'color' ? 'block' : 'none';
    if (imageOpt) imageOpt.style.display = type === 'image' ? 'block' : 'none';
}

function updateBackgroundImagePreview(imageUrl) {
    const previewDiv = document.getElementById('background-image-preview');
    const previewImg = document.getElementById('background-preview-img');
    if (previewDiv && previewImg && imageUrl) {
        previewImg.src = imageUrl;
        previewDiv.style.display = 'block';
    } else if (previewDiv) {
        previewDiv.style.display = 'none';
    }
}

async function uploadBackgroundImage(file) {
    try {
        const formData = new FormData();
        formData.append('photo', file);
        
        const statusSpan = document.getElementById('background-image-status');
        statusSpan.textContent = 'Wird hochgeladen...';
        statusSpan.style.color = '#64748b';
        
        const response = await fetch('/api/profile/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Hochladen');
        }
        
        const result = await response.json();
        const imageInput = document.getElementById('background-image');
        if (imageInput) {
            imageInput.value = result.url;
            updateBackgroundImagePreview(result.url);
        }
        
        statusSpan.textContent = '✓ Hochgeladen';
        statusSpan.style.color = '#10b981';
        
        setTimeout(() => {
            statusSpan.textContent = '';
        }, 3000);
        
        return result.url;
    } catch (e) {
        const statusSpan = document.getElementById('background-image-status');
        statusSpan.textContent = '✗ Fehler: ' + e.message;
        statusSpan.style.color = '#ef4444';
        throw e;
    }
}

function updateProfileImagePreview(imageUrl) {
    const previewDiv = document.getElementById('profile-image-preview');
    const previewImg = document.getElementById('profile-preview-img');
    if (previewDiv && previewImg && imageUrl) {
        previewImg.src = imageUrl;
        previewDiv.style.display = 'block';
    } else if (previewDiv) {
        previewDiv.style.display = 'none';
    }
}

async function uploadProfileImage(file) {
    try {
        const formData = new FormData();
        formData.append('photo', file);
        
        const statusSpan = document.getElementById('profile-image-status');
        statusSpan.textContent = 'Wird hochgeladen...';
        statusSpan.style.color = '#64748b';
        
        const response = await fetch('/api/profile/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Hochladen');
        }
        
        const result = await response.json();
        const imageInput = document.getElementById('profile-image');
        if (imageInput) {
            imageInput.value = result.url;
            updateProfileImagePreview(result.url);
        }
        
        statusSpan.textContent = '✓ Hochgeladen';
        statusSpan.style.color = '#10b981';
        
        setTimeout(() => {
            statusSpan.textContent = '';
        }, 3000);
        
        return result.url;
    } catch (e) {
        const statusSpan = document.getElementById('profile-image-status');
        statusSpan.textContent = '✗ Fehler: ' + e.message;
        statusSpan.style.color = '#ef4444';
        throw e;
    }
}

async function saveSiteSettings() {
    try {
        const res = await fetch('/api/links');
        const data = await res.json();
        
        // Allgemeiner Titel
        const siteTitleInput = document.getElementById('site-title');
        const newTitle = siteTitleInput ? siteTitleInput.value.trim() : '';
        
        // Seitentitel für alle Seiten sammeln
        const pageTitles = {};
        const pageTitleFields = ['index', 'rsvp', 'gallery', 'playlist', 'location', 'program', 'wishlist', 'admin'];
        pageTitleFields.forEach(pageName => {
            const input = document.getElementById(`page-title-${pageName}`);
            if (input && input.value.trim()) {
                pageTitles[pageName] = input.value.trim();
            }
        });
        
        // Hintergrund-Einstellungen sammeln
        const backgroundTypeSelect = document.getElementById('background-type');
        const background = {
            type: backgroundTypeSelect ? backgroundTypeSelect.value : 'gradient',
            value: '',
            image: '',
            position: 'cover'
        };
        
        if (background.type === 'gradient') {
            const gradientInput = document.getElementById('background-gradient');
            if (gradientInput) {
                background.value = gradientInput.value.trim() || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
        } else if (background.type === 'color') {
            const colorInput = document.getElementById('background-color');
            if (colorInput) {
                background.value = colorInput.value.trim() || '#667eea';
            }
        } else if (background.type === 'image') {
            const imageInput = document.getElementById('background-image');
            const positionSelect = document.getElementById('background-position');
            if (imageInput) {
                background.image = imageInput.value.trim();
            }
            if (positionSelect) {
                background.position = positionSelect.value || 'cover';
            }
        }
        
        // Profil-Daten
        const profileNameInput = document.getElementById('profile-name');
        const profileBioInput = document.getElementById('profile-bio');
        const profileImageInput = document.getElementById('profile-image');
        
        const updatedData = {
            ...data,
            siteTitle: newTitle || 'Meine Links',
            pageTitles: pageTitles,
            background: background,
            profile: {
                ...(data.profile || {}),
                name: profileNameInput ? profileNameInput.value.trim() : (data.profile?.name || ''),
                bio: profileBioInput ? profileBioInput.value.trim() : (data.profile?.bio || ''),
                image: profileImageInput ? profileImageInput.value.trim() : (data.profile?.image || '')
            }
        };
        
        const saveRes = await fetch('/api/links', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        
        if (!saveRes.ok) throw new Error('Fehler beim Speichern');
        
        // Hintergrund sofort aktualisieren, wenn background.js geladen ist
        if (typeof window.setBackground === 'function') {
            window.setBackground();
        } else {
            // Falls background.js noch nicht geladen, lade es nach
            setTimeout(() => {
                if (typeof window.setBackground === 'function') {
                    window.setBackground();
                } else {
                    // Versuche background.js neu zu laden
                    const script = document.createElement('script');
                    script.src = '/background.js';
                    script.onload = () => {
                        if (window.setBackground) window.setBackground();
                    };
                    document.head.appendChild(script);
                }
            }, 100);
        }
        
        alert('Einstellungen gespeichert!');
    } catch (e) {
        alert('Fehler: ' + e.message);
    }
}

// Links Verwaltung
async function loadLinksEditor() {
    try {
        const res = await fetch('/api/links');
        if (!res.ok) throw new Error('Fehler beim Laden der Links');
        const data = await res.json();
        renderLinksEditor(data);
    } catch (e) {
        document.getElementById('links-editor').innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Fehler beim Laden der Links</h3></div>';
    }
}

function renderLinksEditor(data) {
    const container = document.getElementById('links-editor');
    const links = data.links || [];
    container.innerHTML = links.map((l, i) => `
        <div class="rsvp-item" style="cursor: default;">
            <div class="rsvp-info">
                <div class="rsvp-name">Link ${i+1}: <input data-idx="${i}" data-field="title" value="${l.title}" style="margin-left:8px; padding:6px 8px; width: 60%;"></div>
                <div class="rsvp-details" style="gap:8px; flex-wrap: wrap;">
                    <input data-idx="${i}" data-field="subtitle" value="${l.subtitle||''}" placeholder="Untertitel" style="padding:6px 8px; min-width:220px;">
                    <input data-idx="${i}" data-field="url" value="${l.url}" placeholder="URL" style="padding:6px 8px; min-width:260px;">
                    <input data-idx="${i}" data-field="icon" value="${l.icon}" placeholder="Icon (FontAwesome Klasse)" style="padding:6px 8px; min-width:220px;">
                    <input data-idx="${i}" data-field="color" value="${l.color}" placeholder="Farbe (CSS Gradient)" style="padding:6px 8px; min-width:260px;">
                </div>
            </div>
            <div class="rsvp-status ${l.visible === false ? 'not-attending' : 'attending'}" style="align-self:flex-start;">
                <label style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" data-idx="${i}" data-field="visible" ${l.visible === false ? '' : 'checked'}>
                    Sichtbar
                </label>
            </div>
        </div>
    `).join('');
}

async function saveLinks() {
    try {
        const res = await fetch('/api/links');
        const data = await res.json();
        const links = data.links || [];
        // read edited values
        document.querySelectorAll('#links-editor [data-field]').forEach(input => {
            const idx = parseInt(input.getAttribute('data-idx'));
            const field = input.getAttribute('data-field');
            if (!Number.isNaN(idx) && links[idx]) {
                if (field === 'visible') {
                    links[idx][field] = input.checked;
                } else {
                    links[idx][field] = input.value;
                }
            }
        });
        const saveRes = await fetch('/api/links', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, links })
        });
        if (!saveRes.ok) throw new Error('Fehler beim Speichern');
        loadLinksEditor();
        alert('Links gespeichert');
    } catch (e) {
        alert('Fehler: ' + e.message);
    }
}

// Wishlist Administration
async function loadWishlistAdmin() {
    try {
        const res = await fetch('/api/wishlist/all');
        if (!res.ok) throw new Error('Fehler beim Laden der Wunschliste');
        const data = await res.json();
        const list = document.getElementById('wishlist-admin-list');
        const items = data.items || [];
        
        if (items.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-gift"></i><h3>Keine Items</h3><p>Klicken Sie auf "Neues Item hinzufügen" um zu beginnen.</p></div>';
            return;
        }
        
        list.innerHTML = items.map(item => `
            <div class="rsvp-item" style="gap:12px; align-items: flex-start;">
                <div class="rsvp-info" style="flex: 1;">
                    <div class="rsvp-name" style="display: flex; align-items: center; gap: 8px;">
                        ${item.visible !== false ? '<i class="fas fa-eye" style="color: #10b981;"></i>' : '<i class="fas fa-eye-slash" style="color: #ef4444;"></i>'}
                        <input type="text" data-id="${item.id}" data-field="title" value="${escapeHtml(item.title)}" style="flex: 1; padding: 6px 8px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 15px; font-weight: 600;">
                    </div>
                    <div class="rsvp-details" style="margin-top: 8px; flex-direction: column; gap: 8px;">
                        <textarea data-id="${item.id}" data-field="description" placeholder="Beschreibung" style="width: 100%; padding: 6px 8px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; min-height: 50px; resize: vertical;">${escapeHtml(item.description || '')}</textarea>
                        <input type="text" data-id="${item.id}" data-field="link" value="${escapeHtml(item.link || '')}" placeholder="Link (z.B. Amazon URL)" style="width: 100%; padding: 6px 8px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div style="margin-top: 8px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                            <input type="checkbox" data-id="${item.id}" data-field="purchased" ${item.purchased ? 'checked' : ''} onchange="updateWishlistItem('${item.id}', 'purchased', this.checked)">
                            Bereits besorgt
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
                            <input type="checkbox" data-id="${item.id}" data-field="visible" ${item.visible !== false ? 'checked' : ''} onchange="updateWishlistItem('${item.id}', 'visible', this.checked)">
                            Sichtbar für Gäste
                        </label>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="btn btn-primary" onclick="saveWishlistItem('${item.id}')" style="white-space: nowrap;">
                        <i class="fas fa-save"></i> Speichern
                    </button>
                    <button class="btn btn-secondary" onclick="deleteWishlistItem('${item.id}')" style="white-space: nowrap;">
                        <i class="fas fa-trash"></i> Löschen
                    </button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        document.getElementById('wishlist-admin-list').innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Fehler beim Laden</h3></div>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function saveWishlistItem(id) {
    try {
        const inputs = document.querySelectorAll(`[data-id="${id}"]`);
        const updates = {};
        
        inputs.forEach(input => {
            const field = input.getAttribute('data-field');
            if (field === 'purchased' || field === 'visible') {
                updates[field] = input.checked;
            } else {
                updates[field] = input.value;
            }
        });
        
        const res = await fetch(`/api/wishlist/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        
        if (!res.ok) throw new Error('Fehler beim Speichern');
        
        loadWishlistAdmin();
        alert('Item gespeichert!');
    } catch (e) {
        alert('Fehler: ' + e.message);
    }
}

async function updateWishlistItem(id, field, value) {
    try {
        const res = await fetch(`/api/wishlist/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value })
        });
        
        if (!res.ok) throw new Error('Fehler beim Aktualisieren');
        
        loadWishlistAdmin();
    } catch (e) {
        console.error('Fehler beim Aktualisieren:', e);
        alert('Fehler beim Aktualisieren');
    }
}

async function deleteWishlistItem(id) {
    if (!confirm('Item wirklich löschen?')) return;
    
    try {
        const res = await fetch(`/api/wishlist/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Fehler beim Löschen');
        
        loadWishlistAdmin();
    } catch (e) {
        alert('Fehler: ' + e.message);
    }
}

async function addWishlistItem() {
    const title = prompt('Titel des neuen Items:');
    if (!title) return;
    
    try {
        const res = await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                description: '',
                link: '',
                purchased: false,
                visible: true
            })
        });
        
        if (!res.ok) throw new Error('Fehler beim Hinzufügen');
        
        loadWishlistAdmin();
        alert('Item hinzugefügt!');
    } catch (e) {
        alert('Fehler: ' + e.message);
    }
}

// Galerie Administration (Löschen)
async function loadGalleryAdmin() {
    try {
        const res = await fetch('/api/gallery');
        if (!res.ok) throw new Error('Fehler beim Laden der Galerie');
        const data = await res.json();
        const list = document.getElementById('gallery-admin-list');
        const photos = data.photos || [];
        if (photos.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><h3>Keine Fotos</h3></div>';
            return;
        }
        list.innerHTML = photos.map(p => `
            <div class="rsvp-item" style="gap:12px;">
                <img src="${p.url}" alt="${p.originalName||''}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;">
                <div class="rsvp-info">
                    <div class="rsvp-name">${p.originalName || 'Foto'}</div>
                    <div class="rsvp-details"><span>${p.uploader||''}</span><span>${formatDateTime(p.uploadedAt)}</span></div>
                </div>
                <button class="btn btn-secondary" onclick="deletePhoto('${p.id}')"><i class="fas fa-trash"></i> Löschen</button>
            </div>
        `).join('');
    } catch (e) {
        document.getElementById('gallery-admin-list').innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Fehler beim Laden</h3></div>';
    }
}

async function deletePhoto(id) {
    if (!confirm('Foto wirklich löschen?')) return;
    const res = await fetch('/api/gallery/' + id, { method: 'DELETE' });
    if (res.ok) {
        loadGalleryAdmin();
    } else {
        alert('Löschen fehlgeschlagen');
    }
}

function updateStats(stats) {
    document.getElementById('total-rsvps').textContent = stats.total;
    document.getElementById('attending-count').textContent = stats.attending;
    document.getElementById('not-attending-count').textContent = stats.notAttending;
    document.getElementById('total-guests').textContent = stats.totalGuests;
}

function applyFilters() {
    const statusFilter = document.getElementById('status-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    filteredRSVPs = allRSVPs.filter(rsvp => {
        const matchesStatus = statusFilter === 'all' || rsvp.attendance === statusFilter;
        const matchesSearch = !searchTerm || 
            rsvp.name.toLowerCase().includes(searchTerm) ||
            rsvp.email.toLowerCase().includes(searchTerm);
        
        return matchesStatus && matchesSearch;
    });
    
    renderRSVPList();
}

function renderRSVPList() {
    const rsvpList = document.getElementById('rsvp-list');
    
    if (filteredRSVPs.length === 0) {
        rsvpList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Keine Rückmeldungen gefunden</h3>
                <p>Es wurden keine Rückmeldungen gefunden, die den Filterkriterien entsprechen.</p>
            </div>
        `;
        return;
    }
    
    rsvpList.innerHTML = filteredRSVPs.map(rsvp => `
        <div class="rsvp-item" onclick="showRSVPDetails('${rsvp.id}')">
            <div class="rsvp-info">
                <div class="rsvp-name">${rsvp.name}</div>
                <div class="rsvp-details">
                    <span>${rsvp.email}</span>
                    <span>${rsvp.guests} Person${rsvp.guests > 1 ? 'en' : ''}</span>
                    <span class="rsvp-date">${formatDate(rsvp.submittedAt)}</span>
                </div>
            </div>
            <div class="rsvp-status ${rsvp.attendance === 'yes' ? 'attending' : 'not-attending'}">
                <i class="fas ${rsvp.attendance === 'yes' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                ${rsvp.attendance === 'yes' ? 'Zusage' : 'Absage'}
            </div>
        </div>
    `).join('');
}

function showRSVPDetails(rsvpId) {
    const rsvp = allRSVPs.find(r => r.id === rsvpId);
    if (!rsvp) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="detail-group">
            <div class="detail-label">Name</div>
            <div class="detail-value">${rsvp.name}</div>
        </div>
        
        <div class="detail-group">
            <div class="detail-label">E-Mail</div>
            <div class="detail-value">${rsvp.email}</div>
        </div>
        
        ${rsvp.phone ? `
        <div class="detail-group">
            <div class="detail-label">Telefon</div>
            <div class="detail-value">${rsvp.phone}</div>
        </div>
        ` : ''}
        
        <div class="detail-group">
            <div class="detail-label">Anzahl Personen</div>
            <div class="detail-value">${rsvp.guests} Person${rsvp.guests > 1 ? 'en' : ''}</div>
        </div>
        
        <div class="detail-group">
            <div class="detail-label">Status</div>
            <div class="detail-value">
                <span class="rsvp-status ${rsvp.attendance === 'yes' ? 'attending' : 'not-attending'}">
                    <i class="fas ${rsvp.attendance === 'yes' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${rsvp.attendance === 'yes' ? 'Zusage' : 'Absage'}
                </span>
            </div>
        </div>
        
        ${rsvp.dietary ? `
        <div class="detail-group">
            <div class="detail-label">Allergien & Diätwünsche</div>
            <div class="detail-value dietary">${rsvp.dietary}</div>
        </div>
        ` : ''}
        
        ${rsvp.message ? `
        <div class="detail-group">
            <div class="detail-label">Nachricht</div>
            <div class="detail-value message">${rsvp.message}</div>
        </div>
        ` : ''}
        
        <div class="detail-group">
            <div class="detail-label">Eingereicht am</div>
            <div class="detail-value">${formatDateTime(rsvp.submittedAt)}</div>
        </div>
    `;
    
    document.getElementById('rsvp-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('rsvp-modal').classList.remove('show');
}

function exportToCSV() {
    const csvContent = generateCSV(filteredRSVPs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `rsvp-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function generateCSV(rsvps) {
    const headers = [
        'Name',
        'E-Mail',
        'Telefon',
        'Anzahl Personen',
        'Status',
        'Allergien/Diätwünsche',
        'Nachricht',
        'Eingereicht am'
    ];
    
    const rows = rsvps.map(rsvp => [
        rsvp.name,
        rsvp.email,
        rsvp.phone || '',
        rsvp.guests,
        rsvp.attendance === 'yes' ? 'Zusage' : 'Absage',
        rsvp.dietary || '',
        rsvp.message || '',
        formatDateTime(rsvp.submittedAt)
    ]);
    
    return [headers, ...rows].map(row => 
        row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading() {
    const rsvpList = document.getElementById('rsvp-list');
    rsvpList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

function hideLoading() {
    // Loading wird automatisch durch renderRSVPList() ersetzt
}

function showError(message) {
    const rsvpList = document.getElementById('rsvp-list');
    rsvpList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Fehler</h3>
            <p>${message}</p>
        </div>
    `;
}

// Auto-refresh alle 30 Sekunden
setInterval(loadRSVPData, 30000);
