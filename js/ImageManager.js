/**
 * ImageManager - Gestisce le immagini separate dal progetto
 * Le immagini non vengono incorporate in base64 ma salvate come file separati
 */

export class ImageManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.imageCache = new Map(); // filename -> Object URL
        this.compressionQuality = 0.85;
    }

    /**
     * Carica un'immagine e la prepara per l'uso
     */
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('Il file selezionato non è un\'immagine'));
                return;
            }

            const fileName = this.generateUniqueFileName(file.name);
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const blob = new Blob([e.target.result], { type: file.type });

                    // Store blob in data manager
                    this.dataManager.addImage(fileName, blob);

                    // Create object URL for preview
                    const objectUrl = URL.createObjectURL(blob);
                    this.imageCache.set(fileName, objectUrl);

                    // Get image dimensions
                    const dimensions = await this.getImageDimensions(objectUrl);

                    resolve({
                        fileName,
                        objectUrl,
                        size: blob.size,
                        type: file.type,
                        dimensions
                    });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Errore nella lettura del file'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Carica più immagini
     */
    async loadImages(files) {
        const promises = Array.from(files).map(file => this.loadImage(file));
        return Promise.all(promises);
    }

    /**
     * Ottiene le dimensioni di un'immagine
     */
    getImageDimensions(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
            };
            img.onerror = () => reject(new Error('Impossibile caricare l\'immagine'));
            img.src = url;
        });
    }

    /**
     * Genera un nome file univoco
     */
    generateUniqueFileName(originalName) {
        const ext = originalName.split('.').pop();
        const nameWithoutExt = originalName.replace(`.${ext}`, '');
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);

        return `${this.sanitizeFileName(nameWithoutExt)}_${timestamp}_${random}.${ext}`;
    }

    /**
     * Sanitizza un nome file
     */
    sanitizeFileName(name) {
        return name
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .toLowerCase();
    }

    /**
     * Ottiene l'URL di un'immagine dal cache
     */
    getImageUrl(fileName) {
        if (this.imageCache.has(fileName)) {
            return this.imageCache.get(fileName);
        }

        // Se non è nel cache, prova a ottenerla dal data manager
        const blob = this.dataManager.getImage(fileName);
        if (blob) {
            const url = URL.createObjectURL(blob);
            this.imageCache.set(fileName, url);
            return url;
        }

        return null;
    }

    /**
     * Comprimi un'immagine
     */
    async compressImage(file, quality = this.compressionQuality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Errore nella compressione'));
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };

                img.onerror = () => reject(new Error('Errore nel caricamento immagine'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Errore nella lettura del file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Ridimensiona un'immagine
     */
    async resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Errore nel ridimensionamento'));
                            }
                        },
                        file.type,
                        0.95
                    );
                };

                img.onerror = () => reject(new Error('Errore nel caricamento immagine'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Errore nella lettura del file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Ottimizza un'immagine prima del salvataggio
     */
    async optimizeImage(file, options = {}) {
        const {
            maxWidth = 2000,
            maxHeight = 2000,
            quality = this.compressionQuality,
            shouldResize = true,
            shouldCompress = true
        } = options;

        let processedFile = file;

        // Resize if needed
        if (shouldResize) {
            const dimensions = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ width: img.width, height: img.height });
                img.src = URL.createObjectURL(file);
            });

            if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
                processedFile = await this.resizeImage(file, maxWidth, maxHeight);
            }
        }

        // Compress if needed
        if (shouldCompress && file.type === 'image/jpeg') {
            processedFile = await this.compressImage(processedFile, quality);
        }

        return processedFile;
    }

    /**
     * Rimuove un'immagine
     */
    removeImage(fileName) {
        // Revoke object URL
        if (this.imageCache.has(fileName)) {
            URL.revokeObjectURL(this.imageCache.get(fileName));
            this.imageCache.delete(fileName);
        }

        // Remove from data manager
        this.dataManager.images.delete(fileName);
    }

    /**
     * Ottiene tutte le immagini non utilizzate
     */
    getUnusedImages() {
        const allImages = Array.from(this.dataManager.getAllImages().keys());
        const usedImages = new Set();

        // Check all pages
        this.dataManager.getPages().forEach(page => {
            // Check page background
            if (page.background.type === 'image' && page.background.image) {
                usedImages.add(page.background.image);
            }

            // Check elements
            page.elements.forEach(element => {
                if (element.type === 'image' && element.src) {
                    usedImages.add(element.src);
                }
            });
        });

        // Check components
        this.dataManager.getProject().components.forEach(component => {
            component.elements.forEach(element => {
                if (element.type === 'image' && element.src) {
                    usedImages.add(element.src);
                }
            });
        });

        return allImages.filter(img => !usedImages.has(img));
    }

    /**
     * Pulisce le immagini non utilizzate
     */
    cleanupUnusedImages() {
        const unused = this.getUnusedImages();
        unused.forEach(fileName => this.removeImage(fileName));
        return unused.length;
    }

    /**
     * Ottiene statistiche sulle immagini
     */
    getImageStats() {
        let totalSize = 0;
        let count = 0;

        this.dataManager.getAllImages().forEach(blob => {
            totalSize += blob.size;
            count++;
        });

        return {
            count,
            totalSize,
            averageSize: count > 0 ? totalSize / count : 0,
            unused: this.getUnusedImages().length
        };
    }

    /**
     * Rilascia tutte le risorse
     */
    cleanup() {
        this.imageCache.forEach(url => URL.revokeObjectURL(url));
        this.imageCache.clear();
    }
}
