/**
 * UIController - Gestisce l'interfaccia utente
 */

export class UIController {
    constructor(app) {
        this.app = app;
        this.modals = {};
    }

    /**
     * Inizializza l'UI
     */
    init() {
        this.setupModals();
        this.setupTabs();
        this.setupToolbar();
        this.renderPagesList();
        this.renderComponentsList();
        this.updateFileWeight();
    }

    /**
     * Setup modali
     */
    setupModals() {
        // Trova tutti i modal
        document.querySelectorAll('.modal').forEach(modal => {
            this.modals[modal.id] = modal;

            // Setup close buttons
            modal.querySelectorAll('.modal-close, [data-dismiss="modal"]').forEach(btn => {
                btn.addEventListener('click', () => this.closeModal(modal.id));
            });

            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    /**
     * Apre un modal
     */
    openModal(modalId) {
        const modal = this.modals[modalId];
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Chiude un modal
     */
    closeModal(modalId) {
        const modal = this.modals[modalId];
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Setup tabs
     */
    setupTabs() {
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab, tab.closest('.sidebar'));
            });
        });
    }

    /**
     * Cambia tab programmaticamente
     */
    switchTab(tabName, sidebar = null) {
        // Se non è specificata la sidebar, cerca quella sinistra
        if (!sidebar) {
            sidebar = document.querySelector('.sidebar-left');
        }

        // Remove active from all tabs and panels
        sidebar.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
        sidebar.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));

        // Add active to clicked tab and corresponding panel
        const targetTab = sidebar.querySelector(`[data-tab="${tabName}"]`);
        const targetPanel = sidebar.querySelector(`#${tabName}Panel`);

        if (targetTab) targetTab.classList.add('active');
        if (targetPanel) targetPanel.classList.add('active');
    }

    /**
     * Setup toolbar
     */
    setupToolbar() {
        // Undo/Redo buttons
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.app.historyManager.undo();
            this.app.canvasManager.render();
            this.updateHistoryButtons();
        });

        document.getElementById('redoBtn').addEventListener('click', () => {
            this.app.historyManager.redo();
            this.app.canvasManager.render();
            this.updateHistoryButtons();
        });

        // Tool buttons
        document.getElementById('addTextBtn').addEventListener('click', () => {
            this.app.canvasManager.addElement('text');
            this.app.canvasManager.render();
        });

        document.getElementById('addImageBtn').addEventListener('click', () => {
            document.getElementById('imageUploadInput').click();
        });

        document.getElementById('imageUploadInput').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        document.getElementById('addSectionBtn').addEventListener('click', () => {
            this.app.canvasManager.addElement('section');
            this.app.canvasManager.render();
        });

        document.getElementById('addButtonBtn').addEventListener('click', () => {
            this.app.canvasManager.addElement('button');
            this.app.canvasManager.render();
        });

        // Layer tools
        document.getElementById('bringToFrontBtn').addEventListener('click', () => {
            const selected = Array.from(this.app.canvasManager.selectedElements)[0];
            if (selected) {
                this.app.layerManager.bringToFront(this.app.canvasManager.currentPageId, selected);
                this.app.canvasManager.render();
            }
        });

        document.getElementById('sendToBackBtn').addEventListener('click', () => {
            const selected = Array.from(this.app.canvasManager.selectedElements)[0];
            if (selected) {
                this.app.layerManager.sendToBack(this.app.canvasManager.currentPageId, selected);
                this.app.canvasManager.render();
            }
        });

        // Delete button
        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.app.canvasManager.deleteSelected();
        });
    }

    /**
     * Renderizza la lista delle pagine
     */
    renderPagesList() {
        const container = document.getElementById('pagesList');
        const pages = this.app.dataManager.getPages();

        container.innerHTML = pages.map(page => `
            <div class="page-item ${page.isHome ? 'active' : ''}" data-page-id="${page.id}">
                <div class="page-item-info">
                    <div class="page-item-name">${page.name}</div>
                    <div class="page-item-title">${page.title}</div>
                </div>
                <div class="page-item-actions">
                    <button class="page-item-btn" onclick="window.app.ui.editPage('${page.id}')">✏️</button>
                    <button class="page-item-btn" onclick="window.app.ui.deletePage('${page.id}')">🗑️</button>
                </div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.page-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.page-item-actions')) {
                    const pageId = item.dataset.pageId;
                    this.loadPage(pageId);
                }
            });
        });
    }

    /**
     * Carica una pagina
     */
    loadPage(pageId) {
        this.app.canvasManager.loadPage(pageId);

        // Update active state
        document.querySelectorAll('.page-item').forEach(item => {
            item.classList.toggle('active', item.dataset.pageId === pageId);
        });
    }

    /**
     * Renderizza la lista dei componenti
     */
    renderComponentsList() {
        const container = document.getElementById('componentsList');

        if (!container) {
            console.error('Container componentsList non trovato!');
            return;
        }

        const components = this.app.componentManager.getComponents();

        console.log('Rendering components list:', components.length, 'components');

        if (components.length === 0) {
            container.innerHTML = '<p class="empty-state">Nessun componente condiviso. Crea il tuo primo componente!</p>';
            return;
        }

        container.innerHTML = components.map(component => `
            <div class="component-item" data-component-id="${component.id}">
                <div class="component-item-info">
                    <div class="component-item-name">${component.name}</div>
                    <div class="component-item-type">${this.getComponentTypeLabel(component.type)}</div>
                </div>
                <div class="page-item-actions">
                    <button class="page-item-btn" onclick="window.app.ui.addComponentToCurrentPage('${component.id}')" title="Aggiungi alla pagina">➕</button>
                    <button class="page-item-btn" onclick="window.app.ui.editComponent('${component.id}')" title="Modifica">✏️</button>
                    <button class="page-item-btn" onclick="window.app.ui.deleteComponent('${component.id}')" title="Elimina">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Ottiene l'etichetta del tipo di componente
     */
    getComponentTypeLabel(type) {
        const labels = {
            'header': '📄 Header',
            'menu': '🔗 Menu',
            'footer': '📌 Footer',
            'custom': '🎨 Personalizzato'
        };
        return labels[type] || type;
    }

    /**
     * Aggiunge un componente alla pagina corrente
     */
    addComponentToCurrentPage(componentId) {
        const currentPage = this.app.canvasManager.currentPageId;

        if (!currentPage) {
            this.showNotification('Seleziona prima una pagina', 'error');
            return;
        }

        // Aggiungi il componente al centro del canvas
        const position = { x: 100, y: 100 };
        const instance = this.app.componentManager.addComponentToPage(currentPage, componentId, position);

        if (instance) {
            this.app.canvasManager.render();
            this.showNotification('Componente aggiunto alla pagina', 'success');
        } else {
            this.showNotification('Errore nell\'aggiunta del componente', 'error');
        }
    }

    /**
     * Modifica un componente
     */
    editComponent(componentId) {
        // Carica il componente nel canvas manager in modalità editing
        this.app.canvasManager.loadComponent(componentId);
        this.showNotification('Modalità editing componente', 'info');

        // Cambia al canvas per mostrare l'editor
        // (L'utente può tornare alla pagina cliccando su una pagina nel pannello)
    }

    /**
     * Elimina un componente
     */
    deleteComponent(componentId) {
        if (confirm('Sei sicuro di voler eliminare questo componente?')) {
            this.app.componentManager.deleteComponent(componentId);
            this.renderComponentsList();
            this.showNotification('Componente eliminato', 'success');
        }
    }

    /**
     * Gestisce upload immagini
     */
    async handleImageUpload(e) {
        const files = e.target.files;
        if (!files.length) return;

        try {
            const images = await this.app.imageManager.loadImages(files);

            images.forEach(img => {
                this.app.canvasManager.addElement('image', {
                    src: img.fileName,
                    width: Math.min(img.dimensions.width, 400),
                    height: Math.min(img.dimensions.height, 300)
                });
            });

            this.app.canvasManager.render();
            this.showNotification('Immagini caricate con successo', 'success');
        } catch (error) {
            this.showNotification('Errore nel caricamento: ' + error.message, 'error');
        }

        e.target.value = '';
    }

    /**
     * Mostra notifica
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Aggiorna i pulsanti history
     */
    updateHistoryButtons() {
        document.getElementById('undoBtn').disabled = !this.app.historyManager.canUndo();
        document.getElementById('redoBtn').disabled = !this.app.historyManager.canRedo();
    }

    /**
     * Aggiorna l'indicatore del peso
     */
    updateFileWeight() {
        const sizes = this.app.dataManager.calculateProjectSize();
        const label = document.getElementById('fileWeightLabel');
        label.textContent = `Peso: ${this.app.dataManager.formatSize(sizes.total)}`;

        // Warning se supera un certo limite
        if (sizes.total > 20 * 1024 * 1024) {
            label.style.color = '#f59e0b';
        } else {
            label.style.color = 'white';
        }
    }

    /**
     * Elimina una pagina
     */
    deletePage(pageId) {
        if (confirm('Sei sicuro di voler eliminare questa pagina?')) {
            try {
                this.app.dataManager.deletePage(pageId);
                this.renderPagesList();
                this.showNotification('Pagina eliminata', 'success');
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        }
    }

    /**
     * Modifica una pagina
     */
    editPage(pageId) {
        this.loadPage(pageId);
    }

    /**
     * Mostra le proprietà di un elemento
     */
    showElementProperties(element) {
        const container = document.getElementById('propertiesContent');
        if (!container) return;

        if (!element) {
            container.innerHTML = '<p class="empty-state">Seleziona un elemento per modificarne le proprietà</p>';
            return;
        }

        // Ottieni le pagine per il dropdown link interni
        const pages = this.app.dataManager.getPages();

        const html = `
            <div class="property-group">
                <h4>Elemento: ${this.getElementTypeLabel(element.type)}</h4>
            </div>

            <div class="property-group">
                <label>Posizione</label>
                <div class="property-row">
                    <div class="property-field">
                        <label>X</label>
                        <input type="number" id="prop-x" value="${element.x || 0}" />
                    </div>
                    <div class="property-field">
                        <label>Y</label>
                        <input type="number" id="prop-y" value="${element.y || 0}" />
                    </div>
                </div>
            </div>

            <div class="property-group">
                <label>Dimensioni</label>
                <div class="property-row">
                    <div class="property-field">
                        <label>Larghezza</label>
                        <input type="number" id="prop-width" value="${element.width || 0}" />
                    </div>
                    <div class="property-field">
                        <label>Altezza</label>
                        <input type="number" id="prop-height" value="${element.height || 0}" />
                    </div>
                </div>
            </div>

            ${element.type !== 'component-instance' ? `
            <div class="property-group">
                <h4>Link</h4>
                <div class="property-field">
                    <label>Tipo Link</label>
                    <select id="prop-link-type">
                        <option value="none" ${!element.link ? 'selected' : ''}>Nessun Link</option>
                        <option value="internal" ${element.link?.type === 'internal' ? 'selected' : ''}>Pagina Interna</option>
                        <option value="external" ${element.link?.type === 'external' ? 'selected' : ''}>URL Esterno</option>
                    </select>
                </div>

                <div class="property-field" id="link-internal-field" style="display: ${element.link?.type === 'internal' ? 'block' : 'none'};">
                    <label>Pagina</label>
                    <select id="prop-link-page">
                        <option value="">Seleziona pagina</option>
                        ${pages.map(p => `<option value="${p.name}" ${element.link?.href === p.name ? 'selected' : ''}>${p.title || p.name}</option>`).join('')}
                    </select>
                </div>

                <div class="property-field" id="link-external-field" style="display: ${element.link?.type === 'external' ? 'block' : 'none'};">
                    <label>URL</label>
                    <input type="url" id="prop-link-url" value="${element.link?.url || ''}" placeholder="https://example.com" />
                </div>
            </div>
            ` : ''}

            <div class="property-actions">
                <button class="btn btn-primary" id="apply-properties">Applica</button>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        document.getElementById('prop-link-type')?.addEventListener('change', (e) => {
            const type = e.target.value;
            document.getElementById('link-internal-field').style.display = type === 'internal' ? 'block' : 'none';
            document.getElementById('link-external-field').style.display = type === 'external' ? 'block' : 'none';
        });

        document.getElementById('apply-properties')?.addEventListener('click', () => {
            this.applyElementProperties(element);
        });
    }

    /**
     * Applica le modifiche alle proprietà dell'elemento
     */
    applyElementProperties(element) {
        const updates = {
            x: parseInt(document.getElementById('prop-x').value),
            y: parseInt(document.getElementById('prop-y').value),
            width: parseInt(document.getElementById('prop-width').value),
            height: parseInt(document.getElementById('prop-height').value)
        };

        // Gestione link
        const linkType = document.getElementById('prop-link-type')?.value;
        if (linkType === 'none') {
            updates.link = null;
        } else if (linkType === 'internal') {
            const page = document.getElementById('prop-link-page').value;
            if (page) {
                updates.link = { type: 'internal', href: page };
            }
        } else if (linkType === 'external') {
            const url = document.getElementById('prop-link-url').value;
            if (url) {
                updates.link = { type: 'external', url };
            }
        }

        // Aggiorna l'elemento
        if (this.app.canvasManager.currentPageId) {
            this.app.dataManager.updateElement(this.app.canvasManager.currentPageId, element.id, updates);
        } else if (this.app.canvasManager.currentComponentId) {
            this.app.componentManager.updateComponentElement(this.app.canvasManager.currentComponentId, element.id, updates);
        }

        this.app.canvasManager.render();
        this.showNotification('Proprietà aggiornate', 'success');
    }

    /**
     * Ottiene l'etichetta del tipo di elemento
     */
    getElementTypeLabel(type) {
        const labels = {
            'text': '📝 Testo',
            'image': '🖼 Immagine',
            'button': '⏺ Pulsante',
            'section': '📦 Sezione',
            'component-instance': '🎨 Componente'
        };
        return labels[type] || type;
    }
}
