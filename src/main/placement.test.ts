import { describe, expect, it } from 'vitest';
import {
  clampMainBounds,
  MAIN_WINDOW_TARGET,
  placeAdaptiveSurface,
  placeSpotlight,
  shouldDismissSpotlightOnBlur,
  SPOTLIGHT_BOUNDS,
  SPOTLIGHT_MARGIN,
  SURFACE_LAYOUT_MARGIN,
} from './placement';

describe('spotlight placement', () => {
  const area = { x: 0, y: 0, width: 1440, height: 900 };

  it('fits the compact popup around a central cursor without scale conversion', () => {
    expect(placeSpotlight({ x: 720, y: 400 }, area)).toEqual({
      x: 390,
      y: 400 + SPOTLIGHT_MARGIN,
      ...SPOTLIGHT_BOUNDS.compact,
    });
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

  it('keeps the named expanded bounds inside the work area', () => {
    const result = placeSpotlight({ x: 720, y: 400 }, area, 'expanded');
    expect(result.width).toBe(SPOTLIGHT_BOUNDS.expanded.width);
    expect(result.height).toBe(SPOTLIGHT_BOUNDS.expanded.height);
    expect(result.x).toBeGreaterThanOrEqual(area.x + SPOTLIGHT_MARGIN);
    expect(result.y).toBeGreaterThanOrEqual(area.y + SPOTLIGHT_MARGIN);
    expect(result.x + result.width).toBeLessThanOrEqual(area.x + area.width - SPOTLIGHT_MARGIN);
    expect(result.y + result.height).toBeLessThanOrEqual(area.y + area.height - SPOTLIGHT_MARGIN);
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

  it('preserves the saved maximized state while clamping normal bounds', () => {
    expect(clampMainBounds({ ...MAIN_WINDOW_TARGET, x: 40, y: 60, isMaximized: true }, { x: 0, y: 0, width: 1440, height: 900 })).toEqual({
      ...MAIN_WINDOW_TARGET,
      x: 40,
      y: 60,
      isMaximized: true,
    });
  });
});

describe('spotlight focus lifecycle', () => {
  it('does not dismiss a blur during the show or hide transition', () => {
    expect(shouldDismissSpotlightOnBlur({ visible: true, focused: false, transitionUntil: 250 }, 100)).toBe(false);
    expect(shouldDismissSpotlightOnBlur({ visible: true, focused: false, transitionUntil: 250 }, 250)).toBe(true);
    expect(shouldDismissSpotlightOnBlur({ visible: true, focused: true, transitionUntil: 0 }, 300)).toBe(false);
  });
});

describe('measured spotlight layout', () => {
  it('uses finite content measurements and an accessory-specific cap', () => {
    const result = placeAdaptiveSurface({ x: 200, y: 100 }, { x: 0, y: 0, width: 800, height: 500 }, {
      preferredWidth: 1200,
      intrinsicHeight: 1000,
      accessory: 'suggestions',
    });
    expect(result.bounds).toEqual({ x: 16, y: 116, width: 420, height: 296 });
    expect(result.constrained).toEqual({ width: true, height: true });
    expect(result.growthDirection).toBe('below');
  });

  it('keeps the growth direction when the active side can still fit the surface', () => {
    const result = placeAdaptiveSurface({ x: 720, y: 700 }, { x: 0, y: 0, width: 1440, height: 900 }, {
      preferredWidth: 540,
      intrinsicHeight: 140,
      accessory: 'none',
      growthDirection: 'above',
    });
    expect(result.growthDirection).toBe('above');
    expect(result.bounds).toEqual({ x: 450, y: 544, width: 540, height: 140 });
  });

  it('clamps negative-display coordinates without accepting renderer coordinates', () => {
    const result = placeAdaptiveSurface({ x: -760, y: 260 }, { x: -1600, y: -100, width: 1600, height: 900 }, {
      preferredWidth: 680,
      intrinsicHeight: 560,
      accessory: 'preview',
    });
    expect(result.bounds.x).toBe(-1100);
    expect(result.bounds.y).toBe(224);
    expect(result.bounds.x + result.bounds.width).toBeLessThanOrEqual(0);
    expect(result.bounds.y + result.bounds.height).toBeLessThanOrEqual(784);
  });
});
