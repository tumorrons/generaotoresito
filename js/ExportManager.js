/**
 * ExportManager - Esporta il sito completo con struttura /site/, /images/, /assets/
 */

export class ExportManager {
    constructor(dataManager, imageManager) {
        this.dataManager = dataManager;
        this.imageManager = imageManager;
    }

    /**
     * Esporta il sito completo come ZIP
     */
    async exportSite(options = {}) {
        const {
            optimize = true,
            compress = true
        } = options;

        try {
            // Generate all files
            const files = await this.generateSiteFiles(optimize, compress);

            // Create a downloadable package
            await this.downloadSitePackage(files);

            return { success: true };
        } catch (error) {
            console.error('Errore nell\'export:', error);
            throw error;
        }
    }

    /**
     * Genera tutti i file del sito
     */
    async generateSiteFiles(optimize, compress) {
        const project = this.dataManager.getProject();
        const files = [];

        // Generate HTML files for each page
        for (const page of project.pages) {
            const html = this.generatePageHTML(page, project);
            files.push({
                path: `site/${page.name}`,
                content: html,
                type: 'text/html'
            });
        }

        // Generate global CSS
        const css = this.generateGlobalCSS(project);
        files.push({
            path: 'site/assets/site.css',
            content: css,
            type: 'text/css'
        });

        // Generate global JS
        const js = this.generateGlobalJS(project);
        files.push({
            path: 'site/assets/site.js',
            content: js,
            type: 'text/javascript'
        });

        // Copy images
        const images = this.dataManager.getAllImages();
        for (const [fileName, blob] of images.entries()) {
            files.push({
                path: `site/images/${fileName}`,
                content: blob,
                type: blob.type
            });
        }

        return files;
    }

    /**
     * Genera l'HTML per una pagina
     */
    generatePageHTML(page, project) {
        const elements = this.renderElements(page.elements);
        const background = this.generateBackgroundCSS(page.background);

        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title} - ${project.settings.siteName}</title>
    <meta name="description" content="${page.meta.description || ''}">
    <meta name="keywords" content="${page.meta.keywords || ''}">
    <meta name="author" content="${project.settings.author || ''}">
    <link rel="stylesheet" href="assets/site.css">
</head>
<body style="${background}">
    <div class="page-container">
        ${elements}
    </div>
    <script src="assets/site.js"></script>
</body>
</html>`;
    }

    /**
     * Renderizza gli elementi della pagina
     */
    renderElements(elements) {
        const sorted = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        return sorted.map(el => {
            // Gestione istanze di componenti
            if (el.type === 'component-instance') {
                return this.renderComponentInstance(el);
            }

            const style = `position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px; z-index: ${el.zIndex || 0};`;

            switch (el.type) {
                case 'text':
                    return `<div class="element-text" style="${style} font-size: ${el.fontSize || 16}px; color: ${el.color || '#000'}; font-family: ${el.fontFamily || 'Arial'};">${el.text || ''}</div>`;

                case 'image':
                    return `<div class="element-image" style="${style}">
                        <img src="images/${el.src}" alt="${el.alt || ''}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>`;

                case 'button':
                    const link = el.link ? (el.link.type === 'internal' ? el.link.href : el.link.url) : '#';
                    const target = el.link && el.link.type === 'external' ? 'target="_blank" rel="noopener"' : '';
                    return `<a href="${link}" ${target} class="element-button" style="${style} background: ${el.bgColor || '#2563eb'}; color: ${el.textColor || '#fff'}; font-size: ${el.fontSize || 14}px; text-decoration: none; display: flex; align-items: center; justify-content: center; border-radius: 6px;">${el.text || 'Button'}</a>`;

                case 'section':
                    return `<div class="element-section" style="${style} background: ${el.bgColor || 'transparent'};"></div>`;

                default:
                    return '';
            }
        }).join('\n        ');
    }

    /**
     * Renderizza un'istanza di componente espandendo i suoi elementi
     */
    renderComponentInstance(instance) {
        const project = this.dataManager.getProject();
        const component = project.components.find(c => c.id === instance.componentId);

        if (!component || !component.elements || component.elements.length === 0) {
            return ''; // Componente non trovato o vuoto
        }

        const containerStyle = `position: absolute; left: ${instance.x}px; top: ${instance.y}px; width: ${instance.width}px; height: ${instance.height}px; z-index: ${instance.zIndex || 0}; border: 1px solid #e5e7eb; background: #f9fafb;`;

        // Renderizza gli elementi del componente con override
        const componentElements = component.elements.map(el => {
            // Applica override se presenti
            const overrides = instance.overrides && instance.overrides[el.id] ? instance.overrides[el.id] : {};
            const finalElement = { ...el, ...overrides };

            // Posizione relativa al componente (non assoluta)
            const style = `margin: 5px; padding: 5px; border: 1px solid #e5e7eb; border-radius: 4px; background: white;`;

            switch (finalElement.type) {
                case 'text':
                    return `<div style="${style} font-size: ${finalElement.fontSize || 14}px; color: ${finalElement.color || '#000'};">${finalElement.text || ''}</div>`;

                case 'image':
                    return `<div style="${style}">
                        <img src="images/${finalElement.src}" alt="${finalElement.alt || ''}" style="max-width: 100%; height: auto;">
                    </div>`;

                case 'button':
                    const link = finalElement.link ? (finalElement.link.type === 'internal' ? finalElement.link.href : finalElement.link.url) : '#';
                    return `<a href="${link}" style="${style} background: ${finalElement.bgColor || '#2563eb'}; color: ${finalElement.textColor || '#fff'}; text-decoration: none; display: inline-block; padding: 8px 16px; border-radius: 6px; text-align: center;">${finalElement.text || 'Button'}</a>`;

                case 'section':
                    return `<div style="${style} background: ${finalElement.bgColor || '#f3f4f6'}; min-height: 50px;">Sezione</div>`;

                default:
                    return '';
            }
        }).join('\n            ');

        return `<div class="component-instance" style="${containerStyle}">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 8px 12px; font-weight: 600; border-bottom: 1px solid #2563eb;">
                ${component.name}
            </div>
            <div style="padding: 10px;">
                ${componentElements}
            </div>
        </div>`;
    }

    /**
     * Genera CSS per lo sfondo
     */
    generateBackgroundCSS(background) {
        if (!background) return '';

        switch (background.type) {
            case 'color':
                return `background-color: ${background.value};`;
            case 'gradient':
                return `background: ${background.gradient};`;
            case 'image':
                return `background-image: url('images/${background.image}'); background-size: cover; background-position: center;`;
            default:
                return '';
        }
    }

    /**
     * Genera il CSS globale
     */
    generateGlobalCSS(project) {
        return `/* Visual HTML Site Editor - Generated CSS */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: ${project.settings.defaultFont || 'Arial, sans-serif'};
    overflow-x: hidden;
}

.page-container {
    position: relative;
    min-height: 100vh;
}

.element-text {
    padding: 12px;
    word-wrap: break-word;
}

.element-image {
    overflow: hidden;
}

.element-button {
    cursor: pointer;
    transition: opacity 0.2s;
}

.element-button:hover {
    opacity: 0.9;
}

.element-section {
    border: 1px solid transparent;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .page-container {
        transform: scale(0.9);
        transform-origin: top left;
    }
}
`;
    }

    /**
     * Genera il JavaScript globale
     */
    generateGlobalJS(project) {
        return `// Visual HTML Site Editor - Generated JS
console.log('Site loaded:', '${project.settings.siteName}');

// Add any custom interactions here
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
`;
    }

    /**
     * Scarica il pacchetto del sito come ZIP
     */
    async downloadSitePackage(files) {
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip non caricato. Ricarica la pagina e riprova.');
        }

        const zip = new JSZip();

        // Aggiungi tutti i file al ZIP
        for (const file of files) {
            if (file.content instanceof Blob) {
                // Per le immagini (blob)
                zip.file(file.path, file.content);
            } else {
                // Per HTML, CSS, JS (stringhe)
                zip.file(file.path, file.content);
            }
        }

        // Genera il ZIP
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 9
            }
        });

        // Scarica il ZIP
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `site-export-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`✅ Export completato: ${files.length} file generati`);

        return true;
    }

    /**
     * Genera un'anteprima del sito
     */
    generatePreview(pageId) {
        const page = this.dataManager.getPage(pageId);
        if (!page) return '';

        const project = this.dataManager.getProject();
        return this.generatePageHTML(page, project);
    }
}
