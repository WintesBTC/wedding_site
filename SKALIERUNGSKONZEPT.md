# Multi-Tenant Skalierungskonzept für Wedding-Website-System

## 📋 Übersicht

Dieses Dokument beschreibt verschiedene Ansätze, um das Wedding-Website-System für mehrere Kunden zu skalieren, sodass jeder Kunde eine eigene Subdomain (z.B. `kunde1.meinedomain.com`, `kunde2.meinedomain.com`) erhält.

---

## 🎯 Anforderungen

- **Multi-Tenant-Architektur**: Jeder Kunde hat eine isolierte Instanz
- **Subdomain-basiert**: `{kunde}.meinedomain.com`
- **Automatisierbar**: Neue Kunden sollen möglichst automatisch angelegt werden
- **Skalierbar**: System soll mit wachsender Kundenanzahl mithalten
- **Datenisolation**: Jeder Kunde hat eigene Daten (JSON-Dateien, Uploads)
- **Wartbarkeit**: Einfache Verwaltung aller Kunden

---

## 🏗️ Architektur-Optionen

### **Option 1: Verzeichnis-basierte Multi-Tenancy (Einfachste Lösung)**

#### Konzept
Jeder Kunde erhält ein eigenes Verzeichnis mit allen Dateien und Daten.

```
wedding_site/
├── tenants/
│   ├── kunde1/
│   │   ├── index.html
│   │   ├── server.js (optional)
│   │   ├── rsvp-data.json
│   │   ├── playlist-data.json
│   │   ├── gallery-data.json
│   │   ├── links-data.json
│   │   ├── wishlist-data.json
│   │   ├── admin_uploads/
│   │   ├── guest_uploads/
│   │   └── uploads/
│   ├── kunde2/
│   │   └── ...
│   └── kunde3/
│       └── ...
├── shared/
│   ├── templates/          # HTML-Templates
│   ├── static/              # Gemeinsame CSS/JS
│   └── scripts/            # Deployment-Skripte
└── main-server.js          # Router für alle Tenants
```

#### Vorteile
- ✅ **Einfach zu implementieren**: Minimaler Code-Change
- ✅ **Vollständige Isolation**: Jeder Kunde ist komplett getrennt
- ✅ **Einfaches Backup**: Einfach Verzeichnis kopieren
- ✅ **Einfache Migration**: Kunde kann komplett exportiert werden
- ✅ **Keine Datenbank nötig**: Nutzt weiterhin JSON-Dateien
- ✅ **Einfaches Rollback**: Alte Versionen können gespeichert werden

#### Nachteile
- ❌ **Code-Duplikation**: Jeder Tenant hat eigene Dateien
- ❌ **Updates schwierig**: Änderungen müssen in alle Verzeichnisse kopiert werden
- ❌ **Speicher-Overhead**: Mehrfache Speicherung von statischen Dateien
- ❌ **Wartung aufwendig**: Updates müssen tenant-übergreifend durchgeführt werden

#### Automatisierung
- **Neue Kunden anlegen**: Skript kopiert Template-Verzeichnis
- **Updates deployen**: Skript aktualisiert alle Tenant-Verzeichnisse
- **Backup**: Skript sichert alle Tenant-Verzeichnisse

#### Skalierbarkeit
- ⚠️ **Mittelmäßig**: Funktioniert gut bis ~50-100 Kunden
- ⚠️ **Dateisystem-Limits**: Abhängig vom Dateisystem

---

### **Option 2: Shared Code + Tenant-spezifische Daten (Empfohlen)**

#### Konzept
Gemeinsamer Code, aber tenant-spezifische Daten-Verzeichnisse.

```
wedding_site/
├── src/                    # Gemeinsamer Code
│   ├── server.js           # Multi-Tenant Server
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── public/                 # Gemeinsame statische Dateien
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── ...
├── data/                   # Tenant-Daten
│   ├── kunde1/
│   │   ├── rsvp-data.json
│   │   ├── playlist-data.json
│   │   ├── gallery-data.json
│   │   ├── links-data.json
│   │   └── wishlist-data.json
│   ├── kunde2/
│   │   └── ...
│   └── kunde3/
│       └── ...
├── uploads/                # Tenant-Uploads
│   ├── kunde1/
│   │   ├── admin_uploads/
│   │   ├── guest_uploads/
│   │   └── uploads/
│   ├── kunde2/
│   │   └── ...
│   └── kunde3/
│       └── ...
└── tenants.json            # Tenant-Registry (Mapping Subdomain → Tenant-ID)
```

#### Vorteile
- ✅ **Keine Code-Duplikation**: Ein Codebase für alle
- ✅ **Einfache Updates**: Änderungen gelten für alle Kunden
- ✅ **Datenisolation**: Jeder Kunde hat eigene Daten
- ✅ **Skalierbar**: Funktioniert gut bis ~500+ Kunden
- ✅ **Wartbar**: Zentrale Wartung möglich
- ✅ **Template-basiert**: Neue Kunden können aus Templates erstellt werden

#### Nachteile
- ⚠️ **Code-Refactoring nötig**: Server.js muss umgebaut werden
- ⚠️ **Tenant-Erkennung**: Subdomain-Parsing muss implementiert werden
- ⚠️ **Fehlerbehandlung**: Fehler in einem Tenant können andere beeinflussen (wenn nicht isoliert)

#### Automatisierung
- **Neue Kunden**: Skript erstellt Daten-Verzeichnis + Eintrag in `tenants.json`
- **Subdomain-Setup**: DNS/Reverse-Proxy Konfiguration (siehe Deployment)
- **Backup**: Skript sichert nur `data/` und `uploads/` Verzeichnisse

#### Skalierbarkeit
- ✅ **Gut**: Funktioniert bis ~500-1000 Kunden (je nach Server-Ressourcen)

---

### **Option 3: Datenbank-basierte Multi-Tenancy (Professionellste Lösung)**

#### Konzept
Datenbank (SQLite/PostgreSQL/MySQL) mit Tenant-ID in jeder Tabelle.

```
wedding_site/
├── src/
│   ├── server.js
│   ├── models/             # Datenbank-Models
│   │   ├── Tenant.js
│   │   ├── RSVP.js
│   │   ├── Playlist.js
│   │   └── ...
│   ├── middleware/
│   │   └── tenantResolver.js
│   └── routes/
├── public/                 # Gemeinsame statische Dateien
└── uploads/                # Tenant-Uploads (wie Option 2)
    ├── kunde1/
    └── kunde2/
```

#### Datenbank-Schema (Beispiel)
```sql
-- Tenants Tabelle
CREATE TABLE tenants (
    id VARCHAR(50) PRIMARY KEY,
    subdomain VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP,
    status VARCHAR(20) -- active, suspended, etc.
);

-- RSVPs mit Tenant-ID
CREATE TABLE rsvps (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) REFERENCES tenants(id),
    name VARCHAR(255),
    email VARCHAR(255),
    attendance VARCHAR(10),
    guests INT,
    submitted_at TIMESTAMP
);

-- Ähnlich für: playlists, gallery_photos, links, wishlist_items
```

#### Vorteile
- ✅ **Höchste Skalierbarkeit**: Funktioniert mit tausenden Kunden
- ✅ **Datenbank-Features**: Queries, Indizes, Transaktionen
- ✅ **Einfache Abfragen**: Tenant-übergreifende Statistiken möglich
- ✅ **Professionell**: Enterprise-ready
- ✅ **Backup**: Datenbank-Backup statt Dateien
- ✅ **Performance**: Indizierte Abfragen

#### Nachteile
- ❌ **Komplexer**: Datenbank-Setup und Migration nötig
- ❌ **Mehr Dependencies**: ORM (Sequelize, TypeORM) oder SQL
- ❌ **Uploads bleiben Dateien**: Oder in S3/Cloud Storage
- ❌ **Lernkurve**: Team muss Datenbank verstehen

#### Automatisierung
- **Neue Kunden**: API-Endpunkt erstellt Tenant in DB
- **Migrations**: Datenbank-Migrations-Tools (z.B. Knex.js)
- **Backup**: Datenbank-Dumps

#### Skalierbarkeit
- ✅ **Sehr gut**: Funktioniert mit tausenden Kunden

---

### **Option 4: Container-basierte Multi-Tenancy (Docker/Kubernetes)**

#### Konzept
Jeder Kunde läuft in einem eigenen Container.

```
wedding_site/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── kubernetes/
│   └── deployment.yaml
└── orchestration/
    └── tenant-manager.js    # Erstellt/Verwaltet Container
```

#### Vorteile
- ✅ **Vollständige Isolation**: Jeder Tenant ist komplett getrennt
- ✅ **Ressourcen-Limits**: CPU/Memory pro Tenant
- ✅ **Einfaches Scaling**: Container horizontal skalierbar
- ✅ **Rolling Updates**: Updates ohne Downtime
- ✅ **Cloud-ready**: Funktioniert mit AWS, GCP, Azure

#### Nachteile
- ❌ **Sehr komplex**: Docker/Kubernetes Wissen nötig
- ❌ **Ressourcen-intensiv**: Jeder Container braucht Memory
- ❌ **Overhead**: Container-Management
- ❌ **Kosten**: Mehr Server-Ressourcen nötig

#### Skalierbarkeit
- ✅ **Exzellent**: Funktioniert mit tausenden Kunden (mit entsprechenden Ressourcen)

---

## 🔧 Technische Implementierungs-Details

### **Subdomain-Erkennung**

#### Im Express Server
```javascript
// Middleware zur Tenant-Erkennung
function tenantResolver(req, res, next) {
    const host = req.get('host');
    const subdomain = host.split('.')[0];
    
    // Validiere Subdomain
    if (subdomain === 'www' || subdomain === 'meinedomain') {
        return res.status(404).send('Tenant nicht gefunden');
    }
    
    req.tenantId = subdomain;
    next();
}

app.use(tenantResolver);
```

#### Mit Reverse Proxy (Nginx/Traefik)
```nginx
# Nginx Config
server {
    listen 80;
    server_name *.meinedomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### **Daten-Pfade pro Tenant**

#### Option 2 (Shared Code)
```javascript
function getTenantDataPath(tenantId) {
    return path.join(__dirname, 'data', tenantId);
}

function getTenantUploadPath(tenantId) {
    return path.join(__dirname, 'uploads', tenantId);
}

// Verwendung
const rsvpFile = path.join(getTenantDataPath(req.tenantId), 'rsvp-data.json');
```

---

### **Tenant-Registry**

#### JSON-basiert (einfach)
```json
// tenants.json
{
    "kunde1": {
        "id": "kunde1",
        "subdomain": "kunde1",
        "name": "Max & Maria",
        "createdAt": "2024-01-15",
        "status": "active"
    },
    "kunde2": {
        "id": "kunde2",
        "subdomain": "kunde2",
        "name": "Tom & Sarah",
        "createdAt": "2024-01-20",
        "status": "active"
    }
}
```

#### Datenbank-basiert (professionell)
```sql
SELECT * FROM tenants WHERE subdomain = 'kunde1';
```

---

## 🚀 Deployment-Strategien

### **1. DNS-Konfiguration**

#### Wildcard DNS
```
*.meinedomain.com → A Record → Server-IP
```

#### Beispiel (Cloudflare)
- Type: `A`
- Name: `*`
- Content: `123.456.789.0`
- Proxy: Enabled (optional)

---

### **2. Reverse Proxy (Nginx/Traefik/Caddy)**

#### Nginx
```nginx
server {
    listen 80;
    server_name *.meinedomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Caddy (einfachste Lösung)
```
*.meinedomain.com {
    reverse_proxy localhost:3000
}
```

---

### **3. SSL-Zertifikate**

#### Let's Encrypt Wildcard
```bash
certbot certonly --dns-cloudflare \
  -d *.meinedomain.com \
  -d meinedomain.com
```

#### Automatisch mit Caddy
Caddy erstellt automatisch SSL-Zertifikate für alle Subdomains.

---

## 🤖 Automatisierung

### **Neue Kunden anlegen**

#### Skript (Option 2)
```javascript
// scripts/create-tenant.js
const fs = require('fs');
const path = require('path');

function createTenant(tenantId, tenantName) {
    // 1. Daten-Verzeichnis erstellen
    const dataDir = path.join(__dirname, '..', 'data', tenantId);
    fs.mkdirSync(dataDir, { recursive: true });
    
    // 2. Upload-Verzeichnisse erstellen
    const uploadsDir = path.join(__dirname, '..', 'uploads', tenantId);
    fs.mkdirSync(path.join(uploadsDir, 'admin_uploads'), { recursive: true });
    fs.mkdirSync(path.join(uploadsDir, 'guest_uploads'), { recursive: true });
    fs.mkdirSync(path.join(uploadsDir, 'uploads'), { recursive: true });
    
    // 3. Initiale JSON-Dateien erstellen
    const templates = {
        'rsvp-data.json': { rsvps: [], stats: { total: 0, attending: 0, notAttending: 0, totalGuests: 0 } },
        'playlist-data.json': { songs: [], stats: { total: 0, contributors: 0 } },
        'gallery-data.json': { photos: [], stats: { total: 0, contributors: 0 } },
        'links-data.json': { profile: {}, links: [] },
        'wishlist-data.json': { items: [], stats: { total: 0, purchased: 0, available: 0 } }
    };
    
    Object.entries(templates).forEach(([filename, data]) => {
        fs.writeFileSync(
            path.join(dataDir, filename),
            JSON.stringify(data, null, 2)
        );
    });
    
    // 4. Tenant in Registry eintragen
    const tenantsFile = path.join(__dirname, '..', 'tenants.json');
    const tenants = fs.existsSync(tenantsFile) 
        ? JSON.parse(fs.readFileSync(tenantsFile, 'utf8'))
        : {};
    
    tenants[tenantId] = {
        id: tenantId,
        subdomain: tenantId,
        name: tenantName,
        createdAt: new Date().toISOString(),
        status: 'active'
    };
    
    fs.writeFileSync(tenantsFile, JSON.stringify(tenants, null, 2));
    
    console.log(`✅ Tenant ${tenantId} erfolgreich erstellt!`);
}

// CLI
const tenantId = process.argv[2];
const tenantName = process.argv[3] || tenantId;

if (!tenantId) {
    console.error('Usage: node create-tenant.js <tenant-id> [tenant-name]');
    process.exit(1);
}

createTenant(tenantId, tenantName);
```

#### API-Endpunkt (für Admin-Panel)
```javascript
// POST /api/admin/tenants
app.post('/api/admin/tenants', superAdminAuth, async (req, res) => {
    const { tenantId, tenantName } = req.body;
    // ... Tenant erstellen
});
```

---

### **Updates deployen**

#### Skript für Option 1 (Verzeichnis-basiert)
```bash
#!/bin/bash
# deploy-update.sh

for tenant_dir in tenants/*/; do
    echo "Updating $tenant_dir"
    cp -r src/* "$tenant_dir"
done
```

#### Für Option 2 (Shared Code)
- Einfach: Code deployen, alle Tenants profitieren automatisch
- Kein zusätzliches Skript nötig

---

### **Backup**

#### Skript
```bash
#!/bin/bash
# backup-tenants.sh

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Option 2: Nur Daten und Uploads
cp -r data "$BACKUP_DIR/"
cp -r uploads "$BACKUP_DIR/"

# Option 1: Komplette Tenant-Verzeichnisse
# cp -r tenants "$BACKUP_DIR/"

tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"
```

---

## 📊 Vergleich der Optionen

| Kriterium | Option 1 (Verzeichnis) | Option 2 (Shared Code) | Option 3 (Datenbank) | Option 4 (Container) |
|-----------|------------------------|------------------------|----------------------|----------------------|
| **Implementierungs-Aufwand** | ⭐⭐ Niedrig | ⭐⭐⭐ Mittel | ⭐⭐⭐⭐ Hoch | ⭐⭐⭐⭐⭐ Sehr hoch |
| **Wartbarkeit** | ⭐⭐ Niedrig | ⭐⭐⭐⭐ Hoch | ⭐⭐⭐⭐⭐ Sehr hoch | ⭐⭐⭐⭐ Hoch |
| **Skalierbarkeit** | ⭐⭐ ~50-100 | ⭐⭐⭐⭐ ~500-1000 | ⭐⭐⭐⭐⭐ 1000+ | ⭐⭐⭐⭐⭐ 1000+ |
| **Datenisolation** | ⭐⭐⭐⭐⭐ Perfekt | ⭐⭐⭐⭐ Sehr gut | ⭐⭐⭐⭐ Sehr gut | ⭐⭐⭐⭐⭐ Perfekt |
| **Update-Einfachheit** | ⭐⭐ Schwer | ⭐⭐⭐⭐⭐ Sehr einfach | ⭐⭐⭐⭐⭐ Sehr einfach | ⭐⭐⭐ Mittel |
| **Ressourcen-Verbrauch** | ⭐⭐⭐ Mittel | ⭐⭐⭐⭐ Niedrig | ⭐⭐⭐⭐ Niedrig | ⭐⭐ Hoch |
| **Empfohlen für** | < 20 Kunden | 20-500 Kunden | 500+ Kunden | Enterprise |

---

## 🎯 Empfehlung

### **Für den Start: Option 2 (Shared Code + Tenant-Daten)**

**Warum?**
- ✅ Guter Kompromiss zwischen Einfachheit und Skalierbarkeit
- ✅ Einfache Wartung (ein Codebase)
- ✅ Schnelle Implementierung (moderate Code-Änderungen)
- ✅ Funktioniert gut bis ~500 Kunden
- ✅ Einfache Migration zu Option 3 später möglich

### **Migration zu Option 3 (Datenbank) später**

Wenn du > 500 Kunden hast oder mehr Features brauchst:
- Migration der JSON-Dateien in Datenbank
- Bessere Performance durch Indizes
- Tenant-übergreifende Analytics möglich

---

## 🔐 Sicherheits-Überlegungen

### **Tenant-Isolation**
- ✅ Jeder Tenant darf nur auf eigene Daten zugreifen
- ✅ Validierung der Tenant-ID bei jedem Request
- ✅ Keine Cross-Tenant-Datenlecks

### **Admin-Authentifizierung**
- Jeder Tenant hat eigene Admin-Credentials
- Super-Admin für Tenant-Verwaltung (separat)

### **Rate Limiting**
- Pro Tenant limitieren
- Verhindert DDoS auf einen Tenant

---

## 📈 Monitoring & Analytics

### **Pro Tenant**
- Anzahl RSVPs
- Anzahl Uploads
- Traffic-Statistiken

### **System-weit**
- Anzahl aktiver Tenants
- Gesamt-Traffic
- Server-Ressourcen

---

## 🛠️ Nächste Schritte (wenn du implementierst)

1. **Entscheidung**: Welche Option passt zu deinen Anforderungen?
2. **DNS-Setup**: Wildcard-Subdomain konfigurieren
3. **Reverse Proxy**: Nginx/Caddy einrichten
4. **Code-Refactoring**: Server.js für Multi-Tenancy anpassen
5. **Tenant-Management**: Skripte/API für neue Kunden
6. **Testing**: Mehrere Test-Tenants anlegen
7. **Deployment**: Schrittweise Migration

---

## 📝 Zusammenfassung

**Für dein Use-Case (Wedding-Websites) empfehle ich:**

1. **Kurzfristig**: **Option 2** (Shared Code + Tenant-Daten)
   - Schnell umsetzbar
   - Gute Skalierbarkeit
   - Einfache Wartung

2. **Langfristig**: **Option 3** (Datenbank)
   - Wenn du > 500 Kunden hast
   - Für professionellere Features
   - Für bessere Analytics

**Automatisierung:**
- Skript zum Anlegen neuer Tenants
- API-Endpunkt für Self-Service (optional)
- Backup-Skripte
- Update-Prozess dokumentieren

**Deployment:**
- Wildcard DNS: `*.meinedomain.com`
- Reverse Proxy (Caddy ist am einfachsten)
- SSL automatisch mit Let's Encrypt

---

*Dieses Dokument dient als Planungsgrundlage. Bei Fragen oder Klärungsbedarf gerne nachfragen!*

