export { catalog, categories, cautions, entries, families, resolutionExamples, shorthandEntries, techniques, techniqueIds } from './catalog';
export {
  adaptLegacyCatalog,
  ACCEPTED_SEED_ATOM_IDS,
  ACCEPTED_SEED_PRESET_IDS,
  ACCEPTED_SEED_RECIPE_IDS,
  adapterAxes,
  adapterCautions,
  adapterSources,
  legacyMappingSummaryFor,
  legacyOriginalFor,
  legacyOriginalsFor,
} from './legacy-adapter';

import { catalog } from './catalog';
import { adaptLegacyCatalog } from './legacy-adapter';

/** Validated, pure V2 projection used by the Cue engine and both surfaces. */
export const legacyLibrary = adaptLegacyCatalog(catalog);
