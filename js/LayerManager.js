/**
 * LayerManager - Gestisce i livelli (z-index) degli elementi
 */

export class LayerManager {
    constructor(dataManager, historyManager) {
        this.dataManager = dataManager;
        this.historyManager = historyManager;
    }

    /**
     * Ottiene gli elementi ordinati per z-index
     */
    getLayersSorted(pageId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return [];

        return [...page.elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    }

    /**
     * Porta un elemento in primo piano
     */
    bringToFront(pageId, elementId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        const element = page.elements.find(el => el.id === elementId);
        if (!element) return;

        const oldZIndex = element.zIndex || 0;
        const maxZIndex = Math.max(...page.elements.map(el => el.zIndex || 0));
        const newZIndex = maxZIndex + 1;

        if (oldZIndex === newZIndex) return;

        const command = new (require('./HistoryManager.js').ChangeZIndexCommand)(
            this.dataManager,
            pageId,
            elementId,
            oldZIndex,
            newZIndex
        );

        this.historyManager.execute(command);
    }

    /**
     * Porta un elemento avanti di un livello
     */
    bringForward(pageId, elementId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        const sorted = this.getLayersSorted(pageId);
        const currentIndex = sorted.findIndex(el => el.id === elementId);

        if (currentIndex === -1 || currentIndex === 0) return;

        const element = sorted[currentIndex];
        const elementAbove = sorted[currentIndex - 1];

        const oldZIndex = element.zIndex || 0;
        const newZIndex = (elementAbove.zIndex || 0) + 1;

        if (oldZIndex === newZIndex) return;

        this.dataManager.updateElement(pageId, elementId, { zIndex: newZIndex });
    }

    /**
     * Manda un elemento indietro di un livello
     */
    sendBackward(pageId, elementId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        const sorted = this.getLayersSorted(pageId);
        const currentIndex = sorted.findIndex(el => el.id === elementId);

        if (currentIndex === -1 || currentIndex === sorted.length - 1) return;

        const element = sorted[currentIndex];
        const elementBelow = sorted[currentIndex + 1];

        const oldZIndex = element.zIndex || 0;
        const newZIndex = Math.max(0, (elementBelow.zIndex || 0) - 1);

        if (oldZIndex === newZIndex) return;

        this.dataManager.updateElement(pageId, elementId, { zIndex: newZIndex });
    }

    /**
     * Manda un elemento in fondo
     */
    sendToBack(pageId, elementId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        const element = page.elements.find(el => el.id === elementId);
        if (!element) return;

        const oldZIndex = element.zIndex || 0;
        const minZIndex = Math.min(...page.elements.map(el => el.zIndex || 0));
        const newZIndex = Math.max(0, minZIndex - 1);

        if (oldZIndex === newZIndex) return;

        this.dataManager.updateElement(pageId, elementId, { zIndex: newZIndex });
    }

    /**
     * Imposta lo z-index di un elemento
     */
    setZIndex(pageId, elementId, zIndex) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        const element = page.elements.find(el => el.id === elementId);
        if (!element) return;

        const oldZIndex = element.zIndex || 0;

        if (oldZIndex === zIndex) return;

        this.dataManager.updateElement(pageId, elementId, { zIndex });
    }

    /**
     * Normalizza gli z-index di tutti gli elementi
     * Utile per evitare valori troppo grandi
     */
    normalizeZIndexes(pageId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        const sorted = this.getLayersSorted(pageId);

        sorted.forEach((element, index) => {
            const newZIndex = sorted.length - index;
            if (element.zIndex !== newZIndex) {
                this.dataManager.updateElement(pageId, element.id, { zIndex: newZIndex });
            }
        });
    }

    /**
     * Ottiene l'elemento sopra un determinato elemento
     */
    getElementAbove(pageId, elementId) {
        const sorted = this.getLayersSorted(pageId);
        const currentIndex = sorted.findIndex(el => el.id === elementId);

        if (currentIndex === -1 || currentIndex === 0) return null;

        return sorted[currentIndex - 1];
    }

    /**
     * Ottiene l'elemento sotto un determinato elemento
     */
    getElementBelow(pageId, elementId) {
        const sorted = this.getLayersSorted(pageId);
        const currentIndex = sorted.findIndex(el => el.id === elementId);

        if (currentIndex === -1 || currentIndex === sorted.length - 1) return null;

        return sorted[currentIndex + 1];
    }

    /**
     * Verifica se un elemento può essere spostato in alto
     */
    canBringForward(pageId, elementId) {
        const sorted = this.getLayersSorted(pageId);
        const currentIndex = sorted.findIndex(el => el.id === elementId);
        return currentIndex > 0;
    }

    /**
     * Verifica se un elemento può essere spostato in basso
     */
    canSendBackward(pageId, elementId) {
        const sorted = this.getLayersSorted(pageId);
        const currentIndex = sorted.findIndex(el => el.id === elementId);
        return currentIndex < sorted.length - 1 && currentIndex !== -1;
    }

    /**
     * Scambia lo z-index di due elementi
     */
    swapZIndex(pageId, elementId1, elementId2) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        const element1 = page.elements.find(el => el.id === elementId1);
        const element2 = page.elements.find(el => el.id === elementId2);

        if (!element1 || !element2) return;

        const z1 = element1.zIndex || 0;
        const z2 = element2.zIndex || 0;

        this.dataManager.updateElement(pageId, elementId1, { zIndex: z2 });
        this.dataManager.updateElement(pageId, elementId2, { zIndex: z1 });
    }

    /**
     * Raggruppa più elementi (assegna lo stesso z-index range)
     */
    groupElements(pageId, elementIds) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        // Find the highest z-index among the selected elements
        const elements = page.elements.filter(el => elementIds.includes(el.id));
        const maxZIndex = Math.max(...elements.map(el => el.zIndex || 0));

        // Set all elements to consecutive z-index values starting from maxZIndex
        elements.forEach((element, index) => {
            this.dataManager.updateElement(pageId, element.id, {
                zIndex: maxZIndex + index,
                grouped: true,
                groupId: elementIds[0] // Use first element ID as group ID
            });
        });
    }

    /**
     * Separa elementi raggruppati
     */
    ungroupElements(pageId, groupId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        const groupedElements = page.elements.filter(el => el.groupId === groupId);

        groupedElements.forEach(element => {
            this.dataManager.updateElement(pageId, element.id, {
                grouped: false,
                groupId: null
            });
        });
    }

    /**
     * Ottiene tutti gli elementi di un gruppo
     */
    getGroupElements(pageId, groupId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return [];

        return page.elements.filter(el => el.groupId === groupId);
    }

    /**
     * Blocca/sblocca un elemento
     */
    toggleLock(pageId, elementId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        const element = page.elements.find(el => el.id === elementId);
        if (!element) return;

        this.dataManager.updateElement(pageId, elementId, {
            locked: !element.locked
        });
    }

    /**
     * Verifica se un elemento è bloccato
     */
    isLocked(pageId, elementId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return false;

        const element = page.elements.find(el => el.id === elementId);
        return element ? element.locked : false;
    }

    /**
     * Ottiene statistiche sui livelli
     */
    getLayerStats(pageId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return null;

        const zIndexes = page.elements.map(el => el.zIndex || 0);

        return {
            totalElements: page.elements.length,
            minZIndex: Math.min(...zIndexes),
            maxZIndex: Math.max(...zIndexes),
            lockedElements: page.elements.filter(el => el.locked).length,
            groupedElements: page.elements.filter(el => el.grouped).length,
            uniqueGroups: new Set(page.elements.filter(el => el.groupId).map(el => el.groupId)).size
        };
    }
}
