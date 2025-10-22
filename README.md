# Visual HTML Site Editor

Editor visuale completo per creare siti web HTML multipagina con interfaccia drag & drop intuitiva.

## Caratteristiche Principali

### Editor Visuale
- **Canvas Drag & Drop**: Trascina, ridimensiona e posiziona liberamente gli elementi
- **Multi-Pagina**: Gestisci più pagine HTML in un unico progetto
- **Elementi Supportati**: Testo, Immagini, Pulsanti, Sezioni personalizzate
- **Anteprima in Tempo Reale**: Visualizza le modifiche istantaneamente

### Gestione Avanzata
- **Livelli (Z-Index)**: Controlla la sovrapposizione degli elementi
- **Blocca/Sblocca**: Proteggi elementi da modifiche accidentali
- **Raggruppa**: Gestisci più elementi come un'unità
- **Duplica**: Copia rapidamente elementi o intere pagine

### Componenti Condivisi
- **Header e Menu Globali**: Crea componenti riutilizzabili
- **Override Locali**: Modifica componenti per pagine specifiche
- **Gestione Centralizzata**: Aggiorna un componente e rifletti le modifiche ovunque

### Immagini
- **Gestione Separata**: Le immagini NON sono incorporate in base64
- **Organizzazione Automatica**: Cartella `/images/` dedicata nell'export
- **Ottimizzazione**: Compressione e ridimensionamento automatico
- **Controllo Peso**: Monitoraggio costante per rispettare il limite di 25 MB

### Undo/Redo e Autosave
- **History Completo**: Annulla e ripeti fino a 50 operazioni
- **Autosave**: Salvataggio automatico ogni minuto nel browser
- **Salva Progetto**: Esporta il progetto come file JSON

### Export Professionale
L'export genera una struttura completa:
```
site/
├── index.html
├── contatti.html
├── images/
│   ├── foto1.jpg
│   └── foto2.png
└── assets/
    ├── site.css
    └── site.js
```

## Installazione e Uso

1. **Clona il repository**
2. **Apri index.html** nel browser
3. **Inizia a creare** il tuo sito!

## Tecnologie

- HTML5, CSS3, JavaScript ES6+
- Vanilla JS (nessuna dipendenza)
- File API per gestione immagini

## Struttura

```
├── index.html
├── css/          # Stili dell'editor
├── js/           # Logica applicazione
└── assets/       # Risorse
```

Per documentazione completa, vedi i commenti nei file sorgente.