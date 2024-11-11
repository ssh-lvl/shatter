document.addEventListener('DOMContentLoaded', () => {
    const bgUpload = document.getElementById('bg-upload');
    const clearBg = document.getElementById('clear-bg');
    const preview = document.getElementById('preview');
    const styleButtons = document.querySelectorAll('.style-button');
    const blurSlider = document.getElementById('blur-slider');
    const blurValue = document.getElementById('blur-value');
    const scaleValue = document.getElementById('scale-value');
    const scaleType = document.getElementById('scale-type');
    const applyScale = document.getElementById('apply-scale');
    const antialiasingToggle = document.getElementById('antialiasing-toggle');
    
    let savedBgSettings = {};
    let originalImageData = null;
    
    const SETTINGS_KEY = 'bgSettings';
    let db;

    // Initialize storage
    function initStorage() {
        return new Promise((resolve) => {
            if (typeof localStorage !== 'undefined') {
                try {
                    const localData = localStorage.getItem(SETTINGS_KEY);
                    if (localData) {
                        savedBgSettings = JSON.parse(localData);
                        resolve('localStorage');
                        return;
                    }
                } catch (e) {
                    console.warn('localStorage access denied:', e);
                }
            }

            const request = indexedDB.open("BackgroundSettingsDB", 1);
            request.onupgradeneeded = (event) => {
                db = event.target.result;
                db.createObjectStore("settings", { keyPath: "id" });
            };
            request.onsuccess = (event) => {
                db = event.target.result;
                loadSettingsFromIndexedDB().then(() => resolve('indexedDB'));
            };
            request.onerror = () => resolve('memory');
        });
    }

    function loadSettingsFromIndexedDB() {
        return new Promise((resolve) => {
            const transaction = db.transaction(["settings"], "readonly");
            const objectStore = transaction.objectStore("settings");
            const request = objectStore.get(SETTINGS_KEY);
            request.onsuccess = (event) => {
                if (event.target.result) {
                    savedBgSettings = event.target.result.data;
                }
                resolve();
            };
            request.onerror = () => resolve();
        });
    }

    function saveSettings(settings) {
        savedBgSettings = settings;
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            } catch (e) {
                console.warn('Error saving to localStorage:', e);
            }
        }
        if (db) {
            const transaction = db.transaction(["settings"], "readwrite");
            const objectStore = transaction.objectStore("settings");
            objectStore.put({ id: SETTINGS_KEY, data: settings });
        }
    }

     const backgroundContainer = (() => {
        let container = document.getElementById('background-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'background-container';
            Object.assign(container.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: '-1'
            });
            document.body.insertBefore(container, document.body.firstChild);
        }
        return container;
    })();

    function clearBackgroundStyles() {
        Object.assign(backgroundContainer.style, {
            backgroundImage: '',
            backgroundSize: '',
            backgroundPosition: '',
            backgroundRepeat: '',
            filter: '',
            imageRendering: ''
        });
        preview.style.backgroundImage = '';
        originalImageData = null;
    }

    async function scaleImage(imageData, scale, scaleType) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let newWidth, newHeight;
                
                if (scaleType === 'percent') {
                    newWidth = img.width * (scale / 100);
                    newHeight = img.height * (scale / 100);
                } else { // pixels
                    const ratio = scale / Math.max(img.width, img.height);
                    newWidth = img.width * ratio;
                    newHeight = img.height * ratio;
                }
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                resolve(canvas.toDataURL());
            };
            img.src = imageData;
        });
    }

    function applyBackgroundSettings(settings) {
        clearBackgroundStyles();
        if (settings.url) {
            backgroundContainer.style.backgroundImage = `url(${settings.url})`;
            preview.style.backgroundImage = `url(${settings.url})`;
            
            // Apply background style
            switch (settings.position) {
                case 'fit':
                    fitToPage(settings.url);
                    break;
                case 'stretch':
                    backgroundContainer.style.backgroundSize = '100% 100%';
                    break;
                case 'tiles':
                    backgroundContainer.style.backgroundSize = 'auto';
                    backgroundContainer.style.backgroundRepeat = 'repeat';
                    break;
                case 'fit-centered':
                    Object.assign(backgroundContainer.style, {
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    });
                    break;
                default:
                    Object.assign(backgroundContainer.style, {
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    });
            }
            
            // Apply antialiasing
            backgroundContainer.style.imageRendering = settings.antialiasing ? 'auto' : 'pixelated';
        }
        
        // Apply blur
        if (settings.blur !== undefined) {
            backgroundContainer.style.filter = `blur(${settings.blur}px)`;
            blurSlider.value = settings.blur;
            blurValue.textContent = settings.blur;
        }
        
        // Update style buttons
        styleButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.bgImage === settings.position);
        });
    }

    // Initialize settings
    initStorage().then((storageType) => {
        console.log(`Using ${storageType} for background settings`);
        applyBackgroundSettings(savedBgSettings);
        
        // Set initial antialiasing state
        antialiasingToggle.checked = savedBgSettings.antialiasing !== false;
    });

    // File upload handler
    bgUpload.addEventListener('change', () => {
        const file = bgUpload.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                originalImageData = e.target.result;
                savedBgSettings.url = originalImageData;
                savedBgSettings.filePath = file.name;
                saveSettings(savedBgSettings);
                applyBackgroundSettings(savedBgSettings);
            };
            reader.readAsDataURL(file);
        }
    });

    // Clear background handler
    clearBg.addEventListener('click', () => {
        clearBackgroundStyles();
        savedBgSettings = {};
        saveSettings(savedBgSettings);
        blurSlider.value = 0;
        blurValue.textContent = '0';
    });

    // Style buttons handler
    styleButtons.forEach(button => {
        button.addEventListener('click', () => {
            styleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            savedBgSettings.position = button.dataset.bgImage;
            applyBackgroundSettings(savedBgSettings);
            saveSettings(savedBgSettings);
        });
    });

    // Scale handler
    applyScale.addEventListener('click', async () => {
        if (originalImageData) {
            const scale = parseInt(scaleValue.value);
            const type = scaleType.value;
            if (scale > 0) {
                const scaledImage = await scaleImage(originalImageData, scale, type);
                savedBgSettings.url = scaledImage;
                saveSettings(savedBgSettings);
                applyBackgroundSettings(savedBgSettings);
            }
        }
    });

    // Antialiasing handler
    antialiasingToggle.addEventListener('change', () => {
        savedBgSettings.antialiasing = antialiasingToggle.checked;
        saveSettings(savedBgSettings);
        applyBackgroundSettings(savedBgSettings);
    });

    // Blur handler
    blurSlider.addEventListener('input', () => {
        const blurAmount = parseInt(blurSlider.value, 10);
        if (!isNaN(blurAmount)) {
            backgroundContainer.style.filter = `blur(${blurAmount}px)`;
            blurValue.textContent = blurAmount;
            savedBgSettings.blur = blurAmount;
            saveSettings(savedBgSettings);
        }
    });

    // Window resize handler
    window.addEventListener('resize', () => {
        if (savedBgSettings.position === 'fit' && savedBgSettings.url) {
            fitToPage(savedBgSettings.url);
        } else if (savedBgSettings.url) {
            applyBackgroundSettings(savedBgSettings);
        }
    });
});
