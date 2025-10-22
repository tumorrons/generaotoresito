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
                const tabName = tab.dataset.tab;
                const container = tab.closest('.sidebar');

                // Remove active from all tabs and panels
                container.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
                container.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));

                // Add active to clicked tab and corresponding panel
                tab.classList.add('active');
                container.querySelector(`#${tabName}Panel`)?.classList.add('active');
            });
        });
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
}
