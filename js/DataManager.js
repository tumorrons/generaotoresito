/**
 * DataManager - Gestisce tutti i dati del progetto
 * Include gestione pagine, elementi, componenti condivisi, e immagini
 */

export class DataManager {
    constructor() {
        this.projectData = this.getDefaultProject();
        this.images = new Map(); // Store images separately: filename -> blob
        this.listeners = new Map();
        this.projectModified = false;
    }

    /**
     * Ottiene la struttura di default del progetto
     */
    getDefaultProject() {
        return {
            meta: {
                name: 'Nuovo Progetto',
                version: '1.0.0',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            },
            settings: {
                siteName: 'Il Mio Sito',
                author: '',
                description: '',
                favicon: '',
                defaultFont: 'Arial, sans-serif',
                globalColors: {
                    primary: '#2563eb',
                    secondary: '#64748b',
                    accent: '#10b981'
                }
            },
            pages: [
                {
                    id: this.generateId(),
                    name: 'index.html',
                    title: 'Home',
                    isHome: true,
                    background: {
                        type: 'color', // 'color', 'image', 'gradient'
                        value: '#ffffff',
                        gradient: null,
                        image: null
                    },
                    elements: [],
                    meta: {
                        description: '',
                        keywords: ''
                    }
                }
            ],
            components: [], // Shared components (headers, menus, footers)
            globalAssets: {
                css: '',
                js: ''
            }
        };
    }

    /**
     * Genera un ID univoco
     */
    generateId() {
        return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Ottiene i dati del progetto
     */
    getProject() {
        return this.projectData;
    }

    /**
     * Ottiene una pagina per ID
     */
    getPage(pageId) {
        return this.projectData.pages.find(p => p.id === pageId);
    }

    /**
     * Ottiene tutte le pagine
     */
    getPages() {
        return this.projectData.pages;
    }

    /**
     * Aggiunge una nuova pagina
     */
    addPage(name, title) {
        const newPage = {
            id: this.generateId(),
            name: name || `page-${this.projectData.pages.length + 1}.html`,
            title: title || `Pagina ${this.projectData.pages.length + 1}`,
            isHome: false,
            background: {
                type: 'color',
                value: '#ffffff',
                gradient: null,
                image: null
            },
            elements: [],
            meta: {
                description: '',
                keywords: ''
            }
        };

        this.projectData.pages.push(newPage);
        this.markModified();
        this.emit('pageAdded', newPage);

        return newPage;
    }

    /**
     * Elimina una pagina
     */
    deletePage(pageId) {
        const index = this.projectData.pages.findIndex(p => p.id === pageId);

        if (index === -1) {
            throw new Error('Pagina non trovata');
        }

        const page = this.projectData.pages[index];

        if (page.isHome && this.projectData.pages.length > 1) {
            throw new Error('Non puoi eliminare la home page. Imposta prima un\'altra pagina come home.');
        }

        // Update links in other pages
        this.updateLinksAfterPageDelete(pageId);

        this.projectData.pages.splice(index, 1);
        this.markModified();
        this.emit('pageDeleted', pageId);
    }

    /**
     * Rinomina una pagina
     */
    renamePage(pageId, newName, newTitle) {
        const page = this.getPage(pageId);

        if (!page) {
            throw new Error('Pagina non trovata');
        }

        const oldName = page.name;
        page.name = newName;
        page.title = newTitle || page.title;

        // Update all links that reference this page
        this.updateLinksAfterPageRename(oldName, newName);

        this.markModified();
        this.emit('pageRenamed', { pageId, oldName, newName });
    }

    /**
     * Imposta una pagina come home
     */
    setHomePage(pageId) {
        this.projectData.pages.forEach(p => {
            p.isHome = (p.id === pageId);
        });

        this.markModified();
        this.emit('homePageChanged', pageId);
    }

    /**
     * Duplica una pagina
     */
    duplicatePage(pageId) {
        const page = this.getPage(pageId);

        if (!page) {
            throw new Error('Pagina non trovata');
        }

        const duplicated = JSON.parse(JSON.stringify(page));
        duplicated.id = this.generateId();
        duplicated.name = this.getUniquePageName(page.name);
        duplicated.title = `${page.title} (Copia)`;
        duplicated.isHome = false;

        // Generate new IDs for all elements
        duplicated.elements = duplicated.elements.map(el => ({
            ...el,
            id: this.generateId()
        }));

        this.projectData.pages.push(duplicated);
        this.markModified();
        this.emit('pageDuplicated', duplicated);

        return duplicated;
    }

    /**
     * Ottiene un nome univoco per una pagina
     */
    getUniquePageName(baseName) {
        const nameWithoutExt = baseName.replace('.html', '');
        let counter = 1;
        let newName = `${nameWithoutExt}-${counter}.html`;

        while (this.projectData.pages.some(p => p.name === newName)) {
            counter++;
            newName = `${nameWithoutExt}-${counter}.html`;
        }

        return newName;
    }

    /**
     * Aggiunge un elemento a una pagina
     */
    addElement(pageId, element) {
        const page = this.getPage(pageId);

        if (!page) {
            throw new Error('Pagina non trovata');
        }

        const newElement = {
            id: this.generateId(),
            type: element.type,
            x: element.x || 0,
            y: element.y || 0,
            width: element.width || 200,
            height: element.height || 100,
            zIndex: this.getNextZIndex(page),
            locked: false,
            visible: true,
            ...element
        };

        page.elements.push(newElement);
        this.markModified();
        this.emit('elementAdded', { pageId, element: newElement });

        return newElement;
    }

    /**
     * Ottiene il prossimo z-index disponibile
     */
    getNextZIndex(page) {
        if (page.elements.length === 0) return 1;
        return Math.max(...page.elements.map(el => el.zIndex || 0)) + 1;
    }

    /**
     * Aggiorna un elemento
     */
    updateElement(pageId, elementId, updates) {
        const page = this.getPage(pageId);

        if (!page) {
            throw new Error('Pagina non trovata');
        }

        const element = page.elements.find(el => el.id === elementId);

        if (!element) {
            throw new Error('Elemento non trovato');
        }

        Object.assign(element, updates);
        this.markModified();
        this.emit('elementUpdated', { pageId, elementId, element });
    }

    /**
     * Elimina un elemento
     */
    deleteElement(pageId, elementId) {
        const page = this.getPage(pageId);

        if (!page) {
            throw new Error('Pagina non trovata');
        }

        const index = page.elements.findIndex(el => el.id === elementId);

        if (index === -1) {
            throw new Error('Elemento non trovato');
        }

        page.elements.splice(index, 1);
        this.markModified();
        this.emit('elementDeleted', { pageId, elementId });
    }

    /**
     * Aggiorna lo sfondo di una pagina
     */
    updatePageBackground(pageId, background) {
        const page = this.getPage(pageId);

        if (!page) {
            throw new Error('Pagina non trovata');
        }

        page.background = { ...page.background, ...background };
        this.markModified();
        this.emit('pageBackgroundUpdated', { pageId, background: page.background });
    }

    /**
     * Aggiorna i link dopo l'eliminazione di una pagina
     */
    updateLinksAfterPageDelete(deletedPageId) {
        this.projectData.pages.forEach(page => {
            page.elements.forEach(element => {
                if (element.type === 'button' && element.link && element.link.pageId === deletedPageId) {
                    element.link = null;
                }
            });
        });
    }

    /**
     * Aggiorna i link dopo la rinomina di una pagina
     */
    updateLinksAfterPageRename(oldName, newName) {
        this.projectData.pages.forEach(page => {
            page.elements.forEach(element => {
                if (element.link && element.link.type === 'internal' && element.link.href === oldName) {
                    element.link.href = newName;
                }
            });
        });

        // Update component links too
        this.projectData.components.forEach(component => {
            component.elements.forEach(element => {
                if (element.link && element.link.type === 'internal' && element.link.href === oldName) {
                    element.link.href = newName;
                }
            });
        });
    }

    /**
     * Aggiunge un'immagine al progetto
     */
    addImage(fileName, blob) {
        this.images.set(fileName, blob);
        this.markModified();
    }

    /**
     * Ottiene un'immagine
     */
    getImage(fileName) {
        return this.images.get(fileName);
    }

    /**
     * Ottiene tutte le immagini
     */
    getAllImages() {
        return this.images;
    }

    /**
     * Calcola il peso totale del progetto
     */
    calculateProjectSize() {
        const jsonSize = new Blob([JSON.stringify(this.projectData)]).size;
        let imagesSize = 0;

        this.images.forEach(blob => {
            imagesSize += blob.size;
        });

        return {
            json: jsonSize,
            images: imagesSize,
            total: jsonSize + imagesSize
        };
    }

    /**
     * Formatta la dimensione in formato leggibile
     */
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    /**
     * Valida che il progetto non superi il limite
     */
    validateSize() {
        const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
        const sizes = this.calculateProjectSize();

        if (sizes.total > MAX_SIZE) {
            throw new Error(`Il progetto supera il limite di 25 MB (attuale: ${this.formatSize(sizes.total)})`);
        }

        return sizes;
    }

    /**
     * Marca il progetto come modificato
     */
    markModified() {
        this.projectModified = true;
        this.projectData.meta.modified = new Date().toISOString();
    }

    /**
     * Verifica se il progetto è stato modificato
     */
    isModified() {
        return this.projectModified;
    }

    /**
     * Event listener system
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    /**
     * Salva il progetto in JSON
     */
    async saveProject() {
        try {
            // Validate size before saving
            this.validateSize();

            const projectToSave = {
                ...this.projectData,
                imagesManifest: Array.from(this.images.keys())
            };

            const json = JSON.stringify(projectToSave, null, 2);
            const blob = new Blob([json], { type: 'application/json' });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.projectData.meta.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.projectModified = false;
            return true;
        } catch (error) {
            console.error('Errore nel salvataggio:', error);
            throw error;
        }
    }

    /**
     * Carica un progetto da JSON
     */
    async loadProject(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            // Validate structure
            if (!data.pages || !Array.isArray(data.pages)) {
                throw new Error('Struttura progetto non valida');
            }

            this.projectData = data;
            this.projectModified = false;

            this.emit('projectLoaded', this.projectData);

            return true;
        } catch (error) {
            console.error('Errore nel caricamento:', error);
            throw error;
        }
    }

    /**
     * Crea un nuovo progetto
     */
    newProject() {
        this.projectData = this.getDefaultProject();
        this.images.clear();
        this.projectModified = false;
        this.emit('projectReset');
    }
}
