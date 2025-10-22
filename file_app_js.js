// app.js - Core Application
import { DataManager } from './dataManager.js';
import { PageManager } from './pageManager.js';
import { HeaderManager } from './headerManager.js';
import { ElementManager } from './elementManager.js';
import { ExportManager } from './exportManager.js';
import { PreviewGenerator } from './previewGenerator.js';
import { UIController } from './uiController.js';
import { DragDropHandler } from './dragDrop.js';

class PhotoSiteBuilder {
    constructor() {
        // Initialize managers
        this.dataManager = new DataManager();
        this.pageManager = new PageManager(this.dataManager);
        this.headerManager = new HeaderManager(this.dataManager);
        this.elementManager = new ElementManager(this.dataManager);
        this.exportManager = new ExportManager(this.dataManager);
        this.previewGenerator = new PreviewGenerator(this.dataManager);
        this.uiController = new UIController(this);
        this.dragDropHandler = new DragDropHandler(this);
        
        // State
        this.currentPageId = 1;
        this.selectedId = null;
        this.selectedHeaderElementId = null;
        this.isSubPage = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.uiController.renderUI();
        this.updatePreview();
        console.log('✅ Photo Site Builder initialized');
    }
    
    setupEventListeners() {
        document.getElementById('saveBtn').addEventListener('click', 
            () => this.dataManager.saveProject());
        
        document.getElementById('loadBtn').addEventListener('click', 
            () => document.getElementById('loadInput').click());
        
        document.getElementById('loadInput').addEventListener('change', 
            (e) => this.handleLoadProject(e));
        
        document.getElementById('exportBtn').addEventListener('click', 
            () => this.exportManager.exportSite());
    }
    
    handleLoadProject(event) {
        this.dataManager.loadProject(event, () => {
            this.currentPageId = 1;
            this.selectedId = null;
            this.isSubPage = false;
            this.uiController.renderUI();
            this.updatePreview();
        });
    }
    
    updatePreview() {
        const html = this.previewGenerator.generateHTML();
        const iframe = document.getElementById('previewFrame');
        
        if (iframe.contentDocument) {
            iframe.contentDocument.open();
            iframe.contentDocument.write(html);
            iframe.contentDocument.close();
            
            setTimeout(() => this.setupPreviewInteractions(), 100);
        }
    }
    
    setupPreviewInteractions() {
        this.dragDropHandler.setupPreviewInteractions();
    }
    
    getCurrentPage() {
        if (this.isSubPage) {
            const parent = this.dataManager.getData().pages.find(p => p.type === 'gallery-parent');
            return parent ? parent.subPages.find(s => s.id === this.currentPageId) : null;
        }
        return this.dataManager.getData().pages.find(p => p.id === this.currentPageId);
    }
    
    selectPage(pageId, isSubPage = false) {
        this.currentPageId = pageId;
        this.isSubPage = isSubPage;
        this.selectedId = null;
        this.selectedHeaderElementId = null;
        this.uiController.switchTab('editor');
        this.updatePreview();
    }
    
    handlePhotoUpload(event) {
        const files = Array.from(event.target.files);
        let filesProcessed = 0;
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.elementManager.addImage(
                    this.currentPageId,
                    e.target.result,
                    this.isSubPage
                );
                filesProcessed++;
                
                if (filesProcessed === files.length) {
                    this.updatePreview();
                    this.uiController.renderEditor();
                }
            };
            reader.readAsDataURL(file);
        });
        
        event.target.value = '';
    }
    
    updateGlobalSettings() {
        const settings = {
            siteName: document.getElementById('siteName').value,
            author: document.getElementById('author').value,
            primaryColor: document.getElementById('primaryColor').value,
            secondaryColor: document.getElementById('secondaryColor').value,
            accentColor: document.getElementById('accentColor').value,
            exportMode: document.getElementById('exportMode').value
        };
        
        this.dataManager.updateSettings(settings);
        this.updatePreview();
    }
}

// Initialize app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.app = new PhotoSiteBuilder();
});

export default PhotoSiteBuilder;