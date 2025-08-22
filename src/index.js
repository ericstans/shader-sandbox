import { oneill2Shader } from './shaders/oneill2Shader.js';
import { oneillShader } from './shaders/oneillShader.js';
import { starfield2Shader } from './shaders/starfield2Shader.js';
import { aurora3Shader } from './shaders/aurora3Shader.js';
import { aurora2Shader } from './shaders/aurora2Shader.js';
import { starfieldShader } from './shaders/starfieldShader.js';
	// --- Shader imports ---

	// Canvas and context setup
	const canvas = document.getElementById('plasma-canvas');
	const ctx = canvas.getContext('2d');
	let width = canvas.width;
	let height = canvas.height;
	let imageData, data;

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
	import { plasma1 } from './shaders/plasma1.js';
	import { plasma2 } from './shaders/plasma2.js';
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
	// Shader 11: Pipes 95 3 (slower, further apart, longer-lasting pipes)
	

	// Import shared cube utilities
	import { drawCubesBase, drawSolidCubeCustom } from './shaders/cubeUtils.js';

	// HSL to RGB helper for Cubes 3
	function hslToRgb(h, s, l) {
		let r, g, b;
		if (s === 0) {
			r = g = b = l;
		} else {
			const hue2rgb = (p, q, t) => {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;
				if (t < 1/6) return p + (q - p) * 6 * t;
				if (t < 1/2) return q;
				if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
				return p;
			};
			const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			const p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
		}
		return [Math.floor(r*255), Math.floor(g*255), Math.floor(b*255)];
	}


	// Get the shader dropdown element
	const select = document.getElementById('shader-select');
	const shaders = [
		plasma1, plasma2, cubesShader, cubes2Shader, cubes3Shader, cubes4Shader, dancingLinesShader, outrunAsciiShader,
		pipes95Shader, pipes95_2Shader, pipes95_3Shader, pipes95_4Shader, shusakuGoShader, theWaveShader, theWave2Shader, theWave3Shader, theWave4Shader,
		auroraShader, mandelbrotShader, digitalRainShader, aurora2Shader, aurora3Shader, starfieldShader, starfield2Shader, oneillShader, oneill2Shader
	];
	let currentShader = 0;
	if (select) {
		// Always select the last option on page load
		select.selectedIndex = shaders.length - 1;
		currentShader = select.selectedIndex;
		select.addEventListener('change', () => {
			currentShader = parseInt(select.value, 10) || 0;
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
		}
		if (currentShader < 2) {
			// Plasma shaders (pixel-based)
			let i = 0;
			const plasma = shaders[currentShader];
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					const v = plasma(x, y, t);
					// Map v from [-3,3] or [-4,4] to [0,1]
					const norm = (v + 4) / 8;
					// Color palette
					const r = Math.floor(128 + 128 * Math.sin(Math.PI * norm));
					const g = Math.floor(128 + 128 * Math.sin(Math.PI * norm + 2));
					const b = Math.floor(128 + 128 * Math.sin(Math.PI * norm + 4));
					data[i++] = r;
					data[i++] = g;
					data[i++] = b;
					data[i++] = 255;
				}
			}
			ctx.putImageData(imageData, 0, 0);
		} else {
			// Cubes/shader scenes: pass ctx, t, width, height for responsive drawing
			shaders[currentShader](ctx, t, width, height);
		}
		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
// ...existing code...