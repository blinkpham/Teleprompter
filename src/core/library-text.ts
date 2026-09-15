import type {
  LibraryCopyTextRequest,
  LibraryTextResult,
  LibraryV2,
} from '../shared/teleprompter-types';
import { validateLibraryTextRequest } from '../shared/teleprompter-validation';
import { catalog, legacyOriginalFor } from '../content';

export type LibraryTextErrorCode = 'INVALID_INPUT' | 'UNAVAILABLE' | 'STALE_DRAFT';

export type LibraryTextResultWithError =
  | { readonly ok: true; readonly value: LibraryTextResult }
  | { readonly ok: false; readonly error: { readonly code: LibraryTextErrorCode; readonly message: string } };

type LibraryRecord = LibraryV2['atoms'][number]
  | LibraryV2['bundles'][number]
  | LibraryV2['presets'][number]
  | LibraryV2['editRecipes'][number];

const recordsFor = (library: LibraryV2): readonly LibraryRecord[] => [
  ...library.atoms,
  ...library.bundles,
  ...library.presets,
  ...library.editRecipes,
];

const originalTextFor = (library: LibraryV2, recordId: string): string | undefined => {
  const originals = library.legacyMap.flatMap((mapping) => {
    if (!mapping.targetIds.includes(recordId)) return [];
    const oldId = mapping.oldId.startsWith('technique-')
      ? mapping.oldId.slice('technique-'.length)
      : mapping.oldId;
    const kind = mapping.oldId.startsWith('technique-') ? 'technique' as const : 'entry' as const;
    return legacyOriginalFor(catalog, oldId, kind);
  });
  const original = originals[0];
  return original?.prompt ?? original?.direction ?? original?.meaning ?? original?.token;
};

/** Resolves exact accepted-record text without touching a clipboard or filesystem. */
export const resolveLibraryText = (
  library: LibraryV2,
  request: LibraryCopyTextRequest,
): LibraryTextResultWithError => {
  const validated = validateLibraryTextRequest(request);
  if (!validated.ok) return {
    ok: false,
    error: {
      code: 'INVALID_INPUT',
      message: validated.errors.map((error) => `${error.path}: ${error.message}`).join(' '),
    },
  };
  if (request.expectedContentVersion !== library.contentVersion) return {
    ok: false,
    error: { code: 'STALE_DRAFT', message: 'The library changed. Refresh before reading library text.' },
  };
  const record = recordsFor(library).find((candidate) => candidate.id === request.recordId);
  if (!record || record.status !== 'active') return {
    ok: false,
    error: { code: 'INVALID_INPUT', message: 'That library record is unavailable.' },
  };

  let text: string | undefined;
  if (request.format === 'original') {
    text = originalTextFor(library, request.recordId);
    if (!text) return {
      ok: false,
      error: { code: 'UNAVAILABLE', message: 'The original legacy text is not available for this record.' },
    };
  } else if (request.format === 'shorthand') {
    text = record.shorthand;
  } else if (record.kind === 'atom') {
    text = record.expansion;
  } else if (record.kind === 'bundle' || record.kind === 'preset') {
    text = record.atomIds
      .map((atomId) => library.atoms.find((atom) => atom.id === atomId)?.expansion)
      .filter((value): value is string => Boolean(value))
      .join('; ');
  } else {
    text = record.segments.map((segment) => 'text' in segment ? segment.text : `[${segment.placeholder}]`).join('');
  }

  return {
    ok: true,
    value: {
      recordId: request.recordId,
      format: request.format,
      contentVersion: library.contentVersion,
      text,
    },
  };
};
