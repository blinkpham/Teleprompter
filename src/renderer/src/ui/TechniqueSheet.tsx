import { Heart, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Caution, CheatsheetEntry, Technique } from '../../../shared/catalog-types';
import { CopyButton, type CopyOutcome } from './CopyButton';
import { PreviewDiagram } from './PreviewDiagram';

interface TechniqueSheetProps {
  readonly technique: Technique | undefined;
  readonly linkedEntries: readonly CheatsheetEntry[];
  readonly cautions: readonly Caution[];
  readonly isFavorite: boolean;
  readonly copy: (payload: string) => Promise<CopyOutcome>;
  readonly onClose: () => void;
  readonly onFavorite: (technique: Technique) => void;
}

export function TechniqueSheet({ technique, linkedEntries, cautions, isFavorite, copy, onClose, onFavorite }: TechniqueSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastId = useRef<string | undefined>(undefined);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (technique && technique.id !== lastId.current) {
      if (!dialog.open) dialog.showModal();
      lastId.current = technique.id;
    } else if (!technique && dialog.open) {
      dialog.close();
      lastId.current = undefined;
    }
  }, [technique]);
  return <dialog ref={dialogRef} className="technique-sheet" onCancel={(event) => { event.preventDefault(); onClose(); }} onClose={onClose}>
    {technique && <div className="sheet-frame">
      <header className="sheet-header"><div><p className="sheet-category">Technique detail</p><h2>{technique.title}</h2><p>{technique.summary}</p></div><div className="sheet-heading-actions"><button type="button" className={`sheet-favorite ${isFavorite ? 'is-favorite' : ''}`} aria-pressed={isFavorite} aria-label={`${isFavorite ? 'Remove' : 'Add'} ${technique.title} to favorites`} onClick={() => onFavorite(technique)}><Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} /></button><button type="button" className="icon-button" onClick={onClose} aria-label="Close technique detail"><X size={20} /></button></div></header>
      <div className="sheet-body"><PreviewDiagram technique={technique} /><section className="sheet-section"><div className="section-heading"><h3>Full prompt</h3><CopyButton payload={technique.prompt} actionLabel="Copy prompt" copy={copy} /></div><pre className="full-prompt">{technique.prompt}</pre></section><section className="sheet-section split-section"><div><h3>Shorthand</h3><pre className="shorthand-block">{technique.shorthandTemplate}</pre></div>{technique.example && <div><h3>Example</h3><p className="example-text">{technique.example}</p></div>}</section>{cautions.length > 0 && <section className="caution-stack" aria-label="Source notes">{cautions.map((caution) => <p key={caution.id}><strong>Source note</strong>{caution.text}</p>)}</section>}{linkedEntries.length > 0 && <section className="sheet-section"><h3>Related shorthand</h3><div className="related-list">{linkedEntries.map((entry) => <div className="related-row" key={entry.id}><code>{entry.token}</code><span>{entry.meaning}</span><CopyButton payload={entry.token} actionLabel="Copy" copy={copy} /></div>)}</div></section>}</div>
      <footer className="sheet-footer"><CopyButton payload={technique.prompt} actionLabel="Copy full prompt" copy={copy} /></footer>
    </div>}
  </dialog>;
}
