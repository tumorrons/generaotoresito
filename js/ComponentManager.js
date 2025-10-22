/**
 * ComponentManager - Gestisce i componenti condivisi (header, menu, footer)
 * Supporta override locali per pagine specifiche
 */

export class ComponentManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    /**
     * Crea un nuovo componente condiviso
     */
    createComponent(name, type = 'custom') {
        const component = {
            id: this.dataManager.generateId(),
            name,
            type, // 'header', 'menu', 'footer', 'custom'
            elements: [],
            created: new Date().toISOString()
        };

        this.dataManager.getProject().components.push(component);
        this.dataManager.markModified();

        return component;
    }

    /**
     * Ottiene tutti i componenti
     */
    getComponents() {
        return this.dataManager.getProject().components || [];
    }

    /**
     * Ottiene un componente per ID
     */
    getComponent(componentId) {
        return this.getComponents().find(c => c.id === componentId);
    }

    /**
     * Elimina un componente
     */
    deleteComponent(componentId) {
        const components = this.getComponents();
        const index = components.findIndex(c => c.id === componentId);

        if (index !== -1) {
            components.splice(index, 1);
            this.dataManager.markModified();
        }
    }

    /**
     * Aggiunge un componente a una pagina
     */
    addComponentToPage(pageId, componentId, position = { x: 0, y: 0 }) {
        const component = this.getComponent(componentId);
        const page = this.dataManager.getPage(pageId);

        if (!component || !page) return null;

        // Create instance reference
        const instance = {
            id: this.dataManager.generateId(),
            type: 'component-instance',
            componentId,
            x: position.x,
            y: position.y,
            overrides: {} // Store local overrides
        };

        page.elements.push(instance);
        this.dataManager.markModified();

        return instance;
    }

    /**
     * Aggiorna un elemento nel componente
     */
    updateComponentElement(componentId, elementId, updates) {
        const component = this.getComponent(componentId);
        if (!component) return;

        const element = component.elements.find(el => el.id === elementId);
        if (element) {
            Object.assign(element, updates);
            this.dataManager.markModified();
        }
    }

    /**
     * Applica override locale per un'istanza del componente
     */
    applyOverride(pageId, instanceId, elementId, overrides) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        const instance = page.elements.find(el => el.id === instanceId);
        if (!instance || instance.type !== 'component-instance') return;

        if (!instance.overrides) instance.overrides = {};
        instance.overrides[elementId] = overrides;

        this.dataManager.markModified();
    }

    /**
     * Rimuove override locale
     */
    removeOverride(pageId, instanceId, elementId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return;

        const instance = page.elements.find(el => el.id === instanceId);
        if (!instance || !instance.overrides) return;

        delete instance.overrides[elementId];
        this.dataManager.markModified();
    }
}
