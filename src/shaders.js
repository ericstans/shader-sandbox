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
import marbleMadnessInfiniteShader from './shaders/marbleMadnessInfiniteShader.js';
import pachinkoShader from './shaders/pachinkoShader.js';
import pachinko70sShader from './shaders/pachinko70sShader.js';
import lowPolySpheresShader from './shaders/lowPolySpheresShader.js';
import { ballpointPen5Shader } from './shaders/ballpointPen5Shader.js';
import { ballpointPen4Shader } from './shaders/ballpointPen4Shader.js';
import { ballpointPen3Shader } from './shaders/ballpointPen3Shader.js';
import { ballpointPen2Shader } from './shaders/ballpointPen2Shader.js';
import { ballpointPenShader } from './shaders/ballpointPenShader.js';
import win95Maze2Shader from './shaders/win95Maze2Shader.js';
import horseRaceShader from './shaders/horseRaceShader.js';
import win95MazeShader from './shaders/win95MazeShader.js';
import oneill2Shader from './shaders/oneill2Shader.js';
import oneillShader from './shaders/oneillShader.js';
import oneill3Shader from './shaders/oneill3Shader.js';
import starfield2Shader from './shaders/starfield2Shader.js';
import { aurora3Shader } from './shaders/aurora3Shader.js';
import { aurora2Shader } from './shaders/aurora2Shader.js';
import starfieldShader from './shaders/starfieldShader.js';
import gridConcentricCShader from './shaders/gridConcentricCShader.js';
import gridConcentricCShader2 from './shaders/gridConcentricCShader2.js';
import gridConcentricCShader3 from './shaders/gridConcentricCShader3.js';
import { cubesShader } from './shaders/cubesShader.js';
import { cubes2Shader } from './shaders/cubes2Shader.js';
import { cubes3Shader } from './shaders/cubes3Shader.js';
import { cubes4Shader } from './shaders/cubes4Shader.js';
import { dancingLinesShader } from './shaders/dancingLinesShader.js';
import outrunAsciiShader from './shaders/outrunAsciiShader.js';
import pipes95Shader from './shaders/pipes95Shader.js';
import pipes95_2Shader from './shaders/pipes95_2Shader.js';
import pipes95_3Shader from './shaders/pipes95_3Shader.js';
import pipes95_4Shader from './shaders/pipes95_4Shader.js';
import { shusakuGoShader } from './shaders/shusakuGoShader.js';
import theWaveShader from './shaders/theWaveShader.js';
import theWave2Shader from './shaders/theWave2Shader.js';
import theWave3Shader from './shaders/theWave3Shader.js';
import theWave4Shader from './shaders/theWave4Shader.js';
import { auroraShader } from './shaders/auroraShader.js';
import mandelbrotShader from './shaders/mandelbrotShader.js';
import { digitalRainShader } from './shaders/digitalRainShader.js';
import fishTankShader from './shaders/fishTankShader.js';
import { randomizeGlyphLineWeights } from './utilities/glyphGenerators.js';
export const shaders = [
	{ shader: plasma1, displayName: 'Demo Scene 1' },
	{ shader: plasma2, displayName: 'Demo Scene 2' },
	{ shader: cubesShader, displayName: 'Cubes' },
	{ shader: cubes2Shader, displayName: 'Cubes 2' },
	{ shader: cubes3Shader, displayName: 'Cubes 3' },
	{ shader: cubes4Shader, displayName: 'Cubes 4' },
	{ shader: dancingLinesShader, displayName: 'Dancing Lines' },
	{ shader: outrunAsciiShader, displayName: 'Outrun ASCII' },
	{ shader: pipes95Shader, displayName: 'Pipes 95' },
	{ shader: pipes95_2Shader, displayName: 'Pipes 95 2' },
	{ shader: pipes95_3Shader, displayName: 'Pipes 95 3' },
	{ shader: pipes95_4Shader, displayName: 'Pipes 95 4' },
	{ shader: shusakuGoShader, displayName: 'Shusaku Go' },
	{ shader: theWaveShader, displayName: 'The Wave' },
	{ shader: theWave2Shader, displayName: 'The Wave 2' },
	{ shader: theWave3Shader, displayName: 'The Wave 3' },
	{ shader: theWave4Shader, displayName: 'The Wave 4' },
	{ shader: auroraShader, displayName: 'Aurora Borealis' },
	{ shader: mandelbrotShader, displayName: 'Mandelbrot Explorer' },
	{ shader: digitalRainShader, displayName: 'Digital Rain' },
	{ shader: aurora2Shader, displayName: 'Aurora Borealis 2 (Wispy)' },
	{ shader: aurora3Shader, displayName: 'Aurora Borealis 3 (Wide/Fast)' },
	{ shader: starfieldShader, displayName: 'Starfield (Win95)' },
	{ shader: starfield2Shader, displayName: 'Starfield 2 (Hyperspace)' },
	{ shader: oneillShader, displayName: "+ Planet + O'Neill Cylinder" },
	{ shader: oneill2Shader, displayName: "+ Planet + O'Neill Cylinder 2" },
	{ shader: oneill3Shader, displayName: "+ Planet + O'Neill Cylinder 3" },
	{ shader: horseRaceShader, displayName: 'Horse Race' },
	{ shader: win95MazeShader, displayName: 'Windows 95 Maze Screensaver' },
	{ shader: win95Maze2Shader, displayName: 'Windows 95 Maze Screensaver 2' },
	{ shader: ballpointPenShader, displayName: 'Ballpoint Pen Drawing' },
	{ shader: ballpointPen2Shader, displayName: 'Ballpoint Pen Drawing 2 (Animated)' },
	{ shader: ballpointPen3Shader, displayName: 'Ballpoint Pen Drawing 3 (Cumulative)' },
	{ shader: ballpointPen4Shader, displayName: 'Ballpoint Pen Drawing 4 (5 Pastel Lines)' },
	{ shader: ballpointPen5Shader, displayName: 'Ballpoint Pen Drawing 5 (5 Persistent, Synchronized)' },
	{ shader: lowPolySpheresShader, displayName: 'Low-Poly 3D Spheres (Bouncing)' },
	{ shader: pachinkoShader, displayName: 'Pachinko (Auto)' },
	{ shader: pachinko70sShader, displayName: 'Pachinko (1970s Classic)' },
	{ shader: marbleMadnessInfiniteShader, displayName: 'Marble Madness (Infinite)' },
	{ shader: gridConcentricCShader, displayName: 'Concentric C Grid' },
	{ shader: gridConcentricCShader2, displayName: 'Concentric C Grid 2' },
	{ shader: gridConcentricCShader3, displayName: 'Concentric C Grid 3' },
	{ shader: gridPsychedelicCirclesShader, displayName: 'Psychedelic Circles' },
	{ shader: gridGlyphShader, displayName: 'Grid Glyphs' },
	{ shader: gridGlyphShader2, displayName: 'Grid Glyphs 2' },
	{ shader: gridGlyphShader3, displayName: 'Grid Glyphs 3' },
	{ shader: gridGlyphShader4, displayName: 'Grid Glyphs 4' },
	
	seedGrowthShader,
	organicGrowthShader,
	turtleCityShader,
	dhalsimShader,
	cascadingShimmerShader,
	digDugAntsShader,
	{ shader: plasmaPongShader, displayName: 'Plasma Pong' },
	{ shader: tetrisShader, displayName: 'Tetris' },
	{ shader: puyoShader, displayName: 'Puyo Puyo' },
	{ shader: rainstickShader, displayName: 'Rainstick' },
    { shader: fishTankShader, displayName: 'Fish Tank' }
];