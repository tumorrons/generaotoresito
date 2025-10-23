/**
 * CanvasManager - Gestisce il canvas, drag & drop, selezione elementi
 */

export class CanvasManager {
    constructor(dataManager, historyManager, layerManager, imageManager, componentManager) {
        this.dataManager = dataManager;
        this.historyManager = historyManager;
        this.layerManager = layerManager;
        this.imageManager = imageManager;
        this.componentManager = componentManager;

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
        this.zoomLevel = 1; // 1 = 100%
        this.canvasWidth = 1200; // Default width
        this.canvasHeight = 800; // Default height
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
        this.canvas.addEventListener('click', this.handleClick.bind(this));

        // Mouse move e up su document per catturare eventi anche fuori dal canvas
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * Carica una pagina nel canvas
     */
    loadPage(pageId) {
        this.currentPageId = pageId;
        this.currentComponentId = null; // Reset component editing mode
        this.selectedElements.clear();

        // Carica le dimensioni della pagina se presenti
        const page = this.dataManager.getPage(pageId);
        if (page) {
            const width = page.canvasWidth || 1200;
            const height = page.canvasHeight || 800;
            this.canvasWidth = width;
            this.canvasHeight = height;

            if (this.canvas) {
                this.canvas.style.width = `${width}px`;
                this.canvas.style.minHeight = `${height}px`;
            }
        }

        this.render();
    }

    /**
     * Carica un componente per l'editing
     */
    loadComponent(componentId) {
        this.currentComponentId = componentId;
        this.currentPageId = null; // Reset page mode
        this.selectedElements.clear();
        this.renderComponent();
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
     * Renderizza il componente in modalità editing
     */
    renderComponent() {
        if (!this.canvas || !this.currentComponentId) return;

        const component = this.componentManager.getComponent(this.currentComponentId);
        if (!component) return;

        // Clear canvas
        this.canvas.innerHTML = '';

        // Add component editing header
        const header = document.createElement('div');
        header.className = 'component-editing-header';
        header.innerHTML = `
            <div style="background: #3b82f6; color: white; padding: 12px 20px; margin: -40px -40px 20px -40px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">${this.getComponentIcon(component.type)}</span>
                <span>Modifica Componente: ${component.name}</span>
                <span style="margin-left: auto; font-size: 12px; opacity: 0.9;">Aggiungi elementi usando la toolbar sopra</span>
            </div>
        `;
        this.canvas.appendChild(header);

        // Apply neutral background
        this.canvas.style.background = '#ffffff';

        // Calculate Y offset for elements (treat component like a page)
        const fakeComponent = { elements: component.elements || [] };
        this.calculateYOffset(fakeComponent);

        // Render elements
        if (component.elements && component.elements.length > 0) {
            // Sort by z-index
            const sortedElements = [...component.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

            sortedElements.reverse().forEach(element => {
                const elementDiv = this.createElement(element);
                this.canvas.appendChild(elementDiv);
            });

            this.adjustCanvasHeight(fakeComponent);
        } else {
            // Show placeholder for empty component
            const placeholder = document.createElement('div');
            placeholder.className = 'canvas-placeholder';
            placeholder.innerHTML = `
                <p>Componente vuoto</p>
                <p class="sub-text">Aggiungi elementi usando la toolbar sopra (testo, immagini, pulsanti, sezioni)</p>
            `;
            this.canvas.appendChild(placeholder);
            this.canvas.style.height = '800px';
        }
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

            case 'component-instance':
                div.classList.add('element-component');
                const component = this.componentManager.getComponent(element.componentId);

                if (component) {
                    // Renderizza gli elementi del componente
                    const componentsContainer = document.createElement('div');
                    componentsContainer.className = 'component-elements';
                    componentsContainer.style.pointerEvents = 'none'; // Permetti click attraverso gli elementi

                    if (component.elements && component.elements.length > 0) {
                        component.elements.forEach(compElement => {
                            const elementDiv = this.createComponentElement(compElement, element.overrides);
                            componentsContainer.appendChild(elementDiv);
                        });
                    } else {
                        componentsContainer.innerHTML = '<p style="padding: 10px; color: #999; text-align: center;">Componente vuoto<br><small>Clicca ✏️ per modificare</small></p>';
                    }

                    div.appendChild(componentsContainer);

                    // Badge identificativo (visibile solo quando selezionato o in hover)
                    const badge = document.createElement('div');
                    badge.className = 'component-badge';
                    badge.innerHTML = `${this.getComponentIcon(component.type)} ${component.name}`;
                    div.appendChild(badge);
                } else {
                    div.innerHTML = '<p style="padding: 10px; color: red;">Componente non trovato</p>';
                }

                // Nessun bordo/background di default - invisibile
                div.style.border = 'none';
                div.style.backgroundColor = 'transparent';
                div.style.overflow = 'visible';
                break;
        }
    }

    /**
     * Ottiene l'icona del tipo di componente
     */
    getComponentIcon(type) {
        const icons = {
            'header': '📄',
            'menu': '🔗',
            'footer': '📌',
            'custom': '🎨'
        };
        return icons[type] || '🎨';
    }

    /**
     * Crea un elemento figlio del componente
     */
    createComponentElement(element, overrides = {}) {
        const div = document.createElement('div');
        div.className = 'component-child-element';
        div.style.position = 'relative';
        div.style.margin = '5px';
        div.style.padding = '5px';
        div.style.border = '1px solid #e5e7eb';
        div.style.borderRadius = '4px';
        div.style.backgroundColor = 'white';

        // Applica override se presenti
        const finalElement = { ...element, ...(overrides[element.id] || {}) };

        // Renderizza in base al tipo
        switch (finalElement.type) {
            case 'text':
                div.textContent = finalElement.text || 'Testo';
                div.style.fontSize = `${finalElement.fontSize || 14}px`;
                div.style.color = finalElement.color || '#000000';
                break;

            case 'image':
                const img = document.createElement('img');
                const imageUrl = this.imageManager.getImageUrl(finalElement.src);
                img.src = imageUrl || finalElement.src || '';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                div.appendChild(img);
                break;

            case 'button':
                div.textContent = finalElement.text || 'Button';
                div.style.backgroundColor = finalElement.bgColor || '#2563eb';
                div.style.color = finalElement.textColor || '#ffffff';
                div.style.padding = '8px 16px';
                div.style.borderRadius = '6px';
                div.style.textAlign = 'center';
                break;

            case 'section':
                div.style.backgroundColor = finalElement.bgColor || '#f3f4f6';
                div.style.minHeight = '50px';
                div.textContent = 'Sezione';
                break;
        }

        return div;
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
            // Notifica UIController che nessun elemento è selezionato
            if (this.onSelectionChange) {
                this.onSelectionChange(null);
            }
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

        // Notifica UIController che un elemento è selezionato
        if (this.onSelectionChange && this.selectedElements.size === 1) {
            const element = this.getSelectedElement();
            if (element) {
                this.onSelectionChange(element);
            }
        }
    }

    /**
     * Ottiene l'elemento selezionato (se solo uno)
     */
    getSelectedElement() {
        if (this.selectedElements.size !== 1) return null;

        const elementId = Array.from(this.selectedElements)[0];

        // Cerca nelle pagine o nei componenti
        if (this.currentPageId) {
            const page = this.dataManager.getPage(this.currentPageId);
            return page?.elements.find(el => el.id === elementId);
        } else if (this.currentComponentId) {
            const component = this.componentManager.getComponent(this.currentComponentId);
            return component?.elements.find(el => el.id === elementId);
        }

        return null;
    }

    /**
     * Gestisce il mouse down
     */
    handleMouseDown(e) {
        const handle = e.target.closest('.resize-handle');
        const element = e.target.closest('.canvas-element');

        console.log('👆 handleMouseDown', {
            target: e.target.className,
            hasHandle: !!handle,
            hasElement: !!element
        });

        if (handle) {
            console.log('✅ Handle trovato, avvio resize');
            e.preventDefault();
            e.stopPropagation();
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

        // Ottieni le coordinate relative al canvas (considera lo zoom)
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left) / this.zoomLevel;
        const canvasY = (e.clientY - rect.top) / this.zoomLevel;

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
        console.log('🔧 startResize chiamato', {
            handle: handle.dataset.handle,
            element: element.dataset.id
        });

        this.isResizing = true;
        this.resizeHandle = handle.dataset.handle;
        this.dragStartPos = { x: e.clientX, y: e.clientY };

        // Seleziona l'elemento se non lo è già
        const elementId = element.dataset.id;
        if (!this.selectedElements.has(elementId)) {
            this.selectedElements.clear();
            this.selectedElements.add(elementId);
            this.render();
        }
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

        // Coordinate relative al canvas (considera lo zoom)
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left) / this.zoomLevel;
        const canvasY = (e.clientY - rect.top) / this.zoomLevel;

        // Calcola la nuova posizione
        let newX = canvasX - this.dragStartPos.x;
        let newY = canvasY - this.dragStartPos.y;

        // Rimuovi l'offset Y per salvare la posizione reale nei dati
        newY = newY - (this.yOffset || 0);

        // Snap to grid if enabled
        const snappedX = this.showGrid ? Math.round(newX / this.gridSize) * this.gridSize : newX;
        const snappedY = this.showGrid ? Math.round(newY / this.gridSize) * this.gridSize : newY;

        // Update in component or page
        if (this.currentComponentId) {
            this.componentManager.updateComponentElement(this.currentComponentId, elementId, {
                x: snappedX,
                y: snappedY
            });
            this.renderComponent();
        } else {
            this.dataManager.updateElement(this.currentPageId, elementId, {
                x: snappedX,
                y: snappedY
            });
            this.render();
        }
    }

    /**
     * Gestisce il resize
     */
    resize(e) {
        if (!this.isResizing || this.selectedElements.size === 0) return;

        const elementId = Array.from(this.selectedElements)[0];

        // Ottieni l'elemento
        let element;
        if (this.currentPageId) {
            const page = this.dataManager.getPage(this.currentPageId);
            element = page?.elements.find(el => el.id === elementId);
        } else if (this.currentComponentId) {
            const component = this.componentManager.getComponent(this.currentComponentId);
            element = component?.elements.find(el => el.id === elementId);
        }

        if (!element) return;

        // Calcola il delta del movimento (considera lo zoom)
        const deltaX = (e.clientX - this.dragStartPos.x) / this.zoomLevel;
        const deltaY = (e.clientY - this.dragStartPos.y) / this.zoomLevel;

        // Valori originali
        const originalX = element.x || 0;
        const originalY = element.y || 0;
        const originalWidth = element.width || 100;
        const originalHeight = element.height || 100;

        // Nuovi valori (inizialmente uguali agli originali)
        let newX = originalX;
        let newY = originalY;
        let newWidth = originalWidth;
        let newHeight = originalHeight;

        // Applica il ridimensionamento in base all'handle
        switch (this.resizeHandle) {
            case 'nw': // Nord-Ovest
                newX = originalX + deltaX;
                newY = originalY + deltaY;
                newWidth = originalWidth - deltaX;
                newHeight = originalHeight - deltaY;
                break;

            case 'n': // Nord
                newY = originalY + deltaY;
                newHeight = originalHeight - deltaY;
                break;

            case 'ne': // Nord-Est
                newY = originalY + deltaY;
                newWidth = originalWidth + deltaX;
                newHeight = originalHeight - deltaY;
                break;

            case 'e': // Est
                newWidth = originalWidth + deltaX;
                break;

            case 'se': // Sud-Est
                newWidth = originalWidth + deltaX;
                newHeight = originalHeight + deltaY;
                break;

            case 's': // Sud
                newHeight = originalHeight + deltaY;
                break;

            case 'sw': // Sud-Ovest
                newX = originalX + deltaX;
                newWidth = originalWidth - deltaX;
                newHeight = originalHeight + deltaY;
                break;

            case 'w': // Ovest
                newX = originalX + deltaX;
                newWidth = originalWidth - deltaX;
                break;
        }

        // Limita le dimensioni minime
        const minWidth = 20;
        const minHeight = 20;

        if (newWidth < minWidth) {
            newWidth = minWidth;
            // Ripristina X se necessario
            if (this.resizeHandle.includes('w')) {
                newX = originalX + originalWidth - minWidth;
            }
        }

        if (newHeight < minHeight) {
            newHeight = minHeight;
            // Ripristina Y se necessario
            if (this.resizeHandle.includes('n')) {
                newY = originalY + originalHeight - minHeight;
            }
        }

        // Aggiorna l'elemento
        const updates = {
            x: Math.round(newX),
            y: Math.round(newY),
            width: Math.round(newWidth),
            height: Math.round(newHeight)
        };

        if (this.currentComponentId) {
            this.componentManager.updateComponentElement(this.currentComponentId, elementId, updates);
            this.renderComponent();
        } else {
            this.dataManager.updateElement(this.currentPageId, elementId, updates);
            this.render();
        }

        // Aggiorna la posizione di partenza per il prossimo movimento
        this.dragStartPos = { x: e.clientX, y: e.clientY };
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
            if (this.currentComponentId) {
                this.componentManager.deleteComponentElement(this.currentComponentId, elementId);
            } else {
                this.dataManager.deleteElement(this.currentPageId, elementId);
            }
        });

        this.selectedElements.clear();

        if (this.currentComponentId) {
            this.renderComponent();
        } else {
            this.render();
        }
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

        // Se siamo in modalità editing componente, aggiungi al componente
        if (this.currentComponentId) {
            const result = this.componentManager.addElementToComponent(this.currentComponentId, element);
            this.renderComponent(); // Ri-renderizza il componente
            return result;
        }

        // Altrimenti aggiungi alla pagina
        return this.dataManager.addElement(this.currentPageId, element);
    }

    /**
     * Imposta il livello di zoom
     */
    setZoom(level) {
        this.zoomLevel = Math.max(0.25, Math.min(2, level)); // Limita tra 25% e 200%
        this.applyZoom();
        this.updateZoomDisplay();
    }

    /**
     * Aumenta zoom
     */
    zoomIn() {
        const levels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
        const currentIndex = levels.findIndex(l => l >= this.zoomLevel);
        const nextIndex = Math.min(currentIndex + 1, levels.length - 1);
        this.setZoom(levels[nextIndex]);
    }

    /**
     * Riduci zoom
     */
    zoomOut() {
        const levels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
        const currentIndex = levels.findIndex(l => l >= this.zoomLevel);
        const prevIndex = Math.max(currentIndex - 1, 0);
        this.setZoom(levels[prevIndex]);
    }

    /**
     * Adatta alla finestra
     */
    zoomToFit() {
        const viewport = this.canvas.parentElement;
        const viewportWidth = viewport.clientWidth - 80; // Padding
        const viewportHeight = viewport.clientHeight - 80;

        const scaleX = viewportWidth / this.canvasWidth;
        const scaleY = viewportHeight / this.canvasHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Max 100%

        this.setZoom(scale);
    }

    /**
     * Applica lo zoom al canvas
     */
    applyZoom() {
        if (this.canvas) {
            this.canvas.style.transform = `scale(${this.zoomLevel})`;
            this.canvas.style.transformOrigin = 'top center';
        }
    }

    /**
     * Aggiorna il display dello zoom
     */
    updateZoomDisplay() {
        const zoomDisplay = document.getElementById('canvasZoom');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
        }
    }

    /**
     * Imposta le dimensioni del canvas
     */
    setCanvasSize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;

        if (this.canvas) {
            this.canvas.style.width = `${width}px`;
            this.canvas.style.minHeight = `${height}px`;
        }

        // Salva nelle impostazioni della pagina se c'è una pagina corrente
        if (this.currentPageId) {
            const page = this.dataManager.getPage(this.currentPageId);
            if (page) {
                page.canvasWidth = width;
                page.canvasHeight = height;
                this.dataManager.markModified();
            }
        }
    }
}
