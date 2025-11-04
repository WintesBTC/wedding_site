# Font-Konfiguration

## Wie ändere ich die Schriftart für die gesamte Website?

Die Schriftart kann an **zwei Stellen** geändert werden:

### 1. CSS-Variable (Hauptkonfiguration)
**Datei:** `variables.css`

```css
:root {
    --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

Ändern Sie hier `'Inter'` zu Ihrer gewünschten Schriftart.

**Beispiele:**
- `'Roboto'` → Roboto Font
- `'Open Sans'` → Open Sans Font
- `'Montserrat'` → Montserrat Font
- `'Poppins'` → Poppins Font
- `'Playfair Display'` → Playfair Display Font

### 2. Google Fonts URL (in allen HTML-Dateien)
**Dateien:** `index.html`, `pricing.html`, `rsvp.html`, `playlist.html`, `location.html`, `gallery.html`, `admin.html`

In jeder HTML-Datei finden Sie diese Zeile:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

**Ändern Sie:**
- `family=Inter` zu `family=Roboto` (oder Ihrer gewünschten Font)
- Falls Sie mehrere Fonts verwenden: `family=Roboto:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700`

**Beispiel für Roboto:**
```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 3. System Fonts (ohne Google Fonts)
Falls Sie keine Google Fonts verwenden möchten, können Sie einfach die Google Fonts Zeile in den HTML-Dateien entfernen und nur die System-Fonts in `variables.css` verwenden:

```css
--font-family-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

## Schnell-Anleitung

1. Öffnen Sie `variables.css`
2. Ändern Sie `'Inter'` zu Ihrer gewünschten Font
3. Öffnen Sie alle HTML-Dateien (index.html, pricing.html, rsvp.html, etc.)
4. Ändern Sie in jeder Datei `family=Inter` zu `family=IhreFont`
5. Fertig! Die gesamte Website verwendet jetzt die neue Schriftart.

## Verfügbare Google Fonts

Besuchen Sie [Google Fonts](https://fonts.google.com/) um eine passende Schriftart zu finden.

