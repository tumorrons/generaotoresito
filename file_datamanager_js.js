// dataManager.js - Data Management
export class DataManager {
    constructor() {
        this.data = this.getDefaultData();
    }
    
    getDefaultData() {
        return {
            siteName: 'Il Mio Portfolio',
            author: 'Nome Fotografo',
            primaryColor: '#1a1a1a',
            secondaryColor: '#ffffff',
            accentColor: '#ff6b6b',
            exportMode: 'multi',
            header: {
                elements: [
                    { 
                        id: 'title', 
                        type: 'title', 
                        text: 'Il Mio Portfolio', 
                        x: 50, 
                        y: 40, 
                        fontSize: 40, 
                        color: '#ffffff', 
                        visible: true 
                    },
                    { 
                        id: 'menu-home', 
                        type: 'menu-item', 
                        pageId: 1, 
                        text: 'Home', 
                        x: 50, 
                        y: 120, 
                        fontSize: 16, 
                        color: '#ffffff', 
                        visible: true 
                    }
                ]
            },
            pages: [
                { 
                    id: 1, 
                    name: 'Home', 
                    type: 'page', 
                    height: 600, 
                    items: [], 
                    visible: true 
                }
            ]
        };
    }
    
    getData() {
        return this.data;
    }
    
    updateSettings(settings) {
        Object.assign(this.data, settings);
    }
    
    saveProject() {
        try {
            const json = JSON.stringify(this.data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `progetto-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
            
            this.showNotification('✅ Progetto salvato con successo!', 'success');
        } catch (error) {
            this.showNotification('❌ Errore nel salvataggio: ' + error.message, 'error');
        }
    }
    
    loadProject(event, callback) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!loadedData.pages || !Array.isArray(loadedData.pages)) {
                    throw new Error('Struttura dati non valida');
                }
                
                this.data = loadedData;
                
                // Ensure header exists
                if (!this.data.header || !this.data.header.elements) {
                    this.data.header = this.getDefaultData().header;
                }
                
                this.showNotification('✅ Progetto caricato con successo!', 'success');
                
                if (callback) callback();
            } catch (err) {
                this.showNotification('❌ Errore nel caricamento: ' + err.message, 'error');
            }
        };
        
        reader.onerror = () => {
            this.showNotification('❌ Errore nella lettura del file', 'error');
        };
        
        reader.readAsText(file);
        event.target.value = '';
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add animations
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}