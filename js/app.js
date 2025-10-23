/**
 * Visual HTML Site Editor - Main Application
 * Editor visuale completo per creare siti HTML multipagina
 */

import { DataManager } from './DataManager.js';
import { HistoryManager } from './HistoryManager.js';
import { ImageManager } from './ImageManager.js';
import { LayerManager } from './LayerManager.js';
import { ComponentManager } from './ComponentManager.js';
import { CanvasManager } from './CanvasManager.js';
import { ExportManager } from './ExportManager.js';
import { UIController } from './UIController.js';

class VisualHTMLEditor {
    constructor() {
        // Initialize managers
        this.dataManager = new DataManager();
        this.historyManager = new HistoryManager();
        this.imageManager = new ImageManager(this.dataManager);
        this.layerManager = new LayerManager(this.dataManager, this.historyManager);
        this.componentManager = new ComponentManager(this.dataManager);
        this.canvasManager = new CanvasManager(this.dataManager, this.historyManager, this.layerManager, this.imageManager, this.componentManager);
        this.exportManager = new ExportManager(this.dataManager, this.imageManager);
        this.ui = new UIController(this);

        this.autosaveInterval = null;

        console.log('🚀 Visual HTML Site Editor initialized');
    }

    /**
     * Inizializza l'applicazione
     */
    init() {
        // Initialize UI
        this.ui.init();

        // Initialize canvas
        const canvas = document.getElementById('canvas');
        this.canvasManager.init(canvas);

        // Setup canvas selection callback
        this.canvasManager.onSelectionChange = (element) => {
            this.ui.showElementProperties(element);
        };

        // Setup event listeners
        this.setupEventListeners();

        // Setup history listener
        this.historyManager.onChange((state) => {
            this.ui.updateHistoryButtons();
        });

        // Setup data manager listeners
        this.setupDataListeners();

        // Enable autosave
        this.enableAutosave();

        // Load first page
        const pages = this.dataManager.getPages();
        if (pages.length > 0) {
            this.canvasManager.loadPage(pages[0].id);
        }

        console.log('✅ Application ready');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // New project
        document.getElementById('newProjectBtn').addEventListener('click', () => {
            this.newProject();
        });

        // Save project
        document.getElementById('saveProjectBtn').addEventListener('click', () => {
            this.saveProject();
        });

        // Load project
        document.getElementById('loadProjectBtn').addEventListener('click', () => {
            document.getElementById('loadProjectInput').click();
        });

        document.getElementById('loadProjectInput').addEventListener('change', (e) => {
            this.loadProject(e);
        });

        // Export site
        document.getElementById('exportSiteBtn').addEventListener('click', () => {
            this.exportSite();
        });

        // Add page button
        document.getElementById('addPageBtn').addEventListener('click', () => {
            this.addPage();
        });

        // Add component button
        document.getElementById('addComponentBtn').addEventListener('click', () => {
            this.ui.openModal('newComponentModal');
        });

        // Confirm new page
        document.getElementById('confirmNewPage')?.addEventListener('click', () => {
            this.confirmNewPage();
        });

        // Confirm new component
        document.getElementById('confirmNewComponent')?.addEventListener('click', () => {
            this.confirmNewComponent();
        });

        // Confirm export
        document.getElementById('confirmExport')?.addEventListener('click', () => {
            this.confirmExport();
        });

        // Zoom controls
        document.getElementById('zoomIn')?.addEventListener('click', () => {
            this.canvasManager.zoomIn();
        });

        document.getElementById('zoomOut')?.addEventListener('click', () => {
            this.canvasManager.zoomOut();
        });

        document.getElementById('zoomFit')?.addEventListener('click', () => {
            this.canvasManager.zoomToFit();
        });

        // Handle before unload
        window.addEventListener('beforeunload', (e) => {
            if (this.dataManager.isModified()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    /**
     * Setup data manager listeners
     */
    setupDataListeners() {
        this.dataManager.on('pageAdded', () => {
            this.ui.renderPagesList();
            this.ui.updateFileWeight();
        });

        this.dataManager.on('pageDeleted', () => {
            this.ui.renderPagesList();
            this.ui.updateFileWeight();
        });

        this.dataManager.on('elementAdded', () => {
            this.canvasManager.render();
            this.ui.updateFileWeight();
        });

        this.dataManager.on('elementUpdated', () => {
            this.canvasManager.render();
            this.ui.updateFileWeight();
        });

        this.dataManager.on('elementDeleted', () => {
            this.canvasManager.render();
            this.ui.updateFileWeight();
        });
    }

    /**
     * Crea un nuovo progetto
     */
    newProject() {
        if (this.dataManager.isModified()) {
            if (!confirm('Hai modifiche non salvate. Vuoi continuare?')) {
                return;
            }
        }

        this.dataManager.newProject();
        this.historyManager.clear();
        this.imageManager.cleanup();

        this.ui.renderPagesList();
        this.ui.updateFileWeight();

        const pages = this.dataManager.getPages();
        if (pages.length > 0) {
            this.canvasManager.loadPage(pages[0].id);
        }

        this.ui.showNotification('Nuovo progetto creato', 'success');
    }

    /**
     * Salva il progetto
     */
    async saveProject() {
        try {
            await this.dataManager.saveProject();
            this.ui.showNotification('Progetto salvato con successo', 'success');
        } catch (error) {
            this.ui.showNotification('Errore nel salvataggio: ' + error.message, 'error');
        }
    }

    /**
     * Carica un progetto
     */
    loadProject(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = e.target.result;
                await this.dataManager.loadProject(data);

                this.historyManager.clear();
                this.ui.renderPagesList();
                this.ui.updateFileWeight();

                const pages = this.dataManager.getPages();
                if (pages.length > 0) {
                    this.canvasManager.loadPage(pages[0].id);
                }

                this.ui.showNotification('Progetto caricato con successo', 'success');
            } catch (error) {
                this.ui.showNotification('Errore nel caricamento: ' + error.message, 'error');
            }
        };

        reader.onerror = () => {
            this.ui.showNotification('Errore nella lettura del file', 'error');
        };

        reader.readAsText(file);
        event.target.value = '';
    }

    /**
     * Esporta il sito
     */
    exportSite() {
        this.ui.openModal('exportModal');
    }

    /**
     * Conferma export
     */
    async confirmExport() {
        const optimize = document.getElementById('exportOptimize').checked;
        const compress = document.getElementById('exportCompress').checked;

        try {
            await this.exportManager.exportSite({ optimize, compress });
            this.ui.closeModal('exportModal');
            this.ui.showNotification('Sito esportato con successo!', 'success');
        } catch (error) {
            this.ui.showNotification('Errore nell\'export: ' + error.message, 'error');
        }
    }

    /**
     * Aggiunge una nuova pagina
     */
    addPage() {
        this.ui.openModal('newPageModal');
    }

    /**
     * Conferma creazione nuova pagina
     */
    confirmNewPage() {
        const name = document.getElementById('newPageName').value.trim();
        const title = document.getElementById('newPageTitle').value.trim();

        if (!name) {
            this.ui.showNotification('Inserisci un nome per la pagina', 'error');
            return;
        }

        try {
            const page = this.dataManager.addPage(name, title);
            this.ui.closeModal('newPageModal');
            this.ui.showNotification('Pagina creata', 'success');
            this.canvasManager.loadPage(page.id);

            // Reset form
            document.getElementById('newPageName').value = '';
            document.getElementById('newPageTitle').value = '';
        } catch (error) {
            this.ui.showNotification(error.message, 'error');
        }
    }

    /**
     * Conferma creazione nuovo componente
     */
    confirmNewComponent() {
        const name = document.getElementById('newComponentName').value.trim();
        const type = document.getElementById('newComponentType').value;

        if (!name) {
            this.ui.showNotification('Inserisci un nome per il componente', 'error');
            return;
        }

        try {
            this.componentManager.createComponent(name, type);
            this.ui.closeModal('newComponentModal');
            this.ui.showNotification('Componente creato con successo!', 'success');

            // Cambia al tab componenti per mostrare il nuovo componente
            this.ui.switchTab('components');

            // Aggiorna la lista dei componenti
            this.ui.renderComponentsList();

            // Reset form
            document.getElementById('newComponentName').value = '';
        } catch (error) {
            this.ui.showNotification(error.message, 'error');
        }
    }

    /**
     * Abilita l'autosave
     */
    enableAutosave(interval = 60000) { // 1 minute
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
        }

        this.autosaveInterval = setInterval(() => {
            if (this.dataManager.isModified()) {
                this.autoSave();
            }
        }, interval);
    }

    /**
     * Autosave nel localStorage
     */
    autoSave() {
        try {
            const data = JSON.stringify(this.dataManager.getProject());
            localStorage.setItem('visual-html-editor-autosave', data);
            console.log('💾 Autosave completed');
        } catch (error) {
            console.error('Autosave failed:', error);
        }
    }

    /**
     * Carica l'autosave
     */
    loadAutosave() {
        const saved = localStorage.getItem('visual-html-editor-autosave');
        if (saved) {
            try {
                this.dataManager.loadProject(saved);
                return true;
            } catch (error) {
                console.error('Failed to load autosave:', error);
            }
        }
        return false;
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VisualHTMLEditor();
    window.app.init();
});

export default VisualHTMLEditor;
