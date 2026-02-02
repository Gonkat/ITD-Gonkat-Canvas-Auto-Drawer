// ==UserScript==
// @name         Gonkat Canvas Auto Drawer
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Загружает изображение и автоматически "рисует" его в canvas на странице /Gonkat
// @match        https://итд.com/*
// @match        https://xn--d1ah4a.com/*
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    // Создаём стильный интерфейс
    function createImageUploader() {
        const uploaderDiv = document.createElement('div');
        uploaderDiv.id = 'auto-drawer-interface';
        uploaderDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: white;
            min-width: 320px;
            max-width: 380px;
            backdrop-filter: blur(20px);
            animation: slideIn 0.4s ease-out;
        `;

        // Добавляем CSS анимацию
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            #image-upload::file-selector-button {
                padding: 6px 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                margin-right: 10px;
                transition: all 0.3s;
            }

            #image-upload::file-selector-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
            }
        `;
        document.head.appendChild(style);

        uploaderDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
                <h3 style="margin: 0; font-size: 20px; font-weight: 700;
                           background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
                           -webkit-background-clip: text;
                           -webkit-text-fill-color: transparent;
                           background-clip: text;">
                    🎨 Автохудожник
                </h3>
                <div style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%;
                           box-shadow: 0 0 8px #4ade80; animation: pulse 2s infinite;"></div>
            </div>

            <!-- Загрузка изображения -->
            <div style="background: rgba(255,255,255,0.12); border-radius: 12px; padding: 16px;
                       margin-bottom: 14px; border: 1px solid rgba(255,255,255,0.18);
                       box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
                <label style="display: block; margin-bottom: 10px; font-size: 13px;
                              font-weight: 600; opacity: 0.95; letter-spacing: 0.3px;">
                    📁 ЗАГРУЗИТЬ ИЗОБРАЖЕНИЕ
                </label>
                <input type="file" id="image-upload" accept="image/*"
                       style="width: 100%; padding: 10px; border-radius: 8px;
                              background: rgba(255,255,255,0.95); color: #333;
                              font-size: 13px; cursor: pointer; border: 2px solid transparent;
                              transition: all 0.3s; font-family: inherit;">
            </div>

            <!-- Предпросмотр -->
            <div id="preview-container" style="display: none; background: rgba(255,255,255,0.12);
                                              border-radius: 12px; padding: 16px; margin-bottom: 14px;
                                              border: 1px solid rgba(255,255,255,0.18);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <p style="margin: 0; font-size: 13px; font-weight: 600; opacity: 0.95; letter-spacing: 0.3px;">
                        👁️ ПРЕДПРОСМОТР
                    </p>
                    <span id="image-info" style="font-size: 11px; opacity: 0.8;"></span>
                </div>
                <div style="position: relative; border-radius: 8px; overflow: hidden;
                           background: rgba(0,0,0,0.2); border: 2px solid rgba(255,255,255,0.2);">
                    <img id="preview-image" style="width: 100%; display: block; border-radius: 6px;">
                    <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7);
                               padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                        ✓ Готово
                    </div>
                </div>
            </div>

            <!-- Настройки качества -->
            <div style="background: rgba(255,255,255,0.12); border-radius: 12px; padding: 16px;
                       margin-bottom: 14px; border: 1px solid rgba(255,255,255,0.18);">
                <label style="display: block; margin-bottom: 10px; font-size: 13px;
                              font-weight: 600; opacity: 0.95; letter-spacing: 0.3px;">
                    ⚙️ РЕЖИМ РИСОВАНИЯ
                </label>
                <select id="draw-quality"
                        style="width: 100%; padding: 10px 12px; border: none; border-radius: 8px;
                               background: rgba(255,255,255,0.95); color: #333; font-size: 14px;
                               cursor: pointer; font-weight: 600; font-family: inherit;
                               box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s;">
                    <option value="1">⚡ Быстрый (8px шаг)</option>
                    <option value="2" selected>⭐ Обычный (4px шаг)</option>
                    <option value="3">💎 Детальный (2px шаг)</option>
                </select>

                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.15);">
                    <label style="display: flex; align-items: center; font-size: 14px;
                                  cursor: pointer; user-select: none; font-weight: 500;">
                        <input type="checkbox" id="use-colors" checked
                               style="margin-right: 10px; width: 20px; height: 20px; cursor: pointer;
                                      accent-color: #4ade80;">
                        <span>🌈 Цветное рисование</span>
                    </label>
                </div>
            </div>

            <!-- Кнопка запуска -->
            <button id="start-drawing" disabled
                    style="width: 100%; padding: 14px; background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
                           color: white; border: none; border-radius: 10px; cursor: not-allowed;
                           font-size: 16px; font-weight: 700; transition: all 0.3s;
                           box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
                           text-transform: uppercase; letter-spacing: 0.5px;
                           font-family: inherit; opacity: 0.6;">
                ▶️ Начать рисование
            </button>

            <!-- Прогресс -->
            <div id="draw-progress" style="margin-top: 14px; display: none;">
                <div style="background: rgba(255,255,255,0.15); border-radius: 10px;
                           overflow: hidden; height: 32px; position: relative;
                           border: 1px solid rgba(255,255,255,0.2);">
                    <div id="progress-bar"
                         style="width: 0%; height: 100%;
                                background: linear-gradient(90deg, #00d2ff 0%, #3a47d5 100%, #00d2ff 200%);
                                background-size: 200% 100%;
                                transition: width 0.3s ease; display: flex; align-items: center;
                                justify-content: center; font-size: 13px; font-weight: 700;
                                box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
                                animation: shimmer 2s linear infinite;">
                    </div>
                </div>
                <p id="progress-text"
                   style="margin: 10px 0 0 0; font-size: 13px; text-align: center;
                          font-weight: 600; opacity: 0.95;">
                    Подготовка...
                </p>
            </div>

            <!-- Подсказка -->
            <div id="tip" style="margin-top: 14px; padding: 12px; background: rgba(74, 222, 128, 0.15);
                               border-radius: 8px; border: 1px solid rgba(74, 222, 128, 0.3);
                               font-size: 12px; line-height: 1.5; opacity: 0.9;">
                💡 <strong>Совет:</strong> Для лучшего результата используйте изображения с хорошим контрастом
            </div>
        `;

        // Добавляем анимацию для прогресс-бара
        const shimmerStyle = document.createElement('style');
        shimmerStyle.textContent = `
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(shimmerStyle);

        document.body.appendChild(uploaderDiv);
    }

    // Получаем холст
    function getCanvas() {
        return document.querySelector('.drawing-canvas');
    }

    // Получаем контекст холста
    function getContext() {
        const canvas = getCanvas();
        return canvas ? canvas.getContext('2d') : null;
    }

    // Симулируем рисование на холсте
    function drawPixel(x, y, color, size = 2) {
        const canvas = getCanvas();
        if (!canvas) return;

        const ctx = getContext();
        if (!ctx) return;

        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = size;

        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Конвертируем цвет в оттенки серого
    function rgbToGrayscale(r, g, b) {
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        return `rgb(${gray}, ${gray}, ${gray})`;
    }

    // Основная функция рисования
    async function drawImage(image, quality = 2, useColors = true) {
        const canvas = getCanvas();
        if (!canvas) {
            alert('❌ Холст не найден! Откройте окно рисования.');
            return;
        }

        const ctx = getContext();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Масштабируем изображение чтобы заполнить весь холст
        const scaleX = canvasWidth / image.width;
        const scaleY = canvasHeight / image.height;
        const scale = Math.max(scaleX, scaleY);

        const scaledWidth = Math.floor(image.width * scale);
        const scaledHeight = Math.floor(image.height * scale);

        tempCanvas.width = scaledWidth;
        tempCanvas.height = scaledHeight;
        tempCtx.drawImage(image, 0, 0, scaledWidth, scaledHeight);

        const imageData = tempCtx.getImageData(0, 0, scaledWidth, scaledHeight);

        // Определяем шаг в зависимости от качества
        let step, brushSize;
        switch (quality) {
            case 1:
                step = 8;
                brushSize = 10;
                break;
            case 2:
                step = 4;
                brushSize = 5;
                break;
            case 3:
                step = 2;
                brushSize = 2;
                break;
            default:
                step = 4;
                brushSize = 5;
        }

        // Очищаем холст
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Центрируем изображение
        const offsetX = Math.floor((canvasWidth - scaledWidth) / 2);
        const offsetY = Math.floor((canvasHeight - scaledHeight) / 2);

        const cropX = offsetX < 0 ? Math.abs(offsetX) : 0;
        const cropY = offsetY < 0 ? Math.abs(offsetY) : 0;
        const startX = Math.max(0, offsetX);
        const startY = Math.max(0, offsetY);

        // Показываем прогресс
        const progressDiv = document.getElementById('draw-progress');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        progressDiv.style.display = 'block';

        const totalPixels = Math.ceil(scaledHeight / step) * Math.ceil(scaledWidth / step);
        let processedPixels = 0;

        // Рисуем изображение
        for (let y = 0; y < scaledHeight; y += step) {
            for (let x = 0; x < scaledWidth; x += step) {
                const drawX = startX + x - cropX;
                const drawY = startY + y - cropY;

                if (drawX < 0 || drawX >= canvasWidth || drawY < 0 || drawY >= canvasHeight) {
                    continue;
                }

                const index = (y * scaledWidth + x) * 4;
                const r = imageData.data[index];
                const g = imageData.data[index + 1];
                const b = imageData.data[index + 2];
                const a = imageData.data[index + 3];

                if (a > 128) {
                    let color;
                    if (useColors) {
                        color = `rgb(${r}, ${g}, ${b})`;
                    } else {
                        color = rgbToGrayscale(r, g, b);
                    }

                    drawPixel(drawX, drawY, color, brushSize);
                }

                processedPixels++;

                if (processedPixels % 100 === 0) {
                    const progress = Math.floor((processedPixels / totalPixels) * 100);
                    progressBar.style.width = progress + '%';
                    progressBar.textContent = progress + '%';
                    progressText.textContent = `Рисование... ${progress}%`;

                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
        }

        // Завершаем
        progressBar.style.width = '100%';
        progressBar.textContent = '✓';
        progressText.textContent = '✅ Готово! Изображение нарисовано';

        setTimeout(() => {
            progressDiv.style.display = 'none';
        }, 3000);
    }

    // Форматирование размера файла
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Инициализация
    function init() {
        createImageUploader();

        const uploadInput = document.getElementById('image-upload');
        const startButton = document.getElementById('start-drawing');
        const qualitySelect = document.getElementById('draw-quality');
        const useColorsCheckbox = document.getElementById('use-colors');
        const previewContainer = document.getElementById('preview-container');
        const previewImg = document.getElementById('preview-image');
        const imageInfo = document.getElementById('image-info');

        let loadedImage = null;

        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        loadedImage = img;
                        previewImg.src = event.target.result;
                        previewContainer.style.display = 'block';
                        imageInfo.textContent = `${img.width}×${img.height} • ${formatFileSize(file.size)}`;

                        startButton.disabled = false;
                        startButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                        startButton.style.cursor = 'pointer';
                        startButton.style.opacity = '1';
                        startButton.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.4)';

                        startButton.onmouseover = function() {
                            this.style.transform = 'translateY(-2px)';
                            this.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.6)';
                        };
                        startButton.onmouseout = function() {
                            this.style.transform = 'translateY(0)';
                            this.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.4)';
                        };
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        startButton.addEventListener('click', () => {
            if (!loadedImage) {
                alert('⚠️ Сначала загрузите изображение!');
                return;
            }

            const quality = parseInt(qualitySelect.value);
            const useColors = useColorsCheckbox.checked;

            startButton.disabled = true;
            startButton.style.background = 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)';
            startButton.style.cursor = 'not-allowed';
            startButton.textContent = '⏳ Рисование...';

            drawImage(loadedImage, quality, useColors).then(() => {
                startButton.disabled = false;
                startButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                startButton.style.cursor = 'pointer';
                startButton.textContent = '▶️ Начать рисование';
            });
        });
    }

    // Запускаем
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();