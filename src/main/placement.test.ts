import { describe, expect, it } from 'vitest';
import { clampMainBounds, placeSpotlight } from './placement';

describe('spotlight placement', () => {
  const area = { x: 0, y: 0, width: 1440, height: 900 };

  it('fits the compact popup around a central cursor without scale conversion', () => {
    expect(placeSpotlight({ x: 720, y: 400 }, area)).toEqual({ x: 390, y: 416, width: 660, height: 364 });
  });

  it('uses the space above a bottom-edge cursor', () => {
    const result = placeSpotlight({ x: 1435, y: 890 }, area);
    expect(result.x + result.width).toBeLessThanOrEqual(area.x + area.width - 16);
    expect(result.y).toBeGreaterThanOrEqual(area.y + 16);
    expect(result.y + result.height).toBeLessThanOrEqual(area.y + area.height - 16);
    expect(result.y).toBe(510);
  });

  it('supports negative-coordinate displays and expanded height', () => {
    const result = placeSpotlight({ x: -760, y: 260 }, { x: -1600, y: -100, width: 1600, height: 900 }, 'expanded');
    expect(result).toEqual({ x: -1090, y: -84, width: 660, height: 620 });
  });

  it('uses the available width on a narrow work area', () => {
    const result = placeSpotlight({ x: 200, y: 100 }, { x: 0, y: 0, width: 420, height: 700 });
    expect(result.width).toBe(388);
    expect(result.x).toBe(16);
  });
});

describe('main window restoration', () => {
  it('clamps saved bounds to the present work area, including negative displays', () => {
    expect(clampMainBounds({ width: 1400, height: 900, x: -2000, y: 400 }, { x: -1280, y: 0, width: 1280, height: 800 })).toEqual({
      width: 1280,
      height: 800,
      x: -1280,
      y: 0,
      isMaximized: false,
    });
  });
});
