import seedGrowthShader from './shaders/seedGrowthShader.js';
import gridGlyphShader4 from './shaders/gridGlyphShader4.js';
import { randomizeGlyphLineWeights } from './utilities/glyphGenerators.js';
import { shaders } from './shaders.js';

// Glyph Generation Style dropdown
const glyphStyleSelect = document.getElementById('glyph-style-select');
const glyphStyleDropdownContainer = document.getElementById('glyph-style-dropdown-container');
const shaderSelectContainer = document.getElementById('shader-select-container');
window.currentGlyphStyle = 'original';
function updateGlyphStyleDropdownVisibility() {
	// Find the index of Grid Glyphs 4 in the shaders array
	let gridGlyphs4Index = -1;
	for (let i = 0; i < shaders.length; i++) {
		if ((shaders[i].displayName || '').toLowerCase().includes('grid glyphs 4')) {
			gridGlyphs4Index = i;
			break;
		}
	}
	if (glyphStyleDropdownContainer) {
		if (select.selectedIndex === gridGlyphs4Index) {
			glyphStyleDropdownContainer.style.display = '';
		} else {
			glyphStyleDropdownContainer.style.display = 'none';
		}
	}
}
if (glyphStyleSelect) {
	glyphStyleSelect.value = 'original';
	glyphStyleSelect.addEventListener('change', () => {
		window.currentGlyphStyle = glyphStyleSelect.value;
		// Immediately reset glyphs to update the grid with the new style
		if (typeof window.resetGlyphs === 'function') {
			// Use the current canvas size
			const canvas = document.getElementById('plasma-canvas');
			if (canvas) {
				randomizeGlyphLineWeights();
				window.resetGlyphs(canvas.width, canvas.height);
			}
		}
	});
	// Expose resetGlyphs globally so the picklist can trigger it
	window.resetGlyphs = gridGlyphShader4.resetState;
}

// Ensure the picklist is hidden by default
if (glyphStyleDropdownContainer) {
	glyphStyleDropdownContainer.style.display = 'none';
}

// Hide the picklist if 'noselect' URL parameter is present
let noSelectParam = new URLSearchParams(window.location.search).get('noselect')
console.log('noSelectParam', noSelectParam)
if (noSelectParam) {
	console.log('param found')
	if (shaderSelectContainer) {
		shaderSelectContainer.style.display = 'none';
		console.log('Shader dropdown hidden');
	}
}

// After populating the shader dropdown and setting selectedIndex, update picklist visibility
setTimeout(() => {
	if (glyphStyleDropdownContainer && select) {
		updateGlyphStyleDropdownVisibility();
		select.addEventListener('change', updateGlyphStyleDropdownVisibility);
	}
}, 0);


// Canvas and context setup
// Borderless mode logic
const borderlessParam = new URLSearchParams(window.location.search).get('borderless');
if (borderlessParam) {
	// Hide shader select container
	document.getElementsByTagName('body')[0].classList.add('borderless');
	const shaderSelectContainer = document.getElementById('shader-select-container');
	if (shaderSelectContainer) shaderSelectContainer.style.display = 'none';
	// Remove max-width/max-height from canvas, shader-container, shader-inner-container
	const canvasEl = document.getElementById('plasma-canvas');
	const shaderContainer = document.getElementById('shader-container');
	const shaderInnerContainer = document.querySelector('.shader-inner-container');
	if (canvasEl) {
		canvasEl.style.maxWidth = '';
		canvasEl.style.maxHeight = '';
		canvasEl.style.width = '100vw';
		canvasEl.style.height = '100vh';
	}
	if (shaderContainer) {
		shaderContainer.style.maxWidth = '';
		shaderContainer.style.maxHeight = '';
		shaderContainer.style.width = '100vw';
		shaderContainer.style.height = '100vh';
	}
	if (shaderInnerContainer) {
		shaderInnerContainer.style.maxWidth = '';
		shaderInnerContainer.style.maxHeight = '';
		shaderInnerContainer.style.width = '100vw';
		shaderInnerContainer.style.height = '100vh';
	}
	// Resize canvas pixels to match window
	if (canvasEl) {
		canvasEl.width = window.innerWidth;
		canvasEl.height = window.innerHeight;
	}
}

const canvas = document.getElementById('plasma-canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width;
let height = canvas.height;
let imageData, data;

// --- Fullscreen Button Overlay ---
let fullscreenBtn = null;
let fullscreenBtnVisible = false;
function createFullscreenButton() {
	if (fullscreenBtn) return;
	fullscreenBtn = document.createElement('div');
	fullscreenBtn.innerHTML = '<svg width="38" height="38" viewBox="0 0 38 38"><rect x="8" y="8" width="22" height="22" rx="4" fill="#222" opacity="0.85"/><path d="M13 17v-4h4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 21v4h-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 13h-4v-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 25h4v4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
	fullscreenBtn.style.position = 'fixed';
	fullscreenBtn.style.width = '38px';
	fullscreenBtn.style.height = '38px';
	fullscreenBtn.style.bottom = '24px';
	fullscreenBtn.style.right = '24px';
	fullscreenBtn.style.zIndex = 10010;
	fullscreenBtn.style.cursor = 'pointer';
	fullscreenBtn.style.display = 'none';
	fullscreenBtn.style.transition = 'opacity 0.2s';
	fullscreenBtn.style.opacity = '0.92';
	fullscreenBtn.title = 'Full screen';
	fullscreenBtn.addEventListener('click', () => {
		const container = document.getElementById('shader-container') || canvas.parentElement;
		if (!document.fullscreenElement) {
			if (container.requestFullscreen) {
				container.requestFullscreen();
			} else if (container.webkitRequestFullscreen) {
				container.webkitRequestFullscreen();
			} else if (container.mozRequestFullScreen) {
				container.mozRequestFullScreen();
			} else if (container.msRequestFullscreen) {
				container.msRequestFullscreen();
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
		}
	});

	// Fullscreen UI logic
	// Store original canvas size
	let origCanvasWidth = canvas.width;
	let origCanvasHeight = canvas.height;
	let origMaxWidth = canvas.style.maxWidth;
	let origMaxHeight = canvas.style.maxHeight;
	function setFullscreenUI(isFullscreen) {
		const select = document.getElementById('shader-select');
		if (select) {
			select.style.display = isFullscreen ? 'none' : '';
		}
		if (isFullscreen) {
			canvas.style.position = 'fixed';
			canvas.style.left = '0';
			canvas.style.top = '0';
			canvas.style.width = '100vw';
			canvas.style.height = '100vh';
			canvas.style.zIndex = 10000;
			canvas.style.maxWidth = 'none';
			canvas.style.maxHeight = 'none';
			// Set canvas pixel size to match screen
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		} else {
			canvas.style.position = '';
			canvas.style.left = '';
			canvas.style.top = '';
			canvas.style.width = '';
			canvas.style.height = '';
			canvas.style.zIndex = '';
			canvas.style.maxWidth = '';
			canvas.style.maxHeight = '';
			// Restore canvas pixel size
			canvas.width = origCanvasWidth;
			canvas.height = origCanvasHeight;
		}
		if (typeof resizeCanvas === 'function') resizeCanvas();
	}
	// Also resize canvas if window size changes in fullscreen
	window.addEventListener('resize', () => {
		if (document.fullscreenElement === (document.getElementById('shader-container') || canvas.parentElement)) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			if (typeof resizeCanvas === 'function') resizeCanvas();
		}
	});

	document.addEventListener('fullscreenchange', () => {
		setFullscreenUI(!!document.fullscreenElement);
		// If entering fullscreen and Fish Tank is active, regenerate scenery
		if (document.fullscreenElement) {
			// Find the current shader's displayName
			let shaderObj = shaders[currentShader];
			let shader = shaderObj && (shaderObj.shader || shaderObj);
			if (shader && (shader.displayName === 'Fish Tank' || shaderObj.displayName === 'Fish Tank')) {
				if (typeof shader.onResize === 'function') {
					shader.onResize({ canvas, ctx, width: canvas.width, height: canvas.height });
				}
			}
		}
	});
	document.body.appendChild(fullscreenBtn);
}

function updateFullscreenButtonPosition() {
	if (!fullscreenBtn || !canvas) return;
	const rect = canvas.getBoundingClientRect();
	fullscreenBtn.style.left = (rect.right - 38 - 12) + 'px';
	fullscreenBtn.style.top = (rect.bottom - 38 - 12) + 'px';
}

function showFullscreenButton() {
	if (fullscreenBtn) {
		fullscreenBtn.style.display = 'block';
		fullscreenBtnVisible = true;
		updateFullscreenButtonPosition();
	}
}
function hideFullscreenButton() {
	if (fullscreenBtn) {
		fullscreenBtn.style.display = 'none';
		fullscreenBtnVisible = false;
	}
}


// Only show fullscreen button when mouse is in bottom right corner of canvas
function isInFullscreenCorner(e) {
	const rect = canvas.getBoundingClientRect();
	const x = e.clientX;
	const y = e.clientY;
	// 60x60px area in bottom right
	return (
		x >= rect.right - 60 && x <= rect.right &&
		y >= rect.bottom - 60 && y <= rect.bottom
	);
}

let fullscreenCornerActive = false;
function shouldShowFullscreenButton(e) {
	if (isInFullscreenCorner(e)) return true;
	if (fullscreenBtn) {
		const btnRect = fullscreenBtn.getBoundingClientRect();
		if (
			e.clientX >= btnRect.left && e.clientX <= btnRect.right &&
			e.clientY >= btnRect.top && e.clientY <= btnRect.bottom
		) {
			return true;
		}
	}
	return false;
}

function handleMouseMove(e) {
	createFullscreenButton();
	if (shouldShowFullscreenButton(e)) {
		if (!fullscreenCornerActive) {
			showFullscreenButton();
			fullscreenCornerActive = true;
		}
		updateFullscreenButtonPosition();
	} else {
		if (fullscreenCornerActive) {
			hideFullscreenButton();
			fullscreenCornerActive = false;
		}
	}
}

canvas.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseleave', () => {
	hideFullscreenButton();
	fullscreenCornerActive = false;
});
window.addEventListener('resize', updateFullscreenButtonPosition);
window.addEventListener('scroll', updateFullscreenButtonPosition, true);

// --- Zoom and Pan State ---
let viewZoom = 1;
let viewOffsetX = 0;
let viewOffsetY = 0;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOrigin = { x: 0, y: 0 };

canvas.addEventListener('wheel', (e) => {
	e.preventDefault();
	const zoomIntensity = 1.08;
	const mouseX = (e.offsetX - viewOffsetX) / viewZoom;
	const mouseY = (e.offsetY - viewOffsetY) / viewZoom;
	if (e.deltaY < 0) {
		// Zoom in
		viewZoom *= zoomIntensity;
	} else {
		// Zoom out, but do not allow below 1
		viewZoom = Math.max(1, viewZoom / zoomIntensity);
	}
	// Adjust offset so zoom is centered on mouse
	let newOffsetX = e.offsetX - mouseX * viewZoom;
	let newOffsetY = e.offsetY - mouseY * viewZoom;
	// Clamp after zoom
	const minX = Math.min(0, width - width * viewZoom);
	const maxX = 0;
	const minY = Math.min(0, height - height * viewZoom);
	const maxY = 0;
	viewOffsetX = Math.max(minX, Math.min(maxX, newOffsetX));
	viewOffsetY = Math.max(minY, Math.min(maxY, newOffsetY));
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
	if (e.button === 1) { // Middle mouse
		isPanning = true;
		panStart.x = e.clientX;
		panStart.y = e.clientY;
		panOrigin.x = viewOffsetX;
		panOrigin.y = viewOffsetY;
		e.preventDefault();
	}
});
window.addEventListener('mousemove', (e) => {
	if (isPanning) {
		let newOffsetX = panOrigin.x + (e.clientX - panStart.x);
		let newOffsetY = panOrigin.y + (e.clientY - panStart.y);
		// Clamp so the image cannot be panned outside the canvas
		const minX = Math.min(0, width - width * viewZoom);
		const maxX = 0;
		const minY = Math.min(0, height - height * viewZoom);
		const maxY = 0;
		viewOffsetX = Math.max(minX, Math.min(maxX, newOffsetX));
		viewOffsetY = Math.max(minY, Math.min(maxY, newOffsetY));
	}
});
window.addEventListener('mouseup', (e) => {
	if (e.button === 1) {
		isPanning = false;
	}
});


function resizeCanvas() {
	// If in fullscreen, use full window size
	const isFullscreen = document.fullscreenElement === (document.getElementById('shader-container') || canvas.parentElement);
	const isBorderless = new URLSearchParams(window.location.search).get('borderless');
	let size;
	if (isFullscreen || isBorderless) {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
	} else {
		// Calculate available space (subtract dropdown height, e.g. 70px)
		const maxSize = 1000;
		const availableWidth = Math.min(window.innerWidth, maxSize);
		const availableHeight = Math.min(window.innerHeight - 70, maxSize);
		size = Math.min(availableWidth, availableHeight);
		canvas.width = size;
		canvas.height = size;
		width = size;
		height = size;
		canvas.style.width = size + 'px';
		canvas.style.height = size + 'px';
	}
	imageData = ctx.getImageData(0, 0, width, height);
	data = imageData.data;

	// Call the current shader's onResize handler if it exists
	if (typeof currentShader !== 'undefined' && shaders[currentShader]) {
		const shaderObj = shaders[currentShader].shader || shaders[currentShader];
		if (typeof shaderObj.onResize === 'function') {
			shaderObj.onResize({ canvas, ctx, width, height });
		}
	}
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// Get the shader dropdown element
const select = document.getElementById('shader-select');



// Dynamically populate the dropdown
if (select) {
	select.innerHTML = '';
	shaders.forEach((s, i) => {
		const opt = document.createElement('option');
		opt.value = i;
		opt.textContent = s.displayName || `Shader ${i + 1}`;
		select.appendChild(opt);
	});
}
// Register the new shader
window.registerShader && window.registerShader(seedGrowthShader);


let currentShader = 0;
if (select) {
	// Check for shader URL parameter
	let urlParams = new URLSearchParams(window.location.search);
	let shaderParam = urlParams.get('shader');
	let initialIndex = shaders.length - 1; // default: last shader
	if (shaderParam) {
		// Try to match by displayName (case-insensitive)
		let found = shaders.findIndex(s => {
			let name = s.displayName || (s.shader && s.shader.displayName);
			return name && name.toLowerCase().replace(/\s+/g, '') === shaderParam.toLowerCase().replace(/\s+/g, '');
		});
		if (found !== -1) {
			initialIndex = found;
		} else if (!isNaN(Number(shaderParam)) && Number(shaderParam) >= 0 && Number(shaderParam) < shaders.length) {
			initialIndex = Number(shaderParam);
		}
	}
	select.selectedIndex = initialIndex;
	currentShader = select.selectedIndex;
	// On load, initialize state for the active shader
	if (shaders[currentShader] && shaders[currentShader].shader && shaders[currentShader].shader.onResize) {
		shaders[currentShader].shader.onResize({ canvas, ctx, width, height });
	} else if (shaders[currentShader] && shaders[currentShader].onResize) {
		shaders[currentShader].onResize({ canvas, ctx, width, height });
	}
	// On load, set click handler if shader provides it
	if (shaders[currentShader] && shaders[currentShader].shader && shaders[currentShader].shader.onClick) {
		canvas.onclick = (e) => shaders[currentShader].shader.onClick(e, { canvas, ctx, width, height });
	} else if (shaders[currentShader] && shaders[currentShader].onClick) {
		canvas.onclick = (e) => shaders[currentShader].onClick(e, { canvas, ctx, width, height });
	} else {
		canvas.onclick = null;
	}
	let previousShader = currentShader;
	select.addEventListener('change', () => {
		// Call onChangedAway on the previous shader if it exists
		if (shaders[previousShader]) {
			const s = shaders[previousShader].shader || shaders[previousShader];
			if (typeof s.onChangedAway === 'function') {
				s.onChangedAway();
			}
		}
		currentShader = parseInt(select.value, 10) || 0;
		previousShader = currentShader;
		// Reset zoom and pan to default
		viewZoom = 1;
		viewOffsetX = 0;
		viewOffsetY = 0;
		// Remove any previous click handler
		canvas.onclick = null;
		// If the shader module provides a click handler, set it
		if (shaders[currentShader] && shaders[currentShader].shader && shaders[currentShader].shader.onClick) {
			canvas.onclick = (e) => shaders[currentShader].shader.onClick(e, { canvas, ctx, width, height });
		} else if (shaders[currentShader] && shaders[currentShader].onClick) {
			canvas.onclick = (e) => shaders[currentShader].onClick(e, { canvas, ctx, width, height });
		}
		// On shader switch, initialize state for the new shader
		if (shaders[currentShader] && shaders[currentShader].shader && shaders[currentShader].shader.onResize) {
			shaders[currentShader].shader.onResize({ canvas, ctx, width, height });
		} else if (shaders[currentShader] && shaders[currentShader].onResize) {
			shaders[currentShader].onResize({ canvas, ctx, width, height });
		}

		// Update the URL parameter for shader using the displayName (normalized)
		const url = new URL(window.location.href);
		let shaderObj = shaders[currentShader];
		let name = shaderObj.displayName || (shaderObj.shader && shaderObj.shader.displayName) || '';
		let normalized = name.toLowerCase().replace(/\s+/g, '');
		url.searchParams.set('shader', normalized);
		window.history.replaceState({}, '', url);
	});
}

function render(time) {
	const t = time * 0.002;
	// If canvas size changed, update imageData/data
	if (canvas.width !== width || canvas.height !== height) {
		width = canvas.width;
		height = canvas.height;
		imageData = ctx.getImageData(0, 0, width, height);
		data = imageData.data;
		// If the shader module provides a resize handler, call it
		if (shaders[currentShader] && shaders[currentShader].shader && shaders[currentShader].shader.onResize) {
			shaders[currentShader].shader.onResize({ canvas, ctx, width, height });
		} else if (shaders[currentShader] && shaders[currentShader].onResize) {
			shaders[currentShader].onResize({ canvas, ctx, width, height });
		}
	}
	// Apply pan/zoom transform
	ctx.save();
	ctx.setTransform(viewZoom, 0, 0, viewZoom, viewOffsetX, viewOffsetY);
	// Animate function
	if (shaders[currentShader] && shaders[currentShader].shader && typeof shaders[currentShader].shader.animate === 'function') {
		shaders[currentShader].shader.animate(ctx, t, width, height);
	} else if (shaders[currentShader] && typeof shaders[currentShader].animate === 'function') {
		shaders[currentShader].animate(ctx, t, width, height);
	} else if (shaders[currentShader] && typeof shaders[currentShader].shader === 'function') {
		shaders[currentShader].shader(ctx, t, width, height);
	} else if (typeof shaders[currentShader] === 'function') {
		shaders[currentShader](ctx, t, width, height);
	}
	ctx.restore();
	requestAnimationFrame(render);
}
requestAnimationFrame(render);