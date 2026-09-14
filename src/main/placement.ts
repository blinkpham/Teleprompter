export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

export interface WorkArea {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface SpotlightBounds extends WorkArea {}
export type SpotlightSize = 'compact' | 'expanded';
export type SurfaceGrowthDirection = 'above' | 'below';

export interface AdaptiveSurfaceRequest {
  readonly preferredWidth: number;
  readonly intrinsicHeight: number;
  readonly accessory: 'none' | 'parameters' | 'suggestions' | 'references' | 'preview';
  readonly growthDirection?: SurfaceGrowthDirection;
}

export interface AdaptiveSurfaceLayout {
  readonly bounds: SpotlightBounds;
  readonly constrained: Readonly<{ width: boolean; height: boolean }>;
  readonly growthDirection: SurfaceGrowthDirection;
}

export const MAIN_WINDOW_TARGET = Object.freeze({ width: 1180, height: 820 });
export const MAIN_WINDOW_MINIMUM = Object.freeze({ width: 720, height: 560 });
export const SPOTLIGHT_MARGIN = 16;
export const SPOTLIGHT_MIN_WIDTH = 400;
export const SPOTLIGHT_COMPACT_BOUNDS = Object.freeze({ width: 660, height: 364 });
export const SPOTLIGHT_EXPANDED_BOUNDS = Object.freeze({ width: 660, height: 620 });
export const SPOTLIGHT_BOUNDS: Readonly<Record<SpotlightSize, { readonly width: number; readonly height: number }>> = {
  compact: SPOTLIGHT_COMPACT_BOUNDS,
  expanded: SPOTLIGHT_EXPANDED_BOUNDS,
};

/** Construction caps for the measured reset path. These are not renderer sizes. */
export const SURFACE_LAYOUT_CAPS: Readonly<Record<AdaptiveSurfaceRequest['accessory'], {
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly maxHeight: number;
}>> = {
  none: { minWidth: 360, maxWidth: 640, maxHeight: 180 },
  parameters: { minWidth: 360, maxWidth: 640, maxHeight: 420 },
  suggestions: { minWidth: 300, maxWidth: 420, maxHeight: 296 },
  references: { minWidth: 300, maxWidth: 420, maxHeight: 360 },
  preview: { minWidth: 540, maxWidth: 680, maxHeight: 560 },
};

export const SURFACE_LAYOUT_MARGIN = 16;
export const SURFACE_LAYOUT_MIN_HEIGHT = 64;

const clamp = (value: number, minimum: number, maximum: number): number => {
  if (maximum < minimum) return minimum;
  return Math.min(Math.max(value, minimum), maximum);
};

const fit = (target: number, available: number, minimum = 1): number => {
  const safeAvailable = Math.max(1, available);
  return Math.max(Math.min(minimum, safeAvailable), Math.min(target, safeAvailable));
};

/**
 * Places a spotlight using DIP coordinates. Electron's screen API already
 * reports DIP values; the scale factor is intentionally not part of this API.
 */
export const placeSpotlight = (
  cursor: ScreenPoint,
  workArea: WorkArea,
  size: SpotlightSize = 'compact',
): SpotlightBounds => {
  const availableWidth = Math.max(1, workArea.width - SPOTLIGHT_MARGIN * 2);
  const availableHeight = Math.max(1, workArea.height - SPOTLIGHT_MARGIN * 2);
  const target = SPOTLIGHT_BOUNDS[size];
  const width = fit(target.width, availableWidth, SPOTLIGHT_MIN_WIDTH);
  const height = fit(target.height, availableHeight);
  const minX = workArea.x + SPOTLIGHT_MARGIN;
  const maxX = workArea.x + workArea.width - SPOTLIGHT_MARGIN - width;
  const minY = workArea.y + SPOTLIGHT_MARGIN;
  const maxY = workArea.y + workArea.height - SPOTLIGHT_MARGIN - height;
  const centeredX = cursor.x - width / 2;
  const below = cursor.y + SPOTLIGHT_MARGIN;
  const above = cursor.y - SPOTLIGHT_MARGIN - height;
  const y = below + height <= workArea.y + workArea.height - SPOTLIGHT_MARGIN ? below : above;
  return {
    x: Math.round(clamp(centeredX, minX, maxX)),
    y: Math.round(clamp(y, minY, maxY)),
    width: Math.round(width),
    height: Math.round(height),
  };
};

export const resizeSpotlight = (
  cursor: ScreenPoint,
  workArea: WorkArea,
  size: SpotlightSize,
): SpotlightBounds => placeSpotlight(cursor, workArea, size);

const safeDimension = (value: number, fallback: number): number => Number.isFinite(value) && value > 0 ? value : fallback;

const availableGrowth = (cursor: ScreenPoint, workArea: WorkArea, direction: SurfaceGrowthDirection): number => direction === 'below'
  ? workArea.y + workArea.height - SURFACE_LAYOUT_MARGIN - cursor.y - SURFACE_LAYOUT_MARGIN
  : cursor.y - workArea.y - SURFACE_LAYOUT_MARGIN;

const chooseGrowthDirection = (
  cursor: ScreenPoint,
  workArea: WorkArea,
  height: number,
  requested: SurfaceGrowthDirection | undefined,
): SurfaceGrowthDirection => {
  const below = Math.max(0, availableGrowth(cursor, workArea, 'below'));
  const above = Math.max(0, availableGrowth(cursor, workArea, 'above'));
  if (requested && Math.max(SURFACE_LAYOUT_MIN_HEIGHT, height) <= (requested === 'below' ? below : above)) return requested;
  if (height <= below) return 'below';
  if (height <= above) return 'above';
  return below >= above ? 'below' : 'above';
};

/**
 * Computes measured spotlight bounds from renderer content measurements.
 * Coordinates remain native-owned: the renderer contributes only width/height.
 */
export const placeAdaptiveSurface = (
  cursor: ScreenPoint,
  workArea: WorkArea,
  request: AdaptiveSurfaceRequest,
): AdaptiveSurfaceLayout => {
  const caps = SURFACE_LAYOUT_CAPS[request.accessory];
  const availableWidth = Math.max(1, workArea.width - SURFACE_LAYOUT_MARGIN * 2);
  const availableHeight = Math.max(1, workArea.height - SURFACE_LAYOUT_MARGIN * 2);
  const maxWidth = Math.min(caps.maxWidth, availableWidth);
  const minWidth = Math.min(caps.minWidth, maxWidth);
  const preferredWidth = safeDimension(request.preferredWidth, minWidth);
  const intrinsicHeight = safeDimension(request.intrinsicHeight, SURFACE_LAYOUT_MIN_HEIGHT);
  const width = clamp(Math.round(preferredWidth), minWidth, maxWidth);
  const maxHeight = Math.min(caps.maxHeight, availableHeight);
  const minHeight = Math.min(SURFACE_LAYOUT_MIN_HEIGHT, maxHeight);
  const height = clamp(Math.round(intrinsicHeight), minHeight, maxHeight);
  const growthDirection = chooseGrowthDirection(cursor, workArea, height, request.growthDirection);
  const centeredX = cursor.x - width / 2;
  const minX = workArea.x + SURFACE_LAYOUT_MARGIN;
  const maxX = workArea.x + workArea.width - SURFACE_LAYOUT_MARGIN - width;
  const unclampedY = growthDirection === 'below'
    ? cursor.y + SURFACE_LAYOUT_MARGIN
    : cursor.y - SURFACE_LAYOUT_MARGIN - height;
  const minY = workArea.y + SURFACE_LAYOUT_MARGIN;
  const maxY = workArea.y + workArea.height - SURFACE_LAYOUT_MARGIN - height;
  return {
    bounds: {
      x: Math.round(clamp(centeredX, minX, maxX)),
      y: Math.round(clamp(unclampedY, minY, maxY)),
      width,
      height,
    },
    constrained: {
      width: Math.round(preferredWidth) !== width,
      height: Math.round(intrinsicHeight) !== height,
    },
    growthDirection,
  };
};

export const clampMainBounds = (
  bounds: { readonly width: number; readonly height: number; readonly x?: number; readonly y?: number; readonly isMaximized?: boolean },
  workArea: WorkArea,
  minimum = MAIN_WINDOW_MINIMUM,
): { width: number; height: number; x: number; y: number; isMaximized: boolean } => {
  const usableMinimumWidth = Math.min(minimum.width, workArea.width);
  const usableMinimumHeight = Math.min(minimum.height, workArea.height);
  const width = Math.min(Math.max(Math.round(bounds.width), usableMinimumWidth), workArea.width);
  const height = Math.min(Math.max(Math.round(bounds.height), usableMinimumHeight), workArea.height);
  const minX = workArea.x;
  const minY = workArea.y;
  const maxX = workArea.x + workArea.width - width;
  const maxY = workArea.y + workArea.height - height;
  return {
    width,
    height,
    x: Math.round(clamp(bounds.x ?? workArea.x + (workArea.width - width) / 2, minX, maxX)),
    y: Math.round(clamp(bounds.y ?? workArea.y + (workArea.height - height) / 2, minY, maxY)),
    isMaximized: bounds.isMaximized === true,
  };
};

export const shouldDismissSpotlightOnBlur = (
  state: { readonly visible: boolean; readonly focused: boolean; readonly transitionUntil: number },
  now: number,
): boolean => state.visible && !state.focused && now >= state.transitionUntil;
