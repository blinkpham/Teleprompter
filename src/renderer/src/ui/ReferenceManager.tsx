import { useEffect, useMemo, useRef, useState } from 'react';
import type { CueDraft, ReferenceRole } from '../../../shared/teleprompter';
import type { ReferenceSurfaceProps } from '../../../shared/ui-types';
import { referenceSlots, nextReferenceNumber, type ReferenceSlotView } from './reference-manager';
import { Check, ImageSquare, Plus, X } from './icons';

const ROLE_OPTIONS: readonly ReferenceRole['role'][] = ['base', 'identity', 'pose', 'product', 'style', 'palette', 'lighting', 'background', 'geometry', 'custom'];

const roleLabel = (role: ReferenceRole['role']): string => role.charAt(0).toUpperCase() + role.slice(1);

export function ReferenceManager({ draft, dispatch, references }: {
  readonly draft: CueDraft;
  readonly dispatch: (command: import('../../../shared/teleprompter').CueCommand) => Promise<import('../../../shared/teleprompter').CommandResult>;
  readonly references?: ReferenceSurfaceProps;
}) {
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [busyImage, setBusyImage] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const chooserRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const bindings = references?.snapshot?.bindings ?? [];
  const slots = useMemo(() => referenceSlots(draft, bindings), [bindings, draft]);
  const nextNumber = nextReferenceNumber(slots);
  const editMode = draft.id === 'edit';

  useEffect(() => {
    let active = true;
    const pending = bindings.filter((binding) => binding.thumbnailHandle && !thumbnailUrls[binding.thumbnailHandle]);
    if (!references || pending.length === 0) return () => { active = false; };
    void Promise.all(pending.map(async (binding) => {
      if (!binding.thumbnailHandle) return undefined;
      const result = await references.getThumbnail(binding.thumbnailHandle);
      return result.ok ? [binding.thumbnailHandle, result.dataUrl] as const : undefined;
    })).then((entries) => {
      if (!active) return;
      const additions = Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => Boolean(entry)));
      if (Object.keys(additions).length > 0) setThumbnailUrls((current) => ({ ...current, ...additions }));
    });
    return () => { active = false; };
  }, [bindings, references, thumbnailUrls]);

  if (!references) return null;

  const registerRole = (imageNumber: number, role: ReferenceRole['role'], note: string) => {
    const next = draft.references.filter((reference) => reference.imageNumber !== imageNumber);
    void dispatch({ type: 'set-reference-roles', references: [...next, { imageNumber, role, note }] });
  };

  const chooseImage = async (imageNumber: number) => {
    setBusyImage(imageNumber);
    setError(undefined);
    const result = await references.chooseImage(imageNumber);
    if (result.ok && !result.cancelled && result.selection) {
      const selection = result.selection;
      const saved = await references.upsert({
        bindingId: selection.bindingId,
        draftId: selection.draftId,
        imageNumber: selection.imageNumber,
        label: selection.suggestedLabel,
        thumbnailHandle: selection.thumbnailHandle,
      });
      if (saved.ok) {
        const currentRole = draft.references.find((reference) => reference.imageNumber === imageNumber);
        if (editMode && !currentRole) {
          const fallbackRole: ReferenceRole['role'] = draft.references.some((reference) => reference.role === 'base') ? 'style' : 'base';
          registerRole(imageNumber, fallbackRole, selection.suggestedLabel);
        }
      } else {
        setError(saved.error.message);
      }
    } else if (!result.ok) {
      setError(result.error.message);
    }
    setBusyImage(null);
    window.requestAnimationFrame(() => chooserRefs.current[imageNumber]?.focus());
  };

  const removeSlot = async (slot: ReferenceSlotView) => {
    setBusyImage(slot.imageNumber);
    setError(undefined);
    if (slot.binding) {
      const result = await references.remove(slot.binding);
      if (!result.ok) setError(result.error.message);
    }
    if (editMode && slot.role) void dispatch({ type: 'set-reference-roles', references: draft.references.filter((reference) => reference.imageNumber !== slot.imageNumber) });
    setBusyImage(null);
    window.requestAnimationFrame(() => chooserRefs.current[slot.imageNumber]?.focus());
  };

  return <section className="tp-reference-manager" aria-labelledby="tp-reference-title">
    <header className="tp-reference-header">
      <div><h2 id="tp-reference-title">References</h2><p>{editMode ? 'Bind local images to numbered references for @ mentions.' : 'Local image bindings are ready for Edit mode.'}</p></div>
      <button type="button" className="tp-add-chip" disabled={nextNumber > 20 || busyImage !== null} onClick={() => void chooseImage(nextNumber)}><Plus size={15} weight="bold" />Add image</button>
    </header>
    {references.loading && <p className="tp-reference-status" role="status">Loading local references…</p>}
    {references.error && <p className="tp-inline-error" role="alert">{references.error}</p>}
    {error && <p className="tp-inline-error" role="alert">{error}</p>}
    {slots.length === 0 && !references.loading && <p className="tp-reference-empty">{editMode ? 'No images bound yet. Add one to enable @Image 1 suggestions.' : 'Switch to Edit to register image roles and use @ mentions.'}</p>}
    {slots.length > 0 && <div className="tp-reference-list">{slots.map((slot) => {
      const binding = slot.binding;
      const thumbnail = binding?.thumbnailHandle ? thumbnailUrls[binding.thumbnailHandle] : undefined;
      const role = slot.role;
      return <article className={`tp-reference-row${binding ? '' : ' is-unbound'}`} key={slot.imageNumber}>
        <div className="tp-reference-thumb" aria-hidden="true">{thumbnail ? <img src={thumbnail} alt="" /> : <ImageSquare size={21} weight="duotone" />}</div>
        <div className="tp-reference-main">
          <div className="tp-reference-title-row"><strong>Image {slot.imageNumber}</strong><span>{binding?.label ?? (slot.mentioned ? 'Mentioned, choose an image' : 'Unbound')}</span></div>
          <div className="tp-reference-fields">
            <label><span>Role</span><select aria-label={`Role for Image ${slot.imageNumber}`} value={role?.role ?? ''} disabled={!editMode} onChange={(event) => registerRole(slot.imageNumber, event.target.value as ReferenceRole['role'], role?.note ?? binding?.label ?? '')}><option value="" disabled>{editMode ? 'Choose role' : 'Edit mode only'}</option>{ROLE_OPTIONS.map((option) => <option key={option} value={option}>{roleLabel(option)}</option>)}</select></label>
            <label><span>Note</span><input aria-label={`Note for Image ${slot.imageNumber}`} value={role?.note ?? ''} placeholder="What this image controls" onChange={(event) => { if (role) registerRole(slot.imageNumber, role.role, event.target.value); }} disabled={!editMode || !role} /></label>
          </div>
        </div>
        <div className="tp-reference-actions">
          <button ref={(element) => { chooserRefs.current[slot.imageNumber] = element; }} type="button" className="tp-secondary-action" disabled={busyImage !== null} onClick={() => void chooseImage(slot.imageNumber)}>{busyImage === slot.imageNumber ? 'Choosing…' : binding ? 'Rebind' : 'Choose image'}</button>
          {(binding || role) && <button type="button" className="tp-icon-button" aria-label={`Remove Image ${slot.imageNumber}`} data-tooltip="Remove" disabled={busyImage !== null} onClick={() => void removeSlot(slot)}>{binding && role ? <Check size={17} weight="bold" /> : <X size={17} weight="bold" />}</button>}
        </div>
      </article>;
    })}</div>}
  </section>;
}
