// Rückmeldung JavaScript Funktionalität

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('rsvp-form');
    const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
    const dietarySection = document.getElementById('dietary-section');
    const successMessage = document.getElementById('success-message');
    const submitBtn = document.querySelector('.submit-btn');

    // Zeige/verstecke Diät-Sektion basierend auf Zusage
    attendanceRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'yes') {
                dietarySection.style.display = 'block';
                dietarySection.style.animation = 'slideInUp 0.3s ease-out';
            } else {
                dietarySection.style.display = 'none';
            }
        });
    });

    // Formular-Validierung
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Button deaktivieren
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wird gesendet...';

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Validierung
            if (!data.name || !data.attendance || !data.guests) {
                throw new Error('Bitte füllen Sie alle Pflichtfelder aus.');
            }

            // E-Mail Validierung (nur wenn E-Mail angegeben wurde)
            if (data.email && data.email.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email)) {
                    throw new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
                }
            }

            // Rückmeldung an Server senden
            const response = await fetch('/api/rsvp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    timestamp: new Date().toISOString(),
                    ip: await getClientIP()
                })
            });

            if (!response.ok) {
                throw new Error('Fehler beim Senden der Rückmeldung. Bitte versuchen Sie es erneut.');
            }

            // Erfolg anzeigen
            showSuccessMessage();
            
        } catch (error) {
            console.error('Rückmeldung Error:', error);
            alert(error.message);
            
            // Button zurücksetzen
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Rückmeldung geben';
        }
    });

    // Client IP ermitteln (für Analytics)
    async function getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
    }

    // Erfolgsmeldung anzeigen
    function showSuccessMessage() {
        successMessage.style.display = 'flex';
        successMessage.style.animation = 'fadeIn 0.5s ease-out';
        
        // Formular zurücksetzen
        form.reset();
        dietarySection.style.display = 'none';
        
        // Nach 3 Sekunden automatisch schließen (optional)
        setTimeout(() => {
            if (successMessage.style.display === 'flex') {
                window.location.href = '/';
            }
        }, 5000);
    }

    // Formular-Validierung in Echtzeit
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', validateField);
        field.addEventListener('input', validateField);
    });

    function validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        
        // Entferne vorherige Fehlermeldungen
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        if (field.hasAttribute('required') && !value) {
            showFieldError(field, 'Dieses Feld ist erforderlich.');
        } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            showFieldError(field, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        }
    }

    function showFieldError(field, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#ef4444';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '4px';
        
        field.parentNode.appendChild(errorDiv);
        field.style.borderColor = '#ef4444';
    }

    // Zeichenzähler für Textarea
    const messageTextarea = document.getElementById('message');
    if (messageTextarea) {
        const maxLength = 500;
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.textAlign = 'right';
        counter.style.fontSize = '12px';
        counter.style.color = '#64748b';
        counter.style.marginTop = '4px';
        messageTextarea.parentNode.appendChild(counter);

        function updateCounter() {
            const length = messageTextarea.value.length;
            counter.textContent = `${length}/${maxLength}`;
            counter.style.color = length > maxLength * 0.9 ? '#ef4444' : '#64748b';
        }

        messageTextarea.addEventListener('input', updateCounter);
        messageTextarea.setAttribute('maxlength', maxLength);
    }

    // Smooth Scrolling für bessere UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Auto-Save für Formular (optional)
    let autoSaveTimeout;
    form.addEventListener('input', function() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            localStorage.setItem('rsvp-draft', JSON.stringify(data));
        }, 1000);
    });

    // Gespeicherte Daten laden
    const savedData = localStorage.getItem('rsvp-draft');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'radio') {
                        if (field.value === data[key]) {
                            field.checked = true;
                        }
                    } else {
                        field.value = data[key];
                    }
                }
            });
            
            // Diät-Sektion anzeigen falls Zusage
            if (data.attendance === 'yes') {
                dietarySection.style.display = 'block';
            }
        } catch (e) {
            console.log('Keine gespeicherten Daten gefunden');
        }
    }

    // Formular leeren beim erfolgreichen Senden
    form.addEventListener('submit', function() {
        localStorage.removeItem('rsvp-draft');
    });
});

// CSS für Animationen hinzufügen
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .field-error {
        animation: slideInUp 0.3s ease-out;
    }
`;
document.head.appendChild(style);
