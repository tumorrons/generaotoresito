/**
 * HistoryManager - Gestisce undo/redo con pattern Command
 */

export class HistoryManager {
    constructor(maxHistory = 50) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = maxHistory;
        this.listeners = [];
    }

    /**
     * Esegue un comando e lo aggiunge allo stack
     */
    execute(command) {
        command.execute();
        this.undoStack.push(command);

        // Limita la dimensione dello stack
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }

        // Clear redo stack quando viene eseguito un nuovo comando
        this.redoStack = [];

        this.notifyListeners();
    }

    /**
     * Annulla l'ultimo comando
     */
    undo() {
        if (this.undoStack.length === 0) {
            return false;
        }

        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);

        this.notifyListeners();
        return true;
    }

    /**
     * Ripete l'ultimo comando annullato
     */
    redo() {
        if (this.redoStack.length === 0) {
            return false;
        }

        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);

        this.notifyListeners();
        return true;
    }

    /**
     * Verifica se l'undo è disponibile
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Verifica se il redo è disponibile
     */
    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Pulisce la history
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.notifyListeners();
    }

    /**
     * Registra un listener per i cambiamenti
     */
    onChange(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notifica i listener
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback({
                canUndo: this.canUndo(),
                canRedo: this.canRedo(),
                undoCount: this.undoStack.length,
                redoCount: this.redoStack.length
            });
        });
    }
}

// Command Classes

/**
 * Command per aggiungere un elemento
 */
export class AddElementCommand {
    constructor(dataManager, pageId, element) {
        this.dataManager = dataManager;
        this.pageId = pageId;
        this.element = element;
        this.elementId = null;
    }

    execute() {
        const addedElement = this.dataManager.addElement(this.pageId, this.element);
        this.elementId = addedElement.id;
    }

    undo() {
        this.dataManager.deleteElement(this.pageId, this.elementId);
    }
}

/**
 * Command per eliminare un elemento
 */
export class DeleteElementCommand {
    constructor(dataManager, pageId, elementId) {
        this.dataManager = dataManager;
        this.pageId = pageId;
        this.elementId = elementId;
        this.deletedElement = null;
    }

    execute() {
        const page = this.dataManager.getPage(this.pageId);
        this.deletedElement = page.elements.find(el => el.id === this.elementId);
        this.dataManager.deleteElement(this.pageId, this.elementId);
    }

    undo() {
        this.dataManager.addElement(this.pageId, this.deletedElement);
    }
}

/**
 * Command per modificare un elemento
 */
export class UpdateElementCommand {
    constructor(dataManager, pageId, elementId, oldProperties, newProperties) {
        this.dataManager = dataManager;
        this.pageId = pageId;
        this.elementId = elementId;
        this.oldProperties = oldProperties;
        this.newProperties = newProperties;
    }

    execute() {
        this.dataManager.updateElement(this.pageId, this.elementId, this.newProperties);
    }

    undo() {
        this.dataManager.updateElement(this.pageId, this.elementId, this.oldProperties);
    }
}

/**
 * Command per spostare un elemento
 */
export class MoveElementCommand {
    constructor(dataManager, pageId, elementId, oldPosition, newPosition) {
        this.dataManager = dataManager;
        this.pageId = pageId;
        this.elementId = elementId;
        this.oldPosition = oldPosition;
        this.newPosition = newPosition;
    }

    execute() {
        this.dataManager.updateElement(this.pageId, this.elementId, {
            x: this.newPosition.x,
            y: this.newPosition.y
        });
    }

    undo() {
        this.dataManager.updateElement(this.pageId, this.elementId, {
            x: this.oldPosition.x,
            y: this.oldPosition.y
        });
    }
}

/**
 * Command per ridimensionare un elemento
 */
export class ResizeElementCommand {
    constructor(dataManager, pageId, elementId, oldSize, newSize) {
        this.dataManager = dataManager;
        this.pageId = pageId;
        this.elementId = elementId;
        this.oldSize = oldSize;
        this.newSize = newSize;
    }

    execute() {
        this.dataManager.updateElement(this.pageId, this.elementId, {
            width: this.newSize.width,
            height: this.newSize.height
        });
    }

    undo() {
        this.dataManager.updateElement(this.pageId, this.elementId, {
            width: this.oldSize.width,
            height: this.oldSize.height
        });
    }
}

/**
 * Command per aggiungere una pagina
 */
export class AddPageCommand {
    constructor(dataManager, name, title) {
        this.dataManager = dataManager;
        this.name = name;
        this.title = title;
        this.pageId = null;
    }

    execute() {
        const page = this.dataManager.addPage(this.name, this.title);
        this.pageId = page.id;
    }

    undo() {
        this.dataManager.deletePage(this.pageId);
    }
}

/**
 * Command per eliminare una pagina
 */
export class DeletePageCommand {
    constructor(dataManager, pageId) {
        this.dataManager = dataManager;
        this.pageId = pageId;
        this.deletedPage = null;
        this.pageIndex = null;
    }

    execute() {
        const pages = this.dataManager.getPages();
        this.pageIndex = pages.findIndex(p => p.id === this.pageId);
        this.deletedPage = JSON.parse(JSON.stringify(pages[this.pageIndex]));
        this.dataManager.deletePage(this.pageId);
    }

    undo() {
        const pages = this.dataManager.getPages();
        pages.splice(this.pageIndex, 0, this.deletedPage);
        this.dataManager.emit('pageAdded', this.deletedPage);
    }
}

/**
 * Command per modificare lo sfondo di una pagina
 */
export class UpdatePageBackgroundCommand {
    constructor(dataManager, pageId, oldBackground, newBackground) {
        this.dataManager = dataManager;
        this.pageId = pageId;
        this.oldBackground = oldBackground;
        this.newBackground = newBackground;
    }

    execute() {
        this.dataManager.updatePageBackground(this.pageId, this.newBackground);
    }

    undo() {
        this.dataManager.updatePageBackground(this.pageId, this.oldBackground);
    }
}

/**
 * Batch Command - Esegue più comandi in una singola operazione
 */
export class BatchCommand {
    constructor(commands, description = 'Batch Operation') {
        this.commands = commands;
        this.description = description;
    }

    execute() {
        this.commands.forEach(cmd => cmd.execute());
    }

    undo() {
        // Undo in reverse order
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }
}

/**
 * Command per modificare lo z-index
 */
export class ChangeZIndexCommand {
    constructor(dataManager, pageId, elementId, oldZIndex, newZIndex) {
        this.dataManager = dataManager;
        this.pageId = pageId;
        this.elementId = elementId;
        this.oldZIndex = oldZIndex;
        this.newZIndex = newZIndex;
    }

    execute() {
        this.dataManager.updateElement(this.pageId, this.elementId, {
            zIndex: this.newZIndex
        });
    }

    undo() {
        this.dataManager.updateElement(this.pageId, this.elementId, {
            zIndex: this.oldZIndex
        });
    }
}
