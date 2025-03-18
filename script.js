// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const previewImage = document.getElementById('previewImage');
const analysisSection = document.getElementById('analysisSection');
const analyzeButton = document.getElementById('analyzeButton');
const resultsSection = document.getElementById('resultsSection');
const colorBar = document.getElementById('colorBar');
const colorDetails = document.getElementById('colorDetails');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdValue = document.getElementById('thresholdValue');

// Constants
let COLOR_SIMILARITY_THRESHOLD = 30; // Now updated by slider
const MAX_COLORS = 10; // Maximum number of colors to display

// Event Listeners
uploadButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
analyzeButton.addEventListener('click', analyzeColors);
thresholdSlider.addEventListener('input', handleThresholdChange);

// Threshold handling
function handleThresholdChange(e) {
    COLOR_SIMILARITY_THRESHOLD = parseInt(e.target.value);
    thresholdValue.textContent = COLOR_SIMILARITY_THRESHOLD;
    if (previewImage.src) {
        analyzeColors(); // Re-analyze with new threshold
    }
}

// File handling functions
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        processFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        processFile(file);
    }
}

function processFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        analysisSection.style.display = 'block';
        resultsSection.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Color analysis functions
function analyzeColors() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = previewImage.width;
    canvas.height = previewImage.height;
    ctx.drawImage(previewImage, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colors = extractColors(imageData);
    const groupedColors = groupSimilarColors(colors);
    const sortedColors = sortColorsByPercentage(groupedColors);
    
    displayResults(sortedColors);
}

function extractColors(imageData) {
    const colorMap = new Map();
    const data = imageData.data;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const hex = rgbToHex(r, g, b);
        
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
    }

    return Array.from(colorMap.entries()).map(([hex, count]) => ({
        hex,
        count,
        percentage: (count / totalPixels) * 100
    }));
}

function groupSimilarColors(colors) {
    const groups = new Map();
    
    colors.forEach(color => {
        const hsl = hexToHSL(color.hex);
        let foundGroup = false;

        for (const [groupHex, group] of groups) {
            const groupHSL = hexToHSL(groupHex);
            if (isSimilarColor(hsl, groupHSL)) {
                group.count += color.count;
                group.percentage += color.percentage;
                foundGroup = true;
                break;
            }
        }

        if (!foundGroup) {
            groups.set(color.hex, {
                hex: color.hex,
                count: color.count,
                percentage: color.percentage
            });
        }
    });

    return Array.from(groups.values());
}

function isSimilarColor(hsl1, hsl2) {
    const hDiff = Math.abs(hsl1.h - hsl2.h);
    const sDiff = Math.abs(hsl1.s - hsl2.s);
    const lDiff = Math.abs(hsl1.l - hsl2.l);
    
    return hDiff < COLOR_SIMILARITY_THRESHOLD &&
           sDiff < COLOR_SIMILARITY_THRESHOLD &&
           lDiff < COLOR_SIMILARITY_THRESHOLD;
}

function sortColorsByPercentage(colors) {
    return colors
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, MAX_COLORS);
}

// Display functions
function displayResults(colors) {
    // Clear previous results
    colorBar.innerHTML = '';
    colorDetails.innerHTML = '';

    // Create color bar
    colors.forEach(color => {
        const segment = document.createElement('div');
        segment.className = 'color-segment';
        segment.style.backgroundColor = color.hex;
        segment.style.width = `${color.percentage}%`;
        
        const percentage = document.createElement('span');
        percentage.className = 'percentage';
        percentage.textContent = `${Math.round(color.percentage)}%`;
        
        segment.appendChild(percentage);
        colorBar.appendChild(segment);
    });

    // Create color details
    colors.forEach(color => {
        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color.hex;
        
        const info = document.createElement('div');
        info.className = 'color-info';
        
        const hex = document.createElement('div');
        hex.className = 'color-hex';
        hex.textContent = color.hex;
        
        const percentage = document.createElement('div');
        percentage.className = 'color-percentage';
        percentage.textContent = `${Math.round(color.percentage)}%`;
        
        info.appendChild(hex);
        info.appendChild(percentage);
        colorItem.appendChild(swatch);
        colorItem.appendChild(info);
        colorDetails.appendChild(colorItem);
    });

    resultsSection.style.display = 'block';
}

// Utility functions
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function hexToHSL(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
} 