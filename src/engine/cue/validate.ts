import {
  validateCueDraft as validateSharedDraft,
  validateLibrary as validateSharedLibrary,
} from '../../shared/teleprompter-validation';
import type { CueDraft, LibraryV2 } from '../../shared/teleprompter-types';

export const validateLibrary = validateSharedLibrary;
export const validateDraft = validateSharedDraft;

export const assertLibrary = (library: LibraryV2): LibraryV2 => {
  const result = validateSharedLibrary(library);
  if (!result.ok) throw new Error(result.errors.map((error) => `${error.path}: ${error.message}`).join('; '));
  return result.value;
};

export const assertDraft = (draft: CueDraft, library: LibraryV2): CueDraft => {
  const result = validateSharedDraft(draft, library);
  if (!result.ok) throw new Error(result.errors.map((error) => `${error.path}: ${error.message}`).join('; '));
  return result.value;
};

