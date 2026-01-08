// Umgebungsvariablen aus .env Datei laden
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Datenbank-Dateien
const RSVP_DB_FILE = 'rsvp-data.json';
const PLAYLIST_DB_FILE = 'playlist-data.json';
const GALLERY_DB_FILE = 'gallery-data.json';
const UPLOADS_DIR = 'uploads';
const ADMIN_UPLOADS_DIR = 'admin_uploads';
const GUEST_UPLOADS_DIR = 'guest_uploads';
const LINKS_DB_FILE = 'links-data.json';
const WISHLIST_DB_FILE = 'wishlist-data.json';

// Simple Basic Auth for admin routes
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS;

function adminAuth(req, res, next) {
    try {
        const hdr = req.headers['authorization'] || '';
        if (!hdr.startsWith('Basic ')) return unauthorized(res);
        const decoded = Buffer.from(hdr.split(' ')[1], 'base64').toString('utf8');
        const [user, pass] = decoded.split(':');
        if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
        return unauthorized(res);
    } catch {
        return unauthorized(res);
    }
}

function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Unauthorized');
}

// Multer Konfiguration für Gäste-Uploads (temporäre Namen, werden später umbenannt)
const guestStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, GUEST_UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        // Temporärer eindeutiger Name, wird später umbenannt
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'temp_' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Multer Konfiguration für Admin-Uploads (behält Original-Dateinamen)
const adminStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, ADMIN_UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        // Behält Original-Dateinamen bei (vom Explorer/Dateisystem)
        const originalName = file.originalname;
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        
        // Ersetze ungültige Zeichen für Dateisystem (behält aber so viel wie möglich vom Original)
        const sanitizedName = baseName.replace(/[<>:"|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_');
        
        // Versuche den Original-Namen zu verwenden, falls die Datei nicht existiert
        const fullPath = path.join(ADMIN_UPLOADS_DIR, `${sanitizedName}${ext}`);
        
        if (fs.existsSync(fullPath)) {
            // Falls Datei existiert, füge Zeitstempel hinzu
            const timestamp = Date.now();
            cb(null, `${sanitizedName}_${timestamp}${ext}`);
        } else {
            // Verwende Original-Dateinamen (sanitized)
            cb(null, `${sanitizedName}${ext}`);
        }
    }
});

// Gemeinsame Filter-Funktion
const imageFilter = function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Nur Bilddateien sind erlaubt!'), false);
    }
};

// Upload-Middleware für Gäste
const guestUpload = multer({ 
    storage: guestStorage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: imageFilter
});

// Upload-Middleware für Admin
const adminUpload = multer({ 
    storage: adminStorage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: imageFilter
});

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Rückmeldung-Datenbank initialisieren
function initRSVPDatabase() {
    if (!fs.existsSync(RSVP_DB_FILE)) {
        fs.writeFileSync(RSVP_DB_FILE, JSON.stringify({
            rsvps: [],
            stats: {
                total: 0,
                attending: 0,
                notAttending: 0,
                totalGuests: 0
            }
        }, null, 2));
    }
}

// Rückmeldung-Daten laden
function loadRSVPData() {
    try {
        const data = fs.readFileSync(RSVP_DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Fehler beim Laden der Rückmeldung-Daten:', error);
        return { rsvps: [], stats: { total: 0, attending: 0, notAttending: 0, totalGuests: 0 } };
    }
}

// Rückmeldung-Daten speichern
function saveRSVPData(data) {
    try {
        fs.writeFileSync(RSVP_DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern der Rückmeldung-Daten:', error);
        return false;
    }
}

// Statistiken aktualisieren
function updateStats(rsvpData) {
    const stats = {
        total: rsvpData.rsvps.length,
        attending: rsvpData.rsvps.filter(r => r.attendance === 'yes').length,
        notAttending: rsvpData.rsvps.filter(r => r.attendance === 'no').length,
        totalGuests: rsvpData.rsvps.reduce((sum, r) => sum + parseInt(r.guests || 0), 0)
    };
    rsvpData.stats = stats;
    return rsvpData;
}

// Datenbanken initialisieren
initRSVPDatabase();
initPlaylistDatabase();
initGalleryDatabase();
initLinksDatabase();
initWishlistDatabase();

// Hauptroute - serviert die index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Route für Link-Konfiguration (optional)
// Links API
function initLinksDatabase() {
    if (!fs.existsSync(LINKS_DB_FILE)) {
        const fallback = fs.existsSync(path.join(__dirname, 'links-data.json'))
            ? JSON.parse(fs.readFileSync(path.join(__dirname, 'links-data.json'), 'utf8'))
            : { profile: {}, links: [] };
        fs.writeFileSync(LINKS_DB_FILE, JSON.stringify(fallback, null, 2));
    }
}

function loadLinksData() {
    try {
        const data = fs.readFileSync(LINKS_DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return { profile: {}, links: [] };
    }
}

function saveLinksData(data) {
    try {
        fs.writeFileSync(LINKS_DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        return false;
    }
}

app.get('/api/links', (req, res) => {
    res.json(loadLinksData());
});

app.put('/api/links', adminAuth, (req, res) => {
    const current = loadLinksData();
    const updated = { ...current, ...req.body };
    if (saveLinksData(updated)) return res.json(updated);
    res.status(500).json({ error: 'Fehler beim Speichern der Links' });
});

app.patch('/api/links/:index', adminAuth, (req, res) => {
    const data = loadLinksData();
    const idx = parseInt(req.params.index, 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= data.links.length) {
        return res.status(400).json({ error: 'Ungültiger Index' });
    }
    data.links[idx] = { ...data.links[idx], ...req.body };
    if (saveLinksData(data)) return res.json(data.links[idx]);
    res.status(500).json({ error: 'Fehler beim Speichern' });
});

// Rückmeldung Route
app.get('/rsvp', (req, res) => {
    res.sendFile(path.join(__dirname, 'rsvp.html'));
});

// Admin Route
app.get('/admin', adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Playlist Route
app.get('/playlist', (req, res) => {
    res.sendFile(path.join(__dirname, 'playlist.html'));
});

// Gallery Route
app.get('/gallery', (req, res) => {
    res.sendFile(path.join(__dirname, 'gallery.html'));
});

// Location Route
app.get('/location', (req, res) => {
    res.sendFile(path.join(__dirname, 'location.html'));
});

// Programm Route
app.get('/program', (req, res) => {
    res.sendFile(path.join(__dirname, 'program.html'));
});

// Wishlist Route
app.get('/wishlist', (req, res) => {
    res.sendFile(path.join(__dirname, 'wishlist.html'));
});

// Pricing Route
app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, 'pricing.html'));
});

// Rückmeldung API - Neue Rückmeldung speichern - DEMO MODUS: Simuliert Erfolg, speichert aber nichts
app.post('/api/rsvp', (req, res) => {
    try {
        const rsvpData = loadRSVPData();
        const newRSVP = {
            id: Date.now().toString(),
            ...req.body,
            submittedAt: new Date().toISOString()
        };
        
        // DEMO MODUS: Simuliere Statistiken ohne tatsächliche Speicherung
        const currentStats = updateStats(rsvpData);
        const demoStats = {
            total: currentStats.stats.total + 1,
            attending: newRSVP.attendance === 'yes' ? currentStats.stats.attending + 1 : currentStats.stats.attending,
            notAttending: newRSVP.attendance === 'no' ? currentStats.stats.notAttending + 1 : currentStats.stats.notAttending,
            totalGuests: currentStats.stats.totalGuests + parseInt(newRSVP.guests || 0)
        };
        
        console.log(`[DEMO] Rückmeldung von ${newRSVP.name} simuliert (nicht gespeichert): ${newRSVP.attendance === 'yes' ? 'Zusage' : 'Absage'}`);
        res.json({ 
            status: 'success', 
            message: 'Rückmeldung erfolgreich gespeichert',
            stats: demoStats
        });
    } catch (error) {
        console.error('Rückmeldung Fehler:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Fehler beim Speichern der Rückmeldung' 
        });
    }
});

// Rückmeldung Statistiken abrufen
app.get('/api/rsvp/stats', (req, res) => {
    try {
        const rsvpData = loadRSVPData();
        res.json(rsvpData.stats);
    } catch (error) {
        console.error('Stats Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
    }
});

// Alle Rückmeldungen abrufen (Admin)
app.get('/api/rsvp/all', adminAuth, (req, res) => {
    try {
        const rsvpData = loadRSVPData();
        res.json(rsvpData);
    } catch (error) {
        console.error('Rückmeldung Daten Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Rückmeldung-Daten' });
    }
});

// Playlist API

function initPlaylistDatabase() {
    if (!fs.existsSync(PLAYLIST_DB_FILE)) {
        fs.writeFileSync(PLAYLIST_DB_FILE, JSON.stringify({
            songs: [],
            stats: {
                total: 0,
                contributors: 0
            }
        }, null, 2));
    }
}

function loadPlaylistData() {
    try {
        const data = fs.readFileSync(PLAYLIST_DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Fehler beim Laden der Playlist-Daten:', error);
        return { songs: [], stats: { total: 0, contributors: 0 } };
    }
}

function savePlaylistData(data) {
    try {
        fs.writeFileSync(PLAYLIST_DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern der Playlist-Daten:', error);
        return false;
    }
}

function updatePlaylistStats(playlistData) {
    const stats = {
        total: playlistData.songs.length,
        contributors: new Set(playlistData.songs.map(song => song.submitter)).size
    };
    playlistData.stats = stats;
    return playlistData;
}

// Playlist API Routes
app.get('/api/playlist', (req, res) => {
    try {
        const playlistData = loadPlaylistData();
        res.json(playlistData);
    } catch (error) {
        console.error('Playlist API Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Playlist' });
    }
});

app.post('/api/playlist', (req, res) => {
    try {
        const playlistData = loadPlaylistData();
        const newSong = {
            id: Date.now().toString(),
            ...req.body,
            submittedAt: new Date().toISOString()
        };
        
        // DEMO MODUS: Simuliere Statistiken ohne tatsächliche Speicherung
        const currentStats = updatePlaylistStats(playlistData);
        const demoStats = {
            total: currentStats.stats.total + 1,
            contributors: new Set([...playlistData.songs.map(s => s.submitter), newSong.submitter]).size
        };
        
        console.log(`[DEMO] Song von ${newSong.submitter} simuliert (nicht gespeichert): ${newSong.title} - ${newSong.artist}`);
        res.json({ 
            status: 'success', 
            message: 'Song erfolgreich hinzugefügt',
            stats: demoStats
        });
    } catch (error) {
        console.error('Playlist Submit Fehler:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Fehler beim Hinzufügen des Songs' 
        });
    }
});

// Gallery API

function initGalleryDatabase() {
    if (!fs.existsSync(GALLERY_DB_FILE)) {
        fs.writeFileSync(GALLERY_DB_FILE, JSON.stringify({
            photos: [],
            stats: {
                total: 0,
                contributors: 0
            }
        }, null, 2));
    }
    
    // Uploads-Verzeichnisse erstellen
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    if (!fs.existsSync(GUEST_UPLOADS_DIR)) {
        fs.mkdirSync(GUEST_UPLOADS_DIR, { recursive: true });
    }
    if (!fs.existsSync(ADMIN_UPLOADS_DIR)) {
        fs.mkdirSync(ADMIN_UPLOADS_DIR, { recursive: true });
    }
}

function loadGalleryData() {
    try {
        const data = fs.readFileSync(GALLERY_DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Fehler beim Laden der Gallery-Daten:', error);
        return { photos: [], stats: { total: 0, contributors: 0 } };
    }
}

function saveGalleryData(data) {
    try {
        fs.writeFileSync(GALLERY_DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern der Gallery-Daten:', error);
        return false;
    }
}

function updateGalleryStats(galleryData) {
    const stats = {
        total: galleryData.photos.length,
        contributors: new Set(galleryData.photos.map(photo => photo.uploader)).size
    };
    galleryData.stats = stats;
    return galleryData;
}

// Gallery API Routes
app.get('/api/gallery', (req, res) => {
    try {
        const galleryData = loadGalleryData();
        res.json(galleryData);
    } catch (error) {
        console.error('Gallery API Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Galerie' });
    }
});

// Gallery Upload (Gäste) - DEMO MODUS: Simuliert Erfolg, speichert aber nichts
app.post('/api/gallery/upload', guestUpload.array('photos', 10), (req, res) => {
    try {
        const galleryData = loadGalleryData();
        const { uploader, description } = req.body;
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Keine Dateien hochgeladen' 
            });
        }
        
        if (!uploader) {
            // Lösche temporäre Dateien
            files.forEach(file => {
                const tempPath = path.join(GUEST_UPLOADS_DIR, file.filename);
                if (fs.existsSync(tempPath)) {
                    try { fs.unlinkSync(tempPath); } catch {}
                }
            });
            return res.status(400).json({ 
                status: 'error', 
                message: 'Uploader-Name ist erforderlich' 
            });
        }
        
        // DEMO MODUS: Lösche temporäre Dateien sofort (keine Speicherung)
        files.forEach(file => {
            const tempPath = path.join(GUEST_UPLOADS_DIR, file.filename);
            if (fs.existsSync(tempPath)) {
                try { fs.unlinkSync(tempPath); } catch {}
            }
        });
        
        // DEMO MODUS: Simuliere erfolgreiche Uploads ohne tatsächliche Speicherung
        const uploadedPhotos = files.map((file, index) => {
            const ext = path.extname(file.originalname);
            const counter = String(index + 1).padStart(3, '0');
            
            // Verwende ein Demo-Bild aus den vorhandenen Uploads als Platzhalter
            const existingPhotos = galleryData.photos.filter(p => p.url && p.url.startsWith('/guest_uploads/'));
            let demoPhotoUrl;
            
            if (existingPhotos.length > 0) {
                // Verwende zufälliges vorhandenes Demo-Bild
                demoPhotoUrl = existingPhotos[Math.floor(Math.random() * existingPhotos.length)].url;
            } else {
                // Fallback: Versuche ein bekanntes Demo-Bild aus dem Verzeichnis
                const knownDemoFiles = [
                    '/guest_uploads/AS_as_001.jpg',
                    '/guest_uploads/Sarah_Müller_001.webp',
                    '/guest_uploads/Jenny_Schönstes_Brautpaar!!!_001.webp',
                    '/guest_uploads/Hermann_K._Beste_Hochzeit!!_001.jpg'
                ];
                // Prüfe welche Dateien tatsächlich existieren
                for (const demoFile of knownDemoFiles) {
                    const demoPath = path.join(__dirname, demoFile);
                    if (fs.existsSync(demoPath)) {
                        demoPhotoUrl = demoFile;
                        break;
                    }
                }
                // Letzter Fallback
                if (!demoPhotoUrl) {
                    demoPhotoUrl = knownDemoFiles[0];
                }
            }
            
            return {
                id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
                url: demoPhotoUrl, // Verwende vorhandenes Demo-Bild
                originalName: file.originalname,
                uploader: uploader,
                description: description || '',
                uploadedAt: new Date().toISOString()
            };
        });
        
        // DEMO MODUS: Füge Fotos temporär zur Anzeige hinzu, aber speichere nicht
        // Die Fotos werden nur im Frontend angezeigt, aber nicht in der Datenbank gespeichert
        const currentStats = updateGalleryStats(galleryData);
        const demoStats = {
            total: currentStats.stats.total + uploadedPhotos.length,
            contributors: new Set([...galleryData.photos.map(p => p.uploader), uploader]).size
        };
        
        console.log(`[DEMO] ${uploadedPhotos.length} Foto(s) von ${uploader} simuliert (nicht gespeichert)`);
        res.json({ 
            status: 'success', 
            message: `${uploadedPhotos.length} Foto(s) erfolgreich hochgeladen`,
            stats: demoStats,
            photos: uploadedPhotos
        });
    } catch (error) {
        console.error('Gallery Upload Fehler:', error);
        // Lösche temporäre Dateien bei Fehler
        if (req.files) {
            req.files.forEach(file => {
                const tempPath = path.join(GUEST_UPLOADS_DIR, file.filename);
                if (fs.existsSync(tempPath)) {
                    try { fs.unlinkSync(tempPath); } catch {}
                }
            });
        }
        res.status(500).json({ 
            status: 'error', 
            message: 'Fehler beim Hochladen der Fotos: ' + error.message
        });
    }
});

// Gallery Upload (Admin - behält Original-Dateinamen)
app.post('/api/gallery/upload/admin', adminAuth, adminUpload.array('photos', 10), (req, res) => {
    try {
        const galleryData = loadGalleryData();
        const { uploader, description } = req.body;
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Keine Dateien hochgeladen' 
            });
        }
        
        // Für jede hochgeladene Datei einen Eintrag erstellen
        const uploadedPhotos = files.map(file => ({
            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            url: `/admin_uploads/${file.filename}`,
            originalName: file.originalname,
            uploader: uploader || 'Admin',
            description: description || '',
            uploadedAt: new Date().toISOString()
        }));
        
        galleryData.photos.push(...uploadedPhotos);
        const updatedData = updateGalleryStats(galleryData);
        
        if (saveGalleryData(updatedData)) {
            console.log(`${uploadedPhotos.length} Foto(s) von Admin hochgeladen`);
            res.json({ 
                status: 'success', 
                message: `${uploadedPhotos.length} Foto(s) erfolgreich hochgeladen`,
                stats: updatedData.stats,
                photos: uploadedPhotos
            });
        } else {
            throw new Error('Fehler beim Speichern');
        }
    } catch (error) {
        console.error('Gallery Upload Fehler:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Fehler beim Hochladen der Fotos: ' + error.message
        });
    }
});

// Foto löschen (Admin)
app.delete('/api/gallery/:id', adminAuth, (req, res) => {
    try {
        const galleryData = loadGalleryData();
        const id = req.params.id;
        const index = galleryData.photos.findIndex(p => p.id === id);
        if (index === -1) return res.status(404).json({ error: 'Foto nicht gefunden' });
        const photo = galleryData.photos[index];
        // Datei vom Dateisystem entfernen, wenn lokal
        if (photo.url && (photo.url.startsWith('/uploads/') || photo.url.startsWith('/guest_uploads/') || photo.url.startsWith('/admin_uploads/'))) {
            const filePath = path.join(__dirname, photo.url);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch {}
            }
        }
        galleryData.photos.splice(index, 1);
        const updated = updateGalleryStats(galleryData);
        if (!saveGalleryData(updated)) throw new Error('Speichern fehlgeschlagen');
        res.json({ status: 'success' });
    } catch (e) {
        res.status(500).json({ error: 'Fehler beim Löschen des Fotos' });
    }
});

// Profilbild Upload (Admin)
app.post('/api/profile/upload', adminAuth, adminUpload.single('photo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Keine Datei hochgeladen' 
            });
        }
        
        const fileUrl = `/admin_uploads/${req.file.filename}`;
        res.json({ 
            status: 'success', 
            url: fileUrl,
            message: 'Profilbild erfolgreich hochgeladen' 
        });
    } catch (error) {
        console.error('Profilbild Upload Fehler:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Fehler beim Hochladen: ' + error.message
        });
    }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, UPLOADS_DIR)));
app.use('/guest_uploads', express.static(path.join(__dirname, GUEST_UPLOADS_DIR)));
app.use('/admin_uploads', express.static(path.join(__dirname, ADMIN_UPLOADS_DIR)));

// Wishlist API

function initWishlistDatabase() {
    if (!fs.existsSync(WISHLIST_DB_FILE)) {
        // Beispiel-Items
        const exampleItems = [
            {
                id: '1',
                title: 'Küchenmaschine',
                description: 'Eine moderne Küchenmaschine für unsere gemeinsame Küche',
                link: 'https://www.amazon.de/s?k=küchenmaschine',
                purchased: false,
                visible: true
            },
            {
                id: '2',
                title: 'Geschirrset für 12 Personen',
                description: 'Elegantes weißes Porzellan-Geschirrset',
                link: 'https://www.amazon.de/s?k=geschirrset+hochzeit',
                purchased: false,
                visible: true
            },
            {
                id: '3',
                title: 'Bettwäsche-Set',
                description: 'Hochwertige Baumwoll-Bettwäsche für unser neues Zuhause',
                link: '',
                purchased: true,
                visible: true
            },
            {
                id: '4',
                title: 'Kaffeemaschine',
                description: 'Siebtrapparat-Kaffeemaschine für den perfekten Start in den Tag',
                link: 'https://www.amazon.de/s?k=kaffeemaschine',
                purchased: false,
                visible: true
            },
            {
                id: '5',
                title: 'Besteck-Set',
                description: 'Edelstahl-Besteck für 12 Personen',
                link: '',
                purchased: false,
                visible: true
            },
            {
                id: '6',
                title: 'Wasserkocher',
                description: 'Elektrischer Wasserkocher mit Temperaturregelung',
                link: '',
                purchased: false,
                visible: true
            }
        ];
        
        fs.writeFileSync(WISHLIST_DB_FILE, JSON.stringify({
            items: exampleItems,
            stats: {
                total: exampleItems.length,
                purchased: exampleItems.filter(i => i.purchased).length,
                available: exampleItems.filter(i => !i.purchased && i.visible !== false).length
            }
        }, null, 2));
    }
}

function loadWishlistData() {
    try {
        const data = fs.readFileSync(WISHLIST_DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Fehler beim Laden der Wishlist-Daten:', error);
        return { items: [], stats: { total: 0, purchased: 0, available: 0 } };
    }
}

function saveWishlistData(data) {
    try {
        // Statistiken aktualisieren
        const stats = {
            total: data.items.length,
            purchased: data.items.filter(i => i.purchased).length,
            available: data.items.filter(i => !i.purchased && i.visible !== false).length
        };
        data.stats = stats;
        
        fs.writeFileSync(WISHLIST_DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern der Wishlist-Daten:', error);
        return false;
    }
}

// Wishlist API Routes
app.get('/api/wishlist', (req, res) => {
    try {
        const wishlistData = loadWishlistData();
        res.json(wishlistData);
    } catch (error) {
        console.error('Wishlist API Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Wunschliste' });
    }
});

// Alle Wishlist Items abrufen (Admin - inkl. unsichtbare)
app.get('/api/wishlist/all', adminAuth, (req, res) => {
    try {
        const wishlistData = loadWishlistData();
        res.json(wishlistData);
    } catch (error) {
        console.error('Wishlist Admin API Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Wunschliste' });
    }
});

// Neues Item hinzufügen (Admin)
app.post('/api/wishlist', adminAuth, (req, res) => {
    try {
        const wishlistData = loadWishlistData();
        const newItem = {
            id: Date.now().toString(),
            title: req.body.title || '',
            description: req.body.description || '',
            link: req.body.link || '',
            purchased: req.body.purchased === true,
            visible: req.body.visible !== false
        };
        
        wishlistData.items.push(newItem);
        
        if (saveWishlistData(wishlistData)) {
            res.json({ 
                status: 'success', 
                message: 'Item erfolgreich hinzugefügt',
                item: newItem
            });
        } else {
            throw new Error('Fehler beim Speichern');
        }
    } catch (error) {
        console.error('Wishlist Create Fehler:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Fehler beim Hinzufügen des Items' 
        });
    }
});

// Item aktualisieren (Admin)
app.put('/api/wishlist/:id', adminAuth, (req, res) => {
    try {
        const wishlistData = loadWishlistData();
        const id = req.params.id;
        const index = wishlistData.items.findIndex(item => item.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Item nicht gefunden' });
        }
        
        wishlistData.items[index] = {
            ...wishlistData.items[index],
            ...req.body,
            id: wishlistData.items[index].id // ID darf nicht geändert werden
        };
        
        if (saveWishlistData(wishlistData)) {
            res.json({ 
                status: 'success', 
                message: 'Item erfolgreich aktualisiert',
                item: wishlistData.items[index]
            });
        } else {
            throw new Error('Fehler beim Speichern');
        }
    } catch (error) {
        console.error('Wishlist Update Fehler:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Fehler beim Aktualisieren des Items' 
        });
    }
});

// Item löschen (Admin)
app.delete('/api/wishlist/:id', adminAuth, (req, res) => {
    try {
        const wishlistData = loadWishlistData();
        const id = req.params.id;
        const index = wishlistData.items.findIndex(item => item.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Item nicht gefunden' });
        }
        
        wishlistData.items.splice(index, 1);
        
        if (saveWishlistData(wishlistData)) {
            res.json({ status: 'success', message: 'Item erfolgreich gelöscht' });
        } else {
            throw new Error('Fehler beim Speichern');
        }
    } catch (error) {
        console.error('Wishlist Delete Fehler:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Fehler beim Löschen des Items' 
        });
    }
});

// Analytics Route (optional)
app.post('/api/analytics', (req, res) => {
    const { linkTitle, linkUrl, timestamp } = req.body;
    console.log(`Analytics: ${linkTitle} -> ${linkUrl} at ${timestamp}`);
    res.json({ status: 'success' });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Server starten
app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
    console.log(`📱 Öffnen Sie Ihren Browser und besuchen Sie die URL oben`);
    console.log(`💡 Drücken Sie Ctrl+C zum Beenden`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Server wird beendet...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Server wird beendet...');
    process.exit(0);
});

