/**
 * CanvasManager - Gestisce il canvas, drag & drop, selezione elementi
 */

export class CanvasManager {
    constructor(dataManager, historyManager, layerManager, imageManager) {
        this.dataManager = dataManager;
        this.historyManager = historyManager;
        this.layerManager = layerManager;
        this.imageManager = imageManager;

        this.currentPageId = null;
        this.selectedElements = new Set();
        this.isDragging = false;
        this.isResizing = false;
        this.dragStartPos = null;
        this.resizeHandle = null;

        this.canvas = null;
        this.snapThreshold = 10;
        this.gridSize = 10;
        this.showGrid = false;
    }

    /**
     * Inizializza il canvas
     */
    init(canvasElement) {
        this.canvas = canvasElement;
        this.setupEventListeners();
    }

    /**
     * Imposta i listener per gli eventi
     */
    setupEventListeners() {
        if (!this.canvas) return;

        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * Carica una pagina nel canvas
     */
    loadPage(pageId) {
        this.currentPageId = pageId;
        this.selectedElements.clear();
        this.render();
    }

    /**
     * Renderizza il canvas
     */
    render() {
        if (!this.canvas || !this.currentPageId) return;

        const page = this.dataManager.getPage(this.currentPageId);
        if (!page) return;

        // Clear canvas
        this.canvas.innerHTML = '';

        // Apply background
        this.applyBackground(page.background);

        // Calculate Y offset for elements
        this.calculateYOffset(page);

        // Render elements sorted by z-index
        const sortedElements = this.layerManager.getLayersSorted(this.currentPageId);

        sortedElements.reverse().forEach(element => {
            const elementDiv = this.createElement(element);
            this.canvas.appendChild(elementDiv);
        });

        // Adjust canvas height based on content
        this.adjustCanvasHeight(page);
    }

    /**
     * Applica lo sfondo al canvas
     */
    applyBackground(background) {
        if (!background) return;

        switch (background.type) {
            case 'color':
                this.canvas.style.background = background.value;
                break;
            case 'gradient':
                this.canvas.style.background = background.gradient;
                break;
            case 'image':
                if (background.image) {
                    this.canvas.style.backgroundImage = `url(${background.image})`;
                    this.canvas.style.backgroundSize = 'cover';
                }
                break;
        }
    }

    /**
     * Calcola l'offset Y necessario per gli elementi
     */
    calculateYOffset(page) {
        this.yOffset = 0;

        if (!page.elements || page.elements.length === 0) {
            return;
        }

        const MARGIN = 50;
        let minTop = 0;

        page.elements.forEach(element => {
            const top = element.y || 0;
            if (top < minTop) {
                minTop = top;
            }
        });

        // Se ci sono elementi sopra lo 0, calcola l'offset
        if (minTop < MARGIN) {
            this.yOffset = Math.abs(minTop) + MARGIN;
        }
    }

    /**
     * Aggiusta l'altezza del canvas in base al contenuto
     */
    adjustCanvasHeight(page) {
        if (!page.elements || page.elements.length === 0) {
            this.canvas.style.height = '800px';
            return;
        }

        const MARGIN = 50;

        // Trova il punto più basso tra tutti gli elementi (considerando l'offset)
        let maxBottom = 800;

        page.elements.forEach(element => {
            const adjustedY = (element.y || 0) + this.yOffset;
            const bottom = adjustedY + (element.height || 0);

            if (bottom > maxBottom) {
                maxBottom = bottom;
            }
        });

        this.canvas.style.height = `${maxBottom + MARGIN}px`;
    }

    /**
     * Crea un elemento DOM per il canvas
     */
    createElement(element) {
        const div = document.createElement('div');
        div.className = 'canvas-element';
        div.dataset.id = element.id;
        div.dataset.type = element.type;

        // Applica l'offset Y per visualizzare elementi che vanno sopra lo 0
        const adjustedY = (element.y || 0) + (this.yOffset || 0);

        div.style.left = `${element.x}px`;
        div.style.top = `${adjustedY}px`;
        div.style.width = `${element.width}px`;
        div.style.height = `${element.height}px`;
        div.style.zIndex = element.zIndex || 0;

        if (element.locked) {
            div.classList.add('locked');
        }

        if (this.selectedElements.has(element.id)) {
            div.classList.add('selected');
        }

        // Render content based on type
        this.renderElementContent(div, element);

        // Add resize handles
        if (this.selectedElements.has(element.id) && !element.locked) {
            this.addResizeHandles(div);
        }

        return div;
    }

    /**
     * Renderizza il contenuto dell'elemento
     */
    renderElementContent(div, element) {
        switch (element.type) {
            case 'text':
                div.classList.add('element-text');
                div.textContent = element.text || 'Testo';
                div.style.fontSize = `${element.fontSize || 16}px`;
                div.style.color = element.color || '#000000';
                div.style.fontFamily = element.fontFamily || 'Arial';
                break;

            case 'image':
                div.classList.add('element-image');
                const img = document.createElement('img');
                // Get the object URL from ImageManager
                const imageUrl = this.imageManager.getImageUrl(element.src);
                img.src = imageUrl || element.src || '';
                img.alt = element.alt || '';
                div.appendChild(img);
                break;

            case 'button':
                div.classList.add('element-button');
                div.textContent = element.text || 'Button';
                div.style.backgroundColor = element.bgColor || '#2563eb';
                div.style.color = element.textColor || '#ffffff';
                div.style.fontSize = `${element.fontSize || 14}px`;
                break;

            case 'section':
                div.classList.add('element-section');
                div.style.backgroundColor = element.bgColor || 'transparent';
                break;
        }
    }

    /**
     * Aggiunge i resize handles
     */
    addResizeHandles(div) {
        const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        handles.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.dataset.handle = pos;
            div.appendChild(handle);
        });
    }

    /**
     * Gestisce il click sul canvas
     */
    handleClick(e) {
        const target = e.target.closest('.canvas-element');

        if (!target) {
            this.selectedElements.clear();
            this.render();
            return;
        }

        const elementId = target.dataset.id;

        if (e.ctrlKey || e.metaKey) {
            // Multi-selection
            if (this.selectedElements.has(elementId)) {
                this.selectedElements.delete(elementId);
            } else {
                this.selectedElements.add(elementId);
            }
        } else {
            this.selectedElements.clear();
            this.selectedElements.add(elementId);
        }

        this.render();
    }

    /**
     * Gestisce il mouse down
     */
    handleMouseDown(e) {
        const handle = e.target.closest('.resize-handle');
        const element = e.target.closest('.canvas-element');

        if (handle) {
            this.startResize(e, handle, element);
        } else if (element) {
            this.startDrag(e, element);
        }
    }

    /**
     * Inizia il drag
     */
    startDrag(e, element) {
        const elementId = element.dataset.id;
        const page = this.dataManager.getPage(this.currentPageId);
        const el = page.elements.find(e => e.id === elementId);

        if (el && el.locked) return;

        this.isDragging = true;

        // Ottieni le coordinate relative al canvas
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        // Salva l'offset del mouse rispetto alla posizione visuale dell'elemento
        const adjustedY = el.y + (this.yOffset || 0);

        this.dragStartPos = {
            x: canvasX - el.x,
            y: canvasY - adjustedY
        };
    }

    /**
     * Inizia il resize
     */
    startResize(e, handle, element) {
        this.isResizing = true;
        this.resizeHandle = handle.dataset.handle;
        this.dragStartPos = { x: e.clientX, y: e.clientY };
    }

    /**
     * Gestisce il mouse move
     */
    handleMouseMove(e) {
        if (this.isDragging) {
            this.drag(e);
        } else if (this.isResizing) {
            this.resize(e);
        }
    }

    /**
     * Gestisce il drag
     */
    drag(e) {
        if (!this.isDragging || this.selectedElements.size === 0) return;

        const elementId = Array.from(this.selectedElements)[0];

        // Coordinate relative al canvas
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;

        // Calcola la nuova posizione
        let newX = canvasX - this.dragStartPos.x;
        let newY = canvasY - this.dragStartPos.y;

        // Rimuovi l'offset Y per salvare la posizione reale nei dati
        newY = newY - (this.yOffset || 0);

        // Snap to grid if enabled
        const snappedX = this.showGrid ? Math.round(newX / this.gridSize) * this.gridSize : newX;
        const snappedY = this.showGrid ? Math.round(newY / this.gridSize) * this.gridSize : newY;

        this.dataManager.updateElement(this.currentPageId, elementId, {
            x: snappedX,
            y: snappedY
        });

        this.render();
    }

    /**
     * Gestisce il resize
     */
    resize(e) {
        // Simplified resize implementation
        // Full implementation would handle all 8 resize handles
    }

    /**
     * Gestisce il mouse up
     */
    handleMouseUp(e) {
        this.isDragging = false;
        this.isResizing = false;
        this.dragStartPos = null;
        this.resizeHandle = null;
    }

    /**
     * Gestisce i tasti da tastiera
     */
    handleKeyDown(e) {
        if (this.selectedElements.size === 0) return;

        const elementId = Array.from(this.selectedElements)[0];

        // Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            this.deleteSelected();
        }

        // Copy
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            this.copySelected();
        }

        // Paste
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            this.paste();
        }

        // Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.historyManager.undo();
            this.render();
        }

        // Redo
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            this.historyManager.redo();
            this.render();
        }
    }

    /**
     * Elimina gli elementi selezionati
     */
    deleteSelected() {
        this.selectedElements.forEach(elementId => {
            this.dataManager.deleteElement(this.currentPageId, elementId);
        });

        this.selectedElements.clear();
        this.render();
    }

    /**
     * Copia gli elementi selezionati
     */
    copySelected() {
        const page = this.dataManager.getPage(this.currentPageId);
        const elements = Array.from(this.selectedElements).map(id =>
            page.elements.find(el => el.id === id)
        );

        this.clipboard = JSON.stringify(elements);
    }

    /**
     * Incolla gli elementi copiati
     */
    paste() {
        if (!this.clipboard) return;

        const elements = JSON.parse(this.clipboard);
        elements.forEach(el => {
            this.dataManager.addElement(this.currentPageId, {
                ...el,
                x: el.x + 20,
                y: el.y + 20
            });
        });

        this.render();
    }

    /**
     * Aggiunge un nuovo elemento
     */
    addElement(type, properties = {}) {
        const defaultProps = {
            text: { type: 'text', width: 200, height: 40, text: 'Nuovo testo', fontSize: 16 },
            image: { type: 'image', width: 300, height: 200, src: '' },
            button: { type: 'button', width: 150, height: 40, text: 'Pulsante' },
            section: { type: 'section', width: 400, height: 300 }
        };

        const element = {
            ...defaultProps[type],
            ...properties,
            x: properties.x || 50,
            y: properties.y || 50
        };

        return this.dataManager.addElement(this.currentPageId, element);
    }
}
