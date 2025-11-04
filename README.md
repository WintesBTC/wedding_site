# Linktree Clone - Ihre persönliche Link-Sammlung

Eine moderne, responsive Website im Stil von Linktree mit 5 anpassbaren Links.

## 🚀 Features

- **Moderne UI**: Schönes, responsives Design mit Gradienten und Animationen
- **5 Links**: Platz für bis zu 5 wichtige Links
- **Anpassbar**: Einfache Konfiguration über JavaScript
- **Responsive**: Funktioniert auf Desktop, Tablet und Smartphone
- **Schnell**: Optimiert für Performance
- **SEO-freundlich**: Meta-Tags und strukturierte Daten

## 📁 Dateien

```
wedding_site/
├── index.html          # Haupt-HTML-Datei
├── style.css           # CSS-Styling
├── script.js           # JavaScript-Funktionalität
├── server.js           # Node.js/Express Server
├── package.json        # Node.js Abhängigkeiten
└── README.md           # Diese Anleitung
```

## 🛠️ Installation & Setup

### Option 1: Mit Node.js (Empfohlen)

1. **Node.js installieren** (falls noch nicht vorhanden):
   - Besuchen Sie [nodejs.org](https://nodejs.org/)
   - Laden Sie die LTS-Version herunter und installieren Sie sie

2. **Abhängigkeiten installieren**:
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**:
   - Kopieren Sie `.env.example` zu `.env`: `cp .env.example .env` (Linux/Mac) oder `copy .env.example .env` (Windows)
   - Öffnen Sie `.env` und passen Sie die Werte an:
     ```
     ADMIN_USER=ihr_admin_benutzername
     ADMIN_PASS=ihr_sicheres_passwort
     PORT=3000
     ```
   - **WICHTIG**: Verwenden Sie niemals die Standard-Werte in Produktion!

5. **Server starten**:
   ```bash
   npm start
   ```

6. **Website öffnen**:
   - Öffnen Sie Ihren Browser
   - Gehen Sie zu `http://localhost:3000`
   - Admin-Panel: `http://localhost:3000/admin` (mit den Zugangsdaten aus .env)

### Option 2: Einfach HTML-Datei öffnen

1. Öffnen Sie `index.html` direkt in Ihrem Browser
2. **Hinweis**: Einige Features funktionieren möglicherweise nicht ohne Server

## ⚙️ Konfiguration

### Umgebungsvariablen (.env)

Die `.env` Datei enthält sensible Konfigurationswerte:

- **ADMIN_USER**: Benutzername für das Admin-Panel
- **ADMIN_PASS**: Passwort für das Admin-Panel
- **PORT**: Server-Port (Standard: 3000)

**Sicherheitshinweise:**
- Die `.env` Datei ist bereits in `.gitignore` und wird nicht in Git committet
- Verwenden Sie niemals schwache Passwörter
- Teilen Sie die `.env` Datei niemals öffentlich
- Für Produktion: Verwenden Sie starke, eindeutige Passwörter

### Ihre Links anpassen

Öffnen Sie `script.js` und bearbeiten Sie das `linkConfig` Objekt:

```javascript
const linkConfig = {
    profile: {
        name: "Ihr Name",                    // Ihr Name
        bio: "Kurze Beschreibung über Sie",  // Ihre Beschreibung
        image: "https://ihr-bild-url.jpg"    // Ihr Profilbild
    },
    links: [
        {
            title: "Instagram",
            subtitle: "Folgen Sie mir auf Instagram",
            url: "https://instagram.com/ihr_username",  // Ihr Instagram-Link
            icon: "fab fa-instagram"
        },
        // ... weitere Links
    ]
};
```

### Verfügbare Icons

Verwenden Sie Font Awesome Icons:
- `fab fa-instagram` - Instagram
- `fab fa-youtube` - YouTube
- `fab fa-twitter` - Twitter
- `fab fa-facebook` - Facebook
- `fab fa-tiktok` - TikTok
- `fas fa-envelope` - E-Mail
- `fas fa-globe` - Website
- `fab fa-github` - GitHub
- `fab fa-linkedin` - LinkedIn

### Farben anpassen

Bearbeiten Sie die CSS-Datei `style.css`:

```css
/* Hauptfarben ändern */
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Link-Farben ändern */
.link-button:nth-child(1) .link-icon {
    background: linear-gradient(135deg, #e1306c 0%, #fd1d1d 100%);
}
```

## 🌐 Deployment

### Lokaler Server
- Der Server läuft standardmäßig auf Port 3000
- Ändern Sie den Port in `server.js` falls nötig

### Online Hosting

**Option 1: Netlify (Kostenlos)**
1. Erstellen Sie ein Konto auf [netlify.com](https://netlify.com)
2. Ziehen Sie den Ordner in den Netlify-Bereich
3. Ihre Website ist live!

**Option 2: Vercel (Kostenlos)**
1. Erstellen Sie ein Konto auf [vercel.com](https://vercel.com)
2. Verbinden Sie Ihr GitHub-Repository
3. Deploy automatisch

**Option 3: GitHub Pages**
1. Laden Sie den Code auf GitHub hoch
2. Aktivieren Sie GitHub Pages in den Repository-Einstellungen

## 📱 Anpassungen

### Neues Design
- Bearbeiten Sie `style.css` für das Aussehen
- Ändern Sie Farben, Schriftarten, Abstände

### Mehr Funktionalität
- Erweitern Sie `script.js` für neue Features
- Fügen Sie Analytics hinzu (Google Analytics, etc.)

### Backend-Features
- Erweitern Sie `server.js` für API-Endpunkte
- Fügen Sie eine Datenbank hinzu
- Implementieren Sie Benutzer-Authentifizierung

## 🔧 Entwicklung

### Entwicklungsserver mit Auto-Reload
```bash
npm run dev
```

### Produktions-Build
```bash
npm start
```

## 📊 Analytics hinzufügen

Fügen Sie in `index.html` vor dem schließenden `</head>` Tag hinzu:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🎨 Design-Anpassungen

### Farben ändern
Bearbeiten Sie die CSS-Variablen in `style.css`:

```css
:root {
    --primary-color: #4f46e5;
    --secondary-color: #7c3aed;
    --text-color: #334155;
    --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Schriftarten ändern
```css
body {
    font-family: 'Ihre-Schriftart', sans-serif;
}
```

## 🐛 Fehlerbehebung

### Server startet nicht
- Überprüfen Sie, ob Node.js installiert ist: `node --version`
- Installieren Sie Abhängigkeiten: `npm install`

### Links funktionieren nicht
- Überprüfen Sie die URLs in `script.js`
- Stellen Sie sicher, dass die URLs vollständig sind (mit `https://`)

### Styling-Probleme
- Überprüfen Sie, ob `style.css` geladen wird
- Öffnen Sie die Browser-Entwicklertools (F12) für Fehlermeldungen

## 📞 Support

Bei Problemen oder Fragen:
1. Überprüfen Sie diese README
2. Schauen Sie in die Browser-Konsole für Fehlermeldungen
3. Stellen Sie sicher, dass alle Dateien vorhanden sind

## 📄 Lizenz

MIT License - Sie können diesen Code frei verwenden und anpassen.

---

**Viel Erfolg mit Ihrer Linktree-Website! 🎉**

