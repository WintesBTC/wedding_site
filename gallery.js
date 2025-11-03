// Gallery JavaScript Funktionalität

let allPhotos = [];
let filteredPhotos = [];
let selectedFiles = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeGallery();
    loadPhotos();
    setupEventListeners();
});

function initializeGallery() {
    console.log('Gallery initialisiert');
}

async function loadPhotos() {
    try {
        const response = await fetch('/api/gallery');
        if (response.ok) {
            const data = await response.json();
            allPhotos = data.photos || [];
            filteredPhotos = [...allPhotos];
            updateStats();
            updateUploaderFilter();
            renderPhotos();
        }
    } catch (error) {
        console.error('Fehler beim Laden der Fotos:', error);
        showError('Fehler beim Laden der Galerie');
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // File Input
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
        console.log('File input listener added');
    }
    
    // Drag & Drop
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        uploadArea.addEventListener('click', () => document.getElementById('file-input').click());
        console.log('Upload area listeners added');
    }
    
    // Upload Form
    const uploadForm = document.getElementById('upload-form');
    const cancelBtn = document.getElementById('cancel-upload');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
        console.log('Upload form listener added');
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelUpload);
        console.log('Cancel button listener added');
    }
    
    // Filter
    const filterUploader = document.getElementById('filter-uploader');
    const searchPhotos = document.getElementById('search-photos');
    const sortPhotos = document.getElementById('sort-photos');
    
    if (filterUploader) {
        filterUploader.addEventListener('change', applyFilters);
        console.log('Filter uploader listener added');
    }
    if (searchPhotos) {
        searchPhotos.addEventListener('input', applyFilters);
        console.log('Search photos listener added');
    }
    if (sortPhotos) {
        sortPhotos.addEventListener('change', applyFilters);
        console.log('Sort photos listener added');
    }
    
    // Modal
    const modal = document.getElementById('photo-modal');
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

function handleFileSelect(e) {
    console.log('File input changed');
    const files = Array.from(e.target.files);
    console.log('Selected files:', files);
    addFiles(files);
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    console.log('Files dropped');
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    console.log('Dropped files:', files);
    addFiles(files);
}

function addFiles(files) {
    console.log('addFiles called with:', files.length, 'files');
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    console.log('Image files:', imageFiles.length);
    
    if (imageFiles.length === 0) {
        showNotification('Bitte wählen Sie nur Bilddateien aus.', 'warning');
        return;
    }
    
    selectedFiles = [...selectedFiles, ...imageFiles];
    console.log('Total selected files:', selectedFiles.length);
    showSelectedFiles();
    showUploadForm();
}

function showSelectedFiles() {
    const container = document.getElementById('selected-files');
    if (!container) {
        console.error('selected-files container not found');
        return;
    }
    
    if (selectedFiles.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-preview">
            <img src="${URL.createObjectURL(file)}" alt="Vorschau">
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button type="button" class="remove-file" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // Event listener für remove buttons hinzufügen
    container.querySelectorAll('.remove-file').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            removeFile(index);
        });
    });
}

function removeFile(index) {
    console.log('removeFile called with index:', index);
    selectedFiles.splice(index, 1);
    console.log('Remaining files:', selectedFiles.length);
    showSelectedFiles();
    
    if (selectedFiles.length === 0) {
        hideUploadForm();
    }
}

function showUploadForm() {
    console.log('showUploadForm called');
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.style.display = 'block';
        console.log('Upload form shown');
    } else {
        console.error('upload-form not found');
    }
}

function hideUploadForm() {
    console.log('hideUploadForm called');
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.style.display = 'none';
        console.log('Upload form hidden');
    } else {
        console.error('upload-form not found');
    }
}

function cancelUpload() {
    console.log('cancelUpload called');
    selectedFiles = [];
    const fileInput = document.getElementById('file-input');
    const uploadForm = document.getElementById('upload-form');
    
    if (fileInput) {
        fileInput.value = '';
    }
    if (uploadForm) {
        uploadForm.reset();
    }
    hideUploadForm();
}

async function handleUpload(e) {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
        showNotification('Bitte wählen Sie mindestens ein Foto aus.', 'warning');
        return;
    }
    
    const uploader = document.getElementById('uploader-name').value;
    const description = document.getElementById('photo-description').value;
    
    if (!uploader) {
        showNotification('Bitte geben Sie Ihren Namen ein.', 'warning');
        return;
    }
    
    const submitBtn = document.querySelector('.submit-upload-btn');
    const originalText = submitBtn.innerHTML;
    
    // Button deaktivieren
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wird hochgeladen...';
    
    try {
        // FormData für File-Upload erstellen
        const formData = new FormData();
        
        // Dateien hinzufügen
        selectedFiles.forEach((file, index) => {
            formData.append('photos', file);
        });
        
        // Metadaten hinzufügen
        formData.append('uploader', uploader);
        formData.append('description', description);
        
        console.log('Uploading files:', selectedFiles.length);
        
        const response = await fetch('/api/gallery/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Hochladen der Fotos');
        }
        
        const result = await response.json();
        
        // Erfolg
        showNotification(result.message, 'success');
        cancelUpload();
        
        // Galerie neu laden
        await loadPhotos();
        
    } catch (error) {
        console.error('Upload Error:', error);
        showNotification('Fehler beim Hochladen: ' + error.message, 'error');
    } finally {
        // Button zurücksetzen
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function applyFilters() {
    const uploaderFilter = document.getElementById('filter-uploader').value;
    const searchTerm = document.getElementById('search-photos').value.toLowerCase();
    const sortBy = document.getElementById('sort-photos').value;
    
    filteredPhotos = allPhotos.filter(photo => {
        const matchesUploader = !uploaderFilter || photo.uploader === uploaderFilter;
        const matchesSearch = !searchTerm || 
            (photo.description && photo.description.toLowerCase().includes(searchTerm));
        
        return matchesUploader && matchesSearch;
    });
    
    // Sortieren
    filteredPhotos.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.uploadedAt) - new Date(a.uploadedAt);
            case 'oldest':
                return new Date(a.uploadedAt) - new Date(b.uploadedAt);
            case 'uploader':
                return a.uploader.localeCompare(b.uploader);
            default:
                return 0;
        }
    });
    
    renderPhotos();
}

function renderPhotos() {
    const photosGrid = document.getElementById('photos-grid');
    
    if (filteredPhotos.length === 0) {
        photosGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>Keine Fotos gefunden</h3>
                <p>Es wurden keine Fotos gefunden, die den Filterkriterien entsprechen.</p>
            </div>
        `;
        return;
    }
    
    photosGrid.innerHTML = filteredPhotos.map(photo => `
        <div class="photo-item" onclick="showPhotoModal('${photo.id}')">
            <img src="${photo.url}" alt="${photo.description || 'Hochzeitsfoto'}">
            <div class="photo-overlay">
                <div class="photo-uploader">${photo.uploader}</div>
                ${photo.description ? `<div class="photo-description">${photo.description}</div>` : ''}
                <div class="photo-date">${formatDate(photo.uploadedAt)}</div>
            </div>
        </div>
    `).join('');
}

function showPhotoModal(photoId) {
    const photo = allPhotos.find(p => p.id === photoId);
    if (!photo) return;
    
    document.getElementById('modal-image').src = photo.url;
    document.getElementById('modal-uploader').textContent = photo.uploader;
    document.getElementById('modal-date').textContent = formatDate(photo.uploadedAt);
    document.getElementById('modal-description').textContent = photo.description || 'Keine Beschreibung';
    
    document.getElementById('photo-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('photo-modal').classList.remove('show');
}

function updateStats() {
    const totalPhotos = allPhotos.length;
    const uniqueContributors = new Set(allPhotos.map(photo => photo.uploader)).size;
    
    document.getElementById('total-photos').textContent = `${totalPhotos} Foto${totalPhotos !== 1 ? 's' : ''}`;
    document.getElementById('total-contributors').textContent = `${uniqueContributors} Beitrag${uniqueContributors !== 1 ? 'e' : ''}`;
}

function updateUploaderFilter() {
    const uniqueUploaders = [...new Set(allPhotos.map(photo => photo.uploader))].sort();
    const filterSelect = document.getElementById('filter-uploader');
    
    // Bestehende Optionen (außer "Alle Uploader") entfernen
    const existingOptions = filterSelect.querySelectorAll('option:not([value=""])');
    existingOptions.forEach(option => option.remove());
    
    // Neue Optionen hinzufügen
    uniqueUploaders.forEach(uploader => {
        const option = document.createElement('option');
        option.value = uploader;
        option.textContent = uploader;
        filterSelect.appendChild(option);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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
    const photosGrid = document.getElementById('photos-grid');
    photosGrid.innerHTML = `
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
    
    .remove-file {
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s ease;
    }
    
    .remove-file:hover {
        background: #dc2626;
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);

