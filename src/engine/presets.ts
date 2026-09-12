import type { Catalog, ResolvedPreset } from '../shared/catalog-types';

export const resolvePreset = (presetId: string, catalog: Catalog): ResolvedPreset | undefined => {
  const entry = catalog.entryById[presetId];
  if (!entry || entry.kind !== 'preset') return undefined;
  const components = entry.componentEntryIds
    .map((componentId) => catalog.entryById[componentId])
    .filter((component): component is Extract<(typeof catalog.entries)[number], { kind: 'token' | 'pattern' }> => Boolean(component && component.kind !== 'preset'));
  const componentsText = components.map((component) => component.token).join(' ');
  const expandedText = components.map((component) => `${component.token} — ${component.direction}`).join('\n');
  const cautionIds = [...new Set([...(entry.cautionIds), ...components.flatMap((component) => component.cautionIds)])];
  return { preset: entry, components, componentsText, expandedText, cautionIds };
};
