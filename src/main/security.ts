import { isAbsolute, relative, resolve } from 'node:path';

export const isPathInside = (root: string, candidate: string): boolean => {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  const child = relative(resolvedRoot, resolvedCandidate);
  return child === '' || (!child.startsWith('..') && !isAbsolute(child));
};

export const isPermittedRendererUrl = (value: string, developmentOrigin?: string): boolean => {
  try {
    const url = new URL(value);
    if (url.protocol === 'teleprompter:' && url.host === 'app' && !url.username && !url.password && !url.port) {
      return (url.pathname === '/' || url.pathname === '/index.html')
        && [...url.searchParams.keys()].every((key) => key === 'surface')
        && (url.searchParams.get('surface') === null || url.searchParams.get('surface') === 'main' || url.searchParams.get('surface') === 'spotlight');
    }
    if (!developmentOrigin) return false;
    return url.origin === developmentOrigin
      && (url.protocol === 'http:' || url.protocol === 'https:')
      && url.username === '' && url.password === '';
  } catch {
    return false;
  }
};

export const rendererContentSecurityPolicy = (): string => [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join('; ');
