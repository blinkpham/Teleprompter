import { describe, expect, it } from 'vitest';
import {
  decodeNativeBridgeFrame,
  isNativeBridgeEnvelope,
  nativeBridgeGoldenFixtures,
  NATIVE_BRIDGE_MAX_FRAME_BYTES,
} from './native-bridge';

describe('native bridge wire contract', () => {
  it('accepts the published hello and exact-preview golden frames', () => {
    for (const fixture of nativeBridgeGoldenFixtures) {
      expect(isNativeBridgeEnvelope(JSON.parse(fixture.request))).toBe(true);
      expect(isNativeBridgeEnvelope(JSON.parse(fixture.response))).toBe(true);
      expect(decodeNativeBridgeFrame(new TextEncoder().encode(fixture.request)).kind).toBe('request');
      expect(decodeNativeBridgeFrame(new TextEncoder().encode(fixture.response)).kind).toBe('response');
    }
  });

  it('requires an initial empty helper session only for hello', () => {
    const hello = JSON.parse(nativeBridgeGoldenFixtures[0]!.request) as Record<string, unknown>;
    hello.helperSessionId = 'stale-session';
    expect(isNativeBridgeEnvelope(hello)).toBe(false);

    const preview = JSON.parse(nativeBridgeGoldenFixtures[1]!.request) as Record<string, unknown>;
    preview.helperSessionId = '';
    expect(isNativeBridgeEnvelope(preview)).toBe(false);
  });

  it('keeps the outer preview request ID equal to the nested request ID', () => {
    const preview = JSON.parse(nativeBridgeGoldenFixtures[1]!.request) as {
      requestId: string;
      payload: { request: { requestId: string } };
    };
    preview.payload.request.requestId = 'different-request';
    expect(isNativeBridgeEnvelope(preview)).toBe(false);
  });

  it('rejects successful responses without payloads and oversized frames before parsing', () => {
    const response = JSON.parse(nativeBridgeGoldenFixtures[0]!.response) as Record<string, unknown>;
    delete response.payload;
    expect(isNativeBridgeEnvelope(response)).toBe(false);

    expect(() => decodeNativeBridgeFrame(new Uint8Array(NATIVE_BRIDGE_MAX_FRAME_BYTES + 1))).toThrow(/byte limit/);
  });
});
