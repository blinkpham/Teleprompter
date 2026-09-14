import type { SurfaceAccessory, SurfaceLayoutRequest, SurfaceLayoutTransition } from '../../../shared/teleprompter';

export type CuePickerKind = 'group' | 'constraints' | 'output' | 'preset' | 'recipes' | null;

export interface CueLayoutMeasurement {
  readonly width: number;
  readonly height: number;
}

const MAX_DIMENSION = 2000;

const boundedDip = (value: number): number => Math.max(1, Math.min(MAX_DIMENSION, Math.round(value)));

export function cueAccessory(picker: CuePickerKind, previewOpen: boolean): SurfaceAccessory {
  if (previewOpen) return 'preview';
  if (picker) return 'parameters';
  return 'none';
}

export function cueTransition(previousHeight: number | undefined, nextHeight: number): SurfaceLayoutTransition {
  if (previousHeight === undefined || Math.abs(previousHeight - nextHeight) < 1) return 'immediate';
  return nextHeight > previousHeight ? 'expand' : 'collapse';
}

export function createCueLayoutRequest(
  sessionId: string,
  layoutId: number,
  measurement: CueLayoutMeasurement,
  accessory: SurfaceAccessory,
  transition: SurfaceLayoutTransition,
): SurfaceLayoutRequest {
  return {
    surfaceSessionId: sessionId,
    layoutId,
    preferredWidth: boundedDip(measurement.width),
    intrinsicHeight: boundedDip(measurement.height),
    accessory,
    transition,
  };
}
