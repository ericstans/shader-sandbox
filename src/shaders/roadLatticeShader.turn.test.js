import { computeTurn } from './roadLatticeShader.js';

const GRID_SIZE = 10;

function makeCar(dir, direction, road, lane, pos) {
  return { dir, direction, road, lane, pos };
}

function makeIntersection(x, y) {
  return { x, y };
}

describe('computeTurn', () => {
  test('left turn from horizontal', () => {
    const car = makeCar('h', 1, 3, 1, 0.3);
    const inter = makeIntersection(5, 4);
    const result = computeTurn(car, inter, 'left', GRID_SIZE);
    expect(result).toEqual({
      dir: 'v',
      direction: -1,
      road: 4, // intersection.y
      lane: 1,
      pos: 4 / GRID_SIZE,
    });
  });

  test('right turn from horizontal', () => {
    const car = makeCar('h', -1, 3, 0, 0.3);
    const inter = makeIntersection(5, 4);
    const result = computeTurn(car, inter, 'right', GRID_SIZE);
    expect(result).toEqual({
      dir: 'v',
      direction: -1,
      road: 5, // intersection.x
      lane: 1,
      pos: 4 / GRID_SIZE,
    });
  });

  test('left turn from vertical', () => {
    const car = makeCar('v', 1, 2, 0, 0.2);
    const inter = makeIntersection(6, 7);
    const result = computeTurn(car, inter, 'left', GRID_SIZE);
    expect(result).toEqual({
      dir: 'h',
      direction: -1,
      road: 7, // intersection.x
      lane: 0,
      pos: 6 / GRID_SIZE,
    });
  });

  test('right turn from vertical', () => {
    const car = makeCar('v', -1, 2, 1, 0.2);
    const inter = makeIntersection(6, 7);
    const result = computeTurn(car, inter, 'right', GRID_SIZE);
    expect(result).toEqual({
      dir: 'h',
      direction: -1,
      road: 7, // intersection.y
      lane: 0,
      pos: 6 / GRID_SIZE,
    });
  });

  test('straight', () => {
    const car = makeCar('h', 1, 3, 1, 0.3);
    const inter = makeIntersection(5, 4);
    const result = computeTurn(car, inter, 'straight', GRID_SIZE);
    expect(result).toEqual({
      dir: 'h',
      direction: 1,
      road: 3,
      lane: 1,
      pos: 0.3,
    });
  });
});