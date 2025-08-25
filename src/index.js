import tetrisShader from './shaders/tetrisShader.js';
import rainstickShader from './shaders/rainstickShader.js';
import puyoShader from './shaders/puyoShader.js';
import plasmaPongShader from './shaders/plasmaPongShader.js';
import digDugAntsShader from './shaders/digDugAntsShader.js';
import cascadingShimmerShader from './shaders/cascadingShimmerShader.js';
import dhalsimShader from './shaders/dhalsimShader.js';

// Register the new shader
import turtleCityShader from './shaders/turtleCityShader.js';
import plasma1 from './shaders/plasma1.js';
import plasma2 from './shaders/plasma2.js';
import seedGrowthShader from './shaders/seedGrowthShader.js';
import organicGrowthShader from './shaders/organicGrowthShader.js';
import gridPsychedelicCirclesShader from './shaders/gridPsychedelicCirclesShader.js';
import gridGlyphShader from './shaders/gridGlyphShader.js';
import gridGlyphShader2 from './shaders/gridGlyphShader2.js';
import gridGlyphShader3 from './shaders/gridGlyphShader3.js';
import gridGlyphShader4 from './shaders/gridGlyphShader4.js';
import { marbleMadnessInfiniteShader } from './shaders/marbleMadnessInfiniteShader.js';
import { pachinkoShader } from './shaders/pachinkoShader.js';
import { pachinko70sShader } from './shaders/pachinko70sShader.js';
import { lowPolySpheresShader } from './shaders/lowPolySpheresShader.js';
import { ballpointPen5Shader } from './shaders/ballpointPen5Shader.js';
import { ballpointPen4Shader } from './shaders/ballpointPen4Shader.js';
import { ballpointPen3Shader } from './shaders/ballpointPen3Shader.js';
import { ballpointPen2Shader } from './shaders/ballpointPen2Shader.js';
import { ballpointPenShader } from './shaders/ballpointPenShader.js';
import { win95Maze2Shader } from './shaders/win95Maze2Shader.js';
import { horseRaceShader } from './shaders/horseRaceShader.js';
import { win95MazeShader } from './shaders/win95MazeShader.js';
import { oneill2Shader } from './shaders/oneill2Shader.js';
import { oneillShader } from './shaders/oneillShader.js';
import { oneill3Shader } from './shaders/oneill3Shader.js';
import { starfield2Shader } from './shaders/starfield2Shader.js';
import { aurora3Shader } from './shaders/aurora3Shader.js';
import { aurora2Shader } from './shaders/aurora2Shader.js';
import { starfieldShader } from './shaders/starfieldShader.js';
import gridConcentricCShader from './shaders/gridConcentricCShader.js';
import gridConcentricCShader2 from './shaders/gridConcentricCShader2.js';
import gridConcentricCShader3 from './shaders/gridConcentricCShader3.js';
import { cubesShader } from './shaders/cubesShader.js';
import { cubes2Shader } from './shaders/cubes2Shader.js';
import { cubes3Shader } from './shaders/cubes3Shader.js';
import { cubes4Shader } from './shaders/cubes4Shader.js';
import { dancingLinesShader } from './shaders/dancingLinesShader.js';
import { outrunAsciiShader } from './shaders/outrunAsciiShader.js';
import { pipes95Shader } from './shaders/pipes95Shader.js';
import { pipes95_2Shader } from './shaders/pipes95_2Shader.js';
import { pipes95_3Shader } from './shaders/pipes95_3Shader.js';
import { pipes95_4Shader } from './shaders/pipes95_4Shader.js';
import { shusakuGoShader } from './shaders/shusakuGoShader.js';
import { theWaveShader } from './shaders/theWaveShader.js';
import { theWave2Shader } from './shaders/theWave2Shader.js';
import { theWave3Shader } from './shaders/theWave3Shader.js';
import { theWave4Shader } from './shaders/theWave4Shader.js';
import { auroraShader } from './shaders/auroraShader.js';
import { mandelbrotShader } from './shaders/mandelbrotShader.js';
import { digitalRainShader } from './shaders/digitalRainShader.js';
import fishTankShader from './shaders/fishTankShader.js';
import { randomizeGlyphLineWeights } from './utilities/glyphGenerators.js';

// Glyph Generation Style dropdown
const glyphStyleSelect = document.getElementById('glyph-style-select');
const glyphStyleDropdownContainer = document.getElementById('glyph-style-dropdown-container');
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

// After populating the shader dropdown and setting selectedIndex, update picklist visibility
setTimeout(() => {
	if (glyphStyleDropdownContainer && select) {
		updateGlyphStyleDropdownVisibility();
		select.addEventListener('change', updateGlyphStyleDropdownVisibility);
	}
}, 0);


// Canvas and context setup

const canvas = document.getElementById('plasma-canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width;
let height = canvas.height;
let imageData, data;

// --- Zoom and Pan State ---
let viewZoom = 1;
let viewOffsetX = 0;
let viewOffsetY = 0;
let isPanning = false;
let panStart = {x: 0, y: 0};
let panOrigin = {x: 0, y: 0};

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
	// Calculate available space (subtract dropdown height, e.g. 70px)
	const maxSize = 1000;
	const container = document.getElementById('shader-container');
	const availableWidth = Math.min(window.innerWidth, maxSize);
	const availableHeight = Math.min(window.innerHeight - 70, maxSize);
	const size = Math.min(availableWidth, availableHeight);
	canvas.width = size;
	canvas.height = size;
	width = size;
	height = size;
	imageData = ctx.getImageData(0, 0, width, height);
	data = imageData.data;
	// Set canvas style for crisp rendering
	canvas.style.width = size + 'px';
	canvas.style.height = size + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// Get the shader dropdown element
const select = document.getElementById('shader-select');
const shaders = [
	{shader: plasma1, displayName: 'Demo Scene 1'},
   {shader: plasma2, displayName: 'Demo Scene 2'},
	{shader: cubesShader, displayName: 'Cubes'},
   {shader: cubes2Shader, displayName: 'Cubes 2'},
   {shader: cubes3Shader, displayName: 'Cubes 3'},
   {shader: cubes4Shader, displayName: 'Cubes 4'},
   {shader: dancingLinesShader, displayName: 'Dancing Lines'},
   {shader: outrunAsciiShader, displayName: 'Outrun ASCII'},
   {shader: pipes95Shader, displayName: 'Pipes 95'},
   {shader: pipes95_2Shader, displayName: 'Pipes 95 2'},
   {shader: pipes95_3Shader, displayName: 'Pipes 95 3'},
   {shader: pipes95_4Shader, displayName: 'Pipes 95 4'},
   {shader: shusakuGoShader, displayName: 'Shusaku Go'},
   {shader: theWaveShader, displayName: 'The Wave'},
   {shader: theWave2Shader, displayName: 'The Wave 2'},
   {shader: theWave3Shader, displayName: 'The Wave 3'},
   {shader: theWave4Shader, displayName: 'The Wave 4'},
   {shader: auroraShader, displayName: 'Aurora Borealis'},
   {shader: mandelbrotShader, displayName: 'Mandelbrot Explorer'},
   {shader: digitalRainShader, displayName: 'Digital Rain'},
   {shader: aurora2Shader, displayName: 'Aurora Borealis 2 (Wispy)'},
   {shader: aurora3Shader, displayName: 'Aurora Borealis 3 (Wide/Fast)'},
   {shader: starfieldShader, displayName: 'Starfield (Win95)'},
   {shader: starfield2Shader, displayName: 'Starfield 2 (Hyperspace)'},
   {shader: oneillShader, displayName: "+ Planet + O'Neill Cylinder"},
   {shader: oneill2Shader, displayName: "+ Planet + O'Neill Cylinder 2"},
   {shader: oneill3Shader, displayName: "+ Planet + O'Neill Cylinder 3"},
   {shader: horseRaceShader, displayName: 'Horse Race'},
   {shader: win95MazeShader, displayName: 'Windows 95 Maze Screensaver'},
   {shader: win95Maze2Shader, displayName: 'Windows 95 Maze Screensaver 2'},
   {shader: ballpointPenShader, displayName: 'Ballpoint Pen Drawing'},
   {shader: ballpointPen2Shader, displayName: 'Ballpoint Pen Drawing 2 (Animated)'},
   {shader: ballpointPen3Shader, displayName: 'Ballpoint Pen Drawing 3 (Cumulative)'},
   {shader: ballpointPen4Shader, displayName: 'Ballpoint Pen Drawing 4 (5 Pastel Lines)'},
   {shader: ballpointPen5Shader, displayName: 'Ballpoint Pen Drawing 5 (5 Persistent, Synchronized)'},
   {shader: lowPolySpheresShader, displayName: 'Low-Poly 3D Spheres (Bouncing)'},
   {shader: pachinkoShader, displayName: 'Pachinko (Auto)'},
   {shader: pachinko70sShader, displayName: 'Pachinko (1970s Classic)'},
   {shader: marbleMadnessInfiniteShader, displayName: 'Marble Madness (Infinite)'},
   {shader: gridConcentricCShader, displayName: 'Concentric C Grid'},
   {shader: gridConcentricCShader2, displayName: 'Concentric C Grid 2'},
   {shader: gridConcentricCShader3, displayName: 'Concentric C Grid 3'},
   {shader: gridPsychedelicCirclesShader, displayName: 'Psychedelic Circles'},
	{shader: gridGlyphShader, displayName: 'Grid Glyphs'},
	{shader: gridGlyphShader2, displayName: 'Grid Glyphs 2'},
	{shader: gridGlyphShader3, displayName: 'Grid Glyphs 3'},
		{shader: gridGlyphShader4, displayName: 'Grid Glyphs 4'},
		{shader: fishTankShader, displayName: 'Fish Tank'},
		{shader: seedGrowthShader, displayName: 'Seed Growth'},
			{shader: organicGrowthShader, displayName: 'Organic Growth'},
			{shader: turtleCityShader, displayName: 'Turtle City'},
		dhalsimShader,
		cascadingShimmerShader,
		digDugAntsShader,
			{shader: plasmaPongShader, displayName: 'Plasma Pong'},
			{shader: tetrisShader, displayName: 'Tetris'},
		{shader: puyoShader, displayName: 'Puyo Puyo'},
			{shader: rainstickShader, displayName: 'Rainstick'},

];


// Dynamically populate the dropdown
if (select) {
	select.innerHTML = '';
	shaders.forEach((s, i) => {
		const opt = document.createElement('option');
		opt.value = i;
		opt.textContent = s.displayName || `Shader ${i+1}`;
		select.appendChild(opt);
	});
}
	// Register the new shader
	window.registerShader && window.registerShader(seedGrowthShader);


let currentShader = 0;
if (select) {
	// Always select the last option on page load
	select.selectedIndex = shaders.length - 1;
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
	select.addEventListener('change', () => {
		currentShader = parseInt(select.value, 10) || 0;
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