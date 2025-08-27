// Fish species definitions for the fish tank simulation
// Each species is an object with name, body, tail, color, and optional properties

export const speciesList = [
    {
        name: 'Eyeball Fish',
        body: { rx: 0.5, ry: 0.5 },
        tail: { len: 0.18, height: 0.18, style: 'fan' },
        color: () => `hsl(320,90%,65%)`,
        eye: '#fff',
        bigEye: true
    },
    {
        name: 'Clown Loach',
        body: { rx: 1.1, ry: 0.28 },
        tail: { len: 0.32, height: 0.18, style: 'fork' },
        color: () => `hsl(32,90%,55%)`,
        eye: '#222',
        size: 28 + Math.random()*10,
        hasStripes: true,
        whiskers: true
    },
    {
        name: 'Sturgeon',
        body: { rx: 1.3, ry: 0.22 },
        tail: { len: 0.7, height: 0.18, style: 'sturgeon' },
        color: () => `hsl(${110+Math.random()*20},60%,32%)`,
        eye: '#fff',
        size: 44 + Math.random()*12
    },
    {
        name: 'Goldfish',
        body: { rx: 0.7, ry: 0.32 },
        tail: { len: 0.38, height: 0.28, style: 'fan' },
        color: () => `hsl(${35+Math.random()*20},90%,60%)`,
        eye: '#fff',
    },
    {
        name: 'Neon Tetra',
        body: { rx: 0.9, ry: 0.18 },
        tail: { len: 0.22, height: 0.12, style: 'fork' },
        color: () => `hsl(200,80%,60%)`,
        stripe: true,
        eye: '#fff',
    },
    {
        name: 'Betta',
        body: { rx: 0.7, ry: 0.32 },
        tail: { len: 0.7, height: 0.5, style: 'veil' },
        color: () => `hsl(${300+Math.random()*60},70%,60%)`,
        eye: '#fff',
    },
    {
        name: 'Corydoras',
        body: { rx: 0.6, ry: 0.28 },
        tail: { len: 0.28, height: 0.18, style: 'fan' },
        color: () => `hsl(${90+Math.random()*40},40%,60%)`,
        eye: '#fff',
    },
    {
        name: 'Guppy',
        body: { rx: 0.5, ry: 0.22 },
        tail: { len: 0.5, height: 0.32, style: 'triangle' },
        color: () => `hsl(${Math.floor(Math.random()*360)},80%,65%)`,
        eye: '#fff',
    },
];
