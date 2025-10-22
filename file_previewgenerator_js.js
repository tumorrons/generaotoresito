// previewGenerator.js - Preview Generator
export class PreviewGenerator {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }
    
    generateHTML() {
        const data = this.dataManager.getData();
        
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.siteName}</title>
    <style>${this.generateCSS(data)}</style>
</head>
<body>
    ${this.generateHeader(data)}
    <div class="container">
        ${this.generatePages(data)}
    </div>
    ${this.generateFooter(data)}
</body>
</html>`;
    }
    
    generateCSS(data) {
        return `
            * { 
                margin: 0; 
                padding: 0; 
                box-sizing: border-box; 
            }
            
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: ${data.primaryColor}; 
                color: ${data.secondaryColor}; 
                line-height: 1.6;
            }
            
            .container { 
                max-width: 1200px; 
                margin: 0 auto; 
                padding: 40px 20px; 
            }
            
            header {
                padding: 40px 20px;
                border-bottom: 2px solid ${data.accentColor};
                background: ${data.primaryColor};
                position: relative;
                min-height: 200px;
            }
            
            .header-item {
                position: absolute;
                cursor: pointer;
                padding: 5px;
                transition: opacity 0.2s;
            }
            
            .header-item:hover {
                opacity: 0.8;
            }
            
            .page {
                display: none;
                animation: fadeIn 0.3s;
            }
            
            .page.active {
                display: block;
            }
            
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .canvas {
                position: relative;
                width: 100%;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                margin: 40px 0;
                overflow: hidden;
            }
            
            .item {
                position: absolute;
                outline: none;
                transition: outline 0.2s;
            }
            
            .item:hover {
                outline: 2px dashed ${data.accentColor} !important;
            }
            
            .item.selected {
                outline: 2px solid ${data.accentColor} !important;
            }
            
            .item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                pointer-events: none;
            }
            
            .handle {
                position: absolute;
                width: 12px;
                height: 12px;
                background: ${data.accentColor};
                right: -6px;
                bottom: -6px;
                cursor: nwse-resize;
                border-radius: 2px;
                display: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            .item.selected .handle {
                display: block !important;
            }
            
            h2 {
                font-size: 2em;
                font-weight: 300;
                margin-bottom: 20px;
                color: ${data.accentColor};
                letter-spacing: 1px;
            }
            
            footer {
                text-align: center;
                padding: 40px 20px;
                border-top: 2px solid ${data.accentColor};
                margin-top: 60px;
                opacity: 0.7;
                font-size: 0.9em;
            }
        `;
    }
    
    generateHeader(data) {
        let html = '<header>';
        
        data.header.elements.forEach(el => {
            if (!el.visible) return;
            
            html += this.generateHeaderElement(el, data);
        });
        
        html += '</header>';
        return html;
    }
    
    generateHeaderElement(el, data) {
        const style = `left: ${el.x}px; top: ${el.y}px;`;
        
        if (el.type === 'title') {
            return `<div class="header-item" data-id="${el.id}" style="${style} font-size: ${el.fontSize}px; color: ${el.color}; font-weight: 300; letter-spacing: 2px;">${el.text}</div>`;
        }
        
        if (el.type === 'menu-item' || el.type === 'menu-external' || el.type === 'menu-gallery') {
            const text = el.type === 'menu-gallery' ? el.text + ' ▼' : el.text;
            return `<div class="header-item" data-id="${el.id}" style="${style} font-size: ${el.fontSize}px; color: ${el.color}; font-weight: 500;">${text}</div>`;
        }
        
        if (el.type === 'image') {
            return `<div class="header-item" data-id="${el.id}" style="${style}">
                <img src="${el.src}" style="width: ${el.width}px; height: ${el.height}px; object-fit: contain; pointer-events: none;" />
            </div>`;
        }
        
        return '';
    }
    
    generatePages(data) {
        let html = '';
        
        data.pages.forEach((page, index) => {
            if (!page.visible) return;
            
            if (page.type === 'gallery-parent' && page.subPages) {
                page.subPages.forEach(subPage => {
                    if (subPage.visible) {
                        html += this.generatePage(subPage, data);
                    }
                });
            } else if (page.type === 'page') {
                const isActive = index === 0;
                html += this.generatePage(page, data, isActive);
            }
        });
        
        return html;
    }
    
    generatePage(page, data, isActive = false) {
        const activeClass = isActive ? ' active' : '';
        const titleHTML = page.id !== 1 ? `<h2>${page.name}</h2>` : '';
        
        let itemsHTML = '';
        page.items.forEach(item => {
            itemsHTML += this.generatePageItem(item);
        });
        
        return `
            <div id="page-${page.id}" class="page${activeClass}">
                ${titleHTML}
                <div class="canvas" style="height: ${page.height}px;">
                    ${itemsHTML}
                </div>
            </div>
        `;
    }
    
    generatePageItem(item) {
        if (item.type === 'image') {
            const filters = `brightness(${item.brightness}%) contrast(${item.contrast}%) saturate(${item.saturation}%) rotate(${item.rotation}deg)`;
            
            return `
                <div class="item" data-id="${item.id}" style="left: ${item.x}px; top: ${item.y}px; width: ${item.width}px; height: ${item.height}px; cursor: move;">
                    <img src="${item.src}" style="filter: ${filters};" />
                    <div class="handle"></div>
                </div>
            `;
        }
        
        if (item.type === 'text') {
            return `
                <div class="item" data-id="${item.id}" style="left: ${item.x}px; top: ${item.y}px; font-size: ${item.fontSize}px; color: ${item.color}; padding: 10px; background: rgba(0,0,0,0.8); border-radius: 4px; cursor: move; max-width: 300px; word-wrap: break-word;">
                    ${item.text}
                </div>
            `;
        }
        
        return '';
    }
    
    generateFooter(data) {
        const year = new Date().getFullYear();
        return `
            <footer>
                <p>&copy; ${year} ${data.author}</p>
            </footer>
        `;
    }
}