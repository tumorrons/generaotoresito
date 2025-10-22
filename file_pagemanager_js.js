// pageManager.js - Page Management
export class PageManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }
    
    getPages() {
        return this.dataManager.getData().pages;
    }
    
    addPage(name = 'Nuova Pagina') {
        const pages = this.getPages();
        const newId = pages.length > 0 ? Math.max(...pages.map(p => p.id)) + 1 : 1;
        
        pages.push({
            id: newId,
            name: name,
            type: 'page',
            height: 600,
            items: [],
            visible: true
        });
        
        return newId;
    }
    
    addGalleryParent(name = 'Gallery') {
        const pages = this.getPages();
        const newId = pages.length > 0 ? Math.max(...pages.map(p => p.id)) + 1 : 1;
        
        pages.push({
            id: newId,
            name: name,
            type: 'gallery-parent',
            visible: true,
            subPages: []
        });
        
        return newId;
    }
    
    addSubGallery(parentId, name = 'Nuova Galleria') {
        const parent = this.getPageById(parentId);
        if (!parent || parent.type !== 'gallery-parent') {
            console.error('Parent gallery not found');
            return null;
        }
        
        if (!parent.subPages) parent.subPages = [];
        
        const newId = parent.subPages.length > 0 
            ? Math.max(...parent.subPages.map(s => s.id)) + 1 
            : parentId * 10 + 1;
        
        parent.subPages.push({
            id: newId,
            name: name,
            height: 600,
            items: [],
            visible: true
        });
        
        return newId;
    }
    
    deletePage(pageId) {
        const data = this.dataManager.getData();
        data.pages = data.pages.filter(p => p.id !== pageId);
    }
    
    deleteSubPage(parentId, subPageId) {
        const parent = this.getPageById(parentId);
        if (parent && parent.subPages) {
            parent.subPages = parent.subPages.filter(s => s.id !== subPageId);
        }
    }
    
    renamePage(pageId, newName, isSubPage = false) {
        const page = this.getPageById(pageId, isSubPage);
        if (page && newName.trim()) {
            page.name = newName.trim();
        }
    }
    
    updatePageHeight(pageId, height, isSubPage = false) {
        const page = this.getPageById(pageId, isSubPage);
        if (page) {
            page.height = parseInt(height);
        }
    }
    
    getPageById(pageId, isSubPage = false) {
        const pages = this.getPages();
        
        if (isSubPage) {
            for (const page of pages) {
                if (page.type === 'gallery-parent' && page.subPages) {
                    const subPage = page.subPages.find(s => s.id === pageId);
                    if (subPage) return subPage;
                }
            }
            return null;
        }
        
        return pages.find(p => p.id === pageId);
    }
    
    toggleVisibility(pageId, isSubPage = false) {
        const page = this.getPageById(pageId, isSubPage);
        if (page) {
            page.visible = !page.visible;
        }
    }
    
    reorderPages(fromIndex, toIndex) {
        const pages = this.getPages();
        const [page] = pages.splice(fromIndex, 1);
        pages.splice(toIndex, 0, page);
    }
}