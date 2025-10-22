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
     * Scarica il pacchetto del sito
     */
    async downloadSitePackage(files) {
        // Per ora, scarica i file singolarmente
        // In una implementazione completa, si userebbe JSZip per creare un archivio

        // Scarica almeno l'index.html come esempio
        const indexFile = files.find(f => f.path === 'site/index.html');
        if (indexFile) {
            const blob = new Blob([indexFile.content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'index.html';
            a.click();
            URL.revokeObjectURL(url);
        }

        // Nota: In produzione, usare JSZip per creare un archivio completo
        console.log('File generati:', files.length);

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
