# 📸 Photo Site Builder Pro

Un editor visuale avanzato per creare siti portfolio fotografici professionali con interfaccia drag & drop.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Caratteristiche

- 🎨 **Editor Visuale**: Interfaccia drag & drop intuitiva
- 📄 **Multi-Pagina**: Crea e gestisci più pagine e gallerie
- 🎯 **Header Personalizzabile**: Menu di navigazione completamente personalizzabile
- 🖼️ **Gestione Immagini**: Carica, ridimensiona e applica filtri alle immagini
- 📝 **Testo Personalizzato**: Aggiungi e formatta elementi di testo
- 🎨 **Temi Personalizzati**: Configura colori e stili globali
- 💾 **Salva/Carica Progetti**: Sistema di salvataggio e caricamento progetti
- 📥 **Export Sito**: Esporta il sito completo (in sviluppo)
- 📱 **Responsive**: Design ottimizzato per tutti i dispositivi

## 🚀 Installazione

### Metodo 1: Clone diretto

```bash
git clone https://github.com/tuousername/photo-site-builder.git
cd photo-site-builder
```

### Metodo 2: Download ZIP

1. Scarica il file ZIP dal repository
2. Estrai i file in una cartella locale
3. Apri `index.html` in un browser moderno

### Metodo 3: Server locale (consigliato per sviluppo)

```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx serve

# Con PHP
php -S localhost:8000
```

Poi apri: `http://localhost:8000`

## 📁 Struttura Progetto

```
photo-site-builder/
│
├── 📄 index.html              # Entry point dell'applicazione
│
├── 📁 css/
│   ├── 🎨 main.css           # Stili globali
│   ├── 🎨 editor.css         # Stili pannello editor
│   └── 🎨 preview.css        # Stili area preview
│
├── 📁 js/
│   ├── ⚙️ app.js             # Core applicazione
│   ├── 💾 dataManager.js     # Gestione dati e persistenza
│   ├── 📄 pageManager.js     # Gestione pagine
│   ├── 🎯 headerManager.js   # Gestione header e menu
│   ├── 🖼️ elementManager.js  # Gestione elementi pagina
│   ├── 🖱️ dragDrop.js        # Handler drag & drop
│   ├── 📥 exportManager.js   # Export sito (in sviluppo)
│   ├── 👁️ previewGenerator.js # Generatore preview live
│   └── 🎛️ uiController.js    # Controller interfaccia utente
│
├── 📖 README.md              # Questo file
└── 🚫 .gitignore            # File da ignorare in Git
```

## 🎯 Utilizzo

### 1. Gestione Pagine

- Clicca su **"Pagine"** per visualizzare tutte le pagine
- **+ Nuova Pagina**: Crea una nuova pagina
- **👁️ / 👁️‍🗨️**: Mostra/nascondi pagine
- Clicca su una pagina per modificarla

### 2. Editor Elementi

- Seleziona una pagina dal menu "Pagine"
- **+ Carica Foto**: Aggiungi immagini
- **+ Aggiungi Testo**: Inserisci elementi di testo
- **Trascina** gli elementi per posizionarli
- **Ridimensiona** le immagini trascinando l'angolo
- Clicca su un elemento per modificarne le proprietà

### 3. Header & Menu

- Personalizza il titolo del sito
- Aggiungi voci di menu per le pagine
- Aggiungi link esterni
- Inserisci logo o immagini
- Posiziona liberamente gli elementi

### 4. Impostazioni

- **Nome Sito**: Titolo del portfolio
- **Autore**: Il tuo nome
- **Colori**: Personalizza la palette del sito
- **Export Mode**: Scegli tra multi-pagina o singola pagina

### 5. Salva e Carica

- **💾 Salva**: Scarica il progetto come file JSON
- **📤 Carica**: Ricarica un progetto salvato
- I progetti salvati mantengono tutte le impostazioni e contenuti

## 🔧 Tecnologie

- **Vanilla JavaScript** (ES6 Modules)
- **CSS3** (Flexbox, Grid, Animations)
- **HTML5**
- **File API** per upload e download
- **Iframe** per preview live

## 🎨 Moduli Principali

### DataManager
Gestisce lo stato dell'applicazione e la persistenza dei dati.

### PageManager
Gestisce creazione, modifica e organizzazione delle pagine.

### HeaderManager
Controlla gli elementi del menu di navigazione.

### ElementManager
Gestisce immagini e testi all'interno delle pagine.

### DragDropHandler
Gestisce tutte le interazioni drag & drop.

### PreviewGenerator
Genera l'HTML live della preview.

### UIController
Coordina l'interfaccia utente e la navigazione tra tab.

### ExportManager
Gestisce l'export del sito finale (in sviluppo).

## 🚧 Roadmap

- [x] ✅ Sistema completo di gestione pagine
- [x] ✅ Editor drag & drop
- [x] ✅ Gestione header
- [ ] 🚧 Export sito completo (HTML/CSS)
- [ ] 🚧 Sistema di template
- [ ] 🚧 Gallerie fotografiche avanzate
- [ ] 🚧 Animazioni personalizzate
- [ ] 🚧 SEO optimization
- [ ] 🚧 Deploy automatico

## 📄 Licenza

MIT License - Vedi file LICENSE per dettagli

## 👤 Autore

**Il tuo nome**

- GitHub: [@tuousername](https://github.com/tuousername)
- Email: tua@email.com

## 🤝 Contribuire

Le contribuzioni sono benvenute! Per favore:

1. Fai un Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 🐛 Bug e Feature Request

Usa la sezione [Issues](https://github.com/tuousername/photo-site-builder/issues) per segnalare bug o richiedere nuove funzionalità.

## 📝 Changelog

### v1.0.0 (2025-01-21)
- ✨ Release iniziale
- ✅ Sistema di gestione pagine
- ✅ Editor drag & drop
- ✅ Gestione header personalizzabile
- ✅ Sistema salva/carica progetti

## 💡 Supporto

Per domande o supporto:
- 📧 Email: support@example.com
- 💬 Discussions: [GitHub Discussions](https://github.com/tuousername/photo-site-builder/discussions)

---

⭐ Se ti piace questo progetto, lascia una stella su GitHub!