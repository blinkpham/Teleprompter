import { describe, expect, it } from 'vitest';
import { createCueLayoutRequest, cueAccessory, cueTransition } from './cue-layout';

describe('Cue measured layout helpers', () => {
  it('maps the visible accessory to the shared layout contract', () => {
    expect(cueAccessory(null, false)).toBe('none');
    expect(cueAccessory('group', false)).toBe('parameters');
    expect(cueAccessory('output', false)).toBe('parameters');
    expect(cueAccessory(null, true)).toBe('preview');
  });

  it('chooses a bounded transition from the measured content height', () => {
    expect(cueTransition(undefined, 64)).toBe('immediate');
    expect(cueTransition(64, 220)).toBe('expand');
    expect(cueTransition(220, 64)).toBe('collapse');
    expect(cueTransition(220, 220.4)).toBe('immediate');
  });

  it('rounds and bounds renderer measurements before sending them to desktop', () => {
    expect(createCueLayoutRequest('cue-spotlight-1', 4, { width: 540.4, height: 64.6 }, 'none', 'expand')).toEqual({
      surfaceSessionId: 'cue-spotlight-1',
      layoutId: 4,
      preferredWidth: 540,
      intrinsicHeight: 65,
      accessory: 'none',
      transition: 'expand',
    });
    expect(createCueLayoutRequest('cue-spotlight-1', 5, { width: 2401, height: 0 }, 'preview', 'collapse')).toMatchObject({
      preferredWidth: 2000,
      intrinsicHeight: 1,
    });
  });
});
