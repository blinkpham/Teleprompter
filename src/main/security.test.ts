import { describe, expect, it } from 'vitest';
import { isPathInside, isPermittedRendererUrl, rendererContentSecurityPolicy } from './security';

describe('desktop security guards', () => {
  it('accepts only contained local assets', () => {
    expect(isPathInside('/app/out/renderer', '/app/out/renderer/assets/icon.png')).toBe(true);
    expect(isPathInside('/app/out/renderer', '/app/out/renderer-next/secret.txt')).toBe(false);
    expect(isPathInside('/app/out/renderer', '/app/out/renderer/../main/index.js')).toBe(false);
  });

  it('accepts the compatibility protocol and configured development origin only', () => {
    expect(isPermittedRendererUrl('image-director://app/index.html?surface=spotlight')).toBe(true);
    expect(isPermittedRendererUrl('image-director://app/index.html?path=../secret')).toBe(false);
    expect(isPermittedRendererUrl('http://127.0.0.1:5173/?surface=main', 'http://127.0.0.1:5173')).toBe(true);
    expect(isPermittedRendererUrl('https://example.com/', 'http://127.0.0.1:5173')).toBe(false);
  });

  it('keeps script policy strict while allowing local dynamic styles', () => {
    const csp = rendererContentSecurityPolicy();
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("connect-src 'none'");
    expect(csp).not.toContain('unsafe-eval');
  });
});
